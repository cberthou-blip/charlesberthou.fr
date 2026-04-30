const CATEGORY_ORDER = ["Conseil clientèle", "Métiers siège", "Management"];
const INTENT_FILTERS = [
  { id: "all", label: "Toutes", help: "Voir les idées proposées", matches: () => true },
  { id: "summarize", label: "Résumer", help: "Comprendre un texte ou un document", matches: (item) => item.iaction.includes("Résumer") },
  { id: "rewrite", label: "Reformuler", help: "Améliorer un message", matches: (item) => item.iaction.includes("Reformuler") },
  { id: "dictate", label: "Dicter", help: "Transformer l’oral en note", matches: (item) => item.iaction.includes("Dicter") },
  { id: "meeting", label: "Compte rendu", help: "Gagner du temps après un échange", matches: (item) => textIncludes(item, ["réunion", "compte rendu", "rendez-vous", "visite"]) },
  { id: "structure", label: "Structurer", help: "Préparer une analyse ou un plan", matches: (item) => item.iaction === "IA’Chat" || textIncludes(item, ["structurer", "préparer", "trame", "plan d’action", "questions", "checklist"]) },
];
const DOMAIN_LABELS = {
  "Conseiller clientèle": "Conseiller clientèle",
  "Clientèle professionnelle et agricole": "Pro / Agri",
  "Conseil patrimonial": "Patrimonial",
  Financement: "Financement",
  "Pilotage et comités": "Pilotage",
  "Assistance réseau / support": "Assistance",
  "Conformité / Risques / Contrôle": "Conformité / Risques / Contrôle",
  "Projets / Organisation": "Projets / Organisation",
  RH: "RH",
  "Marketing / Communication": "Marketing / Communication",
  "Juridique / Fiscalité": "Juridique / Fiscalité",
  "Finance / Pilotage": "Finance",
  "Audit / Inspection": "Audit / Inspection",
  "Engagements / Recouvrement / Contentieux": "Engagements",
  Manager: "Manager",
};
const SEARCH_SYNONYMS = {
  cr: ["compte", "rendu"],
  mail: ["message", "réponse"],
  email: ["mail", "message", "réponse"],
  reunion: ["compte", "rendu", "transcription"],
  rdv: ["rendez-vous", "visite", "note"],
  rh: ["ressources", "humaines", "recrutement", "entretien", "cv"],
  contrat: ["convention", "juridique", "clauses"],
  document: ["pdf", "word", "note", "rapport"],
  analyse: ["structurer", "questions", "points", "risque"],
};
const PRUDENT_ESTIMATES = {
  "CC-001": [18, 12], "CC-002": [22, 15], "CC-003": [10, 6], "CC-004": [12, 9],
  "CC-005": [12, 8], "CC-006": [9, 6], "CC-007": [10, 7], "CC-008": [22, 15],
  "CC-009": [35, 27], "CC-010": [28, 21], "CC-011": [14, 10], "CC-012": [14, 10],
  "CC-013": [20, 14], "CC-014": [24, 17], "CC-015": [13, 9], "CC-016": [16, 12],
  "CC-017": [35, 27], "CC-018": [30, 23], "CC-019": [18, 14], "CC-020": [16, 12],
  "MS-001": [22, 16], "MS-002": [10, 6], "MS-003": [10, 7], "MS-004": [9, 6],
  "MS-005": [25, 19], "MS-006": [12, 8], "MS-007": [25, 18], "MS-008": [14, 10],
  "MS-009": [24, 18], "MS-010": [14, 10], "MS-011": [24, 18], "MS-012": [45, 33],
  "MS-013": [22, 16], "MS-014": [10, 7], "MS-015": [10, 7], "MS-016": [16, 11],
  "MS-017": [50, 35], "MS-018": [28, 21], "MS-019": [14, 10], "MS-020": [25, 18],
  "MS-021": [10, 7], "MS-022": [18, 13], "MS-023": [14, 10], "MS-024": [18, 13],
  "MS-025": [26, 20], "MS-026": [16, 11], "MS-027": [45, 33], "MS-028": [10, 7],
  "MS-029": [12, 9], "MS-030": [22, 17], "MS-031": [20, 14], "MS-032": [28, 21],
  "MS-033": [10, 7], "MS-034": [30, 23], "MS-035": [28, 21], "MS-036": [14, 10],
  "MS-037": [25, 19], "MS-038": [30, 23], "MS-039": [18, 13], "MS-040": [28, 21],
  "MS-041": [10, 7], "MS-042": [35, 26], "MS-043": [45, 33], "MS-044": [14, 10],
  "MS-045": [28, 21], "MS-046": [35, 26], "MS-047": [9, 6], "MS-048": [28, 21],
  "MG-001": [20, 14], "MG-002": [12, 9], "MG-003": [10, 7], "MG-004": [22, 16],
  "MG-005": [9, 6], "MG-006": [9, 6], "MG-007": [16, 11], "MG-008": [14, 10],
  "MG-009": [14, 10], "MG-010": [22, 16], "MG-011": [12, 9], "MG-012": [14, 10],
};
const MAX_RESULTS = 2;
const DISCOVERY_LIMIT = 6;
const FEATURED_TASK_IDS = ["MS-017", "MS-043"];
const DEFAULT_IACTION_SETTINGS = {
  "Résumer un texte": {
    "Type de résumé": ["Liste à puce", "Paragraphe"],
    "Longueur de résumé": ["court", "moyen", "long"],
  },
  "Résumer un document": {
    "Longueur de résumé": ["court", "moyen", "long"],
  },
  "Reformuler un texte": {
    "Mode de reformulation": ["Paraphraser", "Adoucir", "Simplifier", "Etoffer"],
  },
};

