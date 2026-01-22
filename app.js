const clockEl = document.getElementById("clock");
const totalTossesEl = document.getElementById("total-tosses");
const headsRateEl = document.getElementById("heads-rate");
const fairValueEl = document.getElementById("fair-value");
const volatilityEl = document.getElementById("volatility");
const regimeEl = document.getElementById("regime");
const streakEl = document.getElementById("streak");
const lastResultEl = document.getElementById("last-result");
const orderbookEl = document.getElementById("orderbook");
const tapeEl = document.getElementById("tape");
const streakPremiumEl = document.getElementById("streak-premium");
const liquidityRateEl = document.getElementById("liquidity-rate");
const executionModeEl = document.getElementById("execution-mode");
const limitPriceEl = document.getElementById("limit-price");
const sessionLogsEl = document.getElementById("session-logs");
const exportLogsEl = document.getElementById("export-logs");
const researchGridEl = document.getElementById("research-grid");
const riskNetExposureEl = document.getElementById("risk-net-exposure");
const riskLeverageEl = document.getElementById("risk-leverage");
const riskDrawdownEl = document.getElementById("risk-drawdown");
const riskTableEl = document.getElementById("risk-table");

const tradeTableEl = document.getElementById("trade-table");
const marketTableEl = document.getElementById("market-table");
const diggerTableEl = document.getElementById("digger-table");
const positionsBodyEl = document.getElementById("positions-body");
const messageEl = document.getElementById("message");

const cashEl = document.getElementById("portfolio-cash");
const equityEl = document.getElementById("portfolio-equity");
const exposureEl = document.getElementById("portfolio-exposure");
const marginEl = document.getElementById("portfolio-margin");
const pnlEl = document.getElementById("portfolio-pnl");
const resetEl = document.getElementById("reset");

const chartCanvas = document.getElementById("price-chart");
const chartCtx = chartCanvas.getContext("2d");

const STORAGE_KEY = "asx2up-portfolio";
const LOGS_KEY = "asx2up-session-logs";
const STARTING_CASH = 500;
const SPREAD = 0.004;
const FEE_RATE = 0.002;
const MAX_LEVERAGE = 3;
const MAINT_MARGIN = 0.2;

const formatMoney = (value) => `$${value.toFixed(2)}`;
const formatPercent = (value) => `${(value * 100).toFixed(2)}%`;

const state = {
  history: [],
  outcomes: [],
  totalTosses: 0,
  streakCount: 0,
  lastResult: "",
  tape: [],
  logs: [],
  orderQueue: [],
  peakEquity: STARTING_CASH,
  maxDrawdown: 0,
  products: [],
  players: [],
  portfolio: {
    cash: STARTING_CASH,
    positions: {},
  },
};

const createProducts = () => [
  {
    symbol: "2UP-HH",
    name: "Two Heads Contract",
    type: "Prediction",
    price: 0.5,
    change: 0,
    volume: 0,
  },
  {
    symbol: "2UP-TAIL",
    name: "Any Tails Contract",
    type: "Prediction",
    price: 0.5,
    change: 0,
    volume: 0,
  },
  {
    symbol: "2UP-FUT-30",
    name: "Two-Up Futures 30D",
    type: "Futures",
    price: 50,
    change: 0,
    volume: 0,
  },
  {
    symbol: "2UP-FUT-90",
    name: "Two-Up Futures 90D",
    type: "Futures",
    price: 52,
    change: 0,
    volume: 0,
  },
  {
    symbol: "DGR-01",
    name: "Digger Player Index A",
    type: "Digger",
    price: 100,
    change: 0,
    volume: 0,
  },
  {
    symbol: "DGR-02",
    name: "Digger Player Index B",
    type: "Digger",
    price: 100,
    change: 0,
    volume: 0,
  },
  {
    symbol: "DGR-03",
    name: "Digger Player Index C",
    type: "Digger",
    price: 100,
    change: 0,
    volume: 0,
  },
  {
    symbol: "2UP-ETF",
    name: "Two-Up Regime ETF",
    type: "ETF",
    price: 100,
    change: 0,
    volume: 0,
  },
  {
    symbol: "STREAK-PRO",
    name: "Streak Protection Option",
    type: "Options",
    price: 3.5,
    change: 0,
    volume: 0,
  },
];

