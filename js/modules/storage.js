// Storage Manager - Handles IndexedDB operations (upgraded from localStorage)
import { dbManager } from './indexeddb.js';

export class StorageManager {
    constructor() {
        this.prefix = 'finance_tracker_';
        this.db = dbManager;
        this.initialized = false;
    }

    async init() {
        if (!this.initialized) {
            await this.db.init();
            this.initialized = true;
            
            // Check if we need to migrate from localStorage
            await this.migrateFromLocalStorageIfNeeded();
        }
    }

    async get(key) {
        try {
            await this.init();
            const result = await this.db.getItem(this.prefix + key);
            return result ? JSON.parse(result) : null;
        } catch (error) {
            console.error('Error reading from storage:', error);
            return null;
        }
    }

    async set(key, value) {
        try {
            await this.init();
            const success = await this.db.setItem(this.prefix + key, JSON.stringify(value));
            return success;
        } catch (error) {
            console.error('Error writing to storage:', error);
            return false;
        }
    }

    async remove(key) {
        try {
            await this.init();
            const success = await this.db.removeItem(this.prefix + key);
            return success;
        } catch (error) {
            console.error('Error removing from storage:', error);
            return false;
        }
    }

    async clear() {
        try {
            await this.init();
            // Clear all finance tracker data
            const allSettings = await this.db.getAll(this.db.stores.settings);
            const keysToDelete = allSettings
                .filter(item => item.key.startsWith(this.prefix))
                .map(item => item.key);
            
            for (const key of keysToDelete) {
                await this.db.removeItem(key);
            }
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }

    // Migration method to move existing localStorage data to IndexedDB
    async migrateFromLocalStorageIfNeeded() {
        try {
            // Check if migration is needed
            const migrationKey = 'indexeddb_migration_completed';
            const migrationCompleted = localStorage.getItem(migrationKey);
            
            if (migrationCompleted) {
                console.log('IndexedDB migration already completed');
                return;
            }

            console.log('Starting migration from localStorage to IndexedDB...');
            
            // Get all localStorage keys that start with our prefix
            const keysToMigrate = Object.keys(localStorage)
                .filter(key => key.startsWith(this.prefix));
            
            if (keysToMigrate.length === 0) {
                console.log('No data to migrate from localStorage');
                localStorage.setItem(migrationKey, 'true');
                return;
            }

            // Migrate each key
            for (const fullKey of keysToMigrate) {
                const value = localStorage.getItem(fullKey);
                const key = fullKey.replace(this.prefix, '');
                
                if (value) {
                    await this.db.setItem(fullKey, value);
                    console.log(`Migrated: ${key}`);
                }
            }

            // Mark migration as completed
            localStorage.setItem(migrationKey, 'true');
            console.log('Migration from localStorage to IndexedDB completed successfully');
            
        } catch (error) {
            console.error('Error during localStorage migration:', error);
        }
    }

    // Backward compatibility methods (synchronous fallback to localStorage)
    getSync(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error reading from localStorage fallback:', error);
            return null;
        }
    }

    setSync(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error writing to localStorage fallback:', error);
            return false;
        }
    }
}
