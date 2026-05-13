const QUESTIONS = [
  { axis: "Compréhension de l'IA", text: "Je sais expliquer simplement ce qu'est une IA générative." },
  { axis: "Compréhension de l'IA", text: "Je distingue un modèle, un outil et un usage concret." },
  { axis: "Compréhension de l'IA", text: "Je comprends que l'IA produit des réponses probables, pas des vérités garanties." },
  { axis: "Usage quotidien", text: "J'utilise l'IA pour reformuler, synthétiser ou préparer un document." },
  { axis: "Usage quotidien", text: "Je sais préciser un contexte, un objectif et un format attendu." },
  { axis: "Usage quotidien", text: "Je réutilise les méthodes qui fonctionnent au lieu de repartir de zéro." },
  { axis: "Esprit critique", text: "Je vérifie les faits importants avant d'utiliser une réponse." },
  { axis: "Esprit critique", text: "Je sais repérer une réponse trop sûre d'elle ou insuffisamment sourcée." },
  { axis: "Esprit critique", text: "Je compare plusieurs approches avant de prendre une décision importante." },
  { axis: "Protection des données", text: "J'évite de saisir des données personnelles ou sensibles dans un outil non cadré." },
  { axis: "Protection des données", text: "Je sais anonymiser une situation avant de demander de l'aide à une IA." },
  { axis: "Protection des données", text: "Je vérifie les règles d'usage d'un outil avant de l'utiliser dans un contexte professionnel." },
  { axis: "Productivité personnelle", text: "J'identifie les tâches répétitives qui peuvent être allégées avec l'IA." },
  { axis: "Productivité personnelle", text: "Je mesure le gain réel d'un usage avant de l'adopter durablement." },
  { axis: "Productivité personnelle", text: "Je garde une trace des usages utiles pour les améliorer." }
];

const LEVELS = [
  { min: 0, max: 24, label: "Curieux" },
  { min: 25, max: 49, label: "Utilisateur occasionnel" },
  { min: 50, max: 74, label: "Utilisateur structuré" },
  { min: 75, max: 100, label: "Utilisateur avancé" }
];

const RECOMMENDATIONS = {
  Curieux: ["Commencer par les notions essentielles.", "Tester un usage simple sur une tâche sans risque.", "Apprendre à vérifier les réponses obtenues."],
  "Utilisateur occasionnel": ["Formaliser trois usages récurrents.", "Améliorer la formulation des demandes.", "Mettre en place une règle de protection des données."],
  "Utilisateur structuré": ["Mesurer les gains réels sur vos tâches fréquentes.", "Créer une courte bibliothèque de méthodes.", "Partager les bons réflexes avec votre entourage professionnel."],
  "Utilisateur avancé": ["Documenter les limites de vos usages.", "Structurer un registre personnel ou professionnel.", "Aider d'autres personnes à progresser avec méthode."]
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
  const strengths = axisScores.slice().sort((a, b) => b.score - a.score).slice(0, 2);
  const progress = axisScores.slice().sort((a, b) => a.score - b.score).slice(0, 2);

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
      <div><h3>Forces</h3><ul>${strengths.map((item) => `<li>${item.axis}</li>`).join("")}</ul></div>
      <div><h3>Axes de progrès</h3><ul>${progress.map((item) => `<li>${item.axis}</li>`).join("")}</ul></div>
      <div><h3>Recommandations</h3><ul>${RECOMMENDATIONS[level.label].map((item) => `<li>${item}</li>`).join("")}</ul></div>
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
