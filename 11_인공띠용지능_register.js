const RECIPES_KEY = "nn_recipes";
const DRAFT_KEY   = "nn_recipe_draft";

document.addEventListener("DOMContentLoaded", () => {
  const form           = document.getElementById("recipeForm");
  const titleInput     = document.getElementById("title");
  const ingInput       = document.getElementById("ingredients");
  const stepsInput     = document.getElementById("steps");
  const imageInput     = document.getElementById("image");
  const draftTimeEl    = document.getElementById("draftTime");
  const saveDraftBtn   = document.getElementById("saveDraftBtn");
  const categoryRadios = document.querySelectorAll("input[name='category']");

  let isEdit = false;
  let editId = null;
  let originalImageDataUrl = "";

  const params = new URLSearchParams(window.location.search);
  if (params.has("editId")) {
    isEdit = true;
    editId = params.get("editId");
  }

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

    if (draftTimeEl)  draftTimeEl.style.display  = "none";
    if (saveDraftBtn) saveDraftBtn.style.display = "none";
  } else {
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
        handleSubmit(ev.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      const img = isEdit ? originalImageDataUrl : "";
      handleSubmit(img);
    }
  });

  function handleSubmit(imageDataUrl) {
    const info = collectFormData();
    const raw  = localStorage.getItem(RECIPES_KEY);
    const list = raw ? JSON.parse(raw) : [];

    if (isEdit) {
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
      target.image       = imageDataUrl;

      saveRecipes(list);

      alert("레시피가 수정되었습니다!");
      window.location.href = "11_인공띠용지능_recipe_manage.html";
    } else {
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

      localStorage.removeItem(DRAFT_KEY);
      updateDraftTime(null);
      form.reset();

      alert("레시피가 등록되었습니다!");
    }
  }
});
