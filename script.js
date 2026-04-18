const SUPABASE_URL = "https://mbnptpnxmbeccqqfbtnd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibnB0cG54bWJlY2NxcWZidG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODE4MTcsImV4cCI6MjA5MDc1NzgxN30.deQoUkejk1NtRGxCY-CtJSX65qREdXqYpPwxLjpI7b4";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("SCRIPT VERSION TEST - 7:50 AM");

let CURRENT_USER = null;
let CURRENT_USER_PROFILE = null;
let CURRENT_USER_TIER = "Rookie";

const DATA_CACHE = {
  games: {},
  props: {}
};

const NBA_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=1553479471&single=true&output=csv";
const NBA_TRENDS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=1073686927&single=true&output=csv";
const NHL_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYTgu9bsGUhI1gicOOfLrgYHmNMfrl3W1OKhAVs9cdrdd2CagJZSVM3F25hQ8vk0aRK7hapVmbNWQP/pub?gid=959803781&single=true&output=csv";
const NHL_TRENDS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYTgu9bsGUhI1gicOOfLrgYHmNMfrl3W1OKhAVs9cdrdd2CagJZSVM3F25hQ8vk0aRK7hapVmbNWQP/pub?gid=124295671&single=true&output=csv";
const MLB_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=989861231&single=true&output=csv";
const MLB_TRENDS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=1641406263&single=true&output=csv";

const NBA_PROPS_PREMIUM_URL = "/.netlify/functions/nba-props-premium";
const NBA_PROPS_TEASER_URL = "/.netlify/functions/nba-props-teaser";
const NHL_PROPS_PREMIUM_URL = "/.netlify/functions/nhl-props-premium";
const NHL_PROPS_TEASER_URL = "/.netlify/functions/nhl-props-teaser";
const MLB_PROPS_PREMIUM_URL = "/.netlify/functions/mlb-props-premium";
const MLB_PROPS_TEASER_URL = "/.netlify/functions/mlb-props-teaser";

const TIER_RULES = {
  Rookie: {
    maxRankingsPerGame: 0,
    showPlayerProps: false,
    showGameOdds: false,
    maxPropsToShow: 0,
    showTopBet: false,
    showLeaderboardCount: 3
  },
  Veteran: {
    maxRankingsPerGame: 5,
    showPlayerProps: false,
    showGameOdds: true,
    maxPropsToShow: 0,
    showTopBet: false,
    showLeaderboardCount: 5
  },
  "All-Star": {
    maxRankingsPerGame: 99,
    showPlayerProps: true,
    showGameOdds: true,
    maxPropsToShow: 10,
    showTopBet: false,
    showLeaderboardCount: 7
  },
  "Hall-of-Famer": {
    maxRankingsPerGame: 99,
    showPlayerProps: true,
    showGameOdds: true,
    maxPropsToShow: 25,
    showTopBet: true,
    showLeaderboardCount: 12
  },
  Legend: {
    maxRankingsPerGame: 99,
    showPlayerProps: true,
    showGameOdds: true,
    maxPropsToShow: 99999,
    showTopBet: true,
    showLeaderboardCount: 20
  }
};

const ODDS_PAGE_CONFIG = {
  nba: {
    csvUrl: NBA_CSV_URL,
    containerId: "nba-bets-container",
    leaderboardId: "nba-leaderboard",
    summaryId: "nba-odds-filter-summary",
    sportsbookFilterId: "nba-sportsbook-filter",
    gameFilterId: "nba-game-filter",
    tierFilterId: "nba-tier-filter",
    resetButtonId: "nba-odds-reset-filters",
    seeButtonId: "nba-see-odds-btn",
    lastUpdatedId: "nba-last-updated",
    emptyLabel: "NBA"
  },
  nhl: {
    csvUrl: NHL_CSV_URL,
    containerId: "nhl-bets-container",
    leaderboardId: "nhl-leaderboard",
    summaryId: "nhl-odds-filter-summary",
    sportsbookFilterId: "nhl-sportsbook-filter",
    gameFilterId: "nhl-game-filter",
    tierFilterId: "nhl-tier-filter",
    resetButtonId: "nhl-odds-reset-filters",
    seeButtonId: "nhl-see-odds-btn",
    lastUpdatedId: "nhl-last-updated",
    emptyLabel: "NHL"
  },
  mlb: {
    csvUrl: MLB_CSV_URL,
    containerId: "mlb-bets-container",
    leaderboardId: "mlb-leaderboard",
    summaryId: "mlb-odds-filter-summary",
    sportsbookFilterId: "mlb-sportsbook-filter",
    gameFilterId: "mlb-game-filter",
    tierFilterId: "mlb-tier-filter",
    resetButtonId: "mlb-odds-reset-filters",
    seeButtonId: "mlb-see-odds-btn",
    lastUpdatedId: "mlb-last-updated",
    emptyLabel: "MLB"
  }
};

const PROPS_PAGE_CONFIG = {
  nba: {
    csvUrl: NBA_PROPS_PREMIUM_URL,
    containerId: "nba-props-container",
    leaderboardId: "nba-props-leaderboard",
    summaryId: "nba-props-filter-summary",
    gameFilterId: "nba-props-game-filter",
    propTypeFilterId: "nba-prop-type-filter",
    playerFilterId: "nba-player-filter",
    sportsbookFilterId: "nba-props-sportsbook-filter",
    sortFilterId: "nba-props-sort-filter",
    resetButtonId: "nba-props-reset-filters",
    lastUpdatedId: "nba-props-last-updated",
    emptyLabel: "NBA"
  },
  nhl: {
    csvUrl: NHL_PROPS_PREMIUM_URL,
    containerId: "nhl-props-container",
    leaderboardId: "nhl-props-leaderboard",
    summaryId: "nhl-props-filter-summary",
    gameFilterId: "nhl-props-game-filter",
    propTypeFilterId: "nhl-prop-type-filter",
    playerFilterId: "nhl-player-filter",
    sportsbookFilterId: "nhl-props-sportsbook-filter",
    sortFilterId: "nhl-props-sort-filter",
    resetButtonId: "nhl-props-reset-filters",
    lastUpdatedId: "nhl-props-last-updated",
    emptyLabel: "NHL"
  },
  mlb: {
    csvUrl: MLB_PROPS_PREMIUM_URL,
    containerId: "mlb-props-container",
    leaderboardId: "mlb-props-leaderboard",
    summaryId: "mlb-props-filter-summary",
    gameFilterId: "mlb-props-game-filter",
    propTypeFilterId: "mlb-prop-type-filter",
    playerFilterId: "mlb-player-filter",
    sportsbookFilterId: "mlb-props-sportsbook-filter",
    sortFilterId: "mlb-props-sort-filter",
    resetButtonId: "mlb-props-reset-filters",
    lastUpdatedId: "mlb-props-last-updated",
    emptyLabel: "MLB"
  }
};

function getSelectedTier(selectId) {
  const select = document.getElementById(selectId);
  return select ? select.value : "Rookie";
}

function formatEV(ev) {
  const num = Number(ev);
  if (Number.isNaN(num)) return "N/A";
  return num > 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
}

function getEVClass(ev) {
  if (ev >= 0.25) return "ev-bright-green";
  if (ev >= 0.10) return "ev-light-green";
  if (ev >= 0) return "ev-yellow";
  return "ev-red";
}

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDate(value) {
  if (!value) return "";

  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const mmddyyyyMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mmddyyyyMatch) {
    const month = mmddyyyyMatch[1].padStart(2, "0");
    const day = mmddyyyyMatch[2].padStart(2, "0");
    const year = mmddyyyyMatch[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return raw;
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseCSV(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    return row;
  });
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return NaN;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  return Number(cleaned);
}

function safeText(value, fallback = "N/A") {
  return value && String(value).trim() !== "" ? String(value).trim() : fallback;
}

function formatAmericanOdds(value) {
  const num = toNumber(value);
  if (Number.isNaN(num)) return "N/A";
  return num > 0 ? `+${num}` : `${num}`;
}

function formatLineValue(value) {
  if (value === null || value === undefined || value === "") return "N/A";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value).trim();
  if (Number.isInteger(num)) return `${num}`;
  return num.toFixed(1);
}

function formatProbability(prob) {
  if (prob === null || prob === undefined || Number.isNaN(prob)) return "N/A";
  return `${Math.round(prob * 100)}%`;
}

function formatSortLabel(sortValue) {
  const sortMap = {
    "ev-desc": "Highest EV",
    "ev-asc": "Lowest EV",
    "prob-desc": "Highest Probability",
    "odds-desc": "Highest Odds",
    "odds-asc": "Lowest Odds"
  };
  return sortMap[sortValue] || sortValue;
}

