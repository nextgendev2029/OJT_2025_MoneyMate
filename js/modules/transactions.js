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

    
    getSpendingByCategory() {
        const spending = {};
        this.transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                spending[t.category] = (spending[t.category] || 0) + t.amount;
            });
        return spending;
    }

    getSpendingTrend() {
        const last7Days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayExpense = this.transactions
                .filter(t => t.type === 'expense' && t.date === dateStr)
                .reduce((sum, t) => sum + t.amount, 0);
            
            last7Days.push({
                date: dateStr,
                amount: dayExpense
            });
        }
        
        return last7Days;
    }

    processRecurring() {
        const today = new Date().toISOString().split('T')[0];
        const recurringTransactions = this.transactions.filter(t => t.recurring);
        
        recurringTransactions.forEach(t => {
            const lastDate = new Date(t.date);
            const nextDate = new Date(lastDate);
            nextDate.setMonth(nextDate.getMonth() + 1);
            
            if (nextDate.toISOString().split('T')[0] <= today) {
                const newTransaction = {
                    ...t,
                    date: today,
                    timestamp: Date.now() + Math.random()
                };
                this.add(newTransaction);
            }
        });
    }

    // Undo/Redo functionality
    saveHistory() {
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(JSON.stringify(this.transactions));
        
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }

    undo(){
        if (this.canUndo()) {
            this.historyIndex--;
            this.transactions = JSON.parse(this.history[this.historyIndex]);
            this.saveToStorage();
            return true;
        }
        return false;
    }

    redo(){
        if (this.canRedo()) {
            this.historyIndex++;
            this.transactions = JSON.parse(this.history[this.historyIndex]);
            this.saveToStorage();
            return true;
        }
        return false;
    }

    canUndo() {
        return this.historyIndex > 0;
    }

    canRedo() {
        return this.historyIndex < this.history.length - 1;
    }
}
