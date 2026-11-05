const operators = [
  { id: "rv", name: "RV Pay", mark: "RV", rates: [0.9, 1.62, 3.13, 4.68, 5.47, 6.24, null] },
  { id: "stone", name: "Stone", mark: "ST", rates: Array(7).fill(null) },
  { id: "pgs", name: "PagSeguro (PGS)", mark: "PGS", rates: Array(7).fill(null) },
  { id: "custom", name: "Minha taxa", mark: "EU", rates: Array(7).fill(null) },
];

const modes = [
  { id: "debit", label: "Débito Visa / Mastercard" },
  { id: "debitElo", label: "Débito Elo" },
  { id: "credit", label: "Crédito à vista" },
  { id: "installment2", label: "Crédito 2x" },
  { id: "installment3", label: "Crédito 3x" },
  { id: "installment4", label: "Crédito 4x" },
  { id: "pix", label: "Pix" },
];

const advancedModes = [
  "Débito", "À vista", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x", "11x", "12x", "Pix", "Tx. embutida",
];
const advancedProviders = ["EQUIS", "PGS", "STONE"];
const advancedProviderNames = { EQUIS: "EQUIS", PGS: "PagSeguro (PGS)", STONE: "STONE" };
const advancedSegments = [
  ["5422", "AÇOUGUES"],
  ["5949", "ARMARINHOS E LOJAS DE TECIDO"],
  ["5994", "BANCA DE JORNAL E PROVEDOR DE NOTÍCIAS"],
  ["5813", "BARES, PUBS E CASA NOTURNAS"],
  ["5921", "CERVEJAS, VINHOS E LICORES (LOJA/CERVEJA/VINHO/LICOR)"],
  ["5462", "CONFEITARIAS / PADARIAS"],
  ["5697", "COSTUREIRAS E ALFAIATES"],
  ["8999", "CPF"],
  ["5912", "FARMÁCIAS"],
  ["5814", "LANCHONETES DE COMIDAS RÁPIDAS (FAST FOOD)"],
  ["5533", "LOJA DE PEÇAS E ACESSÓRIOS DE CARROS"],
  ["5499", "LOJAS DE CONVENIÊNCIA"],
  ["5211", "LOJAS DE MAT. DE CONSTRUÇÃO"],
  ["7299", "OUTROS CNPJS (LOJAS DIVERSAS)"],
  ["5812", "RESTAURANTES"],
  ["5651", "ROUPAS MASCULINAS, FEMININAS E INFANTIS"],
  ["7538", "SERVIÇOS PARA CARROS (NÃO CONCESSIONÁRIA)"],
  ["5411", "SUPERMERCADOS"],
  ["4812", "TELEFONIA"],
];
const advancedTpvRanges = [
  ["LT2", "MENOR 2 MIL"],
  ["2TO5", "ENTRE 2 A 5 MIL"],
  ["5TO15", "ENTRE 5 MIL E 15 MIL"],
  ["GT15", "MAIOR QUE 15 MIL"],
  ["NA", "NÃO APLICA"],
  ["PROMO", "PROMOCIONAL"],
];
const referenceRates = {
  EQUIS: [1.67, 5.23, 6.09, 6.86, 7.62, 8.36, 9.10, 9.63, 10.65, 11.37, 12.07, 12.78, 13.47, 0.80, 1.65],
  PGS: [1.67, 5.23, 6.09, 6.86, 7.62, 8.36, 9.10, 9.93, 10.65, 11.37, 12.07, 12.78, 13.47, 0.80, 1.59],
  STONE: [0.89, 3.45, 4.55, 5.28, 6.01, 6.74, 7.48, 8.42, 9.15, 9.88, 10.61, 11.34, 12.07, 0.79, 1.50],
};
const advancedStorageKey = "rv-compare-advanced-v1";
const referenceScenarioKey = ["5411", "D+1", "LT2", "VISA"].join("|");
const advancedScenarios = {
  [referenceScenarioKey]: Object.fromEntries(advancedProviders.map((provider) => [provider, [...referenceRates[provider]]])),
};

