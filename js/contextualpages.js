/**
 * Contextual Pages Manager
 * Dynamically loads appropriate headers and footers for about.html and contact.html
 * based on where the user came from (landing, login, or app)
 */

class ContextualPageManager {
    constructor() {
        this.context = this.detectContext();
        this.init();
    }

    /**
     * Detect the context based on URL parameters and authentication state
     */
    detectContext() {
        const urlParams = new URLSearchParams(window.location.search);
        const fromParam = urlParams.get('from');

        // If URL parameter exists, use it
        if (fromParam === 'landing') {
            return 'landing';
        } else if (fromParam === 'login') {
            return 'login';
        } else if (fromParam === 'app') {
            return 'app';
        }

        // No parameter - check authentication state
        const authGuard = new AuthGuard();
        if (authGuard.isAuthenticated()) {
            return 'app';
        }

        // Default to landing for non-authenticated users
        return 'landing';
    }

    /**
     * Initialize the page with appropriate header and footer
     */
    init() {
        this.injectHeader();
        this.injectFooter();
        this.initializeTheme();
        this.initializeNavigation();

        if (this.context === 'app') {
            this.initializeUserProfile();
        }
    }

    /**
     * Inject the appropriate header based on context
     */
    injectHeader() {
        const headerContainer = document.getElementById('dynamic-header');
        if (!headerContainer) return;

        let headerHTML = '';

        switch (this.context) {
            case 'landing':
                headerHTML = this.getLandingHeader();
                break;
            case 'login':
                headerHTML = this.getLoginHeader();
                break;
            case 'app':
                headerHTML = this.getAppHeader();
                break;
        }

        headerContainer.innerHTML = headerHTML;
    }

    /**
     * Inject the appropriate footer based on context
     */
    injectFooter() {
        const footerContainer = document.getElementById('dynamic-footer');
        if (!footerContainer) return;

        let footerHTML = '';

        switch (this.context) {
            case 'landing':
                footerHTML = this.getLandingFooter();
                break;
            case 'login':
            case 'app':
                footerHTML = this.getSimpleFooter();
                break;
        }

        footerContainer.innerHTML = footerHTML;
    }

    /**
     * Get landing page header template
     */
    getLandingHeader() {
        return `
            <header class="landing-header">
                <div class="container">
                    <nav class="landing-nav">
                        <h1 class="logo">💰 Money Mate</h1>
                        <div class="nav-links">
                            <a href="landing.html#features" class="nav-link">Features</a>
                            <a href="landing.html#how-it-works" class="nav-link">How It Works</a>
                            <a href="landing.html#testimonials" class="nav-link">Testimonials</a>
                            <a href="about.html?from=landing" class="nav-link ${this.isAboutPage() ? 'active' : ''}">About Us</a>
                            <a href="contact.html?from=landing" class="nav-link ${this.isContactPage() ? 'active' : ''}">Contact Us</a>
                        </div>
                        <div class="nav-actions">
                            <a href="login.html" class="btn btn-outline-white">Sign In</a>
                            <a href="login.html#register" class="btn btn-primary">Get Started</a>
                            <button id="theme-toggle" class="btn-icon" aria-label="Toggle dark mode">🌙</button>
                        </div>
                        <button class="hamburger" id="hamburger-menu" aria-label="Toggle menu">
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </nav>
                </div>
            </header>
        `;
    }

    /**
     * Get login page header template
     */
    getLoginHeader() {
        return `
            <header class="header">
                <div class="container login-header-container">
                    <h1 class="logo">💰 Money Mate</h1>
                    <nav class="login-nav">
                        <a href="landing.html" class="nav-link">← Back to Home</a>
                        <a href="about.html?from=login" class="nav-link ${this.isAboutPage() ? 'active' : ''}">About Us</a>
                        <a href="contact.html?from=login" class="nav-link ${this.isContactPage() ? 'active' : ''}">Contact Us</a>
                    </nav>
                    <div class="header-right">
                        <button id="theme-toggle" class="btn-icon" aria-label="Toggle dark mode">🌙</button>
                    </div>
                </div>
            </header>
        `;
    }

