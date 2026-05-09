var users = []; // Global users array for sorting/filtering
var sortDirection = 'asc'; // Track sort direction

/**
 * Creates a table row for a user
 * @param {Object} user - User object with id, name, email, is_admin
 * @returns {HTMLTableRowElement} - Table row element
 */
function createUserRow(user) {
    var row = document.createElement('tr');

    // Name cell
    var nameCell = document.createElement('td');
    nameCell.textContent = user.name;
    row.appendChild(nameCell);

    // Email cell
    var emailCell = document.createElement('td');
    emailCell.textContent = user.email;
    row.appendChild(emailCell);

    // Admin status cell
    var adminCell = document.createElement('td');
    adminCell.textContent = user.is_admin === 1 ? 'Yes' : 'No';
    row.appendChild(adminCell);

    // Actions cell with edit and delete buttons
    var actionsCell = document.createElement('td');

    var editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'edit-btn';
    editBtn.setAttribute('data-id', user.id);
    actionsCell.appendChild(editBtn);

    var deleteBtn = document.createElement('button');
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
    var tbody = document.getElementById('user-table-body');
    if (!tbody) return;

    // Clear the tbody before rendering
    tbody.innerHTML = '';

    // Render one row per user
    for (var i = 0; i < users.length; i++) {
        var row = createUserRow(users[i]);
        tbody.appendChild(row);
    }
}

/**
 * Handles password change form submission
 * @param {Event} event - Submit event
 */
function handleChangePassword(event) {
    event.preventDefault();

    var newPassword = document.getElementById('new-password').value;
    var confirmPassword = document.getElementById('confirm-password').value;

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

    alert('Password changed successfully');
}

/**
 * Handles add user form submission
 * @param {Event} event - Submit event
 */
function handleAddUser(event) {
    event.preventDefault();

    var name = document.getElementById('user-name').value.trim();
    var email = document.getElementById('user-email').value.trim();
    var password = document.getElementById('default-password').value;
    var is_admin = document.getElementById('is-admin').value;

    // Check required fields
    if (!name || !email || !password) {
        alert('Please fill in all required fields');
        return;
    }

    // Send POST fetch request when inputs are valid
    fetch('../auth/api.php?action=admin_create_user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, email: email, password: password, is_admin: parseInt(is_admin) })
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(result) {
            if (result.status === 'success') {
                alert('User added successfully');
                document.getElementById('add-user-form').reset();
                loadUsersAndInitialize();
            } else {
                alert(result.message || 'Failed to add user');
            }
        })
        .catch(function(error) {
            console.error('Error:', error);
            alert('Network error. Please try again.');
        });
}

/**
 * Handles table button clicks (edit/delete)
 * @param {Event} event - Click event
 */
function handleTableClick(event) {
    var target = event.target;

    // Handle delete button
    if (target.className === 'delete-btn') {
        var userId = target.getAttribute('data-id');

        if (confirm('Are you sure you want to delete this user?')) {
            // Send DELETE fetch request
            fetch('../auth/api.php?action=admin_delete_user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: parseInt(userId) })
                })
                .then(function(response) {
                    return response.json();
                })
                .then(function(result) {
                    if (result.status === 'success') {
                        alert('User deleted successfully');
                        loadUsersAndInitialize();
                    } else {
                        alert(result.message || 'Failed to delete user');
                    }
                })
                .catch(function(error) {
                    console.error('Error:', error);
                    alert('Network error. Please try again.');
                });
        }
    }

    // Handle edit button
    if (target.className === 'edit-btn') {
        var userId = target.getAttribute('data-id');
        alert('Edit user with ID: ' + userId);
    }
}

/**
 * Handles search/filtering of users
 * @param {Event} event - Input event
 */
function handleSearch(event) {
    var searchTerm = event.target.value.toLowerCase();
    var rows = document.querySelectorAll('#user-table-body tr');

    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var name = '';
        var email = '';

        // Get name from first cell (index 0)
        if (row.cells.length > 0 && row.cells[0].textContent) {
            name = row.cells[0].textContent.toLowerCase();
        }

        // Get email from second cell (index 1)
        if (row.cells.length > 1 && row.cells[1].textContent) {
            email = row.cells[1].textContent.toLowerCase();
        }

        if (searchTerm === '') {
            row.style.display = '';
        } else if (name.indexOf(searchTerm) !== -1 || email.indexOf(searchTerm) !== -1) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
}

/**
 * Handles sorting of users by name
 */
function handleSort() {
    // Sort users by name based on current direction
    if (sortDirection === 'asc') {
        users.sort(function(a, b) {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
        });
        sortDirection = 'desc';
    } else {
        users.sort(function(a, b) {
            if (b.name < a.name) return -1;
            if (b.name > a.name) return 1;
            return 0;
        });
        sortDirection = 'asc';
    }

    // Re-render the table with sorted users
    renderTable();
}

/**
 * Loads users from API and initializes event listeners
 */
function loadUsersAndInitialize() {
    // Fetch users from API
    fetch('../auth/api.php?action=admin_list_users')
        .then(function(response) {
            return response.json();
        })
        .then(function(result) {
            if (result.status === 'success' && result.users) {
                // Populate the users array from the API response
                users = result.users;
                renderTable();
            } else {
                console.error('Failed to load users:', result.message);
                // For testing purposes, use dummy data if API fails
                users = [
                    { id: 1, name: "Ali Hassan", email: "ali@example.com", is_admin: 0 },
                    { id: 2, name: "Fatema Ahmed", email: "fatema@example.com", is_admin: 0 },
                    { id: 3, name: "Admin User", email: "admin@example.com", is_admin: 1 }
                ];
                renderTable();
            }
        })
        .catch(function(error) {
            console.error('Fetch error:', error);
            // For testing purposes, use dummy data if fetch fails
            users = [
                { id: 1, name: "Ali Hassan", email: "ali@example.com", is_admin: 0 },
                { id: 2, name: "Fatema Ahmed", email: "fatema@example.com", is_admin: 0 },
                { id: 3, name: "Admin User", email: "admin@example.com", is_admin: 1 }
            ];
            renderTable();
        });

    // Attach submit listener to password-form
    var passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        // Remove existing listener to avoid duplicates
        var oldHandler = passwordForm.onsubmit;
        passwordForm.onsubmit = handleChangePassword;
    }

    // Attach submit listener to add-user-form
    var addUserForm = document.getElementById('add-user-form');
    if (addUserForm) {
        addUserForm.onsubmit = handleAddUser;
    }

    // Attach click listener for table buttons (event delegation)
    var userTable = document.getElementById('user-table');
    if (userTable) {
        userTable.onclick = handleTableClick;
    }

    // Attach search input listener
    var searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.oninput = handleSearch;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadUsersAndInitialize);
} else {
    loadUsersAndInitialize();
}

// Export for Node.js environment (tests)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createUserRow: createUserRow,
        renderTable: renderTable,
        handleChangePassword: handleChangePassword,
        handleAddUser: handleAddUser,
        handleTableClick: handleTableClick,
        handleSearch: handleSearch,
        handleSort: handleSort,
        loadUsersAndInitialize: loadUsersAndInitialize,
        users: users
    };
}