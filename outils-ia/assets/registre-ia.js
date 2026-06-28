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
  manualForm: document.querySelector("#registerManualForm"),
  manualUsage: document.querySelector("#registerUsage"),
  manualObjective: document.querySelector("#registerObjective"),
  manualData: document.querySelector("#registerData"),
  manualOwner: document.querySelector("#registerOwner"),
  manualRisk: document.querySelector("#registerRisk"),
  manualStatus: document.querySelector("#registerStatus"),
  registerCount: document.querySelector("#registerCount"),
  highRiskCount: document.querySelector("#highRiskCount"),
  activeCount: document.querySelector("#reviewCount"),
  heroStats: document.querySelector("#registerStats"),
  heroEmpty: document.querySelector("#registerEmptyHero"),
  readiness: document.querySelector("#registerReadiness"),
  exportButton: document.querySelector("#exportRegister"),
  sourcePanel: document.querySelector("#registerSourcePanel"),
};

const statusOptions = ["à tester", "actif", "archivé"];
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
    registerNodes.sourceList.innerHTML = `<p class="empty-state">La bibliothèque de départ n'a pas pu être chargée.</p>`;
  }
}

function bindRegisterEvents() {
  registerNodes.manualForm?.addEventListener("submit", addManualRegisterEntry);

  registerNodes.search?.addEventListener("input", () => {
    registerState.query = registerNodes.search.value;
    resetSourceExplorer();
    renderSourceCases();
  });

  registerNodes.loadMore?.addEventListener("click", () => {
    registerState.visibleLimit += REGISTER_PAGE_SIZE;
    renderSourceCases();
  });

  registerNodes.exportButton?.addEventListener("click", exportRegisterCsv);
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
      `<option value="${escapeHtml(value)}" ${value === currentValue ? "selected" : ""}>${escapeHtml(formatValueLabel(value))}</option>`
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
    registerNodes.sourceCount.textContent = "0 cas affiché";
    registerNodes.sourceList.innerHTML = `
      <div class="explorer-start">
        <strong>Filtrez si besoin.</strong>
        <p>Ce bloc est secondaire : le formulaire ci-dessus suffit pour ajouter un usage réel.</p>
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
          <span class="tag">${escapeHtml(formatRisk(item.riskLevel))}</span>
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
  const realItems = getRealRegisterItems();
  registerNodes.registerCount.textContent = realItems.length;
  registerNodes.highRiskCount.textContent = realItems.filter((item) => isHighRisk(item.riskLevel)).length;
  registerNodes.activeCount.textContent = realItems.filter((item) => isActiveStatus(item.status)).length;
  syncExportButton(realItems.length);
  registerNodes.heroStats.hidden = realItems.length === 0;
  registerNodes.heroEmpty.hidden = realItems.length > 0;
  registerNodes.sourcePanel.hidden = realItems.length === 0;

  renderReadiness();
  registerNodes.registerList.innerHTML = "";

  if (items.length === 0) {
    registerNodes.registerList.innerHTML = `<p class="empty-state">Aucun usage ajouté pour l'instant.</p>`;
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
        <div class="register-card-actions">
          <span class="status-pill status-${normalizeStatus(item.status)}" data-status-pill="${escapeHtml(item.id)}">${escapeHtml(formatStatus(item.status))}</span>
        </div>
      </div>
      <div class="register-summary-grid">
        <div><span>Usage</span><p>${escapeHtml(item.title)}</p></div>
        <div><span>Données</span><p data-data-display="${escapeHtml(item.id)}">${escapeHtml(item.dataType || "à préciser")}</p></div>
        <div><span>Responsable</span><p data-owner-display="${escapeHtml(item.id)}">${escapeHtml(item.businessOwner || "à nommer")}</p></div>
        <div><span>Risque</span><p data-risk-display="${escapeHtml(item.id)}">${escapeHtml(formatRisk(item.riskLevel))}</p></div>
        <div><span>Statut</span><p data-status-display="${escapeHtml(item.id)}">${escapeHtml(formatStatus(item.status))}</p></div>
      </div>
      <div class="register-form-grid">
        ${textareaField(item, "purpose", "Objectif", "Ex. synthétiser les tickets pour préparer la réponse support")}
        ${inputField(item, "dataType", "Données", "Ex. tickets, CRM, documents internes")}
        ${inputField(item, "businessOwner", "Responsable", "Nom, rôle ou équipe")}
        ${selectField(item, "riskLevel", "Risque", riskOptions)}
        ${selectField(item, "status", "Statut", statusOptions)}
      </div>
      <div class="register-card-footer">
        <button class="danger-button compact-button" type="button" data-remove="${escapeHtml(item.id)}" aria-label="Supprimer ${escapeHtml(item.title)} du registre">Supprimer</button>
      </div>
    `;
    card.addEventListener("input", handleRegisterInput);
    card.addEventListener("change", handleRegisterInput);
    card.querySelector("[data-remove]").addEventListener("click", () => removeFromRegister(item.id));
    registerNodes.registerList.appendChild(card);
  });
}

function renderReadiness() {
  const realItems = getRealRegisterItems();
  const count = realItems.length;
  const highRisk = realItems.filter((item) => isHighRisk(item.riskLevel)).length;

  if (count === 0) {
    registerNodes.readiness.innerHTML = `<strong>Premier usage à ajouter</strong><span>Renseignez usage, objectif, données, responsable, risque et statut pour commencer le registre.</span>`;
    return;
  }

  if (count < 3) {
    registerNodes.readiness.innerHTML = `<strong>Registre encore léger</strong><span>Ajoutez encore ${3 - count} usage${count === 2 ? "" : "s"} pour obtenir une lecture plus solide.</span>`;
    return;
  }

  registerNodes.readiness.innerHTML = `<strong>Registre exploitable</strong><span>${count} usages suivis, dont ${highRisk} risque Élevé. La prochaine étape consiste à clarifier les responsables et vérifier les données.</span>`;
}

function addManualRegisterEntry(event) {
  event.preventDefault();
  const title = registerNodes.manualUsage.value.trim();
  const purpose = registerNodes.manualObjective.value.trim();
  if (!title || !purpose) return;

  registerState.register = [
    createManualEntry({
      title,
      purpose,
      dataType: registerNodes.manualData.value.trim(),
      businessOwner: registerNodes.manualOwner.value.trim(),
      riskLevel: registerNodes.manualRisk.value,
      status: registerNodes.manualStatus.value,
    }),
    ...registerState.register,
  ];
  saveRegister();
  registerNodes.manualForm.reset();
  registerNodes.manualRisk.value = "moyen";
  registerNodes.manualStatus.value = "à tester";
  renderSourceCases();
  renderRegister();
}

function selectField(item, key, label, options, emptyLabel = "") {
  return `
    <label class="form-row compact">
      <span>${label}</span>
      <select data-id="${escapeHtml(item.id)}" data-field="${key}">
        ${options.map((option) => `<option value="${escapeHtml(option)}" ${String(item[key] || "") === option ? "selected" : ""}>${escapeHtml(formatOptionLabel(key, option || emptyLabel))}</option>`).join("")}
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
  const realItems = getRealRegisterItems();
  renderReadiness();
  registerNodes.highRiskCount.textContent = realItems.filter((item) => isHighRisk(item.riskLevel)).length;
  registerNodes.activeCount.textContent = realItems.filter((item) => isActiveStatus(item.status)).length;
  syncExportButton(realItems.length);
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
    status: "à tester",
    purpose: item.summary || "",
    dataType: "",
    businessOwner: "",
    isExample: false,
    gainMin: item.gainMin,
    timeBeforeMin: item.timeBeforeMin,
    timeAfterMin: item.timeAfterMin,
    monthlyFrequency: item.monthlyFrequency,
    kpi: item.kpi,
    addedAt: new Date().toISOString().slice(0, 10),
  };
}

