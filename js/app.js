import { StorageManager } from './modules/storage.js';
import { TransactionManager } from './modules/transactions.js';
import { BudgetManager } from './modules/budgets.js';
import { ChartManager } from './modules/charts.js';
import { UIManager } from './modules/ui.js';
import { ThemeManager } from './modules/theme.js';
import { ExportManager } from './modules/export.js';
import { AuthManager } from './modules/auth.js';
import { FinancialHealthScore } from './modules/financialHealth.js';

class FinanceApp {
    constructor() {
        this.auth = new AuthManager();
        this.storage = new StorageManager();
        this.transactions = new TransactionManager(this.storage);
        this.budgets = new BudgetManager(this.storage);
        this.charts = new ChartManager();
        this.ui = new UIManager();
        this.theme = new ThemeManager();
        this.export = new ExportManager();
        this.financialHealth = new FinancialHealthScore();

        // Edit mode state
        this.editMode = false;
        this.editingTimestamp = null;

        // Bulk delete state
        this.selectMode = false;
        this.selectedTransactions = new Set();

        // Confirmation modal state
        this.confirmCallback = null;

        // Don't call init() here - it will be called from DOM ready event
    }

    async init() {
        try {
            console.log('FinanceApp initializing...');

            // Clear any stale guest mode data from previous sessions
            await this.clearStaleGuestData();

            // Check authentication first
            if (!(await this.checkAuthentication())) {
                console.log('Authentication failed, redirecting...');
                return; // Redirect to login handled in checkAuthentication
            }

            console.log('Authentication successful, continuing initialization...');

            // Initialize theme
            this.theme.init();

            // Setup user-specific storage
            await this.setupUserStorage();

            // Load data
            await this.loadData();

            // Setup event listeners
            this.setupEventListeners();

            // Setup hamburger menu
            this.setupHamburgerMenu();

            // Setup custom step for amount inputs
            this.setupCustomStep();

            // Setup section navigation
            this.setupSectionNavigation();

            // Setup user profile
            await this.setupUserProfile();

            // Initial render
            await this.render();

            // Check for recurring transactions
            await this.checkRecurringTransactions();

            // Check URL parameters for section navigation
            const urlParams = new URLSearchParams(window.location.search);
            const section = urlParams.get('section');

            // Show requested section or dashboard by default
            this.showSection(section || 'dashboard');

            console.log('FinanceApp initialized successfully');
        } catch (error) {
            console.error('Error initializing FinanceApp:', error);
        }
    }

    // Clear any stale guest mode data that might be left from previous sessions
    async clearStaleGuestData() {
        const guestMode = localStorage.getItem('moneymate_guestMode');
        const guestSession = localStorage.getItem('moneymate_guestSession');

        if (guestMode && guestSession) {
            const sessionTime = parseInt(guestSession);
            const now = Date.now();
            const twentyFourHours = 24 * 60 * 60 * 1000;

            // If guest session is older than 24 hours, clear it
            if (now - sessionTime > twentyFourHours) {
                console.log('Clearing expired guest session data');
                localStorage.removeItem('moneymate_guestMode');
                localStorage.removeItem('moneymate_guestSession');
            }
        } else if (guestMode && !guestSession) {
            // If guest mode is set but no session timestamp, clear it (invalid state)
            console.log('Clearing invalid guest mode data');
            localStorage.removeItem('moneymate_guestMode');
        }
    }

    // Authentication Methods
    async checkAuthentication() {
        // Check if user is in valid guest mode (explicitly chosen from login page)
        const isGuestMode = localStorage.getItem('moneymate_guestMode') === 'true';

        if (isGuestMode) {
            // Check if guest session is still valid (24 hours)
            const guestSession = localStorage.getItem('moneymate_guestSession');
            if (guestSession) {
                const sessionTime = parseInt(guestSession);
                const now = Date.now();
                const twentyFourHours = 24 * 60 * 60 * 1000;

                if (now - sessionTime > twentyFourHours) {
                    // Guest session expired
                    localStorage.removeItem('moneymate_guestMode');
                    localStorage.removeItem('moneymate_guestSession');
                    console.log('Guest session expired, redirecting to login...');
                    this.redirectToLogin();
                    return false;
                }
            }

            // Valid guest mode - user explicitly chose this
            console.log('Valid guest mode session found');
            this.isGuestMode = true;
            return true;
        }

        // Check if user is logged in
        if (!(await this.auth.checkAuthStatus())) {
            // No authentication found - force redirect to login page
            console.log('No authentication found, redirecting to login...');
            this.redirectToLogin();
            return false;
        }

        // User is properly logged in
        this.isGuestMode = false;
        this.currentUser = this.auth.getCurrentUser();
        console.log('User authenticated:', this.currentUser.email);
        return true;
    }

    redirectToLogin() {
        // Clear any existing authentication data
        localStorage.removeItem('moneymate_guestMode');
        localStorage.removeItem('moneymate_guestSession');
        console.log('Redirecting to login page...');
        window.location.href = 'login.html';
    }

    async setupUserStorage() {
        if (this.isGuestMode) {
            // Use default storage keys for guest mode
            return;
        }

        // Update storage manager to use user-specific keys
        const originalGet = this.storage.get.bind(this.storage);
        const originalSet = this.storage.set.bind(this.storage);

        this.storage.get = async (key) => {
            const userKey = this.auth.getUserStorageKey(key);
            return await originalGet(userKey);
        };

        this.storage.set = async (key, value) => {
            const userKey = this.auth.getUserStorageKey(key);
            return await originalSet(userKey, value);
        };
    }

    async setupUserProfile() {
        if (this.isGuestMode) {
            this.setupGuestProfile();
            return;
        }

        // Update user profile display
        const user = this.currentUser;
        const userProfileElement = document.getElementById('user-profile');

        if (userProfileElement) {
            userProfileElement.innerHTML = `
                <div class="user-info">
                    <span class="user-avatar">${user.profile.avatar}</span>
                    <div class="user-details">
                        <span class="user-name">${user.profile.firstName} ${user.profile.lastName}</span>
                        <span class="user-role">${user.profile.role}</span>
                    </div>
                </div>
                <div class="user-actions">
                    <button class="btn-icon" onclick="app.showUserMenu()" aria-label="User menu">
                        ⚙️
                    </button>
                    <button class="btn-icon" onclick="app.logout()" aria-label="Logout">
                        🚪
                    </button>
                </div>
            `;
        }

        // Update user stats
        this.updateUserStats();
    }

    setupGuestProfile() {
        const userProfileElement = document.getElementById('user-profile');

        if (userProfileElement) {
            userProfileElement.innerHTML = `
                <div class="user-info">
                    <span class="user-avatar">👤</span>
                    <div class="user-details">
                        <span class="user-name">Guest User</span>
                        <span class="user-role">Guest Mode</span>
                    </div>
                </div>
                <div class="user-actions">
                    <button class="btn-icon" onclick="app.redirectToLogin()" aria-label="Login" title="Login">
                        🔐
                    </button>
                    <button class="btn-icon" onclick="app.showUserMenu()" aria-label="User menu">
                        ⚙️
                    </button>
                </div>
            `;
        }
    }

    async loadData() {
        await this.transactions.init();
        await this.budgets.init();
    }

