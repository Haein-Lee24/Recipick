// -----------------------------
// 공통 상수
// -----------------------------
const LOCAL_RECIPES_KEY = "nn_recipes";      // 등록 페이지에서 쓰는 로컬 레시피 key
const RECENT_RECIPES_KEY = "nn_recent_recipes"; // 최근 본 레시피 저장용 key

// -----------------------------
// 1. 페이지 로드 시 진입점
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);

  // ?recipe=... 또는 ?id=... 둘 다 지원
  const recipeIdParam = params.get("recipe") || params.get("id");

  if (!recipeIdParam) {
    alert("레시피 ID가 없습니다. 예: recipe.html?id=kimchi_fried_rice");
    return;
  }

  // URL에서 들어온 ID는 문자열이므로, 비교 시 항상 문자열로 맞춘다.
  const recipeIdStr = String(recipeIdParam);

  loadAllRecipes()
    .then((allRecipes) => {
      // JSON 레시피(id: "kimchi_fried_rice") + 로컬 레시피(id: 1764...) 모두를
      // 문자열로 변환해서 비교
      const recipe = allRecipes.find((r) => String(r.id) === recipeIdStr);

      if (!recipe) {
        alert(
          "준비 중인 레시피거나 데이터를 찾을 수 없습니다. (ID: " +
            recipeIdStr +
            ")"
        );
        window.history.back();
        return;
      }

      renderRecipe(recipe);
      setupReviewSystem(recipe);
    })
    .catch((error) => console.error("레시피 로딩 오류:", error));
});

// -----------------------------
// 2. JSON + localStorage 레시피 로드
// -----------------------------
function loadAllRecipes() {
  return fetch("11_인공띠용지능_recipes.json")
    .then((res) => res.json())
    .then((data) => {
      const baseRecipes = Array.isArray(data.recipes) ? data.recipes : [];

      // localStorage에 저장된 사용자 레시피 불러오기
      let localRaw = [];
      try {
        const raw = localStorage.getItem(LOCAL_RECIPES_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            localRaw = parsed;
          }
        }
      } catch (e) {
        console.error("로컬 레시피 파싱 오류:", e);
      }

      // 로컬 레시피를 상세페이지에서 사용하기 좋은 형태로 변환
      const localRecipes = localRaw.map((r) => normalizeLocalRecipe(r));

      // 최종: JSON 기본 + 로컬 변환본 합치기
      return [...baseRecipes, ...localRecipes];
    });
}

// -----------------------------
// 3. 로컬 레시피 → JSON 레시피와 비슷한 형태로 정규화
//   (ingredients: "순두부, 고춧가루", steps: "1단계" 같은 걸
//    상세페이지에서 바로 쓸 수 있는 배열 구조로 변환)
// -----------------------------
function normalizeLocalRecipe(r) {
  // 1) 재료 문자열 → 배열
  let required = [];
  if (typeof r.ingredients === "string") {
    required = r.ingredients
      .split(/[,\n]/) // 쉼표 또는 줄바꿈 기준으로 나누기
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((name) => ({
        name,
        amount: "" // 양 정보는 없으니 빈 문자열
      }));
  }

  // 2) 조리 단계 문자열 → 배열
  let steps = [];
  if (typeof r.steps === "string") {
    steps = r.steps
      .split(/\n+/) // 줄바꿈 기준으로 나누기
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((desc, idx) => ({
        title: `단계 ${idx + 1}`,
        desc
      }));
  } else if (Array.isArray(r.steps)) {
    // 혹시 나중에 배열로 저장하게 되면 그대로 사용
    steps = r.steps;
  }

  // 3) 리뷰 / 평점 관련
  const ratingValue = r.rating ?? 0;
  const reviews = Array.isArray(r.reviews) ? r.reviews : [];
  const reviewCount =
    r.review_count != null
      ? r.review_count
      : reviews.length;

  // 4) 최종 객체 (JSON 레시피와 최대한 비슷하게 맞춤)
  return {
    id: String(r.id),
    title: r.title || "제목 없는 레시피",
    name: r.title || "제목 없는 레시피",
    category: r.category || "기타",
    thumbnail: r.thumbnail || r.image,
    image: r.image || r.thumbnail || "",
    summary: r.summary || "",
    difficulty: r.difficulty || "난이도 정보 없음",
    time: r.time || "시간 정보 없음",
    rating: ratingValue,
    review_count: reviewCount,
    reviews: reviews,
    views: r.views || 0,
    ingredients_required: required,
    ingredients_optional: Array.isArray(r.ingredients_optional)
      ? r.ingredients_optional
      : [],
    steps: steps
  };
}