function getLastUpdatedTime() {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function updateLastUpdated(id) {
  const element = document.getElementById(id);
  if (element) element.textContent = getLastUpdatedTime();
}

function getGameLabel(game) {
  return `${game.awayTeam} at ${game.homeTeam}`;
}

function getPropFullName(prop) {
  const fullNameFromSingleField = (prop.playerName || "").trim();
  const firstName = (prop.playerFirstName || "").trim();
  const lastName = (prop.playerLastName || "").trim();
  const combinedName = `${firstName} ${lastName}`.trim();
  if (fullNameFromSingleField) return fullNameFromSingleField;
  if (combinedName) return combinedName;
  return "";
}

function formatPropTypeLabel(propType) {
  if (!propType) return "Unknown Prop";

  const normalized = propType.trim().toLowerCase();
  const labelMap = {
    points: "Points",
    rebounds: "Rebounds",
    assists: "Assists",
    "pts+rebs+asts": "PRA",
    "points+rebounds+assists": "PRA",
    pra: "PRA",
    "3-pointers": "3-Pointers",
    three_pointers: "3-Pointers",
    threes: "3-Pointers",
    "made threes": "3-Pointers Made",
    shots: "Shots",
    "shots on goal": "Shots on Goal",
    shots_on_goal: "Shots on Goal",
    goals: "Goals",
    goal: "Goals",
    "points scored": "Points",
    player_points: "Points",
    player_rebounds: "Rebounds",
    player_assists: "Assists",
    player_points_rebounds_assists: "PRA",
    saves: "Saves",
    hits: "Hits",
    blocks: "Blocks",
    steals: "Steals"
  };

  if (labelMap[normalized]) return labelMap[normalized];

  return propType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderEmptyState(container, message) {
  container.innerHTML = `
    <div class="empty-state">
      <h3>${message}</h3>
      <p>Check your sheet data, published CSV link, and today’s game dates.</p>
    </div>
  `;
}

function renderFilterSummary(containerId, filters) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const activeFilters = filters.filter((filter) => filter.value && filter.value !== "All" && filter.value !== "");

  if (activeFilters.length === 0) {
    container.innerHTML = `<div class="filter-summary-empty">Showing default view.</div>`;
    return;
  }

  container.innerHTML = activeFilters
    .map((filter) => `
      <div class="filter-pill">
        <strong>${filter.label}:</strong> ${filter.value}
      </div>
    `)
    .join("");
}

function renderLeaderboard(containerId, games, tierName = "Rookie") {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!games || games.length === 0) {
    container.innerHTML = `<div class="filter-summary-empty">No leaderboard data for the current view.</div>`;
    return;
  }

  const rules = TIER_RULES[tierName] || TIER_RULES.Rookie;

  const allRankings = games.flatMap((game) =>
    game.rankings.map((rank) => ({
      ...rank,
      gameLabel: `${game.awayTeam} at ${game.homeTeam}`,
      vendor: game.vendor
    }))
  );

  const limited = allRankings
    .sort((a, b) => b.ev - a.ev)
    .slice(0, rules.showLeaderboardCount);

  container.innerHTML = limited
    .map((item, index) => `
      <div class="leaderboard-item">
        <strong>#${index + 1} ${item.bet}</strong>
        <div class="${getEVClass(item.ev)}">EV: ${formatEV(item.ev)}</div>
        <div>${item.gameLabel} | ${item.vendor}</div>
      </div>
    `)
    .join("");
}

function renderPropsLeaderboard(containerId, props, limit = 5) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!props || props.length === 0) {
    container.innerHTML = `
      <div class="filter-summary-empty">No props available for the current filters.</div>
    `;
    return;
  }

  const topProps = [...props]
    .sort((a, b) => b.ev - a.ev)
    .slice(0, limit);

  container.innerHTML = topProps
    .map((prop, index) => {
      const fullName = getPropFullName(prop);

      const probabilityValue =
        !Number.isNaN(prop.poissonProbOver) && prop.poissonProbOver > 0
          ? prop.poissonProbOver
          : prop.poissonProbExact;

      const probabilityText = formatProbability(probabilityValue);

      return `
        <div class="leaderboard-item">
          <strong>#${index + 1} ${fullName} — ${formatPropTypeLabel(prop.propType)}</strong>
          <div class="${getEVClass(prop.ev)}">EV: ${formatEV(prop.ev)}</div>
          <div>${prop.gameLabel ? `${prop.gameLabel} | ` : ""}${prop.vendor}</div>
          <div>Line: ${formatLineValue(prop.lineValue)} | Bet: ${prop.betType} | Probability: ${probabilityText}</div>
        </div>
      `;
    })
    .join("");
}

function buildRankingsFromRow(row) {
  const rankings = [];
  const totalValue = safeText(row["Total Value"], "");
  const awayTeam = safeText(row["Away Team"], "Away Team");
  const homeTeam = safeText(row["Home Team"], "Home Team");

  const overEV = toNumber(row["EV Total Over ($1 bet)"]);
  const underEV = toNumber(row["EV Total Under ($1 bet)"]);
  const overProb = toNumber(row["Poisson Prob Total Over"]);
  const underProb = toNumber(row["Poisson Prob Total Under"]);
  const awayML = toNumber(row["EV Away ML ($1 bet)"]);
  const homeML = toNumber(row["EV Home ML ($1 bet)"]);
  const awaySpreadEV = toNumber(row["EV Away Spread ($1 bet)"]);
  const homeSpreadEV = toNumber(row["EV Home Spread ($1 bet)"]);

  if (!Number.isNaN(overEV) && totalValue) {
    rankings.push({
      bet: `Over ${totalValue}`,
      ev: overEV,
      probability: !Number.isNaN(overProb) ? `${Math.round(overProb * 100)}%` : "N/A"
    });
  }

  if (!Number.isNaN(underEV) && totalValue) {
    rankings.push({
      bet: `Under ${totalValue}`,
      ev: underEV,
      probability: !Number.isNaN(underProb) ? `${Math.round(underProb * 100)}%` : "N/A"
    });
  }

  if (!Number.isNaN(awayML)) {
    rankings.push({ bet: `${awayTeam} ML`, ev: awayML, probability: "N/A" });
  }

  if (!Number.isNaN(homeML)) {
    rankings.push({ bet: `${homeTeam} ML`, ev: homeML, probability: "N/A" });
  }

  if (!Number.isNaN(awaySpreadEV)) {
    rankings.push({
      bet: `${awayTeam} ${safeText(row["Spread Away Value"], "")}`,
      ev: awaySpreadEV,
      probability: "N/A"
    });
  }

  if (!Number.isNaN(homeSpreadEV)) {
    rankings.push({
      bet: `${homeTeam} ${safeText(row["Spread Home Value"], "")}`,
      ev: homeSpreadEV,
      probability: "N/A"
    });
  }

  return rankings.sort((a, b) => b.ev - a.ev);
}

function transformRowsToGames(rows) {
  const filteredRows = rows.filter((row) => {
    const gameDate = normalizeDate(row["Game Date"]);
    const awayTeam = safeText(row["Away Team"], "");
    const homeTeam = safeText(row["Home Team"], "");
    const vendor = safeText(row["Vendor"], "");
    return gameDate && awayTeam && homeTeam && vendor;
  });

  return filteredRows
    .map((row) => ({
      gameDate: normalizeDate(row["Game Date"]),
      awayTeam: safeText(row["Away Team"]),
      homeTeam: safeText(row["Home Team"]),
      vendor: safeText(row["Vendor"]),
      spreadAwayValue: safeText(row["Spread Away Value"]),
      spreadAwayOdds: safeText(row["Spread Away Odds"]),
      spreadHomeValue: safeText(row["Spread Home Value"]),
      spreadHomeOdds: safeText(row["Spread Home Odds"]),
      moneylineAwayOdds: safeText(row["Moneyline Away Odds"]),
      moneylineHomeOdds: safeText(row["Moneyline Home Odds"]),
      totalValue: safeText(row["Total Value"]),
      totalOverOdds: safeText(row["Total Over Odds"]),
      totalUnderOdds: safeText(row["Total Under Odds"]),
      rankings: buildRankingsFromRow(row)
    }))
    .filter((game) => game.rankings.length > 0);
}

function buildPropsFromRows(rows) {
  return rows
    .map((row) => {
      const gameDate = normalizeDate(row["Game Date"]);

      const playerFirstName = safeText(row["Player First Name"], "");
      const playerLastName = safeText(row["Player Last Name"], "");
      const playerName = `${playerFirstName} ${playerLastName}`.trim();

      const vendor = safeText(row["Vendor"], "");
      const propType = safeText(row["Prop Type"], "");
      const lineValue = safeText(row["Line Value"], "");
      const betType = safeText(row["Type"], "");
      const overOdds = safeText(row["Over Odds"], "");
      const underOdds = safeText(row["Under Odds"], "");
      const genericOdds = safeText(row["Odds"], "");

      const poissonProbOver = toNumber(row["Poisson Over"]);
      const poissonProbExact = toNumber(row["Poisson Milestone"]);
      const ev = toNumber(row["EV Over/Milestone ($1 Bet)"]);

      const awayTeam = safeText(row["Away Team"], "");
      const homeTeam = safeText(row["Home Team"], "");

      let gameLabel = "";
      if (awayTeam && homeTeam) {
        gameLabel = `${awayTeam} at ${homeTeam}`;
      }

      return {
        gameDate,
        playerName,
        playerFirstName,
        playerLastName,
        vendor,
        propType,
        lineValue,
        betType,
        overOdds,
        underOdds,
        genericOdds,
        poissonProbOver,
        poissonProbExact,
        ev,
        awayTeam,
        homeTeam,
        gameLabel
      };
    })
    .filter((prop) =>
      prop.gameDate &&
      (prop.playerName || prop.playerFirstName || prop.playerLastName) &&
      prop.vendor &&
      prop.propType &&
      prop.lineValue &&
      !Number.isNaN(prop.ev)
    );
}

