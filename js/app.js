

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

updateUndoRedoButtons() {
    document.getElementById('undo-btn').disabled = !this.transactions.canUndo();
    document.getElementById('redo-btn').disabled = !this.transactions.canRedo();
}