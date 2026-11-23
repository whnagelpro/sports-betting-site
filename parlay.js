const PARLAY_ODDS_URLS = {
  nba: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=1553479471&single=true&output=csv",
  nhl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYTgu9bsGUhI1gicOOfLrgYHmNMfrl3W1OKhAVs9cdrdd2CagJZSVM3F25hQ8vk0aRK7hapVmbNWQP/pub?gid=959803781&single=true&output=csv",
  mlb: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=989861231&single=true&output=csv",
  nfl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7eg-0liRvxa9q2k6IM2mipst48DHUMa8yXltD8irldOtim2Emic7w0rtl1gfT5xl_AVhR29jBrqY1/pub?gid=1933017030&single=true&output=csv"
};

const PARLAY_PROPS_URLS = {
  nba: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=590324617&single=true&output=csv",
  nhl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYTgu9bsGUhI1gicOOfLrgYHmNMfrl3W1OKhAVs9cdrdd2CagJZSVM3F25hQ8vk0aRK7hapVmbNWQP/pub?gid=1839953184&single=true&output=csv",
  mlb: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=1502960090&single=true&output=csv",
  nfl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7eg-0liRvxa9q2k6IM2mipst48DHUMa8yXltD8irldOtim2Emic7w0rtl1gfT5xl_AVhR29jBrqY1/pub?gid=2077637558&single=true&output=csv"
};

const PARLAY_SCHEDULE_URLS = {
  nba: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=1724367340&single=true&output=csv",
  nhl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYTgu9bsGUhI1gicOOfLrgYHmNMfrl3W1OKhAVs9cdrdd2CagJZSVM3F25hQ8vk0aRK7hapVmbNWQP/pub?gid=2048323486&single=true&output=csv",
  mlb: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=314629327&single=true&output=csv",
  nfl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7eg-0liRvxa9q2k6IM2mipst48DHUMa8yXltD8irldOtim2Emic7w0rtl1gfT5xl_AVhR29jBrqY1/pub?gid=1131205016&single=true&output=csv"
};

const parlayLegs = [];
const parlayCache = {};

function parlayClamp(value, low, high) {
  return Math.min(high, Math.max(low, value));
}

function parlayNumber(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(String(value).replace("%", ""));
  return Number.isFinite(number) ? number : null;
}

function parlayPercent(value) {
  const number = parlayNumber(value);
  if (number === null) return null;
  return number > 1 ? number / 100 : number;
}

function americanToDecimal(odds) {
  const price = Number(odds);
  if (!Number.isFinite(price) || price === 0) return null;
  return price > 0 ? 1 + price / 100 : 1 + 100 / Math.abs(price);
}

function decimalToAmerican(decimal) {
  if (!Number.isFinite(decimal) || decimal <= 1) return null;
  const profit = decimal - 1;
  return profit >= 1 ? Math.round(profit * 100) : Math.round(-100 / profit);
}

function impliedProbability(odds) {
  const price = Number(odds);
  if (!Number.isFinite(price) || price === 0) return null;
  return price > 0 ? 100 / (price + 100) : Math.abs(price) / (Math.abs(price) + 100);
}

function vigFree(sideOdds, otherOdds) {
  const side = impliedProbability(sideOdds);
  const other = impliedProbability(otherOdds);
  if (side === null || other === null || side + other === 0) return null;
  return side / (side + other);
}

function blendProbability(model, history, games) {
  if (!Number.isFinite(model)) return null;
  if (!Number.isFinite(games) || games < 5 || !Number.isFinite(history)) return model;
  return parlayClamp(model * 0.7 + history * 0.3, 0.001, 0.999);
}

function parseParlayCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const source = String(text || "").replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows[0].map(header => header.trim());
  return rows.slice(1).filter(values => values.some(value => String(value).trim() !== "")).map(values => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || "";
    });
    return record;
  });
}

async function loadParlayCSV(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return parseParlayCSV(await response.text());
}

function isFinalStatus(status) {
  const value = String(status || "").trim().toLowerCase();
  return value === "final" || value === "complete" || value === "completed";
}

async function finalGameIds(league) {
  if (parlayCache[`${league}-final`]) return parlayCache[`${league}-final`];
  const rows = await loadParlayCSV(PARLAY_SCHEDULE_URLS[league]);
  const ids = new Set(rows.filter(row => isFinalStatus(row.Status)).map(row => String(row["Game Id"] || "").trim()).filter(Boolean));
  parlayCache[`${league}-final`] = ids;
  return ids;
}

