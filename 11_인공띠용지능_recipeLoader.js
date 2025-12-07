const LOCAL_RECIPES_KEY = 'nn_recipes';
const RECENT_RECIPES_KEY = 'nn_recent_recipes';
const REVIEWS_KEY = 'nn_recipe_reviews';

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const recipeIdParam = params.get('recipe') || params.get('id');

  if (!recipeIdParam) {
    alert('레시피 ID가 없습니다. 예: recipe.html?id=kimchi_fried_rice');
    return;
  }

  const recipeIdStr = String(recipeIdParam);

  loadAllRecipes()
    .then((allRecipes) => {
      const recipe = allRecipes.find((r) => String(r.id) === recipeIdStr);

      if (!recipe) {
        alert(
          '준비 중인 레시피거나 데이터를 찾을 수 없습니다. (ID: ' +
            recipeIdStr +
            ')'
        );
        window.history.back();
        return;
      }

      renderRecipe(recipe);
      setupReviewSystem(recipe);
    })
    .catch((error) => console.error('레시피 로딩 오류:', error));
});

function loadAllRecipes() {
  return fetch('11_인공띠용지능_recipes.json')
    .then((res) => res.json())
    .then((data) => {
      const baseRecipes = Array.isArray(data.recipes) ? data.recipes : [];
      let localRaw = [];

      try {
        const raw = localStorage.getItem(LOCAL_RECIPES_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) localRaw = parsed;
        }
      } catch (e) {
        console.error('로컬 레시피 파싱 오류:', e);
      }

      const localRecipes = localRaw.map((r) => normalizeLocalRecipe(r));
      const combined = [...baseRecipes, ...localRecipes];

      const reviewsMap = loadPersistedReviews();
      combined.forEach((r) => {
        const id = String(r.id);
        const stored = Array.isArray(reviewsMap[id]) ? reviewsMap[id] : null;

        if (stored && stored.length > 0) {
          const baseReviews = Array.isArray(r.reviews) ? r.reviews : [];
          const merged = [...baseReviews, ...stored];

          r.reviews = merged;
          const sum = merged.reduce(
            (acc, rv) => acc + (Number(rv.rating) || 0),
            0
          );
          const avg = merged.length > 0 ? sum / merged.length : 0;

          r.rating = Number(avg.toFixed(1));
          r.review_count = merged.length;
        }
      });

      return combined;
    });
}

function loadPersistedReviews() {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    console.error('리뷰 데이터 파싱 오류:', e);
    return {};
  }
}

function savePersistedReviews(map) {
  try {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('리뷰 저장 오류:', e);
  }
}

function normalizeLocalRecipe(r) {
  let required = [];
  if (Array.isArray(r.ingredientsRequired)) {
    required = r.ingredientsRequired.map((ing) => ({
      name: ing.name || '',
      amount: ing.amount || '',
    }));
  } else if (Array.isArray(r.ingredients_required)) {
    required = r.ingredients_required.map((ing) => ({
      name: ing.name || '',
      amount: ing.amount || '',
    }));
  } else if (typeof r.ingredients === 'string') {
    required = r.ingredients
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((name) => ({
        name,
        amount: '',
      }));
  }

  let optional = [];
  if (Array.isArray(r.ingredientsOptional)) {
    optional = r.ingredientsOptional.map((ing) => ({
      name: ing.name || '',
      amount: ing.amount || '',
    }));
  } else if (Array.isArray(r.ingredients_optional)) {
    optional = r.ingredients_optional.map((ing) => ({
      name: ing.name || '',
      amount: ing.amount || '',
    }));
  }

  let steps = [];

  if (Array.isArray(r.stepsDetail)) {
    steps = r.stepsDetail.map((s, idx) => ({
      title: (s.title && s.title.trim()) || `단계 ${idx + 1}`,
      desc: (s.description || '').trim(),
    }));
  } else if (Array.isArray(r.steps)) {
    steps = r.steps;
  } else if (typeof r.steps === 'string' && r.steps.trim()) {
    const blocks = r.steps.split(/\n\s*\n/);

    blocks.forEach((block, idx) => {
      const lines = block
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      if (lines.length === 0) return;

      let titleLine = lines[0];
      const descLine = lines.slice(1).join('\n');

      titleLine = titleLine.replace(/^\d+\s*\.?\s*(단계)?\s*/u, '').trim();

      const title = titleLine || `단계 ${idx + 1}`;
      const desc = descLine || '';

      steps.push({
        title,
        desc,
      });
    });
  }

  const ratingValue = r.rating ?? 0;
  const reviews = Array.isArray(r.reviews) ? r.reviews : [];
  const reviewCount = reviews.length;

  const authorName = r.authorName || r.author || r.writer || '냠냠이';

  return {
    id: String(r.id),
    title: r.title || '제목 없는 레시피',
    name: r.title || '제목 없는 레시피',
    category: r.category || '기타',
    thumbnail: r.thumbnail || r.image,
    image: r.image || r.thumbnail || '',
    summary: r.summary || '',
    difficulty: r.difficulty || '난이도 정보 없음',
    time: r.time || '시간 정보 없음',
    rating: ratingValue,
    review_count: reviewCount,
    reviews: reviews,
    views: r.views || 0,
    author: authorName,

    ingredients_required: required,
    ingredients_optional: optional,
    steps: steps,
  };
}