const storageKey = "rv-compare-rates-v1";
const head = document.querySelector("#rates-head");
const body = document.querySelector("#rates-body");
const providerSelect = document.querySelector("#provider-select");
const modeSelect = document.querySelector("#mode-select");
const compareSelect = document.querySelector("#compare-select");
const saleAmount = document.querySelector("#sale-amount");
const monthlySales = document.querySelector("#monthly-sales");
const saveNotice = document.querySelector("#save-notice");
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
let noticeTimeout;

function loadRates() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!Array.isArray(saved)) return;
    const savedById = new Map(saved.filter((item) => item && typeof item.id === "string").map((item) => [item.id, item]));
    operators.forEach((operator) => {
      const savedOperator = savedById.get(operator.id);
      if (!Array.isArray(savedOperator?.rates)) return;
      operator.rates = operator.rates.map((defaultRate, modeIndex) => {
        const value = savedOperator.rates[modeIndex];
        if (value === null || value === "" || value === undefined) return null;
        const rate = Number(value);
        return Number.isFinite(rate) && rate >= 0 && rate <= 100 ? rate : defaultRate;
      });
    });
  } catch {
    saveNotice.textContent = "Não foi possível carregar as taxas salvas. Os valores de referência foram mantidos.";
  }
}

function saveRates() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(operators.map(({ id, rates }) => ({ id, rates }))));
    saveNotice.textContent = "Taxas salvas neste navegador.";
    clearTimeout(noticeTimeout);
    noticeTimeout = setTimeout(() => {
      saveNotice.textContent = "Suas taxas são salvas automaticamente neste navegador.";
    }, 2400);
    return true;
  } catch {
    saveNotice.textContent = "Não foi possível salvar. Verifique as configurações do navegador.";
    return false;
  }
}

function formatRate(rate) {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(rate);
}

function renderTable() {
  head.innerHTML = "<th scope=\"col\">OPERAÇÃO</th>" + operators.map((operator) =>
    `<th scope="col"><span class="provider-head"><span class="provider-mark">${operator.mark}</span>${operator.name}</span></th>`
  ).join("");

  body.innerHTML = modes.map((mode, modeIndex) => {
    const values = operators.map((operator) => operator.rates[modeIndex]);
    const availableRates = values.filter((rate) => Number.isFinite(rate) && rate >= 0);
    const minimum = availableRates.length ? Math.min(...availableRates) : null;
    const cells = operators.map((operator, operatorIndex) => {
      const rate = operator.rates[modeIndex];
      const isWinner = rate !== null && minimum !== null && rate === minimum;
      return `<td><label class="rate-cell"><input class="rate-input${isWinner ? " is-winner" : ""}" type="number" min="0" max="100" step="0.01" inputmode="decimal" aria-label="Taxa ${mode.label} ${operator.name}, em porcentagem" data-operator="${operatorIndex}" data-mode="${modeIndex}" value="${rate === null ? "" : rate}" placeholder="—" /><span>%</span></label></td>`;
    }).join("");
    return `<tr><th scope="row">${mode.label}</th>${cells}</tr>`;
  }).join("");

  body.querySelectorAll(".rate-input").forEach((input) => {
    input.addEventListener("input", onRateInput);
    input.addEventListener("change", (event) => {
      if (event.currentTarget.validity.valid) saveRates();
    });
  });
}

function populateSelects() {
  providerSelect.innerHTML = operators.map((operator) => `<option value="${operator.id}">${operator.name}</option>`).join("");
  modeSelect.innerHTML = modes.map((mode, index) => `<option value="${index}">${mode.label}</option>`).join("");
  compareSelect.innerHTML = operators.filter((operator) => operator.id !== providerSelect.value).map((operator) => `<option value="${operator.id}">${operator.name}</option>`).join("");
}

function selectedOperator(id) {
  return operators.find((operator) => operator.id === id);
}

