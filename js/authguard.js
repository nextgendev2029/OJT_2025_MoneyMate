/**
 * Authentication Guard
 * Protects routes and ensures users are authenticated before accessing the app
 * Handles "Remember me for 30 days" functionality
 */

class AuthGuard {
    constructor() {
        this.AUTH_KEY = 'moneymate_currentUser';
        this.REMEMBER_KEY = 'moneymate_rememberMe';
        this.REMEMBER_EXPIRY_KEY = 'moneymate_rememberExpiry';
        this.GUEST_MODE_KEY = 'moneymate_guestMode';
        this.REMEMBER_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        // Check for guest mode
        const guestMode = localStorage.getItem(this.GUEST_MODE_KEY);
        if (guestMode === 'true') {
            return true;
        }

        // Check for session login (temporary - cleared when browser closes)
        const sessionUser = sessionStorage.getItem(this.AUTH_KEY);
        if (sessionUser) {
            try {
                const user = JSON.parse(sessionUser);
                if (user && user.email) {
                    return true;
                }
            } catch (error) {
                console.error('Error parsing session user data:', error);
            }
        }

        // Check for persistent login (with remember me)
        const currentUser = localStorage.getItem(this.AUTH_KEY);
        if (!currentUser) {
            return false;
        }

        try {
            const user = JSON.parse(currentUser);
            if (user && user.email) {
                // Check if remember me is still valid
                if (this.hasValidRememberMe()) {
                    return true;
                }
                // Remember me expired, clear localStorage but keep session if exists
                if (!sessionUser) {
                    localStorage.removeItem(this.AUTH_KEY);
                    this.clearRememberMe();
                    return false;
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return false;
        }
    }

    /**
     * Check if "Remember me" is active and valid
     * @returns {boolean}
     */
    hasValidRememberMe() {
        const rememberMe = localStorage.getItem(this.REMEMBER_KEY);
        const rememberExpiry = localStorage.getItem(this.REMEMBER_EXPIRY_KEY);

        if (rememberMe !== 'true' || !rememberExpiry) {
            return false;
        }

        const expiryTime = parseInt(rememberExpiry, 10);
        const currentTime = Date.now();

        // Check if remember me has expired
        if (currentTime > expiryTime) {
            // Clear expired remember me
            this.clearRememberMe();
            return false;
        }

        return true;
    }

    /**
     * Set "Remember me" with 30-day expiration
     */
    setRememberMe() {
        const expiryTime = Date.now() + this.REMEMBER_DURATION;
        localStorage.setItem(this.REMEMBER_KEY, 'true');
        localStorage.setItem(this.REMEMBER_EXPIRY_KEY, expiryTime.toString());
    }

    /**
     * Clear "Remember me" data
     */
    clearRememberMe() {
        localStorage.removeItem(this.REMEMBER_KEY);
        localStorage.removeItem(this.REMEMBER_EXPIRY_KEY);
    }

    /**
     * Check if user should be allowed to access the app
     * @returns {boolean}
     */
    canAccessApp() {
        return this.isAuthenticated() && this.hasValidRememberMe();
    }

    /**
     * Check if user should skip landing page
     * @returns {boolean}
     */
    shouldSkipLanding() {
        return this.isAuthenticated() && this.hasValidRememberMe();
    }

    /**
     * Protect a page - redirect to landing if not authenticated
     * @param {string} currentPage - Current page name (e.g., 'index.html')
     */
    protectPage(currentPage = 'index.html') {
        // Don't protect landing.html or login.html
        if (currentPage === 'landing.html' || currentPage === 'login.html') {
            return;
        }

        // Check if user is authenticated
        if (!this.isAuthenticated()) {
            console.log('User not authenticated, redirecting to landing page');
            window.location.href = 'landing.html';
            return;
        }

        // User is authenticated - allow access
        console.log('User authenticated, access granted');

        // Note: Remember me only controls whether to skip landing page on next visit
        // It does NOT prevent access to the app if user is already logged in
    }

    /**
     * Get remaining days for remember me
     * @returns {number} Days remaining, or 0 if not set/expired
     */
    getRemainingDays() {
        const rememberExpiry = localStorage.getItem(this.REMEMBER_EXPIRY_KEY);
        if (!rememberExpiry) {
            return 0;
        }

        const expiryTime = parseInt(rememberExpiry, 10);
        const currentTime = Date.now();
        const remainingMs = expiryTime - currentTime;

        if (remainingMs <= 0) {
            return 0;
        }

        return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    }

    /**
     * Get current user data
     * @returns {object|null}
     */
    getCurrentUser() {
        // Check sessionStorage first (current session)
        const sessionUser = sessionStorage.getItem(this.AUTH_KEY);
        if (sessionUser) {
            try {
                return JSON.parse(sessionUser);
            } catch (error) {
                console.error('Error parsing session user data:', error);
            }
        }

        // Check localStorage (persistent with remember me)
        const currentUser = localStorage.getItem(this.AUTH_KEY);
        if (!currentUser) {
            return null;
        }

        try {
            return JSON.parse(currentUser);
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }

    /**
     * Logout user and clear all authentication data
     */
    logout() {
        sessionStorage.removeItem(this.AUTH_KEY);
        localStorage.removeItem(this.AUTH_KEY);
        this.clearRememberMe();
        localStorage.removeItem(this.GUEST_MODE_KEY);
        window.location.href = 'landing.html';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthGuard;
}

// Make available globally
window.AuthGuard = AuthGuard;
