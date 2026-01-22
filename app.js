const feed = document.getElementById("coin-feed");
const totalTossesEl = document.getElementById("total-tosses");
const headsRateEl = document.getElementById("heads-rate");
const fairValueEl = document.getElementById("fair-value");
const volatilityEl = document.getElementById("volatility");
const lastResultEl = document.getElementById("last-result");
const streakEl = document.getElementById("streak");
const regimeEl = document.getElementById("regime");
const clockEl = document.getElementById("clock");

const yesPriceEl = document.getElementById("yes-price");
const noPriceEl = document.getElementById("no-price");
const yesBidEl = document.getElementById("yes-bid");
const yesAskEl = document.getElementById("yes-ask");
const noBidEl = document.getElementById("no-bid");
const noAskEl = document.getElementById("no-ask");

const yesBookEl = document.getElementById("yes-orderbook");
const noBookEl = document.getElementById("no-orderbook");

const volSwapStrikeEl = document.getElementById("vol-swap-strike");
const volSwapPriceEl = document.getElementById("vol-swap-price");
const volSwapBidEl = document.getElementById("vol-swap-bid");
const volSwapAskEl = document.getElementById("vol-swap-ask");
const yieldNoteEl = document.getElementById("yield-note");
const regimeEtfEl = document.getElementById("regime-etf");

const chartCanvas = document.getElementById("price-chart");
const chartCtx = chartCanvas.getContext("2d");

const history = [];
const outcomes = [];
const maxFeed = 24;
const chartPoints = 60;
let totalTosses = 0;
let streakCount = 0;
let lastOutcome = "";

const formatMoney = (value) => `$${value.toFixed(2)}`;
const formatPercent = (value) => `${(value * 100).toFixed(2)}%`;

const drawChart = (values) => {
  const width = chartCanvas.width;
  const height = chartCanvas.height;
  chartCtx.clearRect(0, 0, width, height);

  chartCtx.strokeStyle = "rgba(79, 179, 255, 0.35)";
  chartCtx.lineWidth = 1;
  chartCtx.beginPath();
  const stepX = width / (values.length - 1 || 1);
  values.forEach((value, index) => {
    const x = index * stepX;
    const y = height - value * height;
    if (index === 0) {
      chartCtx.moveTo(x, y);
    } else {
      chartCtx.lineTo(x, y);
    }
  });
  chartCtx.stroke();

  chartCtx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  chartCtx.beginPath();
  chartCtx.moveTo(0, height / 2);
  chartCtx.lineTo(width, height / 2);
  chartCtx.stroke();
};

const updateOrderBook = (bookEl, midPrice) => {
  bookEl.innerHTML = "";
  for (let i = 0; i < 5; i += 1) {
    const bid = Math.max(0.01, midPrice - 0.01 * (i + 1) - Math.random() * 0.01);
    const ask = Math.min(0.99, midPrice + 0.01 * (i + 1) + Math.random() * 0.01);
    const bidSize = Math.floor(20 + Math.random() * 80);
    const askSize = Math.floor(20 + Math.random() * 80);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatMoney(bid)}</td>
      <td>${bidSize}</td>
      <td>${formatMoney(ask)}</td>
      <td>${askSize}</td>
    `;
    bookEl.appendChild(row);
  }
};

const updateClock = () => {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString("en-AU", {
    hour12: false,
  });
};

const simulateToss = () => {
  const coinOne = Math.random() > 0.5 ? "H" : "T";
  const coinTwo = Math.random() > 0.5 ? "H" : "T";
  const outcome = `${coinOne}${coinTwo}`;
  const isHeads = outcome === "HH";

  outcomes.push(isHeads ? 1 : 0);
  if (outcomes.length > chartPoints) {
    outcomes.shift();
  }

  totalTosses += 1;
  totalTossesEl.textContent = totalTosses.toLocaleString("en-AU");

  const rollingWindow = outcomes.slice(-30);
  const headsRate = rollingWindow.reduce((sum, value) => sum + value, 0) / rollingWindow.length;

  const mean = headsRate;
  const variance = rollingWindow.reduce((sum, value) => sum + (value - mean) ** 2, 0) / rollingWindow.length;
  const volatility = Math.sqrt(variance);

  headsRateEl.textContent = formatPercent(headsRate);
  fairValueEl.textContent = formatMoney(headsRate);
  volatilityEl.textContent = formatPercent(volatility);

  history.push(headsRate);
  if (history.length > chartPoints) {
    history.shift();
  }
  drawChart(history);

  const resultLabel = isHeads ? "Two Heads" : "Any Tails";
  lastResultEl.textContent = resultLabel;

  if (resultLabel === lastOutcome) {
    streakCount += 1;
  } else {
    streakCount = 1;
    lastOutcome = resultLabel;
  }

  streakEl.textContent = `${streakCount} ${resultLabel}`;
  if (headsRate > 0.6) {
    regimeEl.textContent = "Heads Biased";
  } else if (headsRate < 0.4) {
    regimeEl.textContent = "Tails Defensive";
  } else {
    regimeEl.textContent = "Neutral";
  }

  const coinEl = document.createElement("div");
  coinEl.className = `coin ${isHeads ? "heads" : "tails"}`;
  coinEl.textContent = outcome;
  feed.prepend(coinEl);
  while (feed.children.length > maxFeed) {
    feed.removeChild(feed.lastChild);
  }

  const yesPrice = Math.min(0.95, Math.max(0.05, headsRate));
  const noPrice = 1 - yesPrice;

  yesPriceEl.textContent = formatMoney(yesPrice);
  noPriceEl.textContent = formatMoney(noPrice);

  const yesBid = Math.max(0.01, yesPrice - 0.02 - Math.random() * 0.01);
  const yesAsk = Math.min(0.99, yesPrice + 0.02 + Math.random() * 0.01);
  const noBid = Math.max(0.01, noPrice - 0.02 - Math.random() * 0.01);
  const noAsk = Math.min(0.99, noPrice + 0.02 + Math.random() * 0.01);

  yesBidEl.textContent = formatMoney(yesBid);
  yesAskEl.textContent = formatMoney(yesAsk);
  noBidEl.textContent = formatMoney(noBid);
  noAskEl.textContent = formatMoney(noAsk);

  updateOrderBook(yesBookEl, yesPrice);
  updateOrderBook(noBookEl, noPrice);

  const volSwapStrike = 0.1 + Math.random() * 0.05;
  volSwapStrikeEl.textContent = formatPercent(volSwapStrike);
  const volSwapPrice = 1 + volatility * 10;
  volSwapPriceEl.textContent = formatMoney(volSwapPrice);
  volSwapBidEl.textContent = formatMoney(volSwapPrice - 0.08);
  volSwapAskEl.textContent = formatMoney(volSwapPrice + 0.08);

  const yieldNote = 0.03 + streakCount * 0.002 + Math.random() * 0.01;
  yieldNoteEl.textContent = formatPercent(yieldNote);

  const regimeEtf = 100 + (headsRate - 0.5) * 20 + Math.random() * 0.4;
  regimeEtfEl.textContent = formatMoney(regimeEtf);
};

updateClock();
setInterval(updateClock, 1000);

for (let i = 0; i < 10; i += 1) {
  simulateToss();
}

setInterval(simulateToss, 1200);