const state = {
  cases: [],
  settings: DEFAULT_IACTION_SETTINGS,
  selectedId: null,
  selectedIntent: null,
  selectedCategory: CATEGORY_ORDER[0],
  selectedDomain: null,
  showFullLibrary: false,
};

const searchInput = document.querySelector("#searchInput");
const suggestTaskButton = document.querySelector("#suggestTaskButton");
const searchStatus = document.querySelector("#searchStatus");
const searchHelp = document.querySelector("#searchHelp");
const searchResults = document.querySelector("#searchResults");
const intentChooser = document.querySelector("#intentChooser");
const ideaRail = document.querySelector("#ideaRail");
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
    state.settings = payload.parametres_iactions || DEFAULT_IACTION_SETTINGS;
    applyPrudentEstimates(state.cases);

    const initialCase = getDefaultSuggestions()[0] || getCasesForCategory(state.selectedCategory)[0];
    state.selectedId = initialCase?.id || null;
    state.selectedCategory = initialCase?.categorie || state.selectedCategory;

    renderIntentChooser();
    renderIdeaRail();
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

  if (suggestTaskButton) {
    suggestTaskButton.addEventListener("click", () => {
      searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
      searchInput.focus();
    });
  }

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
  const terms = getSearchTerms(query);
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

function getSearchTerms(query) {
  const baseTerms = normalize(query).split(/\s+/).filter(Boolean);
  const expanded = baseTerms.flatMap((term) => [term, ...(SEARCH_SYNONYMS[term] || []).map(normalize)]);
  return Array.from(new Set(expanded));
}

function applyPrudentEstimates(items) {
  items.forEach((item) => {
    const estimate = PRUDENT_ESTIMATES[item.id];
    if (!estimate) {
      return;
    }
    const [before, after] = estimate;
    item.temps_avant_minutes = before;
    item.temps_apres_minutes = after;
    item.gain_minutes = Math.max(0, before - after);
  });
}

