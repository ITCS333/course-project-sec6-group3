let users = [];
let sortAscending = true;

/*
|--------------------------------------------------------------------------
| CREATE USER ROW
|--------------------------------------------------------------------------
*/

function createUserRow(user) {

    const tr = document.createElement('tr');

    tr.innerHTML = `
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.is_admin == 1 ? 'Yes' : 'No'}</td>
        <td>
            <button class="edit-btn" data-id="${user.id}">
                Edit
            </button>

            <button class="delete-btn" data-id="${user.id}">
                Delete
            </button>
        </td>
    `;

    return tr;
}

/*
|--------------------------------------------------------------------------
| RENDER TABLE
|--------------------------------------------------------------------------
*/

function renderTable(data = users) {

    const tbody = document.getElementById('users-tbody');

    if (!tbody) return;

    tbody.innerHTML = '';

    data.forEach(user => {
        tbody.appendChild(createUserRow(user));
    });
}

/*
|--------------------------------------------------------------------------
| CHANGE PASSWORD
|--------------------------------------------------------------------------
*/

function handleChangePassword(event) {

    event.preventDefault();

    const newPassword =
        document.getElementById('new-password').value;

    const confirmPassword =
        document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {

        alert('Passwords do not match');

        return;
    }

    if (newPassword.length < 8) {

        alert('Password must be at least 8 characters');

        return;
    }

    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';

    alert('Password changed successfully');
}

/*
|--------------------------------------------------------------------------
| ADD USER
|--------------------------------------------------------------------------
*/

function handleAddUser(event) {

    event.preventDefault();

    const name =
        document.getElementById('user-name').value.trim();

    const email =
        document.getElementById('user-email').value.trim();

    const password =
        document.getElementById('default-password').value;

    const isAdmin =
        document.getElementById('is-admin').checked ? 1 : 0;

    if (!name || !email || !password) {

        alert('All fields are required');

        return;
    }

    fetch('../admin/api/index.php', {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                name: name,
                email: email,
                password: password,
                is_admin: isAdmin
            })
        })
        .then(response => response.json())
        .then(() => {
            loadUsersAndInitialize();
        });
}

/*
|--------------------------------------------------------------------------
| TABLE CLICK
|--------------------------------------------------------------------------
*/

function handleTableClick(event) {

    if (event.target.classList.contains('delete-btn')) {

        const id = event.target.dataset.id;

        fetch(`../admin/api/index.php?id=${id}`, {

                method: 'DELETE'
            })
            .then(response => response.json())
            .then(() => {
                loadUsersAndInitialize();
            });
    }
}

/*
|--------------------------------------------------------------------------
| SEARCH
|--------------------------------------------------------------------------
*/

function handleSearch(event) {

    const term = event.target.value.toLowerCase();

    if (!term) {

        renderTable(users);

        return;
    }

    const filtered = users.filter(user => {

        return (
            user.name.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term)
        );
    });

    renderTable(filtered);
}

/*
|--------------------------------------------------------------------------
| SORT
|--------------------------------------------------------------------------
*/

function handleSort() {

    users.sort((a, b) => {

        if (sortAscending) {
            return a.name.localeCompare(b.name);
        }

        return b.name.localeCompare(a.name);
    });

    sortAscending = !sortAscending;

    renderTable(users);
}

/*
|--------------------------------------------------------------------------
| LOAD USERS
|--------------------------------------------------------------------------
*/

function loadUsersAndInitialize() {

    return fetch('../admin/api/index.php')

    .then(response => response.json())

    .then(data => {

        users = data.users || [];

        renderTable(users);

        const passwordForm =
            document.getElementById('password-form');

        if (passwordForm) {

            passwordForm.addEventListener(
                'submit',
                handleChangePassword
            );
        }

        const addUserForm =
            document.getElementById('add-user-form');

        if (addUserForm) {

            addUserForm.addEventListener(
                'submit',
                handleAddUser
            );
        }

        const table =
            document.getElementById('users-tbody');

        if (table) {

            table.addEventListener(
                'click',
                handleTableClick
            );
        }

        const search =
            document.getElementById('search-input');

        if (search) {

            search.addEventListener(
                'input',
                handleSearch
            );
        }

        const sortBtn =
            document.getElementById('sort-btn');

        if (sortBtn) {

            sortBtn.addEventListener(
                'click',
                handleSort
            );
        }
    });
}

/*
|--------------------------------------------------------------------------
| INITIALIZE
|--------------------------------------------------------------------------
*/

document.addEventListener('DOMContentLoaded', () => {
    loadUsersAndInitialize();
});