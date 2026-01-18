// Budget Manager - Handles budget operations with IndexedDB
export class BudgetManager {
    constructor(storage) {
        this.storage = storage;
        this.budgets = {};
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
            this.budgets = await this.storage.get('budgets') || {};
            console.log(`Loaded ${Object.keys(this.budgets).length} budgets from storage`);
        } catch (error) {
            console.error('Error loading budgets:', error);
            this.budgets = {};
        }
    }

    async saveToStorage() {
        try {
            await this.storage.set('budgets', this.budgets);
        } catch (error) {
            console.error('Error saving budgets:', error);
        }
    }

    async set(category, limit) {
        await this.init();
        this.budgets[category] = limit;
        await this.saveToStorage();
    }

    async get(category) {
        await this.init();
        return this.budgets[category] || null;
    }

    async getAll() {
        await this.init();
        return { ...this.budgets };
    }

    async delete(category) {
        await this.init();
        delete this.budgets[category];
        await this.saveToStorage();
    }

    async clear() {
        await this.init();
        this.budgets = {};
        await this.saveToStorage();
    }
}
