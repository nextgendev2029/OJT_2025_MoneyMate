// IndexedDB Manager - Replaces localStorage with IndexedDB
export class IndexedDBManager {
    constructor() {
        this.dbName = 'MoneyMateDB';
        this.dbVersion = 1;
        this.db = null;
        this.stores = {
            users: 'users',
            transactions: 'transactions', 
            budgets: 'budgets',
            settings: 'settings',
            auth: 'auth'
        };
    }

    // Initialize IndexedDB
    async init() {
        return new Promise((resolve, reject) => {
            console.log('Initializing IndexedDB...');
            
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('IndexedDB failed to open:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB opened successfully');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                console.log('IndexedDB upgrade needed, creating object stores...');
                const db = event.target.result;
                
                // Create object stores
                if (!db.objectStoreNames.contains(this.stores.users)) {
                    const userStore = db.createObjectStore(this.stores.users, { keyPath: 'email' });
                    userStore.createIndex('email', 'email', { unique: true });
                    console.log('Created users store');
                }
                
                if (!db.objectStoreNames.contains(this.stores.transactions)) {
                    const transactionStore = db.createObjectStore(this.stores.transactions, { keyPath: 'id', autoIncrement: true });
                    transactionStore.createIndex('userId', 'userId', { unique: false });
                    transactionStore.createIndex('timestamp', 'timestamp', { unique: false });
                    transactionStore.createIndex('type', 'type', { unique: false });
                    transactionStore.createIndex('category', 'category', { unique: false });
                    console.log('Created transactions store');
                }
                
                if (!db.objectStoreNames.contains(this.stores.budgets)) {
                    const budgetStore = db.createObjectStore(this.stores.budgets, { keyPath: 'id', autoIncrement: true });
                    budgetStore.createIndex('userId', 'userId', { unique: false });
                    budgetStore.createIndex('category', 'category', { unique: false });
                    console.log('Created budgets store');
                }
                
                if (!db.objectStoreNames.contains(this.stores.settings)) {
                    const settingsStore = db.createObjectStore(this.stores.settings, { keyPath: 'key' });
                    console.log('Created settings store');
                }
                
                if (!db.objectStoreNames.contains(this.stores.auth)) {
                    const authStore = db.createObjectStore(this.stores.auth, { keyPath: 'key' });
                    console.log('Created auth store');
                }
            };
        });
    }

    // Generic get method
    async get(storeName, key) {
        if (!this.db) {
            await this.init();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error(`Error getting ${key} from ${storeName}:`, request.error);
                reject(request.error);
            };
        });
    }

    // Generic set method
    async set(storeName, data) {
        if (!this.db) {
            await this.init();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error(`Error setting data in ${storeName}:`, request.error);
                reject(request.error);
            };
        });
    }

    // Generic delete method
    async delete(storeName, key) {
        if (!this.db) {
            await this.init();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            
            request.onsuccess = () => {
                resolve(true);
            };
            
            request.onerror = () => {
                console.error(`Error deleting ${key} from ${storeName}:`, request.error);
                reject(request.error);
            };
        });
    }

    // Get all records from a store
    async getAll(storeName) {
        if (!this.db) {
            await this.init();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result || []);
            };
            
            request.onerror = () => {
                console.error(`Error getting all from ${storeName}:`, request.error);
                reject(request.error);
            };
        });
    }

    // Get records by index
    async getByIndex(storeName, indexName, value) {
        if (!this.db) {
            await this.init();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            
            request.onsuccess = () => {
                resolve(request.result || []);
            };
            
            request.onerror = () => {
                console.error(`Error getting by index ${indexName} from ${storeName}:`, request.error);
                reject(request.error);
            };
        });
    }

    // Clear all data from a store
    async clear(storeName) {
        if (!this.db) {
            await this.init();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => {
                resolve(true);
            };
            
            request.onerror = () => {
                console.error(`Error clearing ${storeName}:`, request.error);
                reject(request.error);
            };
        });
    }

    // Count records in a store
    async count(storeName) {
        if (!this.db) {
            await this.init();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.count();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error(`Error counting ${storeName}:`, request.error);
                reject(request.error);
            };
        });
    }

    // Compatibility methods for localStorage-like usage
    async getItem(key) {
        try {
            const result = await this.get(this.stores.settings, key);
            return result ? result.value : null;
        } catch (error) {
            console.error('Error getting item:', error);
            return null;
        }
    }

    async setItem(key, value) {
        try {
            await this.set(this.stores.settings, { key, value });
            return true;
        } catch (error) {
            console.error('Error setting item:', error);
            return false;
        }
    }

    async removeItem(key) {
        try {
            await this.delete(this.stores.settings, key);
            return true;
        } catch (error) {
            console.error('Error removing item:', error);
            return false;
        }
    }

    // Auth-specific methods
    async getAuthData(key) {
        try {
            const result = await this.get(this.stores.auth, key);
            return result ? result.value : null;
        } catch (error) {
            console.error('Error getting auth data:', error);
            return null;
        }
    }

    async setAuthData(key, value) {
        try {
            await this.set(this.stores.auth, { key, value });
            return true;
        } catch (error) {
            console.error('Error setting auth data:', error);
            return false;
        }
    }

    async removeAuthData(key) {
        try {
            await this.delete(this.stores.auth, key);
            return true;
        } catch (error) {
            console.error('Error removing auth data:', error);
            return false;
        }
    }

    // User-specific methods
    async saveUser(userData) {
        try {
            await this.set(this.stores.users, userData);
            return true;
        } catch (error) {
            console.error('Error saving user:', error);
            return false;
        }
    }

    async getUser(email) {
        try {
            return await this.get(this.stores.users, email);
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    async getAllUsers() {
        try {
            return await this.getAll(this.stores.users);
        } catch (error) {
            console.error('Error getting all users:', error);
            return [];
        }
    }

    // Transaction-specific methods
    async saveTransaction(transactionData, userId) {
        try {
            const dataWithUserId = { ...transactionData, userId };
            await this.set(this.stores.transactions, dataWithUserId);
            return true;
        } catch (error) {
            console.error('Error saving transaction:', error);
            return false;
        }
    }

    async getUserTransactions(userId) {
        try {
            return await this.getByIndex(this.stores.transactions, 'userId', userId);
        } catch (error) {
            console.error('Error getting user transactions:', error);
            return [];
        }
    }

    async deleteTransaction(transactionId) {
        try {
            await this.delete(this.stores.transactions, transactionId);
            return true;
        } catch (error) {
            console.error('Error deleting transaction:', error);
            return false;
        }
    }

    // Budget-specific methods
    async saveBudget(budgetData, userId) {
        try {
            const dataWithUserId = { ...budgetData, userId };
            await this.set(this.stores.budgets, dataWithUserId);
            return true;
        } catch (error) {
            console.error('Error saving budget:', error);
            return false;
        }
    }

    async getUserBudgets(userId) {
        try {
            return await this.getByIndex(this.stores.budgets, 'userId', userId);
        } catch (error) {
            console.error('Error getting user budgets:', error);
            return [];
        }
    }

    // Migration method to move data from localStorage to IndexedDB
    async migrateFromLocalStorage() {
        console.log('Starting migration from localStorage to IndexedDB...');
        
        try {
            // Migrate auth data
            const authKeys = [
                'moneymate_guestMode',
                'moneymate_guestSession',
                'moneymate_currentUser',
                'moneymate_rememberMe'
            ];
            
            for (const key of authKeys) {
                const value = localStorage.getItem(key);
                if (value) {
                    await this.setAuthData(key, value);
                    console.log(`Migrated auth data: ${key}`);
                }
            }
            
            // Migrate users data
            const usersData = localStorage.getItem('moneymate_users');
            if (usersData) {
                const users = JSON.parse(usersData);
                for (const [email, userData] of Object.entries(users)) {
                    await this.saveUser({ email, ...userData });
                    console.log(`Migrated user: ${email}`);
                }
            }
            
            // Migrate settings and other data
            const settingsKeys = [
                'moneymate_theme',
                'moneymate_language',
                'moneymate_lastRecurringCheck'
            ];
            
            for (const key of settingsKeys) {
                const value = localStorage.getItem(key);
                if (value) {
                    await this.setItem(key, value);
                    console.log(`Migrated setting: ${key}`);
                }
            }
            
            console.log('Migration from localStorage completed successfully');
            return true;
        } catch (error) {
            console.error('Error during migration:', error);
            return false;
        }
    }

    // Clear all data (for testing/reset)
    async clearAllData() {
        try {
            await this.clear(this.stores.users);
            await this.clear(this.stores.transactions);
            await this.clear(this.stores.budgets);
            await this.clear(this.stores.settings);
            await this.clear(this.stores.auth);
            console.log('All IndexedDB data cleared');
            return true;
        } catch (error) {
            console.error('Error clearing all data:', error);
            return false;
        }
    }
}

// Create singleton instance
export const dbManager = new IndexedDBManager();