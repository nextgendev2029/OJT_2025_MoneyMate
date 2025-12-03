// Main Application Entry Point
import { StorageManager } from "./modules/storage.js";
import { TransactionManager } from "./modules/transactions.js";
import { BudgetManager } from "./modules/budgets.js";
import { UIManager } from "./modules/ui.js";
import { ThemeManager } from "./modules/theme.js";
import { ChartManager } from "./modules/charts.js";

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
    document.getElementById("theme-toggle").addEventListener("click", () => {
      this.theme.toggle();
    });

    // Transaction form
    const form = document.getElementById("transaction-form");
    form.addEventListener("submit", (e) => this.handleTransactionSubmit(e));

    // Transaction type change
    document
      .getElementById("transaction-type")
      .addEventListener("change", (e) => {
        this.updateCategoryOptions(e.target.value);
      });

    // Undo/Redo
    document
      .getElementById("undo-btn")
      .addEventListener("click", () => this.handleUndo());
    document
      .getElementById("redo-btn")
      .addEventListener("click", () => this.handleRedo());

    // Search and filters
    const searchInput = document.getElementById("search-input");
    searchInput.addEventListener(
      "input",
      this.debounce(() => this.render(), 300)
    );

    document
      .getElementById("filter-type")
      .addEventListener("change", () => this.render());
    document
      .getElementById("filter-category")
      .addEventListener("change", () => this.render());
    document
      .getElementById("sort-by")
      .addEventListener("change", () => this.render());

    // Budget
    document
      .getElementById("add-budget-btn")
      .addEventListener("click", () => this.ui.openBudgetModal());
    document
      .getElementById("budget-form")
      .addEventListener("submit", (e) => this.handleBudgetSubmit(e));

    // Modal close
    document.querySelectorAll(".modal-close, .modal-cancel").forEach((btn) => {
      btn.addEventListener("click", () => this.ui.closeModal());
    });

    // Set default date
    const dateInput = document.getElementById("transaction-date");
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
    dateInput.max = today;

    // Initialize categories
    this.updateCategoryOptions("income");
  }

  updateCategoryOptions(type) {
    const categorySelect = document.getElementById("transaction-category");

    const incomeCategories = [
      { value: "salary", label: "Salary" },
      { value: "freelance", label: "Freelance" },
      { value: "investment", label: "Investment" },
      { value: "other-income", label: "Other" },
    ];

    const expenseCategories = [
      { value: "food", label: "Food & Dining" },
      { value: "transport", label: "Transport" },
      { value: "shopping", label: "Shopping" },
      { value: "bills", label: "Bills & Utilities" },
      { value: "entertainment", label: "Entertainment" },
      { value: "education", label: "Education" },
      { value: "health", label: "Health" },
      { value: "other-expense", label: "Other" },
    ];

    const categories = type === "income" ? incomeCategories : expenseCategories;

    categorySelect.innerHTML = "";
    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.value;
      option.textContent = cat.label;
      categorySelect.appendChild(option);
    });
  }

  handleTransactionSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    const transaction = {
      type: formData.get("type"),
      amount: parseFloat(formData.get("amount")),
      category: formData.get("category"),
      date: formData.get("date"),
      description: formData.get("description") || "",
      recurring: formData.get("recurring") === "on",
      timestamp: Date.now(),
    };

    // Validate expense against current balance
        if (transaction.type === 'expense') {
            const currentStats = this.transactions.getStats();
            const currentBalance = currentStats.balance;
            
            if (transaction.amount > currentBalance) {
                this.ui.showToast(`Insufficient balance! Available: ₹${currentBalance.toFixed(2)}`, 'error');
                return;
            }
        }
        
    this.transactions.add(transaction);
    this.render();
    e.target.reset();

    const today = new Date().toISOString().split("T")[0];
    document.getElementById("transaction-date").value = today;
    this.updateCategoryOptions("income");

    this.ui.showToast("Transaction added successfully!", "success");
  }

  handleBudgetSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    const budget = {
      category:
        formData.get("category") ||
        document.getElementById("budget-category").value,
      limit: parseFloat(document.getElementById("budget-amount").value),
    };

    this.budgets.set(budget.category, budget.limit);
    this.render();
    this.ui.closeModal();
    this.ui.showToast("Budget set successfully!", "success");
  }

  handleUndo() {
    if (this.transactions.undo()) {
      this.render();
      this.ui.showToast("Transaction undone", "success");
    }
  }

  handleRedo() {
    if (this.transactions.redo()) {
      this.render();
      this.ui.showToast("Transaction redone", "success");
    }
  }

  checkRecurringTransactions() {
    const lastCheck = this.storage.get("lastRecurringCheck") || 0;
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (now - lastCheck > oneDay) {
      this.transactions.processRecurring();
      this.storage.set("lastRecurringCheck", now);
      this.render();
    }
  }

  render() {
    // Get filtered and sorted transactions
    const searchTerm = document.getElementById("search-input").value;
    const filterType = document.getElementById("filter-type").value;
    const filterCategory = document.getElementById("filter-category").value;
    const sortBy = document.getElementById("sort-by").value;

    let transactions = this.transactions.getAll();

    // Apply filters
    if (searchTerm) {
      transactions = transactions.filter(
        (t) =>
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== "all") {
      transactions = transactions.filter((t) => t.type === filterType);
    }

    if (filterCategory !== "all") {
      transactions = transactions.filter((t) => t.category === filterCategory);
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

    // Update category filter dropdown
        this.updateCategoryFilter();
  }

  sortTransactions(transactions, sortBy) {
    const sorted = [...transactions];

    switch (sortBy) {
      case "date-desc":
        return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
      case "date-asc":
        return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
      case "amount-desc":
        return sorted.sort((a, b) => b.amount - a.amount);
      case "amount-asc":
        return sorted.sort((a, b) => a.amount - b.amount);
      default:
        return sorted;
    }
  }

  updateBalance() {
    const stats = this.transactions.getStats();
    document.getElementById(
      "total-balance"
    ).textContent = `₹${stats.balance.toFixed(2)}`;
    document.getElementById(
      "total-income"
    ).textContent = `₹${stats.income.toFixed(2)}`;
    document.getElementById(
      "total-expense"
    ).textContent = `₹${stats.expense.toFixed(2)}`;
  }

  renderTransactions(transactions, page = 1, perPage = 10) {
    const list = document.getElementById("transactions-list");
    const totalPages = Math.ceil(transactions.length / perPage);
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const pageTransactions = transactions.slice(start, end);

    if (pageTransactions.length === 0) {
      list.innerHTML =
        '<p style="text-align: center; color: var(--text-secondary);">No transactions found</p>';
      document.getElementById("pagination").innerHTML = "";
      return;
    }

    list.innerHTML = pageTransactions
      .map(
        (t) => `
        <div class="transaction-item" role="listitem">
            <div class="transaction-info">
                <div class="transaction-header">
                    <span class="transaction-category">${t.category.replace(
                      "-",
                      " "
                    )}</span>
                    ${
                      t.recurring
                        ? '<span class="transaction-badge">🔄 Recurring</span>'
                        : ""
                    }
                </div>
                ${
                  t.description
                    ? `<div class="transaction-description">${t.description}</div>`
                    : ""
                }
                <div class="transaction-date">${new Date(
                  t.date
                ).toLocaleDateString("en-IN")}</div>
            </div>
            <div class="transaction-amount transaction-amount--${t.type}">
                ${t.type === "income" ? "+" : "-"}₹${t.amount.toFixed(2)}
            </div>
            <div class="transaction-actions">
                <button class="btn-delete" onclick="app.deleteTransaction(${
                  t.timestamp
                })" aria-label="Delete transaction">
                    🗑️
                </button>
            </div>
        </div>
    `
      )
      .join("");

    this.renderPagination(page, totalPages, transactions);
  }

  renderPagination(currentPage, totalPages, transactions) {
    const pagination = document.getElementById("pagination");

    if (totalPages <= 1) {
      pagination.innerHTML = "";
      return;
    }

    pagination.innerHTML = `
        <button ${
          currentPage === 1 ? "disabled" : ""
        } onclick="app.changePage(${currentPage - 1})">
            Previous
        </button>
        <span class="page-info">Page ${currentPage} of ${totalPages}</span>
        <button ${
          currentPage === totalPages ? "disabled" : ""
        } onclick="app.changePage(${currentPage + 1})">
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
    if (confirm("Are you sure you want to delete this transaction?")) {
      this.transactions.delete(timestamp);
      this.render();
      this.ui.showToast("Transaction deleted", "success");
    }
  }

  renderBudgets() {
    const budgets = this.budgets.getAll();
    const budgetList = document.getElementById("budget-list");
    const budgetAlerts = document.getElementById("budget-alerts");

    if (Object.keys(budgets).length === 0) {
      budgetList.innerHTML =
        '<p style="color: var(--text-secondary);">No budgets set. Click "Add Budget" to get started.</p>';
      budgetAlerts.innerHTML = "";
      return;
    }

    const spending = this.transactions.getSpendingByCategory();
    let alerts = [];

    budgetList.innerHTML = Object.entries(budgets)
      .map(([category, limit]) => {
        const spent = spending[category] || 0;
        const percentage = (spent / limit) * 100;
        const remaining = limit - spent;

        let progressClass = "";
        if (percentage >= 100) {
          progressClass = "budget-progress-bar--danger";
          alerts.push({
            category,
            type: "danger",
            message: `Budget exceeded for ${category}!`,
          });
        } else if (percentage >= 80) {
          progressClass = "budget-progress-bar--warning";
          alerts.push({
            category,
            type: "warning",
            message: `${category} budget is ${percentage.toFixed(0)}% used`,
          });
        }

        return `
            <div class="budget-item">
                <div class="budget-header">
                    <span class="budget-category">${category.replace(
                      "-",
                      " "
                    )}</span>
                    <span class="budget-amount">₹${spent.toFixed(
                      2
                    )} / ₹${limit.toFixed(2)}</span>
                </div>
                <div class="budget-progress">
                    <div class="budget-progress-bar ${progressClass}" style="width: ${Math.min(
          percentage,
          100
        )}%"></div>
                </div>
                <small style="color: var(--text-secondary);">
                    ${
                      remaining > 0
                        ? `₹${remaining.toFixed(2)} remaining`
                        : `₹${Math.abs(remaining).toFixed(2)} over budget`
                    }
                </small>
            </div>
        `;
      })
      .join("");

    budgetAlerts.innerHTML = alerts
      .map(
        (alert) => `
        <div class="budget-alert budget-alert--${alert.type}">
            ${alert.type === "danger" ? "⚠️" : "⚡"} ${alert.message}
        </div>
    `
      )
      .join("");
  }

  updateCharts() {
    const transactions = this.transactions.getAll();
    const expenses = transactions.filter((t) => t.type === "expense");

    // Category breakdown
    const categoryData = this.transactions.getSpendingByCategory();
    this.charts.renderPieChart("category-chart", categoryData);

    // Spending trend
    const trendData = this.transactions.getSpendingTrend();
    this.charts.renderLineChart("trend-chart", trendData);
  }

  updateUndoRedoButtons() {
    document.getElementById("undo-btn").disabled = !this.transactions.canUndo();
    document.getElementById("redo-btn").disabled = !this.transactions.canRedo();
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
        option.textContent = category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        filterCategory.appendChild(option);
    });
    
    // Restore previous selection if it still exists
    if (categories.includes(currentValue)) {
        filterCategory.value = currentValue;
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
}

// Initialize app
const app = new FinanceApp();
window.app = app;
