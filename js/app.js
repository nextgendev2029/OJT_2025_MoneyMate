// js/app.js

import { ThemeManager } from './modules/theme.js';

class FinanceApp {
    constructor() {
        this.theme = new ThemeManager();
        this.init();
    }

    init() {
        // Initialize theme
        this.theme.init();
        
        // Setup theme toggle button
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.theme.toggle();
        });
    }
}

// Initialize app
const app = new FinanceApp();
window.app = app;