function getRankedResults(query) {
  if (query.trim().length === 0) {
    return getDefaultSuggestions();
  }

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

function getDefaultSuggestions() {
  const featured = FEATURED_TASK_IDS
    .map((id) => state.cases.find((item) => item.id === id))
    .filter(Boolean);

  if (featured.length >= MAX_RESULTS) {
    return featured.slice(0, MAX_RESULTS);
  }

  return state.cases
    .slice()
    .sort((a, b) => getMonthlyGain(b) - getMonthlyGain(a))
    .slice(0, MAX_RESULTS);
}

function renderSearchResults(query) {
  const results = getRankedResults(query);
  const cleanQuery = query.trim();

  searchStatus.textContent = cleanQuery
    ? `Résultats de la recherche (${results.length})`
    : "Idées de tâches à simplifier";
  searchHelp.textContent = cleanQuery
    ? "Fiches les plus proches des mots saisis dans la barre."
    : "Deux exemples à fort gain de temps. Tapez une tâche pour affiner.";

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
      <p class="result-meta">Ouvrir : ${escapeHtml(item.iaction)}</p>
      <span class="gain-note">${getMonthlyGainLabel(item)}</span>
    `;
  } else {
    card.innerHTML = `
      <div class="result-topline">
        <h3>${escapeHtml(item.tache)}</h3>
        <span class="gain-pill">${getMonthlyGainLabel(item)}</span>
      </div>
      <p class="result-meta">${escapeHtml(item.iaction)} · ${escapeHtml(getSettingsLabel(item))}</p>
      <p class="result-line"><strong>Ajoutez</strong> ${escapeHtml(item.entree)}</p>
      <p class="result-line"><strong>Vérifiez</strong> ${escapeHtml(item.verification.slice(0, 3).join(", "))}</p>
    `;
  }

  return card;
}

function renderIntentChooser() {
  if (!intentChooser) {
    return;
  }

  intentChooser.innerHTML = "";

  INTENT_FILTERS.forEach((intent) => {
    const value = intent.id === "all" ? null : intent.id;
    const count = value ? state.cases.filter((item) => itemMatchesIntent(item, value)).length : state.cases.length;
    intentChooser.appendChild(createIntentButton(intent, value, count));
  });
}

function createIntentButton(intent, value, count) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `intent-choice${value === state.selectedIntent ? " is-selected" : ""}`;
  button.addEventListener("click", () => selectIntent(value));
  button.innerHTML = `
    <span>${escapeHtml(intent.label)}</span>
    <small>${escapeHtml(intent.help)}</small>
    <strong>${count}</strong>
  `;
  return button;
}

function renderIdeaRail() {
  if (!ideaRail) {
    return;
  }

  ideaRail.innerHTML = "";
  getIdeaCases().forEach((entry) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `idea-card${entry.item.id === state.selectedId ? " is-selected" : ""}`;
    card.addEventListener("click", () => selectCase(entry.item.id));
    card.innerHTML = `
      <span>${escapeHtml(entry.badge)}</span>
      <strong>${escapeHtml(entry.item.tache)}</strong>
      <small>${getMonthlyGainLabel(entry.item)}</small>
    `;
    ideaRail.appendChild(card);
  });
}

function renderCategoryChooser() {
  categoryChooser.innerHTML = "";

  CATEGORY_ORDER.forEach((category) => {
    const count = getCasesForCategory(category).filter(itemMatchesSelectedIntent).length;
    categoryChooser.appendChild(createCategoryButton(category, category, count));
  });
}

function createCategoryButton(label, value, count) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `category-choice${value === state.selectedCategory ? " is-selected" : ""}`;
  button.addEventListener("click", () => selectCategory(value));
  button.innerHTML = `
    <span>${escapeHtml(label)}</span>
    <strong>${count > 0 ? `${count} fiches` : "À venir"}</strong>
  `;
  return button;
}

function renderLibrary() {
  library.innerHTML = "";

  const categoryCases = getCasesForCategory(state.selectedCategory).filter(itemMatchesSelectedIntent);
  const availableDomains = getAvailableDomains(categoryCases);
  if (state.selectedDomain && !availableDomains.some((domain) => domain.key === state.selectedDomain)) {
    state.selectedDomain = null;
  }

  const visibleCases = getVisibleCases();
  const isDiscoveryMode = false;
  const displayedCases = visibleCases;
  if (visibleCases.length === 0) {
    library.innerHTML = `
      <div class="library-empty">
        <h3>Aucune fiche trouvée</h3>
        <p>Aucune fiche dans cette première version.</p>
      </div>
    `;
    return;
  }

  const categoryBlock = document.createElement("section");
  categoryBlock.className = "category-block";
  categoryBlock.innerHTML = `
    <div class="library-summary">
      <div>
        <span class="filter-label">Domaines</span>
        <h3 class="category-title">${escapeHtml(getLibraryTitle())}</h3>
      </div>
      <strong>${isDiscoveryMode ? `${displayedCases.length} idées` : `${visibleCases.length} fiches`}</strong>
    </div>
  `;

  if (!isDiscoveryMode) {
    categoryBlock.appendChild(createDomainTags(availableDomains, categoryCases.length));
  }

  if (isDiscoveryMode) {
    const discoveryBlock = document.createElement("div");
    discoveryBlock.className = "discovery-library";
    discoveryBlock.innerHTML = `
      <div class="discovery-copy">
        <h4>Quelques tâches pour commencer</h4>
        <p>Des exemples fréquents ou à fort gain pour repérer rapidement ce que l’IA peut alléger.</p>
      </div>
    `;

    const list = document.createElement("div");
    list.className = "case-list discovery-list";
    displayedCases.forEach((item) => {
      list.appendChild(createLibraryCard(item));
    });
    discoveryBlock.appendChild(list);

    const showAllButton = document.createElement("button");
    showAllButton.type = "button";
    showAllButton.className = "show-all-button";
    showAllButton.textContent = "Voir toute la bibliothèque";
    showAllButton.addEventListener("click", () => {
      state.showFullLibrary = true;
      renderLibrary();
    });
    discoveryBlock.appendChild(showAllButton);
    categoryBlock.appendChild(discoveryBlock);
    library.appendChild(categoryBlock);
    return;
  }

  groupBy(displayedCases, "categorie").forEach((items, category) => {
    const categoryGroup = document.createElement("div");
    categoryGroup.className = "library-category-group";
    categoryGroup.innerHTML = state.selectedCategory ? "" : `<h3>${escapeHtml(category)}</h3>`;

    groupBy(items, "sous_categorie").forEach((subItems, subCategory) => {
      const subBlock = document.createElement("div");
      subBlock.className = "sub-category";
      subBlock.innerHTML = `<h4>${escapeHtml(subCategory)}</h4>`;

      const list = document.createElement("div");
      list.className = "case-list";

      subItems.forEach((item) => {
        list.appendChild(createLibraryCard(item));
      });

      subBlock.appendChild(list);
      categoryGroup.appendChild(subBlock);
    });

    categoryBlock.appendChild(categoryGroup);
  });

  library.appendChild(categoryBlock);
}

function getLibraryTitle() {
  if (state.selectedDomain) {
    return getDomainLabel(state.selectedDomain);
  }
  if (state.selectedIntent) {
    return `Tâches pour ${getIntentLabel(state.selectedIntent).toLowerCase()}`;
  }
  if (state.selectedCategory) {
    return `Domaines de ${state.selectedCategory}`;
  }
  return "Tous les domaines";
}

function getAvailableDomains(items) {
  const domains = new Map();

  items.forEach((item) => {
    const key = getDomainKey(item);
    if (!domains.has(key)) {
      domains.set(key, {
        key,
        label: getDomainLabel(key),
        count: 0,
      });
    }
    domains.get(key).count += 1;
  });

  return Array.from(domains.values());
}

function createDomainTags(domains, totalCount) {
  const wrapper = document.createElement("div");
  wrapper.className = "job-tags";
  wrapper.setAttribute("aria-label", "Domaines disponibles");

  const allButton = createDomainButton("Tous les domaines", null, totalCount);
  wrapper.appendChild(allButton);

  domains.forEach((domain) => {
    wrapper.appendChild(createDomainButton(domain.label, domain.key, domain.count));
  });

  return wrapper;
}

function createDomainButton(label, value, count) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `job-tag${state.selectedDomain === value ? " is-selected" : ""}`;
  button.addEventListener("click", () => selectDomain(value));
  button.innerHTML = `
    <span>${escapeHtml(label)}</span>
    <small>${count}</small>
  `;
  return button;
}

function createLibraryCard(item) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = `case-card${item.id === state.selectedId ? " is-selected" : ""}`;
  card.addEventListener("click", () => selectCase(item.id));
  card.innerHTML = `
    <h4>${escapeHtml(item.tache)}</h4>
    <p class="case-why">${escapeHtml(getUsefulnessText(item))}</p>
    <div class="case-details">
      <span>Ouvrir : ${escapeHtml(item.iaction)}</span>
      <strong>${getMonthlyGainLabel(item)}</strong>
    </div>
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
    <div class="assistant-gain">
      <span>Gain estimé prudent</span>
      <strong>${getMonthlyGainLabel(selected)}</strong>
      <small>${getGainLabel(selected)} · ${selected.frequence || 0} fois/mois</small>
    </div>
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
        <dd>${escapeHtml(getSettingsLabel(selected))}</dd>
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
    state.selectedDomain = getDomainKey(selected);
  }
  renderIdeaRail();
  renderIntentChooser();
  renderCategoryChooser();
  renderLibrary();
  renderSearchResults(searchInput.value);
  renderSelectedCase();
  updateCalculatorFromSelection();
  updateGains();
}