const createPlayers = () => [
  {
    id: "DGR-01",
    name: "Sydney Floor",
    bias: "Heads",
    level: 100,
    vol: 0.12,
    change: 0,
    wins: 0,
    losses: 0,
    momentum: [],
  },
  {
    id: "DGR-02",
    name: "Melbourne Rail",
    bias: "Neutral",
    level: 100,
    vol: 0.1,
    change: 0,
    wins: 0,
    losses: 0,
    momentum: [],
  },
  {
    id: "DGR-03",
    name: "Perth Yard",
    bias: "Tails",
    level: 100,
    vol: 0.14,
    change: 0,
    wins: 0,
    losses: 0,
    momentum: [],
  },
  {
    id: "DGR-04",
    name: "Adelaide Bench",
    bias: "Heads",
    level: 100,
    vol: 0.11,
    change: 0,
    wins: 0,
    losses: 0,
    momentum: [],
  },
  {
    id: "DGR-05",
    name: "Brisbane Ring",
    bias: "Tails",
    level: 100,
    vol: 0.13,
    change: 0,
    wins: 0,
    losses: 0,
    momentum: [],
  },
];

const loadPortfolio = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return;
  try {
    const data = JSON.parse(stored);
    if (typeof data.cash === "number" && typeof data.positions === "object") {
      state.portfolio = data;
    }
  } catch (error) {
    console.warn("Portfolio reset", error);
  }
};

const loadLogs = () => {
  const stored = localStorage.getItem(LOGS_KEY);
  if (!stored) return;
  try {
    const data = JSON.parse(stored);
    if (Array.isArray(data)) {
      state.logs = data;
    }
  } catch (error) {
    console.warn("Session logs reset", error);
  }
};

const saveLogs = () => {
  localStorage.setItem(LOGS_KEY, JSON.stringify(state.logs));
};

const renderLogs = () => {
  sessionLogsEl.innerHTML = "";
  state.logs.slice(0, 30).forEach((entry) => {
    const line = document.createElement("div");
    line.className = "log-line";
    line.innerHTML = `
      <span>${entry.time}</span>
      <span>${entry.type}</span>
      <span>${entry.text}</span>
    `;
    sessionLogsEl.appendChild(line);
  });
};

const exportLogs = () => {
  if (!state.logs.length) {
    showMessage("No session logs to export.");
    return;
  }
  const data = JSON.stringify(state.logs, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "asx2up-session-logs.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  addLog("SYSTEM", "Session logs exported.");
};

const addLog = (type, text) => {
  const time = new Date().toLocaleTimeString("en-AU", { hour12: false });
  state.logs.unshift({ time, type, text });
  if (state.logs.length > 80) {
    state.logs.pop();
  }
  saveLogs();
  renderLogs();
};

const savePortfolio = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.portfolio));
};

const resetPortfolio = () => {
  state.portfolio = { cash: STARTING_CASH, positions: {} };
  savePortfolio();
  addLog("SYSTEM", "Portfolio reset to $500.00");
  showMessage("Portfolio reset to $500.00.");
  renderPortfolio();
  renderPositions();
};

const showMessage = (text) => {
  messageEl.textContent = text;
  setTimeout(() => {
    if (messageEl.textContent === text) {
      messageEl.textContent = "";
    }
  }, 2400);
};

const updateClock = () => {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString("en-AU", {
    hour12: false,
  });
};

const drawChart = (values) => {
  const width = chartCanvas.width;
  const height = chartCanvas.height;
  chartCtx.clearRect(0, 0, width, height);

  chartCtx.strokeStyle = "rgba(255, 159, 28, 0.7)";
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

  chartCtx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  chartCtx.beginPath();
  chartCtx.moveTo(0, height / 2);
  chartCtx.lineTo(width, height / 2);
  chartCtx.stroke();
};

const updateTape = (label, price) => {
  const now = new Date();
  state.tape.unshift({
    time: now.toLocaleTimeString("en-AU", { hour12: false }),
    label,
    price,
  });
  if (state.tape.length > 20) {
    state.tape.pop();
  }
  tapeEl.innerHTML = "";
  state.tape.forEach((entry) => {
    const line = document.createElement("div");
    line.className = "tape-line";
    line.innerHTML = `
      <span>${entry.time}</span>
      <span>${entry.label}</span>
      <span>${formatMoney(entry.price)}</span>
    `;
    tapeEl.appendChild(line);
  });
};