function oddsLegsFromRow(row, league) {
  const away = row["Away Team"] || "Away";
  const home = row["Home Team"] || "Home";
  const gameId = String(row["Game Id"] || "").trim();
  const vendor = row.Vendor || "";
  const matchup = `${away} at ${home}`;
  const totalSample = Math.min(parlayNumber(row["Away Cover Games"]) || 0, parlayNumber(row["Home Cover Games"]) || 0);
  const totalRate = parlayPercent(row["Total Over Rate"]);
  const overProb = blendProbability(parlayNumber(row["Poisson Prob Total Over"]), totalRate, totalSample);
  const underProb = blendProbability(parlayNumber(row["Poisson Prob Total Under"]), totalRate === null ? null : 1 - totalRate, totalSample);
  const awaySpreadProb = blendProbability(vigFree(row["Spread Away Odds"], row["Spread Home Odds"]), parlayPercent(row["Away Cover Rate"]), parlayNumber(row["Away Cover Games"]));
  const homeSpreadProb = blendProbability(vigFree(row["Spread Home Odds"], row["Spread Away Odds"]), parlayPercent(row["Home Cover Rate"]), parlayNumber(row["Home Cover Games"]));
  const awayMlProb = blendProbability(parlayNumber(row["Vig-Free Prob Away ML"]), null, 0);
  const homeMlProb = blendProbability(parlayNumber(row["Vig-Free Prob Home ML"]), null, 0);
  const totalOverRate = parlayPercent(row["Total Over Rate"]);
  const legs = [
    ["Total Over", row["Total Over Odds"], overProb, row["Total Model Confidence"], row["Total Risk Score"], `${matchup} over ${row["Total Value"]}`, totalOverRate, "Total Best Side", "Over", "Total Sportacular Score"],
    ["Total Under", row["Total Under Odds"], underProb, row["Total Model Confidence"], row["Total Risk Score"], `${matchup} under ${row["Total Value"]}`, totalOverRate === null ? null : 1 - totalOverRate, "Total Best Side", "Under", "Total Sportacular Score"],
    ["Spread Away", row["Spread Away Odds"], awaySpreadProb, row["Spread Model Confidence"], row["Spread Risk Score"], `${away} ${row["Spread Away Value"]}`, parlayPercent(row["Away Cover Rate"]), "Spread Best Side", "Away", "Spread Sportacular Score"],
    ["Spread Home", row["Spread Home Odds"], homeSpreadProb, row["Spread Model Confidence"], row["Spread Risk Score"], `${home} ${row["Spread Home Value"]}`, parlayPercent(row["Home Cover Rate"]), "Spread Best Side", "Home", "Spread Sportacular Score"],
    ["Moneyline Away", row["Moneyline Away Odds"], awayMlProb, row["Moneyline Model Confidence"], row["Moneyline Risk Score"], `${away} moneyline`, null, "Moneyline Best Side", "Away", "Moneyline Sportacular Score"],
    ["Moneyline Home", row["Moneyline Home Odds"], homeMlProb, row["Moneyline Model Confidence"], row["Moneyline Risk Score"], `${home} moneyline`, null, "Moneyline Best Side", "Home", "Moneyline Sportacular Score"]
  ];
  return legs.filter(leg => {
    const bestSide = String(row[leg[7]] || "").trim().toLowerCase();
    return bestSide && bestSide !== "no play" && americanToDecimal(leg[1]);
  }).map(leg => {
    const hitRate = leg[6];
    const boardScore = String(row[leg[7]] || "") === leg[8] ? parlayNumber(row[leg[9]]) : null;
    return {
      key: `${league}|${gameId}|${vendor}|${leg[0]}`,
      league: league.toUpperCase(),
      gameId,
      vendor,
      label: `${leg[5]} (${vendor})`,
      odds: Number(leg[1]),
      probability: Number.isFinite(leg[2]) ? leg[2] : null,
      confidence: parlayNumber(leg[3]),
      risk: parlayNumber(leg[4]),
      hitRate: Number.isFinite(hitRate) ? hitRate : null,
      boardScore
    };
  });
}

