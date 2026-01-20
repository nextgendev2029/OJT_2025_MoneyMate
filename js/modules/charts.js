// Chart Manager - Handles chart rendering using Canvas API
export class ChartManager {
    constructor() {
        // Soft pastel colors - gentle and easy on the eyes
        this.colors = [
            '#FFB6C1', // Pastel Pink - romance and sentimentality
            '#89CFF0', // Baby Blue - tranquility and airy feel
            '#98FF98', // Mint Green - fresh, nature, easy on eyes
            '#FFB347', // Pastel Orange - warm and visible
            '#E6E6FA', // Lavender - calming and sophisticated
            '#FFDAB9', // Light Peach - warm and inviting
            '#D3D3D3', // Soft Gray - elegant and neutral
            '#93E9BE'  // Seafoam Green - soothing coastal vibe
        ];

        // Store chart data for interactivity
        this.pieChartData = null;
        this.lineChartData = null;
        this.hoveredSlice = -1;
        this.hoveredPoint = -1;

        // Animation settings
        this.animationDuration = 1000; // 1 second
        this.animationProgress = 0;
        this.isAnimating = false;
    }

    // Easing function for smooth animations
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    isDarkTheme() {
        return document.documentElement.getAttribute('data-theme') === 'dark';
    }

    getTextColor() {
        return this.isDarkTheme() ? '#e5e7eb' : '#374151';
    }

    getAxisColor() {
        return this.isDarkTheme() ? '#4b5563' : '#e5e7eb';
    }

    getSecondaryTextColor() {
        return this.isDarkTheme() ? '#9ca3af' : '#6b7280';
    }

    renderPieChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.parentElement.clientWidth;
        const height = 350;
        canvas.width = width;
        canvas.height = height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        const entries = Object.entries(data);
        if (entries.length === 0) {
            ctx.fillStyle = this.getSecondaryTextColor();
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No expense data available', width / 2, height / 2);
            return;
        }

        // Store data for interactivity
        this.pieChartData = {
            canvas,
            entries,
            centerX: width / 2,
            centerY: height / 2 - 20,
            radius: Math.min(width, height) / 3.5
        };

        const total = entries.reduce((sum, [, value]) => sum + value, 0);
        const { centerX, centerY, radius } = this.pieChartData;

        // Direct render - NO ANIMATION
        let currentAngle = -Math.PI / 2;
        const slices = [];

