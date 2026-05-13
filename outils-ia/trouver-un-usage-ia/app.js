const state = { cases: [], selectedId: null, domain: "Tous" };
const domains = ["Tous", "Administration", "Communication", "Ressources humaines", "Gestion de projet", "Enseignement et formation", "Commerce", "Indépendants et petites structures", "Vie quotidienne"];

const searchInput = document.getElementById("usageSearch");
const domainTabs = document.getElementById("domainTabs");
const usageResults = document.getElementById("usageResults");
const usageDetail = document.getElementById("usageDetail");
const calcFrequency = document.getElementById("calcFrequency");
const calcBefore = document.getElementById("calcBefore");
const calcAfter = document.getElementById("calcAfter");
const monthlyGain = document.getElementById("monthlyGain");
const annualGain = document.getElementById("annualGain");

function normalize(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMinutes(minutes) {
  const rounded = Math.max(0, Math.round(Number(minutes) || 0));
  if (rounded < 60) return `${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

async function init() {
  const response = await fetch("cas_usage.json", { cache: "no-store" });
  const payload = await response.json();
  state.cases = payload.fiches || [];
  state.selectedId = state.cases[0]?.id || null;
  renderDomains();
  renderResults();
  renderDetail();
  bind();
}

function bind() {
  searchInput.addEventListener("input", renderResults);
  [calcFrequency, calcBefore, calcAfter].forEach((input) => input.addEventListener("input", updateGains));
  document.getElementById("copySuggestion").addEventListener("click", copySuggestion);
}

function renderDomains() {
  domainTabs.innerHTML = domains.map((domain) => `<button type="button" class="${domain === state.domain ? "is-active" : ""}" data-domain="${escapeHtml(domain)}">${escapeHtml(domain)}</button>`).join("");
  domainTabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.domain = button.dataset.domain;
      renderDomains();
      renderResults();
    });
  });
}

function getResults() {
  const query = normalize(searchInput.value);
  const terms = query.split(/\s+/).filter(Boolean);
  return state.cases.filter((item) => {
    const domainOk = state.domain === "Tous" || item.domaine === state.domain;
    const haystack = normalize([item.tache, item.apport, item.domaine, (item.tags || []).join(" ")].join(" "));
    const queryOk = terms.length === 0 || terms.every((term) => haystack.includes(term));
    return domainOk && queryOk;
  }).slice(0, 8);
}

function renderResults() {
  const results = getResults();
  if (!results.length) {
    usageResults.innerHTML = '<p class="notice">Aucune fiche proche. Essayez une formulation plus simple.</p>';
    return;
  }

  if (!results.some((item) => item.id === state.selectedId)) {
    state.selectedId = results[0].id;
  }

  usageResults.innerHTML = results.map((item) => `
    <button type="button" class="result-card ${item.id === state.selectedId ? "is-selected" : ""}" data-id="${item.id}">
      <h3>${escapeHtml(item.tache)}</h3>
      <p class="meta">${escapeHtml(item.domaine)} · gain estimé ${item.gain_minutes} min</p>
      <p>${escapeHtml(item.apport)}</p>
    </button>
  `).join("");

  usageResults.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.id;
      renderResults();
      renderDetail();
    });
  });
  renderDetail();
}

function getSelected() {
  return state.cases.find((item) => item.id === state.selectedId);
}

function renderDetail() {
  const item = getSelected();
  if (!item) {
    usageDetail.innerHTML = "<p>Sélectionnez une fiche.</p>";
    return;
  }

  usageDetail.innerHTML = `
    <p class="meta">${escapeHtml(item.domaine)}</p>
    <h2>${escapeHtml(item.tache)}</h2>
    <dl>
      <div><dt>Tâche de départ</dt><dd>${escapeHtml(item.tache)}</dd></div>
      <div><dt>Apport de l'IA</dt><dd>${escapeHtml(item.apport)}</dd></div>
      <div><dt>Méthode simple</dt><dd><ol>${item.methode.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol></dd></div>
      <div><dt>Précautions</dt><dd><ul>${item.precautions.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ul></dd></div>
      <div><dt>Gain estimé</dt><dd>${item.gain_minutes} minutes par usage, à ajuster selon votre contexte.</dd></div>
      <div><dt>Limites</dt><dd>${escapeHtml(item.limites)}</dd></div>
    </dl>
  `;
  calcFrequency.value = item.frequence;
  calcBefore.value = item.temps_avant_minutes;
  calcAfter.value = item.temps_apres_minutes;
  updateGains();
}

function updateGains() {
  const frequency = Number(calcFrequency.value) || 0;
  const before = Number(calcBefore.value) || 0;
  const after = Number(calcAfter.value) || 0;
  const monthly = Math.max(0, frequency * (before - after));
  monthlyGain.textContent = formatMinutes(monthly);
  annualGain.textContent = formatMinutes(monthly * 12);
}

async function copySuggestion() {
  const value = document.getElementById("suggestTask").value.trim();
  const status = document.getElementById("suggestStatus");
  if (!value) {
    status.textContent = "Décrivez une tâche avant de préparer la proposition.";
    return;
  }

  const text = `Proposition de tâche à ajouter à Trouver un usage IA : ${value}`;
  try {
    await navigator.clipboard.writeText(text);
    status.textContent = "Proposition préparée et copiée dans le presse-papiers.";
  } catch (error) {
    status.textContent = text;
  }
}

init().catch(() => {
  usageResults.innerHTML = '<p class="notice">Les fiches ne peuvent pas être chargées.</p>';
});