function propLegsFromRow(row, league) {
  if (String(row["Best Side"] || "").trim().toLowerCase() === "no play") return [];
  const gameId = String(row["Game Id"] || "").trim();
  const player = row["Player Name"] || "Player";
  const propType = row["Prop Type"] || "Prop";
  const line = row["Line Value"] || "";
  const vendor = row.Vendor || "";
  const overProb = parlayNumber(row["Model Prob Over"]);
  const underProb = parlayNumber(row["Model Prob Under"]);
  const confidence = parlayNumber(row["Model Confidence"]);
  const risk = parlayNumber(row["Risk Score"]);
  const legs = [];
  if (americanToDecimal(row["Over Odds"])) {
    legs.push({ side: "Over", odds: Number(row["Over Odds"]), probability: overProb });
  }
  if (americanToDecimal(row["Under Odds"])) {
    legs.push({ side: "Under", odds: Number(row["Under Odds"]), probability: underProb });
  }
  if (!legs.length && americanToDecimal(row.Odds)) {
    const side = row["Best Side"] && row["Best Side"] !== "No Play" ? row["Best Side"] : "Over";
    legs.push({
      side,
      odds: Number(row.Odds),
      probability: side.toLowerCase() === "under" ? underProb : (parlayNumber(row["Best Model Probability"]) || overProb)
    });
  }
  const overRate = parlayPercent(row["Line Hit Rate"]);
  const boardSide = String(row["Best Side"] || "");
  const boardScore = parlayNumber(row["Sportacular Score"]);
  return legs.map(leg => ({
    key: `${league}|${gameId}|${row["Player Id"] || player}|${propType}|${line}|${vendor}|${leg.side}`,
    league: league.toUpperCase(),
    gameId,
    vendor,
    label: `${player} ${propType} ${line} ${leg.side} (${vendor})`,
    odds: leg.odds,
    probability: Number.isFinite(leg.probability) ? leg.probability : null,
    confidence,
    risk,
    hitRate: overRate === null ? null : (leg.side === "Under" ? 1 - overRate : overRate),
    boardScore: boardSide === leg.side ? boardScore : null
  }));
}

function scoreParlay(legs) {
  if (!legs.length) return null;
  const decimal = legs.reduce((product, leg) => product * americanToDecimal(leg.odds), 1);
  const american = decimalToAmerican(decimal);
  const hasModel = legs.every(leg => Number.isFinite(leg.probability));
  const probability = hasModel ? legs.reduce((product, leg) => product * leg.probability, 1) : null;
  const implied = decimal > 0 ? 1 / decimal : null;
  const ev = probability === null ? null : probability * (decimal - 1) - (1 - probability);
  const priceEdge = probability === null || implied === null ? null : probability - implied;
  const confidences = legs.map(leg => leg.confidence).filter(value => Number.isFinite(value));
  const risks = legs.map(leg => leg.risk).filter(value => Number.isFinite(value));
  const confidence = confidences.length === legs.length ? Math.min(...confidences) : null;
  const risk = risks.length === legs.length ? risks.reduce((sum, value) => sum + value, 0) / risks.length : null;
  let score = null;
  if (ev !== null && priceEdge !== null && confidence !== null && risk !== null) {
    const edge = parlayClamp((priceEdge / 0.15) * 100, 0, 100) * 0.75 + parlayClamp((ev / 0.25) * 100, 0, 100) * 0.25;
    score = parlayClamp((edge * 0.55 + parlayClamp(confidence, 0, 100) * 0.25 + (100 - parlayClamp(risk, 0, 100)) * 0.15) / 0.95, 0, 100);
  }
  const play = score !== null && ev >= 0.05 && probability >= 0.52 && priceEdge >= 0.03 && confidence >= 50 && score >= 55;
  return { decimal, american, probability, implied, ev, priceEdge, confidence, risk, score, side: play ? "Play" : "No Play" };
}

function formatOdds(odds) {
  const price = Number(odds);
  if (!Number.isFinite(price)) return "";
  return price > 0 ? `+${Math.round(price)}` : `${Math.round(price)}`;
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "—";
}

function formatSigned(value) {
  return Number.isFinite(value) ? value.toFixed(3) : "—";
}

function renderSlip() {
  const slip = document.getElementById("parlay-slip");
  const summary = document.getElementById("parlay-summary");
  const warning = document.getElementById("parlay-correlation");
  if (!parlayLegs.length) {
    slip.innerHTML = "<p class='parlay-note'>No legs yet.</p>";
    summary.innerHTML = "";
    warning.hidden = true;
    return;
  }
  slip.innerHTML = parlayLegs.map((leg, index) => `
    <article class="parlay-leg">
      <div>
        <strong>${leg.league}</strong> ${leg.label}
        <span>${formatOdds(leg.odds)} · hit ${formatPercent(leg.hitRate)} · score ${Number.isFinite(leg.boardScore) ? leg.boardScore.toFixed(1) : "—"}</span>
      </div>
      <button type="button" data-remove="${index}">Remove</button>
    </article>
  `).join("");
  const games = parlayLegs.map(leg => leg.gameId).filter(Boolean);
  warning.hidden = new Set(games).size === games.length;
  const result = scoreParlay(parlayLegs);
  const hitRates = parlayLegs.map(leg => leg.hitRate).filter(value => Number.isFinite(value));
  const combinedHitRate = hitRates.length === parlayLegs.length ? hitRates.reduce((product, value) => product * value, 1) : null;
  summary.innerHTML = `
    <div><span>Parlay odds</span><strong>${formatOdds(result.american)}</strong></div>
    <div><span>Decimal odds</span><strong>${result.decimal.toFixed(2)}</strong></div>
    <div><span>Implied probability</span><strong>${formatPercent(result.implied)}</strong></div>
    <div><span>Model probability</span><strong>${formatPercent(result.probability)}</strong></div>
    <div><span>Combined hit rate</span><strong>${formatPercent(combinedHitRate)}</strong></div>
    <div><span>Expected value</span><strong>${formatSigned(result.ev)}</strong></div>
    <div><span>Price edge</span><strong>${formatPercent(result.priceEdge)}</strong></div>
    <div><span>Sportacular Score</span><strong>${Number.isFinite(result.score) ? result.score.toFixed(1) : "—"}</strong></div>
    <div><span>Result</span><strong class="${result.side === "Play" ? "play" : "no-play"}">${result.side}</strong></div>
  `;
}

