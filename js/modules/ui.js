// UI Manager - Handles UI interactions
export class UIManager {
    constructor() {
        this.modal = document.getElementById('budget-modal');
        this.toast = document.getElementById('toast');
    }

    openBudgetModal() {
        this.modal.classList.add('active');
        this.modal.setAttribute('aria-hidden', 'false');
        document.getElementById('budget-category').focus();
    }

    closeModal() {
        this.modal.classList.remove('active');
        this.modal.setAttribute('aria-hidden', 'true');
        document.getElementById('budget-form').reset();
    }

    showToast(message, type = 'success') {
        this.toast.textContent = message;
        this.toast.className = `toast toast--${type} show`;
        
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }

    showLoading(element) {
        element.disabled = true;
        element.dataset.originalText = element.textContent;
        element.textContent = 'Loading...';
    }

    hideLoading(element) {
        element.disabled = false;
        element.textContent = element.dataset.originalText;
    }
}