const updateOrderbook = (midPrice) => {
  orderbookEl.innerHTML = "";
  for (let i = 0; i < 6; i += 1) {
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
    orderbookEl.appendChild(row);
  }
};

const updatePlayers = (isHeads) => {
  state.players.forEach((player) => {
    const biasFactor = player.bias === "Heads" ? 1 : player.bias === "Tails" ? -1 : 0;
    const outcomeImpact = isHeads ? 1 : -1;
    const drift = biasFactor * outcomeImpact * 0.35 + (Math.random() - 0.5) * 0.6;
    const change = drift + (Math.random() - 0.5) * player.vol;
    player.level = Math.max(80, player.level + change);
    player.change = change;
    player.momentum.unshift(change);
    if (player.momentum.length > 5) {
      player.momentum.pop();
    }
    if (player.bias === "Neutral") {
      if (Math.random() > 0.5) {
        player.wins += 1;
      } else {
        player.losses += 1;
      }
    } else if ((isHeads && player.bias === "Heads") || (!isHeads && player.bias === "Tails")) {
      player.wins += 1;
    } else {
      player.losses += 1;
    }
  });
};

const syncProductPrices = (headsRate, volatility) => {
  const hh = state.products.find((product) => product.symbol === "2UP-HH");
  const tail = state.products.find((product) => product.symbol === "2UP-TAIL");
  const fut30 = state.products.find((product) => product.symbol === "2UP-FUT-30");
  const fut90 = state.products.find((product) => product.symbol === "2UP-FUT-90");
  const etf = state.products.find((product) => product.symbol === "2UP-ETF");
  const streak = state.products.find((product) => product.symbol === "STREAK-PRO");

  const basePrice = Math.min(0.95, Math.max(0.05, headsRate));
  const newHhPrice = basePrice;
  const newTailPrice = 1 - basePrice;

  hh.change = newHhPrice - hh.price;
  hh.price = newHhPrice;

  tail.change = newTailPrice - tail.price;
  tail.price = newTailPrice;

  fut30.change = headsRate * 100 - fut30.price;
  fut30.price = Math.max(35, headsRate * 100 + (Math.random() - 0.5) * 2);

  fut90.change = headsRate * 100 - fut90.price;
  fut90.price = Math.max(38, headsRate * 100 + 2 + (Math.random() - 0.5) * 3);

  etf.change = (headsRate - 0.5) * 2;
  etf.price = 100 + (headsRate - 0.5) * 18 + (Math.random() - 0.5) * 1.5;

  const streakPremium = Math.min(20, 2 + state.streakCount * 0.6 + volatility * 10);
  streak.change = streakPremium - streak.price;
  streak.price = streakPremium;

  state.players.forEach((player) => {
    const product = state.products.find((item) => item.symbol === player.id);
    if (product) {
      product.change = player.change;
      product.price = player.level;
    }
  });
};

const updateProductsVolume = () => {
  state.products.forEach((product) => {
    product.volume += Math.floor(Math.random() * 8);
  });
};

const updateLiquidityRate = () => {
  const rate = 0.012 + Math.random() * 0.01;
  liquidityRateEl.textContent = formatPercent(rate);
};

const updateMarketTables = () => {
  marketTableEl.innerHTML = "";
  state.products.forEach((product) => {
    const bid = product.price * (1 - SPREAD);
    const ask = product.price * (1 + SPREAD);
    const row = document.createElement("tr");
    const changeClass = product.change >= 0 ? "positive" : "negative";
    row.innerHTML = `
      <td>${product.symbol}</td>
      <td>${product.name}</td>
      <td>${formatMoney(bid)}</td>
      <td>${formatMoney(ask)}</td>
      <td>${formatMoney(product.price)}</td>
      <td class="${changeClass}">${product.change.toFixed(2)}</td>
      <td>${product.volume}</td>
    `;
    marketTableEl.appendChild(row);
  });
};

const renderResearchPanel = () => {
  researchGridEl.innerHTML = "";
  state.players.forEach((player) => {
    const total = player.wins + player.losses || 1;
    const winRate = player.wins / total;
    const momentum = player.momentum.reduce((sum, value) => sum + value, 0);
    const card = document.createElement("div");
    card.className = "research-card";
    card.innerHTML = `
      <h4>${player.name}</h4>
      <div class="research-metrics">
        <div><span class="label">Bias</span> ${player.bias}</div>
        <div><span class="label">Index Level</span> ${player.level.toFixed(2)}</div>
        <div><span class="label">Strike Rate</span> ${formatPercent(winRate)}</div>
        <div><span class="label">Momentum (5)</span> ${momentum.toFixed(2)}</div>
      </div>
    `;
    researchGridEl.appendChild(card);
  });
};

