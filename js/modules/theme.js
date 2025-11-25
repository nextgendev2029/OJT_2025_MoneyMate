// Theme Manager - Handles dark/light theme
export class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('theme-toggle');
        this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
    }

    init() {
        this.applyTheme(this.currentTheme);
    }

    getStoredTheme() {
        return localStorage.getItem('theme');
    }

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        this.themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
        localStorage.setItem('theme', theme);
        this.currentTheme = theme;
    }

    toggle() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    }
}