// -----------------------------
// 4. 상세페이지 렌더링
// -----------------------------
function renderRecipe(recipe) {
  // 기본 값 처리
  const thumbSrc = recipe.thumbnail || recipe.image || "11_default.png";
  const title = recipe.title || recipe.name || "제목 없는 레시피";
  const summary = recipe.summary || "";
  const category = recipe.category || "기타";
  const difficulty = recipe.difficulty || "난이도 정보 없음";
  const time = recipe.time || "시간 정보 없음";

  const ratingValue = Number(recipe.rating) || 0;
  const reviewCount =
    recipe.review_count != null
      ? Number(recipe.review_count)
      : Array.isArray(recipe.reviews)
      ? recipe.reviews.length
      : 0;

  // 🔥 제목/이미지/요약
  document.getElementById("thumb").src = thumbSrc;
  document.getElementById("recipe-title").textContent = title;
  document.getElementById("recipe-summary").textContent = summary;

  // 🔥 카테고리/난이도/조리시간
  document.getElementById("recipe-category").textContent = category;
  document.getElementById("recipe-difficulty").textContent = difficulty;
  document.getElementById("recipe-time").textContent = time;

// 🔥 평점 표시
  const ratingEl = document.getElementById("recipe-rating");

  if (ratingEl) {
    // 별 모양 텍스트 생성
    const filledStars = "★".repeat(Math.round(ratingValue));
    const emptyStars = "☆".repeat(5 - Math.round(ratingValue));

    // 별점 + 리뷰 텍스트 출력
    ratingEl.innerHTML = `${filledStars}${emptyStars} (${ratingValue}점 / ${reviewCount}개 리뷰)`;

    // 👉 저장/최근 본 레시피에서 쓰기 위한 raw 데이터 저장
    ratingEl.setAttribute("data-rating", ratingValue);
    ratingEl.setAttribute("data-review-count", reviewCount);
  }


  // 👉 저장/최근 리스트에서 쓰도록 raw 값도 같이 심어두기
  ratingEl.setAttribute("data-rating", ratingValue);
  ratingEl.setAttribute("data-review-count", reviewCount);

  // 🔥 필수 재료
  const reqList = document.getElementById("ingredients-required");
  const requiredItems = Array.isArray(recipe.ingredients_required)
    ? recipe.ingredients_required
    : [];

  if (requiredItems.length === 0) {
    reqList.innerHTML =
      '<li class="list-item muted">등록된 필수 재료가 없습니다.</li>';
  } else {
    reqList.innerHTML = requiredItems
      .map(
        (item) => `
      <li class="list-item">
        <div class="list-text">
          <div class="list-ttl">${item.name}</div>
        </div>
        <strong>${item.amount || ""}</strong>
      </li>
    `
      )
      .join("");
  }

  // 🔥 선택 재료
  const optList = document.getElementById("ingredients-optional");
  const optionalItems = Array.isArray(recipe.ingredients_optional)
    ? recipe.ingredients_optional
    : [];
  if (optionalItems.length === 0) {
    optList.innerHTML =
      `<li class="list-item muted">선택 재료 없음</li>`;
  } else {
    optList.innerHTML = optionalItems
      .map(
        (item) => `
        <li class="list-item">
          <div class="list-text">
            <div class="list-ttl">${item.name}</div>
          </div>
          <strong>${item.amount || ""}</strong>
        </li>
      `
      )
      .join("");
  }

  // 🔥 조리 과정
  const stepList = document.getElementById("recipe-steps");
  const steps = Array.isArray(recipe.steps) ? recipe.steps : [];
  if (steps.length === 0) {
    stepList.innerHTML =
      '<li class="list-item muted">등록된 조리 과정이 없습니다.</li>';
  } else {
    stepList.innerHTML = steps
      .map(
        (step, i) => `
      <li class="list-item">
        <div class="list-text">
          <div class="list-ttl">${i + 1}. ${
          step.title || `단계 ${i + 1}`
        }</div>
          <div class="list-sub">${step.desc || ""}</div>
        </div>
      </li>
    `
      )
      .join("");
  }

  // 🔥 기존 리뷰 표시
  const reviewTitleEl = document.getElementById("review-title");
  const reviewListEl = document.getElementById("review-list");
  const reviews = Array.isArray(recipe.reviews) ? recipe.reviews : [];

  reviewTitleEl.textContent = `리뷰 (${reviews.length}개)`;

  if (reviews.length === 0) {
    reviewListEl.innerHTML =
      
      '<p class="my-recipes card-sub muted">아직 등록된 리뷰가 없습니다.</p>';
  } else {
    reviewListEl.innerHTML = reviews
      .map(
        (r) => `
      <article class="card">
        <div class="bar between">
          <span class="card-title">${r.user}</span>
          <span class="rating">
            ${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}
          </span>
        </div>
        <p class="my-recipes card-sub">${r.text}</p>
        <span class="my-recipes card-sub right">${r.date}</span>
      </article>
    `
      )
      .join("");
  }

  // 최근 본 레시피 저장
  saveToRecent(recipe);
}