const renderTradeTable = () => {
  tradeTableEl.innerHTML = "";
  state.products.forEach((product) => {
    const row = document.createElement("tr");
    const position = state.portfolio.positions[product.symbol]?.qty || 0;
    const changeClass = product.change >= 0 ? "positive" : "negative";
    row.innerHTML = `
      <td>${product.symbol}</td>
      <td>${product.name}</td>
      <td>${formatMoney(product.price)}</td>
      <td class="${changeClass}">${product.change.toFixed(2)}</td>
      <td>${position}</td>
      <td><input type="number" min="1" value="1" data-symbol="${product.symbol}" /></td>
      <td>
        <button data-action="buy" data-symbol="${product.symbol}">Buy</button>
        <button class="sell" data-action="sell" data-symbol="${product.symbol}">Sell</button>
      </td>
    `;
    tradeTableEl.appendChild(row);
  });
};

const renderPositions = () => {
  positionsBodyEl.innerHTML = "";
  Object.entries(state.portfolio.positions).forEach(([symbol, position]) => {
    if (position.qty === 0) return;
    const product = state.products.find((item) => item.symbol === symbol);
    if (!product) return;
    const mark = product.price;
    const pnl = (mark - position.avgCost) * position.qty;
    const pnlClass = pnl >= 0 ? "positive" : "negative";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${symbol}</td>
      <td>${position.qty}</td>
      <td>${formatMoney(position.avgCost)}</td>
      <td>${formatMoney(mark)}</td>
      <td class="${pnlClass}">${formatMoney(pnl)}</td>
    `;
    positionsBodyEl.appendChild(row);
  });
};

const calculateExposure = (positions) =>
  Object.entries(positions).reduce((sum, [symbol, position]) => {
    const product = state.products.find((item) => item.symbol === symbol);
    if (!product) return sum;
    return sum + Math.abs(position.qty) * product.price;
  }, 0);

const calculateEquity = (positions, cash) =>
  Object.entries(positions).reduce((sum, [symbol, position]) => {
    const product = state.products.find((item) => item.symbol === symbol);
    if (!product) return sum;
    return sum + position.qty * product.price;
  }, cash);

const renderPortfolio = () => {
  const exposure = calculateExposure(state.portfolio.positions);
  const equity = calculateEquity(state.portfolio.positions, state.portfolio.cash);
  const pnl = equity - STARTING_CASH;
  const marginUse = exposure === 0 ? 0 : (exposure / (equity * MAX_LEVERAGE)) * 100;

  cashEl.textContent = formatMoney(state.portfolio.cash);
  equityEl.textContent = formatMoney(equity);
  exposureEl.textContent = formatMoney(exposure);
  marginEl.textContent = `${Math.max(0, marginUse).toFixed(1)}%`;
  pnlEl.textContent = formatMoney(pnl);
  pnlEl.className = pnl >= 0 ? "positive" : "negative";

  if (equity > state.peakEquity) {
    state.peakEquity = equity;
  }
  const drawdown = state.peakEquity === 0 ? 0 : (state.peakEquity - equity) / state.peakEquity;
  state.maxDrawdown = Math.max(state.maxDrawdown, drawdown);
};

const renderRiskPanel = () => {
  const exposure = calculateExposure(state.portfolio.positions);
  const equity = calculateEquity(state.portfolio.positions, state.portfolio.cash);
  const netExposure = Object.entries(state.portfolio.positions).reduce(
    (sum, [symbol, position]) => {
      const product = state.products.find((item) => item.symbol === symbol);
      if (!product) return sum;
      return sum + position.qty * product.price;
    },
    0
  );
  const leverage = equity === 0 ? 0 : exposure / equity;

  riskNetExposureEl.textContent = formatMoney(netExposure);
  riskLeverageEl.textContent = `${leverage.toFixed(1)}x`;
  riskDrawdownEl.textContent = formatPercent(state.maxDrawdown);

  const typeExposure = state.products.reduce((acc, product) => {
    const position = state.portfolio.positions[product.symbol];
    if (!position || position.qty === 0) return acc;
    const value = Math.abs(position.qty) * product.price;
    acc[product.type] = (acc[product.type] || 0) + value;
    return acc;
  }, {});

  riskTableEl.innerHTML = "";
  Object.entries(typeExposure).forEach(([type, value]) => {
    const weight = exposure === 0 ? 0 : value / exposure;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${type}</td>
      <td>${formatMoney(value)}</td>
      <td>${formatPercent(weight)}</td>
    `;
    riskTableEl.appendChild(row);
  });

  if (!Object.keys(typeExposure).length) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td colspan="3">No open exposure</td>
    `;
    riskTableEl.appendChild(row);
  }
};

const validateMargin = (positions, cash) => {
  const exposure = calculateExposure(positions);
  const equity = calculateEquity(positions, cash);
  if (exposure === 0) return true;
  const leverageOk = exposure <= equity * MAX_LEVERAGE;
  const maintOk = equity >= exposure * MAINT_MARGIN;
  return leverageOk && maintOk;
};

const executeTrade = (symbol, qty, side, tradePrice) => {
  const product = state.products.find((item) => item.symbol === symbol);
  if (!product) return;
  const qtyAbs = Math.abs(qty);
  const price =
    tradePrice ?? product.price * (side === "buy" ? 1 + SPREAD : 1 - SPREAD);
  const notional = price * qtyAbs;
  const fee = notional * FEE_RATE;
  const cashChange = side === "buy" ? -(notional + fee) : notional - fee;

  const positionsCopy = JSON.parse(JSON.stringify(state.portfolio.positions));
  const current = positionsCopy[symbol] || { qty: 0, avgCost: product.price };
  const newQty = side === "buy" ? current.qty + qtyAbs : current.qty - qtyAbs;
  let newAvgCost = current.avgCost;

  if (side === "buy") {
    if (current.qty >= 0) {
      newAvgCost = (current.avgCost * current.qty + price * qtyAbs) / (current.qty + qtyAbs);
    } else if (newQty < 0) {
      newAvgCost = current.avgCost;
    } else {
      newAvgCost = price;
    }
  } else if (side === "sell") {
    if (current.qty <= 0) {
      const currentAbs = Math.abs(current.qty);
      newAvgCost = (current.avgCost * currentAbs + price * qtyAbs) / (currentAbs + qtyAbs);
    } else if (newQty > 0) {
      newAvgCost = current.avgCost;
    } else {
      newAvgCost = price;
    }
  }

  positionsCopy[symbol] = { qty: newQty, avgCost: newAvgCost };
  const newCash = state.portfolio.cash + cashChange;

  if (!validateMargin(positionsCopy, newCash)) {
    showMessage("Trade rejected: margin or leverage limit breached.");
    return;
  }

  state.portfolio.cash = newCash;
  state.portfolio.positions = positionsCopy;
  product.volume += qtyAbs;
  savePortfolio();
  addLog(
    "TRADE",
    `${side.toUpperCase()} ${qtyAbs} ${symbol} @ ${formatMoney(price)} fee ${formatMoney(fee)}`
  );
  showMessage(`${side.toUpperCase()} ${qtyAbs} ${symbol} @ ${formatMoney(price)} (fee ${formatMoney(fee)})`);
  renderPortfolio();
  renderPositions();
  renderTradeTable();
};

const queueOrder = (symbol, qty, side, limitPrice) => {
  state.orderQueue.push({
    symbol,
    qty,
    side,
    limit: limitPrice,
    time: new Date().toLocaleTimeString("en-AU", { hour12: false }),
  });
  addLog("ORDER", `${side.toUpperCase()} ${qty} ${symbol} LMT ${formatMoney(limitPrice)}`);
  showMessage(`Limit order queued: ${side} ${qty} ${symbol} @ ${formatMoney(limitPrice)}`);
};

const handleTradeClick = (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const action = button.dataset.action;
  const symbol = button.dataset.symbol;
  const input = tradeTableEl.querySelector(`input[data-symbol="${symbol}"]`);
  const qty = Number(input?.value || 0);
  if (!qty || qty <= 0) {
    showMessage("Enter a valid quantity.");
    return;
  }
  const mode = executionModeEl.value;
  const side = action === "buy" ? "buy" : "sell";
  if (mode === "limit") {
    const limitPrice = Number(limitPriceEl.value);
    if (!limitPrice || limitPrice <= 0) {
      showMessage("Enter a valid limit price.");
      return;
    }
    queueOrder(symbol, qty, side, limitPrice);
    return;
  }
  executeTrade(symbol, qty, side);
};

const renderDiggerTable = () => {
  diggerTableEl.innerHTML = "";
  state.players.forEach((player) => {
    const changeClass = player.change >= 0 ? "positive" : "negative";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${player.name}</td>
      <td>${player.bias}</td>
      <td>${player.level.toFixed(2)}</td>
      <td class="${changeClass}">${player.change.toFixed(2)}</td>
      <td>${formatPercent(player.vol)}</td>
    `;
    diggerTableEl.appendChild(row);
  });
};

