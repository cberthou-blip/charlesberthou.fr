const CATEGORY_ORDER = ["Conseil clientèle", "Métiers siège", "Management"];
const MAX_RESULTS = 2;

const state = {
  cases: [],
  selectedId: null,
  selectedCategory: CATEGORY_ORDER[0],
};

const searchInput = document.querySelector("#searchInput");
const searchStatus = document.querySelector("#searchStatus");
const searchHelp = document.querySelector("#searchHelp");
const searchResults = document.querySelector("#searchResults");
const categoryChooser = document.querySelector("#categoryChooser");
const library = document.querySelector("#library");
const assistantCard = document.querySelector("#assistantCard");
const gainForm = document.querySelector("#gainForm");
const calcTask = document.querySelector("#calcTask");
const calcFrequency = document.querySelector("#calcFrequency");
const calcBefore = document.querySelector("#calcBefore");
const calcAfter = document.querySelector("#calcAfter");
const monthlyGain = document.querySelector("#monthlyGain");
const annualGain = document.querySelector("#annualGain");

init();

async function init() {
  try {
    const response = await fetch("cas_usage.json");
    if (!response.ok) {
      throw new Error("JSON introuvable");
    }
    const payload = await response.json();
    state.cases = Array.isArray(payload) ? payload : payload.fiches || [];
    state.selectedId = getCasesForCategory(state.selectedCategory)[0]?.id || null;

    renderCategoryChooser();
    renderLibrary();
    renderSearchResults("");
    renderSelectedCase();
    updateCalculatorFromSelection();
    updateGains();
    bindEvents();
  } catch (error) {
    searchStatus.textContent = "Impossible de charger les fiches.";
  }
}

function bindEvents() {
  searchInput.addEventListener("input", () => {
    renderSearchResults(searchInput.value);
  });

  gainForm.addEventListener("input", updateGains);
}

function normalize(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ");
}

function getSearchScore(item, query) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return 1;
  }

  const task = normalize(item.tache);
  const tags = normalize((item.tags || []).join(" "));
  const input = normalize(item.entree);
  const output = normalize(item.sortie);

  return terms.reduce((score, term) => {
    let termScore = 0;
    if (task.includes(term)) {
      termScore += 3;
    }
    if (tags.includes(term)) {
      termScore += 2;
    }
    if (input.includes(term)) {
      termScore += 1;
    }
    if (output.includes(term)) {
      termScore += 1;
    }
    return score + termScore;
  }, 0);
}

