// URL에서 category 읽기
function getCategory() {
  const params = new URLSearchParams(window.location.search);
  return params.get("category");
}

function renderFullList() {
  const category = getCategory();

  if (!category || !recipeData[category]) return;

  const titleMap = {
    korean: "한식 레시피 전체보기",
    western: "양식 레시피 전체보기",
    chinese: "중식 레시피 전체보기",
    dessert: "디저트 레시피 전체보기",
    drink: "음료 레시피 전체보기"
  };

  document.getElementById("full-title").innerText = titleMap[category];

  const container = document.getElementById("full-list");

  const list = recipeData[category];

  list.forEach(item => {
    const card = `
      <a href="${item.link}" class="card">
        <img src="${item.img}" alt="${item.title}" class="thumb">
        <p class="card-title">${item.title}</p>
        <p class="recipe-meta">작성자: ${item.author} · 조회수: ${item.views}</p>
        <div class="rating">${item.rating}</div>
      </a>
    `;
    container.insertAdjacentHTML("beforeend", card);
  });
}

renderFullList();
