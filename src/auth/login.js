const API_BASE = 'api.php';

/**
 * Checks if user is logged in and updates UI on index.html
 */
async function checkAuthStatus() {
    const authDiv = document.getElementById('auth-content');
    if (!authDiv) return;

    try {
        const response = await fetch(`${API_BASE}?action=check`);
        if (response.status === 200) {
            const data = await response.json();
            if (data.logged_in) {
                // User is logged in - show welcome message and logout button
                authDiv.innerHTML = `
                    <div class="user-info">
                        <p>Welcome back, <strong>${escapeHtml(data.username || 'User')}</strong>!</p>
                        <p>You are logged in as <strong>${data.is_admin ? 'Administrator' : 'Student'}</strong></p>
                        ${data.is_admin ? '<p>🔧 <a href="src/admin/manage_users.html" style="color:#2a5298;">Manage Users</a></p>' : ''}
                        <div class="auth-buttons">
                            <button onclick="logoutUser()" class="btn btn-danger">Logout</button>
                        </div>
                    </div>
                `;
            } else {
                // User is not logged in - show login/register buttons
                authDiv.innerHTML = `
                    <p>Please log in to access all course features and interact with the community.</p>
                    <div class="auth-buttons">
                        <a href="src/auth/login.html" class="btn btn-primary">Login</a>
                    </div>
                `;
            }
        } else {
            throw new Error('Failed to check auth status');
        }
    } catch (error) {
        console.error('Auth check error:', error);
        authDiv.innerHTML = `
            <p>Unable to check login status. Please try again later.</p>
            <div class="auth-buttons">
                <a href="src/auth/login.html" class="btn btn-primary">Login</a>
            </div>
        `;
    }
}

/**
 * Handles login form submission on login.html
 */
async function handleLogin(event) {
    if (!event) return;
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');
    if (!email || !password) {
        showMessage(messageDiv, 'Please fill in both fields', 'error');
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
            showMessage(messageDiv, 'Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1000);
        } else {
            showMessage(messageDiv, result.message || 'Invalid email or password', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage(messageDiv, 'Network error. Please try again.', 'error');
    }
}

/**
 * Logs out the current user
 */
async function logoutUser() {
    try {
        const response = await fetch(`${API_BASE}?action=logout`, {
            method: 'POST'
        });
        if (response.status === 200) {
            window.location.href = '../index.html';
        } else {
            console.error('Logout failed');
            alert('Logout failed. Please try again.');
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('Network error during logout.');
    }
}

/**
 * Helper function to show messages
 */
function showMessage(element, text, type) {
    if (!element) return;
    element.textContent = text;
    element.className = `message ${type}`;
    setTimeout(() => {
        element.className = 'message';
        element.textContent = '';
    }, 3000);
}

/**
 * HTML escape helper to prevent XSS
 */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Initialize based on which page we're on
if (document.getElementById('login-form')) {
    // We're on login.html
    const form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', handleLogin);
    }
} else if (document.getElementById('auth-content')) {
    // We're on index.html
    checkAuthStatus();
    // Make logoutUser available globally for onclick
    window.logoutUser = logoutUser;
}