function getRankedResults(query) {
  const ranked = state.cases
    .map((item, index) => ({
      item,
      index,
      score: getSearchScore(item, query),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  return ranked.slice(0, MAX_RESULTS).map((entry) => entry.item);
}

function renderSearchResults(query) {
  const results = getRankedResults(query);
  const cleanQuery = query.trim();

  searchStatus.textContent = cleanQuery
    ? `Résultats de la recherche (${results.length})`
    : "Suggestions pour commencer";
  searchHelp.textContent = cleanQuery
    ? "Fiches les plus proches des mots saisis dans la barre."
    : "Exemples de fiches disponibles. Tapez une tâche pour affiner.";

  searchResults.innerHTML = "";
  if (results.length === 0) {
    searchResults.innerHTML = `
      <div class="no-results">
        <strong>Aucun résultat direct</strong>
        <span>Essayez avec un mot plus simple : mail, réunion, procédure, contrat.</span>
      </div>
    `;
    return;
  }

  results.forEach((item) => {
    searchResults.appendChild(createResultCard(item, cleanQuery.length === 0));
  });
}

function createResultCard(item, isSuggestion = false) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = `result-card${isSuggestion ? " is-suggestion" : ""}${item.id === state.selectedId ? " is-selected" : ""}`;
  card.addEventListener("click", () => selectCase(item.id));

  if (isSuggestion) {
    card.innerHTML = `
      <h3>${escapeHtml(item.tache)}</h3>
      <p class="result-meta">${escapeHtml(item.iaction)}</p>
      <span class="gain-note">${getGainLabel(item)}</span>
    `;
  } else {
    card.innerHTML = `
      <div class="result-topline">
        <h3>${escapeHtml(item.tache)}</h3>
        <span class="gain-pill">${getGainLabel(item)}</span>
      </div>
      <p class="result-meta">${escapeHtml(item.iaction)} · ${escapeHtml(item.reglage)}</p>
      <p class="result-line"><strong>Ajoutez</strong> ${escapeHtml(item.entree)}</p>
      <p class="result-line"><strong>Vérifiez</strong> ${escapeHtml(item.verification.slice(0, 3).join(", "))}</p>
    `;
  }

  return card;
}

function renderCategoryChooser() {
  categoryChooser.innerHTML = "";

  CATEGORY_ORDER.forEach((category) => {
    const count = getCasesForCategory(category).length;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `category-choice${category === state.selectedCategory ? " is-selected" : ""}`;
    button.addEventListener("click", () => selectCategory(category));
    button.innerHTML = `
      <span>${escapeHtml(category)}</span>
      <strong>${count > 0 ? `${count} fiches` : "À venir"}</strong>
    `;
    categoryChooser.appendChild(button);
  });
}

function renderLibrary() {
  library.innerHTML = "";

  const categoryCases = getCasesForCategory(state.selectedCategory);
  if (categoryCases.length === 0) {
    library.innerHTML = `
      <div class="library-empty">
        <h3>${escapeHtml(state.selectedCategory)}</h3>
        <p>Aucune fiche dans cette première version.</p>
      </div>
    `;
    return;
  }

  const categoryBlock = document.createElement("section");
  categoryBlock.className = "category-block";
  categoryBlock.innerHTML = `<h3 class="category-title">${escapeHtml(state.selectedCategory)}</h3>`;

  groupBy(categoryCases, "sous_categorie").forEach((items, subCategory) => {
    const subBlock = document.createElement("div");
    subBlock.className = "sub-category";
    subBlock.innerHTML = `<h3>${escapeHtml(subCategory)}</h3>`;

    const list = document.createElement("div");
    list.className = "case-list";

    items.forEach((item) => {
      list.appendChild(createLibraryCard(item));
    });

    subBlock.appendChild(list);
    categoryBlock.appendChild(subBlock);
  });

  library.appendChild(categoryBlock);
}

function createLibraryCard(item) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = `case-card${item.id === state.selectedId ? " is-selected" : ""}`;
  card.addEventListener("click", () => selectCase(item.id));
  card.innerHTML = `
    <h4>${escapeHtml(item.tache)}</h4>
    <p>${escapeHtml(item.iaction)} · ${escapeHtml(item.reglage)}</p>
    <span class="gain-note">${getGainLabel(item)}</span>
  `;
  return card;
}

function renderSelectedCase() {
  const selected = getSelectedCase();
  if (!selected) {
    assistantCard.innerHTML = `<p class="empty-state">Sélectionnez une fiche pour voir les étapes.</p>`;
    return;
  }

  const promptBlock = selected.prompt_iachat
    ? `
      <div class="usage-row prompt-row">
        <dt>Prompt IA’Chat</dt>
        <dd>${escapeHtml(selected.prompt_iachat)}</dd>
      </div>
    `
    : "";

  assistantCard.innerHTML = `
    <h3>${escapeHtml(selected.tache)}</h3>
    <dl class="usage-list">
      <div class="usage-row">
        <dt>${getIcon("open")} Ouvrez</dt>
        <dd>${escapeHtml(selected.iaction)}</dd>
      </div>
      <div class="usage-row">
        <dt>${getIcon("add")} Ajoutez</dt>
        <dd>${escapeHtml(selected.entree)}</dd>
      </div>
      <div class="usage-row">
        <dt>${getIcon("settings")} Choisissez</dt>
        <dd>${escapeHtml(selected.reglage)}</dd>
      </div>
      <div class="usage-row">
        <dt>${getIcon("check")} Vérifiez</dt>
        <dd>
          <span>${escapeHtml(selected.utilisation)}</span>
          <span class="checks">${selected.verification.map((check) => `<span class="check-item">${escapeHtml(check)}</span>`).join("")}</span>
        </dd>
      </div>
      ${promptBlock}
    </dl>
  `;
}

function selectCase(id) {
  const selected = state.cases.find((item) => item.id === id);
  state.selectedId = id;
  if (selected) {
    state.selectedCategory = selected.categorie;
  }
  renderCategoryChooser();
  renderLibrary();
  renderSearchResults(searchInput.value);
  renderSelectedCase();
  updateCalculatorFromSelection();
  updateGains();
}

function selectCategory(category) {
  state.selectedCategory = category;
  state.selectedId = getCasesForCategory(category)[0]?.id || null;
  renderCategoryChooser();
  renderLibrary();
  renderSearchResults(searchInput.value);
  renderSelectedCase();
  updateCalculatorFromSelection();
  updateGains();
}

function updateCalculatorFromSelection() {
  const selected = getSelectedCase();
  if (!selected) {
    calcTask.value = "";
    calcFrequency.value = 0;
    calcBefore.value = 0;
    calcAfter.value = 0;
    return;
  }

  const after = Number(selected.temps_apres_minutes) || Math.max(1, Math.round(selected.gain_minutes * 0.6));
  const before = after + selected.gain_minutes;

  calcTask.value = selected.tache;
  calcFrequency.value = selected.frequence;
  calcBefore.value = before;
  calcAfter.value = after;
}

function updateGains() {
  const frequency = Number(calcFrequency.value) || 0;
  const before = Number(calcBefore.value) || 0;
  const after = Number(calcAfter.value) || 0;
  const monthly = Math.max(0, frequency * (before - after));
  const annual = monthly * 12;

  monthlyGain.textContent = formatMinutes(monthly);
  annualGain.textContent = formatMinutes(annual);
}

function formatMinutes(minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining === 0 ? `${hours} h` : `${hours} h ${remaining} min`;
}

function getSelectedCase() {
  return state.cases.find((item) => item.id === state.selectedId);
}

function getCasesForCategory(category) {
  return state.cases.filter((item) => item.categorie === category);
}

function getGainLabel(item) {
  return `Gain de temps approx. : ${item.gain_minutes} min`;
}

function groupBy(items, key) {
  return items.reduce((groups, item) => {
    const value = item[key];
    if (!groups.has(value)) {
      groups.set(value, []);
    }
    groups.get(value).push(item);
    return groups;
  }, new Map());
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getIcon(name) {
  const paths = {
    open: '<path d="M5 6.5h10l4 4v7H5z"></path><path d="M14 6.5v4h5"></path>',
    add: '<path d="M12 5v14M5 12h14"></path>',
    settings: '<path d="M6 8h12M8 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path><path d="M6 16h12M16 16a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path>',
    check: '<path d="M5 12.5l4.2 4L19 7"></path>',
  };

  return `<svg class="row-picto" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || ""}</svg>`;
}
