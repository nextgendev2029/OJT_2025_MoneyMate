// Transaction Manager - Handles all transaction operations with IndexedDB
export class TransactionManager {
    constructor(storage) {
        this.storage = storage;
        this.transactions = [];
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 20;
        this.initialized = false;
    }

    async init() {
        if (!this.initialized) {
            await this.loadFromStorage();
            this.initialized = true;
        }
    }

    async loadFromStorage() {
        try {
            this.transactions = await this.storage.get('transactions') || [];
            await this.saveHistory();
            console.log(`Loaded ${this.transactions.length} transactions from storage`);
        } catch (error) {
            console.error('Error loading transactions:', error);
            this.transactions = [];
        }
    }

    async saveToStorage() {
        try {
            await this.storage.set('transactions', this.transactions);
        } catch (error) {
            console.error('Error saving transactions:', error);
        }
    }

    async add(transaction) {
        await this.init();
        this.transactions.push(transaction);
        await this.saveToStorage();
        await this.saveHistory();
    }

    async delete(timestamp) {
        await this.init();
        this.transactions = this.transactions.filter(t => t.timestamp !== timestamp);
        await this.saveToStorage();
        await this.saveHistory();
    }

    async getAll() {
        await this.init();
        return [...this.transactions];
    }

    async getStats() {
        await this.init();
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

    async getSpendingByCategory() {
        await this.init();
        const spending = {};
        this.transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                spending[t.category] = (spending[t.category] || 0) + t.amount;
            });
        return spending;
    }

    async getSpendingTrend() {
        await this.init();
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

    async processRecurring() {
        await this.init();
        const today = new Date().toISOString().split('T')[0];
        const recurringTransactions = this.transactions.filter(t => t.recurring);
        
        for (const t of recurringTransactions) {
            const lastDate = new Date(t.date);
            const nextDate = new Date(lastDate);
            nextDate.setMonth(nextDate.getMonth() + 1);
            
            if (nextDate.toISOString().split('T')[0] <= today) {
                const newTransaction = {
                    ...t,
                    date: today,
                    timestamp: Date.now() + Math.random() // Ensure unique timestamp
                };
                await this.add(newTransaction);
            }
        }
    }

    // Undo/Redo functionality
    async saveHistory() {
        // Remove any future history if we're not at the end
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Add current state
        this.history.push(JSON.stringify(this.transactions));
        
        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }

    async undo() {
        if (this.canUndo()) {
            this.historyIndex--;
            this.transactions = JSON.parse(this.history[this.historyIndex]);
            await this.saveToStorage();
            return true;
        }
        return false;
    }

    async redo() {
        if (this.canRedo()) {
            this.historyIndex++;
            this.transactions = JSON.parse(this.history[this.historyIndex]);
            await this.saveToStorage();
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
