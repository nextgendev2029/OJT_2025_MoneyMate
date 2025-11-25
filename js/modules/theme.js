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