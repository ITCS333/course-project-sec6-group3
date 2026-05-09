// src/auth/login.js

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

// API Base URL (only for browser)
const API_BASE = 'api.php';

/**
 * Display message in message-container
 * @param {string} message - The message text to display
 * @param {string} type - Either 'success' or 'error'
 */
function displayMessage(message, type) {
    // Only run in browser environment
    if (!isBrowser) return;

    const container = document.getElementById('message-container');
    if (!container) return;

    container.textContent = message;
    container.className = type;

    // Auto-hide after 3 seconds (skip in test environment)
    if (typeof setTimeout !== 'undefined') {
        setTimeout(() => {
            if (container.textContent === message) {
                container.textContent = '';
                container.className = '';
            }
        }, 3000);
    }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;

    // Simple email validation: must contain @ and have a TLD
    const atIndex = email.indexOf('@');
    if (atIndex === -1) return false;

    const domain = email.substring(atIndex + 1);
    if (domain.indexOf('.') === -1) return false;

    if (atIndex === 0) return false;

    return true;
}

/**
 * Validate password length
 * @param {string} password - Password to validate
 * @returns {boolean} - True if password length >= 8, false otherwise
 */
function isValidPassword(password) {
    if (!password || typeof password !== 'string') return false;
    return password.length >= 8;
}

/**
 * Handle login form submission
 * @param {Event} event - Submit event
 */
async function handleLogin(event) {
    // Prevent default form submission
    if (event && event.preventDefault) {
        event.preventDefault();
    }

    // Only run in browser environment
    if (!isBrowser) return;

    // Get form values
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    if (!emailInput || !passwordInput) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validate email
    if (!isValidEmail(email)) {
        displayMessage('Please enter a valid email address', 'error');
        return;
    }

    // Validate password
    if (!isValidPassword(password)) {
        displayMessage('Password must be at least 8 characters long', 'error');
        return;
    }

    // Check if fetch is available (browser environment)
    if (typeof fetch === 'undefined') {
        console.log('Fetch not available in test environment');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}?action=login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (response.status === 200 && result.status === 'success') {
            displayMessage('Login successful! Redirecting...', 'success');
            if (typeof setTimeout !== 'undefined') {
                setTimeout(() => {
                    window.location.href = '../../index.html';
                }, 1000);
            }
        } else {
            displayMessage(result.message || 'Invalid email or password', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        displayMessage('Network error. Please try again.', 'error');
    }
}

/**
 * Attach submit listener to login form
 */
function setupLoginForm() {
    // Only run in browser environment
    if (!isBrowser) return;

    const form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', handleLogin);
    }
}

// Auto-initialize when DOM is ready (only in browser)
if (isBrowser) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupLoginForm);
    } else {
        setupLoginForm();
    }
}

// Export for Node.js environment (tests)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        displayMessage,
        isValidEmail,
        isValidPassword,
        handleLogin,
        setupLoginForm
    };
}

// Make functions available globally for browser
if (typeof window !== 'undefined') {
    window.displayMessage = displayMessage;
    window.isValidEmail = isValidEmail;
    window.isValidPassword = isValidPassword;
    window.handleLogin = handleLogin;
    window.setupLoginForm = setupLoginForm;
}