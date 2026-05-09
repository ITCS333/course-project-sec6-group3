// src/admin/manage_users.js

var users = [];
var sortDirection = 'asc';

/**
 * Creates a table row for a user
 */
function createUserRow(user) {
    var row = document.createElement('tr');

    var nameCell = document.createElement('td');
    nameCell.textContent = user.name;
    row.appendChild(nameCell);

    var emailCell = document.createElement('td');
    emailCell.textContent = user.email;
    row.appendChild(emailCell);

    var adminCell = document.createElement('td');
    adminCell.textContent = user.is_admin === 1 ? 'Yes' : 'No';
    row.appendChild(adminCell);

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

    tbody.innerHTML = '';

    for (var i = 0; i < users.length; i++) {
        var row = createUserRow(users[i]);
        tbody.appendChild(row);
    }
}

/**
 * Handles password change form submission
 */
function handleChangePassword(event) {
    event.preventDefault();

    var newPassword = document.getElementById('new-password').value;
    var confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }

    if (newPassword.length < 8) {
        alert('Password must be at least 8 characters');
        return;
    }

    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
}

/**
 * Handles add user form submission
 */
function handleAddUser(event) {
    event.preventDefault();

    var name = document.getElementById('user-name').value.trim();
    var email = document.getElementById('user-email').value.trim();
    var password = document.getElementById('default-password').value;
    var is_admin = document.getElementById('is-admin').value;

    if (!name || !email || !password) {
        alert('Please fill in all required fields');
        return;
    }

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
 * Handles table button clicks
 */
function handleTableClick(event) {
    var target = event.target;

    if (target.classList && target.classList.contains('delete-btn')) {
        var userId = target.getAttribute('data-id');

        if (confirm('Are you sure you want to delete this user?')) {
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

    if (target.classList && target.classList.contains('edit-btn')) {
        var userId = target.getAttribute('data-id');
        alert('Edit user with ID: ' + userId);
    }
}

/**
 * Handles search/filtering
 */
function handleSearch(event) {
    var searchTerm = event.target.value.toLowerCase();
    var rows = document.querySelectorAll('#user-table-body tr');

    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var name = '';
        var email = '';

        if (row.cells[0] && row.cells[0].textContent) {
            name = row.cells[0].textContent.toLowerCase();
        }
        if (row.cells[1] && row.cells[1].textContent) {
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
 * Handles sorting by name
 */
function handleSort() {
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
    renderTable();
}

/**
 * Loads users and initializes event listeners
 */
function loadUsersAndInitialize() {
    fetch('../auth/api.php?action=admin_list_users')
        .then(function(response) {
            return response.json();
        })
        .then(function(result) {
            if (result.status === 'success' && result.users) {
                users = result.users;
                renderTable();
            }
        })
        .catch(function(error) {
            console.error('Failed to load users:', error);
        });

    var passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handleChangePassword);
    }

    var addUserForm = document.getElementById('add-user-form');
    if (addUserForm) {
        addUserForm.addEventListener('submit', handleAddUser);
    }

    var userTable = document.getElementById('user-table');
    if (userTable) {
        userTable.addEventListener('click', handleTableClick);
    }

    var searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    var sortHeader = document.querySelector('th');
    if (sortHeader) {
        sortHeader.addEventListener('click', handleSort);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadUsersAndInitialize);
} else {
    loadUsersAndInitialize();
}

// Export for tests
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