function createBetCard(game, tierName = "Rookie") {
  const rules = TIER_RULES[tierName] || TIER_RULES.Rookie;
  const visibleRankings = game.rankings.slice(0, rules.maxRankingsPerGame);
  const topEV = [...visibleRankings].sort((a, b) => b.ev - a.ev)[0];

  const rankingsHTML = visibleRankings
    .sort((a, b) => b.ev - a.ev)
    .map((item, index) => `
      <div class="rank-item">
        <span><strong>#${index + 1} ${item.bet}</strong></span>
        <span class="${getEVClass(item.ev)}">EV: ${formatEV(item.ev)}</span>
        <span>Model Probability: ${item.probability}</span>
      </div>
    `)
    .join("");

  const lockedCount = Math.max(game.rankings.length - visibleRankings.length, 0);

  return `
    <article class="bet-card">
      <div class="bet-card-header">
        <div>
          <h3>${game.awayTeam} at ${game.homeTeam}</h3>
          <p class="bet-subtext">Sportsbook: ${game.vendor} | Game Date: ${game.gameDate}</p>
        </div>
        <div class="ev-badge">Top EV: ${topEV ? formatEV(topEV.ev) : "N/A"}</div>
      </div>

      <div class="market-grid">
        <div class="market-box">
          <h4>Spread</h4>
          <p class="market-line">${game.awayTeam} ${formatLineValue(game.spreadAwayValue)} (${formatAmericanOdds(game.spreadAwayOdds)})</p>
          <p class="market-line">${game.homeTeam} ${formatLineValue(game.spreadHomeValue)} (${formatAmericanOdds(game.spreadHomeOdds)})</p>
        </div>

        <div class="market-box">
          <h4>Moneyline</h4>
          <p class="market-line">${game.awayTeam} (${formatAmericanOdds(game.moneylineAwayOdds)})</p>
          <p class="market-line">${game.homeTeam} (${formatAmericanOdds(game.moneylineHomeOdds)})</p>
        </div>

        <div class="market-box">
          <h4>Total</h4>
          <p class="market-line">Over ${formatLineValue(game.totalValue)} (${formatAmericanOdds(game.totalOverOdds)})</p>
          <p class="market-line">Under ${formatLineValue(game.totalValue)} (${formatAmericanOdds(game.totalUnderOdds)})</p>
        </div>
      </div>

      <div class="rank-list">
        <h4>EV Rankings</h4>
        ${rankingsHTML}
        ${lockedCount > 0 ? `
          <div class="locked-overlay">
            <h4>Unlock More Bets</h4>
            <p>${lockedCount} more ranked bet${lockedCount === 1 ? "" : "s"} available in higher tiers.</p>
          </div>
        ` : ""}
      </div>
    </article>
  `;
}

function createPropCard(prop) {
  const probabilityValue =
    !Number.isNaN(prop.poissonProbOver) && prop.poissonProbOver > 0
      ? prop.poissonProbOver
      : prop.poissonProbExact;

  const probabilityText = formatProbability(probabilityValue);
  const betTypeLower = (prop.betType || "").toLowerCase();

  let oddsToShow = "N/A";

  if (betTypeLower.includes("over")) {
    oddsToShow = formatAmericanOdds(prop.overOdds);
  } else if (betTypeLower.includes("under")) {
    oddsToShow = formatAmericanOdds(prop.underOdds);
  } else {
    oddsToShow = formatAmericanOdds(prop.genericOdds);
  }

  const fullName = getPropFullName(prop);

  return `
    <article class="prop-card">
      <div class="prop-card-header">
        <div>
          <h3>${fullName} — ${formatPropTypeLabel(prop.propType)}</h3>
          <p class="prop-meta">${prop.gameLabel ? `${prop.gameLabel} | ` : ""}${prop.vendor} | ${prop.gameDate || "Today"}</p>
        </div>
        <div class="ev-badge ${getEVClass(prop.ev)}">EV: ${formatEV(prop.ev)}</div>
      </div>

      <div class="prop-lines">
        <div class="prop-line">
          <div><strong>Bet Type:</strong> ${prop.betType}</div>
          <div><strong>Line:</strong> ${formatLineValue(prop.lineValue)}</div>
          <div><strong>Odds:</strong> ${oddsToShow}</div>
          <div><strong>Model Probability:</strong> ${probabilityText}</div>
        </div>
      </div>
    </article>
  `;
}

function setOddsFiltersDisabled(config, isDisabled) {
  [
    config.gameFilterId,
    config.sportsbookFilterId
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = isDisabled;
  });
}

function renderOddsLockedState(config, container, currentTier) {
  renderLeaderboard(config.leaderboardId, [], "Rookie");

  renderFilterSummary(config.summaryId, [
    { label: "Tier", value: currentTier || "Rookie" }
  ]);

  setOddsFiltersDisabled(config, true);

  container.innerHTML = `
    <div class="props-locked-box">
      <h3>Game Odds Locked</h3>
      <p>Your current plan is <strong>${currentTier || "Rookie"}</strong>.</p>
      <p>Upgrade to <strong>Veteran</strong> or higher to unlock ${config.emptyLabel} game odds.</p>
      <div style="margin-top: 16px;">
        <a href="pricing.html" class="btn btn-primary">View Plans</a>
      </div>
    </div>
  `;
}