const processQueuedOrders = () => {
  const remaining = [];
  state.orderQueue.forEach((order) => {
    const product = state.products.find((item) => item.symbol === order.symbol);
    if (!product) return;
    const meetsBuy = order.side === "buy" && product.price <= order.limit;
    const meetsSell = order.side === "sell" && product.price >= order.limit;
    if (meetsBuy || meetsSell) {
      executeTrade(order.symbol, order.qty, order.side, order.limit);
      addLog("FILL", `${order.symbol} ${order.side.toUpperCase()} @ ${formatMoney(order.limit)}`);
    } else {
      remaining.push(order);
    }
  });
  state.orderQueue = remaining;
};

const simulateToss = () => {
  const coinOne = Math.random() > 0.5 ? "H" : "T";
  const coinTwo = Math.random() > 0.5 ? "H" : "T";
  const outcome = `${coinOne}${coinTwo}`;
  const isHeads = outcome === "HH";

  state.outcomes.push(isHeads ? 1 : 0);
  if (state.outcomes.length > 60) {
    state.outcomes.shift();
  }

  state.totalTosses += 1;
  totalTossesEl.textContent = state.totalTosses.toLocaleString("en-AU");

  const rollingWindow = state.outcomes.slice(-30);
  const headsRate = rollingWindow.reduce((sum, value) => sum + value, 0) / rollingWindow.length;
  const mean = headsRate;
  const variance = rollingWindow.reduce((sum, value) => sum + (value - mean) ** 2, 0) / rollingWindow.length;
  const volatility = Math.sqrt(variance);

  headsRateEl.textContent = formatPercent(headsRate);
  fairValueEl.textContent = formatMoney(headsRate);
  volatilityEl.textContent = formatPercent(volatility);

  const resultLabel = isHeads ? "Two Heads" : "Any Tails";
  lastResultEl.textContent = resultLabel;

  if (resultLabel === state.lastResult) {
    state.streakCount += 1;
  } else {
    state.streakCount = 1;
    state.lastResult = resultLabel;
  }

  streakEl.textContent = `${state.streakCount} ${resultLabel}`;
  if (headsRate > 0.6) {
    regimeEl.textContent = "Heads Biased";
  } else if (headsRate < 0.4) {
    regimeEl.textContent = "Tails Defensive";
  } else {
    regimeEl.textContent = "Neutral";
  }

  state.history.push(headsRate);
  if (state.history.length > 60) {
    state.history.shift();
  }
  drawChart(state.history);

  updatePlayers(isHeads);
  syncProductPrices(headsRate, volatility);
  updateProductsVolume();
  updateOrderbook(state.products[0].price);
  updateTape(resultLabel, state.products[0].price);
  updateMarketTables();
  renderDiggerTable();
  renderResearchPanel();
  renderTradeTable();
  renderPortfolio();
  renderPositions();
  renderRiskPanel();
  renderLogs();
  processQueuedOrders();

  const streakPremium = state.products.find((product) => product.symbol === "STREAK-PRO");
  if (streakPremium) {
    streakPremiumEl.textContent = formatMoney(streakPremium.price);
  }
  updateLiquidityRate();
};

const init = () => {
  loadPortfolio();
  loadLogs();
  state.products = createProducts();
  state.players = createPlayers();

  tradeTableEl.addEventListener("click", handleTradeClick);
  resetEl.addEventListener("click", resetPortfolio);
  exportLogsEl.addEventListener("click", exportLogs);

  updateClock();
  renderTradeTable();
  renderPortfolio();
  renderPositions();
  renderDiggerTable();
  renderResearchPanel();
  renderLogs();
  renderRiskPanel();

  for (let i = 0; i < 12; i += 1) {
    simulateToss();
  }

  setInterval(updateClock, 1000);
  setInterval(simulateToss, 1400);
};

init();
