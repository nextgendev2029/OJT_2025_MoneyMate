// Chart Manager - Handles chart rendering using Canvas API
export class ChartManager {
    constructor() {
        this.colors = [
            '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
            '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'
        ];
    }

    renderPieChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.parentElement.clientWidth;
        const height = 300;
        canvas.width = width;
        canvas.height = height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        const entries = Object.entries(data);
        if (entries.length === 0) {
            ctx.fillStyle = '#9ca3af';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No expense data available', width / 2, height / 2);
            return;
        }

        const total = entries.reduce((sum, [, value]) => sum + value, 0);
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 3;

        let currentAngle = -Math.PI / 2;

        entries.forEach(([category, value], index) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = this.colors[index % this.colors.length];
            ctx.fill();
            
            // Draw label
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius + 40);
            const labelY = centerY + Math.sin(labelAngle) * (radius + 40);
            
            ctx.fillStyle = '#374151';
            ctx.font = '12px sans-serif';
            ctx.textAlign = labelX > centerX ? 'left' : 'right';
            ctx.fillText(
                `${category.replace('-', ' ')}: ₹${value.toFixed(0)}`,
                labelX,
                labelY
            );
            
            currentAngle += sliceAngle;
        });
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
            ctx.fillStyle = '#9ca3af';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No trend data available', width / 2, height / 2);
            return;
        }

        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        const maxAmount = Math.max(...data.map(d => d.amount), 100);
        const stepX = chartWidth / (data.length - 1 || 1);

        // Draw axes
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Draw line
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((point, index) => {
            const x = padding + index * stepX;
            const y = height - padding - (point.amount / maxAmount) * chartHeight;
            
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
            
            // Point
            ctx.fillStyle = '#6366f1';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
            
            // Date label
            ctx.fillStyle = '#6b7280';
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
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const value = (maxAmount / 4) * i;
            const y = height - padding - (i / 4) * chartHeight;
            ctx.fillText(`₹${value.toFixed(0)}`, padding - 5, y + 3);
        }
    }
}
