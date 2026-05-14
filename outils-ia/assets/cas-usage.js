const CASE_DATA_URL = "/outils-ia/data/cas-usage.json";
const CASE_METIER_DATA_URL = "/outils-ia/data/cas-usage-metiers.json";
const ALL = "Tous";
const NO_SELECTION = "";
const CASE_PAGE_SIZE = 12;

const METIER_ORDER = [
  "Conseil",
  "Finance",
  "Comptabilité",
  "Droit / Avocat",
  "Santé",
  "Ressources humaines",
  "Vente / Commercial",
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
  "Vente / Commercial": "Prospection, CRM, appels d'offres",
  "Conformité / Risques": "KYC, contrôle interne, veille",
  "Marketing / Communication": "Contenu, voix client, campagnes",
  "Management": "Rituels, arbitrage, communication",
  "Service client": "Procédures, demandes, réclamations",
  "Projet / Opérations": "Suivi, organisation, plan d'action",
  "DSI / Informatique": "Tickets, produit, tests",
  "Achats / Logistique": "Fournisseurs, stock, transport",
  "Éducation / Formation": "Cours, quiz, individualisation",
};

const DEFAULT_MODEL_BY_METIER = {
  "Conseil": { principal: "GPT-5.5", alternative: "Claude Opus 4.7", usage: "Cadrage, diagnostic et arbitrage avec plusieurs contraintes." },
  "Finance": { principal: "GPT-5.5", alternative: "Gemini 3.1 Pro", usage: "Analyse chiffrée, lecture documentaire et synthèse prudente." },
  "Comptabilité": { principal: "GPT-5.4 mini", alternative: "Mistral Medium 3.5", usage: "Contrôles répétables, documentation et extraction de pièces." },
  "Droit / Avocat": { principal: "GPT-5.5", alternative: "Claude Opus 4.7", usage: "Raisonnement juridique assisté, rédaction argumentée et revue de contrats." },
  "Santé": { principal: "GPT-5.5", alternative: "Gemini 3.1 Pro", usage: "Synthèse documentaire prudente sous contrôle professionnel." },
  "Ressources humaines": { principal: "Claude Opus 4.7", alternative: "GPT-5.5", usage: "Rédaction nuancée, structuration d'entretiens et parcours RH." },
  "Vente / Commercial": { principal: "GPT-5.5", alternative: "Claude Opus 4.7", usage: "Préparation de rendez-vous, synthèse CRM et réponse client." },
  "Conformité / Risques": { principal: "GPT-5.5", alternative: "Mistral Large 3", usage: "Analyse de règles, contrôles et dossiers sensibles." },
  "Marketing / Communication": { principal: "Claude Opus 4.7", alternative: "GPT-5.5", usage: "Rédaction longue, adaptation du ton et analyse de verbatims." },
  "Management": { principal: "Claude Opus 4.7", alternative: "GPT-5.5", usage: "Communication, synthèse de réunion et plan d'action." },
  "Service client": { principal: "GPT-5.4 mini", alternative: "Claude Haiku 4.5", usage: "Réponses fréquentes, procédures et résumés courts." },
  "Projet / Opérations": { principal: "GPT-5.5", alternative: "Mistral Medium 3.5", usage: "Plans d'action, suivi projet et clarification des dépendances." },
  "DSI / Informatique": { principal: "GPT-5.5", alternative: "Mistral Medium 3.5", usage: "Diagnostic, spécifications, tests et documentation technique." },
  "Achats / Logistique": { principal: "GPT-5.5", alternative: "Gemini 3.1 Pro", usage: "Comparaison documentaire, fournisseurs, risques et pièces." },
  "Éducation / Formation": { principal: "Claude Opus 4.7", alternative: "GPT-5.5", usage: "Conception pédagogique, reformulation et feedback." },
};

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
  metierSelect: document.querySelector("#metierSelect"),
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
  metiers: document.querySelector("[data-total-metiers]"),
  visible: document.querySelector("[data-visible-count]"),
  loadMoreRow: document.querySelector("#caseLoadMoreRow"),
  loadMore: document.querySelector("#caseLoadMore"),
};

initCaseExplorer();