function addLeg(leg) {
  if (parlayLegs.some(existing => existing.key === leg.key)) return;
  parlayLegs.push(leg);
  renderSlip();
}

async function findLegs() {
  const league = document.getElementById("parlay-league").value;
  const board = document.getElementById("parlay-board").value;
  const query = document.getElementById("parlay-search").value.trim().toLowerCase();
  const status = document.getElementById("parlay-search-status");
  const results = document.getElementById("parlay-results");
  status.textContent = "Loading the live board...";
  results.innerHTML = "";
  try {
    const finals = await finalGameIds(league);
    const rows = await loadParlayCSV(board === "odds" ? PARLAY_ODDS_URLS[league] : PARLAY_PROPS_URLS[league]);
    const openRows = rows.filter(row => !finals.has(String(row["Game Id"] || "").trim()));
    const legs = openRows.flatMap(row => board === "odds" ? oddsLegsFromRow(row, league) : propLegsFromRow(row, league));
    const matches = legs.filter(leg => !query || leg.label.toLowerCase().includes(query)).slice(0, 24);
    status.textContent = matches.length ? `${matches.length} legs ready.` : "No open legs matched that search.";
    results.innerHTML = matches.map((leg, index) => `
      <article class="parlay-result">
        <div>
          <strong>${leg.label}</strong>
          <span>${formatOdds(leg.odds)} · hit ${formatPercent(leg.hitRate)} · score ${Number.isFinite(leg.boardScore) ? leg.boardScore.toFixed(1) : "—"}</span>
        </div>
        <button type="button" data-add="${index}">Add</button>
      </article>
    `).join("");
    results.querySelectorAll("[data-add]").forEach(button => {
      button.addEventListener("click", () => addLeg(matches[Number(button.dataset.add)]));
    });
  } catch (error) {
    status.textContent = `The board could not be loaded. You can still type a leg. ${error.message}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("parlay-slip")) return;
  document.getElementById("parlay-search-btn").addEventListener("click", findLegs);
  document.getElementById("parlay-search").addEventListener("keydown", event => {
    if (event.key === "Enter") findLegs();
  });
  const parlayQuery = new URLSearchParams(window.location.search);
  const requestedSearch = parlayQuery.get("q");
  if (requestedSearch) {
    const leagueSelect = document.getElementById("parlay-league");
    const boardSelect = document.getElementById("parlay-board");
    const searchInput = document.getElementById("parlay-search");
    if (leagueSelect && parlayQuery.get("league")) leagueSelect.value = parlayQuery.get("league");
    if (boardSelect && parlayQuery.get("board")) boardSelect.value = parlayQuery.get("board");
    if (searchInput) searchInput.value = requestedSearch;
    findLegs();
  }
  document.getElementById("parlay-clear").addEventListener("click", () => {
    parlayLegs.length = 0;
    renderSlip();
  });
  document.getElementById("parlay-slip").addEventListener("click", event => {
    const button = event.target.closest("[data-remove]");
    if (!button) return;
    parlayLegs.splice(Number(button.dataset.remove), 1);
    renderSlip();
  });
  document.getElementById("parlay-manual").addEventListener("submit", event => {
    event.preventDefault();
    const odds = Number(document.getElementById("manual-odds").value);
    if (!americanToDecimal(odds)) return;
    const probability = parlayNumber(document.getElementById("manual-prob").value);
    addLeg({
      key: `manual|${Date.now()}`,
      league: "MANUAL",
      gameId: "",
      label: document.getElementById("manual-label").value.trim(),
      odds,
      probability: probability !== null && probability > 1 ? probability / 100 : probability,
      confidence: null,
      risk: null
    });
    event.target.reset();
  });
  renderSlip();
});
