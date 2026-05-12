/*
  Requirement: Populate the "Course Resources" list page.
*/

// --- Element Selections ---
const resourceListSection = document.querySelector('#resource-list-section');

// --- Functions ---

function createResourceArticle(resource) {
  const article = document.createElement('article');

  const title = document.createElement('h2');
  title.textContent = resource.title;

  const description = document.createElement('p');
  description.textContent = resource.description;

  const link = document.createElement('a');
  link.href = `details.html?id=${resource.id}`;
  link.textContent = 'View Resource & Discussion';

  article.appendChild(title);
  article.appendChild(description);
  article.appendChild(link);

  return article;
}

async function loadResources() {
  try {
    const response = await fetch('./api/index.php');
    const result = await response.json();

    resourceListSection.innerHTML = '';

    if (result.success && Array.isArray(result.data)) {
      result.data.forEach(resource => {
        const article = createResourceArticle(resource);
        resourceListSection.appendChild(article);
      });
    } else {
      resourceListSection.textContent = 'No resources found.';
    }
  } catch (error) {
    resourceListSection.textContent = 'Error loading resources.';
    console.error(error);
  }
}

// --- Initial Page Load ---
loadResources();
