let currentResourceId = null;
let currentComments = [];

const resourceTitle = document.querySelector("#resource-title");
const resourceDescription = document.querySelector("#resource-description");
const resourceLink = document.querySelector("#resource-link");
const commentList = document.querySelector("#comment-list");
const commentForm = document.querySelector("#comment-form");
const newComment = document.querySelector("#new-comment");

function getResourceIdFromURL() {
  const queryString = window.location.search;
  const params = new URLSearchParams(queryString);
  return params.get("id");
}

function renderResourceDetails(resource) {
  resourceTitle.textContent = resource.title;
  resourceDescription.textContent = resource.description;
  resourceLink.href = resource.link;
}

function createCommentArticle(comment) {
  const article = document.createElement("article");

  const paragraph = document.createElement("p");
  paragraph.textContent = comment.text;

  const footer = document.createElement("footer");
  footer.textContent = `Posted by: ${comment.author}`;

  article.appendChild(paragraph);
  article.appendChild(footer);

  return article;
}

function renderComments() {
  commentList.innerHTML = "";

  currentComments.forEach(function (comment) {
    const article = createCommentArticle(comment);
    commentList.appendChild(article);
  });
}

async function handleAddComment(event) {
  event.preventDefault();

  const commentText = newComment.value.trim();

  if (commentText === "") {
    return;
  }

  const response = await fetch("./api/index.php?action=comment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      resource_id: currentResourceId,
      author: "Student",
      text: commentText
    })
  });

  const result = await response.json();

  if (result.success && result.data) {
    currentComments.push(result.data);
    renderComments();
    newComment.value = "";
  }
}

async function initializePage() {
  currentResourceId = getResourceIdFromURL();

  if (!currentResourceId) {
    resourceTitle.textContent = "Resource not found.";
    return;
  }

  const resourceResponse = fetch(`./api/index.php?id=${currentResourceId}`);
  const commentsResponse = fetch(
    `./api/index.php?resource_id=${currentResourceId}&action=comments`
  );

  const responses = await Promise.all([resourceResponse, commentsResponse]);

  const resourceResult = await responses[0].json();
  const commentsResult = await responses[1].json();

  if (commentsResult.success && Array.isArray(commentsResult.data)) {
    currentComments = commentsResult.data;
  } else {
    currentComments = [];
  }

  if (resourceResult.success && resourceResult.data) {
    renderResourceDetails(resourceResult.data);
    renderComments();
    commentForm.addEventListener("submit", handleAddComment);
  } else {
    resourceTitle.textContent = "Resource not found.";
  }
}

initializePage();
