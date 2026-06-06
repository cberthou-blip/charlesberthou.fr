const CASE_DATA_URL = "/outils-ia/data/cas-usage.json";
const CASE_METIER_DATA_URL = "/outils-ia/data/cas-usage-metiers.json";
const NO_SELECTION = "";
const CASE_PAGE_SIZE = 12;

const METIER_ORDER = [
  "Conseil",
  "Finance",
  "Comptabilité",
  "Droit / Avocat",
  "Santé",
  "Ressources humaines",
  "Relation client",
  "Conformité / Risques",
  "Marketing / Communication",
  "Management",
  "Service client",
  "Projet / Opérations",
  "DSI / Informatique",
  "Achats / Logistique",
  "Éducation / Formation",
];

const METIER_DESCRIPTIONS = {
  "Conseil": "Cadrage, diagnostic, benchmark",
  "Finance": "Analyse, cash, reporting",
  "Comptabilité": "Clôture, TVA, justificatifs",
  "Droit / Avocat": "Contrats, jurisprudence, contentieux",
  "Santé": "Dossier, qualité, pédagogie patient",
  "Ressources humaines": "Recrutement, compétences, onboarding",
  "Relation client": "Relation client, CRM, dossiers",
  "Conformité / Risques": "KYC, contrôle interne, veille",
  "Marketing / Communication": "Contenu, voix client, campagnes",
  "Management": "Rituels, arbitrage, communication",
  "Service client": "Procédures, demandes, réclamations",
  "Projet / Opérations": "Suivi, organisation, plan d'action",
  "DSI / Informatique": "Tickets, produit, tests",
  "Achats / Logistique": "Fournisseurs, stock, transport",
  "Éducation / Formation": "Cours, quiz, individualisation",
};

const SECTOR_ORDER = [
  "Tous secteurs",
  "Activités spécialisées",
  "Finance / Assurance",
  "Santé / Médico-social",
  "Secteur public / Collectivités",
  "Industrie",
  "Commerce / Retail",
  "Technologie / Télécoms",
  "Transport / Logistique",
  "Éducation / Formation",
  "Énergie / Utilities",
];

const TASK_TYPE_ORDER = [
  "Synthétiser",
  "Rédiger",
  "Analyser",
  "Contrôler",
  "Préparer",
  "Rechercher",
  "Classer",
  "Automatiser",
  "Décider / arbitrer",
];

const RISK_ORDER = ["Faible", "Moyen", "Élevé"];

