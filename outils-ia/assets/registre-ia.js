const REGISTER_DATA_URL = "/outils-ia/data/registre-use-cases.json";
const REGISTER_STORAGE_KEY = "charlesberthou-ai-register-v1";
const ALL_DEPARTMENTS = "Tous";

const registerState = {
  sourceCases: [],
  register: [],
  query: "",
  department: ALL_DEPARTMENTS,
};

const registerNodes = {
  search: document.querySelector("#registerSearch"),
  filters: document.querySelector("#registerDepartmentFilters"),
  sourceList: document.querySelector("#sourceCaseList"),
  sourceCount: document.querySelector("#sourceCount"),
  registerList: document.querySelector("#registerList"),
  registerCount: document.querySelector("#registerCount"),
  highRiskCount: document.querySelector("#highRiskCount"),
  reviewCount: document.querySelector("#reviewCount"),
  readiness: document.querySelector("#registerReadiness"),
  exportButton: document.querySelector("#exportRegister"),
  seedButton: document.querySelector("#seedRegister"),
};

const statusOptions = ["idée", "à tester", "en pilote", "revue interne effectuée", "suspendu"];
const riskOptions = ["faible", "moyen", "élevé"];
const dataTypeOptions = ["", "données publiques", "données internes", "données confidentielles", "données personnelles", "données sensibles"];
const reviewOptions = ["à qualifier", "revue métier effectuée", "revue conformité effectuée", "en revue", "à corriger", "suspendu"];

initRegisterTool();

async function initRegisterTool() {
  if (!document.querySelector("[data-register-tool]")) return;

  try {
    const response = await fetch(REGISTER_DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("registre source introuvable");
    const payload = await response.json();
    registerState.sourceCases = payload.useCases || [];
    registerState.register = loadRegister();
    bindRegisterEvents();
    renderRegisterFilters();
    renderSourceCases();
    renderRegister();
  } catch (error) {
    registerNodes.sourceList.innerHTML = `<p class="empty-state">La bibliothèque de départ n'a pas pu être chargée.</p>`;
  }
}

function bindRegisterEvents() {
  registerNodes.search.addEventListener("input", () => {
    registerState.query = registerNodes.search.value;
    renderSourceCases();
  });

  registerNodes.exportButton.addEventListener("click", exportRegisterCsv);
  registerNodes.seedButton.addEventListener("click", seedRegister);
}

function renderRegisterFilters() {
  const departments = [ALL_DEPARTMENTS, ...unique(registerState.sourceCases.map((item) => item.department))];
  registerNodes.filters.innerHTML = "";
  departments.forEach((department) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-chip ${department === registerState.department ? "active" : ""}`;
    button.textContent = department;
    button.addEventListener("click", () => {
      registerState.department = department;
      renderRegisterFilters();
      renderSourceCases();
    });
    registerNodes.filters.appendChild(button);
  });
}

function renderSourceCases() {
  const cases = getFilteredSourceCases();
  registerNodes.sourceCount.textContent = `${cases.length} cas`;
  registerNodes.sourceList.innerHTML = "";

  if (cases.length === 0) {
    registerNodes.sourceList.innerHTML = `<p class="empty-state">Aucun cas ne correspond à cette recherche.</p>`;
    return;
  }

  cases.forEach((item) => {
    const inRegister = registerState.register.some((entry) => entry.id === item.id);
    const card = document.createElement("article");
    card.className = "source-case-card";
    card.innerHTML = `
      <div>
        <span>${escapeHtml(item.department)} · ${escapeHtml(item.category)}</span>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.summary)}</p>
      </div>
      <button class="button ${inRegister ? "secondary" : ""}" type="button" ${inRegister ? "disabled" : ""}>
        ${inRegister ? "Ajouté" : "Ajouter"}
      </button>
    `;
    card.querySelector("button").addEventListener("click", () => addToRegister(item));
    registerNodes.sourceList.appendChild(card);
  });
}

function renderRegister() {
  const items = registerState.register;
  registerNodes.registerCount.textContent = items.length;
  registerNodes.highRiskCount.textContent = items.filter((item) => item.riskLevel === "élevé").length;
  registerNodes.reviewCount.textContent = items.filter((item) => item.reviewDate).length;
  registerNodes.exportButton.disabled = items.length === 0;

  renderReadiness();
  registerNodes.registerList.innerHTML = "";

  if (items.length === 0) {
    registerNodes.registerList.innerHTML = `
      <p class="empty-state">Le registre est vide. Ajoutez un cas depuis la bibliothèque ou chargez un exemple pour voir la structure.</p>
    `;
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "register-item-card";
    card.innerHTML = `
      <div class="register-card-head">
        <div>
          <span>${escapeHtml(item.department)}</span>
          <strong>${escapeHtml(item.title)}</strong>
        </div>
        <button class="danger-button compact-button" type="button" data-remove="${escapeHtml(item.id)}">Supprimer</button>
      </div>
      <div class="register-item-metrics">
        <span><strong>${formatMinutes(item.gainMin)}</strong> gain / usage</span>
        <span><strong>${escapeHtml(item.riskLevel)}</strong> risque</span>
        <span><strong>${escapeHtml(getNextAction(item))}</strong> prochaine action</span>
      </div>
      <div class="register-form-grid">
        ${selectField(item, "status", "Avancement", statusOptions)}
        ${selectField(item, "riskLevel", "Risque", riskOptions)}
        ${selectField(item, "dataType", "Données", dataTypeOptions, "Non renseigné")}
        ${selectField(item, "validationStatus", "Revue interne", reviewOptions)}
        ${inputField(item, "businessOwner", "Responsable", "Nom ou rôle")}
        ${inputField(item, "reviewDate", "Date de revue", "", "date")}
        ${textareaField(item, "purpose", "Finalité", "Objectif de l'usage et décision à préparer")}
        ${textareaField(item, "impactedPeople", "Personnes impactées", "Clients, collaborateurs, candidats...")}
        ${textareaField(item, "comment", "Note de pilotage", "Point à arbitrer, réserve, prochain test")}
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
  const highRisk = registerState.register.filter((item) => item.riskLevel === "élevé").length;

  if (count === 0) {
    registerNodes.readiness.innerHTML = `<strong>Premier pas</strong><span>Ajoutez deux ou trois usages pour commencer à voir les risques, gains et revues à organiser.</span>`;
    return;
  }

  if (count < 3) {
    registerNodes.readiness.innerHTML = `<strong>Registre encore léger</strong><span>Ajoutez encore ${3 - count} usage${count === 2 ? "" : "s"} pour obtenir une lecture plus solide.</span>`;
    return;
  }

  registerNodes.readiness.innerHTML = `<strong>Registre exploitable</strong><span>${count} usages suivis, dont ${highRisk} à risque élevé. La prochaine étape consiste à planifier les revues et vérifier les données.</span>`;
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
  registerNodes.highRiskCount.textContent = registerState.register.filter((item) => item.riskLevel === "élevé").length;
  registerNodes.reviewCount.textContent = registerState.register.filter((item) => item.reviewDate).length;
}