function selectIntent(intent) {
  state.selectedIntent = intent;
  state.selectedDomain = null;
  state.showFullLibrary = false;
  state.selectedId = getVisibleCases()[0]?.id || null;
  renderIntentChooser();
  renderCategoryChooser();
  renderLibrary();
  renderSearchResults(searchInput.value);
  renderSelectedCase();
  updateCalculatorFromSelection();
  updateGains();
}

function selectCategory(category) {
  state.selectedCategory = category;
  state.selectedDomain = null;
  state.showFullLibrary = false;
  state.selectedId = getVisibleCases()[0]?.id || null;
  renderIntentChooser();
  renderCategoryChooser();
  renderLibrary();
  renderSearchResults(searchInput.value);
  renderSelectedCase();
  updateCalculatorFromSelection();
  updateGains();
}

function selectDomain(domain) {
  state.selectedDomain = domain;
  state.showFullLibrary = false;
  state.selectedId = getVisibleCases()[0]?.id || null;
  renderIntentChooser();
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
  const before = Number(selected.temps_avant_minutes) || after + selected.gain_minutes;

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
  if (!category) {
    return state.cases;
  }
  return state.cases.filter((item) => item.categorie === category);
}

function getCasesForIntent(intent) {
  if (!intent) {
    return state.cases;
  }
  return state.cases.filter((item) => itemMatchesIntent(item, intent));
}