function createManualEntry(values) {
  return {
    id: `usage-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    title: values.title,
    department: "Usage interne",
    category: "registre",
    maturity: "",
    impact: "",
    difficulty: "",
    recommendedTool: "",
    riskLevel: values.riskLevel || "moyen",
    status: values.status || "à tester",
    purpose: values.purpose || "",
    dataType: values.dataType || "",
    businessOwner: values.businessOwner || "",
    isExample: false,
    addedAt: new Date().toISOString().slice(0, 10),
  };
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
  if (!item.status || item.status === "à tester") return "tester le cas";
  return "suivre le statut";
}

function loadRegister() {
  try {
    const raw = localStorage.getItem(REGISTER_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => !item.isExample) : [];
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
  const exportableItems = getRealRegisterItems();
  if (exportableItems.length === 0) {
    syncExportButton(0);
    return;
  }

  const headers = [
    "usage",
    "objectif",
    "donnees",
    "responsable",
    "risque",
    "statut",
    "date_creation",
  ];
  const rows = exportableItems.map((item) => [
    item.title,
    item.purpose,
    item.dataType,
    item.businessOwner,
    formatRisk(item.riskLevel),
    formatStatus(item.status),
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
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function getRealRegisterItems() {
  return registerState.register;
}

function syncExportButton(realItemCount) {
  if (!registerNodes.exportButton) return;
  const isAvailable = realItemCount > 0;
  registerNodes.exportButton.disabled = !isAvailable;
  registerNodes.exportButton.textContent = isAvailable ? "Exporter CSV" : "Export CSV indisponible";
  registerNodes.exportButton.setAttribute("aria-disabled", String(!isAvailable));
  registerNodes.exportButton.classList.toggle("is-disabled", !isAvailable);
  registerNodes.exportButton.title = isAvailable
    ? "Télécharger le registre au format CSV"
    : "Ajoutez un usage pour exporter le CSV";
}

function updateInlineMetrics(id) {
  const item = registerState.register.find((entry) => entry.id === id);
  if (!item) return;
  registerNodes.registerList.querySelectorAll("[data-risk-display]").forEach((node) => {
    if (node.dataset.riskDisplay === id) node.textContent = formatRisk(item.riskLevel);
  });
  registerNodes.registerList.querySelectorAll("[data-next-action]").forEach((node) => {
    if (node.dataset.nextAction === id) node.textContent = getNextAction(item);
  });
  registerNodes.registerList.querySelectorAll("[data-status-display]").forEach((node) => {
    if (node.dataset.statusDisplay === id) node.textContent = formatStatus(item.status);
  });
  registerNodes.registerList.querySelectorAll("[data-data-display]").forEach((node) => {
    if (node.dataset.dataDisplay === id) node.textContent = item.dataType || "à préciser";
  });
  registerNodes.registerList.querySelectorAll("[data-owner-display]").forEach((node) => {
    if (node.dataset.ownerDisplay === id) node.textContent = item.businessOwner || "à nommer";
  });
  registerNodes.registerList.querySelectorAll("[data-status-pill]").forEach((node) => {
    if (node.dataset.statusPill !== id) return;
    node.textContent = formatStatus(item.status);
    node.className = `status-pill status-${normalizeStatus(item.status)}`;
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

function isActiveStatus(value) {
  const normalized = normalize(value);
  return normalized.includes("actif") || normalized.includes("valide") || normalized.includes("pilote");
}

function formatRisk(value) {
  const normalized = normalize(value);
  if (normalized.includes("eleve")) return "Élevé";
  if (normalized.includes("faible")) return "Faible";
  return "Moyen";
}

function formatStatus(value) {
  const normalized = normalize(value);
  if (normalized.includes("actif") || normalized.includes("valide") || normalized.includes("pilote")) return "Actif";
  if (normalized.includes("archive")) return "Archivé";
  return "À tester";
}

function normalizeStatus(value) {
  const normalized = normalize(value);
  if (normalized.includes("actif") || normalized.includes("valide") || normalized.includes("pilote")) return "active";
  if (normalized.includes("archive")) return "archived";
  return "test";
}

function formatOptionLabel(key, value) {
  if (key === "riskLevel") return formatRisk(value);
  if (key === "status") return formatStatus(value);
  return formatValueLabel(value);
}

function formatValueLabel(value) {
  const normalized = normalize(value);
  if (normalized === normalize(ALL_DEPARTMENTS)) return ALL_DEPARTMENTS;
  if (["faible", "moyen", "eleve"].some((risk) => normalized.includes(risk))) return formatRisk(value);
  return value;
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