function calculate() {
  const provider = selectedOperator(providerSelect.value);
  const comparison = selectedOperator(compareSelect.value);
  const modeIndex = Number(modeSelect.value);
  const rate = provider.rates[modeIndex];
  const compareRate = comparison?.rates[modeIndex] ?? null;
  const amount = Math.max(0, Number(saleAmount.value) || 0);
  const sales = Math.max(0, Number(monthlySales.value) || 0);
  const gross = amount * sales;
  const fees = rate === null ? null : gross * rate / 100;

  document.querySelector("#result-rate").textContent = rate === null ? "Sem taxa" : `${formatRate(rate)}%`;
  document.querySelector("#result-provider").textContent = `${provider.name} · ${modes[modeIndex].label}`;
  document.querySelector("#result-fees").textContent = fees === null ? "Cadastre a taxa" : currency.format(fees);
  document.querySelector("#result-gross").textContent = currency.format(gross);
  document.querySelector("#result-net").textContent = fees === null ? "—" : currency.format(gross - fees);

  const savings = document.querySelector("#result-savings");
  if (rate === null) {
    savings.textContent = `Preencha a taxa de ${provider.name} para calcular esta projeção.`;
  } else if (compareRate === null) {
    savings.textContent = `Preencha a taxa de ${comparison.name} para comparar o custo mensal das duas operadoras.`;
  } else {
    const difference = gross * (compareRate - rate) / 100;
    const ratesCompared = `Taxas comparadas: ${formatRate(rate)}% (${provider.name}) e ${formatRate(compareRate)}% (${comparison.name}).`;
    if (difference > 0) savings.textContent = `Com ${provider.name}, você paga ${currency.format(difference)} a menos em taxas por mês do que com ${comparison.name}. ${ratesCompared}`;
    else if (difference < 0) savings.textContent = `Com ${comparison.name}, você paga ${currency.format(Math.abs(difference))} a menos em taxas por mês do que com ${provider.name}. ${ratesCompared}`;
    else savings.textContent = `As duas operadoras têm o mesmo custo mensal neste cenário. ${ratesCompared}`;
  }
}

function onRateInput(event) {
  const input = event.currentTarget;
  const operatorIndex = Number(input.dataset.operator);
  const modeIndex = Number(input.dataset.mode);
  const raw = input.value;
  const value = raw === "" ? null : Number(raw);
  input.setCustomValidity("");
  if (!input.validity.valid || (value !== null && (!Number.isFinite(value) || value < 0 || value > 100))) {
    input.setCustomValidity("Informe uma taxa entre 0 e 100%, com até duas casas decimais.");
    clearTimeout(noticeTimeout);
    saveNotice.textContent = "Informe uma taxa entre 0 e 100%, com até duas casas decimais.";
    return;
  }
  operators[operatorIndex].rates[modeIndex] = value;
  const rowInputs = [...body.querySelectorAll(`.rate-input[data-mode="${modeIndex}"]`)];
  const rates = rowInputs.map((rowInput) => rowInput.value === "" ? null : Number(rowInput.value)).filter((rate) => rate !== null && Number.isFinite(rate) && rate >= 0);
  const minimum = rates.length ? Math.min(...rates) : null;
  rowInputs.forEach((rowInput) => rowInput.classList.toggle("is-winner", rowInput.value !== "" && minimum !== null && Number(rowInput.value) === minimum));
  calculate();
}

function importAdvancedRates() {
  const notice = document.querySelector("#import-notice");
  const scenarioKey = advancedScenarioKey("market");
  const scenarioRates = advancedScenarios[scenarioKey];
  if (!scenarioRates) {
    notice.hidden = false;
    notice.textContent = "Não há taxas disponíveis para o cenário selecionado. Confira a consulta avançada.";
    return;
  }

  const brand = document.querySelector("#market-brand").value;
  const modeMappings = [
    ...(brand === "ELO" ? [[0, 1]] : ["VISA", "MASTERCARD"].includes(brand) ? [[0, 0]] : []),
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [13, 6],
  ];
  const operatorMappings = [
    ["PGS", "pgs"],
    ["STONE", "stone"],
  ];
  let imported = 0;
  let preserved = 0;
  let unavailable = 0;

  operatorMappings.forEach(([sourceId, targetId]) => {
    const target = selectedOperator(targetId);
    scenarioRates[sourceId].forEach((rate, sourceModeIndex) => {
      const mapping = modeMappings.find(([advancedMode]) => advancedMode === sourceModeIndex);
      if (!mapping) return;
      const [, targetModeIndex] = mapping;
      if (rate === null || !Number.isFinite(rate)) {
        unavailable++;
        return;
      }
      if (target.rates[targetModeIndex] !== null) {
        preserved++;
        return;
      }
      target.rates[targetModeIndex] = rate;
      imported++;
    });
  });

  let saved = true;
  if (imported > 0) {
    saved = saveRates();
    renderTable();
    calculate();
  }

  const segment = document.querySelector("#market-segment").selectedOptions[0].textContent;
  const settlement = document.querySelector("#market-settlement").value;
  const tpv = document.querySelector("#market-tpv").selectedOptions[0].textContent;
  const scenario = `${segment} · ${settlement} · ${tpv} · ${brand}`;
  const messages = [`${imported} taxa(s) importada(s) para PagSeguro (PGS) e Stone.`];
  if (preserved) messages.push(`${preserved} valor(es) existente(s) foram preservados.`);
  if (unavailable) messages.push(`${unavailable} taxa(s) não estavam disponíveis.`);
  if (!saved) messages.push("Não foi possível salvar as alterações neste navegador.");
  messages.push(`Cenário: ${scenario}.`);
  notice.hidden = false;
  notice.textContent = messages.join(" ");
}

