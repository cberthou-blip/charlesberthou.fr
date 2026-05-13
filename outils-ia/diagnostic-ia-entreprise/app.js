const QUESTIONS = [
  { axis: "Stratégie IA", text: "L'organisation a clarifié pourquoi elle veut utiliser l'IA." },
  { axis: "Stratégie IA", text: "Les priorités IA sont reliées à des objectifs concrets." },
  { axis: "Stratégie IA", text: "Les arbitrages IA sont portés par des responsables identifiés." },
  { axis: "Stratégie IA", text: "Les sujets IA sont suivis dans un cadre de décision régulier." },
  { axis: "Usages métiers", text: "Des tâches à fort potentiel ont été repérées avec les équipes." },
  { axis: "Usages métiers", text: "Des expérimentations simples ont déjà été menées." },
  { axis: "Usages métiers", text: "Les usages retenus répondent à des besoins réels." },
  { axis: "Usages métiers", text: "Les gains attendus sont estimés de manière prudente." },
  { axis: "Données, sécurité et cadre d'usage", text: "Les règles de protection des données sont connues." },
  { axis: "Données, sécurité et cadre d'usage", text: "Les outils autorisés et les usages à éviter sont clairement nommés." },
  { axis: "Données, sécurité et cadre d'usage", text: "Les risques sont évalués avant diffusion d'un usage." },
  { axis: "Données, sécurité et cadre d'usage", text: "Une procédure existe pour traiter les usages sensibles." },
  { axis: "Formation et adoption", text: "Les équipes disposent de repères pratiques sur l'IA." },
  { axis: "Formation et adoption", text: "Les managers savent accompagner les premiers usages." },
  { axis: "Formation et adoption", text: "Les bonnes pratiques sont partagées au-delà de quelques initiés." },
  { axis: "Formation et adoption", text: "Les résistances et questions sont traitées avec pédagogie." },
  { axis: "Pilotage et mesure des gains", text: "Les usages sont suivis dans le temps." },
  { axis: "Pilotage et mesure des gains", text: "Les gains, limites et incidents sont documentés." },
  { axis: "Pilotage et mesure des gains", text: "Les usages inutiles sont arrêtés ou réorientés." },
  { axis: "Pilotage et mesure des gains", text: "Un bilan régulier permet d'ajuster la démarche IA." }
];

const LEVELS = [
  { min: 0, max: 24, label: "Découverte" },
  { min: 25, max: 49, label: "Expérimentation" },
  { min: 50, max: 74, label: "Structuration" },
  { min: 75, max: 100, label: "Pilotage avancé" }
];

const RECOMMENDATIONS = {
  Découverte: ["Clarifier les objectifs prioritaires.", "Repérer quelques tâches simples à tester.", "Définir les premières règles d'usage."],
  Expérimentation: ["Choisir trois usages à suivre pendant un mois.", "Nommer un responsable pour chaque usage.", "Former les équipes aux réflexes de base."],
  Structuration: ["Mettre en place un registre des usages.", "Mesurer les gains et les limites.", "Stabiliser le cadre d'usage partagé."],
  "Pilotage avancé": ["Industrialiser seulement les usages éprouvés.", "Suivre les risques et les gains dans la durée.", "Organiser un retour d'expérience régulier."]
};

const form = document.getElementById("quizForm");
const resultPanel = document.getElementById("resultPanel");

function renderQuestions() {
  form.innerHTML = QUESTIONS.map((question, index) => `
    <article class="question-card">
      <fieldset>
        <legend>${index + 1}. ${question.text}</legend>
        <p class="meta">${question.axis}</p>
        <div class="scale" aria-label="Échelle de 0 à 4">
          ${[0, 1, 2, 3, 4].map((value) => `<label><input type="radio" name="q${index}" value="${value}" required><span>${value}</span></label>`).join("")}
        </div>
      </fieldset>
    </article>
  `).join("");
}

function getAnswers() {
  return QUESTIONS.map((_, index) => {
    const selected = form.querySelector(`input[name="q${index}"]:checked`);
    return selected ? Number(selected.value) : null;
  });
}

function getLevel(score) {
  return LEVELS.find((level) => score >= level.min && score <= level.max) || LEVELS[0];
}

function calculate() {
  const answers = getAnswers();
  if (answers.some((value) => value === null)) {
    resultPanel.className = "result-panel is-visible";
    resultPanel.innerHTML = '<p class="notice">Veuillez répondre à toutes les questions pour obtenir un résultat complet.</p>';
    resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const axes = {};
  QUESTIONS.forEach((question, index) => {
    axes[question.axis] ||= [];
    axes[question.axis].push(answers[index]);
  });

  const total = answers.reduce((sum, value) => sum + value, 0);
  const score = Math.round((total / (QUESTIONS.length * 4)) * 100);
  const level = getLevel(score);
  const axisScores = Object.keys(axes).map((axis) => {
    const values = axes[axis];
    return { axis, score: Math.round((values.reduce((sum, value) => sum + value, 0) / (values.length * 4)) * 100) };
  });
  const priorities = axisScores.slice().sort((a, b) => a.score - b.score).slice(0, 3);

  resultPanel.className = "result-panel is-visible";
  resultPanel.innerHTML = `
    <div class="score-summary">
      <div class="score-ring" style="--score:${score}%"><span>${score}</span></div>
      <div><p class="eyebrow">Résultat</p><h2>${level.label}</h2><p class="lead">Score global : ${score}/100.</p></div>
    </div>
    <div class="axis-bars">
      ${axisScores.map((item) => `<div class="axis-row"><div><span>${item.axis}</span><strong>${item.score}/100</strong></div><div class="bar-track"><div class="bar-fill" style="--value:${item.score}%"></div></div></div>`).join("")}
    </div>
    <div class="result-lists">
      <div><h3>Priorités d'action</h3><ul>${priorities.map((item) => `<li>${item.axis}</li>`).join("")}</ul></div>
      <div><h3>Recommandations</h3><ul>${RECOMMENDATIONS[level.label].map((item) => `<li>${item}</li>`).join("")}</ul></div>
      <div><h3>Prochaine étape</h3><p>Choisir un usage simple, le documenter, puis mesurer son utilité réelle avant de l'élargir.</p></div>
    </div>
  `;
  resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.getElementById("calculateScore").addEventListener("click", calculate);
document.getElementById("resetQuiz").addEventListener("click", () => {
  form.reset();
  resultPanel.className = "result-panel";
  resultPanel.innerHTML = "";
});
renderQuestions();
