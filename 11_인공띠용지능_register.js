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

  // --------- 수정 모드 여부 체크 (editId 파라미터) ---------
  let isEdit = false;
  let editId = null;
  let originalImageDataUrl = "";

  const params = new URLSearchParams(window.location.search);
  if (params.has("editId")) {
    isEdit = true;
    editId = params.get("editId");
  }

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
    if (!draftTimeEl) return;

    if (!timestamp) {
      draftTimeEl.textContent = "현재 임시저장된 내용이 없습니다.";
      return;
    }
    draftTimeEl.textContent = `마지막 임시저장: ${formatDate(new Date(timestamp))}`;
  }

  function loadRecipes() {
    const raw = localStorage.getItem(RECIPES_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  function saveRecipes(list) {
    localStorage.setItem(RECIPES_KEY, JSON.stringify(list));
  }

  // ---------------- 수정 모드일 때: 기존 레시피 채워넣기 ----------------
  if (isEdit) {
    const list   = loadRecipes();
    const target = list.find(r => String(r.id) === String(editId));

    if (!target) {
      alert("수정할 레시피를 찾을 수 없습니다.");
    } else {
      titleInput.value = target.title || "";
      ingInput.value   = target.ingredients || "";
      stepsInput.value = target.steps || "";

      if (target.category) {
        categoryRadios.forEach(r => {
          r.checked = (r.value === target.category);
        });
      }

      originalImageDataUrl = target.image || "";
    }

    // 수정 모드에서는 임시저장 UI 숨기기
    if (draftTimeEl)  draftTimeEl.style.display  = "none";
    if (saveDraftBtn) saveDraftBtn.style.display = "none";
  } else {
    // ---------------- 신규 작성일 때: 임시저장(DRAFT) 채워넣기 ----------------
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
  }

  // ---------------- 임시저장 버튼 (신규 작성 때만) ----------------
  if (!isEdit && saveDraftBtn) {
    saveDraftBtn.addEventListener("click", () => {
      const data = collectFormData();
      data.imageName = imageInput.files[0]?.name || "";
      data.savedAt   = Date.now();

      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      updateDraftTime(data.savedAt);
      alert("임시저장되었습니다!");
    });
  }

  // ---------------- 폼 제출(등록/수정 공통) ----------------
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
        handleSubmit(ev.target.result);  // 새 이미지 dataURL
      };
      reader.readAsDataURL(file);
    } else {
      // 이미지 새로 안 골랐으면: 신규는 "", 수정은 기존 이미지 유지
      const img = isEdit ? originalImageDataUrl : "";
      handleSubmit(img);
    }
  });

  function handleSubmit(imageDataUrl) {
    const info = collectFormData();
    const raw  = localStorage.getItem(RECIPES_KEY);
    const list = raw ? JSON.parse(raw) : [];

    if (isEdit) {
      // ---------- 기존 레시피 수정 ----------
      const idx = list.findIndex(r => String(r.id) === String(editId));
      if (idx === -1) {
        alert("수정할 레시피를 찾을 수 없습니다.");
        return;
      }

      const target = list[idx];
      target.title       = info.title;
      target.category    = info.category;
      target.ingredients = info.ingredients;
      target.steps       = info.steps;
      target.image       = imageDataUrl; // 새 이미지 or 기존 이미지 유지

      saveRecipes(list);

      alert("레시피가 수정되었습니다!");
      window.location.href = "11_인공띠용지능_recipe_manage.html";
    } else {
      // ---------- 새 레시피 등록 ----------
      const now = Date.now();

      const newRecipe = {
        id:         now,
        title:      info.title,
        category:   info.category,
        image:      imageDataUrl,
        ingredients: info.ingredients,
        steps:       info.steps,
        views:     0,
        rating:    0,
        createdAt: now
      };

      list.push(newRecipe);
      saveRecipes(list);

      // 임시저장 제거 + 폼 리셋
      localStorage.removeItem(DRAFT_KEY);
      updateDraftTime(null);
      form.reset();

      alert("레시피가 등록되었습니다!");
      // 필요하면 여기서 자동 이동도 가능
      // window.location.href = "11_인공띠용지능_recipe_manage.html";
    }
  }
});