function advancedScenarioKey(prefix) {
  return [
    document.querySelector(`#${prefix}-segment`).value,
    document.querySelector(`#${prefix}-settlement`).value,
    document.querySelector(`#${prefix}-tpv`).value,
    document.querySelector(`#${prefix}-brand`).value,
  ].join("|");
}

function getAdvancedRates(scenarioKey) {
  if (!advancedScenarios[scenarioKey]) {
    advancedScenarios[scenarioKey] = Object.fromEntries(advancedProviders.map((provider) => [provider, Array(advancedModes.length).fill(null)]));
  }
  return advancedScenarios[scenarioKey];
}

function loadAdvancedRates() {
  try {
    const saved = JSON.parse(localStorage.getItem(advancedStorageKey));
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return;
    Object.entries(saved).forEach(([scenarioKey, providers]) => {
      if (!providers || typeof providers !== "object" || Array.isArray(providers)) return;
      const validProviders = {};
      advancedProviders.forEach((provider) => {
        const rates = providers[provider];
        if (Array.isArray(rates) && rates.length === advancedModes.length && rates.every((rate) => rate === null || (Number.isFinite(rate) && rate >= 0 && rate <= 100))) {
          validProviders[provider] = rates;
        }
      });
      if (Object.keys(validProviders).length) {
        advancedScenarios[scenarioKey] = { ...getAdvancedRates(scenarioKey), ...validProviders };
      }
    });
  } catch {
    document.querySelector("#advanced-notice").textContent = "Não foi possível carregar as taxas salvas. Você pode informar os valores novamente.";
  }
}

function saveAdvancedRates() {
  try {
    localStorage.setItem(advancedStorageKey, JSON.stringify(advancedScenarios));
    document.querySelector("#advanced-notice").textContent = "Taxas salvas neste navegador.";
    return true;
  } catch {
    document.querySelector("#advanced-notice").textContent = "Não foi possível salvar. Verifique as configurações do navegador.";
    return false;
  }
}

function formatCurrency(value) {
  return currency.format(value);
}

function formatAdvancedRate(rate) {
  return rate === null ? "" : rate.toFixed(2);
}

function createAdvancedRateInput(provider, modeIndex, scenarioKey, isMarket) {
  const rate = getAdvancedRates(scenarioKey)[provider][modeIndex];
  const input = document.createElement("input");
  input.type = "number";
  input.min = "0";
  input.max = "100";
  input.step = "0.01";
  input.inputMode = "decimal";
  input.className = `advanced-rate-input${isMarket ? " market-rate-input" : ""}`;
  input.setAttribute("aria-label", `Taxa ${advancedModes[modeIndex]} ${advancedProviderNames[provider]}, em porcentagem`);
  input.dataset.advancedProvider = provider;
  input.dataset.advancedMode = String(modeIndex);
  input.dataset.scenarioKey = scenarioKey;
  input.value = formatAdvancedRate(rate);
  return input;
}