async function initCaseExplorer() {
  if (!document.querySelector("[data-case-explorer]")) return;

  try {
    const payloads = await loadCasePayloads();
    state.cases = payloads.flatMap((payload) => payload.fiches || []);

    nodes.total.textContent = state.cases.length;
    if (nodes.metiers) nodes.metiers.textContent = unique(state.cases.map(getMetier)).length;
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

  nodes.metierSelect?.addEventListener("change", () => {
    state.category = nodes.metierSelect.value;
    state.domain = NO_SELECTION;
    state.topic = NO_SELECTION;
    state.intent = ALL;
    state.tool = ALL;
    resetCaseSelection();
    renderCaseExplorer();
  });
}

function renderCaseExplorer() {
  renderFilters();
  renderCases();
  renderDetail();
}

function renderFilters() {
  renderMetierSelect();

  const domainCases = state.category
    ? state.cases.filter((item) => getMetier(item) === state.category)
    : [];

  nodes.domainBlock?.toggleAttribute("hidden", !state.category);
  renderChipGroup(nodes.domainFilters, buildFilterOptions(domainCases, getActivity), state.domain, (value) => {
    state.domain = value === state.domain ? NO_SELECTION : value;
    state.topic = NO_SELECTION;
    state.intent = ALL;
    state.tool = ALL;
    resetCaseSelection();
    renderCaseExplorer();
  });

  const topicCases = state.domain
    ? domainCases.filter((item) => getActivity(item) === state.domain)
    : [];

  nodes.topicBlock?.toggleAttribute("hidden", !state.domain);
  renderChipGroup(nodes.topicFilters, buildFilterOptions(topicCases, getTopic), state.topic, (value) => {
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

function renderMetierSelect() {
  if (!nodes.metierSelect) return;
  const currentValue = state.category;
  const options = buildFilterOptions(state.cases, getMetier, METIER_ORDER, METIER_DESCRIPTIONS);

  nodes.metierSelect.innerHTML = `
    <option value="">Sélectionner un métier</option>
    ${options.map((option) => (
      `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)} (${option.count})</option>`
    )).join("")}
  `;
  nodes.metierSelect.value = currentValue;
}

function renderChipGroup(root, values, currentValue, onSelect) {
  if (!root) return;
  root.innerHTML = "";
  values.forEach((entry) => {
    const option = typeof entry === "string" ? { value: entry, label: entry } : entry;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-chip ${option.value === currentValue ? "active" : ""}`;
    button.setAttribute("aria-pressed", String(option.value === currentValue));
    button.innerHTML = `
      <span>${escapeHtml(option.label || option.value)}</span>
      ${option.count ? `<small>${option.count} cas</small>` : ""}
      ${option.description ? `<em>${escapeHtml(option.description)}</em>` : ""}
    `;
    button.addEventListener("click", () => onSelect(option.value));
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
        Choisissez un métier, lancez une recherche ou affinez l'arborescence pour afficher les cas d'usage.
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
    const model = getModelAdvice(item);
    const risk = getRiskLevel(item);
    const card = document.createElement("button");
    card.type = "button";
    card.className = `case-tool-card ${item.id === state.selectedId ? "selected" : ""}`;
    card.innerHTML = `
      <span>${escapeHtml(getMetier(item))} · ${escapeHtml(getActivity(item))}</span>
      <strong>${escapeHtml(item.tache)}</strong>
      <p>${escapeHtml(item.sortie)}</p>
      <div class="case-card-meta">
        <small class="risk-${normalizeRisk(risk)}">Risque ${escapeHtml(risk)}</small>
        <small>${escapeHtml(model.principal)}</small>
        <small>${getMonthlyGainLabel(item)}</small>
      </div>
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
    nodes.detail.innerHTML = `
      <div class="case-start-guide">
        <strong>Sélectionnez un cas pour ouvrir la fiche.</strong>
        <p>Chaque fiche indique le modèle conseillé, le niveau de vigilance, les contrôles à faire et le gain estimé.</p>
        <dl>
          <div><dt>Raisonnement complexe</dt><dd>GPT-5.5</dd></div>
          <div><dt>Rédaction longue</dt><dd>Claude Opus 4.7</dd></div>
          <div><dt>PDF et corpus longs</dt><dd>Gemini 3.1 Pro</dd></div>
          <div><dt>Déploiement maîtrisé</dt><dd>Mistral Large 3</dd></div>
        </dl>
      </div>
    `;
    return;
  }

  const model = getModelAdvice(item);
  const risk = getRiskLevel(item);
  const references = getReferences(item);

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
      <p><strong>${escapeHtml(model.principal)}</strong> en premier choix, ${escapeHtml(model.alternative)} en alternative.</p>
      <p>${escapeHtml(model.usage)}</p>
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
    item.metier,
    item.activite,
    item.situation,
    item.categorie,
    item.domaine,
    item.entree,
    item.sortie,
    item.utilisation,
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
  if (domain.includes("vente") || domain.includes("commercial")) return "Vente / Commercial";
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
  if (item.modele_recommande) return item.modele_recommande;
  return DEFAULT_MODEL_BY_METIER[getMetier(item)] || {
    principal: "GPT-5.5",
    alternative: "Claude Opus 4.7",
    usage: "Analyse et rédaction généraliste avec validation humaine.",
  };
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

function renderFilterHint() {
  if (!nodes.filterHint) return;

  if (!hasActiveExploration()) {
    nodes.filterHint.textContent = "Choisissez un métier ou utilisez la recherche pour afficher les cas d'usage.";
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
