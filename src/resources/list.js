// --- Element Selections ---
const resourceListSection = document.querySelector('#resource-list-section');

// --- Functions ---

/**
 * Creates an <article> element for a resource object.
 * @param {Object} resource - { id, title, description, link }
 * @returns {HTMLElement} - the article element
 */
function createResourceArticle(resource) {
  const article = document.createElement('article');
  article.classList.add('resource-article');

  const titleEl = document.createElement('h3');
  titleEl.textContent = resource.title;

  const descEl = document.createElement('p');
  descEl.textContent = resource.description;

  const linkEl = document.createElement('a');
  linkEl.textContent = "View Resource & Discussion";
  linkEl.href = `details.html?id=${resource.id}`;
  linkEl.classList.add('resource-link');

  article.appendChild(titleEl);
  article.appendChild(descEl);
  article.appendChild(linkEl);

  return article;
}

/**
 * Loads resources from the API and populates the section.
 */
async function loadResources() {
  try {
    const response = await fetch('./api/index.php');
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to load resources.");
    }

    // Clear existing content
    resourceListSection.innerHTML = '';

    // Loop through resources and append articles
    data.data.forEach(resource => {
      const articleEl = createResourceArticle(resource);
      resourceListSection.appendChild(articleEl);
    });
  } catch (error) {
    console.error('Error loading resources:', error);
    resourceListSection.innerHTML = `<p class="error">Unable to load resources. Please try again later.</p>`;
  }
}

// --- Initial Page Load ---
loadResources();
