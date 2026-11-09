const operators = [
  { id: "rv", name: "RV Pay", mark: "RV", rates: [0.9, 3.13, 4.68, 5.47, 6.24, null] },
  { id: "stone", name: "Stone", mark: "ST", rates: Array(6).fill(null) },
  { id: "pgs", name: "PagSeguro (PGS)", mark: "PGS", rates: Array(6).fill(null) },
  { id: "custom", name: "Minha taxa", mark: "EU", rates: Array(6).fill(null) },
];

const modes = [
  { id: "debit", label: "Débito" },
  { id: "credit", label: "Crédito à vista" },
  { id: "installment2", label: "Crédito 2x" },
  { id: "installment3", label: "Crédito 3x" },
  { id: "installment4", label: "Crédito 4x" },
  { id: "pix", label: "Pix" },
];
const legacyModeIndexes = [0, 2, 3, 4, 5, 6];

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
      const savedRates = savedOperator.rates.length === 7
        ? legacyModeIndexes.map((legacyIndex) => savedOperator.rates[legacyIndex])
        : savedOperator.rates;
      operator.rates = operator.rates.map((defaultRate, modeIndex) => {
        const value = savedRates[modeIndex];
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
  const compareFees = compareRate === null ? null : gross * compareRate / 100;

  document.querySelector("#result-provider").textContent = `${provider.name} · ${modes[modeIndex].label}`;
  document.querySelector("#result-rate-value").textContent = rate === null ? "—" : `${formatRate(rate)}%`;
  document.querySelector("#result-fees").textContent = fees === null ? "Cadastre a taxa" : currency.format(fees);
  document.querySelector("#result-compare-provider").textContent = `${comparison.name} · ${modes[modeIndex].label}`;
  document.querySelector("#result-compare-rate").textContent = compareRate === null ? "—" : `${formatRate(compareRate)}%`;
  document.querySelector("#result-compare-fees").textContent = compareFees === null ? "Cadastre a taxa" : currency.format(compareFees);
  document.querySelector("#result-gross").textContent = currency.format(gross);
  document.querySelector("#result-net").textContent = fees === null ? "—" : currency.format(gross - fees);

  const primaryResult = document.querySelector("#comparison-result-primary");
  const secondaryResult = document.querySelector("#comparison-result-secondary");
  const primaryStatus = document.querySelector("#result-primary-status");
  const secondaryStatus = document.querySelector("#result-secondary-status");
  [primaryResult, secondaryResult].forEach((result) => result.classList.remove("is-best", "is-higher"));
  if (rate === null || compareRate === null) {
    primaryStatus.textContent = rate === null ? "Informe a taxa" : "Aguardando comparação";
    secondaryStatus.textContent = compareRate === null ? "Informe a taxa" : "Aguardando comparação";
  } else if (rate < compareRate) {
    primaryResult.classList.add("is-best");
    secondaryResult.classList.add("is-higher");
    primaryStatus.textContent = "Menor taxa";
    secondaryStatus.textContent = "Maior taxa";
  } else if (compareRate < rate) {
    primaryResult.classList.add("is-higher");
    secondaryResult.classList.add("is-best");
    primaryStatus.textContent = "Maior taxa";
    secondaryStatus.textContent = "Menor taxa";
  } else {
    primaryResult.classList.add("is-best");
    secondaryResult.classList.add("is-best");
    primaryStatus.textContent = "Taxas iguais";
    secondaryStatus.textContent = "Taxas iguais";
  }

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

document.querySelector("#reset-rates").addEventListener("click", () => {
  try {
    localStorage.removeItem(storageKey);
    window.location.reload();
  } catch {
    saveNotice.textContent = "Não foi possível restaurar as taxas. Verifique as configurações do navegador.";
  }
});


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