async function fetchLeagueGames(csvUrl) {
  if (DATA_CACHE.games[csvUrl]) return DATA_CACHE.games[csvUrl];

  const response = await fetch(csvUrl);
  if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.status}`);

  const text = await response.text();
  const rows = parseCSV(text);
  const games = transformRowsToGames(rows);
  const today = getTodayDateString();

  const todaysGames = games
    .filter((game) => game.gameDate === today)
    .sort((a, b) => {
      const aTopEV = Math.max(...a.rankings.map((item) => item.ev));
      const bTopEV = Math.max(...b.rankings.map((item) => item.ev));
      return bTopEV - aTopEV;
    });

  DATA_CACHE.games[csvUrl] = todaysGames;
  return todaysGames;
}

async function fetchLeagueProps(csvUrl) {
  if (DATA_CACHE.props[csvUrl]) return DATA_CACHE.props[csvUrl];

  const headers = {};

  if (csvUrl.includes("/.netlify/functions/")) {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      const sessionError = new Error("Unable to get session for protected props request.");
      sessionError.status = 401;
      throw sessionError;
    }

    const accessToken = data.session?.access_token;

    if (!accessToken) {
      const tokenError = new Error("No access token available for protected props request.");
      tokenError.status = 401;
      throw tokenError;
    }

    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(csvUrl, { headers });

  if (!response.ok) {
    let payload = null;

    try {
      payload = await response.json();
    } catch (jsonError) {
      payload = null;
    }

    const fetchError = new Error(
      payload?.message ||
      payload?.error ||
      `Failed to fetch props CSV: ${response.status}`
    );

    fetchError.status = response.status;
    fetchError.payload = payload;

    throw fetchError;
  }

  const text = await response.text();
  const rows = parseCSV(text);
  const props = buildPropsFromRows(rows);
  const today = getTodayDateString();

  console.log("fetchLeagueProps csvUrl:", csvUrl);
  console.log("Today string:", today);
  console.log("Parsed rows count:", rows.length);
  console.log("Built props count:", props.length);
  console.log("First 5 props before date filter:", props.slice(0, 5));

  const todaysProps = props
    .filter((prop) => prop.gameDate === today)
    .sort((a, b) => b.ev - a.ev);

  console.log("Today props count:", todaysProps.length);
  console.log("First 5 today props:", todaysProps.slice(0, 5));

  DATA_CACHE.props[csvUrl] = todaysProps;
  return todaysProps;
}

function populateSelectOptions(selectId, values, fallbackLabel, currentValue, formatter = (v) => v) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = `<option value="All">${fallbackLabel}</option>`;

  values.forEach((value) => {
    select.innerHTML += `<option value="${value}">${formatter(value)}</option>`;
  });

  if (values.includes(currentValue)) {
    select.value = currentValue;
  } else {
    select.value = "All";
  }
}

function populateSportsbookFilter(selectId, items, onChange) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const currentValue = select.value || "All";
  const vendors = [...new Set(items.map((item) => item.vendor).filter(Boolean))].sort();

  populateSelectOptions(selectId, vendors, "All Sportsbooks", currentValue);
  select.onchange = () => onChange();
}

function populateGameFilter(selectId, items, getLabelFn, onChange) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const currentValue = select.value || "All";
  const labels = [...new Set(items.map(getLabelFn).filter(Boolean))].sort();

  populateSelectOptions(selectId, labels, "All Games", currentValue);
  select.onchange = () => onChange();
}

function populatePropTypeFilter(selectId, items, onChange) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const currentValue = select.value || "All";
  const rawPropTypes = [...new Set(items.map((item) => item.propType).filter(Boolean))].sort();

  populateSelectOptions(selectId, rawPropTypes, "All Prop Types", currentValue, formatPropTypeLabel);
  select.onchange = () => onChange();
}

function populatePlayerFilter(selectId, items, onChange) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const currentValue = select.value || "All";
  const players = [...new Set(items.map(getPropFullName).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  populateSelectOptions(selectId, players, "All Players", currentValue);
  select.onchange = () => onChange();
}

function getPropDisplayOdds(prop) {
  const betTypeLower = (prop.betType || "").toLowerCase();

  if (betTypeLower.includes("over")) return toNumber(prop.overOdds);
  if (betTypeLower.includes("under")) return toNumber(prop.underOdds);
  return toNumber(prop.genericOdds);
}

function getPropProbabilityValue(prop) {
  if (!Number.isNaN(prop.poissonProbOver) && prop.poissonProbOver > 0) {
    return prop.poissonProbOver;
  }

  if (!Number.isNaN(prop.poissonProbExact) && prop.poissonProbExact > 0) {
    return prop.poissonProbExact;
  }

  return -Infinity;
}

function sortProps(props, sortValue) {
  const sorted = [...props];

  switch (sortValue) {
    case "ev-asc":
      return sorted.sort((a, b) => a.ev - b.ev);

    case "prob-desc":
      return sorted.sort(
        (a, b) => getPropProbabilityValue(b) - getPropProbabilityValue(a)
      );

    case "odds-desc":
      return sorted.sort((a, b) => getPropDisplayOdds(b) - getPropDisplayOdds(a));

    case "odds-asc":
      return sorted.sort((a, b) => getPropDisplayOdds(a) - getPropDisplayOdds(b));

    case "ev-desc":
    default:
      return sorted.sort((a, b) => b.ev - a.ev);
  }
}

function resetSelectToAll(selectId) {
  const select = document.getElementById(selectId);
  if (select) select.value = "All";
}

function resetSelectToValue(selectId, value) {
  const select = document.getElementById(selectId);
  if (select) select.value = value;
}

function bindButton(buttonId, handler) {
  const button = document.getElementById(buttonId);
  if (button) button.onclick = handler;
}

function bindSelectChange(selectId, handler) {
  const select = document.getElementById(selectId);
  if (select) select.onchange = handler;
}

function updateHomeLastUpdated() {
  const element = document.getElementById("home-last-updated");
  if (!element) return;

  element.textContent = `Last Updated: ${getLastUpdatedTime()}`;
}

async function renderOddsPage(pageKey) {
  const config = ODDS_PAGE_CONFIG[pageKey];
  const container = document.getElementById(config.containerId);
  if (!container) return;

  initializeOddsTierDisplay(pageKey);

  container.innerHTML = `
    <div class="empty-state">
      <h3>Loading ${config.emptyLabel} odds...</h3>
      <p>Please wait while live game odds are pulled in.</p>
    </div>
  `;

  try {
    const games = await fetchLeagueGames(config.csvUrl);
    updateLastUpdated(config.lastUpdatedId);

    const renderPage = () => {
      const currentTier = CURRENT_USER_TIER || "Rookie";
      const currentRules = TIER_RULES[currentTier] || TIER_RULES.Rookie;

      console.log("renderOddsPage currentTier:", currentTier);
      console.log("renderOddsPage currentRules:", currentRules);

      if (!currentRules.showGameOdds) {
        renderOddsLockedState(config, container, currentTier);
        return;
      }

      populateGameFilter(
        config.gameFilterId,
        games.filter((game) => game.awayTeam && game.homeTeam),
        (game) => `${game.awayTeam} at ${game.homeTeam}`,
        renderPage
      );

      populateSportsbookFilter(config.sportsbookFilterId, games, renderPage);

      const selectedGame =
        document.getElementById(config.gameFilterId)?.value || "All";
      const selectedSportsbook =
        document.getElementById(config.sportsbookFilterId)?.value || "All";

      let filteredGames = games;

      if (selectedGame !== "All") {
        filteredGames = filteredGames.filter(
          (game) => `${game.awayTeam} at ${game.homeTeam}` === selectedGame
        );
      }

      if (selectedSportsbook !== "All") {
        filteredGames = filteredGames.filter(
          (game) => game.vendor === selectedSportsbook
        );
      }

      renderFilterSummary(config.summaryId, [
        { label: "Game", value: selectedGame },
        { label: "Sportsbook", value: selectedSportsbook },
        { label: "Tier", value: currentTier }
      ]);

      renderLeaderboard(config.leaderboardId, filteredGames, currentTier);

      setOddsFiltersDisabled(config, false);

      if (filteredGames.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No ${config.emptyLabel} odds found for this filter.</h3>
            <p>Try changing the game or sportsbook filters.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = filteredGames
        .map((game) => createBetCard(game, currentTier))
        .join("");
    };

    bindButton(config.resetButtonId, () => {
      resetSelectToAll(config.gameFilterId);
      resetSelectToAll(config.sportsbookFilterId);
      renderPage();
    });

    renderPage();
  } catch (error) {
    console.error(`${config.emptyLabel} odds render error:`, error);

    renderLeaderboard(config.leaderboardId, [], "Rookie");
    renderFilterSummary(config.summaryId, []);

    container.innerHTML = `
      <div class="empty-state">
        <h3>Unable to load ${config.emptyLabel} odds right now.</h3>
        <p>Please try again in a moment or check your data source.</p>
      </div>
    `;
  }
}

async function renderPropsPage(pageKey) {
  const config = PROPS_PAGE_CONFIG[pageKey];
  const container = document.getElementById(config.containerId);
  if (!container) return;

  container.innerHTML = `
  <div class="empty-state">
    <h3>Loading ${config.emptyLabel} props...</h3>
    <p>Please wait while live player props are pulled in.</p>
  </div>
`;

  try {
    const props = await fetchLeagueProps(config.csvUrl);
    updateLastUpdated(config.lastUpdatedId);

    const renderPage = () => {
  const currentTier = CURRENT_USER_TIER || "Rookie";
  const currentRules = TIER_RULES[currentTier] || TIER_RULES.Rookie;

  console.log("renderPropsPage currentTier:", currentTier);
  console.log("renderPropsPage currentRules:", currentRules);

  if (!currentRules.showPlayerProps) {
  renderPropsLockedState(config, container, currentTier);
  return;
}

      populateGameFilter(config.gameFilterId, props.filter((prop) => prop.gameLabel), (prop) => prop.gameLabel, renderPage);
      populatePropTypeFilter(config.propTypeFilterId, props, renderPage);
      populateSportsbookFilter(config.sportsbookFilterId, props, renderPage);

      const selectedGame = document.getElementById(config.gameFilterId)?.value || "All";
      const selectedPropType = document.getElementById(config.propTypeFilterId)?.value || "All";
      const selectedSportsbook = document.getElementById(config.sportsbookFilterId)?.value || "All";
      const sortValue = document.getElementById(config.sortFilterId)?.value || "ev-desc";

      let filteredProps = props;

      if (selectedGame !== "All") {
        filteredProps = filteredProps.filter((prop) => prop.gameLabel === selectedGame);
      }

      if (selectedPropType !== "All") {
        filteredProps = filteredProps.filter((prop) => prop.propType === selectedPropType);
      }

      if (selectedSportsbook !== "All") {
        filteredProps = filteredProps.filter((prop) => prop.vendor === selectedSportsbook);
      }

      populatePlayerFilter(config.playerFilterId, filteredProps, renderPage);

      const selectedPlayer = document.getElementById(config.playerFilterId)?.value || "All";

      if (selectedPlayer !== "All") {
        filteredProps = filteredProps.filter((prop) => getPropFullName(prop) === selectedPlayer);
      }

      filteredProps = sortProps(filteredProps, sortValue);

      renderFilterSummary(config.summaryId, [
        { label: "Game", value: selectedGame },
        { label: "Prop Type", value: selectedPropType !== "All" ? formatPropTypeLabel(selectedPropType) : "All" },
        { label: "Player", value: selectedPlayer },
        { label: "Sportsbook", value: selectedSportsbook },
        { label: "Sort", value: sortValue !== "ev-desc" ? formatSortLabel(sortValue) : "All" },
        { label: "Tier", value: currentTier !== "Rookie" ? currentTier : "All" }
      ]);

      renderPropsLeaderboard(
        config.leaderboardId,
        filteredProps,
        Math.min(currentRules.showLeaderboardCount || 5, 10)
      );

      const visibleProps = filteredProps.slice(0, currentRules.maxPropsToShow);
      const hiddenPropsCount = Math.max(filteredProps.length - visibleProps.length, 0);

setPropsFiltersDisabled(config, !currentRules.showPlayerProps);

if (visibleProps.length === 0) {
  container.innerHTML = `
    <div class="empty-state">
      <h3>No ${config.emptyLabel} props found for this filter.</h3>
      <p>Try changing the game, prop type, player, sportsbook, or sort settings.</p>
    </div>
  `;
  return;
}

container.innerHTML = `
  ${visibleProps.map(createPropCard).join("")}
  ${
    hiddenPropsCount > 0
      ? `
        <div class="locked-overlay">
          <h4>Unlock More Props</h4>
          <p>
            You’re viewing ${visibleProps.length} of ${filteredProps.length} props for this tier.
            Upgrade for deeper access.
          </p>
        </div>
      `
      : ""
  }
