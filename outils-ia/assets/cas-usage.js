const CASE_DATA_URL = "/outils-ia/data/cas-usage.json";
const ALL = "Tous";
const NO_SELECTION = "";
const CASE_PAGE_SIZE = 12;

const intentOptions = [
  { label: ALL, terms: [] },
  { label: "Résumer", terms: ["résumer", "résumé", "synthèse", "compte rendu"] },
  { label: "Rédiger", terms: ["rédiger", "écrire", "mail", "document", "contenu"] },
  { label: "Préparer", terms: ["préparer", "plan", "checklist", "cadrage", "ordre du jour"] },
  { label: "Contrôler", terms: ["contrôler", "vérifier", "audit", "conformité", "risque"] },
  { label: "Client", terms: ["client", "support", "vente", "commercial", "réclamation"] },
  { label: "RH", terms: ["rh", "candidat", "entretien", "formation", "collaborateur"] },
  { label: "Finance", terms: ["finance", "facture", "budget", "trésorerie", "comptable"] },
];

const state = {
  cases: [],
  query: "",
  category: NO_SELECTION,
  domain: NO_SELECTION,
  topic: NO_SELECTION,
  tool: ALL,
  intent: ALL,
  selectedId: null,
  visibleLimit: CASE_PAGE_SIZE,
};

const nodes = {
  search: document.querySelector("#caseSearch"),
  intentFilters: document.querySelector("#intentFilters"),
  domainFilters: document.querySelector("#domainFilters"),
  categoryFilters: document.querySelector("#categoryFilters"),
  topicFilters: document.querySelector("#topicFilters"),
  toolFilters: document.querySelector("#toolFilters"),
  domainBlock: document.querySelector("#domainFilterBlock"),
  topicBlock: document.querySelector("#topicFilterBlock"),
  advancedFilters: document.querySelector("#caseAdvancedFilters"),
  filterHint: document.querySelector("#caseFilterHint"),
  reset: document.querySelector("#caseResetFilters"),
  grid: document.querySelector("#caseGrid"),
  detail: document.querySelector("#caseDetail"),
  count: document.querySelector("#caseResultCount"),
  total: document.querySelector("[data-total-cases]"),
  visible: document.querySelector("[data-visible-count]"),
  loadMoreRow: document.querySelector("#caseLoadMoreRow"),
  loadMore: document.querySelector("#caseLoadMore"),
};

initCaseExplorer();