        entries.forEach(([category, value], index) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            const isHovered = this.hoveredSlice === index;
            const sliceRadius = isHovered ? radius + 10 : radius;

            slices.push({
                category,
                value,
                startAngle: currentAngle,
                endAngle: currentAngle + sliceAngle,
                color: this.colors[index % this.colors.length],
                index
            });

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, sliceRadius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = this.colors[index % this.colors.length];
            ctx.fill();

            ctx.beginPath();
            ctx.arc(centerX, centerY, sliceRadius, currentAngle, currentAngle + sliceAngle);
            ctx.strokeStyle = this.isDarkTheme() ? '#1f2937' : '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            currentAngle += sliceAngle;
        });

        this.pieChartData.slices = slices;
        this.drawPieChartLabels(ctx, entries, total, centerX, centerY, radius);

        // Add hover interaction
        this.addPieChartInteraction(canvas);
    }

    drawPieChartLabels(ctx, entries, total, centerX, centerY, radius) {
        let currentAngle = -Math.PI / 2;

        entries.forEach(([category, value], index) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            const percentage = ((value / total) * 100).toFixed(1);

            // Calculate label position
            const labelAngle = currentAngle + sliceAngle / 2;
            const lineStartX = centerX + Math.cos(labelAngle) * (radius + 5);
            const lineStartY = centerY + Math.sin(labelAngle) * (radius + 5);
            const lineEndX = centerX + Math.cos(labelAngle) * (radius + 30);
            const lineEndY = centerY + Math.sin(labelAngle) * (radius + 30);

            // Determine label side
            const isRightSide = labelAngle > -Math.PI / 2 && labelAngle < Math.PI / 2;
            const labelX = isRightSide ? lineEndX + 5 : lineEndX - 5;
            const labelY = lineEndY;

            // Draw connecting line
            ctx.strokeStyle = this.getTextColor();
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(lineStartX, lineStartY);
            ctx.lineTo(lineEndX, lineEndY);
            ctx.stroke();

            // Draw label with color indicator
            ctx.fillStyle = this.colors[index % this.colors.length];
            ctx.beginPath();
            ctx.arc(lineEndX, lineEndY, 4, 0, 2 * Math.PI);
            ctx.fill();

            // Draw text
            ctx.fillStyle = this.getTextColor();
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = isRightSide ? 'left' : 'right';
            ctx.fillText(
                `${category.replace('-', ' ')}`,
                labelX,
                labelY - 5
            );

            ctx.font = '11px sans-serif';
            ctx.fillStyle = this.getSecondaryTextColor();
            ctx.fillText(
                `₹${value.toFixed(0)} (${percentage}%)`,
                labelX,
                labelY + 8
            );

            currentAngle += sliceAngle;
        });
    }

    addPieChartInteraction(canvas) {
        // Remove old listeners first to prevent duplicates
        if (canvas._mouseMove) {
            canvas.removeEventListener('mousemove', canvas._mouseMove);
        }
        if (canvas._mouseLeave) {
            canvas.removeEventListener('mouseleave', canvas._mouseLeave);
        }

        canvas.style.cursor = 'default';

        const handleMouseMove = (e) => {
            if (!this.pieChartData) return;

            const rect = canvas.getBoundingClientRect();
            // Fix: Scale mouse coordinates to match canvas internal coordinates
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            const { centerX, centerY, slices } = this.pieChartData;
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            let hoveredIndex = -1;

            if (distance <= this.pieChartData.radius + 10) {
                slices.forEach((slice) => {
                    let checkAngle = angle;
                    if (checkAngle < -Math.PI / 2) checkAngle += 2 * Math.PI;

                    let startAngle = slice.startAngle;
                    let endAngle = slice.endAngle;
                    if (startAngle < -Math.PI / 2) startAngle += 2 * Math.PI;
                    if (endAngle < -Math.PI / 2) endAngle += 2 * Math.PI;

                    if (checkAngle >= startAngle && checkAngle <= endAngle) {
                        hoveredIndex = slice.index;
                    }
                });
            }

            if (hoveredIndex !== this.hoveredSlice) {
                this.hoveredSlice = hoveredIndex;
                this.renderPieChart('category-chart',
                    Object.fromEntries(this.pieChartData.entries));
            }
        };

        const handleMouseLeave = () => {
            if (this.hoveredSlice !== -1) {
                this.hoveredSlice = -1;
                this.renderPieChart('category-chart',
                    Object.fromEntries(this.pieChartData.entries));
            }
        };

        // Store handlers for cleanup
        canvas._mouseMove = handleMouseMove;
        canvas._mouseLeave = handleMouseLeave;

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);
    }

    renderLineChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.parentElement.clientWidth;
        const height = 300;
        canvas.width = width;
        canvas.height = height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (data.length === 0) {
            ctx.fillStyle = this.getSecondaryTextColor();
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No trend data available', width / 2, height / 2);
            return;
        }

        const padding = 50;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        const maxAmount = Math.max(...data.map(d => d.amount), 100);
        const stepX = chartWidth / (data.length - 1 || 1);

        // Store data for interactivity
        this.lineChartData = {
            canvas,
            data,
            padding,
            chartWidth,
            chartHeight,
            maxAmount,
            stepX,
            points: []
        };

        // Draw grid lines
        ctx.strokeStyle = this.getAxisColor();
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = height - padding - (i / 4) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // Draw axes
        ctx.strokeStyle = this.getAxisColor();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Draw gradient area under line
        const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        data.forEach((point, index) => {
            const x = padding + index * stepX;
            const y = height - padding - (point.amount / maxAmount) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, height - padding);
                ctx.lineTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.lineTo(padding + (data.length - 1) * stepX, height - padding);
        ctx.closePath();
        ctx.fill();

        // Draw line
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.beginPath();

        data.forEach((point, index) => {
            const x = padding + index * stepX;
            const y = height - padding - (point.amount / maxAmount) * chartHeight;

            this.lineChartData.points.push({ x, y, data: point, index });

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw points and labels
        data.forEach((point, index) => {
            const x = padding + index * stepX;
            const y = height - padding - (point.amount / maxAmount) * chartHeight;

            const isHovered = this.hoveredPoint === index;

            // Point with hover effect
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, isHovered ? 8 : 5, 0, 2 * Math.PI);
            ctx.fill();

            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = isHovered ? 3 : 2;
            ctx.stroke();

            // Show tooltip on hover
            if (isHovered) {
                const tooltipWidth = 120;
                const tooltipHeight = 50;
                const tooltipPadding = 15;

                // Smart positioning: show below if point is in top 30% of chart, otherwise show above
                const isTopPoint = y < (padding + chartHeight * 0.3);

                let tooltipX = x - tooltipWidth / 2;
                let tooltipY = isTopPoint ? y + tooltipPadding : y - tooltipHeight - tooltipPadding;

                // Ensure tooltip doesn't go off left/right edges
                if (tooltipX < padding) {
                    tooltipX = padding;
                } else if (tooltipX + tooltipWidth > width - padding) {
                    tooltipX = width - padding - tooltipWidth;
                }

                // Ensure tooltip doesn't go off top/bottom edges
                if (tooltipY < padding) {
                    tooltipY = y + tooltipPadding; // Force below if too high
                } else if (tooltipY + tooltipHeight > height - padding) {
                    tooltipY = height - padding - tooltipHeight; // Force above if too low
                }

                // Tooltip background (using rect instead of roundRect for compatibility)
                ctx.fillStyle = this.isDarkTheme() ? '#1f2937' : '#ffffff';
                ctx.strokeStyle = '#6366f1';
                ctx.lineWidth = 2;
                ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
                ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

                // Tooltip text
                ctx.fillStyle = this.getTextColor();
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                const date = new Date(point.date);
                ctx.fillText(
                    `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`,
                    tooltipX + tooltipWidth / 2,
                    tooltipY + 20
                );

                ctx.font = '14px sans-serif';
                ctx.fillStyle = '#6366f1';
                ctx.fillText(
                    `₹${point.amount.toFixed(2)}`,
                    tooltipX + tooltipWidth / 2,
                    tooltipY + 38
                );
            }

            // Date label
            ctx.fillStyle = this.getSecondaryTextColor();
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            const date = new Date(point.date);
            ctx.fillText(
                `${date.getDate()}/${date.getMonth() + 1}`,
                x,
                height - padding + 15
            );
        });

        // Y-axis labels
        ctx.fillStyle = this.getTextColor();
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const value = (maxAmount / 4) * i;
            const y = height - padding - (i / 4) * chartHeight;
            ctx.fillText(`₹${value.toFixed(0)}`, padding - 10, y + 4);
        }

        // Add interaction
        this.addLineChartInteraction(canvas);
    }

    addLineChartInteraction(canvas) {
        // Remove old listeners first to prevent duplicates
        if (canvas._mouseMove) {
            canvas.removeEventListener('mousemove', canvas._mouseMove);
        }
        if (canvas._mouseLeave) {
            canvas.removeEventListener('mouseleave', canvas._mouseLeave);
        }

        canvas.style.cursor = 'default';

        const handleMouseMove = (e) => {
            if (!this.lineChartData) return;

            const rect = canvas.getBoundingClientRect();
            // Fix: Scale mouse coordinates to match canvas internal coordinates
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            let hoveredIndex = -1;

            this.lineChartData.points.forEach((point) => {
                const distance = Math.sqrt(
                    Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2)
                );

                if (distance <= 10) {
                    hoveredIndex = point.index;
                }
            });

            if (hoveredIndex !== this.hoveredPoint) {
                this.hoveredPoint = hoveredIndex;
                this.renderLineChart('trend-chart', this.lineChartData.data);
            }
        };

        const handleMouseLeave = () => {
            if (this.hoveredPoint !== -1) {
                this.hoveredPoint = -1;
                this.renderLineChart('trend-chart', this.lineChartData.data);
            }
        };

        // Store handlers for cleanup
        canvas._mouseMove = handleMouseMove;
        canvas._mouseLeave = handleMouseLeave;

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);
    }

    renderDoubleBarChart(canvasId, budgetData, spendingData) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.parentElement.clientWidth;
        const height = 350;
        canvas.width = width;
        canvas.height = height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Get all categories (union of budget and spending categories)
        const allCategories = new Set([
            ...Object.keys(budgetData),
            ...Object.keys(spendingData)
        ]);

        if (allCategories.size === 0) {
            // No data to display
            ctx.fillStyle = this.getSecondaryTextColor();
            ctx.font = '16px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No budget data available', width / 2, height / 2);
            return;
        }

        const categories = Array.from(allCategories);
        const padding = 80; // Increased padding for better spacing
        const topPadding = 40; // Space for title only
        const bottomPadding = 80; // Extra space for legend at bottom
        const chartWidth = width - padding * 2;
        const chartHeight = height - topPadding - bottomPadding;

        // Calculate max value for scaling
        const maxBudget = Math.max(...categories.map(cat => budgetData[cat] || 0));
        const maxSpending = Math.max(...categories.map(cat => spendingData[cat] || 0));
        const maxValue = Math.max(maxBudget, maxSpending);

        if (maxValue === 0) {
            ctx.fillStyle = this.getSecondaryTextColor();
            ctx.font = '16px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No budget or spending data', width / 2, height / 2);
            return;
        }

        // Calculate bar dimensions with better spacing
        const barGroupWidth = chartWidth / categories.length;
        const barWidth = Math.min(barGroupWidth * 0.32, 50); // Each bar width - increased max width
        const barSpacing = barWidth * 0.3; // Increased space between bars in a group

        // Draw axes (exactly like spending trend chart)
        ctx.strokeStyle = this.getAxisColor();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, topPadding);
        ctx.lineTo(padding, height - bottomPadding);
        ctx.lineTo(width - padding, height - bottomPadding);
        ctx.stroke();

        // Draw grid lines (exactly like spending trend chart)
        ctx.strokeStyle = this.getAxisColor();
        ctx.lineWidth = 1;
        const ySteps = 5;
        for (let i = 0; i <= ySteps; i++) {
            const y = height - bottomPadding - (i * chartHeight / ySteps);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // Y-axis labels (exactly like spending trend chart)
        ctx.fillStyle = this.getTextColor();
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        const yStepValue = maxValue / ySteps;
        for (let i = 0; i <= ySteps; i++) {
            const value = i * yStepValue;
            const y = height - bottomPadding - (i * chartHeight / ySteps);
            ctx.fillText(`₹${this.formatNumber(value)}`, padding - 10, y + 4);
        }

        // Draw bars and labels
        categories.forEach((category, index) => {
            const budgetAmount = budgetData[category] || 0;
            const spendingAmount = spendingData[category] || 0;

            const x = padding + (index * barGroupWidth) + (barGroupWidth - (barWidth * 2 + barSpacing)) / 2;

            // Calculate bar heights
            const budgetHeight = (budgetAmount / maxValue) * chartHeight;
            const spendingHeight = (spendingAmount / maxValue) * chartHeight;

            // Budget bar (left bar in group) - Improved colors for theme
            const budgetX = x;
            const budgetY = height - bottomPadding - budgetHeight;

            // Budget bar with theme-aware colors
            if (this.isDarkTheme()) {
                ctx.fillStyle = '#60A5FA'; // Lighter blue for dark theme
            } else {
                ctx.fillStyle = '#3B82F6'; // Standard blue for light theme
            }
            ctx.fillRect(budgetX, budgetY, barWidth, budgetHeight);

            // Budget bar border with better contrast
            ctx.strokeStyle = this.isDarkTheme() ? '#93C5FD' : '#1D4ED8';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(budgetX, budgetY, barWidth, budgetHeight);

            // Spending bar (right bar in group)
            const spendingX = x + barWidth + barSpacing;
            const spendingY = height - bottomPadding - spendingHeight;

            // Color based on budget vs spending with theme support
            if (spendingAmount > budgetAmount) {
                ctx.fillStyle = this.isDarkTheme() ? '#F87171' : '#EF4444'; // Red if over budget
            } else if (spendingAmount > budgetAmount * 0.8) {
                ctx.fillStyle = this.isDarkTheme() ? '#FBBF24' : '#F59E0B'; // Orange if close to budget
            } else {
                ctx.fillStyle = this.isDarkTheme() ? '#34D399' : '#10B981'; // Green if under budget
            }

            ctx.fillRect(spendingX, spendingY, barWidth, spendingHeight);

            // Spending bar border with better contrast
            if (spendingAmount > budgetAmount) {
                ctx.strokeStyle = this.isDarkTheme() ? '#DC2626' : '#B91C1C';
            } else if (spendingAmount > budgetAmount * 0.8) {
                ctx.strokeStyle = this.isDarkTheme() ? '#D97706' : '#B45309';
            } else {
                ctx.strokeStyle = this.isDarkTheme() ? '#059669' : '#047857';
            }
            ctx.lineWidth = 1.5;
            ctx.strokeRect(spendingX, spendingY, barWidth, spendingHeight);

            // Category label (straight, no rotation)
            ctx.fillStyle = this.getTextColor();
            ctx.font = '11px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';

            const labelX = x + barWidth + barSpacing / 2;
            const labelY = height - bottomPadding + 20;

            ctx.fillText(this.formatCategoryName(category), labelX, labelY);

            // Value labels on bars with proper theme-based contrast
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';

            if (budgetHeight > 25) {
                // White text on dark bars, black text on light bars
                ctx.fillStyle = this.isDarkTheme() ? '#ffffff' : '#000000';
                ctx.fillText(`₹${this.formatNumber(budgetAmount)}`, budgetX + barWidth / 2, budgetY - 8);
            }

            if (spendingHeight > 25) {
                // White text on dark bars, black text on light bars
                ctx.fillStyle = this.isDarkTheme() ? '#ffffff' : '#000000';
                ctx.fillText(`₹${this.formatNumber(spendingAmount)}`, spendingX + barWidth / 2, spendingY - 8);
            }
        });

        // No chart title inside canvas - using the h4 heading above the chart instead

        // Draw legend at bottom (below the chart)
        const legendY = height - bottomPadding + 50;
        const legendStartX = width / 2 - 80; // Center the legend

        // Budget legend with theme-aware colors
        ctx.fillStyle = this.isDarkTheme() ? '#60A5FA' : '#3B82F6';
        ctx.fillRect(legendStartX, legendY, 14, 14);
        ctx.strokeStyle = this.isDarkTheme() ? '#93C5FD' : '#1D4ED8';
        ctx.lineWidth = 1;
        ctx.strokeRect(legendStartX, legendY, 14, 14);

        ctx.fillStyle = this.getTextColor();
        ctx.font = '13px Inter, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Budget', legendStartX + 20, legendY + 11);

        // Spending legend
        ctx.fillStyle = this.isDarkTheme() ? '#34D399' : '#10B981';
        ctx.fillRect(legendStartX + 90, legendY, 14, 14);
        ctx.strokeStyle = this.isDarkTheme() ? '#059669' : '#047857';
        ctx.lineWidth = 1;
        ctx.strokeRect(legendStartX + 90, legendY, 14, 14);

        ctx.fillStyle = this.getTextColor();
        ctx.fillText('Spent', legendStartX + 110, legendY + 11);
    }

    formatNumber(num) {
        if (num >= 100000) {
            return (num / 100000).toFixed(1) + 'L';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toFixed(0);
    }

    formatCategoryName(category) {
        return category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
}
