const REGISTER_DATA_URL = "/outils-ia/data/registre-use-cases.json";
const REGISTER_STORAGE_KEY = "charlesberthou-ai-register-v1";
const ALL_DEPARTMENTS = "Tous";
const REGISTER_PAGE_SIZE = 8;

const registerState = {
  sourceCases: [],
  register: [],
  query: "",
  department: ALL_DEPARTMENTS,
  risk: ALL_DEPARTMENTS,
  maturity: ALL_DEPARTMENTS,
  impact: ALL_DEPARTMENTS,
  visibleLimit: REGISTER_PAGE_SIZE,
};

const registerNodes = {
  search: document.querySelector("#registerSearch"),
  departmentFilters: document.querySelector("#registerDepartmentFilters"),
  riskFilters: document.querySelector("#registerRiskFilters"),
  maturityFilters: document.querySelector("#registerMaturityFilters"),
  impactFilters: document.querySelector("#registerImpactFilters"),
  sourceList: document.querySelector("#sourceCaseList"),
  sourceCount: document.querySelector("#sourceCount"),
  loadMoreRow: document.querySelector("#registerLoadMoreRow"),
  loadMore: document.querySelector("#registerLoadMore"),
  registerList: document.querySelector("#registerList"),
  registerCount: document.querySelector("#registerCount"),
  highRiskCount: document.querySelector("#highRiskCount"),
  activeCount: document.querySelector("#reviewCount"),
  readiness: document.querySelector("#registerReadiness"),
  exportButton: document.querySelector("#exportRegister"),
  seedButton: document.querySelector("#seedRegister"),
};

const statusOptions = ["idée", "à tester", "en pilote", "validé", "suspendu"];
const riskOptions = ["faible", "moyen", "élevé"];
const dataTypeOptions = ["", "données publiques", "données internes", "données confidentielles", "données personnelles", "données sensibles"];

initRegisterTool();

