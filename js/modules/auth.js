// Authentication Manager - Handles user authentication and management with IndexedDB
import { dbManager } from './indexeddb.js';

export class AuthManager {
    constructor() {
        this.currentUser = null;
        this.users = {};
        this.db = dbManager;
        this.initialized = false;
    }

    async init() {
        if (!this.initialized) {
            await this.db.init();
            await this.loadUsers();
            await this.checkAuthStatus();
            await this.initializeDemoUsers();
            this.initialized = true;
        }
    }

    // Load users from IndexedDB
    async loadUsers() {
        try {
            const usersList = await this.db.getAllUsers();
            this.users = {};
            usersList.forEach(user => {
                this.users[user.email] = user;
            });
            console.log(`Loaded ${usersList.length} users from IndexedDB`);
        } catch (error) {
            console.error('Error loading users:', error);
            this.users = {};
        }
    }

    // Save users to IndexedDB
    async saveUsers() {
        try {
            for (const [email, userData] of Object.entries(this.users)) {
                await this.db.saveUser(userData);
            }
        } catch (error) {
            console.error('Error saving users:', error);
        }
    }

    // Initialize demo users with sample data
    async initializeDemoUsers() {
        const demoUsers = {
            'john@demo.com': {
                id: 'demo_john',
                email: 'john@demo.com',
                password: 'demo123', // In real app, this would be hashed
                profile: {
                    firstName: 'John',
                    lastName: 'Smith',
                    avatar: '👨‍💼',
                    role: 'Business Owner',
                    joinDate: '2024-01-15',
                    preferences: {
                        theme: 'light',
                        currency: 'INR',
                        language: 'en'
                    }
                },
                stats: {
                    totalTransactions: 45,
                    totalIncome: 125000,
                    totalExpenses: 78000,
                    budgetsSet: 6
                }
            },
            'sarah@demo.com': {
                id: 'demo_sarah',
                email: 'sarah@demo.com',
                password: 'demo123',
                profile: {
                    firstName: 'Sarah',
                    lastName: 'Johnson',
                    avatar: '👩‍🎓',
                    role: 'Student',
                    joinDate: '2024-02-20',
                    preferences: {
                        theme: 'dark',
                        currency: 'INR',
                        language: 'en'
                    }
                },
                stats: {
                    totalTransactions: 28,
                    totalIncome: 25000,
                    totalExpenses: 18500,
                    budgetsSet: 4
                }
            }
        };

        // Add demo users if they don't exist
        for (const [email, userData] of Object.entries(demoUsers)) {
            if (!this.users[email]) {
                this.users[email] = userData;
                await this.db.saveUser(userData);
            }
        }

        await this.initializeDemoData();
    }

    // Initialize demo transaction data
    async initializeDemoData() {
        // John's demo data
        const johnDataExists = await this.db.getAuthData('demo_john_transactions');
        if (!johnDataExists) {
            const johnTransactions = [
                {
                    type: 'income',
                    amount: 50000,
                    category: 'salary',
                    date: '2024-03-01',
                    description: 'Monthly Salary',
                    recurring: true,
                    timestamp: Date.now() - 86400000 * 30
                },
                {
                    type: 'expense',
                    amount: 15000,
                    category: 'food',
                    date: '2024-03-05',
                    description: 'Grocery Shopping',
                    recurring: false,
                    timestamp: Date.now() - 86400000 * 25
                },
                {
                    type: 'expense',
                    amount: 8000,
                    category: 'transport',
                    date: '2024-03-10',
                    description: 'Fuel and Maintenance',
                    recurring: false,
                    timestamp: Date.now() - 86400000 * 20
                }
            ];

            const johnBudgets = {
                food: 20000,
                transport: 10000,
                entertainment: 5000
            };

            await this.db.setAuthData('demo_john_transactions', JSON.stringify(johnTransactions));
            await this.db.setAuthData('demo_john_budgets', JSON.stringify(johnBudgets));
        }

        // Sarah's demo data
        const sarahDataExists = await this.db.getAuthData('demo_sarah_transactions');
        if (!sarahDataExists) {
            const sarahTransactions = [
                {
                    type: 'income',
                    amount: 15000,
                    category: 'other-income',
                    date: '2024-03-01',
                    description: 'Part-time Job',
                    recurring: true,
                    timestamp: Date.now() - 86400000 * 30
                },
                {
                    type: 'expense',
                    amount: 5000,
                    category: 'education',
                    date: '2024-03-03',
                    description: 'Course Books',
                    recurring: false,
                    timestamp: Date.now() - 86400000 * 27
                },
                {
                    type: 'expense',
                    amount: 3000,
                    category: 'food',
                    date: '2024-03-08',
                    description: 'Hostel Mess',
                    recurring: false,
                    timestamp: Date.now() - 86400000 * 22
                }
            ];

            const sarahBudgets = {
                food: 8000,
                education: 10000,
                entertainment: 3000
            };

            await this.db.setAuthData('demo_sarah_transactions', JSON.stringify(sarahTransactions));
            await this.db.setAuthData('demo_sarah_budgets', JSON.stringify(sarahBudgets));
        }
    }