function renderRecipe(recipe) {
  const thumbSrc = recipe.thumbnail || recipe.image || '11_default.png';
  const title = recipe.title || recipe.name || '제목 없는 레시피';
  const summary = recipe.summary || '';
  const category = recipe.category || '기타';
  const difficulty = recipe.difficulty || '난이도 정보 없음';
  const time = recipe.time || '시간 정보 없음';
  const ratingValue = Number(recipe.rating) || 0;
  const reviews = Array.isArray(recipe.reviews) ? recipe.reviews : [];
  const reviewCount = reviews.length;
  const authorName = recipe.authorName || recipe.author || '냠냠이';

  document.getElementById('thumb').src = thumbSrc;
  document.getElementById('recipe-title').textContent = title;
  document.getElementById('recipe-summary').textContent = summary;
  document.getElementById('recipe-category').textContent = category;
  document.getElementById('recipe-difficulty').textContent = difficulty;
  document.getElementById('recipe-time').textContent = time;

  const authorEl = document.getElementById('recipe-author');
  if (authorEl) {
    authorEl.textContent = authorName;
  }

  const ratingEl = document.getElementById('recipe-rating');
  if (ratingEl) {
    const rounded = Math.round(ratingValue * 10) / 10;
    const filledStars = '★'.repeat(Math.round(rounded));
    const emptyStars = '☆'.repeat(5 - Math.round(rounded));
    ratingEl.innerHTML = `${filledStars}${emptyStars} (${rounded.toFixed(
      1
    )}점 / ${reviewCount}개 리뷰)`;
    ratingEl.setAttribute('data-rating', rounded);
    ratingEl.setAttribute('data-review-count', reviewCount);
  }

  const reqList = document.getElementById('ingredients-required');
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
        <strong>${item.amount || ''}</strong>
      </li>
      `
      )
      .join('');
  }

  const optList = document.getElementById('ingredients-optional');
  const optionalItems = Array.isArray(recipe.ingredients_optional)
    ? recipe.ingredients_optional
    : [];
  if (optionalItems.length === 0) {
    optList.innerHTML = `<li class="list-item muted">선택 재료 없음</li>`;
  } else {
    optList.innerHTML = optionalItems
      .map(
        (item) => `
      <li class="list-item">
        <div class="list-text">
          <div class="list-ttl">${item.name}</div>
        </div>
        <strong>${item.amount || ''}</strong>
      </li>
      `
      )
      .join('');
  }

  const stepList = document.getElementById('recipe-steps');
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
          <div class="list-ttl">${i + 1}. ${step.title || `단계 ${i + 1}`}</div>
          <div class="list-sub">${step.desc || ''}</div>
        </div>
      </li>
      `
      )
      .join('');
  }

  const reviewTitleEl = document.getElementById('review-title');
  const reviewListEl = document.getElementById('review-list');
  reviewTitleEl.textContent = `리뷰 (${reviewCount}개)`;

  if (reviewCount === 0) {
    reviewListEl.innerHTML =
      '<p class="my-recipes card-sub muted">아직 등록된 리뷰가 없습니다.</p>';
  } else {
    reviewListEl.innerHTML = reviews
      .map(
        (r) => `
      <article class="card">
        <div class="bar between">
          <span class="card-title">${r.user}</span>
          <span class="rating">${'★'.repeat(r.rating)}${'☆'.repeat(
          5 - r.rating
        )}</span>
        </div>
        <p class="my-recipes card-sub">${r.text}</p>
        <span class="my-recipes card-sub right">${r.date}</span>
      </article>
      `
      )
      .join('');
  }

  saveToRecent(recipe);
}

