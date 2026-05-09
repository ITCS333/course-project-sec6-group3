// src/admin/manage_users.js

let users = []; // Global users array for sorting/filtering
let sortDirection = 'asc'; // Track sort direction

/**
 * Creates a table row for a user
 * @param {Object} user - User object with id, name, email, is_admin
 * @returns {HTMLTableRowElement} - Table row element
 */
function createUserRow(user) {
    const row = document.createElement('tr');

    // Name cell
    const nameCell = document.createElement('td');
    nameCell.textContent = user.name;
    row.appendChild(nameCell);

    // Email cell
    const emailCell = document.createElement('td');
    emailCell.textContent = user.email;
    row.appendChild(emailCell);

    // Admin status cell
    const adminCell = document.createElement('td');
    adminCell.textContent = user.is_admin === 1 ? 'Yes' : 'No';
    row.appendChild(adminCell);

    // Actions cell with edit and delete buttons
    const actionsCell = document.createElement('td');

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'edit-btn';
    editBtn.setAttribute('data-id', user.id);
    actionsCell.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'delete-btn';
    deleteBtn.setAttribute('data-id', user.id);
    actionsCell.appendChild(deleteBtn);

    row.appendChild(actionsCell);

    return row;
}

/**
 * Renders all users into the table body
 */
function renderTable() {
    const tbody = document.getElementById('user-table-body');
    if (!tbody) return;

    // Clear the tbody before rendering
    tbody.innerHTML = '';

    // Render one row per user
    users.forEach(user => {
        const row = createUserRow(user);
        tbody.appendChild(row);
    });
}

/**
 * Handles password change form submission
 * @param {Event} event - Submit event
 */
function handleChangePassword(event) {
    event.preventDefault();

    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Check if passwords match
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }

    // Check password length
    if (newPassword.length < 8) {
        alert('Password must be at least 8 characters');
        return;
    }

    // Clear password fields after successful validation
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';

    // Here you would typically send a fetch request to change password
    alert('Password changed successfully (demo)');
}

/**
 * Handles add user form submission
 * @param {Event} event - Submit event
 */
function handleAddUser(event) {
    event.preventDefault();

    const name = document.getElementById('user-name').value.trim();
    const email = document.getElementById('user-email').value.trim();
    const password = document.getElementById('default-password').value;
    const is_admin = document.getElementById('is-admin').value;

    // Check required fields
    if (!name || !email || !password) {
        alert('Please fill in all required fields');
        return;
    }

    // Send POST fetch request when inputs are valid
    fetch('../auth/api.php?action=admin_create_user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, is_admin: parseInt(is_admin) })
        })
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                alert('User added successfully');
                document.getElementById('add-user-form').reset();
                loadUsersAndInitialize();
            } else {
                alert(result.message || 'Failed to add user');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Network error. Please try again.');
        });
}

/**
 * Handles table button clicks (edit/delete)
 * @param {Event} event - Click event
 */
function handleTableClick(event) {
    const target = event.target;

    // Handle delete button
    if (target.classList.contains('delete-btn')) {
        const userId = target.getAttribute('data-id');

        if (confirm('Are you sure you want to delete this user?')) {
            // Send DELETE fetch request
            fetch('../auth/api.php?action=admin_delete_user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: parseInt(userId) })
                })
                .then(response => response.json())
                .then(result => {
                    if (result.status === 'success') {
                        alert('User deleted successfully');
                        loadUsersAndInitialize();
                    } else {
                        alert(result.message || 'Failed to delete user');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Network error. Please try again.');
                });
        }
    }

    // Handle edit button
    if (target.classList.contains('edit-btn')) {
        const userId = target.getAttribute('data-id');
        alert(`Edit user with ID: ${userId} (demo)`);
    }
}

/**
 * Handles search/filtering of users
 * @param {Event} event - Input event
 */
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const rows = document.querySelectorAll('#user-table-body tr');
    let visibleCount = 0;

    rows.forEach(row => {
        const name = row.cells[0] ? .textContent.toLowerCase() || '';
        const email = row.cells[1] ? .textContent.toLowerCase() || '';

        if (name.includes(searchTerm) || email.includes(searchTerm)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    // Show all rows when search term is cleared
    if (searchTerm === '') {
        rows.forEach(row => {
            row.style.display = '';
        });
    }
}

/**
 * Handles sorting of users by name
 */
function handleSort() {
    // Sort users by name based on current direction
    if (sortDirection === 'asc') {
        users.sort((a, b) => a.name.localeCompare(b.name));
        sortDirection = 'desc';
    } else {
        users.sort((a, b) => b.name.localeCompare(a.name));
        sortDirection = 'asc';
    }

    // Re-render the table with sorted users
    renderTable();

    // Re-attach search functionality to new rows
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.dispatchEvent(new Event('input'));
    }
}

/**
 * Loads users from API and initializes event listeners
 */
function loadUsersAndInitialize() {
    // Fetch users from API
    fetch('../auth/api.php?action=admin_list_users')
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                // Populate the users array from the API response
                users = result.users;
                renderTable();
            } else {
                console.error('Failed to load users:', result.message);
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
        });

    // Attach submit listener to password-form
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        // Remove existing listener to avoid duplicates
        passwordForm.removeEventListener('submit', handleChangePassword);
        passwordForm.addEventListener('submit', handleChangePassword);
    }

    // Attach submit listener to add-user-form
    const addUserForm = document.getElementById('add-user-form');
    if (addUserForm) {
        // Remove existing listener to avoid duplicates
        addUserForm.removeEventListener('submit', handleAddUser);
        addUserForm.addEventListener('submit', handleAddUser);
    }

    // Attach click listener for table buttons (event delegation)
    const userTable = document.getElementById('user-table');
    if (userTable) {
        userTable.removeEventListener('click', handleTableClick);
        userTable.addEventListener('click', handleTableClick);
    }

    // Attach search input listener
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.removeEventListener('input', handleSearch);
        searchInput.addEventListener('input', handleSearch);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadUsersAndInitialize);
} else {
    loadUsersAndInitialize();
}

// Make functions globally available for tests
if (typeof window !== 'undefined') {
    window.createUserRow = createUserRow;
    window.renderTable = renderTable;
    window.handleChangePassword = handleChangePassword;
    window.handleAddUser = handleAddUser;
    window.handleTableClick = handleTableClick;
    window.handleSearch = handleSearch;
    window.handleSort = handleSort;
    window.loadUsersAndInitialize = loadUsersAndInitialize;
    window.users = users;
}

// Export for Node.js environment (tests)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createUserRow,
        renderTable,
        handleChangePassword,
        handleAddUser,
        handleTableClick,
        handleSearch,
        handleSort,
        loadUsersAndInitialize,
        users
    };
}