function getVisibleCases() {
  return getCasesForCategory(state.selectedCategory).filter((item) => {
    return itemMatchesSelectedIntent(item) && (!state.selectedDomain || getDomainKey(item) === state.selectedDomain);
  });
}

function itemMatchesSelectedIntent(item) {
  return !state.selectedIntent || itemMatchesIntent(item, state.selectedIntent);
}

function itemMatchesIntent(item, intentId) {
  const intent = INTENT_FILTERS.find((entry) => entry.id === intentId);
  return !intent || intent.matches(item);
}

function getIntentLabel(intentId) {
  return INTENT_FILTERS.find((intent) => intent.id === intentId)?.label || "toutes";
}

function getDomainKey(item) {
  return item.sous_categorie || item.categorie || "Autres";
}

function getDomainLabel(key) {
  return DOMAIN_LABELS[key] || key;
}

function getStarterCases() {
  const pools = [
    state.cases.filter((item) => getMonthlyGain(item) >= 60),
    state.cases.filter((item) => ["Reformuler un texte", "Dicter un texte", "Résumer un texte"].includes(item.iaction)),
    state.cases.filter((item) => item.iaction === "IA’Chat" || item.tache.toLowerCase().includes("irritants")),
  ];

  return uniqueCases(pools.flat())
    .sort((a, b) => getDiscoveryScore(b) - getDiscoveryScore(a))
    .slice(0, DISCOVERY_LIMIT);
}