function saveToRecent(recipe) {
  const MAX_ITEMS = 10;
  const ratingValue = recipe.rating != null ? Number(recipe.rating) : 0;
  const realReviews = Array.isArray(recipe.reviews) ? recipe.reviews : [];
  const reviewCount = realReviews.length;

  const newRecord = {
    id: recipe.id,
    title: recipe.title || recipe.name,
    info: `${recipe.category || '기타'} · 리뷰 ${reviewCount}개`,
    link:
      '11_인공띠용지능_recipe.html?id=' + encodeURIComponent(String(recipe.id)),
    thumbnail: recipe.thumbnail || recipe.image || '11_default.png',
    rating: ratingValue,
    review_count: reviewCount,
  };

  let recentList = [];
  try {
    const raw = localStorage.getItem(RECENT_RECIPES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) recentList = parsed;
    }
  } catch (e) {
    console.error('최근 레시피 파싱 오류:', e);
  }

  recentList = recentList.filter(
    (item) => String(item.id) !== String(recipe.id)
  );
  recentList.unshift(newRecord);

  if (recentList.length > MAX_ITEMS)
    recentList = recentList.slice(0, MAX_ITEMS);

  localStorage.setItem(RECENT_RECIPES_KEY, JSON.stringify(recentList));
}

function setupReviewSystem(recipe) {
  const stars = document.querySelectorAll('.rating-stars i');
  const reviewBtn = document.querySelector('.review-input-box .btn-solid');
  const reviewInput = document.querySelector('.input-text');
  const reviewList = document.getElementById('review-list');
  const reviewTitle = document.getElementById('review-title');

  const currentUser = localStorage.getItem('currentUser');
  const users = JSON.parse(localStorage.getItem('users') || '{}');

  let userName = '익명 사용자';

  if (currentUser && users[currentUser]) {
    const info = users[currentUser];

    if (info.nickname && info.nickname.trim()) {
      userName = info.nickname.trim();
    } else {
      userName = '@' + currentUser;
    }
  }

  const recipeId = String(recipe.id);
  let currentRating = 0;

  stars.forEach((star, index) => {
    star.addEventListener('click', () => {
      currentRating = index + 1;
      updateStars();
    });

    star.addEventListener('mouseover', () => {
      highlightStars(index + 1);
    });

    star.addEventListener('mouseout', () => updateStars());
  });

  function highlightStars(count) {
    stars.forEach((star, idx) => {
      const active = idx < count;
      star.classList.toggle('fas', active);
      star.classList.toggle('far', !active);
      star.style.color = active ? '#e2b458' : '#ccc';
    });
  }

  function updateStars() {
    stars.forEach((star, idx) => {
      const active = idx < currentRating;
      star.classList.toggle('fas', active);
      star.classList.toggle('far', !active);
      star.style.color = active ? '#e2b458' : '#ccc';
    });
  }

  if (reviewBtn) {
    reviewBtn.addEventListener('click', () => {
      const text = reviewInput.value.trim();
      if (!text || currentRating === 0) {
        alert('리뷰 내용과 별점을 입력해주세요!');
        return;
      }

      const today = new Date();
      const dateStr = `${today.getFullYear()}.${String(
        today.getMonth() + 1
      ).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

      const reviewObj = {
        user: userName,
        rating: currentRating,
        text,
        date: dateStr,
      };

      const newReviewHtml = `
        <article class="card">
          <div class="bar between">
            <span class="card-title">${userName}</span>
            <span class="rating">${'★'.repeat(currentRating)}${'☆'.repeat(
        5 - currentRating
      )}</span>
          </div>
          <p class="my-recipes card-sub">${text}</p>
          <span class="my-recipes card-sub right">${dateStr}</span>
        </article>
      `;

      reviewList.insertAdjacentHTML('afterbegin', newReviewHtml);

      const emptyMsg = reviewList.querySelector('.muted');
      if (emptyMsg) emptyMsg.remove();

      const map = loadPersistedReviews();
      const list = Array.isArray(map[recipeId]) ? map[recipeId] : [];
      list.unshift(reviewObj);
      map[recipeId] = list;
      savePersistedReviews(map);

      const currentCountMatch = reviewTitle.textContent.match(/\d+/);
      let currentCount = currentCountMatch ? Number(currentCountMatch[0]) : 0;
      currentCount += 1;
      reviewTitle.textContent = `리뷰 (${currentCount}개)`;

      const ratingEl = document.getElementById('recipe-rating');
      if (ratingEl) {
        const oldRating = Number(ratingEl.getAttribute('data-rating')) || 0;
        let oldCount = Number(ratingEl.getAttribute('data-review-count')) || 0;

        const newCount = oldCount + 1;
        const newRating = (oldRating * oldCount + currentRating) / newCount;
        const rounded = Math.round(newRating * 10) / 10;

        const filledStars = '★'.repeat(Math.round(rounded));
        const emptyStars = '☆'.repeat(5 - Math.round(rounded));

        ratingEl.innerHTML = `${filledStars}${emptyStars} (${rounded.toFixed(
          1
        )}점 / ${newCount}개 리뷰)`;
        ratingEl.setAttribute('data-rating', String(rounded));
        ratingEl.setAttribute('data-review-count', String(newCount));
      }

      reviewInput.value = '';
      currentRating = 0;
      updateStars();
    });
  }
}
