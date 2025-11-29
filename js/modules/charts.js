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

}