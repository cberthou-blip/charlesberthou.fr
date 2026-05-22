const maturityAxes = [
  {
    id: "culture",
    title: "Culture IA",
    low: "Repères dispersés",
    high: "Bases comprises et partagées",
    recommendation: "Reprendre les notions essentielles : modèle, donnée, contexte, erreur possible et vérification.",
  },
  {
    id: "usage",
    title: "Usages actuels",
    low: "Essais isolés",
    high: "Usages réguliers et nommés",
    recommendation: "Identifier les usages déjà présents et distinguer expérimentation, habitude et dépendance.",
  },
  {
    id: "organization",
    title: "Organisation",
    low: "Règles implicites",
    high: "Responsabilités claires",
    recommendation: "Clarifier qui décide, qui vérifie, quelles données sont utilisées et ce qui doit rester humain.",
  },
  {
    id: "limits",
    title: "Risques et limites",
    low: "Peu visibles",
    high: "Vigilances intégrées",
    recommendation: "Nommer les risques : erreurs, biais, confidentialité, dépendance outil et validation humaine.",
  },
  {
    id: "next",
    title: "Prochaines étapes",
    low: "Floues",
    high: "Progression priorisée",
    recommendation: "Choisir une prochaine action simple : apprendre, documenter, tester ou réduire un risque.",
  },
];

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
  registerSignal: document.querySelector("#registerSignal"),
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
  maturityNodes.registerSignal.textContent = "Le diagnostic démarre sans reprendre automatiquement le registre local. Ouvrez le registre IA pour documenter les usages retenus.";
}

function getTotalScore() {
  return maturityAxes.reduce((total, axis) => total + (Number(scores[axis.id]) || 0), 0);
}

function getLevel(total) {
  if (total <= 4) {
    return {
      label: "Fondations insuffisantes",
      title: "Fondations à poser",
      profile: "Risque d'usage invisible",
      nextStep: "Cadrer",
      insight: "Le sujet doit d'abord devenir visible, gouverné et compréhensible.",
      summary: "L'IA existe probablement déjà dans les pratiques, mais sans cadre commun. Commencez par des règles lisibles, une formation courte et deux cas d'usage limités.",
    };
  }

  if (total <= 9) {
    return {
      label: "Exploration dispersée",
      title: "Exploration à structurer",
      profile: "Potentiel non orchestré",
      nextStep: "Prioriser",
      insight: "La valeur vient maintenant du choix des bons usages et d'une mesure simple.",
      summary: "Les idées sont présentes, mais le pilotage demeure fragile. L'enjeu consiste à convertir les essais dispersés en portefeuille de cas priorisés.",
    };
  }

  if (total <= 14) {
    return {
      label: "Structuration engagée",
      title: "Adoption structurée",
      profile: "Passage au pilotage",
      nextStep: "Mesurer",
      insight: "Les fondations existent ; il faut objectiver les gains et fermer les angles morts.",
      summary: "Les fondations sont en place. L'effort doit désormais porter sur la mesure réelle des gains, la maîtrise des risques et la montée en compétence.",
    };
  }

  return {
    label: "Maturité avancée",
    title: "Maturité avancée",
    profile: "Organisation scalable",
    nextStep: "Industrialiser",
    insight: "Le sujet peut passer d'un portefeuille de pilotes à un système de déploiement.",
    summary: "L'organisation peut préparer le passage à l'échelle : standards communs, revue régulière des usages et industrialisation maîtrisée.",
  };
}

function getScoreLabel(value) {
  return ["Absent", "Initial", "En cours", "Installé", "Maîtrisé"][value] || "Absent";
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