const MODEL_PROFILES = {
  general: {
    principal: "GPT-5.5",
    alternative: "Claude Opus 4.7",
    economique: "GPT-5.4 mini",
    souverain: "Mistral Medium 3.5",
    usage: "Cas généraliste nécessitant un bon équilibre entre raisonnement, synthèse et clarté.",
    raison: "Le cas demande de structurer une réponse fiable sans spécialisation dominante.",
  },
  reasoning: {
    principal: "GPT-5.5",
    alternative: "Claude Opus 4.7",
    economique: "GPT-5.4 mini",
    souverain: "Mistral Medium 3.5",
    usage: "Analyse multi-contraintes, arbitrage, diagnostic ou décision préparatoire.",
    raison: "Le besoin principal est la qualité du raisonnement et la capacité à tenir plusieurs hypothèses.",
  },
  writing: {
    principal: "Claude Opus 4.7",
    alternative: "GPT-5.5",
    economique: "Claude Haiku 4.5",
    souverain: "Mistral Medium 3.5",
    usage: "Rédaction longue, reformulation sensible, argumentation ou adaptation du ton.",
    raison: "La valeur se joue surtout sur la nuance, le style et la qualité éditoriale.",
  },
  "long-document": {
    principal: "Gemini 3 Pro",
    alternative: "GPT-5.5",
    economique: "GPT-5.4 mini",
    souverain: "Mistral Medium 3.5",
    usage: "Lecture de PDF, corpus longs, pièces multiples, tableaux ou documents multimodaux.",
    raison: "Le cas dépend d'abord de l'ingestion documentaire et de la robustesse sur contexte long.",
  },
  "customer-volume": {
    principal: "GPT-5.4 mini",
    alternative: "Claude Haiku 4.5",
    economique: "GPT-5.4 mini",
    souverain: "Mistral Small 4",
    usage: "Tâches fréquentes, bien cadrées, à faible risque et besoin de réponse rapide.",
    raison: "Le gain vient du volume, de la latence basse et d'un coût maîtrisé par interaction.",
  },
  finance: {
    principal: "GPT-5.5",
    alternative: "Gemini 3 Pro",
    economique: "GPT-5.4 mini",
    souverain: "Mistral Medium 3.5",
    usage: "Analyse chiffrée, synthèse financière, scénarios et explication de variations.",
    raison: "Le cas exige un raisonnement prudent sur chiffres, hypothèses et limites d'interprétation.",
  },
  legal: {
    principal: "Claude Opus 4.7",
    alternative: "GPT-5.5",
    economique: "GPT-5.4 mini",
    souverain: "Mistral Medium 3.5",
    usage: "Préparation juridique, revue de clauses, rédaction argumentée ou analyse de dossier.",
    raison: "La nuance rédactionnelle et la prudence de formulation comptent autant que le raisonnement.",
  },
  health: {
    principal: "Gemini 3 Pro",
    alternative: "GPT-5.5",
    economique: "GPT-5.4 mini",
    souverain: "Mistral Medium 3.5",
    usage: "Synthèse de dossier, vulgarisation, qualité ou documentation santé sous validation humaine.",
    raison: "Les cas santé sont documentaires et sensibles : priorité au contexte long et au contrôle humain.",
  },
  compliance: {
    principal: "GPT-5.5",
    alternative: "Mistral Medium 3.5",
    economique: "GPT-5.4 mini",
    souverain: "Mistral Large 3",
    usage: "Contrôle, conformité, audit, KYC, risques ou dossiers sensibles.",
    raison: "Le cas demande traçabilité, prudence et option de déploiement maîtrisé.",
  },
  coding: {
    principal: "Mistral Medium 3.5",
    alternative: "GPT-5.5",
    economique: "GPT-5.4 mini",
    souverain: "Mistral Medium 3.5 self-hosted",
    usage: "Spécification, tests, tickets, diagnostic technique, code ou workflows agentiques.",
    raison: "Le cas bénéficie d'un modèle robuste en code, outils et exécution de tâches longues.",
  },
  workflow: {
    principal: "Mistral Medium 3.5",
    alternative: "GPT-5.5",
    economique: "GPT-5.4 mini",
    souverain: "Mistral Medium 3.5",
    usage: "Plan d'action, coordination, classement, automatisation légère ou suivi opérationnel.",
    raison: "Le besoin porte sur des sorties structurées et des enchaînements opérationnels.",
  },
};

const state = {
  cases: [],
  query: "",
  category: NO_SELECTION,
  domain: NO_SELECTION,
  topic: NO_SELECTION,
  sector: NO_SELECTION,
  taskType: NO_SELECTION,
  risk: NO_SELECTION,
  selectedId: null,
  visibleLimit: CASE_PAGE_SIZE,
};

const nodes = {
  search: document.querySelector("#caseSearch"),
  functionSelect: document.querySelector("#functionSelect"),
  activitySelect: document.querySelector("#activitySelect"),
  situationSelect: document.querySelector("#situationSelect"),
  sectorSelect: document.querySelector("#sectorSelect"),
  taskTypeSelect: document.querySelector("#taskTypeSelect"),
  riskSelect: document.querySelector("#riskSelect"),
  domainBlock: document.querySelector("#domainFilterBlock"),
  topicBlock: document.querySelector("#topicFilterBlock"),
  advancedFilters: document.querySelector("#caseAdvancedFilters"),
  filterHint: document.querySelector("#caseFilterHint"),
  reset: document.querySelector("#caseResetFilters"),
  grid: document.querySelector("#caseGrid"),
  detail: document.querySelector("#caseDetail"),
  count: document.querySelector("#caseResultCount"),
  total: document.querySelector("[data-total-cases]"),
  functions: document.querySelector("[data-total-functions]"),
  visible: document.querySelector("[data-visible-count]"),
  loadMoreRow: document.querySelector("#caseLoadMoreRow"),
  loadMore: document.querySelector("#caseLoadMore"),
  quickStarts: document.querySelectorAll("[data-case-quick-field]"),
};

initCaseExplorer();

async function initCaseExplorer() {
  if (!document.querySelector("[data-case-explorer]")) return;

  try {
    const payloads = await loadCasePayloads();
    state.cases = payloads.flatMap((payload) => payload.fiches || []);

    nodes.total.textContent = state.cases.length;
    if (nodes.functions) nodes.functions.textContent = unique(state.cases.map(getMetier)).length;
    bindCaseEvents();
    renderCaseExplorer();
  } catch (error) {
    nodes.grid.innerHTML = `<p class="empty-state">La bibliothèque n'a pas pu être chargée.</p>`;
  }
}

