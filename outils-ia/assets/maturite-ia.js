const MATURITY_STORAGE_KEY = "charlesberthou-ai-maturity-v1";
const REGISTER_STORAGE_KEY = "charlesberthou-ai-register-v1";

const maturityAxes = [
  {
    id: "usage",
    title: "Usage réel",
    low: "Quelques essais individuels",
    high: "Usages réguliers dans plusieurs équipes",
    recommendation: "Identifier les usages déjà présents et choisir deux pilotes très concrets.",
  },
  {
    id: "skills",
    title: "Compétences",
    low: "Repères dispersés",
    high: "Socle commun partagé",
    recommendation: "Créer un tronc commun court : consignes, limites, données, vérification.",
  },
  {
    id: "usecases",
    title: "Cas d'usage",
    low: "Idées floues",
    high: "Portefeuille priorisé",
    recommendation: "Cartographier les tâches répétitives, puis prioriser par gain, risque et faisabilité.",
  },
  {
    id: "governance",
    title: "Gouvernance",
    low: "Règles implicites",
    high: "Cadre clair et compris",
    recommendation: "Clarifier les données autorisées, la validation humaine et les usages interdits.",
  },
  {
    id: "measurement",
    title: "Mesure des gains",
    low: "Gains ressentis",
    high: "KPI suivis",
    recommendation: "Mesurer avant/après sur quelques usages : temps, qualité, risque, satisfaction.",
  },
  {
    id: "scale",
    title: "Passage à l'échelle",
    low: "Tests isolés",
    high: "Déploiement piloté",
    recommendation: "Transformer les pilotes utiles en plan 90 jours avec responsables, formation et revue.",
  },
];

const maturityNodes = {
  axes: document.querySelector("#maturityAxes"),
  scoreCard: document.querySelector("#maturityScoreCard"),
  score: document.querySelector("#maturityScore"),
  level: document.querySelector("#maturityLevel"),
  title: document.querySelector("#maturityTitle"),
  summary: document.querySelector("#maturitySummary"),
  bars: document.querySelector("#axisBars"),
  priorities: document.querySelector("#maturityPriorities"),
  reset: document.querySelector("#resetMaturity"),
  registerSignal: document.querySelector("#registerSignal"),
};

let scores = loadScores();

initMaturityTool();

function initMaturityTool() {
  if (!document.querySelector("[data-maturity-tool]")) return;
  renderQuestions();
  renderMaturity();
  maturityNodes.reset.addEventListener("click", () => {
    scores = Object.fromEntries(maturityAxes.map((axis) => [axis.id, 0]));
    saveScores();
    renderQuestions();
    renderMaturity();
  });
}

function renderQuestions() {
  maturityNodes.axes.innerHTML = "";
  maturityAxes.forEach((axis) => {
    const value = scores[axis.id] || 0;
    const section = document.createElement("section");
    section.className = "maturity-axis";
    section.innerHTML = `
      <div class="axis-copy">
        <h3>${escapeHtml(axis.title)}</h3>
        <p>${escapeHtml(axis.low)} → ${escapeHtml(axis.high)}</p>
      </div>
      <div class="axis-control">
        <input type="range" min="0" max="4" step="1" value="${value}" aria-label="Score ${escapeHtml(axis.title)}" data-axis="${axis.id}" />
        <div class="score-steps" aria-hidden="true">
          ${[0, 1, 2, 3, 4].map((score) => `<span class="${score <= value ? "active" : ""}">${score}</span>`).join("")}
        </div>
      </div>
      <strong>${getScoreLabel(value)}</strong>
    `;
    section.querySelector("input").addEventListener("input", (event) => {
      scores[axis.id] = Number(event.target.value);
      saveScores();
      renderQuestions();
      renderMaturity();
    });
    maturityNodes.axes.appendChild(section);
  });
}

