/*
  Requirement: Add interactivity and data management to the Admin Portal.

  Instructions:
  1. This file is loaded by the <script src="manage_users.js" defer> tag in manage_users.html.
     The 'defer' attribute guarantees the DOM is fully parsed before this script runs.
  2. Implement the JavaScript functionality as described in the TODO comments.
  3. All data is fetched from and written to the PHP API at '../api/index.php'.
     The local 'users' array is used only as a client-side cache for search and sort.
*/
const API_BASE_URL = "../api/index.php";

// --- Element Selections ---
// We can safely select elements here because 'defer' guarantees
// the HTML document is parsed before this script runs.
const userTableBody = document.getElementById("user-table-body");
const addUserForm   = document.getElementById("add-user-form");
const passwordForm  = document.getElementById("password-form");
const searchInput   = document.getElementById("search-input");
const tableHeaders  = document.querySelectorAll("#user-table thead th");

// --- Global Data Store ---
// This array will be populated with data fetched from the PHP API.
// It acts as a client-side cache so search and sort work without extra network calls.
let users = [];

// --- Functions ---

/**
 * TODO: Implement the createUserRow function.
 * This function takes a user object { id, name, email, is_admin } and returns a <tr> element.
 * The <tr> should contain:
 * 1. A <td> for the user's name.
 * 2. A <td> for the user's email.
 * 3. A <td> showing admin status, e.g. "Yes" if is_admin === 1, otherwise "No".
 * 4. A <td> containing two buttons:
 *    - An "Edit" button with class "edit-btn" and a data-id attribute set to the user's id.
 *    - A "Delete" button with class "delete-btn" and a data-id attribute set to the user's id.
 */
function createUserRow(user) {
    // Step 0: Create the <tr> element that will hold the user's row.
    const tr = document.createElement("tr");

    // Step 1: A <td> for the user's name.
    const nameTd = document.createElement("td");
    nameTd.textContent = user.name;

    // Step 2: A <td> for the user's email.
    const emailTd = document.createElement("td");
    emailTd.textContent = user.email;

    // Step 3: A <td> showing admin status — "Yes" if is_admin === 1, otherwise "No".
    const adminTd = document.createElement("td");
    adminTd.textContent = Number(user.is_admin) === 1 ? "Yes" : "No";

    // Step 4: A <td> containing the Edit and Delete buttons.
    const actionsTd = document.createElement("td");

    // Step 4a: "Edit" button with class "edit-btn" and data-id = user's id.
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "edit-btn";
    editBtn.dataset.id = user.id;

    // Step 4b: "Delete" button with class "delete-btn" and data-id = user's id.
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "delete-btn";
    deleteBtn.dataset.id = user.id;

    // Append the two buttons inside the actions <td>.
    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(deleteBtn);

    // Append all <td> cells to the <tr> in the order they appear in the table.
    tr.appendChild(nameTd);
    tr.appendChild(emailTd);
    tr.appendChild(adminTd);
    tr.appendChild(actionsTd);

    return tr;
}

/**
 * TODO: Implement the renderTable function.
 * This function takes an array of user objects.
 * It should:
 * 1. Clear the current content of the userTableBody.
 * 2. Loop through the provided array of users.
 * 3. For each user, call createUserRow and append the returned <tr> to userTableBody.
 */
function renderTable(list) {
    // Step 1: Clear the current content of the userTableBody.
    userTableBody.innerHTML = "";

    // Step 2 & 3: Loop through users; for each user, create a row and append it.
    list.forEach(user => {
        userTableBody.appendChild(createUserRow(user));
    });
}