// -----------------------------
// 5. 최근 본 레시피 저장 (확장 버전)
// -----------------------------
function saveToRecent(recipe) {
  const MAX_ITEMS = 10; // 최대 저장 개수

  // 평점/리뷰 수 계산 (JSON + 로컬레시피 둘 다 대응)
  const ratingValue =
    recipe.rating != null ? Number(recipe.rating) : 0;
  const reviewCount =
    recipe.review_count != null
      ? Number(recipe.review_count)
      : Array.isArray(recipe.reviews)
      ? recipe.reviews.length
      : 0;

  const newRecord = {
    id: recipe.id,
    title: recipe.title || recipe.name,
    info: `${recipe.category || "기타"} · 리뷰 ${
      reviewCount
    }개`,
    // 상세 페이지로 이동하는 링크
    link:
      "11_인공띠용지능_recipe.html?id=" +
      encodeURIComponent(String(recipe.id)),
    // 👉 썸네일 / 평점 / 리뷰 수 같이 저장
    thumbnail: recipe.thumbnail || recipe.image || "11_default.png",
    rating: ratingValue,
    review_count: reviewCount,
  };

  let recentList = [];
  try {
    const raw = localStorage.getItem(RECENT_RECIPES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        recentList = parsed;
      }
    }
  } catch (e) {
    console.error("최근 레시피 파싱 오류:", e);
  }

  // 같은 id 있으면 제거
  recentList = recentList.filter(
    (item) => String(item.id) !== String(recipe.id)
  );

  // 맨 앞에 추가
  recentList.unshift(newRecord);

  // 개수 제한
  if (recentList.length > MAX_ITEMS) {
    recentList = recentList.slice(0, MAX_ITEMS);
  }

  localStorage.setItem(RECENT_RECIPES_KEY, JSON.stringify(recentList));
}


// -----------------------------
// 6. 리뷰 UI 설정 (기존 코드 최대한 유지)
// -----------------------------
function setupReviewSystem(recipe) {
  const stars = document.querySelectorAll(".rating-stars i");
  const reviewBtn = document.querySelector(".review-input-box .btn-solid");
  const reviewInput = document.querySelector(".input-text");
  const reviewList = document.getElementById("review-list");
  const reviewTitle = document.getElementById("review-title");
  const userName = (localStorage.getItem("nn_username") || "").trim() || "익명 사용자";

  let currentRating = 0;

  // ⭐ 별 클릭/호버 처리
  stars.forEach((star, index) => {
    star.addEventListener("click", () => {
      currentRating = index + 1;
      updateStars();
    });

    star.addEventListener("mouseover", () => {
      highlightStars(index + 1);
    });

    star.addEventListener("mouseout", () => updateStars());
  });

  function highlightStars(count) {
    stars.forEach((star, idx) => {
      const active = idx < count;
      star.classList.toggle("fas", active);
      star.classList.toggle("far", !active);
      star.style.color = active ? "#e2b458" : "#ccc";
    });
  }

  function updateStars() {
    stars.forEach((star, idx) => {
      const active = idx < currentRating;
      star.classList.toggle("fas", active);
      star.classList.toggle("far", !active);
      star.style.color = active ? "#e2b458" : "#ccc";
    });
  }

  // ⭐ 리뷰 등록
  if (reviewBtn) {
    reviewBtn.addEventListener("click", () => {
      const text = reviewInput.value.trim();
      if (!text || currentRating === 0) {
        alert("리뷰 내용과 별점을 입력해주세요!");
        return;
      }

      const today = new Date();
      const dateStr = `${today.getFullYear()}.${String(
        today.getMonth() + 1
      ).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;

      const newReviewHtml = `
        <article class="card">
          <div class="bar between">
            <span class="card-title">${userName}</span>
            <span class="rating">
              ${"★".repeat(currentRating)}${"☆".repeat(5 - currentRating)}
            </span>
          </div>
          <p class="my-recipes card-sub">${text}</p>
          <span class="my-recipes card-sub right">${dateStr}</span>
        </article>
      `;

      reviewList.insertAdjacentHTML("afterbegin", newReviewHtml);

      // 제목의 리뷰 개수도 추가로 업데이트 (DOM 기준)
      const currentCountMatch = reviewTitle.textContent.match(/\d+/);
      let currentCount = currentCountMatch ? Number(currentCountMatch[0]) : 0;
      currentCount += 1;
      reviewTitle.textContent = `리뷰 (${currentCount}개)`;

      reviewInput.value = "";
      currentRating = 0;
      updateStars();
    });
  }
}
