function renderCategory(category) {
  const container = document.querySelector(
    `.card-grid[data-category="${category}"]`
  );
  if (!container) return;

  container.innerHTML = '';

  const list = recipeData[category].slice(0, 8);

  list.forEach((item) => {
    const card = `
      <a href="${item.link}" class="card">
        <img src="${item.img}" alt="${item.title}" class="thumb" />
        <p class="card-title">${item.title}</p>
        <p class="recipe-meta">작성자: ${item.author} · 조회수: ${item.views}</p>
        <div class="rating">★★★★☆ (${item.rating})</div>
      </a>
    `;
    container.insertAdjacentHTML('beforeend', card);
  });
}

function renderAllCategories() {
  renderCategory('korean');
  renderCategory('western');
  renderCategory('chinese');
  renderCategory('dessert');
  renderCategory('drink');
}