function createRegisterEntry(item) {
  return {
    id: item.id,
    title: item.title,
    department: item.department,
    category: item.category,
    recommendedTool: item.recommendedTool,
    riskLevel: item.riskLevel || "moyen",
    status: "idée",
    purpose: item.summary || "",
    dataType: "",
    impactedPeople: "",
    businessOwner: "",
    validationStatus: "à qualifier",
    reviewDate: "",
    comment: "",
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
    .filter((item) => {
      if (!query) return true;
      const haystack = normalize([item.title, item.department, item.category, item.summary, item.kpi].join(" "));
      return query.split(/\s+/).every((term) => haystack.includes(term));
    });
}

function getNextAction(item) {
  if (!item.businessOwner) return "nommer un responsable";
  if (!item.dataType) return "qualifier les données";
  if (!item.validationStatus || item.validationStatus === "à qualifier") return "prévoir une revue";
  if (!item.reviewDate) return "fixer une date";
  return "arbitrer la suite";
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
  localStorage.setItem(REGISTER_STORAGE_KEY, JSON.stringify(registerState.register));
}

function exportRegisterCsv() {
  const headers = ["titre", "domaine", "outil", "risque", "avancement", "finalite", "donnees", "responsable", "revue", "date_revue", "note"];
  const rows = registerState.register.map((item) => [
    item.title,
    item.department,
    item.recommendedTool,
    item.riskLevel,
    item.status,
    item.purpose,
    item.dataType,
    item.businessOwner,
    item.validationStatus,
    item.reviewDate,
    item.comment,
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\n");
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