async function initCaseExplorer() {
  if (!document.querySelector("[data-case-explorer]")) return;

  try {
    const response = await fetch(CASE_DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("cas-usage introuvable");
    const payload = await response.json();
    state.cases = payload.fiches || [];

    nodes.total.textContent = state.cases.length;
    bindCaseEvents();
    renderCaseExplorer();
  } catch (error) {
    nodes.grid.innerHTML = `<p class="empty-state">La bibliothèque n'a pas pu être chargée.</p>`;
  }
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
}

function renderCaseExplorer() {
  renderFilters();
  renderCases();
  renderDetail();
}

function renderFilters() {
  renderChipGroup(nodes.categoryFilters, unique(state.cases.map((item) => item.categorie)), state.category, (value) => {
    state.category = value === state.category ? NO_SELECTION : value;
    state.domain = NO_SELECTION;
    state.topic = NO_SELECTION;
    state.intent = ALL;
    state.tool = ALL;
    resetCaseSelection();
    renderCaseExplorer();
  });

  const domainCases = state.category
    ? state.cases.filter((item) => item.categorie === state.category)
    : [];

  nodes.domainBlock?.toggleAttribute("hidden", !state.category);
  renderChipGroup(nodes.domainFilters, unique(domainCases.map((item) => item.domaine)), state.domain, (value) => {
    state.domain = value === state.domain ? NO_SELECTION : value;
    state.topic = NO_SELECTION;
    state.intent = ALL;
    state.tool = ALL;
    resetCaseSelection();
    renderCaseExplorer();
  });

  const topicCases = state.domain
    ? domainCases.filter((item) => item.domaine === state.domain)
    : [];

  nodes.topicBlock?.toggleAttribute("hidden", !state.domain);
  renderChipGroup(nodes.topicFilters, unique(topicCases.map(getTopic)), state.topic, (value) => {
    state.topic = value === state.topic ? NO_SELECTION : value;
    resetCaseSelection();
    renderCaseExplorer();
  });

  nodes.advancedFilters?.toggleAttribute("hidden", !hasActiveExploration());

  renderChipGroup(nodes.intentFilters, intentOptions.map((item) => item.label), state.intent, (value) => {
    state.intent = value;
    resetCaseSelection();
    renderCaseExplorer();
  });

  renderChipGroup(nodes.toolFilters, [ALL, ...unique(state.cases.map((item) => item.outil))], state.tool, (value) => {
    state.tool = value;
    resetCaseSelection();
    renderCaseExplorer();
  });

  nodes.reset?.toggleAttribute("hidden", !hasActiveExploration());
  renderFilterHint();
}

function renderChipGroup(root, values, currentValue, onSelect) {
  if (!root) return;
  root.innerHTML = "";
  values.forEach((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-chip ${value === currentValue ? "active" : ""}`;
    button.setAttribute("aria-pressed", String(value === currentValue));
    button.textContent = value;
    button.addEventListener("click", () => onSelect(value));
    root.appendChild(button);
  });
}

function renderCases() {
  nodes.grid.innerHTML = "";

  if (!hasActiveExploration()) {
    state.selectedId = null;
    nodes.visible.textContent = "0";
    nodes.count.textContent = "Choisissez un filtre";
    nodes.grid.innerHTML = `
      <p class="empty-state">
        Choisissez une grande famille, lancez une recherche ou affinez l'arborescence pour afficher les cas d'usage.
      </p>
    `;
    toggleLoadMore(0, 0);
    return;
  }

  const cases = getVisibleCases();
  const displayedCases = cases.slice(0, state.visibleLimit);
  nodes.visible.textContent = displayedCases.length;
  nodes.count.textContent = `${cases.length} cas`;

  if (cases.length === 0) {
    nodes.grid.innerHTML = `<p class="empty-state">Aucun cas ne correspond aux filtres. Essayez un mot plus simple : réunion, document, client, RH.</p>`;
    state.selectedId = null;
    toggleLoadMore(0, 0);
    return;
  }

  if (state.selectedId && !cases.some((item) => item.id === state.selectedId)) {
    state.selectedId = null;
  }

  displayedCases.forEach((item) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `case-tool-card ${item.id === state.selectedId ? "selected" : ""}`;
    card.innerHTML = `
      <span>${escapeHtml(item.domaine)} · ${escapeHtml(item.categorie)}</span>
      <strong>${escapeHtml(item.tache)}</strong>
      <p>${escapeHtml(item.sortie)}</p>
      <em>${escapeHtml(item.outil)} · ${getMonthlyGainLabel(item)}</em>
    `;
    card.addEventListener("click", () => {
      state.selectedId = item.id;
      renderCases();
      renderDetail();
    });
    nodes.grid.appendChild(card);
  });

  toggleLoadMore(displayedCases.length, cases.length);
}

function renderDetail() {
  const item = state.cases.find((entry) => entry.id === state.selectedId);
  if (!item) {
    nodes.detail.innerHTML = `<p class="empty-state">Sélectionnez un cas affiché pour voir les étapes.</p>`;
    return;
  }

  nodes.detail.innerHTML = `
    <div class="detail-heading">
      <span class="icon-mark compact"><svg><use href="#icon-tools"></use></svg></span>
      <div>
        <p class="meta">${escapeHtml(item.categorie)} · ${escapeHtml(item.domaine)}</p>
        <h2>${escapeHtml(item.tache)}</h2>
      </div>
    </div>
    <p class="detail-summary">${escapeHtml(item.sortie)}</p>
    <div class="tag-row compact-tags case-detail-tags">${(item.tags || []).slice(0, 5).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
    <div class="tool-detail-metrics">
      <span><strong>${formatMinutes(item.gain_minutes)}</strong> gagnées par usage</span>
      <span><strong>${formatMinutes(getMonthlyGain(item))}</strong> par mois estimé</span>
      <span><strong>${item.frequence}</strong> fois/mois</span>
    </div>
    <dl class="usage-list">
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
    .filter((item) => !state.category || item.categorie === state.category)
    .filter((item) => !state.domain || item.domaine === state.domain)
    .filter((item) => !state.topic || getTopic(item) === state.topic)
    .filter((item) => state.tool === ALL || item.outil === state.tool)
    .filter((item) => matchesIntent(item))
    .filter((item) => {
      if (!query) return true;
      const haystack = normalize(caseText(item));
      return query.split(/\s+/).every((term) => haystack.includes(term));
    })
    .sort((a, b) => getMonthlyGain(b) - getMonthlyGain(a));
}

function matchesIntent(item) {
  if (state.intent === ALL) return true;
  const option = intentOptions.find((entry) => entry.label === state.intent);
  if (!option) return true;
  const haystack = normalize(caseText(item));
  return option.terms.some((term) => haystack.includes(normalize(term)));
}

function caseText(item) {
  return [
    item.tache,
    item.outil,
    item.categorie,
    item.domaine,
    item.entree,
    item.sortie,
    item.utilisation,
    ...(item.tags || []),
  ].join(" ");
}

function hasActiveExploration() {
  return Boolean(
    state.query.trim()
    || state.category
    || state.domain
    || state.topic
    || state.tool !== ALL
    || state.intent !== ALL
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
  state.tool = ALL;
  state.intent = ALL;
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

function getTopic(item) {
  return Array.isArray(item.chemin) && item.chemin[2] ? item.chemin[2] : item.domaine;
}

function renderFilterHint() {
  if (!nodes.filterHint) return;

  if (!hasActiveExploration()) {
    nodes.filterHint.textContent = "Choisissez une grande famille ou utilisez la recherche pour afficher les cas d'usage.";
    return;
  }

  const parts = [
    state.category,
    state.domain,
    state.topic,
    state.intent !== ALL ? state.intent : "",
    state.tool !== ALL ? state.tool : "",
  ].filter(Boolean);

  if (state.query.trim()) {
    parts.unshift(`Recherche : ${state.query.trim()}`);
  }

  nodes.filterHint.textContent = parts.length
    ? `Sélection active : ${parts.join(" > ")}.`
    : "Les cas filtrés s'affichent ci-dessous.";
}

function getMonthlyGain(item) {
  return (Number(item.frequence) || 0) * (Number(item.gain_minutes) || 0);
}

function getMonthlyGainLabel(item) {
  return `${formatMinutes(getMonthlyGain(item))}/mois`;
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