`;
    };

    bindSelectChange(config.sortFilterId, renderPage);

    bindButton(config.resetButtonId, () => {
      resetSelectToAll(config.gameFilterId);
      resetSelectToAll(config.propTypeFilterId);
      resetSelectToAll(config.playerFilterId);
      resetSelectToAll(config.sportsbookFilterId);
      resetSelectToValue(config.sortFilterId, "ev-desc");
      renderPage();
    });

    renderPage();
  } catch (error) {
  console.error(`${config.emptyLabel} props render error:`, error);

  const currentTier = CURRENT_USER_TIER || "Rookie";

  if (error.status === 401) {
    renderPropsLoginRequiredState(config, container);
    return;
  }

  if (error.status === 403) {
    renderPropsUpgradeRequiredState(config, container, currentTier);
    return;
  }

  renderPropsLeaderboard(config.leaderboardId, [], 5);

  const summary = document.getElementById(config.summaryId);
  if (summary) {
    summary.innerHTML = `<div class="filter-summary-empty">Unable to build filter summary right now.</div>`;
  }

  container.innerHTML = `
    <div class="empty-state">
      <h3>Unable to load ${config.emptyLabel} props right now.</h3>
      <p>Please try again in a moment or check your data source.</p>
    </div>
  `;
}
}

function renderHomeSpotlightCard(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!data) {
    container.innerHTML = `<div class="filter-summary-empty">No spotlight available right now.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="home-spotlight-item">
      <div class="home-spotlight-title">${data.title}</div>
      <div class="home-spotlight-meta">${data.meta}</div>
      <div class="home-spotlight-ev ${getEVClass(data.ev)}">EV: ${formatEV(data.ev)}</div>
      <div class="home-spotlight-meta">${data.subtext}</div>
    </div>
  `;
}

function setPropsFiltersDisabled(config, isDisabled) {
  [
    config.gameFilterId,
    config.propTypeFilterId,
    config.playerFilterId,
    config.sportsbookFilterId,
    config.sortFilterId
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = isDisabled;
  });
}

function formatMetric(value, decimals = 2) {
  const num = Number(value);
  if (Number.isNaN(num)) return "N/A";
  return num.toFixed(decimals);
}

function getConfidenceClass(confidence) {
  const value = String(confidence || "").toLowerCase();
  if (value.includes("high") || value.includes("core")) return "ev-bright-green";
  if (value.includes("secondary")) return "ev-yellow";
  return "ev-red";
}

function getRiskClass(riskTier) {
  const value = String(riskTier || "").toLowerCase();
  if (value.includes("low")) return "ev-bright-green";
  if (value.includes("medium")) return "ev-yellow";
  return "ev-red";
}

async function renderHomeSpotlights() {
  try {
    const [nbaGames, nhlGames, mlbGames, nbaProps, nhlProps, mlbProps] = await Promise.all([
      fetchLeagueGames(NBA_CSV_URL).catch(() => []),
      fetchLeagueGames(NHL_CSV_URL).catch(() => []),
      fetchLeagueGames(MLB_CSV_URL).catch(() => []),
      fetchTeaserPropsJson(NBA_PROPS_TEASER_URL).catch(() => []),
      fetchTeaserPropsJson(NHL_PROPS_TEASER_URL).catch(() => []),
      fetchTeaserPropsJson(MLB_PROPS_TEASER_URL).catch(() => [])
    ]);

    const topNBAGame = [...nbaGames].sort((a, b) => {
      const aTopEV = Math.max(...a.rankings.map((item) => item.ev));
      const bTopEV = Math.max(...b.rankings.map((item) => item.ev));
      return bTopEV - aTopEV;
    })[0];

    const topNHLGame = [...nhlGames].sort((a, b) => {
      const aTopEV = Math.max(...a.rankings.map((item) => item.ev));
      const bTopEV = Math.max(...b.rankings.map((item) => item.ev));
      return bTopEV - aTopEV;
    })[0];

    const topMLBGame = [...mlbGames].sort((a, b) => {
      const aTopEV = Math.max(...a.rankings.map((item) => item.ev));
      const bTopEV = Math.max(...b.rankings.map((item) => item.ev));
      return bTopEV - aTopEV;
    })[0];

    const topNBAProp = [...nbaProps].sort((a, b) => b.ev - a.ev)[0];
    const topNHLProp = [...nhlProps].sort((a, b) => b.ev - a.ev)[0];
    const topMLBProp = [...mlbProps].sort((a, b) => b.ev - a.ev)[0];

    if (topNBAGame) {
      const bestRank = [...topNBAGame.rankings].sort((a, b) => b.ev - a.ev)[0];
      renderHomeSpotlightCard("home-top-nba-bet", {
        title: `${topNBAGame.awayTeam} at ${topNBAGame.homeTeam}`,
        meta: `Featured High-EV Play | ${topNBAGame.vendor} | ${topNBAGame.gameDate}`,
        ev: bestRank.ev,
        subtext: `Top Bet: ${bestRank.bet}`
      });
    } else {
      renderHomeSpotlightCard("home-top-nba-bet", null);
    }

    if (topNHLGame) {
      const bestRank = [...topNHLGame.rankings].sort((a, b) => b.ev - a.ev)[0];
      renderHomeSpotlightCard("home-top-nhl-bet", {
        title: `${topNHLGame.awayTeam} at ${topNHLGame.homeTeam}`,
        meta: `Featured High-EV Play | ${topNHLGame.vendor} | ${topNHLGame.gameDate}`,
        ev: bestRank.ev,
        subtext: `Top Bet: ${bestRank.bet}`
      });
    } else {
      renderHomeSpotlightCard("home-top-nhl-bet", null);
    }

    if (topMLBGame) {
      const bestRank = [...topMLBGame.rankings].sort((a, b) => b.ev - a.ev)[0];
      renderHomeSpotlightCard("home-top-mlb-bet", {
        title: `${topMLBGame.awayTeam} at ${topMLBGame.homeTeam}`,
        meta: `Featured High-EV Play | ${topMLBGame.vendor} | ${topMLBGame.gameDate}`,
        ev: bestRank.ev,
        subtext: `Top Bet: ${bestRank.bet}`
      });
    } else {
      renderHomeSpotlightCard("home-top-mlb-bet", null);
    }

    if (topNBAProp) {
      renderHomeSpotlightCard("home-top-nba-prop", {
        title: `${getPropFullName(topNBAProp)} — ${formatPropTypeLabel(topNBAProp.propType)}`,
        meta: `Top Free Props Today | ${topNBAProp.vendor} | ${topNBAProp.gameDate || "Today"}`,
        ev: topNBAProp.ev,
        subtext: `Bet: ${topNBAProp.betType} ${formatLineValue(topNBAProp.lineValue)}`
      });
    } else {
      renderHomeSpotlightCard("home-top-nba-prop", null);
    }

    if (topNHLProp) {
      renderHomeSpotlightCard("home-top-nhl-prop", {
        title: `${getPropFullName(topNHLProp)} — ${formatPropTypeLabel(topNHLProp.propType)}`,
        meta: `Top Free Props Today | ${topNHLProp.vendor} | ${topNHLProp.gameDate || "Today"}`,
        ev: topNHLProp.ev,
        subtext: `Bet: ${topNHLProp.betType} ${formatLineValue(topNHLProp.lineValue)}`
      });
    } else {
      renderHomeSpotlightCard("home-top-nhl-prop", null);
    }

    if (topMLBProp) {
      renderHomeSpotlightCard("home-top-mlb-prop", {
        title: `${getPropFullName(topMLBProp)} — ${formatPropTypeLabel(topMLBProp.propType)}`,
        meta: `Top Free Props Today | ${topMLBProp.vendor} | ${topMLBProp.gameDate || "Today"}`,
        ev: topMLBProp.ev,
        subtext: `Bet: ${topMLBProp.betType} ${formatLineValue(topMLBProp.lineValue)}`
      });
    } else {
      renderHomeSpotlightCard("home-top-mlb-prop", null);
    }

    updateHomeLastUpdated();
  } catch (error) {
    console.error("Home spotlight render error:", error);

    renderHomeSpotlightCard("home-top-nba-bet", null);
    renderHomeSpotlightCard("home-top-nba-prop", null);
    renderHomeSpotlightCard("home-top-nhl-bet", null);
    renderHomeSpotlightCard("home-top-nhl-prop", null);
    renderHomeSpotlightCard("home-top-mlb-bet", null);
    renderHomeSpotlightCard("home-top-mlb-prop", null);

    updateHomeLastUpdated();
  }
}

async function renderHomeTopProps() {
  const container = document.getElementById("home-top-props");
  if (!container) return;

  const currentTier = CURRENT_USER_TIER || "Rookie";

  try {
    const [nbaProps, nhlProps, mlbProps] = await Promise.all([
      fetchTeaserPropsJson(NBA_PROPS_TEASER_URL).catch(() => []),
      fetchTeaserPropsJson(NHL_PROPS_TEASER_URL).catch(() => []),
      fetchTeaserPropsJson(MLB_PROPS_TEASER_URL).catch(() => [])
    ]);

    const allProps = [...nbaProps, ...nhlProps, ...mlbProps].sort((a, b) => b.ev - a.ev);

    const visibleProps = allProps.slice(0, 5);

    if (visibleProps.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No free props available right now.</h3>
          <p>Please check back once today’s props are live.</p>
        </div>
      `;
      updateHomeLastUpdated();
      return;
    }

    container.innerHTML =
      visibleProps
        .map((prop, index) => {
          const fullName = getPropFullName(prop);
          const probabilityValue =
            prop.poissonProbOver && prop.poissonProbOver > 0
              ? prop.poissonProbOver
              : prop.poissonProbExact;

          const probabilityText = formatProbability(probabilityValue);
          const isLockedPreview = index >= 3;

          return `
            <div class="leaderboard-item ${isLockedPreview ? "blurred" : ""}">
              <strong>#${index + 1} ${fullName} — ${formatPropTypeLabel(prop.propType)}</strong>
              <div class="${getEVClass(prop.ev)}">EV: ${formatEV(prop.ev)}</div>
              <div>${prop.gameLabel ? `${prop.gameLabel} | ` : ""}${prop.vendor}</div>
              <div>Line: ${formatLineValue(prop.lineValue)} | Bet: ${prop.betType} | Probability: ${probabilityText}</div>
              <div class="prop-upgrade-hint">🔒 Unlock full prop board with All-Star</div>
            </div>
          `;
        })
        .join("") +
      `
        <div class="upgrade-cta-box">
          <h3>${currentTier === "Rookie" ? "Upgrade to Unlock More Props" : "You're Seeing Limited Results"}</h3>
          <p>Unlock the full board, advanced filters, and top EV plays.</p>
          <a href="pricing.html" class="btn btn-primary">Upgrade to All-Star</a>
        </div>
      `;

    updateHomeLastUpdated();
  } catch (error) {
    console.error("Home top props render error:", error);
    container.innerHTML = `
      <div class="empty-state">
        <h3>Unable to load top props right now.</h3>
        <p>Please try again later.</p>
      </div>
    `;
    updateHomeLastUpdated();
  }
}

