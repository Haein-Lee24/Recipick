/* ----------------------------------------
  정렬 함수
---------------------------------------- */
function sortRecipes(list, type) {
  const sorted = [...list];

  switch (type) {
    case "review": // 리뷰 많은순
      sorted.sort((a, b) => b.review_count - a.review_count);
      break;

    case "rating": // 평점순
      sorted.sort((a, b) => b.rating - a.rating);
      break;

    case "title": // 이름순
      sorted.sort((a, b) => a.title.localeCompare(b.title, "ko"));
      break;
  }

  return sorted;
}

/* ----------------------------------------
  카드 HTML 생성
---------------------------------------- */
function makeCardHTML(title, thumbnail, metaText, rating, href) {
  return `
    <a href="${href}" class="card">
      <img src="${thumbnail}" alt="${title}" class="thumb" />
      <div class="card-body">
        <p class="card-title">${title}</p>
        <p class="recipe-meta">${metaText}</p>
        <div class="rating">★ ${rating}</div>
      </div>
    </a>
  `;
}

/* ----------------------------------------
  렌더링 함수
---------------------------------------- */
function renderCards(container, jsonRecipes, userRecipes) {
  const jsonHTML = jsonRecipes
    .map((r) => {
      const href = `11_인공띠용지능_recipe.html?id=${r.id}`;
      const thumb = r.thumbnail || getDefaultImage(r.category);
      const meta = `작성자: 냠냠이 · 리뷰 ${r.review_count}개`;
      return makeCardHTML(r.title, thumb, meta, r.rating, href);
    })
    .join("");

  const userHTML = userRecipes
    .map((u) => {
      const href = `11_인공띠용지능_recipe.html?id=${u.id}`;
      const thumb = u.image || getDefaultImage(u.category);
      const meta = `작성자: 사용자 · 조회수 ${u.views || 0}`;
      return makeCardHTML(u.title, thumb, meta, u.rating || 0, href);
    })
    .join("");

  container.innerHTML = jsonHTML + userHTML;
}

/* ----------------------------------------
  JSON + 정렬 + 렌더링 전체 처리
---------------------------------------- */
fetch("11_인공띠용지능_recipes.json")
  .then((res) => res.json())
  .then((data) => {
    const titleEl = document.getElementById("full-title");
    const listEl = document.getElementById("full-list");

    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const categoryMap = {
      korean: "한식",
      western: "양식",
      chinese: "중식",
      dessert: "디저트",
      drink: "음료",
    };

    const targetName = categoryMap[category];
    const isDessertMode = category === "dessert";

    if (!targetName) {
      titleEl.innerText = "잘못된 카테고리입니다.";
      return;
    }

    // JSON 레시피 필터링
    let jsonRecipes = data.recipes.filter((r) => {
      if (isDessertMode)
        return r.category === "디저트" || r.category === "간식";
      return r.category === targetName;
    });

    // 로컬스토리지 레시피 필터링
    let userRecipes = loadUserRecipes(targetName, isDessertMode);

    // 기본 정렬: 리뷰 많은순
    jsonRecipes = sortRecipes(jsonRecipes, "review");

    // 제목 표시
    const totalCount = jsonRecipes.length + userRecipes.length;
    titleEl.innerText = `전체 ${targetName} 레시피 (총 ${totalCount}개)`;

    // 초기 렌더
    renderCards(listEl, jsonRecipes, userRecipes);

    /* ----------------------------------------
      정렬 select 이벤트 연결
    ---------------------------------------- */
    document
      .getElementById("sort-select")
      .addEventListener("change", function () {
        const type = this.value;

        // JSON 레시피만 정렬
        jsonRecipes = sortRecipes(jsonRecipes, type);

        // 렌더 다시 실행
        renderCards(listEl, jsonRecipes, userRecipes);
      });
  })
  .catch((err) => console.error("로딩 실패:", err));