function getIdeaCases() {
  const highImpact = [...state.cases].sort((a, b) => getMonthlyGain(b) - getMonthlyGain(a)).slice(0, 2);
  const easy = state.cases
    .filter((item) => ["Reformuler un texte", "Dicter un texte", "Résumer un texte"].includes(item.iaction))
    .sort((a, b) => (b.frequence || 0) - (a.frequence || 0) || getMonthlyGain(b) - getMonthlyGain(a))
    .slice(0, 2);
  const discovery = state.cases.find((item) => textIncludes(item, ["irritants", "trame", "checklist"])) || state.cases.find((item) => item.iaction === "IA’Chat");

  const filler = [...state.cases].sort((a, b) => getDiscoveryScore(b) - getDiscoveryScore(a));
  return uniqueCases([...highImpact, ...easy, discovery, ...filler].filter(Boolean)).slice(0, 5).map((item) => ({
    item,
    badge: getIdeaBadge(item),
  }));
}

function getIdeaBadge(item) {
  if (getMonthlyGain(item) >= 70) {
    return "Gros gain";
  }
  if (["Reformuler un texte", "Dicter un texte", "Résumer un texte"].includes(item.iaction)) {
    return "Facile à tester";
  }
  return "À découvrir";
}

function getDiscoveryScore(item) {
  const simpleBonus = ["Reformuler un texte", "Dicter un texte", "Résumer un texte"].includes(item.iaction) ? 20 : 0;
  const discoveryBonus = item.iaction === "IA’Chat" || textIncludes(item, ["irritants", "trame", "checklist"]) ? 12 : 0;
  return getMonthlyGain(item) + simpleBonus + discoveryBonus;
}

function uniqueCases(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item || seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

function getUsefulnessText(item) {
  if (item.iaction === "Transcrire et résumer une réunion") {
    return "Pour transformer une réunion en décisions, actions et points à vérifier.";
  }
  if (item.iaction === "Dicter un texte") {
    return "Pour capturer une note sans la rédiger au clavier.";
  }
  if (item.iaction === "Reformuler un texte") {
    return "Pour rendre un message plus clair, plus simple ou plus adapté.";
  }
  if (item.iaction === "IA’Chat") {
    return "Pour structurer une analyse sans remplacer la validation métier.";
  }
  if (item.iaction === "Résumer un document") {
    return "Pour lire vite un document dense avant de vérifier la source.";
  }
  return "Pour extraire rapidement les points utiles avant d’agir.";
}

function textIncludes(item, terms) {
  const haystack = normalize([
    item.tache,
    item.iaction,
    item.entree,
    item.sortie,
    item.sous_categorie,
    ...(item.tags || []),
  ].filter(Boolean).join(" "));

  return terms.some((term) => haystack.includes(normalize(term)));
}

function getSettingsLabel(item) {
  const settings = state.settings[item.iaction] || DEFAULT_IACTION_SETTINGS[item.iaction];
  if (!settings) {
    return item.reglage || "Aucun réglage";
  }

  return Object.entries(settings)
    .map(([label, choices]) => `${label} : ${formatChoiceList(choices)}`)
    .join(" · ");
}

function formatChoiceList(choices) {
  const values = Array.isArray(choices) ? choices : [choices];

  if (values.length <= 1) {
    return values[0] || "";
  }

  if (values.length === 2) {
    return `${values[0]} ou ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")} ou ${values[values.length - 1]}`;
}

function getMonthlyGain(item) {
  return (Number(item.frequence) || 0) * (Number(item.gain_minutes) || 0);
}

function getMonthlyGainLabel(item) {
  return `≈ ${formatMinutes(getMonthlyGain(item))}/mois`;
}

function getGainLabel(item) {
  return `≈ ${item.gain_minutes} min par usage`;
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
