// Authentication Page Controller
import { AuthManager } from './modules/auth.js';
import { ThemeManager } from './modules/theme.js';

class AuthController {
    constructor() {
        this.auth = new AuthManager();
        this.theme = new ThemeManager();
        this.currentSection = 'login'; // Default section
        this.init();
    }

    init() {
        try {
            console.log('Auth controller initializing...');
            
            // Initialize theme
            this.theme.init();
            
            // Check if already logged in
            if (this.auth.isLoggedIn()) {
                console.log('User already logged in, redirecting to index.html');
                window.location.href = 'index.html';
                return;
            }

            console.log('Setting up event listeners...');
            // Setup event listeners
            this.setupEventListeners();
            
            // Set default section to login and update header navigation
            this.showSection('login');
            
            console.log('Auth controller initialized successfully');
        } catch (error) {
            console.error('Error initializing auth controller:', error);
        }
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.theme.toggle();
        });

        // Form submissions
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));

        // Section switching
        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('register');
        });

        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('login');
        });

        // Check URL parameters for direct section access
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        if (mode === 'signup') {
            this.showSection('register');
        }

        // Guest mode
        document.getElementById('guest-mode').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleGuestMode();
        });

        // Demo account buttons
        document.querySelectorAll('.demo-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const email = e.target.dataset.email;
                const password = e.target.dataset.password;
                this.loginWithCredentials(email, password);
            });
        });

        // Header navigation - combined Sign In/Sign Up toggle
        const authToggleBtn = document.getElementById('signin-signup-toggle');
        
        if (authToggleBtn) {
            authToggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAuthSection();
            });
        }

        // Real-time validation
        this.setupValidation();
    }

    setupValidation() {
        // Email validation
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('blur', () => this.validateEmail(input));
            input.addEventListener('input', () => this.clearValidation(input));
        });

        // Password validation
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        passwordInputs.forEach(input => {
            input.addEventListener('blur', () => this.validatePassword(input));
            input.addEventListener('input', () => this.clearValidation(input));
        });

        // Confirm password validation
        const confirmPassword = document.getElementById('register-confirm-password');
        if (confirmPassword) {
            confirmPassword.addEventListener('blur', () => this.validateConfirmPassword());
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const remember = formData.get('remember') === 'on';

        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        try {
            this.setLoading(submitBtn, true);
            
            // Simulate network delay for better UX
            await this.delay(800);
            
            const user = await this.auth.login(email, password, remember);  // ✅ Added await!
            
            this.showToast(`Welcome back, ${user.profile.firstName}! 🎉`, 'success');
            
            // Redirect after short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
        } catch (error) {
            this.showToast(error.message, 'error');
            this.setLoading(submitBtn, false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = {
            email: formData.get('email'),
            password: formData.get('password'),
            firstName: formData.get('firstname'),
            lastName: formData.get('lastname')
        };

        const confirmPassword = formData.get('confirmPassword');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        try {
            // Validate passwords match
            if (userData.password !== confirmPassword) {
                throw new Error('Passwords do not match');
            }

            this.setLoading(submitBtn, true);
            
            // Simulate network delay
            await this.delay(1000);
            
            const user = await this.auth.register(userData);  // ✅ Added await!
            
            this.showToast(`Account created successfully! Welcome, ${user.profile.firstName}! 🎉`, 'success');
            
            // Auto login and redirect
            await this.auth.login(userData.email, userData.password);  // ✅ Added await!
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            
        } catch (error) {
            this.showToast(error.message, 'error');
            this.setLoading(submitBtn, false);
        }
    }

    handleGuestMode() {
        // Set guest mode flag
        localStorage.setItem('moneymate_guestMode', 'true');
        localStorage.setItem('moneymate_guestSession', Date.now().toString());
        
        this.showToast('Entering guest mode... 👤', 'info');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 800);
    }

    async loginWithCredentials(email, password) {
        try {
            const user = await this.auth.login(email, password);  // ✅ Added await!
            this.showToast(`Logged in as ${user.profile.firstName} ${user.profile.lastName} 🎉`, 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.auth-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        document.getElementById(`${sectionName}-section`).classList.add('active');
        
        // Update auth toggle text based on current section
        const authToggle = document.getElementById('signin-signup-toggle');
        if (authToggle) {
            if (sectionName === 'login') {
                authToggle.textContent = 'Switch to Sign Up';
            } else if (sectionName === 'register') {
                authToggle.textContent = 'Switch to Sign In';
            }
        }
        
        // Store current section for toggle functionality
        this.currentSection = sectionName;
        
        // Update page title
        document.title = sectionName === 'login' ? 'Login - Money Mate' : 'Register - Money Mate';
    }

    toggleAuthSection() {
        // Toggle between login and register sections
        if (this.currentSection === 'login') {
            this.showSection('register');
        } else {
            this.showSection('login');
        }
    }

    // Validation methods
    validateEmail(input) {
        const email = input.value.trim();
        const formGroup = input.closest('.form-group');
        
        if (!email) {
            this.showFieldError(formGroup, 'Email is required');
            return false;
        }
        
        if (!this.auth.isValidEmail(email)) {
            this.showFieldError(formGroup, 'Please enter a valid email address');
            return false;
        }
        
        this.showFieldSuccess(formGroup);
        return true;
    }

    validatePassword(input) {
        const password = input.value;
        const formGroup = input.closest('.form-group');
        
        if (!password) {
            this.showFieldError(formGroup, 'Password is required');
            return false;
        }
        
        if (password.length < 6) {
            this.showFieldError(formGroup, 'Password must be at least 6 characters');
            return false;
        }
        
        this.showFieldSuccess(formGroup);
        return true;
    }

    validateConfirmPassword() {
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const formGroup = document.getElementById('register-confirm-password').closest('.form-group');
        
        if (!confirmPassword) {
            this.showFieldError(formGroup, 'Please confirm your password');
            return false;
        }
        
        if (password !== confirmPassword) {
            this.showFieldError(formGroup, 'Passwords do not match');
            return false;
        }
        
        this.showFieldSuccess(formGroup);
        return true;
    }

    showFieldError(formGroup, message) {
        this.clearValidation(formGroup.querySelector('input'));
        formGroup.classList.add('error');
        
        let errorMsg = formGroup.querySelector('.error-message');
        if (!errorMsg) {
            errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            formGroup.appendChild(errorMsg);
        }
        errorMsg.innerHTML = `⚠️ ${message}`;
    }

    showFieldSuccess(formGroup) {
        this.clearValidation(formGroup.querySelector('input'));
        formGroup.classList.add('success');
    }

    clearValidation(input) {
        const formGroup = input.closest('.form-group');
        formGroup.classList.remove('error', 'success');
        
        const errorMsg = formGroup.querySelector('.error-message');
        if (errorMsg) {
            errorMsg.remove();
        }
    }

    setLoading(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast toast--${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize auth controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AuthController();
});