    /**
     * Get app header template
     */
    getAppHeader() {
        return `
            <header class="header">
                <div class="container">
                    <h1 class="logo">💰 Money Mate</h1>
                    <div class="header-right">
                        <nav class="nav" id="nav-menu" role="navigation">
                            <a href="index.html?section=dashboard" class="nav-link">🏠 Dashboard</a>
                            <a href="index.html?section=add-transaction" class="nav-link">➕ Add Transaction</a>
                            <a href="index.html?section=history" class="nav-link">📊 History</a>
                            <a href="index.html?section=budgets" class="nav-link">💰 Budgets</a>
                            <a href="index.html?section=settings" class="nav-link">⚙️ Settings</a>
                        </nav>
                        
                        <div id="user-profile" class="user-profile">
                            <!-- Will be populated by JavaScript -->
                        </div>
                        
                        <button id="theme-toggle" class="btn-icon" aria-label="Toggle dark mode">🌙</button>
                        <button class="hamburger" id="hamburger-menu" aria-label="Toggle menu">
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>
                </div>
            </header>
        `;
    }

    /**
     * Get landing page footer template
     */
    getLandingFooter() {
        return `
            <footer class="landing-footer">
                <div class="container">
                    <div class="footer-grid">
                        <div class="footer-col">
                            <h3 class="footer-title">💰 Money Mate</h3>
                            <p class="footer-description">
                                Your trusted companion for smart personal finance management.
                                Track, budget, and grow your wealth effortlessly.
                            </p>
                        </div>
                        <div class="footer-col">
                            <h4 class="footer-heading">Product</h4>
                            <ul class="footer-links">
                                <li><a href="landing.html#features">Features</a></li>
                                <li><a href="landing.html#how-it-works">How It Works</a></li>
                                <li><a href="login.html">Sign In</a></li>
                                <li><a href="login.html#register">Sign Up</a></li>
                            </ul>
                        </div>
                        <div class="footer-col">
                            <h4 class="footer-heading">Company</h4>
                            <ul class="footer-links">
                                <li><a href="about.html?from=landing" class="${this.isAboutPage() ? 'active' : ''}">About Us</a></li>
                                <li><a href="contact.html?from=landing" class="${this.isContactPage() ? 'active' : ''}">Contact Us</a></li>
                                <li><a href="#">Privacy Policy</a></li>
                                <li><a href="#">Terms of Service</a></li>
                            </ul>
                        </div>
                        <div class="footer-col">
                            <h4 class="footer-heading">Connect</h4>
                            <ul class="footer-links">
                                <li><a href="#">Twitter</a></li>
                                <li><a href="#">LinkedIn</a></li>
                                <li><a href="#">Facebook</a></li>
                                <li><a href="#">Instagram</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="footer-bottom">
                        <p>© 2025 Money Mate. All rights reserved. Built with ❤️ for better financial futures.</p>
                    </div>
                </div>
            </footer>
        `;
    }

    /**
     * Get simple footer template (for login and app contexts)
     */
    getSimpleFooter() {
        const fromParam = this.context === 'app' ? '' : `?from=${this.context}`;

        return `
            <footer class="footer">
                <div class="container">
                    <div class="footer-content">
                        <div class="footer-links">
                            <a href="about.html${fromParam}" class="footer-link ${this.isAboutPage() ? 'active' : ''}">About Us</a>
                            <a href="contact.html${fromParam}" class="footer-link ${this.isContactPage() ? 'active' : ''}">Contact Us</a>
                        </div>
                        <p class="footer-text">© 2025 Money Mate. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        `;
    }

    /**
     * Check if current page is about.html
     */
    isAboutPage() {
        return window.location.pathname.includes('about.html');
    }

    /**
     * Check if current page is contact.html
     */
    isContactPage() {
        return window.location.pathname.includes('contact.html');
    }

