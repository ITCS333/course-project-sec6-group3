const API_BASE = 'api.php';

/**
 * Display message in message-container
 * @param {string} message - The message text to display
 * @param {string} type - Either 'success' or 'error'
 */
function displayMessage(message, type) {
    const container = document.getElementById('message-container');
    if (!container) return;

    container.textContent = message;
    container.className = type;

    setTimeout(() => {
        if (container.textContent === message) {
            container.textContent = '';
            container.className = '';
        }
    }, 3000);
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;

    const atIndex = email.indexOf('@');
    if (atIndex === -1) return false;

    const domain = email.substring(atIndex + 1);
    if (domain.indexOf('.') === -1) return false;

    if (atIndex === 0 || domain.length < 3) return false;

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
 * @param {Event} event
 */
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!isValidEmail(email)) {
        displayMessage('Please enter a valid email address', 'error');
        return;
    }

    if (!isValidPassword(password)) {
        displayMessage('Password must be at least 8 characters long', 'error');
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
            setTimeout(() => {
                window.location.href = '../../index.html';
            }, 1000);
        } else {
            displayMessage(result.message || 'Invalid email or password', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        displayMessage('Network error. Please try again.', 'error');
    }
}


function setupLoginForm() {
    const form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', handleLogin);
    }
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupLoginForm);
    } else {
        setupLoginForm();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        displayMessage,
        isValidEmail,
        isValidPassword,
        handleLogin,
        setupLoginForm
    };
}