function renderOfferTable() {
  const scenarioKey = advancedScenarioKey("offer");
  const provider = document.querySelector("#offer-acquirer").value;
  const body = document.querySelector("#offer-body");
  document.querySelector("#offer-scenario").textContent = `${advancedProviderNames[provider]} · ${document.querySelector("#offer-brand").value}`;
  body.replaceChildren(...advancedModes.map((mode, modeIndex) => {
    const row = document.createElement("tr");
    const heading = document.createElement("th");
    heading.scope = "row";
    heading.textContent = mode;
    const rateCell = document.createElement("td");
    rateCell.append(createAdvancedRateInput(provider, modeIndex, scenarioKey, false), document.createTextNode(" %"));
    const netCell = document.createElement("td");
    netCell.dataset.offerNetFor = `${provider}-${modeIndex}`;
    row.append(heading, rateCell, netCell);
    return row;
  }));
}

function renderMarketTable() {
  const scenarioKey = advancedScenarioKey("market");
  const body = document.querySelector("#market-body");
  body.replaceChildren(...advancedModes.map((mode, modeIndex) => {
    const row = document.createElement("tr");
    const heading = document.createElement("th");
    heading.scope = "row";
    heading.textContent = mode;
    row.append(heading);
    advancedProviders.forEach((provider) => {
      const cell = document.createElement("td");
      cell.dataset.marketProvider = provider;
      cell.dataset.marketMode = String(modeIndex);
      cell.append(createAdvancedRateInput(provider, modeIndex, scenarioKey, true));
      const best = document.createElement("span");
      best.className = "best-rate-label";
      best.textContent = "Menor";
      best.hidden = true;
      cell.append(best);
      row.append(cell);
    });
    return row;
  }));
}

function updateAdvancedResults() {
  const rawSale = document.querySelector("#offer-sale").value;
  const sale = rawSale === "" ? null : Number(rawSale);
  const saleIsValid = sale !== null && Number.isFinite(sale) && sale > 0 && sale <= 1000000;
  document.querySelector("#offer-sale-summary").textContent = saleIsValid ? `Venda de ${formatCurrency(sale)}` : "Informe um valor válido";

  document.querySelectorAll(".advanced-rate-input").forEach((input) => {
    const { advancedProvider: provider, advancedMode: modeIndex, scenarioKey } = input.dataset;
    const rate = getAdvancedRates(scenarioKey)[provider][Number(modeIndex)];
    if (input !== document.activeElement) input.value = formatAdvancedRate(rate);
    if (input.classList.contains("market-rate-input")) return;
    const net = input.closest("tr").querySelector("[data-offer-net-for]");
    net.textContent = saleIsValid && rate !== null ? formatCurrency(sale * (1 - rate / 100)) : "—";
  });
  updateAdvancedWinners();
}

function updateAdvancedWinners() {
  document.querySelectorAll("#market-body tr").forEach((row) => {
    const cells = [...row.querySelectorAll("[data-market-provider]")];
    const available = cells.map((cell) => {
      const input = cell.querySelector("input");
      return input.value === "" ? null : Number(input.value);
    }).filter((rate) => Number.isFinite(rate) && rate >= 0 && rate <= 100);
    const minimum = available.length ? Math.min(...available) : null;
    cells.forEach((cell) => {
      const input = cell.querySelector("input");
      const isBest = minimum !== null && input.value !== "" && Number(input.value) === minimum;
      input.classList.toggle("is-best", isBest);
      cell.querySelector(".best-rate-label").hidden = !isBest;
    });
  });

  const offerInput = document.querySelector("#offer-body .advanced-rate-input");
  if (!offerInput) return;
  const offerProvider = offerInput.dataset.advancedProvider;
  const modeIndex = offerInput.dataset.advancedMode;
  const matchingMarketInput = [...document.querySelectorAll("#market-body .market-rate-input")]
    .find((input) => input.dataset.advancedProvider === offerProvider && input.dataset.advancedMode === modeIndex);
  offerInput.classList.toggle("is-best", Boolean(matchingMarketInput?.classList.contains("is-best")));
}

function renderAdvanced() {
  renderOfferTable();
  renderMarketTable();
  updateAdvancedResults();
}

