const resourceListSection = document.querySelector("#resource-list-section");

function createResourceArticle(resource) {
  const article = document.createElement("article");

  const heading = document.createElement("h2");
  heading.textContent = resource.title;

  const paragraph = document.createElement("p");
  paragraph.textContent = resource.description;

  const link = document.createElement("a");
  link.href = `details.html?id=${resource.id}`;
  link.textContent = "View Resource & Discussion";

  article.appendChild(heading);
  article.appendChild(paragraph);
  article.appendChild(link);

  return article;
}

async function loadResources() {
  const response = await fetch("./api/index.php");
  const result = await response.json();

  resourceListSection.innerHTML = "";

  if (result.success && Array.isArray(result.data)) {
    result.data.forEach(function (resource) {
      const article = createResourceArticle(resource);
      resourceListSection.appendChild(article);
    });
  }
}

loadResources();
