// 11_인공띠용지능_register.js

const RECIPES_KEY = "nn_recipes";      // 등록된 모든 레시피
const DRAFT_KEY   = "nn_recipe_draft"; // 임시저장

document.addEventListener("DOMContentLoaded", () => {
  const form           = document.getElementById("recipeForm");
  const titleInput     = document.getElementById("title");
  const ingInput       = document.getElementById("ingredients");
  const stepsInput     = document.getElementById("steps");
  const imageInput     = document.getElementById("image");
  const draftTimeEl    = document.getElementById("draftTime");
  const saveDraftBtn   = document.getElementById("saveDraftBtn");
  const categoryRadios = document.querySelectorAll("input[name='category']");

  // ---------------- 공통 유틸 ----------------
  function getSelectedCategory() {
    const checked = Array.from(categoryRadios).find(r => r.checked);
    return checked ? checked.value : "";
  }

  function collectFormData() {
    return {
      title:       titleInput.value.trim(),
      ingredients: ingInput.value.trim(),
      steps:       stepsInput.value.trim(),
      category:    getSelectedCategory()
    };
  }

  function formatDate(date) {
    const y  = date.getFullYear();
    const m  = String(date.getMonth() + 1).padStart(2, "0");
    const d  = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${y}.${m}.${d} ${hh}:${mm}`;
  }

  function updateDraftTime(timestamp) {
    if (!timestamp) {
      draftTimeEl.textContent = "현재 임시저장된 내용이 없습니다.";
      return;
    }
    draftTimeEl.textContent = `마지막 임시저장: ${formatDate(new Date(timestamp))}`;
  }

  // ---------------- 임시저장 불러오기 ----------------
  (function loadDraft() {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) {
      updateDraftTime(null);
      return;
    }
    try {
      const draft = JSON.parse(raw);
      if (draft.title)       titleInput.value = draft.title;
      if (draft.ingredients) ingInput.value   = draft.ingredients;
      if (draft.steps)       stepsInput.value = draft.steps;
      if (draft.category) {
        categoryRadios.forEach(r => r.checked = (r.value === draft.category));
      }
      updateDraftTime(draft.savedAt || null);
    } catch {
      updateDraftTime(null);
    }
  })();

  // ---------------- 임시저장 버튼 ----------------
  saveDraftBtn.addEventListener("click", () => {
    const data = collectFormData();
    data.imageName = imageInput.files[0]?.name || "";
    data.savedAt   = Date.now();

    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    updateDraftTime(data.savedAt);
    alert("임시저장되었습니다!");
  });

  // ---------------- 폼 제출(등록하기) ----------------
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const file = imageInput.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        saveRecipe(ev.target.result); // 이미지 dataURL
      };
      reader.readAsDataURL(file);
    } else {
      saveRecipe(""); // 이미지 없으면 빈 문자열
    }
  });

  function saveRecipe(imageDataUrl) {
    const info = collectFormData(); // title, ingredients, steps, category

    const raw  = localStorage.getItem(RECIPES_KEY);
    const list = raw ? JSON.parse(raw) : [];

    const now = Date.now();

    // 🔴 여기서 "우리가 약속한 구조"로 push
    const newRecipe = {
      id: now,
      title: info.title,
      category: info.category,
      image: imageDataUrl,     // dataURL 또는 ""
      ingredients: info.ingredients,
      steps: info.steps,
      views: 0,
      rating: 0,
      createdAt: now
    };

    list.push(newRecipe);
    localStorage.setItem(RECIPES_KEY, JSON.stringify(list));

    // 임시저장 제거 + 폼 비우기
    localStorage.removeItem(DRAFT_KEY);
    updateDraftTime(null);
    form.reset();

    alert("레시피가 등록되었습니다!");
    // 원하면 자동 이동
    // if (info.category === "양식") {
    //   window.location.href = "11_인공띠용지능_menulist_western.html";
    // }
  }
});
