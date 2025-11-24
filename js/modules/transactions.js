export class TransactionManager {
    constructor(storage) {
        this.storage = storage;
        this.transactions = [];
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 20;
    }

    loadFromStorage() {
        this.transactions = this.storage.get('transactions') || [];
        this.saveHistory();
    }

    saveToStorage() {
        this.storage.set('transactions', this.transactions);
    }

    add(transaction) {
        this.transactions.push(transaction);
        this.saveToStorage();
        this.saveHistory();
    }

    delete(timestamp) {
        this.transactions = this.transactions.filter(t => t.timestamp !== timestamp);
        this.saveToStorage();
        this.saveHistory();
    }

    getAll() {
        return [...this.transactions];
    }

    getStats() {
        const income = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expense = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        return {
            income,
            expense,
            balance: income - expense
        };
    }

    
}
