const STORAGE_KEY = "atelier_ia_usage_register_v1";
let items = [];

const form = document.getElementById("usageForm");
const fields = ["usageId", "usageTitle", "toolName", "purpose", "dataType", "riskLevel", "status", "precaution", "owner"].reduce((acc, id) => {
  acc[id] = document.getElementById(id);
  return acc;
}, {});

function nowDate() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function load() {
  try {
    items = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch (error) {
    items = [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function resetForm() {
  form.reset();
  fields.usageId.value = "";
  document.getElementById("saveUsage").textContent = "Ajouter l'usage";
}

function getFiltered() {
  const status = document.getElementById("statusFilter").value;
  const risk = document.getElementById("riskFilter").value;
  return items.filter((item) => (status === "Tous" || item.status === status) && (risk === "Tous" || item.riskLevel === risk));
}

function renderSummary() {
  const used = items.filter((item) => item.status === "utilisé").length;
  const high = items.filter((item) => item.riskLevel === "élevé").length;
  document.getElementById("registerSummary").innerHTML = `
    <article class="summary-card"><span>Total</span><strong>${items.length}</strong></article>
    <article class="summary-card"><span>Utilisés</span><strong>${used}</strong></article>
    <article class="summary-card"><span>Risque élevé</span><strong>${high}</strong></article>
    <article class="summary-card"><span>Mis à jour</span><strong>${nowDate().split("-").reverse().join("/")}</strong></article>
  `;
}

function riskClass(value) {
  if (value === "faible") return "risk-low";
  if (value === "moyen") return "risk-medium";
  return "risk-high";
}

function renderRows() {
  const rows = getFiltered();
  const body = document.getElementById("registerRows");
  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="9">Aucun usage à afficher.</td></tr>';
    return;
  }
  body.innerHTML = rows.map((item) => `
    <tr>
      <td><strong>${escapeHtml(item.usage)}</strong></td>
      <td>${escapeHtml(item.tool)}</td>
      <td>${escapeHtml(item.purpose)}</td>
      <td class="${riskClass(item.riskLevel)}">${escapeHtml(item.riskLevel)}</td>
      <td>${escapeHtml(item.status)}</td>
      <td>${escapeHtml(item.precaution)}</td>
      <td>${escapeHtml(item.owner)}</td>
      <td>Création : ${escapeHtml(item.createdAt)}<br>Mise à jour : ${escapeHtml(item.updatedAt)}</td>
      <td><div class="action-buttons"><button class="icon-button" type="button" data-edit="${item.id}">Modifier</button><button class="icon-button danger" type="button" data-delete="${item.id}">Supprimer</button></div></td>
    </tr>
  `).join("");

  body.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => editItem(button.dataset.edit)));
  body.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => deleteItem(button.dataset.delete)));
}

function render() {
  renderSummary();
  renderRows();
}

function submit(event) {
  event.preventDefault();
  const id = fields.usageId.value || String(Date.now());
  const existing = items.find((item) => item.id === id);
  const record = {
    id,
    usage: fields.usageTitle.value.trim(),
    tool: fields.toolName.value.trim(),
    purpose: fields.purpose.value.trim(),
    dataType: fields.dataType.value.trim(),
    riskLevel: fields.riskLevel.value,
    status: fields.status.value,
    precaution: fields.precaution.value.trim(),
    owner: fields.owner.value.trim(),
    createdAt: existing ? existing.createdAt : nowDate(),
    updatedAt: nowDate()
  };
  if (!record.usage) return;
  items = existing ? items.map((item) => item.id === id ? record : item) : [record, ...items];
  save();
  resetForm();
  render();
}

function editItem(id) {
  const item = items.find((entry) => entry.id === id);
  if (!item) return;
  fields.usageId.value = item.id;
  fields.usageTitle.value = item.usage;
  fields.toolName.value = item.tool;
  fields.purpose.value = item.purpose;
  fields.dataType.value = item.dataType;
  fields.riskLevel.value = item.riskLevel;
  fields.status.value = item.status;
  fields.precaution.value = item.precaution;
  fields.owner.value = item.owner;
  document.getElementById("saveUsage").textContent = "Enregistrer les modifications";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteItem(id) {
  const item = items.find((entry) => entry.id === id);
  if (!item) return;
  if (!window.confirm("Supprimer cet usage IA ?")) return;
  items = items.filter((entry) => entry.id !== id);
  save();
  render();
}

function csvValue(value) {
  return `"${String(value || "").replace(/\r?\n/g, " ").replace(/"/g, '""')}"`;
}

function exportCsv() {
  const columns = ["usage", "outil utilisé", "objectif", "type de données utilisées", "niveau de risque", "statut", "précaution à prévoir", "responsable ou utilisateur", "date de création", "date de mise à jour"];
  const rows = [columns, ...items.map((item) => [item.usage, item.tool, item.purpose, item.dataType, item.riskLevel, item.status, item.precaution, item.owner, item.createdAt, item.updatedAt])];
  const csv = rows.map((row) => row.map(csvValue).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `usages-ia-${nowDate()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

form.addEventListener("submit", submit);
document.getElementById("cancelEdit").addEventListener("click", resetForm);
document.getElementById("statusFilter").addEventListener("change", renderRows);
document.getElementById("riskFilter").addEventListener("change", renderRows);
document.getElementById("exportCsv").addEventListener("click", exportCsv);
load();
render();
