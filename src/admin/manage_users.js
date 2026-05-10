var users = [];

function renderUsers() {

    var tbody = document.getElementById('user-table-body');

    if (!tbody) return;

    tbody.innerHTML = '';

    users.forEach(function(user) {

        var row = document.createElement('tr');

        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.is_admin ? 'Yes' : 'No'}</td>
            <td>
                <button class="delete-btn" data-id="${user.id}">
                    Delete
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function loadUsers() {

    fetch('../admin/api/index.php')

    .then(function(response) {
        return response.json();
    })

    .then(function(data) {

        if (data.status === 'success') {

            users = data.users;

            renderUsers();
        }
    });
}

function addUser(event) {

    event.preventDefault();

    var name = document.getElementById('user-name').value.trim();
    var email = document.getElementById('user-email').value.trim();
    var password = document.getElementById('default-password').value;
    var is_admin = document.getElementById('is-admin').checked ? 1 : 0;

    fetch('../admin/api/index.php', {

        method: 'POST',

        headers: {
            'Content-Type': 'application/json'
        },

        body: JSON.stringify({
            name: name,
            email: email,
            password: password,
            is_admin: is_admin
        })
    })

    .then(function(response) {
        return response.json();
    })

    .then(function(data) {

        if (data.status === 'success') {

            loadUsers();

            document.getElementById('add-user-form').reset();
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {

    loadUsers();

    var form = document.getElementById('add-user-form');

    if (form) {
        form.addEventListener('submit', addUser);
    }
});