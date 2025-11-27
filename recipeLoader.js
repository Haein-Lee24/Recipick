document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);

  // 🔥 수정됨: 'recipe'라는 이름도 찾고, 'id'라는 이름도 찾도록 변경!
  // menulist.html이나 rank.html에서 id=... 로 보내고 있기 때문이에요.
  const recipeId = params.get('recipe') || params.get('id');

  if (!recipeId) {
    alert('레시피 ID가 없습니다. 예: recipe.html?id=kimchi_fried_rice');
    return;
  }

  fetch('recipes.json')
    .then((res) => res.json())
    .then((data) => {
      const recipe = data.recipes.find((r) => r.id === recipeId);

      if (!recipe) {
        // JSON에 없는 ID(예: 김치찌개, 된장찌개 등)를 클릭하면 이 알림이 뜹니다.
        alert(
          '준비 중인 레시피거나 데이터를 찾을 수 없습니다. (ID: ' +
            recipeId +
            ')'
        );
        window.history.back(); // 뒤로 가기
        return;
      }

      renderRecipe(recipe);
      setupReviewSystem(recipe);
    })
    .catch((error) => console.error('JSON 로딩 오류:', error));
});

// ... 아래 renderRecipe 함수와 setupReviewSystem 함수는 그대로 두시면 됩니다 ...

function renderRecipe(recipe) {
  // 🔥 제목/이미지/요약
  document.getElementById('thumb').src = recipe.thumbnail || recipe.image;
  document.getElementById('recipe-title').textContent =
    recipe.title || recipe.name;
  document.getElementById('recipe-summary').textContent = recipe.summary;

  // 🔥 카테고리/난이도/조리시간
  document.getElementById('recipe-category').textContent = recipe.category;
  document.getElementById('recipe-difficulty').textContent = recipe.difficulty;
  document.getElementById('recipe-time').textContent = recipe.time;

  // 🔥 평점 표시
  document.getElementById('recipe-rating').innerHTML =
    '★'.repeat(Math.round(recipe.rating)) +
    '☆'.repeat(5 - Math.round(recipe.rating)) +
    ` (${recipe.rating}점 / ${recipe.review_count}개 리뷰)`;

  // 🔥 필수 재료
  const reqList = document.getElementById('ingredients-required');
  reqList.innerHTML = recipe.ingredients_required
    .map(
      (item) => `
      <li class="list-item">
        <div class="list-text">
          <div class="list-ttl">${item.name}</div>
        </div>
        <strong>${item.amount}</strong>
      </li>
    `
    )
    .join('');

  // 🔥 선택 재료
  const optList = document.getElementById('ingredients-optional');
  if (
    !recipe.ingredients_optional ||
    recipe.ingredients_optional.length === 0
  ) {
    optList.innerHTML = `<li class="list-item muted">선택 재료 없음</li>`;
  } else {
    optList.innerHTML = recipe.ingredients_optional
      .map(
        (item) => `
        <li class="list-item">
          <div class="list-text">
            <div class="list-ttl">${item.name}</div>
          </div>
          <strong>${item.amount}</strong>
        </li>
      `
      )
      .join('');
  }

  // 🔥 조리 과정
  const stepList = document.getElementById('recipe-steps');
  stepList.innerHTML = recipe.steps
    .map(
      (step, i) => `
      <li class="list-item">
        <div class="list-text">
          <div class="list-ttl">${i + 1}. ${step.title}</div>
          <div class="list-sub">${step.desc}</div>
        </div>
      </li>
    `
    )
    .join('');

  // 🔥 기존 리뷰 표시
  document.getElementById(
    'review-title'
  ).textContent = `리뷰 (${recipe.review_count}개)`;

  const reviewList = document.getElementById('review-list');
  reviewList.innerHTML = recipe.reviews
    .map(
      (r) => `
      <article class="card">
        <div class="bar between">
          <span class="card-title">${r.user}</span>
          <span class="rating">
            ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
          </span>
        </div>
        <p class="my-recipes card-sub">${r.text}</p>
        <span class="my-recipes card-sub right">${r.date}</span>
      </article>
    `
    )
    .join('');
}

function setupReviewSystem(recipe) {
  const stars = document.querySelectorAll('.rating-stars i');
  const reviewBtn = document.querySelector('.review-input-box .btn-solid');
  const reviewInput = document.querySelector('.input-text');
  const reviewList = document.getElementById('review-list');
  const userName = localStorage.getItem('nn_username')?.trim() || '익명 사용자';

  let currentRating = 0;

  // ⭐ 별 클릭/호버 처리
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

  // ⭐ 리뷰 등록
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

    const newReview = `
      <article class="card">
        <div class="bar between">
          <span class="card-title">${userName}</span>
          <span class="rating">
            ${'★'.repeat(currentRating)}${'☆'.repeat(5 - currentRating)}
          </span>
        </div>
        <p class="my-recipes card-sub">${text}</p>
        <span class="my-recipes card-sub right">${dateStr}</span>
      </article>
    `;

    reviewList.insertAdjacentHTML('afterbegin', newReview);

    reviewInput.value = '';
    currentRating = 0;
    updateStars();
  });
}