async function renderTopBetOfTheDay() {
  const container = document.getElementById("top-bet-container");
  if (!container) return;

  try {
    const [nbaGames, nhlGames] = await Promise.all([
      fetchLeagueGames(NBA_CSV_URL).catch(() => []),
      fetchLeagueGames(NHL_CSV_URL).catch(() => [])
    ]);

    const allGames = [...nbaGames, ...nhlGames];

    if (allGames.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No top bet available yet.</h3>
          <p>Once today's data is live, the strongest bet will appear here.</p>
        </div>
      `;
      return;
    }

    const allRankings = allGames.flatMap((game) =>
      game.rankings.map((rank) => ({
        ...rank,
        awayTeam: game.awayTeam,
        homeTeam: game.homeTeam,
        vendor: game.vendor,
        gameDate: game.gameDate
      }))
    );

    const topBet = allRankings.sort((a, b) => b.ev - a.ev)[0];

    container.innerHTML = `
      <h3>${topBet.bet}</h3>
      <p class="top-bet-meta">${topBet.awayTeam} at ${topBet.homeTeam} | ${topBet.vendor} | ${topBet.gameDate}</p>
      <div class="top-bet-main">
        <div class="${getEVClass(topBet.ev)}">EV: ${formatEV(topBet.ev)}</div>
        <div>Model Probability: ${topBet.probability}</div>
      </div>
    `;
  } catch (error) {
    console.error("Top bet render error:", error);
    container.innerHTML = `
      <div class="empty-state">
        <h3>Unable to load top bet right now.</h3>
        <p>Please check your live sheet data connection.</p>
      </div>
    `;
  }
}

async function fetchTeaserPropsJson(endpointUrl) {
  if (DATA_CACHE.props[endpointUrl]) return DATA_CACHE.props[endpointUrl];

  const response = await fetch(endpointUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch teaser props: ${response.status}`);
  }

  const payload = await response.json();
  const props = Array.isArray(payload.props) ? payload.props : [];

  DATA_CACHE.props[endpointUrl] = props;
  return props;
}

async function updateSessionStatus() {
  const statusEl = document.getElementById("session-status");
  const tierEl = document.getElementById("tier-status");

  if (!supabaseClient) return;

  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    CURRENT_USER = null;
    CURRENT_USER_PROFILE = null;
    CURRENT_USER_TIER = "Rookie";

    updateTierDisplay("nba-tier-display");
    updateTierDisplay("nhl-tier-display");
    updateTierDisplay("mlb-tier-display");

    if (statusEl) statusEl.textContent = "Unable to check session.";
    if (tierEl) tierEl.textContent = "Tier: --";
    return;
  }

  const session = data.session;

  if (session?.user) {
    CURRENT_USER = session.user;

    const profile = await fetchCurrentUserProfile();
    CURRENT_USER_PROFILE = profile;
    CURRENT_USER_TIER = profile?.tier || "Rookie";

    updateTierDisplay("nba-tier-display");
    updateTierDisplay("nhl-tier-display");
    updateTierDisplay("mlb-tier-display");

    if (statusEl) {
      statusEl.textContent = `Logged in as ${session.user.email}`;
    }

    if (tierEl) {
      tierEl.textContent = `Tier: ${CURRENT_USER_TIER}`;
    }
  } else {
    CURRENT_USER = null;
    CURRENT_USER_PROFILE = null;
    CURRENT_USER_TIER = "Rookie";

    updateTierDisplay("nba-tier-display");
    updateTierDisplay("nhl-tier-display");
    updateTierDisplay("mlb-tier-display");

    if (statusEl) statusEl.textContent = "Not currently logged in.";
    if (tierEl) tierEl.textContent = "Tier: --";
  }
}

async function updateNavAuthState() {
  const loginItem = document.getElementById("nav-login-item");
  const accountItem = document.getElementById("nav-account-item");
  const logoutItem = document.getElementById("nav-logout-item");
  const logoutLink = document.getElementById("nav-logout-link");

  if (!supabaseClient) return;

  const { data, error } = await supabaseClient.auth.getSession();

  if (error || !data.session?.user) {
    if (loginItem) loginItem.style.display = "";
    if (accountItem) accountItem.style.display = "none";
    if (logoutItem) logoutItem.style.display = "none";
    return;
  }

  if (loginItem) loginItem.style.display = "none";
  if (accountItem) accountItem.style.display = "";
  if (logoutItem) logoutItem.style.display = "";

  if (logoutLink && !logoutLink.dataset.bound) {
    logoutLink.addEventListener("click", async (event) => {
      event.preventDefault();

      await supabaseClient.auth.signOut();
      window.location.href = "index.html";
    });

    logoutLink.dataset.bound = "true";
  }
}

function initAuthPage() {
  const loginView = document.getElementById("login-view");
  const signupView = document.getElementById("signup-view");
  const resetRequestView = document.getElementById("reset-request-view");
  const resetUpdateView = document.getElementById("reset-update-view");

  const pageTitle = document.getElementById("auth-page-title");
  const pageDescription = document.getElementById("auth-page-description");

  const signupForm = document.getElementById("signup-form");
  const loginForm = document.getElementById("login-form");
  const logoutBtn = document.getElementById("logout-btn");
  const resetRequestForm = document.getElementById("reset-request-form");
  const resetUpdateForm = document.getElementById("reset-update-form");

  const signupMessage = document.getElementById("signup-message");
  const loginMessage = document.getElementById("login-message");
  const resetRequestMessage = document.getElementById("reset-request-message");
  const resetUpdateMessage = document.getElementById("reset-update-message");

  if (!loginView && !signupView && !resetRequestView && !resetUpdateView) {
    return;
  }

  function showAuthView(viewName) {
    if (loginView) loginView.style.display = "none";
    if (signupView) signupView.style.display = "none";
    if (resetRequestView) resetRequestView.style.display = "none";
    if (resetUpdateView) resetUpdateView.style.display = "none";

    if (viewName === "signup" && signupView) {
      signupView.style.display = "";
      if (pageTitle) pageTitle.textContent = "Create Account";
      if (pageDescription) pageDescription.textContent = "Create your account to unlock tier-based access.";
      return;
    }

    if (viewName === "reset" && resetRequestView) {
      resetRequestView.style.display = "";
      if (pageTitle) pageTitle.textContent = "Reset Password";
      if (pageDescription) pageDescription.textContent = "Enter your email and we’ll send you a password reset link.";
      return;
    }

    if (viewName === "update-password" && resetUpdateView) {
      resetUpdateView.style.display = "";
      if (pageTitle) pageTitle.textContent = "Create New Password";
      if (pageDescription) pageDescription.textContent = "Enter and confirm your new password below.";
      return;
    }

    if (loginView) loginView.style.display = "";
    if (pageTitle) pageTitle.textContent = "Login";
    if (pageDescription) pageDescription.textContent = "Sign in to manage your account and unlock tier-based access.";
  }

  function getAuthViewFromUrl() {
    const url = new URL(window.location.href);
    return url.searchParams.get("view") || "login";
  }

  async function detectPasswordRecoveryState() {
    const hash = window.location.hash || "";
    const search = window.location.search || "";

    const recoveryInHash = hash.includes("type=recovery");
    const recoveryInSearch = search.includes("type=recovery");

    return recoveryInHash || recoveryInSearch;
  }

  (async () => {
    const isRecovery = await detectPasswordRecoveryState();
    if (isRecovery) {
      showAuthView("update-password");
    } else {
      showAuthView(getAuthViewFromUrl());
    }
  })();

  if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = document.getElementById("signup-email")?.value.trim();
      const password = document.getElementById("signup-password")?.value;

      signupMessage.textContent = "Creating account...";

      const { error } = await supabaseClient.auth.signUp({
        email,
        password
      });

      if (error) {
        signupMessage.textContent = error.message;
      } else {
        signupMessage.textContent = "Account created successfully. Check your email if confirmation is required, then log in.";
      }

      await updateSessionStatus();
      await updateNavAuthState();
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = document.getElementById("login-email")?.value.trim();
      const password = document.getElementById("login-password")?.value;

      loginMessage.textContent = "Logging in...";

      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        loginMessage.textContent = error.message;
      } else {
        loginMessage.textContent = "Login successful.";
      }

      await updateSessionStatus();
      await updateNavAuthState();
    });
  }

  if (resetRequestForm) {
    resetRequestForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = document.getElementById("reset-email")?.value.trim();
      resetRequestMessage.textContent = "Sending reset link...";

      const redirectTo = `https://sports-betting-guide-app.netlify.app/auth.html?view=update-password`;

      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo
      });

      if (error) {
        resetRequestMessage.textContent = error.message;
      } else {
        resetRequestMessage.textContent = "Reset link sent. Please check your email.";
      }
    });
  }

  if (resetUpdateForm) {
    resetUpdateForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const newPassword = document.getElementById("new-password")?.value;
      const confirmPassword = document.getElementById("confirm-password")?.value;

      if (newPassword !== confirmPassword) {
        resetUpdateMessage.textContent = "Passwords do not match.";
        return;
      }

      resetUpdateMessage.textContent = "Updating password...";

      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword
      });

      if (error) {
        resetUpdateMessage.textContent = error.message;
      } else {
        resetUpdateMessage.textContent = "Password updated successfully. You can now log in.";
        window.history.replaceState({}, document.title, "auth.html?view=login");
        showAuthView("login");
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      await updateSessionStatus();
      await updateNavAuthState();
    });
  }

  updateSessionStatus();
}