    setupEventListeners() {
        // Transaction form
        const form = document.getElementById('transaction-form');
        form.addEventListener('submit', async (e) => await this.handleTransactionSubmit(e));  // ✅ Made async

        // Transaction type change - update categories dynamically
        document.getElementById('transaction-type').addEventListener('change', (e) => {
            this.updateCategoryOptions(e.target.value);
        });

        // Undo/Redo
        document.getElementById('undo-btn').addEventListener('click', () => this.handleUndo());
        document.getElementById('redo-btn').addEventListener('click', () => this.handleRedo());

        // Cancel edit button
        document.getElementById('cancel-edit-btn').addEventListener('click', () => this.cancelEdit());

        // Bulk delete buttons
        document.getElementById('select-mode-btn').addEventListener('click', () => this.toggleSelectMode());
        document.getElementById('select-all-btn').addEventListener('click', () => this.selectAllVisible());
        document.getElementById('delete-selected-btn').addEventListener('click', () => this.deleteSelected());
        document.getElementById('delete-all-btn').addEventListener('click', () => this.deleteAll());

        // Search and filters
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', this.debounce(() => this.render(), 300));

        document.getElementById('filter-type').addEventListener('change', (e) => {
            this.updateCategoryFilterByType(e.target.value);
            // Don't call render() here as it will override our smart filter
            // Instead, manually update what's needed
            this.renderFilteredResults();
        });
        document.getElementById('filter-category').addEventListener('change', () => this.render());
        document.getElementById('sort-by').addEventListener('change', () => this.render());

        // Budget
        document.getElementById('add-budget-btn').addEventListener('click', () => this.ui.openBudgetModal());
        document.getElementById('budget-form').addEventListener('submit', async (e) => await this.handleBudgetSubmit(e));  // ✅ Made async

        // Confirmation modal
        document.getElementById('confirm-yes').addEventListener('click', () => this.handleConfirmYes());
        document.querySelectorAll('.confirm-cancel').forEach(btn => {
            btn.addEventListener('click', () => this.closeConfirmModal());
        });

        // Export
        document.getElementById('export-json-btn').addEventListener('click', () => this.handleExportJSON());
        document.getElementById('export-csv-btn').addEventListener('click', () => this.handleExportCSV());

        // Import (Phase 2)
        this.setupImportListeners();

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.theme.toggle();
            // Re-render charts to update colors for new theme
            this.updateCharts();
        });

        // Modal close - improved to handle different modal types
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    if (modal.id === 'import-modal') {
                        this.closeImportModal();
                    } else {
                        this.ui.closeModal();
                    }
                }
            });
        });

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

        // Clear existing options
        categorySelect.innerHTML = '';

        // Add new options
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.value;
            option.textContent = cat.label;
            categorySelect.appendChild(option);
        });
    }

    async handleTransactionSubmit(e) {  // ✅ Made async
        e.preventDefault();
        const formData = new FormData(e.target);

        const transaction = {
            type: formData.get('type'),
            amount: parseFloat(formData.get('amount')),
            category: formData.get('category'),
            date: formData.get('date'),
            description: formData.get('description') || '',
            recurring: formData.get('recurring') === 'on',
            timestamp: this.editMode ? this.editingTimestamp : Date.now()
        };

        // Validate expense against current balance
        if (transaction.type === 'expense') {
            const currentStats = await this.transactions.getStats();  // ✅ Added await
            const currentBalance = currentStats.balance;

            // If editing, add back the old transaction amount to balance
            let availableBalance = currentBalance;
            if (this.editMode) {
                const allTransactions = await this.transactions.getAll();  // ✅ Added await
                const oldTransaction = allTransactions.find(t => t.timestamp === this.editingTimestamp);
                if (oldTransaction && oldTransaction.type === 'expense') {
                    availableBalance += oldTransaction.amount;
                }
            }

            if (transaction.amount > availableBalance) {
                this.ui.showToast(`Insufficient balance! Available: ₹${availableBalance.toFixed(2)}`, 'error');
                return;
            }
        }

        if (this.editMode) {
            // Update existing transaction
            await this.transactions.delete(this.editingTimestamp);  // ✅ Added await
            await this.transactions.add(transaction);  // ✅ Added await
            this.ui.showToast('Transaction updated successfully!', 'success');
            this.cancelEdit();
        } else {
            // Add new transaction
            await this.transactions.add(transaction);  // ✅ Added await
            this.ui.showToast('Transaction added successfully! 🎉', 'success');
        }

        await this.render();  // ✅ Added await
        e.target.reset();

        // Reset date to today and update categories for default type (income)
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('transaction-date').value = today;
        this.updateCategoryOptions('income');

        // Navigate back to dashboard after adding transaction
        if (!this.editMode) {
            setTimeout(() => {
                this.showSection('dashboard');
            }, 1500); // Give time to see the success message
        }
    }

    async handleBudgetSubmit(e) {  // ✅ Made async
        e.preventDefault();
        const formData = new FormData(e.target);

        const budget = {
            category: formData.get('category') || document.getElementById('budget-category').value,
            limit: parseFloat(document.getElementById('budget-amount').value)
        };

        await this.budgets.set(budget.category, budget.limit);  // ✅ Added await
        await this.render();  // ✅ Added await
        this.ui.closeModal();
        this.ui.showToast('Budget set successfully!', 'success');
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

    handleExportJSON() {
        // Check if select mode is active and transactions are selected
        if (this.selectMode && this.selectedTransactions.size > 0) {
            // Export only selected transactions
            const allTransactions = this.transactions.getAll();
            const selectedTransactions = allTransactions.filter(t =>
                this.selectedTransactions.has(t.timestamp)
            );

            const data = {
                transactions: selectedTransactions,
                budgets: this.budgets.getAll()
            };

            this.export.toJSON(data, `selected-transactions-${selectedTransactions.length}.json`);
            this.ui.showToast(`${selectedTransactions.length} selected transactions exported as JSON`, 'success');
        } else {
            // Export all transactions (normal behavior)
            const data = {
                transactions: this.transactions.getAll(),
                budgets: this.budgets.getAll()
            };
            this.export.toJSON(data, 'finance-data.json');
            this.ui.showToast('All data exported as JSON', 'success');
        }
    }

    handleExportCSV() {
        // Check if select mode is active and transactions are selected
        if (this.selectMode && this.selectedTransactions.size > 0) {
            // Export only selected transactions
            const allTransactions = this.transactions.getAll();
            const selectedTransactions = allTransactions.filter(t =>
                this.selectedTransactions.has(t.timestamp)
            );

            this.export.toCSV(selectedTransactions, `selected-transactions-${selectedTransactions.length}.csv`);
            this.ui.showToast(`${selectedTransactions.length} selected transactions exported as CSV`, 'success');
        } else {
            // Export all transactions (normal behavior)
            this.export.toCSV(this.transactions.getAll(), 'transactions.csv');
            this.ui.showToast('All transactions exported as CSV', 'success');
        }
    }

    async render() {
        // Get filtered and sorted transactions
        const searchTerm = document.getElementById('search-input').value;
        const filterType = document.getElementById('filter-type').value;
        const filterCategory = document.getElementById('filter-category').value;
        const sortBy = document.getElementById('sort-by').value;

        let transactions = await this.transactions.getAll();  // ✅ Added await

        // Apply filters
        if (searchTerm) {
            transactions = transactions.filter(t =>
                t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.category.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterType !== 'all') {
            transactions = transactions.filter(t => t.type === filterType);
        }

        if (filterCategory !== 'all') {
            transactions = transactions.filter(t => t.category === filterCategory);
        }

        // Sort
        transactions = this.sortTransactions(transactions, sortBy);

        // Update balance
        await this.updateBalance();  // ✅ Added await

        // Render transactions with pagination
        this.renderTransactions(transactions);

        // Update budgets
        await this.renderBudgets();  // ✅ Added await

        // Update charts
        await this.updateCharts();  // ✅ Added await

        // Update Financial Health Score
        await this.updateFinancialHealthScore();

        // Update undo/redo buttons
        this.updateUndoRedoButtons();

        // Update category filter dropdown
        this.updateCategoryFilter();

        // Update user stats (Phase 1)
        this.updateUserStats();
    }

    sortTransactions(transactions, sortBy) {
        const sorted = [...transactions];

        switch (sortBy) {
            case 'date-desc':
                return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
            case 'date-asc':
                return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
            case 'amount-desc':
                return sorted.sort((a, b) => b.amount - a.amount);
            case 'amount-asc':
                return sorted.sort((a, b) => a.amount - b.amount);
            default:
                return sorted;
        }
    }

    async updateBalance() {
        const stats = await this.transactions.getStats();  // ✅ Added await
        document.getElementById('total-balance').textContent = `₹${stats.balance.toFixed(2)}`;
        document.getElementById('total-income').textContent = `₹${stats.income.toFixed(2)}`;
        document.getElementById('total-expense').textContent = `₹${stats.expense.toFixed(2)}`;
    }

    renderTransactions(transactions, page = 1, perPage = 10) {
        const list = document.getElementById('transactions-list');
        const totalPages = Math.ceil(transactions.length / perPage);
        const start = (page - 1) * perPage;
        const end = start + perPage;
        const pageTransactions = transactions.slice(start, end);

        if (pageTransactions.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No transactions found</p>';
            document.getElementById('pagination').innerHTML = '';
            return;
        }

        list.innerHTML = pageTransactions.map(t => `
            <div class="transaction-item ${this.selectMode ? 'select-mode' : ''} ${this.selectedTransactions.has(t.timestamp) ? 'selected' : ''}" role="listitem">
                ${this.selectMode ? `
                    <input type="checkbox" 
                           class="transaction-checkbox" 
                           data-timestamp="${t.timestamp}"
                           onchange="app.toggleTransactionSelection(${t.timestamp})"
                           ${this.selectedTransactions.has(t.timestamp) ? 'checked' : ''}>
                ` : ''}
                <div class="transaction-info">
                    <div class="transaction-header">
                        <span class="transaction-category">${t.category.replace('-', ' ')}</span>
                        ${t.recurring ? '<span class="transaction-badge">🔄 Recurring</span>' : ''}
                    </div>
                    ${t.description ? `<div class="transaction-description">${t.description}</div>` : ''}
                    <div class="transaction-date">${new Date(t.date).toLocaleDateString('en-IN')}</div>
                </div>
                <div class="transaction-amount transaction-amount--${t.type}">
                    ${t.type === 'income' ? '+' : '-'}₹${t.amount.toFixed(2)}
                </div>
                <div class="transaction-actions">
                    ${!this.selectMode ? `
                        <button class="btn-edit" onclick="app.editTransaction(${t.timestamp})" aria-label="Edit transaction">
                            ✏️
                        </button>
                        <button class="btn-delete" onclick="app.deleteTransaction(${t.timestamp})" aria-label="Delete transaction">
                            🗑️
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // Render pagination
        this.renderPagination(page, totalPages, transactions);
    }

    renderPagination(currentPage, totalPages, transactions) {
        const pagination = document.getElementById('pagination');

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        pagination.innerHTML = `
            <button ${currentPage === 1 ? 'disabled' : ''} onclick="app.changePage(${currentPage - 1})">
                Previous
            </button>
            <span class="page-info">Page ${currentPage} of ${totalPages}</span>
            <button ${currentPage === totalPages ? 'disabled' : ''} onclick="app.changePage(${currentPage + 1})">
                Next
            </button>
        `;

        this.currentPage = currentPage;
        this.currentTransactions = transactions;
    }

    changePage(page) {
        this.renderTransactions(this.currentTransactions, page);
    }

    deleteTransaction(timestamp) {
        this.showConfirmModal(
            'Are you sure you want to delete this transaction?',
            () => {
                this.transactions.delete(timestamp);
                this.render();
                this.ui.showToast('Transaction deleted', 'success');
            }
        );
    }

    async renderBudgets() {
        const budgets = await this.budgets.getAll();  // ✅ Added await
        const budgetList = document.getElementById('budget-list');
        const budgetAlerts = document.getElementById('budget-alerts');

        if (Object.keys(budgets).length === 0) {
            budgetList.innerHTML = '<p style="color: var(--text-secondary);">No budgets set. Click "Add Budget" to get started.</p>';
            budgetAlerts.innerHTML = '';
            return;
        }

        const spending = await this.transactions.getSpendingByCategory();  // ✅ Added await
        let alerts = [];

        budgetList.innerHTML = Object.entries(budgets).map(([category, limit]) => {
            const spent = spending[category] || 0;
            const percentage = (spent / limit) * 100;
            const remaining = limit - spent;

            let progressClass = '';
            if (percentage >= 100) {
                progressClass = 'budget-progress-bar--danger';
                alerts.push({ category, type: 'danger', message: `Budget exceeded for ${category}!` });
            } else if (percentage >= 80) {
                progressClass = 'budget-progress-bar--warning';
                alerts.push({ category, type: 'warning', message: `${category} budget is ${percentage.toFixed(0)}% used` });
            }

            return `
                <div class="budget-item" onclick="app.openBudgetOptions('${category}', ${limit})" style="cursor: pointer;">
                    <div class="budget-header">
                        <span class="budget-category">${category.replace('-', ' ')}</span>
                        <span class="budget-amount">₹${spent.toFixed(2)} / ₹${limit.toFixed(2)}</span>
                    </div>
                    <div class="budget-progress">
                        <div class="budget-progress-bar ${progressClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <small style="color: var(--text-secondary);">
                        ${remaining > 0 ? `₹${remaining.toFixed(2)} remaining` : `₹${Math.abs(remaining).toFixed(2)} over budget`}
                    </small>
                </div>
            `;
        }).join('');

        budgetAlerts.innerHTML = alerts.map(alert => `
            <div class="budget-alert budget-alert--${alert.type}">
                ${alert.type === 'danger' ? '⚠️' : '⚡'} ${alert.message}
            </div>
        `).join('');
    }

    async updateCharts() {
        const transactions = await this.transactions.getAll();  // ✅ Added await
        const expenses = transactions.filter(t => t.type === 'expense');

        // Category breakdown - NO ANIMATION (animation code removed)
        const categoryData = await this.transactions.getSpendingByCategory();
        this.charts.renderPieChart('category-chart', categoryData);

        // Spending trend
        const trendData = await this.transactions.getSpendingTrend();  // ✅ Added await
        this.charts.renderLineChart('trend-chart', trendData);

        // Budget vs Spending comparison
        const budgetData = await this.budgets.getAll();  // ✅ Added await
        const spendingData = await this.transactions.getSpendingByCategory();  // ✅ Added await
        this.charts.renderDoubleBarChart('budget-chart', budgetData, spendingData);
    }

    async updateFinancialHealthScore() {
        try {
            const stats = await this.transactions.getStats();
            const budgets = await this.budgets.getAll();
            const spendingByCategory = await this.transactions.getSpendingByCategory();
            const transactions = await this.transactions.getAll();

            // Calculate score
            const scoreData = this.financialHealth.calculateScore({
                totalIncome: stats.income,
                totalExpenses: stats.expense,
                budgets,
                spendingByCategory,
                transactions,
                savingsBalance: stats.balance
            });

            // Update score display
            this.animateScore(scoreData.score);
            document.getElementById('health-grade').textContent = scoreData.grade;
            document.getElementById('health-score-message').textContent = scoreData.message;

            // Update circular progress
            this.updateScoreCircle(scoreData.score);

            // Render breakdown
            this.renderScoreBreakdown();

            // Show improvement tips if score is below 80
            if (scoreData.score < 80) {
                this.renderImprovementTips(scoreData.score);
            } else {
                document.getElementById('score-tips').style.display = 'none';
            }
        } catch (error) {
            console.error('Error updating financial health score:', error);
        }
    }

    animateScore(targetScore) {
        const scoreElement = document.getElementById('health-score-number');
        const duration = 1500; // 1.5 seconds
        const startTime = performance.now();
        const startScore = parseInt(scoreElement.textContent) || 0;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = this.easeOutCubic(progress);

            const currentScore = Math.round(startScore + (targetScore - startScore) * easedProgress);
            scoreElement.textContent = currentScore;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    updateScoreCircle(score) {
        const circle = document.getElementById('score-progress-circle');
        const circumference = 2 * Math.PI * 72; // radius is 72 for compact design
        const offset = circumference - (score / 100) * circumference;

        // Get color based on score
        const color = this.financialHealth.getScoreColor(score);

        circle.style.strokeDashoffset = offset;
        circle.style.stroke = color;
    }

    renderScoreBreakdown() {
        const breakdown = this.financialHealth.getBreakdownDetails();
        const container = document.getElementById('score-breakdown');

        container.innerHTML = breakdown.map(item => {
            const percentage = (item.score / item.maxScore) * 100;
            const color = percentage >= 80 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444';

            return `
                <div class="breakdown-item">
                    <div class="breakdown-header">
                        <span class="breakdown-name">
                            <span class="breakdown-icon">${item.icon}</span>
                            ${item.name}
                        </span>
                        <span class="breakdown-score">${item.score}/${item.maxScore}</span>
                    </div>
                    <div class="breakdown-progress">
                        <div class="breakdown-progress-bar" 
                             style="width: ${percentage}%; background-color: ${color};"></div>
                    </div>
                    <div class="breakdown-tip">${item.tip}</div>
                </div>
            `;
        }).join('');
    }

    renderImprovementTips(score) {
        const tipsContainer = document.getElementById('tips-list');
        const tipsSection = document.getElementById('score-tips');

        const tips = [];

        // Generate personalized tips based on breakdown
        const breakdown = this.financialHealth.breakdown;

        if (breakdown.savingsRate < 20) {
            tips.push({
                icon: '💰',
                text: 'Try to save at least 20% of your income each month'
            });
        }

        if (breakdown.budgetAdherence < 20) {
            tips.push({
                icon: '🎯',
                text: 'Set realistic budgets and track your spending regularly'
            });
        }

        if (breakdown.emergencyFund < 15) {
            tips.push({
                icon: '🛡️',
                text: 'Build an emergency fund covering 3-6 months of expenses'
            });
        }

        if (breakdown.spendingConsistency < 10) {
            tips.push({
                icon: '📊',
                text: 'Maintain consistent spending patterns to avoid surprises'
            });
        }

        // Always show at least one general tip
        if (tips.length === 0) {
            tips.push({
                icon: '🚀',
                text: 'Keep up the good work! Small improvements add up over time'
            });
        }

        tipsContainer.innerHTML = tips.map(tip => `
            <div class="tip-item">
                <span class="tip-icon">${tip.icon}</span>
                <span>${tip.text}</span>
            </div>
        `).join('');

        tipsSection.style.display = 'block';
    }


    updateUndoRedoButtons() {
        document.getElementById('undo-btn').disabled = !this.transactions.canUndo();
        document.getElementById('redo-btn').disabled = !this.transactions.canRedo();
    }

    updateCategoryFilter() {
        const filterCategory = document.getElementById('filter-category');
        const allTransactions = this.transactions.getAll();

        // Get unique categories from all transactions
        const categories = [...new Set(allTransactions.map(t => t.category))];

        // Save current selection
        const currentValue = filterCategory.value;

        // Clear existing options except "All Categories"
        filterCategory.innerHTML = '<option value="all">All Categories</option>';

        // Add unique categories
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = this.formatCategoryName(category);
            filterCategory.appendChild(option);
        });

        // Restore previous selection if it still exists
        if (categories.includes(currentValue)) {
            filterCategory.value = currentValue;
        }
    }

    checkRecurringTransactions() {
        // Check if any recurring transactions need to be added
        const lastCheck = this.storage.get('lastRecurringCheck') || 0;
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        if (now - lastCheck > oneDay) {
            this.transactions.processRecurring();
            this.storage.set('lastRecurringCheck', now);
            this.render();
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Edit Transaction Methods
    async editTransaction(timestamp) {
        const transactions = await this.transactions.getAll();
        const transaction = transactions.find(t => t.timestamp === timestamp);
        if (!transaction) {
            this.ui.showToast('Transaction not found', 'error');
            return;
        }

        // Enter edit mode
        this.editMode = true;
        this.editingTimestamp = timestamp;

        // Populate form with transaction data
        document.getElementById('transaction-type').value = transaction.type;
        this.updateCategoryOptions(transaction.type);
        document.getElementById('transaction-amount').value = transaction.amount;
        document.getElementById('transaction-category').value = transaction.category;
        document.getElementById('transaction-date').value = transaction.date;
        document.getElementById('transaction-description').value = transaction.description || '';
        document.getElementById('transaction-recurring').checked = transaction.recurring || false;

        // Update UI for edit mode
        const submitBtn = document.getElementById('transaction-submit-btn');
        const cancelBtn = document.getElementById('cancel-edit-btn');
        submitBtn.textContent = 'Update Transaction';
        cancelBtn.style.display = 'inline-block';

        // Navigate to add-transaction section
        this.showSection('add-transaction');

        // Scroll to form
        setTimeout(() => {
            document.getElementById('transaction-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

        this.ui.showToast('Edit mode activated', 'info');
    }

    cancelEdit() {
        // Exit edit mode
        this.editMode = false;
        this.editingTimestamp = null;

        // Reset form
        document.getElementById('transaction-form').reset();

        // Reset date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('transaction-date').value = today;
        this.updateCategoryOptions('income');

        // Update UI
        const submitBtn = document.getElementById('transaction-submit-btn');
        const cancelBtn = document.getElementById('cancel-edit-btn');
        submitBtn.textContent = 'Add Transaction';
        cancelBtn.style.display = 'none';
    }

    // Bulk Delete Methods
    toggleSelectMode() {
        this.selectMode = !this.selectMode;
        this.selectedTransactions.clear();

        const selectBtn = document.getElementById('select-mode-btn');
        const selectAllBtn = document.getElementById('select-all-btn');
        const deleteSelectedBtn = document.getElementById('delete-selected-btn');
        const transactionsList = document.getElementById('transactions-list');

        if (this.selectMode) {
            selectBtn.textContent = 'Cancel';
            selectBtn.classList.add('btn-secondary');
            selectAllBtn.style.display = 'inline-block';
            deleteSelectedBtn.style.display = 'inline-block';
            transactionsList.classList.add('select-mode-active');
        } else {
            selectBtn.textContent = 'Select';
            selectBtn.classList.remove('btn-secondary');
            selectAllBtn.style.display = 'none';
            deleteSelectedBtn.style.display = 'none';
            transactionsList.classList.remove('select-mode-active');
        }

        this.render();
    }

    selectAllVisible() {
        // Get currently visible transactions (after filters)
        const searchTerm = document.getElementById('search-input').value;
        const filterType = document.getElementById('filter-type').value;
        const filterCategory = document.getElementById('filter-category').value;
        const sortBy = document.getElementById('sort-by').value;

        let transactions = this.transactions.getAll();

        // Apply same filters as in render() method
        if (searchTerm) {
            transactions = transactions.filter(t =>
                t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.category.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterType !== 'all') {
            transactions = transactions.filter(t => t.type === filterType);
        }

        if (filterCategory !== 'all') {
            transactions = transactions.filter(t => t.category === filterCategory);
        }

        // Sort transactions
        transactions = this.sortTransactions(transactions, sortBy);

        // Select all visible transactions
        transactions.forEach(transaction => {
            this.selectedTransactions.add(transaction.timestamp);
        });

        // Re-render to show selected state
        this.render();

        // Show success message
        this.ui.showToast(`${transactions.length} visible transactions selected`, 'success');
    }

    toggleTransactionSelection(timestamp) {
        if (this.selectedTransactions.has(timestamp)) {
            this.selectedTransactions.delete(timestamp);
        } else {
            this.selectedTransactions.add(timestamp);
        }

        // Update checkbox state
        const checkbox = document.querySelector(`input[data-timestamp="${timestamp}"]`);
        if (checkbox) {
            checkbox.checked = this.selectedTransactions.has(timestamp);
        }

        // Update transaction item appearance
        const transactionItem = checkbox?.closest('.transaction-item');
        if (transactionItem) {
            if (this.selectedTransactions.has(timestamp)) {
                transactionItem.classList.add('selected');
            } else {
                transactionItem.classList.remove('selected');
            }
        }

        // Update delete selected button text
        const deleteSelectedBtn = document.getElementById('delete-selected-btn');
        const count = this.selectedTransactions.size;
        deleteSelectedBtn.textContent = count > 0 ? `Delete Selected (${count})` : 'Delete Selected';
    }

    deleteSelected() {
        if (this.selectedTransactions.size === 0) {
            this.ui.showToast('No transactions selected', 'error');
            return;
        }

        const count = this.selectedTransactions.size;
        const message = `Are you sure you want to delete ${count} selected transaction${count > 1 ? 's' : ''}? This action cannot be undone.`;

        this.showConfirmModal(message, () => {
            this.selectedTransactions.forEach(timestamp => {
                this.transactions.delete(timestamp);
            });

            this.selectedTransactions.clear();
            this.selectMode = false;
            this.toggleSelectMode(); // Reset select mode
            this.render();

            this.ui.showToast(`${count} transaction${count > 1 ? 's' : ''} deleted successfully`, 'success');
        });
    }

    deleteAll() {
        const allTransactions = this.transactions.getAll();

        if (allTransactions.length === 0) {
            this.ui.showToast('No transactions to delete', 'error');
            return;
        }

        const count = allTransactions.length;
        const message = `Are you sure you want to delete ALL ${count} transactions? This action cannot be undone.`;

        this.showConfirmModal(message, () => {
            // Delete all transactions
            allTransactions.forEach(transaction => {
                this.transactions.delete(transaction.timestamp);
            });

            // Reset select mode if active
            if (this.selectMode) {
                this.selectMode = false;
                this.toggleSelectMode();
            }

            this.render();
            this.ui.showToast(`All ${count} transactions deleted successfully`, 'success');
        });
    }

    // Confirmation Modal Methods
    showConfirmModal(message, callback, buttonText = 'Delete', title = 'Confirm Action') {
        this.confirmCallback = callback;
        document.getElementById('confirm-message').textContent = message;
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-yes').textContent = buttonText;
        document.getElementById('confirm-modal').classList.add('active');
    }

    closeConfirmModal() {
        this.confirmCallback = null;
        document.getElementById('confirm-modal').classList.remove('active');
    }

    handleConfirmYes() {
        if (this.confirmCallback) {
            this.confirmCallback();
            this.confirmCallback = null;
        }
        this.closeConfirmModal();
    }

    // Budget Edit/Delete Methods
    openBudgetOptions(category, currentLimit) {
        // Create modal HTML
        const modalHTML = `
            <div class="modal active" id="budget-options-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Manage Budget: ${category.replace('-', ' ')}</h3>
                        <button class="modal-close" onclick="app.closeBudgetOptions()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="edit-budget-amount">Budget Limit (₹)</label>
                            <input 
                                type="number" 
                                id="edit-budget-amount" 
                                value="${currentLimit}" 
                                min="1" 
                                step="0.01"
                                required
                            >
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="app.updateBudget('${category}')">Update Budget</button>
                        <button class="btn btn-danger" onclick="app.deleteBudget('${category}')">Delete Budget</button>
                        <button class="btn btn-secondary modal-cancel" onclick="app.closeBudgetOptions()">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('budget-options-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Apply custom step to the edit budget input
        this.setupCustomStepForInput('edit-budget-amount');
    }

    closeBudgetOptions() {
        const modal = document.getElementById('budget-options-modal');
        if (modal) {
            modal.remove();
        }
    }

    updateBudget(category) {
        const newLimit = parseFloat(document.getElementById('edit-budget-amount').value);

        if (!newLimit || newLimit <= 0) {
            this.ui.showToast('Please enter a valid budget amount', 'error');
            return;
        }

        this.budgets.set(category, newLimit);
        this.closeBudgetOptions();
        this.render();
        this.ui.showToast('Budget updated successfully!', 'success');
    }

    deleteBudget(category) {
        const message = `Are you sure you want to delete the budget for ${category.replace('-', ' ')}?`;

        this.showConfirmModal(message, () => {
            this.budgets.delete(category);
            this.closeBudgetOptions();
            this.render();
            this.ui.showToast('Budget deleted successfully!', 'success');
        });
    }

    // Hamburger Menu
    setupHamburgerMenu() {
        const hamburger = document.getElementById('hamburger-menu');
        const navMenu = document.getElementById('nav-menu');

        if (!hamburger || !navMenu) return;

        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking nav links
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }

    // Custom Step for Amount Inputs
    setupCustomStep() {
        const amountInputs = [
            document.getElementById('transaction-amount'),
            document.getElementById('budget-amount')
        ];

        amountInputs.forEach(input => {
            if (!input) return;

            let isSpinnerClick = false;
            let previousValue = input.value;

            // Intercept mousedown on spinner buttons
            input.addEventListener('mousedown', (e) => {
                // Check if click is on spinner area (right side of input)
                const rect = input.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const inputWidth = rect.width;

                // Spinner is typically in the last 20px
                if (clickX > inputWidth - 25) {
                    isSpinnerClick = true;
                    previousValue = input.value;
                }
            });

            // Handle keyboard arrow keys
            input.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const currentValue = parseFloat(input.value) || 0;
                    input.value = currentValue + 100;
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const currentValue = parseFloat(input.value) || 0;
                    const newValue = currentValue - 100;
                    input.value = newValue > 0 ? newValue : 0;
                }
            });

            // Handle spinner clicks
            input.addEventListener('input', () => {
                if (isSpinnerClick) {
                    const currentValue = parseFloat(input.value) || 0;
                    const prevValue = parseFloat(previousValue) || 0;

                    if (currentValue > prevValue) {
                        // Up clicked
                        input.value = prevValue + 100;
                    } else if (currentValue < prevValue) {
                        // Down clicked
                        const newValue = prevValue - 100;
                        input.value = newValue > 0 ? newValue : 0;
                    }

                    isSpinnerClick = false;
                }
            });
        });
    }

    // Helper function to setup custom step for a single input (for dynamic inputs)
    setupCustomStepForInput(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;

        let isSpinnerClick = false;
        let previousValue = input.value;

        // Intercept mousedown on spinner buttons
        input.addEventListener('mousedown', (e) => {
            // Check if click is on spinner area (right side of input)
            const rect = input.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const inputWidth = rect.width;

            // Spinner is typically in the last 20px
            if (clickX > inputWidth - 25) {
                isSpinnerClick = true;
                previousValue = input.value;
            }
        });

        // Handle keyboard arrow keys
        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                const currentValue = parseFloat(input.value) || 0;
                input.value = currentValue + 100;
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const currentValue = parseFloat(input.value) || 0;
                const newValue = currentValue - 100;
                input.value = newValue > 0 ? newValue : 0;
            }
        });

        // Handle spinner clicks
        input.addEventListener('input', () => {
            if (isSpinnerClick) {
                const currentValue = parseFloat(input.value) || 0;
                const prevValue = parseFloat(previousValue) || 0;

                if (currentValue > prevValue) {
                    // Up clicked
                    input.value = prevValue + 100;
                } else if (currentValue < prevValue) {
                    // Down clicked
                    const newValue = prevValue - 100;
                    input.value = newValue > 0 ? newValue : 0;
                }

                isSpinnerClick = false;
            }
        });
    }

    // Section Navigation System
    setupSectionNavigation() {
        // Handle navigation links
        const sectionLinks = document.querySelectorAll('[data-section]');
        console.log('Found section links:', sectionLinks.length);

        sectionLinks.forEach(link => {
            console.log('Setting up listener for:', link.dataset.section);
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('[data-section]').dataset.section;
                console.log('Navigating to section:', section);
                this.showSection(section);
            });
        });
    }

    showSection(sectionName) {
        console.log('showSection called with:', sectionName);

        // Validate section name
        const validSections = ['dashboard', 'add-transaction', 'history', 'budgets', 'settings'];
        if (!validSections.includes(sectionName)) {
            console.log('Invalid section, defaulting to dashboard');
            sectionName = 'dashboard';
        }

        // Hide all sections
        const allSections = document.querySelectorAll('.app-section');
        console.log('Found app sections:', allSections.length);
        allSections.forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(`${sectionName}-section`);
        console.log('Target section found:', targetSection ? 'yes' : 'no');
        if (targetSection) {
            targetSection.classList.add('active');
            console.log('Activated section:', sectionName);
        } else {
            // Fallback to dashboard if section not found
            const dashboardSection = document.getElementById('dashboard-section');
            if (dashboardSection) {
                dashboardSection.classList.add('active');
                sectionName = 'dashboard';
            }
        }

        // Update navigation active state
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        const activeNavLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeNavLink && activeNavLink.classList.contains('nav-link')) {
            activeNavLink.classList.add('active');
        }

        // Update page title and perform section-specific actions
        this.handleSectionChange(sectionName);
    }

    handleSectionChange(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                document.title = 'Dashboard - Money Mate';
                this.render(); // Update charts and balance
                break;
            case 'add-transaction':
                document.title = 'Add Transaction - Money Mate';
                // Focus on first form field
                setTimeout(() => {
                    document.getElementById('transaction-type').focus();
                }, 100);
                break;
            case 'history':
                document.title = 'Transaction History - Money Mate';
                this.render(); // Update transaction list
                break;
            case 'budgets':
                document.title = 'Budget Management - Money Mate';
                this.renderBudgets(); // Update budget display
                break;
            case 'settings':
                document.title = 'Settings - Money Mate';
                this.updateSettingsDisplay(); // Update settings display
                break;
        }

        // Close mobile menu if open
        const hamburger = document.getElementById('hamburger-menu');
        const navMenu = document.getElementById('nav-menu');
        if (hamburger && navMenu) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }

        // Clean URL parameters after section is loaded
        if (window.location.search) {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }

        // Show success message for navigation
        if (sectionName !== 'dashboard') {
            this.ui.showToast(`Switched to ${this.getSectionDisplayName(sectionName)}`, 'info');
        }
    }

    getSectionDisplayName(sectionName) {
        const displayNames = {
            'dashboard': 'Dashboard',
            'add-transaction': 'Add Transaction',
            'history': 'Transaction History',
            'budgets': 'Budget Management',
            'settings': 'Settings'
        };
        return displayNames[sectionName] || sectionName;
    }
    // Smart Category Filter - Updates categories based on selected type
    updateCategoryFilterByType(selectedType) {
        console.log('updateCategoryFilterByType called with:', selectedType);

        const filterCategory = document.getElementById('filter-category');
        const allTransactions = this.transactions.getAll();

        console.log('All transactions:', allTransactions.length);
        console.log('Filter category element found:', filterCategory ? 'yes' : 'no');

        // Save current selection
        const currentValue = filterCategory.value;

        // Clear existing options
        filterCategory.innerHTML = '<option value="all">All Categories</option>';

        let categoriesToShow = [];

        if (selectedType === 'all') {
            // Show all categories from all transactions
            categoriesToShow = [...new Set(allTransactions.map(t => t.category))];
            console.log('Showing all categories:', categoriesToShow);
        } else {
            // Show only categories for selected type (income or expense)
            const filteredTransactions = allTransactions.filter(t => t.type === selectedType);
            categoriesToShow = [...new Set(filteredTransactions.map(t => t.category))];
            console.log(`Showing ${selectedType} categories:`, categoriesToShow);
        }

        // Sort categories alphabetically
        categoriesToShow.sort();

        // Add categories to dropdown
        categoriesToShow.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = this.formatCategoryName(category);
            filterCategory.appendChild(option);
        });

        // Reset to "All Categories" when type changes (better UX)
        filterCategory.value = 'all';

        console.log('Category filter updated successfully');

        // Show helpful message
        if (selectedType !== 'all') {
            const typeLabel = selectedType === 'income' ? 'Income' : 'Expense';
            this.ui.showToast(`Showing ${typeLabel} categories only`, 'info');
        }
    }

    // Helper method to format category names nicely
    formatCategoryName(category) {
        return category
            .replace('-', ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }
    // Render filtered results without updating category filter
    renderFilteredResults() {
        // Get filtered and sorted transactions
        const searchTerm = document.getElementById('search-input').value;
        const filterType = document.getElementById('filter-type').value;
        const filterCategory = document.getElementById('filter-category').value;
        const sortBy = document.getElementById('sort-by').value;

        let transactions = this.transactions.getAll();

        // Apply filters
        if (searchTerm) {
            transactions = transactions.filter(t =>
                t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.category.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterType !== 'all') {
            transactions = transactions.filter(t => t.type === filterType);
        }

        if (filterCategory !== 'all') {
            transactions = transactions.filter(t => t.category === filterCategory);
        }

        // Sort
        transactions = this.sortTransactions(transactions, sortBy);

        // Update balance
        this.updateBalance();

        // Render transactions with pagination
        this.renderTransactions(transactions);

        // Update budgets
        this.renderBudgets();

        // Update charts
        this.updateCharts();

        // Update undo/redo buttons
        this.updateUndoRedoButtons();

        // DON'T update category filter here - that's the key difference from render()
    }

    // Authentication Methods - Phase 1 Completion
    logout() {
        this.showConfirmModal(
            'Are you sure you want to logout?',
            async () => {  // ✅ Made callback async
                await this.auth.logout();  // ✅ Added await
                this.ui.showToast('Logged out successfully!', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            },
            'Logout',
            'Confirm Logout'
        );
    }

    showUserMenu() {
        if (this.isGuestMode) {
            this.showGuestMenu();
            return;
        }

        const user = this.currentUser;
        const modalHTML = `
            <div class="modal active" id="user-menu-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>User Profile</h3>
                        <button class="modal-close" onclick="app.closeUserMenu()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="user-profile-details">
                            <div class="profile-avatar">
                                <span class="avatar-large">${user.profile.avatar}</span>
                            </div>
                            <div class="profile-info">
                                <h4>${user.profile.firstName} ${user.profile.lastName}</h4>
                                <p class="user-email">${user.email}</p>
                                <p class="user-role">${user.profile.role}</p>
                                <p class="join-date">Member since: ${new Date(user.profile.joinDate).toLocaleDateString('en-IN')}</p>
                            </div>
                        </div>
                        
                        <div class="user-stats">
                            <h5>Your Statistics</h5>
                            <div class="stats-grid">
                                <div class="stat-item">
                                    <span class="stat-label">Total Transactions</span>
                                    <span class="stat-value">${user.stats.totalTransactions}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Total Income</span>
                                    <span class="stat-value">₹${user.stats.totalIncome.toFixed(2)}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Total Expenses</span>
                                    <span class="stat-value">₹${user.stats.totalExpenses.toFixed(2)}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Budgets Set</span>
                                    <span class="stat-value">${user.stats.budgetsSet}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="app.editProfile()">Edit Profile</button>
                        <button class="btn btn-secondary" onclick="app.closeUserMenu()">Close</button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('user-menu-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    showGuestMenu() {
        const modalHTML = `
            <div class="modal active" id="guest-menu-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Guest Mode</h3>
                        <button class="modal-close" onclick="app.closeUserMenu()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="guest-info">
                            <p>👤 You are currently using Money Mate in Guest Mode.</p>
                            <p>Your data is stored locally and will be cleared after 24 hours.</p>
                            <p>Create an account to save your data permanently and access advanced features!</p>
                        </div>
                        
                        <div class="guest-actions">
                            <button class="btn btn-primary" onclick="app.redirectToSignup()">Create Account</button>
                            <button class="btn btn-secondary" onclick="app.redirectToLogin()">Login</button>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="app.closeUserMenu()">Continue as Guest</button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('guest-menu-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    closeUserMenu() {
        const userModal = document.getElementById('user-menu-modal');
        const guestModal = document.getElementById('guest-menu-modal');

        if (userModal) userModal.remove();
        if (guestModal) guestModal.remove();
    }

    editProfile() {
        // Close user menu first
        this.closeUserMenu();

        const user = this.currentUser;
        const modalHTML = `
            <div class="modal active" id="edit-profile-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Edit Profile</h3>
                        <button class="modal-close" onclick="app.closeEditProfile()">×</button>
                    </div>
                    <form id="edit-profile-form">
                        <div class="modal-body">
                            <div class="form-group">
                                <label for="edit-first-name">First Name</label>
                                <input type="text" id="edit-first-name" value="${user.profile.firstName}" required>
                            </div>
                            <div class="form-group">
                                <label for="edit-last-name">Last Name</label>
                                <input type="text" id="edit-last-name" value="${user.profile.lastName}" required>
                            </div>
                            <div class="form-group">
                                <label for="edit-role">Role</label>
                                <input type="text" id="edit-role" value="${user.profile.role}" placeholder="e.g., Student, Business Owner">
                            </div>
                            <div class="form-group">
                                <label for="edit-avatar">Avatar</label>
                                <select id="edit-avatar">
                                    <option value="👤" ${user.profile.avatar === '👤' ? 'selected' : ''}>👤 Default</option>
                                    <option value="👨‍💼" ${user.profile.avatar === '👨‍💼' ? 'selected' : ''}>👨‍💼 Business Man</option>
                                    <option value="👩‍💼" ${user.profile.avatar === '👩‍💼' ? 'selected' : ''}>👩‍💼 Business Woman</option>
                                    <option value="👨‍🎓" ${user.profile.avatar === '👨‍🎓' ? 'selected' : ''}>👨‍🎓 Student (Male)</option>
                                    <option value="👩‍🎓" ${user.profile.avatar === '👩‍🎓' ? 'selected' : ''}>👩‍🎓 Student (Female)</option>
                                    <option value="👨‍💻" ${user.profile.avatar === '👨‍💻' ? 'selected' : ''}>👨‍💻 Developer (Male)</option>
                                    <option value="👩‍💻" ${user.profile.avatar === '👩‍💻' ? 'selected' : ''}>👩‍💻 Developer (Female)</option>
                                    <option value="🧑‍🎨" ${user.profile.avatar === '🧑‍🎨' ? 'selected' : ''}>🧑‍🎨 Artist</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                            <button type="button" class="btn btn-secondary" onclick="app.closeEditProfile()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Setup form handler
        document.getElementById('edit-profile-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleProfileUpdate();
        });
    }

    closeEditProfile() {
        const modal = document.getElementById('edit-profile-modal');
        if (modal) modal.remove();
    }

    async handleProfileUpdate() {
        const firstName = document.getElementById('edit-first-name').value.trim();
        const lastName = document.getElementById('edit-last-name').value.trim();
        const role = document.getElementById('edit-role').value.trim();
        const avatar = document.getElementById('edit-avatar').value;

        if (!firstName || !lastName) {
            this.ui.showToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            await this.auth.updateProfile({  // ✅ Added await
                firstName,
                lastName,
                role: role || 'User',
                avatar
            });

            // Update current user reference
            this.currentUser = this.auth.getCurrentUser();

            // Update UI
            await this.setupUserProfile();  // ✅ Added await

            this.closeEditProfile();
            this.ui.showToast('Profile updated successfully!', 'success');
        } catch (error) {
            this.ui.showToast('Error updating profile: ' + error.message, 'error');
        }
    }

    async updateUserStats() {
        if (this.isGuestMode || !this.currentUser) return;

        const transactions = await this.transactions.getAll();  // ✅ Added await
        const budgets = await this.budgets.getAll();  // ✅ Added await

        const stats = {
            totalTransactions: transactions.length,
            totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
            totalExpenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
            budgetsSet: Object.keys(budgets).length
        };

        await this.auth.updateStats(stats);  // ✅ Added await
        this.currentUser = this.auth.getCurrentUser(); // Refresh current user data
    }

    redirectToSignup() {
        window.location.href = 'login.html?mode=signup';
    }

    redirectToLogin() {
        // Clear guest mode when going to login
        localStorage.removeItem('moneymate_guestMode');
        localStorage.removeItem('moneymate_guestSession');
        window.location.href = 'login.html';
    }

    // Settings Methods - Phase 2
    updateSettingsDisplay() {
        // Update current theme display
        const currentThemeSpan = document.getElementById('current-theme');
        if (currentThemeSpan) {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            currentThemeSpan.textContent = isDark ? 'Dark' : 'Light';
        }

        // Hide delete account button for guest users
        const deleteAccountBtn = document.getElementById('delete-account-btn');
        const accountActionsCard = document.getElementById('account-actions-card');

        if (this.isGuestMode) {
            if (deleteAccountBtn) deleteAccountBtn.style.display = 'none';

            // Update card title for guest mode
            const cardTitle = accountActionsCard?.querySelector('h3');
            if (cardTitle) {
                cardTitle.textContent = '🚪 Session Actions';
            }
        } else {
            if (deleteAccountBtn) deleteAccountBtn.style.display = 'inline-block';
        }
    }

    showDataClearConfirm() {
        const message = this.isGuestMode
            ? 'Are you sure you want to clear all your data? This will remove all transactions and budgets from this session.'
            : 'Are you sure you want to clear all your data? This will permanently delete all your transactions and budgets.';

        this.showConfirmModal(message, () => {
            this.clearAllData();
        }, 'Clear Data', 'Confirm Data Clearing');
    }

    clearAllData() {
        // Clear transactions
        const allTransactions = this.transactions.getAll();
        allTransactions.forEach(transaction => {
            this.transactions.delete(transaction.timestamp);
        });

        // Clear budgets
        const allBudgets = this.budgets.getAll();
        Object.keys(allBudgets).forEach(category => {
            this.budgets.delete(category);
        });

        // Reset select mode if active
        if (this.selectMode) {
            this.selectMode = false;
            this.toggleSelectMode();
        }

        // Update stats for logged-in users
        if (!this.isGuestMode) {
            this.updateUserStats();
        }

        this.render();
        this.ui.showToast('All data cleared successfully', 'success');

        // Navigate back to dashboard
        setTimeout(() => {
            this.showSection('dashboard');
        }, 1500);
    }

    showDeleteAccountConfirm() {
        if (this.isGuestMode) return;

        const message = 'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.';

        this.showConfirmModal(message, async () => {  // ✅ Made callback async
            await this.deleteAccount();  // ✅ Added await
        }, 'Delete Account', 'Confirm Account Deletion');
    }

    async deleteAccount() {  // ✅ Made method async
        if (this.isGuestMode) return;

        try {
            await this.auth.deleteAccount();  // ✅ Added await
            this.ui.showToast('Account deleted successfully', 'success');

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } catch (error) {
            this.ui.showToast('Error deleting account: ' + error.message, 'error');
        }
    }

    // Import Data Methods - Phase 2
    setupImportListeners() {
        const importFile = document.getElementById('import-file');
        const importBtn = document.getElementById('import-btn');
        const importMerge = document.getElementById('import-merge');
        const importReplace = document.getElementById('import-replace');

        if (!importFile || !importBtn) return;

        // File selection handler
        importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            importBtn.disabled = !file;
        });

        // Import button handler
        importBtn.addEventListener('click', () => this.handleImportData());

        // Checkbox handlers (ensure only one is selected)
        importMerge.addEventListener('change', () => {
            if (importMerge.checked) {
                importReplace.checked = false;
            }
        });

        importReplace.addEventListener('change', () => {
            if (importReplace.checked) {
                importMerge.checked = false;
            } else {
                importMerge.checked = true; // Default to merge
            }
        });
    }

    showImportModal() {
        const modal = document.getElementById('import-modal');
        if (modal) {
            modal.classList.add('active');

            // Reset form
            document.getElementById('import-file').value = '';
            document.getElementById('import-btn').disabled = true;
            document.getElementById('import-merge').checked = true;
            document.getElementById('import-replace').checked = false;

            // Setup close button event listeners for this modal
            this.setupImportModalCloseListeners();
        }
    }

    closeImportModal() {
        const modal = document.getElementById('import-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    setupImportModalCloseListeners() {
        const modal = document.getElementById('import-modal');
        if (!modal) return;

        // Close button (×)
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.onclick = () => this.closeImportModal();
        }

        // Cancel button
        const cancelBtn = modal.querySelector('.modal-cancel');
        if (cancelBtn) {
            cancelBtn.onclick = () => this.closeImportModal();
        }

        // Click outside modal to close
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.closeImportModal();
            }
        };
    }

    async handleImportData() {
        const fileInput = document.getElementById('import-file');
        const file = fileInput.files[0];
        const mergeMode = document.getElementById('import-merge').checked;

        if (!file) {
            this.ui.showToast('Please select a file to import', 'error');
            return;
        }

        try {
            const text = await this.readFileAsText(file);
            const data = JSON.parse(text);

            // Validate data structure
            if (!this.validateImportData(data)) {
                this.ui.showToast('Invalid file format. Please select a valid Money Mate export file.', 'error');
                return;
            }

            // Show confirmation for replace mode
            if (!mergeMode) {
                const message = 'This will replace ALL your existing data. Are you sure you want to continue?';
                this.showConfirmModal(message, () => {
                    this.processImportData(data, mergeMode);
                    this.closeImportModal();
                });
                return;
            }

            // Process import
            this.processImportData(data, mergeMode);
            this.closeImportModal();

        } catch (error) {
            console.error('Import error:', error);
            this.ui.showToast('Error importing data. Please check the file format.', 'error');
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    validateImportData(data) {
        // Check if data has the expected structure
        if (!data || typeof data !== 'object') return false;

        // Check for transactions array
        if (data.transactions && !Array.isArray(data.transactions)) return false;

        // Check for budgets object
        if (data.budgets && typeof data.budgets !== 'object') return false;

        // Validate transaction structure
        if (data.transactions) {
            for (const transaction of data.transactions) {
                if (!transaction.type || !transaction.amount || !transaction.category || !transaction.date) {
                    return false;
                }
                if (!['income', 'expense'].includes(transaction.type)) {
                    return false;
                }
            }
        }

        return true;
    }

    processImportData(data, mergeMode) {
        let importedTransactions = 0;
        let importedBudgets = 0;

        try {
            // Clear existing data if replace mode
            if (!mergeMode) {
                this.clearAllData();
            }

            // Import transactions
            if (data.transactions && Array.isArray(data.transactions)) {
                data.transactions.forEach(transaction => {
                    // Ensure unique timestamp for imported transactions
                    const importedTransaction = {
                        ...transaction,
                        timestamp: transaction.timestamp || Date.now() + Math.random()
                    };

                    this.transactions.add(importedTransaction);
                    importedTransactions++;
                });
            }

            // Import budgets
            if (data.budgets && typeof data.budgets === 'object') {
                Object.entries(data.budgets).forEach(([category, limit]) => {
                    this.budgets.set(category, limit);
                    importedBudgets++;
                });
            }

            // Update stats for logged-in users
            if (!this.isGuestMode) {
                this.updateUserStats();
            }

            // Re-render everything
            this.render();

            // Show success message
            const mode = mergeMode ? 'merged' : 'imported';
            this.ui.showToast(
                `Data ${mode} successfully! ${importedTransactions} transactions and ${importedBudgets} budgets added.`,
                'success'
            );

            // Navigate to dashboard to see imported data
            setTimeout(() => {
                this.showSection('dashboard');
            }, 2000);

        } catch (error) {
            console.error('Processing import error:', error);
            this.ui.showToast('Error processing imported data', 'error');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing app...');
    console.log('Current URL:', window.location.href);
    console.log('Checking localStorage for existing auth data...');
    console.log('Guest mode:', localStorage.getItem('moneymate_guestMode'));
    console.log('Guest session:', localStorage.getItem('moneymate_guestSession'));
    console.log('Auth data:', localStorage.getItem('moneymate_users'));

    const app = new FinanceApp();

    // Make app globally accessible for inline event handlers
    window.app = app;

    // Initialize the app (now async)
    await app.init();

    console.log('App initialized successfully');
});