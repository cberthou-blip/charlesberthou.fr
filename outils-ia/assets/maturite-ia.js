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
  {
    id: "data",
    title: "Données",
    low: "Sources dispersées",
    high: "Données qualifiées",
    recommendation: "Identifier les sources utiles, leurs droits d'accès et leur qualité avant de lancer les cas sensibles.",
  },
  {
    id: "security",
    title: "Sécurité",
    low: "Règles floues",
    high: "Contrôles maîtrisés",
    recommendation: "Préciser les données interdites, les outils autorisés et les exigences de vérification.",
  },
  {
    id: "adoption",
    title: "Adoption métier",
    low: "Usage isolé",
    high: "Rituels partagés",
    recommendation: "Impliquer les équipes, documenter les retours et former sur les cas réellement utilisés.",
  },
  {
    id: "oversight",
    title: "Pilotage humain",
    low: "Validation absente",
    high: "Responsabilités claires",
    recommendation: "Nommer les responsables, définir les validations humaines et les situations d'arrêt.",
  },
];

const maturityExampleScores = {
  usage: 2,
  skills: 1,
  usecases: 2,
  governance: 1,
  measurement: 1,
  scale: 0,
  data: 2,
  security: 1,
  adoption: 1,
  oversight: 1,
};

const maturityNodes = {
  axes: document.querySelector("#maturityAxes"),
  scoreCard: document.querySelector("#maturityScoreCard"),
  score: document.querySelector("#maturityScore"),
  level: document.querySelector("#maturityLevel"),
  insight: document.querySelector("#maturityScoreInsight"),
  percent: document.querySelector("#maturityScorePercent"),
  blocker: document.querySelector("#maturityScoreBlocker"),
  title: document.querySelector("#maturityTitle"),
  summary: document.querySelector("#maturitySummary"),
  profile: document.querySelector("#maturityProfile"),
  nextStep: document.querySelector("#maturityNextStep"),
  bars: document.querySelector("#axisBars"),
  priorities: document.querySelector("#maturityPriorities"),
  reset: document.querySelector("#resetMaturity"),
  example: document.querySelector("#applyMaturityExample"),
};

let scores = getDefaultScores();

initMaturityTool();

function initMaturityTool() {
  if (!document.querySelector("[data-maturity-tool]")) return;
  renderQuestions();
  renderMaturity();
  maturityNodes.reset.addEventListener("click", () => {
    scores = getDefaultScores();
    renderQuestions();
    renderMaturity();
  });
  maturityNodes.example?.addEventListener("click", () => {
    scores = { ...maturityExampleScores };
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
        <span class="axis-value" aria-hidden="true">${value}/4 · ${escapeHtml(getScoreLabel(value))}</span>
        <input type="range" min="0" max="4" step="1" value="${value}" aria-label="Score ${escapeHtml(axis.title)}" aria-valuetext="${escapeHtml(getScoreLabel(value))}" data-axis="${axis.id}" />
        <div class="axis-scale" aria-hidden="true">
          <span>Absent</span>
          <span>Structuré</span>
        </div>
      </div>
    `;
    section.querySelector("input").addEventListener("input", (event) => {
      scores[axis.id] = Number(event.target.value);
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
  maturityNodes.insight.textContent = level.insight;
  maturityNodes.percent.textContent = `${percent} %`;
  maturityNodes.blocker.textContent = weakAxes[0]?.title || "-";
  maturityNodes.title.textContent = level.title;
  maturityNodes.summary.textContent = level.summary;
  maturityNodes.profile.textContent = level.profile;
  maturityNodes.nextStep.textContent = level.nextStep;
  maturityNodes.scoreCard.style.setProperty("--score-angle", `${percent * 3.6}deg`);

  if (maturityNodes.bars) {
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
  }

  if (maturityNodes.priorities) {
    maturityNodes.priorities.innerHTML = weakAxes.map((axis, index) => `
      <article class="priority-item">
        <span>${index + 1}</span>
        <div>
          <strong>${escapeHtml(axis.title)}</strong>
          <p>${escapeHtml(axis.recommendation)}</p>
        </div>
      </article>
    `).join("");
  }
}

function getTotalScore() {
  return maturityAxes.reduce((total, axis) => total + (Number(scores[axis.id]) || 0), 0);
}

function getLevel(total) {
  if (total <= 9) {
    return {
      label: "Fondations insuffisantes",
      title: "Fondations à poser",
      profile: "Risque d'usage invisible",
      nextStep: "Cadrer",
      insight: "Le sujet doit d'abord devenir visible, gouverné et compréhensible.",
      summary: "Commencez par rendre les usages visibles, ou chargez un exemple pour voir comment lire le diagnostic.",
    };
  }

  if (total <= 19) {
    return {
      label: "Exploration dispersée",
      title: "Exploration à structurer",
      profile: "Potentiel non orchestré",
      nextStep: "Prioriser",
      insight: "La valeur vient maintenant du choix des bons usages et d'une mesure simple.",
      summary: "Priorisez les usages utiles et mesurez un premier pilote court.",
    };
  }

  if (total <= 29) {
    return {
      label: "Structuration engagée",
      title: "Adoption structurée",
      profile: "Passage au pilotage",
      nextStep: "Mesurer",
      insight: "Les fondations existent ; il faut objectiver les gains et fermer les angles morts.",
      summary: "Mesurez les gains réels et clarifiez les points de vigilance.",
    };
  }

  return {
    label: "Maturité avancée",
    title: "Maturité avancée",
    profile: "Organisation scalable",
    nextStep: "Industrialiser",
    insight: "Le sujet peut passer d'un portefeuille de pilotes à un système de déploiement.",
    summary: "Passez à l'échelle avec des standards communs et des revues régulières.",
  };
}

function getScoreLabel(value) {
  return ["Absent", "Initial", "En cours", "Installé", "Structuré"][value] || "Absent";
}

function getDefaultScores() {
  return Object.fromEntries(maturityAxes.map((axis) => [axis.id, 0]));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
