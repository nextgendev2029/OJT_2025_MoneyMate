// Budget Manager - Handles budget operations
export class BudgetManager {
    constructor(storage) {
        this.storage = storage;
        this.budgets = {};
    }

    loadFromStorage() {
        this.budgets = this.storage.get('budgets') || {};
    }

    saveToStorage() {
        this.storage.set('budgets', this.budgets);
    }

    set(category, limit) {
        this.budgets[category] = limit;
        this.saveToStorage();
    }

    get(category) {
        return this.budgets[category] || null;
    }

    
    getAll() {
        return { ...this.budgets };
    }

    delete(category) {
        delete this.budgets[category];
        this.saveToStorage();
    }

    clear() {
        this.budgets = {};
        this.saveToStorage();
    }
}
