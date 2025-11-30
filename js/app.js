// Main Application Entry Point
import { StorageManager } from './modules/storage.js';
import { TransactionManager } from './modules/transactions.js';
import { BudgetManager } from './modules/budgets.js';
import { UIManager } from './modules/ui.js';
import { ThemeManager } from './modules/theme.js';
import { ChartManager } from './modules/charts.js';

class FinanceApp {
    constructor() {
        this.storage = new StorageManager();
        this.transactions = new TransactionManager(this.storage);
        this.budgets = new BudgetManager(this.storage);
        this.ui = new UIManager();
        this.theme = new ThemeManager();
        this.charts = new ChartManager();
        
        this.init();
    }

    init() {
        // Initialize theme
        this.theme.init();
        
        // Load data
        this.loadData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initial render
        this.render();
        
        // Check for recurring transactions
        this.checkRecurringTransactions();
    }

    loadData() {
        this.transactions.loadFromStorage();
        this.budgets.loadFromStorage();
    }

    setupEventListeners() {
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
        this.theme.toggle();
    });

    // Transaction form
    const form = document.getElementById('transaction-form');
    form.addEventListener('submit', (e) => this.handleTransactionSubmit(e));

    // Transaction type change - update categories dynamically
    document.getElementById('transaction-type').addEventListener('change', (e) => {
        this.updateCategoryOptions(e.target.value);
    });

    // Undo/Redo
    document.getElementById('undo-btn').addEventListener('click', () => this.handleUndo());
    document.getElementById('redo-btn').addEventListener('click', () => this.handleRedo());

    // Set default date to today and max date to today (no future dates)
    const dateInput = document.getElementById('transaction-date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.max = today;

    // Initialize category options based on default type (income)
    this.updateCategoryOptions('income');
    
    
}


    updateCategoryOptions(type) {
        const categorySelect = document.getElementById('transaction-category');
        
        const incomeCategories = [
            { value: 'salary', label: 'Salary' },
            { value: 'freelance', label: 'Freelance' },
            { value: 'investment', label: 'Investment' },
            { value: 'other-income', label: 'Other' }
        ];

        const expenseCategories = [
            { value: 'food', label: 'Food & Dining' },
            { value: 'transport', label: 'Transport' },
            { value: 'shopping', label: 'Shopping' },
            { value: 'bills', label: 'Bills & Utilities' },
            { value: 'entertainment', label: 'Entertainment' },
            { value: 'education', label: 'Education' },
            { value: 'health', label: 'Health' },
            { value: 'other-expense', label: 'Other' }
        ];

        const categories = type === 'income' ? incomeCategories : expenseCategories;
        
        categorySelect.innerHTML = '';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.value;
            option.textContent = cat.label;
            categorySelect.appendChild(option);
        });
    }

    handleTransactionSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const transaction = {
        type: formData.get('type'),
        amount: parseFloat(formData.get('amount')),
        category: formData.get('category'),
        date: formData.get('date'),
        description: formData.get('description') || '',
        recurring: formData.get('recurring') === 'on',
        timestamp: Date.now()
    };

    this.transactions.add(transaction);
    this.render();
    e.target.reset();
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transaction-date').value = today;
    this.updateCategoryOptions('income');
    
    this.ui.showToast('Transaction added successfully!', 'success');
}

handleUndo() {
    if (this.transactions.undo()) {
        this.render();
        this.ui.showToast('Transaction undone', 'success');
    }
}

handleRedo() {
    if (this.transactions.redo()) {
        this.render();
        this.ui.showToast('Transaction redone', 'success');
    }
}

    checkRecurringTransactions() {
        const lastCheck = this.storage.get('lastRecurringCheck') || 0;
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (now - lastCheck > oneDay) {
            this.transactions.processRecurring();
            this.storage.set('lastRecurringCheck', now);
            this.render();
        }
    }

    render() {
        // Placeholder - will be implemented later
        console.log('Render called');
    }
}

// Initialize app
const app = new FinanceApp();
window.app = app;