    /**
     * Initialize theme toggle functionality
     */
    initializeTheme() {
        // Load theme module
        import('./modules/theme.js').then(module => {
            const theme = new module.ThemeManager();
            theme.init();

            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', () => theme.toggle());
            }
        }).catch(error => {
            console.error('Error loading theme module:', error);
            // Fallback theme toggle
            this.initializeFallbackTheme();
        });
    }

    /**
     * Fallback theme toggle if module loading fails
     */
    initializeFallbackTheme() {
        const themeToggle = document.getElementById('theme-toggle');
        const body = document.body;

        // Check for saved theme
        const currentTheme = localStorage.getItem('theme') || 'light';
        body.classList.add(`${currentTheme}-theme`);
        this.updateThemeIcon(currentTheme);

        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const isDark = body.classList.contains('dark-theme');

                if (isDark) {
                    body.classList.remove('dark-theme');
                    body.classList.add('light-theme');
                    localStorage.setItem('theme', 'light');
                    this.updateThemeIcon('light');
                } else {
                    body.classList.remove('light-theme');
                    body.classList.add('dark-theme');
                    localStorage.setItem('theme', 'dark');
                    this.updateThemeIcon('dark');
                }
            });
        }
    }

    /**
     * Update theme toggle icon
     */
    updateThemeIcon(theme) {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    /**
     * Initialize navigation (hamburger menu, etc.)
     */
    initializeNavigation() {
        const hamburger = document.getElementById('hamburger-menu');
        const navMenu = document.getElementById('nav-menu');
        const navLinks = document.querySelector('.nav-links');
        const body = document.body;

        if (hamburger) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');

                if (navMenu) {
                    navMenu.classList.toggle('active');
                }

                if (navLinks) {
                    navLinks.classList.toggle('active');
                }

                body.style.overflow = (navMenu?.classList.contains('active') || navLinks?.classList.contains('active')) ? 'hidden' : '';
            });

            // Close menu when clicking nav links
            const allNavLinks = document.querySelectorAll('.nav-link');
            allNavLinks.forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navMenu?.classList.remove('active');
                    navLinks?.classList.remove('active');
                    body.style.overflow = '';
                });
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!hamburger.contains(e.target) &&
                    !navMenu?.contains(e.target) &&
                    !navLinks?.contains(e.target)) {
                    hamburger.classList.remove('active');
                    navMenu?.classList.remove('active');
                    navLinks?.classList.remove('active');
                    body.style.overflow = '';
                }
            });
        }
    }

    /**
     * Initialize user profile (for app context only)
     */
    initializeUserProfile() {
        import('./modules/auth.js').then(module => {
            const auth = new module.AuthManager();
            this.setupUserProfile(auth);
        }).catch(error => {
            console.error('Error loading auth module:', error);
        });
    }

    /**
     * Setup user profile display
     */
    setupUserProfile(auth) {
        const userProfileElement = document.getElementById('user-profile');
        if (!userProfileElement) return;

        const isGuestMode = localStorage.getItem('moneymate_guestMode') === 'true';

        if (isGuestMode) {
            userProfileElement.innerHTML = `
                <div class="user-info">
                    <span class="user-avatar">👤</span>
                    <div class="user-details">
                        <span class="user-name">Guest User</span>
                        <span class="user-role">Guest Mode</span>
                    </div>
                </div>
                <div class="user-actions">
                    <button class="btn-icon" onclick="window.location.href='login.html'" aria-label="Login" title="Login">
                        🔐
                    </button>
                </div>
            `;
        } else if (auth.isLoggedIn()) {
            const user = auth.getCurrentUser();
            if (user) {
                userProfileElement.innerHTML = `
                    <div class="user-info">
                        <span class="user-avatar">${user.profile.avatar}</span>
                        <div class="user-details">
                            <span class="user-name">${user.profile.firstName} ${user.profile.lastName}</span>
                            <span class="user-role">${user.profile.role}</span>
                        </div>
                    </div>
                    <div class="user-actions">
                        <button class="btn-icon" onclick="window.location.href='index.html'" aria-label="Dashboard" title="Go to Dashboard">
                            🏠
                        </button>
                    </div>
                `;
            }
        } else {
            userProfileElement.innerHTML = `
                <div class="user-actions">
                    <button class="btn btn-outline" onclick="window.location.href='login.html'">
                        🔐 Login
                    </button>
                </div>
            `;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ContextualPageManager();
});
