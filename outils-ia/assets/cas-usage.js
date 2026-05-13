const CASE_DATA_URL = "/outils-ia/data/cas-usage.json";
const ALL = "Tous";

const state = {
  cases: [],
  query: "",
  category: ALL,
  tool: ALL,
  selectedId: null,
};

const nodes = {
  search: document.querySelector("#caseSearch"),
  categoryFilters: document.querySelector("#categoryFilters"),
  toolFilters: document.querySelector("#toolFilters"),
  grid: document.querySelector("#caseGrid"),
  detail: document.querySelector("#caseDetail"),
  count: document.querySelector("#caseResultCount"),
  total: document.querySelector("[data-total-cases]"),
  visible: document.querySelector("[data-visible-count]"),
};

initCaseExplorer();

async function initCaseExplorer() {
  if (!document.querySelector("[data-case-explorer]")) return;

  try {
    const response = await fetch(CASE_DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("cas-usage introuvable");
    const payload = await response.json();
    state.cases = payload.fiches || [];
    state.selectedId = state.cases[0]?.id || null;

    nodes.total.textContent = state.cases.length;
    bindCaseEvents();
    renderFilters();
    renderCases();
    renderDetail();
  } catch (error) {
    nodes.grid.innerHTML = `<p class="empty-state">La bibliothèque n'a pas pu être chargée.</p>`;
  }
}

function bindCaseEvents() {
  nodes.search.addEventListener("input", () => {
    state.query = nodes.search.value;
    renderCases();
  });
}

function renderFilters() {
  renderChipGroup(nodes.categoryFilters, [ALL, ...unique(state.cases.map((item) => item.categorie))], state.category, (value) => {
    state.category = value;
    state.selectedId = getVisibleCases()[0]?.id || state.selectedId;
    renderFilters();
    renderCases();
    renderDetail();
  });

  renderChipGroup(nodes.toolFilters, [ALL, ...unique(state.cases.map((item) => item.outil))], state.tool, (value) => {
    state.tool = value;
    state.selectedId = getVisibleCases()[0]?.id || state.selectedId;
    renderFilters();
    renderCases();
    renderDetail();
  });
}

function renderChipGroup(root, values, currentValue, onSelect) {
  root.innerHTML = "";
  values.forEach((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-chip ${value === currentValue ? "active" : ""}`;
    button.textContent = value;
    button.addEventListener("click", () => onSelect(value));
    root.appendChild(button);
  });
}

function renderCases() {
  const cases = getVisibleCases();
  nodes.visible.textContent = cases.length;
  nodes.count.textContent = `${cases.length} cas`;
  nodes.grid.innerHTML = "";

  if (cases.length === 0) {
    nodes.grid.innerHTML = `<p class="empty-state">Aucun cas ne correspond aux filtres. Essayez un mot plus simple : réunion, document, client, RH.</p>`;
    nodes.detail.innerHTML = `<p class="empty-state">Aucun cas à afficher pour le moment.</p>`;
    return;
  }

  if (!cases.some((item) => item.id === state.selectedId)) {
    state.selectedId = cases[0].id;
  }

  cases.forEach((item) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `case-tool-card ${item.id === state.selectedId ? "selected" : ""}`;
    card.innerHTML = `
      <span>${escapeHtml(item.domaine)}</span>
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
}

function renderDetail() {
  const item = state.cases.find((entry) => entry.id === state.selectedId);
  if (!item) {
    nodes.detail.innerHTML = `<p class="empty-state">Sélectionnez un cas d'usage pour voir le mode d'emploi.</p>`;
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
    .filter((item) => state.category === ALL || item.categorie === state.category)
    .filter((item) => state.tool === ALL || item.outil === state.tool)
    .filter((item) => {
      if (!query) return true;
      const haystack = normalize([
        item.tache,
        item.outil,
        item.categorie,
        item.domaine,
        item.entree,
        item.sortie,
        item.utilisation,
        ...(item.tags || []),
      ].join(" "));
      return query.split(/\s+/).every((term) => haystack.includes(term));
    })
    .sort((a, b) => getMonthlyGain(b) - getMonthlyGain(a));
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
  return Array.from(new Set(values.filter(Boolean)));
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