function updateTierDisplay(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = CURRENT_USER_TIER || "Rookie";
}

function renderPropsLockedState(config, container, currentTier) {
  renderPropsLeaderboard(config.leaderboardId, [], 5);

  renderFilterSummary(config.summaryId, [
    { label: "Tier", value: currentTier !== "Rookie" ? currentTier : "Rookie" }
  ]);

  setPropsFiltersDisabled(config, true);

  container.innerHTML = `
    <div class="props-locked-box">
      <h3>Player Props Locked</h3>
      <p>Your current plan is <strong>${currentTier}</strong>.</p>
      <p>Upgrade to <strong>All-Star</strong> or higher to unlock ${config.emptyLabel} player props.</p>
      <div style="margin-top: 16px;">
        <a href="pricing.html" class="btn btn-primary">View Plans</a>
      </div>
    </div>
  `;
}

function renderPropsLoginRequiredState(config, container) {
  renderPropsLeaderboard(config.leaderboardId, [], 5);
  renderFilterSummary(config.summaryId, [
    { label: "Tier", value: "Not Logged In" }
  ]);

  setPropsFiltersDisabled(config, true);

  container.innerHTML = `
    <div class="props-locked-box">
      <h3>Login Required</h3>
      <p>Please log in to access ${config.emptyLabel} player props.</p>
      <div style="margin-top: 16px;">
        <a href="auth.html" class="btn btn-primary">Log In</a>
      </div>
    </div>
  `;
}

function renderPropsUpgradeRequiredState(config, container, currentTier) {
  renderPropsLeaderboard(config.leaderboardId, [], 5);
  renderFilterSummary(config.summaryId, [
    { label: "Tier", value: currentTier || "Rookie" }
  ]);

  setPropsFiltersDisabled(config, true);

  container.innerHTML = `
    <div class="props-locked-box">
      <h3>Player Props Locked</h3>
      <p>Your current plan is <strong>${currentTier || "Rookie"}</strong>.</p>
      <p>Upgrade to <strong>All-Star</strong> or higher to unlock ${config.emptyLabel} player props.</p>
      <div style="margin-top: 16px;">
        <a href="pricing.html" class="btn btn-primary">View Plans</a>
      </div>
    </div>
  `;
}

function initializeOddsTierDisplay(pageKey) {
  const config = ODDS_PAGE_CONFIG[pageKey];
  if (!config) return;

  const currentTier = CURRENT_USER_TIER || "Rookie";
  const tierDisplayId = `${pageKey}-tier-display`;
  updateTierDisplay(tierDisplayId);
}

async function fetchCurrentUserProfile() {
  const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();

  if (sessionError || !sessionData.session?.user) {
    return null;
  }

  const user = sessionData.session.user;

  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("id, email, tier, created_at")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Profile fetch error:", profileError.message);
    return null;
  }

  return profile;
}

async function fetchLeagueTrends(csvUrl) {
  if (DATA_CACHE[csvUrl]) return DATA_CACHE[csvUrl];

  const response = await fetch(csvUrl);
  if (!response.ok) throw new Error(`Failed to fetch trends CSV: ${response.status}`);

  const text = await response.text();
  const rows = parseCSV(text);

  DATA_CACHE[csvUrl] = rows;
  return rows;
}

function formatTrendLabel(statKey) {
  const labelMap = {
    hits_last5: "Hits",
    home_runs_last5: "Home Runs",
    rbis_last5: "RBIs",
    runs_scored_last5: "Runs Scored",
    stolen_bases_last5: "Stolen Bases",
    total_bases_last5: "Total Bases",
    strikeouts_last5: "Batter Strikeouts",
    pitcher_strikeouts_last5: "Pitcher Strikeouts",
    pitcher_outs_last5: "Pitcher Outs",
    pitcher_earned_runs_last5: "Pitcher Earned Runs",
    pitcher_hits_allowed_last5: "Pitcher Hits Allowed",
    pitcher_walks_last5: "Pitcher Walks Allowed"
  };

  return labelMap[statKey] || statKey;
}

function formatNBATrendLabel(statKey) {
  const labelMap = {
    points_last5: "Points",
    rebounds_last5: "Rebounds",
    assists_last5: "Assists",
    threes_last5: "3-Pointers",
    steals_last5: "Steals",
    blocks_last5: "Blocks",
    points_assists_last5: "Points + Assists",
    points_rebounds_last5: "Points + Rebounds",
    points_rebounds_assists_last5: "PRA",
    rebounds_assists_last5: "Rebounds + Assists",
    points_1q_last5: "1Q Points",
    rebounds_1q_last5: "1Q Rebounds",
    assists_1q_last5: "1Q Assists"
  };

  return labelMap[statKey] || statKey;
}

function createNBATrendCard(player, statKey) {
  const statValue = Number(player[statKey]);
  const gamesUsed = player.games_used_last5 || "N/A";

  return `
    <div class="leaderboard-item">
      <strong>${player["Player Name"] || "Unknown Player"}</strong>
      <div>${formatNBATrendLabel(statKey)}: ${Number.isNaN(statValue) ? "N/A" : statValue.toFixed(2)}</div>
      <div>Games Used: ${gamesUsed}</div>
    </div>
  `;
}

function createTrendCard(player, statKey) {
  const statValue = Number(player[statKey]);
  const gamesUsed = player.games_used_last5 || "N/A";

  return `
    <div class="leaderboard-item">
      <strong>${player["Player Name"] || "Unknown Player"}</strong>
      <div>${formatTrendLabel(statKey)}: ${Number.isNaN(statValue) ? "N/A" : statValue.toFixed(2)}</div>
      <div>Games Used: ${gamesUsed}</div>
    </div>
  `;
}

function setTrendsFiltersDisabled(filterIds, isDisabled) {
  filterIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = isDisabled;
  });
}

function renderTrendsLockedState(container, summaryId, currentTier, leagueLabel) {
  renderFilterSummary(summaryId, [
    { label: "Tier", value: currentTier || "Rookie" }
  ]);

  container.innerHTML = `
    <div class="props-locked-box">
      <h3>${leagueLabel} Trends Locked</h3>
      <p>Your current plan is <strong>${currentTier || "Rookie"}</strong>.</p>
      <p>Upgrade to <strong>All-Star</strong> or higher to unlock ${leagueLabel} trends.</p>
      <div style="margin-top: 16px;">
        <a href="pricing.html" class="btn btn-primary">View Plans</a>
      </div>
    </div>
  `;
}