function renderMaturity() {
  const total = getTotalScore();
  const max = maturityAxes.length * 4;
  const percent = Math.round((total / max) * 100);
  const level = getLevel(total);
  const weakAxes = maturityAxes
    .map((axis) => ({ ...axis, score: scores[axis.id] || 0 }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  maturityNodes.score.textContent = `${total}/${max}`;
  maturityNodes.level.textContent = level.label;
  maturityNodes.title.textContent = level.title;
  maturityNodes.summary.textContent = level.summary;
  maturityNodes.scoreCard.style.setProperty("--score-angle", `${percent * 3.6}deg`);

  maturityNodes.bars.innerHTML = maturityAxes.map((axis) => {
    const value = scores[axis.id] || 0;
    return `
      <div class="axis-bar-row">
        <span>${escapeHtml(axis.title)}</span>
        <div class="axis-bar"><i style="width:${value * 25}%"></i></div>
        <strong>${value}/4</strong>
      </div>
    `;
  }).join("");

  maturityNodes.priorities.innerHTML = weakAxes.map((axis, index) => `
    <article class="priority-item">
      <span>${index + 1}</span>
      <div>
        <strong>${escapeHtml(axis.title)}</strong>
        <p>${escapeHtml(axis.recommendation)}</p>
      </div>
    </article>
  `).join("");

  renderRegisterSignal();
}

function renderRegisterSignal() {
  let register = [];
  try {
    register = JSON.parse(localStorage.getItem(REGISTER_STORAGE_KEY) || "[]");
  } catch (error) {
    register = [];
  }

  if (!Array.isArray(register) || register.length === 0) {
    maturityNodes.registerSignal.textContent = "Aucun usage n'est encore inscrit dans le registre local. Le diagnostic reste donc centré sur la perception de maturité.";
    return;
  }

  const highRisk = register.filter((item) => item.riskLevel === "élevé").length;
  maturityNodes.registerSignal.textContent = `${register.length} usage${register.length > 1 ? "s" : ""} dans le registre local, dont ${highRisk} à risque élevé. Reliez les priorités du test aux cas déjà suivis.`;
}

function getTotalScore() {
  return maturityAxes.reduce((total, axis) => total + (Number(scores[axis.id]) || 0), 0);
}

function getLevel(total) {
  if (total <= 5) {
    return {
      label: "Fondations insuffisantes",
      title: "Fondations à poser",
      summary: "L'IA existe probablement déjà dans les pratiques, mais sans cadre commun. Commencez par des règles lisibles, une formation courte et deux cas d'usage limités.",
    };
  }

  if (total <= 11) {
    return {
      label: "Exploration dispersée",
      title: "Exploration à structurer",
      summary: "Les idées sont présentes, mais le pilotage demeure fragile. L'enjeu consiste à convertir les essais dispersés en portefeuille de cas priorisés.",
    };
  }

  if (total <= 17) {
    return {
      label: "Structuration engagée",
      title: "Adoption structurée",
      summary: "Les fondations sont en place. L'effort doit désormais porter sur la mesure réelle des gains, la maîtrise des risques et la montée en compétence.",
    };
  }

  return {
    label: "Maturité avancée",
    title: "Maturité avancée",
    summary: "L'organisation peut préparer le passage à l'échelle : standards communs, revue régulière des usages et industrialisation maîtrisée.",
  };
}

function getScoreLabel(value) {
  return ["Absent", "Initial", "En cours", "Installé", "Maîtrisé"][value] || "Absent";
}

function loadScores() {
  const fallback = Object.fromEntries(maturityAxes.map((axis) => [axis.id, 0]));
  try {
    const parsed = JSON.parse(localStorage.getItem(MATURITY_STORAGE_KEY) || "null");
    return parsed && typeof parsed === "object" ? { ...fallback, ...parsed } : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveScores() {
  localStorage.setItem(MATURITY_STORAGE_KEY, JSON.stringify(scores));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
