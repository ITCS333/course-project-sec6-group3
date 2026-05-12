/*
  Requirement: Make the "Manage Resources" page interactive.
*/

// --- Global Data Store ---
let resources = [];
let editingResourceId = null;

// --- Element Selections ---
const resourceForm = document.querySelector("#resource-form");
const resourcesTbody = document.querySelector("#resources-tbody");
const addResourceButton = document.querySelector("#add-resource");

// --- Functions ---

function createResourceRow(resource) {
  const tr = document.createElement("tr");

  const titleTd = document.createElement("td");
  titleTd.textContent = resource.title;

  const descriptionTd = document.createElement("td");
  descriptionTd.textContent = resource.description;

  const linkTd = document.createElement("td");
  linkTd.textContent = resource.link;

  const actionsTd = document.createElement("td");

  const editButton = document.createElement("button");
  editButton.textContent = "Edit";
  editButton.className = "edit-btn";
  editButton.dataset.id = resource.id;

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.className = "delete-btn";
  deleteButton.dataset.id = resource.id;

  actionsTd.appendChild(editButton);
  actionsTd.appendChild(deleteButton);

  tr.appendChild(titleTd);
  tr.appendChild(descriptionTd);
  tr.appendChild(linkTd);
  tr.appendChild(actionsTd);

  return tr;
}

function renderTable(resourceList) {
  resourcesTbody.innerHTML = "";

  const listToRender = Array.isArray(resourceList) ? resourceList : resources;

  listToRender.forEach(function (resource) {
    const row = createResourceRow(resource);
    resourcesTbody.appendChild(row);
  });
}

async function handleAddResource(event) {
  event.preventDefault();

  const titleInput = document.querySelector("#resource-title");
  const descriptionInput = document.querySelector("#resource-description");
  const linkInput = document.querySelector("#resource-link");

  const title = titleInput.value;
  const description = descriptionInput.value;
  const link = linkInput.value;

  if (editingResourceId) {
    const response = await fetch(`./api/index.php?id=${editingResourceId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: editingResourceId,
        title: title,
        description: description,
        link: link
      })
    });

    const result = await response.json();

    if (result.success) {
      resources = resources.map(function (resource) {
        if (String(resource.id) === String(editingResourceId)) {
          return {
            id: editingResourceId,
            title: title,
            description: description,
            link: link
          };
        }

        return resource;
      });

      editingResourceId = null;
      addResourceButton.textContent = "Add Resource";
      renderTable();
      resourceForm.reset();
    }

    return;
  }

  const response = await fetch("./api/index.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: title,
      description: description,
      link: link
    })
  });

  const result = await response.json();

  if (result.success) {
    const newResource = {
      id: result.id || result.data?.id,
      title: title,
      description: description,
      link: link
    };

    resources.push(newResource);
    renderTable();
    resourceForm.reset();
  }
}

async function handleTableClick(event) {
  const target = event.target;

  if (target.classList.contains("delete-btn")) {
    const id = target.dataset.id;

    const response = await fetch(`./api/index.php?id=${id}`, {
      method: "DELETE"
    });

    const result = await response.json();

    if (result.success) {
      resources = resources.filter(function (resource) {
        return String(resource.id) !== String(id);
      });

      renderTable();
    }
  }

  if (target.classList.contains("edit-btn")) {
    const id = target.dataset.id;

    const resource = resources.find(function (item) {
      return String(item.id) === String(id);
    });

    if (!resource) {
      return;
    }

    document.querySelector("#resource-title").value = resource.title;
    document.querySelector("#resource-description").value = resource.description;
    document.querySelector("#resource-link").value = resource.link;

    editingResourceId = id;
    addResourceButton.textContent = "Update Resource";
  }
}

async function loadAndInitialize() {
  const response = await fetch("./api/index.php");
  const result = await response.json();

  if (result.success && Array.isArray(result.data)) {
    resources = result.data;
  } else {
    resources = [];
  }

  renderTable();

  if (!loadAndInitialize._listenersAttached) {
    resourceForm.addEventListener("submit", handleAddResource);
    resourcesTbody.addEventListener("click", handleTableClick);
    loadAndInitialize._listenersAttached = true;
  }
}

// --- Initial Page Load ---
loadAndInitialize();
