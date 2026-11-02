const operators = [
  { id: "rv", name: "RV Pay", mark: "RV", rates: [0.9, 1.62, 3.13, 4.68, 5.47, 6.24, null] },
  { id: "infinite", name: "InfiniteTap", mark: "∞", rates: [1.37, null, null, null, null, null, null] },
  { id: "stone", name: "Stone", mark: "ST", rates: Array(7).fill(null) },
  { id: "pagbank", name: "PagBank", mark: "PG", rates: Array(7).fill(null) },
  { id: "cielo", name: "Cielo", mark: "CI", rates: Array(7).fill(null) },
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
    if (!Array.isArray(saved) || saved.length !== operators.length) return;
    saved.forEach((operator, operatorIndex) => {
      if (!Array.isArray(operator.rates)) return;
      operators[operatorIndex].rates = operators[operatorIndex].rates.map((defaultRate, modeIndex) => {
        const value = operator.rates[modeIndex];
        return value === null || value === "" || value === undefined ? null : Number(value);
      });
    });
  } catch {
    localStorage.removeItem(storageKey);
  }
}

function saveRates() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(operators.map(({ id, rates }) => ({ id, rates }))));
    saveNotice.textContent = "Taxas salvas neste navegador.";
  } catch {
    saveNotice.textContent = "Não foi possível salvar. Verifique as configurações do navegador.";
  }
  clearTimeout(noticeTimeout);
  noticeTimeout = setTimeout(() => {
    saveNotice.textContent = "Suas taxas são salvas automaticamente neste navegador.";
  }, 2400);
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
    input.addEventListener("change", saveRates);
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
    savings.textContent = `Cadastre a taxa de ${comparison.name} para comparar sua economia.`;
  } else {
    const difference = gross * (compareRate - rate) / 100;
    if (difference > 0) savings.textContent = `Você economiza ${currency.format(difference)} por mês em relação à ${comparison.name}.`;
    else if (difference < 0) savings.textContent = `A ${comparison.name} representa ${currency.format(Math.abs(difference))} a menos por mês neste cenário.`;
    else savings.textContent = `As duas operadoras têm o mesmo custo nesta modalidade.`;
  }
}

function onRateInput(event) {
  const input = event.currentTarget;
  const operatorIndex = Number(input.dataset.operator);
  const modeIndex = Number(input.dataset.mode);
  const raw = input.value;
  const value = raw === "" ? null : Number(raw);
  if (value !== null && (!Number.isFinite(value) || value < 0 || value > 100)) return;
  operators[operatorIndex].rates[modeIndex] = value;
  const rowInputs = [...body.querySelectorAll(`.rate-input[data-mode="${modeIndex}"]`)];
  const rates = rowInputs.map((rowInput) => rowInput.value === "" ? null : Number(rowInput.value)).filter((rate) => rate !== null && Number.isFinite(rate) && rate >= 0);
  const minimum = rates.length ? Math.min(...rates) : null;
  rowInputs.forEach((rowInput) => rowInput.classList.toggle("is-winner", rowInput.value !== "" && minimum !== null && Number(rowInput.value) === minimum));
  calculate();
}

document.querySelector("#reset-rates").addEventListener("click", () => {
  localStorage.removeItem(storageKey);
  window.location.reload();
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
  installButton.classList.add("is-installable");
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

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
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
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

loadRates();
populateSelects();
renderTable();
calculate();