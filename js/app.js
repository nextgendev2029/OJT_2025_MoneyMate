

render() {
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
}

sortTransactions(transactions, sortBy) {
    const sorted = [...transactions];
    
    switch(sortBy) {
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

updateBalance() {
    const stats = this.transactions.getStats();
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
        <div class="transaction-item" role="listitem">
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
                <button class="btn-delete" onclick="app.deleteTransaction(${t.timestamp})" aria-label="Delete transaction">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');

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
    if (confirm('Are you sure you want to delete this transaction?')) {
        this.transactions.delete(timestamp);
        this.render();
        this.ui.showToast('Transaction deleted', 'success');
    }
}



updateUndoRedoButtons() {
    document.getElementById('undo-btn').disabled = !this.transactions.canUndo();
    document.getElementById('redo-btn').disabled = !this.transactions.canRedo();
}