/**
 * TODO: Implement the handleChangePassword function.
 * This function is called when the "Update Password" form is submitted.
 * It should:
 * 1. Prevent the form's default submission behaviour.
 * 2. Get the values from "current-password", "new-password", and "confirm-password" inputs.
 * 3. Perform client-side validation:
 *    - If "new-password" and "confirm-password" do not match, show an alert: "Passwords do not match."
 *    - If "new-password" is less than 8 characters, show an alert: "Password must be at least 8 characters."
 * 4. If validation passes, send a POST request to '../api/index.php?action=change_password'
 *    with a JSON body: { id, current_password, new_password }
 *    where 'id' is the currently logged-in admin's user id.
 * 5. On success, show an alert: "Password updated successfully!" and clear all three inputs.
 * 6. On failure, show the error message returned by the API.
 */
function handleChangePassword(event) {
    // Step 1: Prevent the form's default submission behaviour.
    event.preventDefault();

    // Step 2: Get the values from the three password inputs.
    const currentPassword = document.getElementById("current-password").value;
    const newPassword     = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    // Step 3: Client-side validation — passwords must match.
    if (newPassword !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    // Step 3: Client-side validation — minimum length 8 characters.
    if (newPassword.length < 8) {
        alert("Password must be at least 8 characters.");
        return;
    }

    // Step 4: Send POST request to the change_password endpoint.
    // The 'id' of the currently logged-in admin is determined server-side from the session.
    fetch(`${API_BASE_URL}?action=change_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            // Step 5: On success, show success alert.
            alert("Password updated successfully!");
        } else {
            // Step 6: On failure, show the error message returned by the API.
            alert(result.message || "Failed to update password");
        }
    })
    .catch(error => {
        console.error(error);
        alert("Failed to update password");
    });

    // Step 5: Clear all three inputs after submission.
    document.getElementById("current-password").value = "";
    document.getElementById("new-password").value = "";
    document.getElementById("confirm-password").value = "";
}

/**
 * TODO: Implement the handleAddUser function.
 * This function is called when the "Add User" form is submitted.
 * It should:
 * 1. Prevent the form's default submission behaviour.
 * 2. Get the values from "user-name", "user-email", "default-password", and "is-admin".
 * 3. Perform client-side validation:
 *    - If name, email, or password are empty, show an alert: "Please fill out all required fields."
 *    - If password is less than 8 characters, show an alert: "Password must be at least 8 characters."
 * 4. If validation passes, send a POST request to '../api/index.php'
 *    with a JSON body: { name, email, password, is_admin }
 * 5. On success (HTTP 201), re-fetch the full user list by calling loadUsersAndInitialize()
 *    so the table reflects the new record from the database.
 * 6. Clear the form inputs on success.
 * 7. On failure, show the error message returned by the API.
 */
function handleAddUser(event) {
    // Step 1: Prevent the form's default submission behaviour.
    event.preventDefault();

    // Step 2: Get the values from the four input fields.
    const name     = document.getElementById("user-name").value.trim();
    const email    = document.getElementById("user-email").value.trim();
    const password = document.getElementById("default-password").value;
    const isAdmin  = document.getElementById("is-admin").value;

    // Step 3: Client-side validation — required fields must not be empty.
    if (!name || !email || !password) {
        alert("Please fill out all required fields.");
        return;
    }

    // Step 3: Client-side validation — minimum password length of 8 characters.
    if (password.length < 8) {
        alert("Password must be at least 8 characters.");
        return;
    }

    // Step 4: Send POST request with the new user's data.
    fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, is_admin: Number(isAdmin) })
    })
    .then(response => {
        // Step 5: On success (HTTP 201), re-fetch the full user list so the
        // table reflects the new record from the database.
        if (response.status === 201) {
            // Step 6: Clear the form inputs on success.
            document.getElementById("user-name").value = "";
            document.getElementById("user-email").value = "";
            document.getElementById("default-password").value = "";
            document.getElementById("is-admin").value = "0";
            loadUsersAndInitialize();
        } else {
            // Step 7: On failure, show the error message returned by the API.
            return response.json().then(result => {
                alert(result.message || "Failed to add user");
            });
        }
    })
    .catch(error => {
        console.error(error);
        alert("Failed to add user");
    });
}

/**
 * TODO: Implement the handleTableClick function.
 * This function is an event listener on userTableBody (event delegation).
 * It should:
 * 1. Check if the clicked element has the class "delete-btn".
 * 2. If it is a "delete-btn":
 *    - Get the data-id attribute from the button (this is the user's database id).
 *    - Send a DELETE request to '../api/index.php?id=' + id.
 *    - On success, remove the user from the local 'users' array and call renderTable(users).
 *    - On failure, show the error message returned by the API.
 * 3. If it is an "edit-btn":
 *    - Get the data-id attribute from the button.
 *    - (Optional) Populate an edit form or prompt with the user's current data
 *      and send a PUT request to '../api/index.php' with the updated fields.
 */
function handleTableClick(event) {
    const target = event.target;

    // Step 1 & 2: If the clicked element is a "delete-btn".
    if (target.classList.contains("delete-btn")) {
        // Step 2a: Get the user's database id from the button's data-id.
        const userId = target.dataset.id;

        // Step 2b: Send a DELETE request to the API.
        fetch(`${API_BASE_URL}?id=${userId}`, {
            method: "DELETE"
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // Step 2c: On success, remove the user from the local 'users'
                // array and re-render the table.
                users = users.filter(u => String(u.id) !== String(userId));
                renderTable(users);
            } else {
                // Step 2d: On failure, show the error message returned by the API.
                alert(result.message || "Failed to delete user");
            }
        })
        .catch(error => {
            console.error(error);
            alert("Error deleting user");
        });
        return;
    }

    // Step 3: If the clicked element is an "edit-btn".
    if (target.classList.contains("edit-btn")) {
        // Step 3a: Get the user's id from the button's data-id.
        const userId = target.dataset.id;
        const current = users.find(u => String(u.id) === String(userId));
        if (!current) return;

        // Step 3b: Prompt the admin for the new values (Optional per the TODO).
        const newName = prompt("Name:", current.name);
        if (newName === null) return;
        const newEmail = prompt("Email:", current.email);
        if (newEmail === null) return;
        const newIsAdmin = prompt("Admin? (0 = No, 1 = Yes):", current.is_admin);
        if (newIsAdmin === null) return;

        // Step 3c: Send a PUT request to update the user.
        fetch(API_BASE_URL, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: Number(userId),
                name: newName.trim(),
                email: newEmail.trim(),
                is_admin: Number(newIsAdmin)
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // On success, re-fetch the full user list to reflect the update.
                loadUsersAndInitialize();
            } else {
                alert(result.message || "Failed to update user");
            }
        })
        .catch(error => {
            console.error(error);
            alert("Error updating user");
        });
    }
}

/**
 * TODO: Implement the handleSearch function.
 * This function is called on the "input" event of the searchInput.
 * It should:
 * 1. Get the search term from searchInput.value and convert it to lowercase.
 * 2. If the search term is empty, call renderTable(users) to show all users.
 * 3. Otherwise, filter the local 'users' array to find users whose name or email
 *    (converted to lowercase) includes the search term.
 * 4. Call renderTable with the filtered array.
 *    (This filters the client-side cache only; no extra API call is needed.)
 */
function handleSearch() {
    // Step 1: Get the search term and convert to lowercase.
    const term = searchInput.value.toLowerCase();

    // Step 2: If empty, render all users.
    if (!term) {
        renderTable(users);
        return;
    }

    // Step 3: Filter the local 'users' array by name or email (case-insensitive).
    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
    );

    // Step 4: Render the filtered list (no API call needed — uses cache).
    renderTable(filtered);
}

/**
 * TODO: Implement the handleSort function.
 * This function is called when any <th> in the thead is clicked.
 * It should:
 * 1. Identify which column was clicked using event.currentTarget.cellIndex.
 * 2. Map the cell index to a property name:
 *    - index 0 -> 'name'
 *    - index 1 -> 'email'
 *    - index 2 -> 'is_admin'
 * 3. Toggle sort direction using a data-sort-dir attribute on the <th>
 *    between "asc" and "desc".
 * 4. Sort the local 'users' array in place using array.sort():
 *    - For 'name' and 'email', use localeCompare for string comparison.
 *    - For 'is_admin', compare the values as numbers.
 * 5. Respect the sort direction (ascending or descending).
 * 6. Call renderTable(users) to update the view.
 */
function handleSort(event) {
    // Step 1: Identify which <th> was clicked.
    const th    = event.currentTarget;
    const index = th.cellIndex;

    // Step 2: Map the column index to a property name on the user object.
    const columnMap = { 0: 'name', 1: 'email', 2: 'is_admin' };
    const property  = columnMap[index];

    // The "Actions" column (index 3) isn't sortable.
    if (!property) return;

    // Step 3: Toggle sort direction. Default to 'asc' on first click.
    const newDir = th.dataset.sortDir === 'asc' ? 'desc' : 'asc';
    th.dataset.sortDir = newDir;

    // Step 4 & 5: Sort the local 'users' array in place, respecting direction.
    users.sort((a, b) => {
        let cmp;
        if (property === 'is_admin') {
            // For 'is_admin', compare as numbers.
            cmp = Number(a.is_admin) - Number(b.is_admin);
        } else {
            // For 'name' and 'email', use localeCompare for string comparison.
            cmp = String(a[property]).localeCompare(String(b[property]));
        }
        return newDir === 'asc' ? cmp : -cmp;
    });

    // Step 6: Re-render the table with the newly sorted users array.
    renderTable(users);
}

/**
 * TODO: Implement the loadUsersAndInitialize function.
 * This function must be async.
 * It should:
 * 1. Send a GET request to '../api/index.php' using fetch().
 * 2. Check if the response is ok. If not, log the error and show an alert.
 * 3. Parse the JSON response: await response.json().
 *    The API returns { success: true, data: [ ...users ] }.
 * 4. Assign the data array to the global 'users' variable.
 * 5. Call renderTable(users) to populate the table.
 * 6. Attach all event listeners (only on the first call, or use { once: true } where appropriate):
 *    - "submit" on changePasswordForm  -> handleChangePassword
 *    - "submit" on addUserForm         -> handleAddUser
 *    - "click"  on userTableBody       -> handleTableClick
 *    - "input"  on searchInput         -> handleSearch
 *    - "click"  on each th in tableHeaders -> handleSort
 */
async function loadUsersAndInitialize() {
    try {
        // Step 1: Send a GET request to the API.
        const response = await fetch(API_BASE_URL);

        // Step 2: Check if the response is ok; if not, log and alert.
        if (!response.ok) {
            console.error(`HTTP error: ${response.status}`);
            alert("Failed to load users");
            return;
        }

        // Step 3: Parse the JSON response.
        const result = await response.json();

        // Step 4: Assign the data array to the global 'users' variable.
        users = result.data;

        // Step 5: Render the table.
        renderTable(users);

        // Step 6: Attach all event listeners only on the first call.
        // The _listenersAttached flag ensures we don't attach them again
        // when loadUsersAndInitialize is called after add/edit/delete.
        if (!loadUsersAndInitialize._listenersAttached) {
            passwordForm.addEventListener("submit", handleChangePassword);
            addUserForm.addEventListener("submit", handleAddUser);
            userTableBody.addEventListener("click", handleTableClick);
            searchInput.addEventListener("input", handleSearch);
            tableHeaders.forEach(th => th.addEventListener("click", handleSort));
            loadUsersAndInitialize._listenersAttached = true;
        }
    } catch (error) {
        console.error(error);
        alert("Failed to load users");
    }
}

// --- Initial Page Load ---
loadUsersAndInitialize();
