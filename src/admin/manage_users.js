const API_BASE = '../auth/api.php';

let currentEditId = null;

/**
 * Check if user is logged in and is admin
 */
async function checkAdminAccess() {
    try {
        const response = await fetch(`${API_BASE}?action=check`);
        if (response.status === 200) {
            const data = await response.json();
            if (!data.logged_in) {
                window.location.href = '../auth/login.html';
                return false;
            }
            if (!data.is_admin) {
                document.getElementById('users-container').innerHTML =
                    '<div class="loading" style="color: red;">Access Denied. Admin privileges required.</div>';
                return false;
            }
            return true;
        }
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '../auth/login.html';
        return false;
    }
}

/**
 * Load and display all users
 */
async function loadUsers() {
    const container = document.getElementById('users-container');
    container.innerHTML = '<div class="loading">Loading users...</div>';

    try {
        const response = await fetch(`${API_BASE}?action=admin_list_users`);
        const result = await response.json();

        if (result.status === 'success') {
            displayUsers(result.users);
        } else {
            container.innerHTML = `<div class="message error">Error: ${result.message}</div>`;
        }
    } catch (error) {
        console.error('Load users error:', error);
        container.innerHTML = '<div class="message error">Network error. Please try again.</div>';
    }
}

/**
 * Display users in table format
 */
function displayUsers(users) {
    const container = document.getElementById('users-container');

    if (!users || users.length === 0) {
        container.innerHTML = '<div class="loading">No users found.</div>';
        return;
    }

    let html = `
        <table class="users-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created At</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    users.forEach(user => {
        const roleBadge = user.is_admin ?
            '<span class="badge badge-admin">Admin</span>' :
            '<span class="badge badge-student">Student</span>';

        html += `
            <tr>
                <td>${escapeHtml(String(user.id))}</td>
                <td>${escapeHtml(user.name)}</td>
                <td>${escapeHtml(user.email)}</td>
                <td>${roleBadge}</td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                    <button onclick="openEditModal(${user.id})" class="btn btn-edit">Edit</button>
                    <button onclick="deleteUser(${user.id})" class="btn btn-danger">Delete</button>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

/**
 * Open modal to create new user
 */
function openCreateModal() {
    currentEditId = null;
    document.getElementById('modalTitle').textContent = 'Add New User';
    document.getElementById('userId').value = '';
    document.getElementById('userName').value = '';
    document.getElementById('userEmail').value = '';
    document.getElementById('userPassword').value = '';
    document.getElementById('userPassword').required = true;
    document.getElementById('userRole').value = '0';
    document.getElementById('passwordGroup').style.display = 'block';
    document.getElementById('userModal').style.display = 'flex';
}

/**
 * Open modal to edit existing user
 */
async function openEditModal(userId) {
    try {
        const response = await fetch(`${API_BASE}?action=admin_list_users`);
        const result = await response.json();

        if (result.status === 'success') {
            const user = result.users.find(u => u.id === userId);
            if (user) {
                currentEditId = userId;
                document.getElementById('modalTitle').textContent = 'Edit User';
                document.getElementById('userId').value = user.id;
                document.getElementById('userName').value = user.name;
                document.getElementById('userEmail').value = user.email;
                document.getElementById('userPassword').value = '';
                document.getElementById('userPassword').required = false;
                document.getElementById('userRole').value = user.is_admin ? '1' : '0';
                document.getElementById('passwordGroup').style.display = 'block';
                document.getElementById('userModal').style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('Open edit error:', error);
        showMessage('Error loading user data', 'error');
    }
}

/**
 * Save user (create or update)
 */
async function saveUser(event) {
    event.preventDefault();

    const userId = document.getElementById('userId').value;
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;
    const is_admin = parseInt(document.getElementById('userRole').value);

    if (!name || !email) {
        showMessage('Name and email are required', 'error');
        return;
    }

    let action = 'admin_create_user';
    let body = { name, email, is_admin };

    if (userId) {
        action = 'admin_update_user';
        body.id = parseInt(userId);
    } else {
        if (!password) {
            showMessage('Password is required for new users', 'error');
            return;
        }
        body.password = password;
    }

    try {
        const response = await fetch(`${API_BASE}?action=${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const result = await response.json();

        if (result.status === 'success') {
            closeModal();
            loadUsers();
            showMessage(result.message, 'success');
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        console.error('Save user error:', error);
        showMessage('Network error. Please try again.', 'error');
    }
}

/**
 * Delete user
 */
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}?action=admin_delete_user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId })
        });
        const result = await response.json();

        if (result.status === 'success') {
            loadUsers();
            showMessage(result.message, 'success');
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        console.error('Delete user error:', error);
        showMessage('Network error. Please try again.', 'error');
    }
}

/**
 * Close modal
 */
function closeModal() {
    document.getElementById('userModal').style.display = 'none';
    document.getElementById('userForm').reset();
}

/**
 * Show message
 */
function showMessage(text, type) {
    const msgDiv = document.getElementById('message');
    msgDiv.textContent = text;
    msgDiv.className = `message ${type}`;
    setTimeout(() => {
        msgDiv.className = 'message';
        msgDiv.textContent = '';
    }, 4000);
}

/**
 * HTML escape helper
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

// Initialize
async function init() {
    const hasAccess = await checkAdminAccess();
    if (hasAccess) {
        loadUsers();
    }
}

// Attach event listeners
document.getElementById('userForm').addEventListener('submit', saveUser);
window.openCreateModal = openCreateModal;
window.openEditModal = openEditModal;
window.deleteUser = deleteUser;
window.closeModal = closeModal;

init();