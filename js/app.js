// Main Application Entry Point
import { StorageManager } from "./modules/storage.js";
import { TransactionManager } from "./modules/transactions.js";
import { BudgetManager } from "./modules/budgets.js";
import { UIManager } from "./modules/ui.js";
import { ThemeManager } from "./modules/theme.js";
import { ChartManager } from "./modules/charts.js";
import { ExportManager } from "./modules/export.js";

class FinanceApp {
  constructor() {
    this.storage = new StorageManager();
    this.transactions = new TransactionManager(this.storage);
    this.budgets = new BudgetManager(this.storage);
    this.ui = new UIManager();
    this.theme = new ThemeManager();
    this.charts = new ChartManager();
    this.export = new ExportManager();

    // Edit mode state
    this.editMode = false;
    this.editingTimestamp = null;

    // Bulk delete state
    this.selectMode = false;
    this.selectedTransactions = new Set();

    // Confirmation modal state
    this.confirmCallback = null;

    this.init();
  }

  init() {
    // Initialize theme
    this.theme.init();

    // Load data
    this.loadData();

    // Setup event listeners
    this.setupEventListeners();

    // Setup hamburger menu
    this.setupHamburgerMenu();

    // Setup custom step for amount inputs
    this.setupCustomStep();

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
            // Re-render charts to update colors for new theme
            this.updateCharts();
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

    // Cancel edit button
    document
      .getElementById("cancel-edit-btn")
      .addEventListener("click", () => this.cancelEdit());

    // Bulk delete buttons
    document
      .getElementById("select-mode-btn")
      .addEventListener("click", () => this.toggleSelectMode());
    document
      .getElementById("delete-selected-btn")
      .addEventListener("click", () => this.deleteSelected());
    document
      .getElementById("delete-all-btn")
      .addEventListener("click", () => this.deleteAll());

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

    // Confirmation modal
    document
      .getElementById("confirm-yes")
      .addEventListener("click", () => this.handleConfirmYes());
    document.querySelectorAll(".confirm-cancel").forEach((btn) => {
      btn.addEventListener("click", () => this.closeConfirmModal());
    });

    // Modal close
    document.querySelectorAll(".modal-close, .modal-cancel").forEach((btn) => {
      btn.addEventListener("click", () => this.ui.closeModal());
    });

    // Export
    document
      .getElementById("export-json-btn")
      .addEventListener("click", () => this.handleExportJSON());
    document
      .getElementById("export-csv-btn")
      .addEventListener("click", () => this.handleExportCSV());

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
      timestamp: this.editMode ? this.editingTimestamp : Date.now(),
    };

    // Validate expense against current balance
    if (transaction.type === "expense") {
      const currentStats = this.transactions.getStats();
      const currentBalance = currentStats.balance;

      // If editing, add back the old transaction amount to balance
      let availableBalance = currentBalance;
      if (this.editMode) {
        const oldTransaction = this.transactions
          .getAll()
          .find((t) => t.timestamp === this.editingTimestamp);
        if (oldTransaction && oldTransaction.type === "expense") {
          availableBalance += oldTransaction.amount;
        }
      }

      if (transaction.amount > availableBalance) {
        this.ui.showToast(
          `Insufficient balance! Available: ₹${availableBalance.toFixed(2)}`,
          "error"
        );
        return;
      }
    }

    if (this.editMode) {
      // Update existing transaction
      this.transactions.delete(this.editingTimestamp);
      this.transactions.add(transaction);
      this.ui.showToast("Transaction updated successfully!", "success");
      this.cancelEdit();
    } else {
      // Add new transaction
      this.transactions.add(transaction);
      this.ui.showToast("Transaction added successfully!", "success");
    }
    this.render();
    e.target.reset();

    const today = new Date().toISOString().split("T")[0];
    document.getElementById("transaction-date").value = today;
    this.updateCategoryOptions("income");
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

  // Export Methods  // ← YEH DONO METHODS ADD KARO
  handleExportJSON() {
    const data = {
      transactions: this.transactions.getAll(),
      budgets: this.budgets.getAll(),
    };
    this.export.toJSON(data, "finance-data.json");
    this.ui.showToast("Data exported as JSON", "success");
  }

