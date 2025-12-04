const RECIPES_KEY = "nn_recipes";
const DRAFT_KEY   = "nn_recipe_draft";

document.addEventListener("DOMContentLoaded", () => {
  const form         = document.getElementById("recipeForm");
  const titleInput   = document.getElementById("title");
  const reqIngInput  = document.getElementById("ingredientsRequired");
  const optIngInput  = document.getElementById("ingredientsOptional");
  const imageInput   = document.getElementById("image");
  const draftTimeEl  = document.getElementById("draftTime");
  const saveDraftBtn = document.getElementById("saveDraftBtn");
  const categoryRadios = document.querySelectorAll("input[name='category']");

  const stepListEl   = document.getElementById("stepList");
  const addStepBtn   = document.getElementById("addStepBtn");

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
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function saveRecipes(list) {
    localStorage.setItem(RECIPES_KEY, JSON.stringify(list));
  }

  // ---------------- 재료 파싱 / 단계 수집 ----------------
  // "스파게티면 200g" → { name: "스파게티면", amount: "200g" }
  function parseIngredients(text) {
    return text
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const parts = line.split(" ");
        const name = parts.shift() || "";
        const amount = parts.join(" ");
        return { name, amount };
      });
  }

  // 제목에서 "1.", "1 단계", "1. 단계", "1단계", "1.단계" 같은 패턴 제거
  function cleanStepTitle(raw) {
    if (!raw) return "";
    let t = raw.trim();
    // 숫자 + (선택) 점 + (선택) '단계' + (선택) 점 + 공백 제거
    t = t.replace(/^\d+\s*(?:\.?\s*단계)?\.?\s*/u, "");
    return t.trim();
  }

  // 단계 UI 하나 생성
  function createStepItem(index, data) {
    const wrapper = document.createElement("div");
    wrapper.className = "step-item";

    const header = document.createElement("div");
    header.className = "step-header";

    const numSpan = document.createElement("span");
    numSpan.className = "step-number";
    numSpan.textContent = (index + 1) + ". 단계";

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.className = "step-title-input";
    titleInput.placeholder = "예: 재료 준비 (숫자 없이)";
    titleInput.value = data?.title || "";

    header.appendChild(numSpan);
    header.appendChild(titleInput);

    const descTextarea = document.createElement("textarea");
    descTextarea.className = "step-desc-input";
    descTextarea.placeholder = "예: 고기를 양념합니다.";
    descTextarea.rows = 2;
    descTextarea.value = data?.description || "";

    const actions = document.createElement("div");
    actions.className = "step-actions";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-step-btn";
    removeBtn.textContent = "단계 삭제";

    removeBtn.addEventListener("click", () => {
      if (stepListEl.children.length <= 1) {
        alert("최소 1개 이상의 단계가 필요합니다.");
        return;
      }
      stepListEl.removeChild(wrapper);
      renumberSteps();
    });

    actions.appendChild(removeBtn);

    wrapper.appendChild(header);
    wrapper.appendChild(descTextarea);
    wrapper.appendChild(actions);

    return wrapper;
  }

  function renumberSteps() {
    Array.from(stepListEl.children).forEach((item, idx) => {
      const numSpan = item.querySelector(".step-number");
      if (numSpan) numSpan.textContent = (idx + 1) + ". 단계";
    });
  }

  function addStep(data) {
    const stepItem = createStepItem(stepListEl.children.length, data);
    stepListEl.appendChild(stepItem);
    renumberSteps();
  }

  function collectSteps() {
    const steps = [];
    const items = stepListEl.querySelectorAll(".step-item");
    items.forEach((item) => {
      const titleEl = item.querySelector(".step-title-input");
      const descEl  = item.querySelector(".step-desc-input");
      const rawTitle = (titleEl?.value || "").trim();
      const title = cleanStepTitle(rawTitle);      // 숫자/단계 제거
      const description = (descEl?.value || "").trim();
      if (title || description) {
        steps.push({ title, description });
      }
    });
    return steps;
  }

  // 레시피 폼 값 모으기
  function collectFormData() {
    const title    = titleInput.value.trim();
    const category = getSelectedCategory();

    const reqText  = reqIngInput.value.trim();
    const optText  = optIngInput.value.trim();

    const reqList  = parseIngredients(reqText);
    const optList  = parseIngredients(optText);
    const stepsArr = collectSteps();

    // 필수 재료만 옛날용 문자열에 넣기
    const ingredientsPlain = reqText;

    // 단계 문자열: "제목\n설명" 형식, 숫자 없이
    const stepsPlain = stepsArr
      .map((s) => {
        const titleLine = (s.title || "").trim();
        const descLine  = (s.description || "").trim();
        if (titleLine && descLine) {
          return `${titleLine}\n${descLine}`;
        } else {
          return titleLine || descLine;
        }
      })
      .join("\n\n")
      .trim();

    return {
      title,
      category,

      ingredientsRequiredText: reqText,
      ingredientsOptionalText: optText,
      ingredientsRequired: reqList,
      ingredientsOptional: optList,

      stepsDetail: stepsArr,
      ingredientsPlain,
      stepsPlain
    };
  }

  // ---------------- 단계 UI 기본 1개 생성 ----------------
  if (stepListEl) {
    addStep();
  }

  if (addStepBtn) {
    addStepBtn.addEventListener("click", () => addStep());
  }

  if (isEdit) {
    const list   = loadRecipes();
    const target = list.find(r => String(r.id) === String(editId));

    if (!target) {
      alert("수정할 레시피를 찾을 수 없습니다.");
    } else {
      titleInput.value = target.title || "";

      // 카테고리
      if (target.category) {
        categoryRadios.forEach(r => {
          r.checked = (r.value === target.category);
        });
      }

      // 필수/선택 재료
      if (Array.isArray(target.ingredientsRequired)) {
        reqIngInput.value = target.ingredientsRequired
          .map(ing => (ing.amount ? `${ing.name} ${ing.amount}` : ing.name))
          .join("\n");
      } else if (typeof target.ingredients === "string") {
        reqIngInput.value = target.ingredients;
      }

      if (Array.isArray(target.ingredientsOptional)) {
        optIngInput.value = target.ingredientsOptional
          .map(ing => (ing.amount ? `${ing.name} ${ing.amount}` : ing.name))
          .join("\n");
      } else if (typeof target.ingredientsOptionalText === "string") {
        optIngInput.value = target.ingredientsOptionalText;
      }

      // 단계
      let stepData = [];
      if (Array.isArray(target.stepsDetail)) {
        stepData = target.stepsDetail;
      } else if (typeof target.steps === "string" && target.steps.trim()) {
        stepData = [{ title: "", description: target.steps.trim() }];
      }

      if (stepListEl) {
        stepListEl.innerHTML = "";
        if (stepData.length) {
          stepData.forEach(s => addStep(s));
        } else {
          addStep();
        }
      }

      // 이미지
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

        if (draft.title)     titleInput.value = draft.title;
        if (draft.category) {
          categoryRadios.forEach(r => r.checked = (r.value === draft.category));
        }

        if (draft.ingredientsRequiredText) {
          reqIngInput.value = draft.ingredientsRequiredText;
        } else if (draft.ingredients) {
          reqIngInput.value = draft.ingredients;
        }

        if (draft.ingredientsOptionalText) {
          optIngInput.value = draft.ingredientsOptionalText;
        }

        let stepsDraft = [];
        if (Array.isArray(draft.stepsDetail)) {
          stepsDraft = draft.stepsDetail;
        } else if (Array.isArray(draft.steps)) {
          stepsDraft = draft.steps;
        } else if (typeof draft.steps === "string" && draft.steps.trim()) {
          stepsDraft = [{ title: "", description: draft.steps.trim() }];
        }

        if (stepListEl) {
          stepListEl.innerHTML = "";
          if (stepsDraft.length) {
            stepsDraft.forEach(s => addStep(s));
          } else {
            addStep();
          }
        }

        updateDraftTime(draft.savedAt || null);
      } catch {
        updateDraftTime(null);
      }
    })();
  }

  if (!isEdit && saveDraftBtn) {
    saveDraftBtn.addEventListener("click", () => {
      const info = collectFormData();
      const draft = {
        title: info.title,
        category: info.category,
        ingredientsRequiredText: info.ingredientsRequiredText,
        ingredientsOptionalText: info.ingredientsOptionalText,
        stepsDetail: info.stepsDetail,
        imageName: imageInput.files[0]?.name || "",
        savedAt: Date.now()
      };

      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      updateDraftTime(draft.savedAt);
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

    if (!info.title) {
      alert("레시피 제목을 입력해주세요.");
      return;
    }
    if (!info.category) {
      alert("카테고리를 선택해주세요.");
      return;
    }
    if (!info.ingredientsRequired.length) {
      alert("필수 재료를 한 개 이상 입력해주세요.");
      return;
    }
    if (!info.stepsDetail.length) {
      alert("조리 과정을 한 단계 이상 입력해주세요.");
      return;
    }

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
      target.image       = imageDataUrl; // 새 이미지 or 기존 이미지 유지

      saveRecipes(list);

      alert("레시피가 수정되었습니다!");
      window.location.href = "11_인공띠용지능_recipe_manage.html";
    } else {
      const now = Date.now();

      const newRecipe = {
        id:        now,
        title:     info.title,
        category:  info.category,
        image:     imageDataUrl,

        // 새 구조
        ingredientsRequired: info.ingredientsRequired,
        ingredientsOptional: info.ingredientsOptional,
        stepsDetail:         info.stepsDetail,

        // 텍스트 필드 (상세 페이지용)
        ingredientsRequiredText: info.ingredientsRequiredText,
        ingredientsOptionalText: info.ingredientsOptionalText,

        // 기존 구조(문자열)도 함께 저장
        ingredients: info.ingredientsPlain,
        steps:       info.stepsPlain,

        views:     0,
        rating:    0,
        createdAt: now
      };

      list.push(newRecipe);
      saveRecipes(list);

      localStorage.removeItem(DRAFT_KEY);
      updateDraftTime(null);
      form.reset();

      if (stepListEl) {
        stepListEl.innerHTML = "";
        addStep();
      }

      alert("레시피가 등록되었습니다!");
    }
  }
});
