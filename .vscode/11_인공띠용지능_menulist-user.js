// 11_인공띠용지능_menulist-user.js

const RECIPES_KEY = "nn_recipes";

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("user-recipes");
  if (!container) return;

  const category = container.dataset.category; // "한식" / "양식" / ...

  const raw = localStorage.getItem(RECIPES_KEY);
  if (!raw) return;

  let recipes = [];
  try {
    recipes = JSON.parse(raw);
  } catch {
    return;
  }

  const filtered = recipes.filter(r => r.category === category);

  if (filtered.length === 0) {
    container.innerHTML =
      `<p style="font-size:14px; color:var(--muted);">아직 등록된 레시피가 없습니다.</p>`;
    return;
  }

  filtered.forEach(recipe => container.appendChild(makeRecipeCard(recipe)));
});

function makeRecipeCard(recipe) {
  const card = document.createElement("article");
  card.className = "recipe-card";

  card.innerHTML = `
    <div class="recipe-thumb">
      <img src="${recipe.image}" alt="${recipe.title}" />
    </div>
    <div class="recipe-info">
      <h3>${recipe.title}</h3>
      <p class="recipe-meta">조회수: ${recipe.views}</p>
      <p class="recipe-meta">★ ${recipe.rating.toFixed(1)}</p>
    </div>
  `;
  return card;
}
