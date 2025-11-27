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