function initializeAdvancedFilters() {
  ["offer-segment", "market-segment"].forEach((id) => {
    const select = document.querySelector(`#${id}`);
    select.replaceChildren(...advancedSegments.map(([code, label]) => {
      const option = new Option(`${code} - ${label}`, code);
      option.selected = code === "5411";
      return option;
    }));
  });
  ["offer-tpv", "market-tpv"].forEach((id) => {
    const select = document.querySelector(`#${id}`);
    select.replaceChildren(...advancedTpvRanges.map(([value, label]) => {
      const option = new Option(label, value);
      option.selected = value === "LT2";
      return option;
    }));
  });

  ["offer-filters", "market-filters"].forEach((id) => {
    const form = document.querySelector(`#${id}`);
    form.addEventListener("change", (event) => {
      const control = event.target;
      if (control instanceof HTMLSelectElement && control.name) {
        const peerPrefix = id === "offer-filters" ? "market" : "offer";
        const peer = document.querySelector(`#${peerPrefix}-${control.name}`);
        if (peer && peer.value !== control.value) peer.value = control.value;
      }
      renderAdvanced();
    });
  });
  document.querySelector("#offer-sale").addEventListener("input", updateAdvancedResults);
  document.querySelector("#consulta").addEventListener("input", (event) => {
    const input = event.target.closest(".advanced-rate-input");
    if (!input) return;
    const raw = input.value;
    const rate = raw === "" ? null : Number(raw);
    input.setCustomValidity("");
    if (!input.validity.valid || (rate !== null && (!Number.isFinite(rate) || rate < 0 || rate > 100))) {
      input.setCustomValidity("Informe uma taxa entre 0 e 100%, com até duas casas decimais.");
      document.querySelector("#advanced-notice").textContent = "Informe uma taxa entre 0 e 100%, com até duas casas decimais.";
      return;
    }

    const { advancedProvider: provider, advancedMode: modeIndex, scenarioKey } = input.dataset;
    getAdvancedRates(scenarioKey)[provider][Number(modeIndex)] = rate;
    saveAdvancedRates();
    updateAdvancedResults();
  });
  loadAdvancedRates();
  renderAdvanced();
}

document.querySelector("#reset-rates").addEventListener("click", () => {
  try {
    localStorage.removeItem(storageKey);
    window.location.reload();
  } catch {
    saveNotice.textContent = "Não foi possível restaurar as taxas. Verifique as configurações do navegador.";
  }
});
document.querySelector("#import-advanced-rates").addEventListener("click", importAdvancedRates);

providerSelect.addEventListener("change", () => {
  const previousComparison = compareSelect.value;
  compareSelect.innerHTML = operators.filter((operator) => operator.id !== providerSelect.value).map((operator) => `<option value="${operator.id}">${operator.name}</option>`).join("");
  if ([...compareSelect.options].some((option) => option.value === previousComparison)) compareSelect.value = previousComparison;
  calculate();
});

[modeSelect, compareSelect, saleAmount, monthlySales].forEach((control) => control.addEventListener("input", calculate));
document.querySelector("#calculator-form").addEventListener("submit", (event) => event.preventDefault());

const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector("#main-nav");
menuToggle.addEventListener("click", () => {
  const expanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!expanded));
  menuToggle.setAttribute("aria-label", expanded ? "Abrir menu" : "Fechar menu");
  mainNav.classList.toggle("is-open", !expanded);
});
mainNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    mainNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menu");
  }
});

const installButton = document.querySelector("#install-app");
const installDialog = document.querySelector("#install-dialog");
const installMessage = document.querySelector("#install-message");
let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
});

installButton.addEventListener("click", async () => {
  mainNav.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Abrir menu");

  if (!deferredInstallPrompt) {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    installMessage.textContent = isIOS
      ? "No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início."
      : "No menu do navegador, escolha Instalar RV Compare ou Adicionar à tela inicial.";
    installDialog.showModal();
    return;
  }

  try {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
  } catch {
    installMessage.textContent = "Não foi possível concluir a instalação. Tente novamente pelo menu do navegador.";
    installDialog.showModal();
  } finally {
    deferredInstallPrompt = null;
  }
});

document.querySelectorAll(".install-dialog-close, .install-dialog-confirm").forEach((button) => {
  button.addEventListener("click", () => installDialog.close());
});

installDialog.addEventListener("click", (event) => {
  if (event.target === installDialog) installDialog.close();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installButton.hidden = true;
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch((error) => {
    console.error("Não foi possível registrar o service worker do RV Compare.", error);
  }));
}

loadRates();
populateSelects();
renderTable();
calculate();
initializeAdvancedFilters();