async function loadCasePayloads() {
  return Promise.all([CASE_DATA_URL, CASE_METIER_DATA_URL].map(async (url) => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`${url} introuvable`);
    return response.json();
  }));
}

function bindCaseEvents() {
  nodes.search.addEventListener("input", () => {
    state.query = nodes.search.value;
    resetCaseSelection();
    renderCaseExplorer();
  });

  nodes.loadMore?.addEventListener("click", () => {
    state.visibleLimit += CASE_PAGE_SIZE;
    renderCases();
  });

  nodes.reset?.addEventListener("click", () => {
    resetFilters();
    renderCaseExplorer();
  });

  nodes.functionSelect?.addEventListener("change", () => {
    state.category = nodes.functionSelect.value;
    state.domain = NO_SELECTION;
    state.topic = NO_SELECTION;
    resetCaseSelection();
    renderCaseExplorer();
  });

  nodes.activitySelect?.addEventListener("change", () => {
    state.domain = nodes.activitySelect.value;
    state.topic = NO_SELECTION;
    resetCaseSelection();
    renderCaseExplorer();
  });

  nodes.situationSelect?.addEventListener("change", () => {
    state.topic = nodes.situationSelect.value;
    resetCaseSelection();
    renderCaseExplorer();
  });

  nodes.sectorSelect?.addEventListener("change", () => {
    state.sector = nodes.sectorSelect.value;
    resetCaseSelection();
    renderCaseExplorer();
  });

  nodes.taskTypeSelect?.addEventListener("change", () => {
    state.taskType = nodes.taskTypeSelect.value;
    resetCaseSelection();
    renderCaseExplorer();
  });

  nodes.riskSelect?.addEventListener("change", () => {
    state.risk = nodes.riskSelect.value;
    resetCaseSelection();
    renderCaseExplorer();
  });

  nodes.quickStarts?.forEach((button) => {
    button.addEventListener("click", () => {
      const field = button.dataset.caseQuickField;
      const value = button.dataset.caseQuickValue;
      if (!field || !(field in state)) return;
      state[field] = value;
      if (field === "category") {
        state.domain = NO_SELECTION;
        state.topic = NO_SELECTION;
      }
      resetCaseSelection();
      renderCaseExplorer();
      document.querySelector("#caseLibraryTitle")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderCaseExplorer() {
  renderFilters();
  renderQuickStarts();
  renderCases();
  renderDetail();
}

function renderFilters() {
  renderSelectOptions(
    nodes.functionSelect,
    buildFilterOptions(state.cases, getMetier, METIER_ORDER, METIER_DESCRIPTIONS),
    state.category,
    "Tous les métiers"
  );

  const domainCases = state.category
    ? state.cases.filter((item) => getMetier(item) === state.category)
    : [];

  nodes.domainBlock?.toggleAttribute("hidden", !state.category);
  renderSelectOptions(
    nodes.activitySelect,
    buildFilterOptions(domainCases, getActivity),
    state.domain,
    "Toutes les activités"
  );

  const topicCases = state.domain
    ? domainCases.filter((item) => getActivity(item) === state.domain)
    : [];

  nodes.topicBlock?.toggleAttribute("hidden", !state.domain);
  renderSelectOptions(
    nodes.situationSelect,
    buildFilterOptions(topicCases, getTopic),
    state.topic,
    "Toutes les situations"
  );

  nodes.advancedFilters?.removeAttribute("hidden");

  renderSelectOptions(
    nodes.sectorSelect,
    buildFacetOptions(state.cases, getSectors, SECTOR_ORDER),
    state.sector,
    "Tous les secteurs"
  );
  renderSelectOptions(
    nodes.taskTypeSelect,
    buildFilterOptions(state.cases, getTaskType, TASK_TYPE_ORDER),
    state.taskType,
    "Tous les usages"
  );
  renderSelectOptions(
    nodes.riskSelect,
    buildFilterOptions(state.cases, getRiskLevel, RISK_ORDER),
    state.risk,
    "Tous les niveaux"
  );

  nodes.reset?.toggleAttribute("hidden", !hasActiveExploration());
}

function renderQuickStarts() {
  nodes.quickStarts?.forEach((button) => {
    const field = button.dataset.caseQuickField;
    const value = button.dataset.caseQuickValue;
    const active = Boolean(field && value && state[field] === value);
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function renderSelectOptions(select, options, currentValue, placeholder) {
  if (!select) return;
  select.innerHTML = `
    <option value="">${escapeHtml(placeholder)}</option>
    ${options.map((option) => {
      const count = option.count ? ` (${option.count})` : "";
      return `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label || option.value)}${count}</option>`;
    }).join("")}
  `;
  select.value = currentValue;
}

function renderCases() {
  nodes.grid.innerHTML = "";

  if (!hasActiveExploration()) {
    const cases = getDefaultCases();
    if (state.selectedId && !cases.some((item) => item.id === state.selectedId)) {
      state.selectedId = null;
    }
    nodes.visible.textContent = cases.length;
    nodes.count.hidden = false;
    nodes.count.textContent = `${cases.length} cas affichés sur ${state.cases.length}`;
    cases.forEach(renderCaseCard);
    toggleLoadMore(cases.length, cases.length);
    renderFilterHint(cases.length);
    return;
  }

  const cases = getVisibleCases();
  const displayedCases = cases.slice(0, state.visibleLimit);
  nodes.visible.textContent = displayedCases.length;
  nodes.count.hidden = false;
  nodes.count.textContent = `${displayedCases.length} cas affichés sur ${cases.length} correspondants`;

  if (cases.length === 0) {
    nodes.grid.innerHTML = `<p class="empty-state">Aucun cas ne correspond aux filtres. Essayez un mot plus simple : réunion, document, client, RH.</p>`;
    state.selectedId = null;
    toggleLoadMore(0, 0);
    renderFilterHint(0);
    return;
  }

  if (state.selectedId && !cases.some((item) => item.id === state.selectedId)) {
    state.selectedId = null;
  }

  displayedCases.forEach(renderCaseCard);

  toggleLoadMore(displayedCases.length, cases.length);
  renderFilterHint(cases.length);
}

function renderCaseCard(item) {
  const risk = getRiskLevel(item);
  const sector = getPrimarySector(item);
  const taskType = getTaskType(item);
  const card = document.createElement("button");
  card.type = "button";
  card.className = `case-tool-card ${item.id === state.selectedId ? "selected" : ""}`;
  card.setAttribute("aria-label", `Ouvrir la fiche : ${item.tache}`);
  card.innerHTML = `
    <span class="case-card-kicker">${escapeHtml(getMetier(item))} · ${escapeHtml(getActivity(item))}</span>
    <strong class="case-card-title">${escapeHtml(item.tache)}</strong>
    <p>${escapeHtml(item.sortie)}</p>
    <div class="case-card-meta">
      <small class="gain-tag">${getMonthlyGainLabel(item)}</small>
      <small class="risk-${normalizeRisk(risk)}">${escapeHtml(formatRiskLabel(risk))}</small>
      <small>${escapeHtml(taskType)}</small>
      <small>${escapeHtml(sector)}</small>
    </div>
    <span class="case-card-cta">Ouvrir la fiche</span>
  `;
  card.addEventListener("click", () => {
    state.selectedId = item.id;
    renderCases();
    renderDetail();
  });
  nodes.grid.appendChild(card);
}

function renderDetail() {
  const item = state.cases.find((entry) => entry.id === state.selectedId);
  if (!item) {
    nodes.detail.innerHTML = `
      <div class="case-start-guide">
        <strong>Sélectionnez un cas pour ouvrir la fiche.</strong>
        <p>Une fiche doit aider à décider vite si le cas mérite un pilote. Elle rassemble les éléments utiles avant d'aller plus loin.</p>
        <dl>
          <div><dt>Tâche</dt><dd>ce qui est fait</dd></div>
          <div><dt>Sortie</dt><dd>le résultat attendu</dd></div>
          <div><dt>Gain</dt><dd>temps estimé</dd></div>
          <div><dt>Vigilance</dt><dd>risque à contrôler</dd></div>
          <div><dt>Suite</dt><dd>chiffrer ou inscrire</dd></div>
        </dl>
      </div>
    `;
    return;
  }

  const model = getModelAdvice(item);
  const risk = getRiskLevel(item);
  const references = getReferences(item);
  const sectors = getSectors(item);
  const taskType = getTaskType(item);

  nodes.detail.innerHTML = `
    <div class="detail-heading">
      <span class="icon-mark compact"><svg><use href="#icon-tools"></use></svg></span>
      <div>
        <p class="meta">${escapeHtml(getMetier(item))} · ${escapeHtml(getActivity(item))}</p>
        <h2>${escapeHtml(item.tache)}</h2>
      </div>
    </div>
    <p class="detail-summary">${escapeHtml(item.sortie)}</p>
    <div class="tag-row compact-tags case-detail-tags">${(item.tags || []).slice(0, 5).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
    <div class="tool-detail-metrics">
      <span><strong>${formatMinutes(item.gain_minutes)}</strong> gagnées par usage</span>
      <span><strong>${formatMinutes(getMonthlyGain(item))}</strong> par mois estimé</span>
      <span><strong>${escapeHtml(risk)}</strong> niveau de vigilance</span>
    </div>
    <div class="case-guidance-block model-guidance">
      <h3>Modèle conseillé</h3>
      <div class="model-choice-grid">
        <div class="model-choice primary">
          <span>Premier choix</span>
          <strong>${escapeHtml(model.principal)}</strong>
        </div>
        <div class="model-choice">
          <span>Alternative premium</span>
          <strong>${escapeHtml(model.alternative)}</strong>
        </div>
        <div class="model-choice">
          <span>Option économique</span>
          <strong>${escapeHtml(model.economique)}</strong>
        </div>
        <div class="model-choice">
          <span>Entreprise / souverain</span>
          <strong>${escapeHtml(model.souverain)}</strong>
        </div>
      </div>
      <p>${escapeHtml(model.usage)}</p>
      <p class="model-reason"><strong>Pourquoi :</strong> ${escapeHtml(model.raison)}</p>
    </div>
    <dl class="usage-list">
      <div class="usage-row">
        <dt>Secteur</dt>
        <dd><span class="checks">${sectors.map((sector) => `<span class="check-item">${escapeHtml(sector)}</span>`).join("")}</span></dd>
      </div>
      <div class="usage-row">
        <dt>Type d'usage</dt>
        <dd>${escapeHtml(taskType)}</dd>
      </div>
      <div class="usage-row">
        <dt>Outil</dt>
        <dd>${escapeHtml(item.outil)}</dd>
      </div>
      <div class="usage-row">
        <dt>Entrée à fournir</dt>
        <dd>${escapeHtml(item.entree)}</dd>
      </div>
      <div class="usage-row">
        <dt>Réglage conseillé</dt>
        <dd>${escapeHtml(item.reglage)}</dd>
      </div>
      <div class="usage-row">
        <dt>Vérifier avant d'utiliser</dt>
        <dd>
          <span>${escapeHtml(item.utilisation)}</span>
          <span class="checks">${item.verification.map((check) => `<span class="check-item">${escapeHtml(check)}</span>`).join("")}</span>
        </dd>
      </div>
      <div class="usage-row">
        <dt>Garde-fou</dt>
        <dd>${escapeHtml(getGuardrail(item))}</dd>
      </div>
      <div class="usage-row">
        <dt>Références métier</dt>
        <dd><span class="checks">${references.map((reference) => `<span class="check-item">${escapeHtml(reference)}</span>`).join("")}</span></dd>
      </div>
    </dl>
    <form class="mini-gain-form" id="miniGainForm">
      <label>
        Fréquence / mois
        <input id="gainFrequency" type="number" min="0" step="1" value="${item.frequence}" />
      </label>
      <label>
        Avant IA (min)
        <input id="gainBefore" type="number" min="0" step="1" value="${item.temps_avant_minutes}" />
      </label>
      <label>
        Après IA (min)
        <input id="gainAfter" type="number" min="0" step="1" value="${item.temps_apres_minutes}" />
      </label>
      <output class="mini-gain-output" id="gainOutput">${getMonthlyGainLabel(item)}</output>
    </form>
    <div class="detail-actions">
      <a class="button secondary" href="/outils-ia/roi-ia/">Chiffrer ce cas</a>
      <a class="text-link" href="/outils-ia/registre-ia/">L'inscrire dans le registre IA</a>
    </div>
  `;

  const form = document.querySelector("#miniGainForm");
  form.addEventListener("input", updateMiniGain);
}

function updateMiniGain() {
  const frequency = Number(document.querySelector("#gainFrequency").value) || 0;
  const before = Number(document.querySelector("#gainBefore").value) || 0;
  const after = Number(document.querySelector("#gainAfter").value) || 0;
  const monthly = Math.max(0, frequency * (before - after));
  document.querySelector("#gainOutput").textContent = `${formatMinutes(monthly)}/mois`;
}

function getVisibleCases() {
  const query = normalize(state.query);
  return state.cases
    .filter((item) => !state.category || getMetier(item) === state.category)
    .filter((item) => !state.domain || getActivity(item) === state.domain)
    .filter((item) => !state.topic || getTopic(item) === state.topic)
    .filter((item) => !state.sector || getSectors(item).includes(state.sector))
    .filter((item) => !state.taskType || getTaskType(item) === state.taskType)
    .filter((item) => !state.risk || getRiskLevel(item) === state.risk)
    .filter((item) => {
      if (!query) return true;
      const haystack = normalize(caseText(item));
      return query.split(/\s+/).every((term) => haystack.includes(term));
    })
    .sort((a, b) => getMonthlyGain(b) - getMonthlyGain(a));
}

function getDefaultCases() {
  const selected = [];
  const seenMetiers = new Set();
  const ordered = state.cases.slice().sort((a, b) => getMonthlyGain(b) - getMonthlyGain(a));

  ordered.forEach((item) => {
    if (selected.length >= 6) return;
    const metier = getMetier(item);
    if (!seenMetiers.has(metier) || selected.length >= 4) {
      selected.push(item);
      seenMetiers.add(metier);
    }
  });

  return selected;
}

function caseText(item) {
  return [
    item.tache,
    item.outil,
    item.metier,
    item.activite,
    item.situation,
    item.categorie,
    item.domaine,
    item.entree,
    item.sortie,
    item.utilisation,
    item.secteur,
    item.niveau_risque,
    ...(item.secteurs || []),
    item.modele_recommande?.principal,
    item.modele_recommande?.alternative,
    ...(item.tags || []),
  ].join(" ");
}

function hasActiveExploration() {
  return Boolean(
    state.query.trim()
    || state.category
    || state.domain
    || state.topic
    || state.sector
    || state.taskType
    || state.risk
  );
}

function resetCaseSelection() {
  state.selectedId = null;
  state.visibleLimit = CASE_PAGE_SIZE;
}

function resetFilters() {
  state.query = "";
  state.category = NO_SELECTION;
  state.domain = NO_SELECTION;
  state.topic = NO_SELECTION;
  state.sector = NO_SELECTION;
  state.taskType = NO_SELECTION;
  state.risk = NO_SELECTION;
  resetCaseSelection();
  if (nodes.search) nodes.search.value = "";
}

function toggleLoadMore(visibleCount, totalCount) {
  if (!nodes.loadMoreRow || !nodes.loadMore) return;
  const remaining = totalCount - visibleCount;
  nodes.loadMoreRow.toggleAttribute("hidden", remaining <= 0);
  if (remaining > 0) {
    nodes.loadMore.textContent = `Afficher ${Math.min(CASE_PAGE_SIZE, remaining)} cas de plus`;
  }
}

function buildFilterOptions(items, getter, orderedValues = [], descriptions = {}) {
  const counts = new Map();
  items.forEach((item) => {
    const value = getter(item);
    if (!value) return;
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  return Array.from(counts.entries())
    .sort(([a], [b]) => compareByOrder(a, b, orderedValues))
    .map(([value, count]) => ({
      value,
      label: value,
      count,
      description: descriptions[value] || "",
    }));
}

function buildFacetOptions(items, getter, orderedValues = []) {
  const counts = new Map();
  items.forEach((item) => {
    const rawValues = getter(item);
    const values = Array.isArray(rawValues) ? rawValues : [rawValues];
    values.filter(Boolean).forEach((value) => {
      counts.set(value, (counts.get(value) || 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .sort(([a], [b]) => compareByOrder(a, b, orderedValues))
    .map(([value, count]) => ({ value, label: value, count }));
}

function compareByOrder(a, b, orderedValues = []) {
  const indexA = orderedValues.indexOf(a);
  const indexB = orderedValues.indexOf(b);
  if (indexA !== -1 || indexB !== -1) {
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  }
  return a.localeCompare(b, "fr");
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .trim();
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "fr"));
}

function getMetier(item) {
  if (item.metier) return item.metier;

  const domain = normalize(item.domaine);
  const category = normalize(item.categorie);
  const profile = normalize(item.profil);
  const text = normalize(caseText(item));

  if (category === normalize("Management") || domain.includes("management")) return "Management";
  if (domain.includes("rh") || profile.includes("rh") || text.includes("candidat") || text.includes("formation")) return "Ressources humaines";
  if (domain.includes("relation client") || domain.includes("prospect") || domain.includes("crm")) return "Relation client";
  if (domain.includes("marketing") || domain.includes("communication")) return "Marketing / Communication";
  if (domain.includes("finance") || domain.includes("pilotage") || text.includes("budget") || text.includes("tresorerie")) return "Finance";
  if (domain.includes("compt") || text.includes("facture") || text.includes("tva")) return "Comptabilité";
  if (domain.includes("juridique") || text.includes("contrat") || text.includes("recouvrement")) return "Droit / Avocat";
  if (domain.includes("service client") || category.includes("relation client")) return "Service client";
  if (domain.includes("conformite") || domain.includes("risque") || domain.includes("audit") || text.includes("controle")) return "Conformité / Risques";
  if (domain.includes("support interne") || domain.includes("projet") || domain.includes("organisation")) return "Projet / Opérations";
  if (domain.includes("conseil")) return "Conseil";

  return item.categorie || "Projet / Opérations";
}

function getActivity(item) {
  return item.activite || item.domaine || item.categorie || "Activité";
}

function getTopic(item) {
  return item.situation || (Array.isArray(item.chemin) && item.chemin[2] ? item.chemin[2] : getActivity(item));
}

function getSectors(item) {
  if (Array.isArray(item.secteurs) && item.secteurs.length) return item.secteurs;
  if (item.secteur) return [item.secteur];

  const metier = getMetier(item);
  const text = normalize(caseText(item));

  if (metier === "Finance") return ["Finance / Assurance"];
  if (metier === "Droit / Avocat") return ["Activités spécialisées", "Secteur public / Collectivités"];
  if (metier === "Santé") return ["Santé / Médico-social"];
  if (metier === "Conformité / Risques") return ["Finance / Assurance", "Secteur public / Collectivités"];
  if (metier === "DSI / Informatique") return ["Technologie / Télécoms"];
  if (metier === "Achats / Logistique") return ["Transport / Logistique", "Industrie"];
  if (metier === "Éducation / Formation") return ["Éducation / Formation"];
  if (metier === "Relation client") return ["Commerce / Retail", "Activités spécialisées"];
  if (metier === "Marketing / Communication") return ["Commerce / Retail", "Activités spécialisées"];
  if (metier === "Conseil") return ["Activités spécialisées"];

  if (text.includes("banque") || text.includes("assurance")) return ["Finance / Assurance"];
  if (text.includes("hopital") || text.includes("patient") || text.includes("soin")) return ["Santé / Médico-social"];
  if (text.includes("collectivite") || text.includes("public")) return ["Secteur public / Collectivités"];
  if (text.includes("industrie") || text.includes("usine")) return ["Industrie"];
  if (text.includes("retail") || text.includes("commerce")) return ["Commerce / Retail"];
  if (text.includes("transport") || text.includes("stock")) return ["Transport / Logistique"];
  if (text.includes("energie") || text.includes("utilities")) return ["Énergie / Utilities"];

  return ["Tous secteurs"];
}

function getPrimarySector(item) {
  const sectors = getSectors(item);
  return sectors.find((sector) => sector !== "Tous secteurs") || sectors[0] || "Tous secteurs";
}

function getTaskType(item) {
  if (item.type_usage) return item.type_usage;

  const text = normalize(caseText(item));

  if (text.includes("automatis") || text.includes("transformer") || text.includes("checklist") || text.includes("parcours") || text.includes("workflow")) return "Automatiser";
  if (text.includes("control") || text.includes("audit") || text.includes("verifier") || text.includes("conformite") || text.includes("kyc") || text.includes("risque")) return "Contrôler";
  if (text.includes("rediger") || text.includes("ecrire") || text.includes("article") || text.includes("mail") || text.includes("courrier") || text.includes("contenu")) return "Rédiger";
  if (text.includes("synthese") || text.includes("resumer") || text.includes("resume") || text.includes("compte rendu")) return "Synthétiser";
  if (text.includes("analyser") || text.includes("analyse") || text.includes("ecart") || text.includes("bilan") || text.includes("benchmark") || text.includes("ratio")) return "Analyser";
  if (text.includes("recherche") || text.includes("chercher") || text.includes("veille") || text.includes("jurisprudence")) return "Rechercher";
  if (text.includes("classer") || text.includes("categoriser") || text.includes("prioriser")) return "Classer";
  if (text.includes("decider") || text.includes("arbitrer") || text.includes("decision") || text.includes("comite")) return "Décider / arbitrer";

  return "Préparer";
}

function getRiskLevel(item) {
  if (item.niveau_risque) return item.niveau_risque;
  const metier = getMetier(item);
  const text = normalize(caseText(item));
  if (["Droit / Avocat", "Santé", "Conformité / Risques"].includes(metier)) return "Élevé";
  if (metier === "Finance" && (text.includes("risque") || text.includes("budget") || text.includes("juridique"))) return "Élevé";
  if (text.includes("conformite") || text.includes("contrat") || text.includes("donnees sensibles")) return "Élevé";
  return metier === "Service client" || metier === "Marketing / Communication" ? "Faible" : "Moyen";
}

function normalizeRisk(value) {
  const normalized = normalize(value);
  if (normalized.includes("eleve")) return "high";
  if (normalized.includes("faible")) return "low";
  return "medium";
}

function getModelAdvice(item) {
  const profile = MODEL_PROFILES[getModelProfileKey(item)] || MODEL_PROFILES.general;
  const existing = item.modele_recommande || {};

  return {
    principal: profile.principal || existing.principal,
    alternative: profile.alternative || existing.alternative,
    economique: existing.economique || profile.economique,
    souverain: existing.souverain || profile.souverain,
    usage: profile.usage || existing.usage,
    raison: existing.raison || profile.raison,
  };
}

function getModelProfileKey(item) {
  const metier = getMetier(item);
  const taskType = getTaskType(item);
  const risk = getRiskLevel(item);
  const text = normalize(caseText(item));

  if (metier === "DSI / Informatique" || text.includes("code") || text.includes("ticket") || text.includes("api") || text.includes("test")) return "coding";
  if (metier === "Droit / Avocat" || text.includes("jurisprudence") || text.includes("clause")) return "legal";
  if (metier === "Santé") return "health";
  if (metier === "Conformité / Risques" || text.includes("kyc") || text.includes("audit")) return "compliance";
  if (metier === "Finance" || metier === "Comptabilité") return "finance";
  if (text.includes("pdf") || text.includes("corpus") || text.includes("piece") || text.includes("document") || text.includes("dossier consultation") || text.includes("benchmark")) return "long-document";
  if (metier === "Service client" && risk !== "Élevé") return "customer-volume";
  if (taskType === "Rédiger") return "writing";
  if (taskType === "Analyser" || taskType === "Décider / arbitrer") return "reasoning";
  if (taskType === "Contrôler" && risk === "Élevé") return "compliance";
  if (taskType === "Classer" || taskType === "Automatiser" || taskType === "Préparer") return "workflow";
  if (taskType === "Synthétiser" && risk === "Faible") return "customer-volume";

  return "general";
}

function getGuardrail(item) {
  if (item.garde_fou) return item.garde_fou;
  const risk = getRiskLevel(item);
  if (risk === "Élevé") return "Utiliser comme aide à la préparation uniquement, avec validation d'un professionnel responsable.";
  if (risk === "Moyen") return "Vérifier les faits, les sources et les données avant partage ou décision.";
  return "Relire, adapter au contexte et conserver une trace de la source.";
}

function getReferences(item) {
  if (Array.isArray(item.references_metier) && item.references_metier.length) return item.references_metier;
  const metier = getMetier(item);
  if (["Finance", "Comptabilité", "Santé", "Droit / Avocat", "Conformité / Risques"].includes(metier)) {
    return ["ESCO/ISCO-08", "ROME", "Référentiel interne ou source officielle"];
  }
  return ["ESCO/ISCO-08", "ROME"];
}

function renderFilterHint(resultCount) {
  if (!nodes.filterHint) return;

  if (resultCount !== 0) {
    nodes.filterHint.hidden = true;
    nodes.filterHint.textContent = "";
    return;
  }

  const parts = [
    state.category,
    state.domain,
    state.topic,
    state.sector,
    state.taskType,
    state.risk,
  ].filter(Boolean);

  if (state.query.trim()) {
    parts.unshift(`Recherche : ${state.query.trim()}`);
  }

  nodes.filterHint.hidden = false;
  nodes.filterHint.textContent = parts.length
    ? `Aucun cas trouvé pour : ${parts.join(" > ")}.`
    : "Aucun cas à afficher.";
}

function getMonthlyGain(item) {
  return (Number(item.frequence) || 0) * (Number(item.gain_minutes) || 0);
}

function getMonthlyGainLabel(item) {
  return `${formatMinutes(getMonthlyGain(item))}/mois`;
}

function formatRiskLabel(value) {
  return `Risque ${value || "moyen"}`.replace("Risque Moyen", "Risque moyen").replace("Risque Faible", "Risque faible").replace("Risque Élevé", "Risque élevé");
}

function formatMinutes(minutes) {
  const value = Math.round(Number(minutes) || 0);
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const remaining = value % 60;
  return remaining ? `${hours} h ${remaining} min` : `${hours} h`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
