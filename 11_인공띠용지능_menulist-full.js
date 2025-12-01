// URL에서 category 읽기
function getCategory() {
  const params = new URLSearchParams(window.location.search);
  return params.get('category');
}

// 조회수 "10.5K" → 10500 숫자 변환
function parseViews(v) {
  if (!v) return 0;
  if (v.includes("K")) return parseFloat(v) * 1000;
  return parseFloat(v);
}

// 평점 "(4.8)" → 4.8 숫자 변환
function parseRating(r) {
  const match = r.match(/\(([\d.]+)\)/);
  return match ? parseFloat(match[1]) : 0;
}

// 실제 렌더링 함수
function renderList(category, sortType) {
  const container = document.getElementById("full-list");
  container.innerHTML = "";  // 기존 카드 초기화

  // ▼ 정확히 복사해서 새 배열 생성해야 sort가 정상 작동함
  let list = JSON.parse(JSON.stringify(recipeData[category]));

  // ---------------------------
  // 정렬 적용
  // ---------------------------
  if (sortType === "name") {
    list.sort((a, b) => a.title.localeCompare(b.title, "ko-KR"));
  }
  else if (sortType === "views") {
    list.sort((a, b) => parseViews(b.views) - parseViews(a.views));
  }
  else if (sortType === "rating") {
    list.sort((a, b) => parseRating(b.rating) - parseRating(a.rating));
  }

  // ---------------------------
  // 카드 렌더링
  // ---------------------------
  list.forEach((item) => {
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

function renderFullList() {
  const category = getCategory();
  if (!category || !recipeData[category]) return;

  const titleMap = {
    korean: "한식 레시피 전체보기",
    western: "양식 레시피 전체보기",
    chinese: "중식 레시피 전체보기",
    dessert: "디저트 레시피 전체보기",
    drink: "음료 레시피 전체보기",
  };

  document.getElementById("full-title").innerText = titleMap[category];

  // 기본: 이름순 정렬
  renderList(category, "name");

  // 정렬 UI 이벤트
  const sortSelect = document.getElementById("sort-select");
  sortSelect.addEventListener("change", () => {
    renderList(category, sortSelect.value);
  });
}

renderFullList();