async function renderNBATrends() {
  const container = document.getElementById("nba-trends-container");
  if (!container) return;

  updateTierDisplay("nba-tier-display");

  container.innerHTML = `
    <div class="empty-state">
      <h3>Loading NBA trends...</h3>
      <p>Please wait while recent trend data is pulled in.</p>
    </div>
  `;

  try {
    const rows = await fetchLeagueTrends(NBA_TRENDS_CSV_URL);
    updateLastUpdated("nba-trends-last-updated");

    const renderPage = () => {
      const currentTier = CURRENT_USER_TIER || "Rookie";
      const currentRules = TIER_RULES[currentTier] || TIER_RULES.Rookie;

      const filterIds = ["nba-trends-stat-filter", "nba-trends-sort-filter"];

      if (!currentRules.showPlayerProps) {
        setTrendsFiltersDisabled(filterIds, true);
        renderTrendsLockedState(
          container,
          "nba-trends-filter-summary",
          currentTier,
          "NBA"
        );
        return;
      }

      setTrendsFiltersDisabled(filterIds, false);

      const selectedStat =
        document.getElementById("nba-trends-stat-filter")?.value || "points_last5";
      const selectedSort =
        document.getElementById("nba-trends-sort-filter")?.value || "desc";

      let filteredRows = rows
        .filter((row) => row["Player Name"])
        .filter((row) => !Number.isNaN(Number(row[selectedStat])));

      filteredRows.sort((a, b) => {
        const aVal = Number(a[selectedStat]);
        const bVal = Number(b[selectedStat]);
        return selectedSort === "asc" ? aVal - bVal : bVal - aVal;
      });

      renderFilterSummary("nba-trends-filter-summary", [
        { label: "Trend", value: formatNBATrendLabel(selectedStat) },
        { label: "Sort", value: selectedSort === "asc" ? "Lowest First" : "Highest First" },
        { label: "Tier", value: currentTier }
      ]);

      if (filteredRows.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No NBA trends found for this category.</h3>
            <p>Try changing the trend category or sort order.</p>
          </div>
        `;
        return;
      }

      const visibleRows = filteredRows.slice(0, 25);

      container.innerHTML = visibleRows
        .map((row) => createNBATrendCard(row, selectedStat))
        .join("");
    };

    bindSelectChange("nba-trends-stat-filter", renderPage);
    bindSelectChange("nba-trends-sort-filter", renderPage);

    bindButton("nba-trends-reset-filters", () => {
      resetSelectToValue("nba-trends-stat-filter", "points_last5");
      resetSelectToValue("nba-trends-sort-filter", "desc");
      renderPage();
    });

    renderPage();
  } catch (error) {
    console.error("NBA trends render error:", error);

    container.innerHTML = `
      <div class="empty-state">
        <h3>Unable to load NBA trends right now.</h3>
        <p>Please check your published NBA Trends CSV.</p>
      </div>
    `;
  }
}

async function initNBATrendsPage() {
  await updateSessionStatus();
  await renderNBATrends();
}

function formatNHLTrendLabel(statKey) {
  const labelMap = {
    shots_last5: "Shots",
    shots_on_goal_last5: "Shots on Goal",
    goals_last5: "Goals",
    assists_last5: "Assists",
    points_last5: "Points",
    saves_last5: "Saves"
  };

  return labelMap[statKey] || statKey;
}

function createNHLTrendCard(player, statKey) {
  const statValue = Number(player[statKey]);
  const gamesUsed = player.games_used_last5 || "N/A";

  return `
    <div class="leaderboard-item">
      <strong>${player["Player Name"] || "Unknown Player"}</strong>
      <div>${formatNHLTrendLabel(statKey)}: ${Number.isNaN(statValue) ? "N/A" : statValue.toFixed(2)}</div>
      <div>Games Used: ${gamesUsed}</div>
    </div>
  `;
}

async function renderNHLTrends() {
  const container = document.getElementById("nhl-trends-container");
  if (!container) return;

  updateTierDisplay("nhl-tier-display");

  container.innerHTML = `
    <div class="empty-state">
      <h3>Loading NHL trends...</h3>
      <p>Please wait while recent trend data is pulled in.</p>
    </div>
  `;

  try {
    const rows = await fetchLeagueTrends(NHL_TRENDS_CSV_URL);
    updateLastUpdated("nhl-trends-last-updated");

    const renderPage = () => {
      const currentTier = CURRENT_USER_TIER || "Rookie";
      const currentRules = TIER_RULES[currentTier] || TIER_RULES.Rookie;

      const filterIds = ["nhl-trends-stat-filter", "nhl-trends-sort-filter"];

      if (!currentRules.showPlayerProps) {
        setTrendsFiltersDisabled(filterIds, true);
        renderTrendsLockedState(
          container,
          "nhl-trends-filter-summary",
          currentTier,
          "NHL"
        );
        return;
      }

      setTrendsFiltersDisabled(filterIds, false);

      const selectedStat =
        document.getElementById("nhl-trends-stat-filter")?.value || "shots_last5";
      const selectedSort =
        document.getElementById("nhl-trends-sort-filter")?.value || "desc";

      let filteredRows = rows
        .filter((row) => row["Player Name"])
        .filter((row) => !Number.isNaN(Number(row[selectedStat])));

      filteredRows.sort((a, b) => {
        const aVal = Number(a[selectedStat]);
        const bVal = Number(b[selectedStat]);
        return selectedSort === "asc" ? aVal - bVal : bVal - aVal;
      });

      renderFilterSummary("nhl-trends-filter-summary", [
        { label: "Trend", value: formatNHLTrendLabel(selectedStat) },
        { label: "Sort", value: selectedSort === "asc" ? "Lowest First" : "Highest First" },
        { label: "Tier", value: currentTier }
      ]);

      if (filteredRows.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No NHL trends found for this category today.</h3>
            <p>Please check back when NHL trend data is available.</p>
          </div>
        `;
        return;
      }

      const visibleRows = filteredRows.slice(0, 25);

      container.innerHTML = visibleRows
        .map((row) => createNHLTrendCard(row, selectedStat))
        .join("");
    };

    bindSelectChange("nhl-trends-stat-filter", renderPage);
    bindSelectChange("nhl-trends-sort-filter", renderPage);

    bindButton("nhl-trends-reset-filters", () => {
      resetSelectToValue("nhl-trends-stat-filter", "shots_last5");
      resetSelectToValue("nhl-trends-sort-filter", "desc");
      renderPage();
    });

    renderPage();
  } catch (error) {
    console.error("NHL trends render error:", error);

    container.innerHTML = `
      <div class="empty-state">
        <h3>No NHL trends available right now.</h3>
        <p>Please check back when NHL games and trend data are live.</p>
      </div>
    `;
  }
}

async function initNHLTrendsPage() {
  await updateSessionStatus();
  await renderNHLTrends();
}

async function renderMLBTrends() {
  const container = document.getElementById("mlb-trends-container");
  if (!container) return;

  updateTierDisplay("mlb-tier-display");

  container.innerHTML = `
    <div class="empty-state">
      <h3>Loading MLB trends...</h3>
      <p>Please wait while recent trend data is pulled in.</p>
    </div>
  `;

  try {
    const rows = await fetchLeagueTrends(MLB_TRENDS_CSV_URL);
    updateLastUpdated("mlb-trends-last-updated");

    const renderPage = () => {
      const currentTier = CURRENT_USER_TIER || "Rookie";
      const currentRules = TIER_RULES[currentTier] || TIER_RULES.Rookie;

      const filterIds = ["mlb-trends-stat-filter", "mlb-trends-sort-filter"];

      if (!currentRules.showPlayerProps) {
        setTrendsFiltersDisabled(filterIds, true);
        renderTrendsLockedState(
          container,
          "mlb-trends-filter-summary",
          currentTier,
          "MLB"
        );
        return;
      }

      setTrendsFiltersDisabled(filterIds, false);

      const selectedStat =
        document.getElementById("mlb-trends-stat-filter")?.value || "hits_last5";
      const selectedSort =
        document.getElementById("mlb-trends-sort-filter")?.value || "desc";

      let filteredRows = rows
        .filter((row) => row["Player Name"])
        .filter((row) => !Number.isNaN(Number(row[selectedStat])));

      filteredRows.sort((a, b) => {
        const aVal = Number(a[selectedStat]);
        const bVal = Number(b[selectedStat]);
        return selectedSort === "asc" ? aVal - bVal : bVal - aVal;
      });

      renderFilterSummary("mlb-trends-filter-summary", [
        { label: "Trend", value: formatTrendLabel(selectedStat) },
        { label: "Sort", value: selectedSort === "asc" ? "Lowest First" : "Highest First" },
        { label: "Tier", value: currentTier }
      ]);

      if (filteredRows.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No MLB trends found for this category.</h3>
            <p>Try changing the trend category or sort order.</p>
          </div>
        `;
        return;
      }

      const visibleRows = filteredRows.slice(0, 25);

      container.innerHTML = visibleRows
        .map((row) => createTrendCard(row, selectedStat))
        .join("");
    };

    bindSelectChange("mlb-trends-stat-filter", renderPage);
    bindSelectChange("mlb-trends-sort-filter", renderPage);

    bindButton("mlb-trends-reset-filters", () => {
      resetSelectToValue("mlb-trends-stat-filter", "hits_last5");
      resetSelectToValue("mlb-trends-sort-filter", "desc");
      renderPage();
    });

    renderPage();
  } catch (error) {
    console.error("MLB trends render error:", error);

    container.innerHTML = `
      <div class="empty-state">
        <h3>Unable to load MLB trends right now.</h3>
        <p>Please check your published MLB Trends CSV.</p>
      </div>
    `;
  }
}

async function initMLBTrendsPage() {
  await updateSessionStatus();
  await renderMLBTrends();
}

function renderNBABets() { return renderOddsPage("nba"); }
function renderNHLBets() { return renderOddsPage("nhl"); }
function renderMLBBets() { return renderOddsPage("mlb"); }

function renderNBAProps() { return renderPropsPage("nba"); }
function renderNHLProps() { return renderPropsPage("nhl"); }
function renderMLBProps() { return renderPropsPage("mlb"); }

async function initNBABetsPage() {
  await updateSessionStatus();
  await renderNBABets();
}

async function initNHLBetsPage() {
  await updateSessionStatus();
  await renderNHLBets();
}

async function initMLBBetsPage() {
  await updateSessionStatus();
  await renderMLBBets();
}

async function initNBAPropsPage() {
  await updateSessionStatus();
  await renderNBAProps();
}

async function initNHLPropsPage() {
  await updateSessionStatus();
  await renderNHLProps();
}

async function initMLBPropsPage() {
  await updateSessionStatus();
  await renderMLBProps();
}

document.addEventListener("DOMContentLoaded", () => {
  updateNavAuthState();
  initAuthPage();
});