  handleExportCSV() {
    this.export.toCSV(this.transactions.getAll(), "transactions.csv");
    this.ui.showToast("Transactions exported as CSV", "success");
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
        <div class="transaction-item ${this.selectMode ? "select-mode" : ""} ${
          this.selectedTransactions.has(t.timestamp) ? "selected" : ""
        }" role="listitem">
                ${
                  this.selectMode
                    ? `
                    <input type="checkbox" 
                           class="transaction-checkbox" 
                           data-timestamp="${t.timestamp}"
                           onchange="app.toggleTransactionSelection(${
                             t.timestamp
                           })"
                           ${
                             this.selectedTransactions.has(t.timestamp)
                               ? "checked"
                               : ""
                           }>
                `
                    : ""
                }
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
            ${
              !this.selectMode
                ? `
            <button class="btn-edit" onclick="app.editTransaction(${t.timestamp})" aria-label="Edit transaction">
                        ✏️
                    </button>
                <button class="btn-delete" onclick="app.deleteTransaction(${t.timestamp})" aria-label="Delete transaction">
                    🗑️
                </button>
                `
                : ""
            }
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
    this.showConfirmModal(
      "Are you sure you want to delete this transaction?",
      () => {
        this.transactions.delete(timestamp);
        this.render();
        this.ui.showToast("Transaction deleted", "success");
      }
    );
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
            <div class="budget-item" onclick="app.openBudgetOptions('${category}', ${limit})" style="cursor: pointer;">
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
    const filterCategory = document.getElementById("filter-category");
    const allTransactions = this.transactions.getAll();

    // Get unique categories from all transactions
    const categories = [...new Set(allTransactions.map((t) => t.category))];

    // Save current selection
    const currentValue = filterCategory.value;

    // Clear existing options except "All Categories"
    filterCategory.innerHTML = '<option value="all">All Categories</option>';

