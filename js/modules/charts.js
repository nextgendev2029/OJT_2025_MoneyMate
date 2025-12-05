// Chart Manager - Handles chart rendering using Canvas API
export class ChartManager {
    constructor() {
        // Soft pastel colors - gentle and easy on the eyes
        this.colors = [
            '#FFB6C1', // Pastel Pink
            '#89CFF0', // Baby Blue
            '#98FF98', // Mint Green
            '#FFB347', // Pastel Orange
            '#E6E6FA', // Lavender
            '#FFDAB9', // Light Peach
            '#D3D3D3', // Soft Gray 
            '#93E9BE'  // Seafoam Green 
        ];
        
        // Store chart data for interactivity
        this.pieChartData = null;
        this.lineChartData = null;
        this.hoveredSlice = -1;
        this.hoveredPoint = -1;
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

        let currentAngle = -Math.PI / 2;
        const slices = [];

        // Draw slices
        entries.forEach(([category, value], index) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            const isHovered = this.hoveredSlice === index;
            const sliceRadius = isHovered ? radius + 10 : radius;
            
            // Store slice data
            slices.push({
                category,
                value,
                startAngle: currentAngle,
                endAngle: currentAngle + sliceAngle,
                color: this.colors[index % this.colors.length],
                index
            });
            
            // Draw slice with hover effect
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, sliceRadius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = this.colors[index % this.colors.length];
            ctx.fill();
            
            // Add white border for better separation
            ctx.strokeStyle = this.isDarkTheme() ? '#1f2937' : '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            currentAngle += sliceAngle;
        });

        // Store slices for hover detection
        this.pieChartData.slices = slices;

        // Draw labels outside with connecting lines
        currentAngle = -Math.PI / 2;
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

        // Add hover interaction
        this.addPieChartInteraction(canvas);
    }
    
    addPieChartInteraction(canvas) {
        // Skip if already has listeners to prevent infinite loops
        if (canvas._hasListeners) return;
        canvas._hasListeners = true;
        
        canvas.style.cursor = 'pointer';
        
        const handleMouseMove = (e) => {
            if (!this.pieChartData) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
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
                // Temporarily remove listener to prevent infinite loop
                canvas._hasListeners = false;
                this.renderPieChart('category-chart', 
                    Object.fromEntries(this.pieChartData.entries));
            }
        };
        
        const handleMouseLeave = () => {
            if (this.hoveredSlice !== -1) {
                this.hoveredSlice = -1;
                canvas._hasListeners = false;
                this.renderPieChart('category-chart', 
                    Object.fromEntries(this.pieChartData.entries));
            }
        };
        
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
                const tooltipX = x - tooltipWidth / 2;
                const tooltipY = y - tooltipHeight - 15;
                
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
                    x,
                    tooltipY + 20
                );
                
                ctx.font = '14px sans-serif';
                ctx.fillStyle = '#6366f1';
                ctx.fillText(
                    `₹${point.amount.toFixed(2)}`,
                    x,
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
        // Skip if already has listeners to prevent infinite loops
        if (canvas._hasListeners) return;
        canvas._hasListeners = true;
        
        canvas.style.cursor = 'pointer';
        
        const handleMouseMove = (e) => {
            if (!this.lineChartData) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
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
                canvas._hasListeners = false;
                this.renderLineChart('trend-chart', this.lineChartData.data);
            }
        };
        
        const handleMouseLeave = () => {
            if (this.hoveredPoint !== -1) {
                this.hoveredPoint = -1;
                canvas._hasListeners = false;
                this.renderLineChart('trend-chart', this.lineChartData.data);
            }
        };
        
        const handleClick = (e) => {
            if (!this.lineChartData || this.hoveredPoint === -1) return;
            
            const point = this.lineChartData.data[this.hoveredPoint];
            const date = new Date(point.date);
            alert(`Date: ${date.toLocaleDateString('en-IN')}\nAmount: ₹${point.amount.toFixed(2)}`);
        };
        
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        canvas.addEventListener('click', handleClick);
    }
}