    // Register new user
    async register(userData) {
        await this.init();

        const { email, password, firstName, lastName } = userData;

        // Check if user already exists
        if (this.users[email]) {
            throw new Error('User already exists with this email');
        }

        // Validate email format
        if (!this.isValidEmail(email)) {
            throw new Error('Please enter a valid email address');
        }

        // Validate password strength
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        // Create new user
        const userId = this.generateUserId();
        const newUser = {
            id: userId,
            email: email.toLowerCase(),
            password: password, // In real app, hash this
            profile: {
                firstName,
                lastName,
                avatar: this.getRandomAvatar(),
                role: 'User',
                joinDate: new Date().toISOString().split('T')[0],
                preferences: {
                    theme: 'light',
                    currency: 'INR',
                    language: 'en'
                }
            },
            stats: {
                totalTransactions: 0,
                totalIncome: 0,
                totalExpenses: 0,
                budgetsSet: 0
            }
        };

        // Save user
        this.users[email] = newUser;
        await this.db.saveUser(newUser);

        return newUser;
    }

    // Login user
    async login(email, password, remember = false) {
        await this.init();

        const user = this.users[email.toLowerCase()];

        if (!user || user.password !== password) {
            throw new Error('Invalid email or password');
        }

        // Set current user
        this.currentUser = user;

        // Save login state to IndexedDB
        await this.db.setAuthData('moneymate_currentUser', JSON.stringify(user));

        // Always save to sessionStorage (cleared when browser closes)
        sessionStorage.setItem('moneymate_currentUser', JSON.stringify(user));

        if (remember) {
            const expiryTime = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days in ms
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);

            // Save to IndexedDB
            await this.db.setAuthData('moneymate_rememberMe', expiryDate.toISOString());

            // Save to localStorage for persistent login (survives browser close)
            localStorage.setItem('moneymate_currentUser', JSON.stringify(user));
            localStorage.setItem('moneymate_rememberMe', 'true');
            localStorage.setItem('moneymate_rememberExpiry', expiryTime.toString());
        } else {
            // Clear localStorage remember me if not checked
            // User will stay logged in during current session only
            localStorage.removeItem('moneymate_currentUser');
            localStorage.removeItem('moneymate_rememberMe');
            localStorage.removeItem('moneymate_rememberExpiry');
        }

        return user;
    }

    // Logout user
    async logout() {
        this.currentUser = null;

        // Clear IndexedDB
        await this.db.removeAuthData('moneymate_currentUser');
        await this.db.removeAuthData('moneymate_rememberMe');

        // Clear sessionStorage
        sessionStorage.removeItem('moneymate_currentUser');

        // Clear localStorage
        localStorage.removeItem('moneymate_currentUser');
        localStorage.removeItem('moneymate_rememberMe');
        localStorage.removeItem('moneymate_rememberExpiry');
        localStorage.removeItem('moneymate_guestMode');
    }

    // Check authentication status
    async checkAuthStatus() {
        try {
            const savedUserData = await this.db.getAuthData('moneymate_currentUser');
            const rememberMe = await this.db.getAuthData('moneymate_rememberMe');

            if (savedUserData) {
                const user = JSON.parse(savedUserData);

                // Check if remember me is still valid
                if (rememberMe) {
                    const expiryDate = new Date(rememberMe);
                    if (new Date() > expiryDate) {
                        await this.logout();
                        return false;
                    }
                }

                this.currentUser = user;
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error checking auth status:', error);
            return false;
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Update user profile
    async updateProfile(updates) {
        if (!this.currentUser) {
            throw new Error('No user logged in');
        }

        // Update current user
        this.currentUser.profile = { ...this.currentUser.profile, ...updates };

        // Update in users database
        this.users[this.currentUser.email] = this.currentUser;

        // Save changes
        await this.db.saveUser(this.currentUser);
        await this.db.setAuthData('moneymate_currentUser', JSON.stringify(this.currentUser));

        return this.currentUser;
    }

    // Update user stats
    async updateStats(stats) {
        if (!this.currentUser) return;

        this.currentUser.stats = { ...this.currentUser.stats, ...stats };
        this.users[this.currentUser.email] = this.currentUser;
        await this.db.saveUser(this.currentUser);
        await this.db.setAuthData('moneymate_currentUser', JSON.stringify(this.currentUser));
    }

    // Get user-specific storage key
    getUserStorageKey(key) {
        if (!this.currentUser) return key;
        return `${this.currentUser.id}_${key}`;
    }

    // Utility methods
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getRandomAvatar() {
        const avatars = ['👤', '👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓', '👨‍💻', '👩‍💻', '🧑‍🎨', '👨‍🔬', '👩‍🔬'];
        return avatars[Math.floor(Math.random() * avatars.length)];
    }

    // Get all users (admin function)
    getAllUsers() {
        return Object.values(this.users);
    }

    // Delete user account
    async deleteAccount() {
        if (!this.currentUser) {
            throw new Error('No user logged in');
        }

        const email = this.currentUser.email;
        const userId = this.currentUser.id;

        // Delete user data
        delete this.users[email];
        await this.db.delete(this.db.stores.users, email);

        // Clear user-specific data
        const allSettings = await this.db.getAll(this.db.stores.settings);
        const userKeys = allSettings.filter(item => item.key.startsWith(userId));
        for (const item of userKeys) {
            await this.db.removeItem(item.key);
        }

        // Clear auth data
        const allAuthData = await this.db.getAll(this.db.stores.auth);
        const userAuthKeys = allAuthData.filter(item => item.key.startsWith(userId));
        for (const item of userAuthKeys) {
            await this.db.removeAuthData(item.key);
        }

        // Logout
        await this.logout();
    }

    // Compatibility methods for localStorage-like usage
    async getAuthItem(key) {
        return await this.db.getAuthData(key);
    }

    async setAuthItem(key, value) {
        return await this.db.setAuthData(key, value);
    }

    async removeAuthItem(key) {
        return await this.db.removeAuthData(key);
    }
}