    // Add unique categories
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category
        .replace("-", " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
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

  // Edit Transaction Methods
  editTransaction(timestamp) {
    const transaction = this.transactions
      .getAll()
      .find((t) => t.timestamp === timestamp);
    if (!transaction) {
      this.ui.showToast("Transaction not found", "error");
      return;
    }

    // Enter edit mode
    this.editMode = true;
    this.editingTimestamp = timestamp;

    // Populate form with transaction data
    document.getElementById("transaction-type").value = transaction.type;
    this.updateCategoryOptions(transaction.type);
    document.getElementById("transaction-amount").value = transaction.amount;
    document.getElementById("transaction-category").value =
      transaction.category;
    document.getElementById("transaction-date").value = transaction.date;
    document.getElementById("transaction-description").value =
      transaction.description || "";
    document.getElementById("transaction-recurring").checked =
      transaction.recurring || false;

    // Update UI for edit mode
    const submitBtn = document.getElementById("transaction-submit-btn");
    const cancelBtn = document.getElementById("cancel-edit-btn");
    submitBtn.textContent = "Update Transaction";
    cancelBtn.style.display = "inline-block";

    // Scroll to form
    document
      .getElementById("transaction-form")
      .scrollIntoView({ behavior: "smooth", block: "start" });

    this.ui.showToast("Edit mode activated", "info");
  }

  cancelEdit() {
    // Exit edit mode
    this.editMode = false;
    this.editingTimestamp = null;

    // Reset form
    document.getElementById("transaction-form").reset();

    // Reset date to today
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("transaction-date").value = today;
    this.updateCategoryOptions("income");

    // Update UI
    const submitBtn = document.getElementById("transaction-submit-btn");
    const cancelBtn = document.getElementById("cancel-edit-btn");
    submitBtn.textContent = "Add Transaction";
    cancelBtn.style.display = "none";
  }

  // Bulk Delete Methods
  toggleSelectMode() {
    this.selectMode = !this.selectMode;
    this.selectedTransactions.clear();

    const selectBtn = document.getElementById("select-mode-btn");
    const deleteSelectedBtn = document.getElementById("delete-selected-btn");
    const transactionsList = document.getElementById("transactions-list");

    if (this.selectMode) {
      selectBtn.textContent = "Cancel";
      selectBtn.classList.add("btn-secondary");
      deleteSelectedBtn.style.display = "inline-block";
      transactionsList.classList.add("select-mode-active");
    } else {
      selectBtn.textContent = "Select";
      selectBtn.classList.remove("btn-secondary");
      deleteSelectedBtn.style.display = "none";
      transactionsList.classList.remove("select-mode-active");
    }

    this.render();
  }

  toggleTransactionSelection(timestamp) {
    if (this.selectedTransactions.has(timestamp)) {
      this.selectedTransactions.delete(timestamp);
    } else {
      this.selectedTransactions.add(timestamp);
    }

    // Update checkbox state
    const checkbox = document.querySelector(
      `input[data-timestamp="${timestamp}"]`
    );
    if (checkbox) {
      checkbox.checked = this.selectedTransactions.has(timestamp);
    }

    // Update transaction item appearance
    const transactionItem = checkbox?.closest(".transaction-item");
    if (transactionItem) {
      if (this.selectedTransactions.has(timestamp)) {
        transactionItem.classList.add("selected");
      } else {
        transactionItem.classList.remove("selected");
      }
    }

    // Update delete selected button text
    const deleteSelectedBtn = document.getElementById("delete-selected-btn");
    const count = this.selectedTransactions.size;
    deleteSelectedBtn.textContent =
      count > 0 ? `Delete Selected (${count})` : "Delete Selected";
  }

  deleteSelected() {
    if (this.selectedTransactions.size === 0) {
      this.ui.showToast("No transactions selected", "error");
      return;
    }

    const count = this.selectedTransactions.size;
    const message = `Are you sure you want to delete ${count} selected transaction${
      count > 1 ? "s" : ""
    }? This action cannot be undone.`;

    this.showConfirmModal(message, () => {
      this.selectedTransactions.forEach((timestamp) => {
        this.transactions.delete(timestamp);
      });

      this.selectedTransactions.clear();
      this.selectMode = false;
      this.toggleSelectMode(); // Reset select mode
      this.render();

      this.ui.showToast(
        `${count} transaction${count > 1 ? "s" : ""} deleted successfully`,
        "success"
      );
    });
  }

  deleteAll() {
    const allTransactions = this.transactions.getAll();

    if (allTransactions.length === 0) {
      this.ui.showToast("No transactions to delete", "error");
      return;
    }

    const count = allTransactions.length;
    const message = `Are you sure you want to delete ALL ${count} transactions? This action cannot be undone.`;

    this.showConfirmModal(message, () => {
      // Delete all transactions
      allTransactions.forEach((transaction) => {
        this.transactions.delete(transaction.timestamp);
      });

      // Reset select mode if active
      if (this.selectMode) {
        this.selectMode = false;
        this.toggleSelectMode();
      }

      this.render();
      this.ui.showToast(
        `All ${count} transactions deleted successfully`,
        "success"
      );
    });
  }

  // Confirmation Modal Methods
  showConfirmModal(message, callback) {
    this.confirmCallback = callback;
    document.getElementById("confirm-message").textContent = message;
    document.getElementById("confirm-modal").classList.add("active");
  }

  closeConfirmModal() {
    this.confirmCallback = null;
    document.getElementById("confirm-modal").classList.remove("active");
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
                        <h3>Manage Budget: ${category.replace("-", " ")}</h3>
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
    const existingModal = document.getElementById("budget-options-modal");
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }

  closeBudgetOptions() {
    const modal = document.getElementById("budget-options-modal");
    if (modal) {
      modal.remove();
    }
  }

  updateBudget(category) {
    const newLimit = parseFloat(
      document.getElementById("edit-budget-amount").value
    );

    if (!newLimit || newLimit <= 0) {
      this.ui.showToast("Please enter a valid budget amount", "error");
      return;
    }

    this.budgets.set(category, newLimit);
    this.closeBudgetOptions();
    this.render();
    this.ui.showToast("Budget updated successfully!", "success");
  }

  deleteBudget(category) {
    const message = `Are you sure you want to delete the budget for ${category.replace(
      "-",
      " "
    )}?`;

    this.showConfirmModal(message, () => {
      this.budgets.delete(category);
      this.closeBudgetOptions();
      this.render();
      this.ui.showToast("Budget deleted successfully!", "success");
    });
  }
  // Hamburger Menu
  setupHamburgerMenu() {
    const hamburger = document.getElementById("hamburger-menu");
    const navMenu = document.getElementById("nav-menu");

    if (!hamburger || !navMenu) return;

    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      navMenu.classList.toggle("active");
    });

    // Close menu when clicking nav links
    const navLinks = navMenu.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        hamburger.classList.remove("active");
        navMenu.classList.remove("active");
      });
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        hamburger.classList.remove("active");
        navMenu.classList.remove("active");
      }
    });
  }

  // Custom Step for Amount Inputs
  setupCustomStep() {
    const amountInputs = [
      document.getElementById("transaction-amount"),
      document.getElementById("budget-amount"),
    ];

    amountInputs.forEach((input) => {
      if (!input) return;

      let isSpinnerClick = false;
      let previousValue = input.value;

      // Intercept mousedown on spinner buttons
      input.addEventListener("mousedown", (e) => {
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
      input.addEventListener("keydown", (e) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          const currentValue = parseFloat(input.value) || 0;
          input.value = currentValue + 100;
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          const currentValue = parseFloat(input.value) || 0;
          const newValue = currentValue - 100;
          input.value = newValue > 0 ? newValue : 0;
        }
      });

      // Handle spinner clicks
      input.addEventListener("input", () => {
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
}

// Initialize app
const app = new FinanceApp();
window.app = app;
