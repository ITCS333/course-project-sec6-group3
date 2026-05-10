const resourceListSection = document.querySelector('#resource-list-section');

function createCommentElement(comment) {
  const div = document.createElement('div');
  div.classList.add('comment');
  div.innerHTML = `<p><strong>${comment.author}</strong> says:</p><p>${comment.text}</p>`;
  return div;
}

function createResourceArticle(resource, comments=[]) {
  const article = document.createElement('article');
  article.classList.add('resource-article');

  const titleEl = document.createElement('h3');
  titleEl.textContent = resource.title;

  const descEl = document.createElement('p');
  descEl.textContent = resource.description;

  const linkEl = document.createElement('a');
  linkEl.textContent = "View Resource";
  linkEl.href = resource.link;
  linkEl.target = "_blank";

  article.appendChild(titleEl);
  article.appendChild(descEl);
  article.appendChild(linkEl);

  const commentsContainer = document.createElement('div');
  commentsContainer.classList.add('comments-container');

  const commentsTitle = document.createElement('h4');
  commentsTitle.textContent = "Comments:";
  commentsContainer.appendChild(commentsTitle);

  comments.forEach(c => commentsContainer.appendChild(createCommentElement(c)));

  const form = document.createElement('form');
  form.innerHTML = `
    <input type="text" name="author" placeholder="Your Name" required />
    <input type="text" name="text" placeholder="Your Comment" required />
    <button type="submit">Add Comment</button>
  `;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const author = form.author.value.trim();
    const text = form.text.value.trim();
    if (!author || !text) return;

    try {
      const res = await fetch(`./api/index.php?action=comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource_id: resource.id, author, text })
      });
      const data = await res.json();
      if (data.success) {
        commentsContainer.appendChild(createCommentElement({ author, text }));
        form.reset();
      }
    } catch(err) { console.error(err); }
  });

  article.appendChild(commentsContainer);
  article.appendChild(form);

  return article;
}

async function loadResources() {
  try {
    const resResponse = await fetch('./api/index.php');
    const resData = await resResponse.json();
    resourceListSection.innerHTML = '';
    for (const resource of resData.data) {
      const comResponse = await fetch(`./api/index.php?action=comments&resource_id=${resource.id}`);
      const comData = await comResponse.json();
      const comments = comData.success ? comData.data : [];
      const articleEl = createResourceArticle(resource, comments);
      resourceListSection.appendChild(articleEl);
    }
  } catch(err) { console.error(err); }
}

loadResources();
