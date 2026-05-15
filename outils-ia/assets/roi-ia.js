const roiDefaults = {
  peopleCount: 0,
  hoursSaved: 0,
  hourlyCost: 0,
  activeWeeks: 0,
  adoptionRate: 0,
  monthlyCost: 0,
  setupCost: 0,
  confidenceBuffer: 0,
  qualityGainMonthly: 0,
  reviewMonthlyCost: 0,
  riskReserveRate: 0,
};

const roiExampleValues = {
  peopleCount: 25,
  hoursSaved: 1.5,
  hourlyCost: 45,
  activeWeeks: 42,
  adoptionRate: 60,
  monthlyCost: 1500,
  setupCost: 6000,
  confidenceBuffer: 20,
  qualityGainMonthly: 0,
  reviewMonthlyCost: 400,
  riskReserveRate: 10,
};

const roiNodes = {
  peopleCount: document.querySelector("#peopleCount"),
  hoursSaved: document.querySelector("#hoursSaved"),
  hourlyCost: document.querySelector("#hourlyCost"),
  activeWeeks: document.querySelector("#activeWeeks"),
  adoptionRate: document.querySelector("#adoptionRate"),
  monthlyCost: document.querySelector("#monthlyCost"),
  setupCost: document.querySelector("#setupCost"),
  confidenceBuffer: document.querySelector("#confidenceBuffer"),
  qualityGainMonthly: document.querySelector("#qualityGainMonthly"),
  reviewMonthlyCost: document.querySelector("#reviewMonthlyCost"),
  riskReserveRate: document.querySelector("#riskReserveRate"),
  reset: document.querySelector("#resetRoi"),
  example: document.querySelector("#loadRoiExample"),
  netGain: document.querySelector("#roiNetGain"),
  ratio: document.querySelector("#roiRatio"),
  payback: document.querySelector("#roiPayback"),
  title: document.querySelector("#roiTitle"),
  summary: document.querySelector("#roiSummary"),
  hours: document.querySelector("#roiHours"),
  grossGain: document.querySelector("#roiGrossGain"),
  qualityGain: document.querySelector("#roiQualityGain"),
  prudentGain: document.querySelector("#roiPrudentGain"),
  annualCost: document.querySelector("#roiAnnualCost"),
  monthlyNet: document.querySelector("#roiMonthlyNet"),
  pilotBudget: document.querySelector("#roiPilotBudget"),
};

initRoiTool();

function initRoiTool() {
  if (!document.querySelector("[data-roi-tool]")) return;
  const values = { ...roiDefaults };

  Object.entries(roiDefaults).forEach(([key]) => {
    if (roiNodes[key]) roiNodes[key].value = values[key];
  });

  Object.keys(roiDefaults).forEach((key) => {
    roiNodes[key]?.addEventListener("input", () => {
      renderRoi();
    });
  });

  roiNodes.reset.addEventListener("click", () => {
    applyRoiValues(roiDefaults);
    renderRoi();
  });

  roiNodes.example?.addEventListener("click", () => {
    applyRoiValues(roiExampleValues);
    renderRoi();
  });

  renderRoi();
}

function applyRoiValues(values) {
  Object.entries(roiDefaults).forEach(([key]) => {
    roiNodes[key].value = values[key] ?? 0;
  });
}

function renderRoi() {
  const values = readRoiValues();
  const adoption = values.adoptionRate / 100;
  const prudence = Math.min(values.confidenceBuffer, 80) / 100;
  const riskReserve = Math.min(values.riskReserveRate, 80) / 100;
  const annualHours = values.peopleCount * values.hoursSaved * values.activeWeeks * adoption;
  const timeGain = annualHours * values.hourlyCost;
  const qualityGain = values.qualityGainMonthly * 12;
  const grossGain = timeGain + qualityGain;
  const prudentGain = grossGain * (1 - prudence) * (1 - riskReserve);
  const annualCost = (values.monthlyCost * 12) + values.setupCost + (values.reviewMonthlyCost * 12);
  const netGain = prudentGain - annualCost;
  const roiRatio = annualCost > 0 ? (netGain / annualCost) * 100 : 0;
  const monthlyNet = netGain / 12;
  const paybackMonths = prudentGain > 0 ? annualCost / (prudentGain / 12) : Infinity;
  const pilotBudget = Math.max(values.setupCost, Math.min(annualCost * 0.25, Math.max(0, prudentGain) * 0.18));
  const reading = grossGain === 0 && annualCost === 0
    ? {
      title: "Hypothèses à renseigner",
      summary: "Renseignez un cas réel ou chargez l'exemple pour voir comment le simulateur interprète les gains, les coûts et la prudence.",
    }
    : getRoiReading(netGain, roiRatio, paybackMonths);

  roiNodes.netGain.textContent = formatCurrency(netGain);
  roiNodes.ratio.textContent = `${Math.round(roiRatio)} %`;
  roiNodes.payback.textContent = Number.isFinite(paybackMonths) ? `${Math.max(1, Math.ceil(paybackMonths))} mois` : "-";
  roiNodes.title.textContent = reading.title;
  roiNodes.summary.textContent = reading.summary;
  roiNodes.hours.textContent = `${Math.round(annualHours).toLocaleString("fr-FR")} h`;
  roiNodes.grossGain.textContent = formatCurrency(grossGain);
  roiNodes.qualityGain.textContent = formatCurrency(qualityGain);
  roiNodes.prudentGain.textContent = formatCurrency(prudentGain);
  roiNodes.annualCost.textContent = formatCurrency(annualCost);
  roiNodes.monthlyNet.textContent = formatCurrency(monthlyNet);
  roiNodes.pilotBudget.textContent = formatCurrency(pilotBudget);
}

function getRoiReading(netGain, roiRatio, paybackMonths) {
  if (netGain <= 0) {
    return {
      title: "Hypothèse à revoir",
      summary: "Le coût complet dépasse le gain prudent. Réduisez le périmètre, augmentez l'adoption réelle ou choisissez un cas d'usage plus fréquent.",
    };
  }
  if (roiRatio < 50 || paybackMonths > 18) {
    return {
      title: "Projet à qualifier",
      summary: "Le gain existe, mais l'équilibre reste fragile. Un pilote court permettra de vérifier le temps réellement récupéré et les coûts cachés.",
    };
  }
  if (roiRatio < 200 || paybackMonths > 6) {
    return {
      title: "Cas d'usage prometteur",
      summary: "L'ordre de grandeur justifie un pilote structuré, avec mesure avant/après, adoption suivie et revue des risques associés.",
    };
  }
  return {
    title: "Priorité forte",
    summary: "Le potentiel économique paraît solide. Le point décisif devient la qualité du déploiement : formation, adoption et gouvernance.",
  };
}

function readRoiValues() {
  return Object.fromEntries(Object.keys(roiDefaults).map((key) => [
    key,
    Math.max(0, Number(roiNodes[key].value) || 0),
  ]));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}
