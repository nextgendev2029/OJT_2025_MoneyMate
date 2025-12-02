// Export Manager - Handles data export
export class ExportManager {
    toJSON(data, filename) {
        const json = JSON.stringify(data, null, 2);
        this.download(json, filename, 'application/json');
    }

    toCSV(transactions, filename) {
        const headers = ['Date', 'Type', 'Category', 'Amount', 'Description', 'Recurring'];
        const rows = transactions.map(t => [
            t.date,
            t.type,
            t.category,
            t.amount,
            t.description || '',
            t.recurring ? 'Yes' : 'No'
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        this.download(csv, filename, 'text/csv');
    }

download(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}