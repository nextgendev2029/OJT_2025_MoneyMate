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

    
}