async function initRegisterTool() {
  if (!document.querySelector("[data-register-tool]")) return;

  registerState.register = loadRegister();
  bindRegisterEvents();
  renderRegister();

  try {
    const response = await fetch(REGISTER_DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("registre source introuvable");
    const payload = await response.json();
    registerState.sourceCases = payload.useCases || [];
    renderRegisterFilters();
    renderSourceCases();
  } catch (error) {
    registerNodes.sourceCount.textContent = "0 cas";
    registerNodes.seedButton.disabled = true;
    registerNodes.sourceList.innerHTML = `<p class="empty-state">La bibliothèque de départ n'a pas pu être chargée.</p>`;
  }
}

function bindRegisterEvents() {
  registerNodes.search.addEventListener("input", () => {
    registerState.query = registerNodes.search.value;
    resetSourceExplorer();
    renderSourceCases();
  });

  registerNodes.loadMore?.addEventListener("click", () => {
    registerState.visibleLimit += REGISTER_PAGE_SIZE;
    renderSourceCases();
  });

  registerNodes.exportButton.addEventListener("click", exportRegisterCsv);
  registerNodes.seedButton.addEventListener("click", seedRegister);
}

function renderRegisterFilters() {
  renderChipGroup(
    registerNodes.departmentFilters,
    [ALL_DEPARTMENTS, ...unique(registerState.sourceCases.map((item) => item.department))],
    registerState.department,
    (value) => {
      registerState.department = value;
      resetSourceExplorer();
      renderRegisterFilters();
      renderSourceCases();
    }
  );

  renderChipGroup(
    registerNodes.riskFilters,
    [ALL_DEPARTMENTS, ...sortRiskValues(unique(registerState.sourceCases.map((item) => item.riskLevel)))],
    registerState.risk,
    (value) => {
      registerState.risk = value;
      resetSourceExplorer();
      renderRegisterFilters();
      renderSourceCases();
    }
  );

  renderChipGroup(
    registerNodes.maturityFilters,
    [ALL_DEPARTMENTS, ...unique(registerState.sourceCases.map((item) => item.maturity))],
    registerState.maturity,
    (value) => {
      registerState.maturity = value;
      resetSourceExplorer();
      renderRegisterFilters();
      renderSourceCases();
    }
  );

  renderChipGroup(
    registerNodes.impactFilters,
    [ALL_DEPARTMENTS, ...unique(registerState.sourceCases.map((item) => item.impact))],
    registerState.impact,
    (value) => {
      registerState.impact = value;
      resetSourceExplorer();
      renderRegisterFilters();
      renderSourceCases();
    }
  );
}

function renderChipGroup(root, values, currentValue, onSelect) {
  if (!root) return;

  if (root.tagName === "SELECT") {
    root.innerHTML = values.map((value) => (
      `<option value="${escapeHtml(value)}" ${value === currentValue ? "selected" : ""}>${escapeHtml(value)}</option>`
    )).join("");
    root.onchange = () => onSelect(root.value);
    return;
  }

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

function renderSourceCases() {
  registerNodes.sourceList.innerHTML = "";

  if (!hasActiveSourceFilters()) {
    registerNodes.sourceCount.textContent = "Choisissez un filtre";
    registerNodes.sourceList.innerHTML = `
      <div class="explorer-start">
        <strong>Filtrez avant d'ajouter.</strong>
        <p>Commencez par un domaine, un niveau de risque ou un mot-clé pour afficher uniquement les usages à documenter.</p>
      </div>
    `;
    toggleRegisterLoadMore(0, 0);
    return;
  }

  const cases = getFilteredSourceCases();
  const displayedCases = cases.slice(0, registerState.visibleLimit);
  registerNodes.sourceCount.textContent = `${cases.length} cas`;

  if (cases.length === 0) {
    registerNodes.sourceList.innerHTML = `<p class="empty-state">Aucun cas ne correspond à cette recherche.</p>`;
    toggleRegisterLoadMore(0, 0);
    return;
  }

  displayedCases.forEach((item) => {
    const inRegister = registerState.register.some((entry) => entry.id === item.id);
    const card = document.createElement("article");
    card.className = "source-case-card";
    card.innerHTML = `
      <div>
        <span>${escapeHtml(item.department)} · ${escapeHtml(item.category)}</span>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.summary)}</p>
        <div class="tag-row compact-tags">
          <span class="tag">Risque ${escapeHtml(item.riskLevel)}</span>
          <span class="tag">${escapeHtml(item.maturity)}</span>
          <span class="tag">Impact ${escapeHtml(item.impact)}</span>
        </div>
      </div>
      <button class="button ${inRegister ? "secondary" : ""}" type="button" aria-label="${inRegister ? "Cas déjà ajouté" : `Ajouter ${escapeHtml(item.title)} au registre`}" ${inRegister ? "disabled" : ""}>
        ${inRegister ? "Ajouté" : "Ajouter"}
      </button>
    `;
    card.querySelector("button").addEventListener("click", () => addToRegister(item));
    registerNodes.sourceList.appendChild(card);
  });

  toggleRegisterLoadMore(displayedCases.length, cases.length);
}

function renderRegister() {
  const items = registerState.register;
  registerNodes.registerCount.textContent = items.length;
  registerNodes.highRiskCount.textContent = items.filter((item) => isHighRisk(item.riskLevel)).length;
  registerNodes.activeCount.textContent = items.filter((item) => item.status && item.status !== "suspendu").length;
  registerNodes.exportButton.disabled = items.length === 0;

  renderReadiness();
  registerNodes.registerList.innerHTML = "";

  if (items.length === 0) {
    registerNodes.registerList.innerHTML = `
      <article class="register-example-card" aria-label="Exemple de ligne de registre">
        <div class="register-card-head">
          <div>
            <span>Support client · Synthèse</span>
            <strong>Exemple : synthèse de tickets clients</strong>
          </div>
          <em>exemple</em>
        </div>
        <div class="register-item-metrics">
          <span><strong>Données internes</strong> données</span>
          <span><strong>Responsable support</strong> responsable</span>
          <span><strong>à tester</strong> statut</span>
        </div>
        <p>Cette ligne illustre le niveau d'information attendu. Elle n'est pas exportée tant qu'aucun cas réel n'est ajouté.</p>
      </article>
    `;
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "register-item-card";
    card.innerHTML = `
      <div class="register-card-head">
        <div>
          <span>${escapeHtml(item.department)} · ${escapeHtml(item.category || "usage IA")}</span>
          <strong>${escapeHtml(item.title)}</strong>
        </div>
        <button class="danger-button compact-button" type="button" data-remove="${escapeHtml(item.id)}" aria-label="Supprimer ${escapeHtml(item.title)} du registre">Supprimer</button>
      </div>
      <div class="tag-row compact-tags">
        ${item.maturity ? `<span class="tag">${escapeHtml(item.maturity)}</span>` : ""}
        ${item.impact ? `<span class="tag">Impact ${escapeHtml(item.impact)}</span>` : ""}
        ${item.recommendedTool ? `<span class="tag">${escapeHtml(item.recommendedTool)}</span>` : ""}
      </div>
      <div class="register-item-metrics">
        <span><strong>${escapeHtml(item.status)}</strong> statut</span>
        <span><strong data-risk-display="${escapeHtml(item.id)}">${escapeHtml(item.riskLevel)}</strong> risque</span>
        <span><strong data-next-action="${escapeHtml(item.id)}">${escapeHtml(getNextAction(item))}</strong> prochaine action</span>
      </div>
      <div class="register-form-grid">
        ${textareaField(item, "purpose", "Usage / objectif", "Ex. synthétiser les tickets pour préparer la réponse support")}
        ${selectField(item, "dataType", "Données", dataTypeOptions, "À préciser")}
        ${inputField(item, "businessOwner", "Responsable", "Nom, rôle ou équipe")}
        ${selectField(item, "riskLevel", "Risque", riskOptions)}
        ${selectField(item, "status", "Statut", statusOptions)}
      </div>
    `;
    card.addEventListener("input", handleRegisterInput);
    card.addEventListener("change", handleRegisterInput);
    card.querySelector("[data-remove]").addEventListener("click", () => removeFromRegister(item.id));
    registerNodes.registerList.appendChild(card);
  });
}

function renderReadiness() {
  const count = registerState.register.length;
  const highRisk = registerState.register.filter((item) => isHighRisk(item.riskLevel)).length;

  if (count === 0) {
    registerNodes.readiness.innerHTML = `<strong>Premier pas</strong><span>Ajoutez deux ou trois usages pour commencer à voir les objectifs, données, responsables, risques et statuts à suivre.</span>`;
    return;
  }

  if (count < 3) {
    registerNodes.readiness.innerHTML = `<strong>Registre encore léger</strong><span>Ajoutez encore ${3 - count} usage${count === 2 ? "" : "s"} pour obtenir une lecture plus solide.</span>`;
    return;
  }

  registerNodes.readiness.innerHTML = `<strong>Registre exploitable</strong><span>${count} usages suivis, dont ${highRisk} à risque élevé. La prochaine étape consiste à clarifier les responsables et vérifier les données.</span>`;
}

function selectField(item, key, label, options, emptyLabel = "") {
  return `
    <label class="form-row compact">
      <span>${label}</span>
      <select data-id="${escapeHtml(item.id)}" data-field="${key}">
        ${options.map((option) => `<option value="${escapeHtml(option)}" ${String(item[key] || "") === option ? "selected" : ""}>${escapeHtml(option || emptyLabel)}</option>`).join("")}
      </select>
    </label>
  `;
}

function inputField(item, key, label, placeholder, type = "text") {
  return `
    <label class="form-row compact">
      <span>${label}</span>
      <input type="${type}" value="${escapeHtml(item[key] || "")}" placeholder="${escapeHtml(placeholder)}" data-id="${escapeHtml(item.id)}" data-field="${key}" />
    </label>
  `;
}

function textareaField(item, key, label, placeholder) {
  return `
    <label class="form-row compact wide-field">
      <span>${label}</span>
      <textarea rows="2" placeholder="${escapeHtml(placeholder)}" data-id="${escapeHtml(item.id)}" data-field="${key}">${escapeHtml(item[key] || "")}</textarea>
    </label>
  `;
}

function handleRegisterInput(event) {
  const target = event.target;
  const id = target.dataset.id;
  const field = target.dataset.field;
  if (!id || !field) return;
  updateRegisterItem(id, { [field]: target.value });
}

function addToRegister(item) {
  if (registerState.register.some((entry) => entry.id === item.id)) return;
  registerState.register = [...registerState.register, createRegisterEntry(item)];
  saveRegister();
  renderSourceCases();
  renderRegister();
}

function removeFromRegister(id) {
  registerState.register = registerState.register.filter((item) => item.id !== id);
  saveRegister();
  renderSourceCases();
  renderRegister();
}

function updateRegisterItem(id, updates) {
  registerState.register = registerState.register.map((item) => item.id === id ? { ...item, ...updates } : item);
  saveRegister();
  renderReadiness();
  registerNodes.highRiskCount.textContent = registerState.register.filter((item) => isHighRisk(item.riskLevel)).length;
  registerNodes.activeCount.textContent = registerState.register.filter((item) => item.status && item.status !== "suspendu").length;
  updateInlineMetrics(id);
}

function createRegisterEntry(item) {
  return {
    id: item.id,
    title: item.title,
    department: item.department,
    category: item.category,
    maturity: item.maturity,
    impact: item.impact,
    difficulty: item.difficulty,
    recommendedTool: item.recommendedTool,
    riskLevel: item.riskLevel || "moyen",
    status: "idée",
    purpose: item.summary || "",
    dataType: "",
    businessOwner: "",
    gainMin: item.gainMin,
    timeBeforeMin: item.timeBeforeMin,
    timeAfterMin: item.timeAfterMin,
    monthlyFrequency: item.monthlyFrequency,
    kpi: item.kpi,
    addedAt: new Date().toISOString().slice(0, 10),
  };
}

function seedRegister() {
  const seedIds = ["support-ticket-summary", "sales-lead-qualification", "hr-candidate-screening", "finance-invoice-control"];
  const byId = new Map(registerState.register.map((item) => [item.id, item]));
  seedIds
    .map((id) => registerState.sourceCases.find((item) => item.id === id))
    .filter(Boolean)
    .forEach((item) => {
      if (!byId.has(item.id)) byId.set(item.id, createRegisterEntry(item));
    });
  registerState.register = Array.from(byId.values());
  saveRegister();
  renderSourceCases();
  renderRegister();
}

function getFilteredSourceCases() {
  const query = normalize(registerState.query);
  return registerState.sourceCases
    .filter((item) => registerState.department === ALL_DEPARTMENTS || item.department === registerState.department)
    .filter((item) => registerState.risk === ALL_DEPARTMENTS || item.riskLevel === registerState.risk)
    .filter((item) => registerState.maturity === ALL_DEPARTMENTS || item.maturity === registerState.maturity)
    .filter((item) => registerState.impact === ALL_DEPARTMENTS || item.impact === registerState.impact)
    .filter((item) => {
      if (!query) return true;
      const haystack = normalize([
        item.title,
        item.department,
        item.category,
        item.maturity,
        item.impact,
        item.riskLevel,
        item.summary,
        item.kpi,
        item.recommendedTool,
      ].join(" "));
      return query.split(/\s+/).every((term) => haystack.includes(term));
    })
    .sort((a, b) => sourcePriority(b) - sourcePriority(a));
}

function sourcePriority(item) {
  return (riskWeight(item.riskLevel) * 100000) + (impactWeight(item.impact) * 10000) + ((Number(item.monthlyFrequency) || 0) * (Number(item.gainMin) || 0));
}

function hasActiveSourceFilters() {
  return Boolean(
    registerState.query.trim()
    || registerState.department !== ALL_DEPARTMENTS
    || registerState.risk !== ALL_DEPARTMENTS
    || registerState.maturity !== ALL_DEPARTMENTS
    || registerState.impact !== ALL_DEPARTMENTS
  );
}

function resetSourceExplorer() {
  registerState.visibleLimit = REGISTER_PAGE_SIZE;
}

function toggleRegisterLoadMore(visibleCount, totalCount) {
  if (!registerNodes.loadMoreRow || !registerNodes.loadMore) return;
  const remaining = totalCount - visibleCount;
  registerNodes.loadMoreRow.toggleAttribute("hidden", remaining <= 0);
  if (remaining > 0) {
    registerNodes.loadMore.textContent = `Afficher ${Math.min(REGISTER_PAGE_SIZE, remaining)} cas de plus`;
  }
}

function getNextAction(item) {
  if (!item.businessOwner) return "nommer un responsable";
  if (!item.dataType) return "qualifier les données";
  if (!item.purpose) return "préciser l'objectif";
  if (!item.status || item.status === "idée") return "choisir un statut";
  return "suivre le statut";
}

function loadRegister() {
  try {
    const raw = localStorage.getItem(REGISTER_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveRegister() {
  try {
    localStorage.setItem(REGISTER_STORAGE_KEY, JSON.stringify(registerState.register));
  } catch (error) {
    registerNodes.readiness.innerHTML = `<strong>Stockage local indisponible</strong><span>Le navigateur bloque l'enregistrement local. Exportez le registre avant de quitter la page.</span>`;
  }
}

function exportRegisterCsv() {
  if (registerState.register.length === 0) return;

  const headers = [
    "usage",
    "objectif",
    "donnees",
    "responsable",
    "risque",
    "statut",
    "date_ajout",
  ];
  const rows = registerState.register.map((item) => [
    item.title,
    item.purpose,
    item.dataType,
    item.businessOwner,
    item.riskLevel,
    item.status,
    item.addedAt,
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `registre-ia-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function updateInlineMetrics(id) {
  const item = registerState.register.find((entry) => entry.id === id);
  if (!item) return;
  registerNodes.registerList.querySelectorAll("[data-risk-display]").forEach((node) => {
    if (node.dataset.riskDisplay === id) node.textContent = item.riskLevel;
  });
  registerNodes.registerList.querySelectorAll("[data-next-action]").forEach((node) => {
    if (node.dataset.nextAction === id) node.textContent = getNextAction(item);
  });
}

function riskWeight(value) {
  const normalized = normalize(value);
  if (normalized.includes("eleve")) return 3;
  if (normalized.includes("moyen")) return 2;
  return 1;
}

function impactWeight(value) {
  const normalized = normalize(value);
  if (normalized.includes("eleve")) return 3;
  if (normalized.includes("moyen")) return 2;
  return 1;
}

function isHighRisk(value) {
  return riskWeight(value) >= 3;
}

function sortRiskValues(values) {
  return values.sort((a, b) => riskWeight(a) - riskWeight(b));
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "fr"));
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
