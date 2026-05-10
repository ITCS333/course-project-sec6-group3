let currentResourceId = null;
let currentComments = [];

const titleEl = document.querySelector('#resource-title');
const descEl = document.querySelector('#resource-description');
const linkEl = document.querySelector('#resource-link');
const commentListEl = document.querySelector('#comment-list');
const commentForm = document.querySelector('#comment-form');
const newCommentTextarea = document.querySelector('#new-comment');

function getResourceIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function renderResourceDetails(resource) {
  titleEl.textContent = resource.title;
  descEl.textContent = resource.description;
  linkEl.href = resource.link;
}

function createCommentArticle(comment) {
  const article = document.createElement('article');
  const p = document.createElement('p');
  p.textContent = comment.text;
  const footer = document.createElement('footer');
  footer.textContent = `Posted by: ${comment.author}`;
  article.appendChild(p);
  article.appendChild(footer);
  return article;
}

function renderComments() {
  commentListEl.innerHTML = '';
  currentComments.forEach(comment => commentListEl.appendChild(createCommentArticle(comment)));
}

async function handleAddComment(event) {
  event.preventDefault();
  const text = newCommentTextarea.value.trim();
  if (!text) return;

  try {
    const res = await fetch(`./api/index.php?action=comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource_id: currentResourceId, author: 'Student', text })
    });
    const data = await res.json();
    if (data.success) {
      currentComments.push({ id: data.data.id, resource_id: currentResourceId, author: 'Student', text });
      renderComments();
      newCommentTextarea.value = '';
    }
  } catch(err) { console.error(err); }
}

async function initializePage() {
  currentResourceId = getResourceIdFromURL();
  if (!currentResourceId) { titleEl.textContent = "Resource not found."; return; }

  try {
    const [resResponse, comResponse] = await Promise.all([
      fetch(`./api/index.php?id=${currentResourceId}`),
      fetch(`./api/index.php?resource_id=${currentResourceId}&action=comments`)
    ]);
    const resData = await resResponse.json();
    const comData = await comResponse.json();

    currentComments = comData.success ? comData.data : [];

    if (resData.success && resData.data) {
      renderResourceDetails(resData.data);
      renderComments();
      commentForm.addEventListener('submit', handleAddComment);
    } else titleEl.textContent = "Resource not found.";
  } catch(err) { console.error(err); titleEl.textContent = "Error loading resource."; }
}

initializePage();
