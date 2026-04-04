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
const NHL_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYTgu9bsGUhI1gicOOfLrgYHmNMfrl3W1OKhAVs9cdrdd2CagJZSVM3F25hQ8vk0aRK7hapVmbNWQP/pub?gid=959803781&single=true&output=csv";
const MLB_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=989861231&single=true&output=csv";

const NBA_PROPS_PREMIUM_URL = "/.netlify/functions/nba-props-premium";
const NBA_PROPS_TEASER_URL = "/.netlify/functions/nba-props-teaser";
const NHL_PROPS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYTgu9bsGUhI1gicOOfLrgYHmNMfrl3W1OKhAVs9cdrdd2CagJZSVM3F25hQ8vk0aRK7hapVmbNWQP/pub?gid=1839953184&single=true&output=csv";
const MLB_PROPS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=1502960090&single=true&output=csv";

const TIER_RULES = {
  Rookie: {
    maxRankingsPerGame: 1,
    showPlayerProps: false,
    maxPropsToShow: 0,
    showTopBet: false,
    showLeaderboardCount: 3
  },
  Veteran: {
    maxRankingsPerGame: 3,
    showPlayerProps: false,
    maxPropsToShow: 0,
    showTopBet: false,
    showLeaderboardCount: 5
  },
  "All-Star": {
    maxRankingsPerGame: 99,
    showPlayerProps: true,
    maxPropsToShow: 5,
    showTopBet: false,
    showLeaderboardCount: 7
  },
  "Hall-of-Famer": {
    maxRankingsPerGame: 99,
    showPlayerProps: true,
    maxPropsToShow: 10,
    showTopBet: true,
    showLeaderboardCount: 10
  },
  Legend: {
    maxRankingsPerGame: 99,
    showPlayerProps: true,
    maxPropsToShow: 999,
    showTopBet: true,
    showLeaderboardCount: 15
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
    tierFilterId: "nba-tier-filter",
    resetButtonId: "nba-props-reset-filters",
    seeButtonId: "nba-see-props-btn",
    lastUpdatedId: "nba-props-last-updated",
    emptyLabel: "NBA"
  },
  nhl: {
    csvUrl: NHL_PROPS_CSV_URL,
    containerId: "nhl-props-container",
    leaderboardId: "nhl-props-leaderboard",
    summaryId: "nhl-props-filter-summary",
    gameFilterId: "nhl-props-game-filter",
    propTypeFilterId: "nhl-prop-type-filter",
    playerFilterId: "nhl-player-filter",
    sportsbookFilterId: "nhl-props-sportsbook-filter",
    sortFilterId: "nhl-props-sort-filter",
    tierFilterId: "nhl-tier-filter",
    resetButtonId: "nhl-props-reset-filters",
    seeButtonId: "nhl-see-props-btn",
    lastUpdatedId: "nhl-props-last-updated",
    emptyLabel: "NHL"
  },
  mlb: {
    csvUrl: MLB_PROPS_CSV_URL,
    containerId: "mlb-props-container",
    leaderboardId: "mlb-props-leaderboard",
    summaryId: "mlb-props-filter-summary",
    gameFilterId: "mlb-props-game-filter",
    propTypeFilterId: "mlb-prop-type-filter",
    playerFilterId: "mlb-player-filter",
    sportsbookFilterId: "mlb-props-sportsbook-filter",
    sortFilterId: "mlb-props-sort-filter",
    tierFilterId: "mlb-tier-filter",
    resetButtonId: "mlb-props-reset-filters",
    seeButtonId: "mlb-see-props-btn",
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
    container.innerHTML = `<div class="filter-summary-empty">No props available for the current filters.</div>`;
    return;
  }

  const topProps = [...props]
    .sort((a, b) => b.ev - a.ev)
    .slice(0, limit);

  container.innerHTML = topProps
    .map((prop, index) => {
      const fullName = getPropFullName(prop);
      const probabilityText = formatProbability(prop.poissonProbOver);

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
      const playerName = safeText(row["Player Name"], "");
      const playerFirstName = safeText(row["Player First Name"], "");
      const playerLastName = safeText(row["Player Last Name"], "");
      const vendor = safeText(row["Vendor"], "");
      const propType = safeText(row["Prop Type"], "");
      const lineValue = safeText(row["Line Value"], "");
      const betType = safeText(row["Type"], "");
      const overOdds = safeText(row["Over Odds"], "");
      const underOdds = safeText(row["Under Odds"], "");
      const genericOdds = safeText(row["Odds"], "");
      const poissonProbOver = toNumber(row["Poisson Prob Over"]);
      const ev = toNumber(row["EV (Over/Milestone Side)"]);
      const awayTeam = safeText(row["Away Team"], "");
      const homeTeam = safeText(row["Home Team"], "");
      const matchup = safeText(row["Matchup"], "");

      let gameLabel = "";
      if (awayTeam && homeTeam) {
        gameLabel = `${awayTeam} at ${homeTeam}`;
      } else if (matchup) {
        gameLabel = matchup;
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
  const probabilityText = formatProbability(prop.poissonProbOver);
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
        <div class="ev-badge">EV: ${formatEV(prop.ev)}</div>
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
      throw new Error("Unable to get session for protected props request.");
    }

    const accessToken = data.session?.access_token;

    if (!accessToken) {
      throw new Error("No access token available for protected props request.");
    }

    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(csvUrl, { headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch props CSV: ${response.status}`);
  }

  const text = await response.text();
  const rows = parseCSV(text);
  const props = buildPropsFromRows(rows);
  const today = getTodayDateString();

  const todaysProps = props
    .filter((prop) => prop.gameDate === today)
    .sort((a, b) => b.ev - a.ev);

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
  return Number.isNaN(prop.poissonProbOver) ? -Infinity : prop.poissonProbOver;
}

function sortProps(props, sortValue) {
  const sorted = [...props];

  switch (sortValue) {
    case "ev-asc":
      return sorted.sort((a, b) => a.ev - b.ev);
    case "prob-desc":
      return sorted.sort((a, b) => getPropProbabilityValue(b) - getPropProbabilityValue(a));
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

async function renderOddsPage(pageKey) {
  const config = ODDS_PAGE_CONFIG[pageKey];
  const container = document.getElementById(config.containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <h3>Loading ${config.emptyLabel} bets...</h3>
      <p>Please wait while live data is pulled from Google Sheets.</p>
    </div>
  `;

  try {
    const games = await fetchLeagueGames(config.csvUrl);
    updateLastUpdated(config.lastUpdatedId);

    const renderPage = () => {
      const selectedVendor = document.getElementById(config.sportsbookFilterId)?.value || "All";
      const selectedGame = document.getElementById(config.gameFilterId)?.value || "All";
      const selectedTier = getSelectedTier(config.tierFilterId);

      let filteredGames = games;

      if (selectedVendor !== "All") {
        filteredGames = filteredGames.filter((game) => game.vendor === selectedVendor);
      }

      if (selectedGame !== "All") {
        filteredGames = filteredGames.filter((game) => getGameLabel(game) === selectedGame);
      }

      renderFilterSummary(config.summaryId, [
        { label: "Game", value: selectedGame },
        { label: "Sportsbook", value: selectedVendor },
        { label: "Tier", value: selectedTier !== "Rookie" ? selectedTier : "All" }
      ]);

      renderLeaderboard(config.leaderboardId, filteredGames, selectedTier);

      if (filteredGames.length === 0) {
        renderEmptyState(container, `No ${config.emptyLabel} games found for this filter combination.`);
        return;
      }

      container.innerHTML = filteredGames
        .map((game) => createBetCard(game, selectedTier))
        .join("");
    };

    populateSportsbookFilter(config.sportsbookFilterId, games, renderPage);
    populateGameFilter(config.gameFilterId, games, getGameLabel, renderPage);
    bindSelectChange(config.tierFilterId, renderPage);

    bindButton(config.resetButtonId, () => {
      resetSelectToAll(config.sportsbookFilterId);
      resetSelectToAll(config.gameFilterId);
      resetSelectToValue(config.tierFilterId, "Rookie");
      renderPage();
    });

    bindButton(config.seeButtonId, renderPage);
    renderPage();
  } catch (error) {
    console.error(`${config.emptyLabel} render error:`, error);
    renderLeaderboard(config.leaderboardId, [], "Rookie");
    renderFilterSummary(config.summaryId, []);
    renderEmptyState(container, `Unable to load ${config.emptyLabel} data right now.`);
  }
}

async function renderPropsPage(pageKey) {
  const config = PROPS_PAGE_CONFIG[pageKey];
  const container = document.getElementById(config.containerId);
  if (!container) return;

  try {
    const props = await fetchLeagueProps(config.csvUrl);
    updateLastUpdated(config.lastUpdatedId);

    const renderPage = () => {
  const currentTier = CURRENT_USER_TIER || "Rookie";
  const currentRules = TIER_RULES[currentTier] || TIER_RULES.Rookie;

  console.log("renderPropsPage currentTier:", currentTier);
  console.log("renderPropsPage currentRules:", currentRules);

  if (!currentRules.showPlayerProps) {
  renderPropsLeaderboard(config.leaderboardId, [], 5);
  renderFilterSummary(config.summaryId, [
    { label: "Tier", value: currentTier !== "Rookie" ? currentTier : "All" }
  ]);

  container.innerHTML = `
    <div class="props-locked-box">
      <h3>Player Props Locked</h3>
      <p>Upgrade to All-Star or higher to unlock ${config.emptyLabel} player props.</p>
    </div>
  `;
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

    bindButton(config.seeButtonId, renderPage);
    renderPage();
  } catch (error) {
    console.error(`${config.emptyLabel} props render error:`, error);
    renderPropsLeaderboard(config.leaderboardId, [], 5);

    const summary = document.getElementById(config.summaryId);
    if (summary) {
      summary.innerHTML = `<div class="filter-summary-empty">Unable to build filter summary right now.</div>`;
    }

    container.innerHTML = `
      <div class="empty-state">
        <h3>Unable to load ${config.emptyLabel} props right now.</h3>
        <p>Please check your published ${config.emptyLabel} Player Props CSV and current JS filters.</p>
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

async function renderHomeSpotlights() {
  try {
    const [nbaGames, nhlGames, mlbGames, nbaProps, nhlProps, mlbProps] = await Promise.all([
      fetchLeagueGames(NBA_CSV_URL).catch(() => []),
      fetchLeagueGames(NHL_CSV_URL).catch(() => []),
      fetchLeagueGames(MLB_CSV_URL).catch(() => []),
      fetchTeaserPropsJson(NBA_PROPS_TEASER_URL).catch(() => []),
      fetchLeagueProps(NHL_PROPS_CSV_URL).catch(() => []),
      fetchLeagueProps(MLB_PROPS_CSV_URL).catch(() => [])
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
        meta: `${topNBAGame.vendor} | ${topNBAGame.gameDate}`,
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
        meta: `${topNHLGame.vendor} | ${topNHLGame.gameDate}`,
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
        meta: `${topMLBGame.vendor} | ${topMLBGame.gameDate}`,
        ev: bestRank.ev,
        subtext: `Top Bet: ${bestRank.bet}`
      });
    } else {
      renderHomeSpotlightCard("home-top-mlb-bet", null);
    }

    if (topNBAProp) {
      renderHomeSpotlightCard("home-top-nba-prop", {
        title: `${getPropFullName(topNBAProp)} — ${formatPropTypeLabel(topNBAProp.propType)}`,
        meta: `${topNBAProp.vendor} | ${topNBAProp.gameDate || "Today"}`,
        ev: topNBAProp.ev,
        subtext: `Bet: ${topNBAProp.betType} ${formatLineValue(topNBAProp.lineValue)}`
      });
    } else {
      renderHomeSpotlightCard("home-top-nba-prop", null);
    }

    if (topNHLProp) {
      renderHomeSpotlightCard("home-top-nhl-prop", {
        title: `${getPropFullName(topNHLProp)} — ${formatPropTypeLabel(topNHLProp.propType)}`,
        meta: `${topNHLProp.vendor} | ${topNHLProp.gameDate || "Today"}`,
        ev: topNHLProp.ev,
        subtext: `Bet: ${topNHLProp.betType} ${formatLineValue(topNHLProp.lineValue)}`
      });
    } else {
      renderHomeSpotlightCard("home-top-nhl-prop", null);
    }

    if (topMLBProp) {
      renderHomeSpotlightCard("home-top-mlb-prop", {
        title: `${getPropFullName(topMLBProp)} — ${formatPropTypeLabel(topMLBProp.propType)}`,
        meta: `${topMLBProp.vendor} | ${topMLBProp.gameDate || "Today"}`,
        ev: topMLBProp.ev,
        subtext: `Bet: ${topMLBProp.betType} ${formatLineValue(topMLBProp.lineValue)}`
      });
    } else {
      renderHomeSpotlightCard("home-top-mlb-prop", null);
    }
  } catch (error) {
    console.error("Home spotlight render error:", error);

    renderHomeSpotlightCard("home-top-nba-bet", null);
    renderHomeSpotlightCard("home-top-nba-prop", null);
    renderHomeSpotlightCard("home-top-nhl-bet", null);
    renderHomeSpotlightCard("home-top-nhl-prop", null);
    renderHomeSpotlightCard("home-top-mlb-bet", null);
    renderHomeSpotlightCard("home-top-mlb-prop", null);
  }
}

async function renderHomeTopProps() {
  const container = document.getElementById("home-top-props");
  if (!container) return;

  try {
    const [nbaProps, nhlProps, mlbProps] = await Promise.all([
      fetchTeaserPropsJson(NBA_PROPS_TEASER_URL).catch(() => []),
      fetchLeagueProps(NHL_PROPS_CSV_URL).catch(() => []),
      fetchLeagueProps(MLB_PROPS_CSV_URL).catch(() => [])
    ]);

    const allProps = [...nbaProps, ...nhlProps, ...mlbProps].sort((a, b) => b.ev - a.ev);

    const visibleProps = allProps.slice(0, 5);

    if (visibleProps.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No props available right now.</h3>
          <p>Please check back once today’s props are live.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = visibleProps
      .map((prop, index) => {
        const fullName = getPropFullName(prop);
        const probabilityText = formatProbability(prop.poissonProbOver);

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
  } catch (error) {
    console.error("Home top props render error:", error);
    container.innerHTML = `
      <div class="empty-state">
        <h3>Unable to load top props right now.</h3>
        <p>Please try again later.</p>
      </div>
    `;
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

    console.log("updateSessionStatus profile:", profile);
    console.log("updateSessionStatus CURRENT_USER_TIER:", CURRENT_USER_TIER);

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

    if (statusEl) statusEl.textContent = "Not currently logged in.";
    if (tierEl) tierEl.textContent = "Tier: --";
  }
}

function initAuthPage() {
  const signupForm = document.getElementById("signup-form");
  const loginForm = document.getElementById("login-form");
  const logoutBtn = document.getElementById("logout-btn");
  const signupMessage = document.getElementById("signup-message");
  const loginMessage = document.getElementById("login-message");

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
        signupMessage.textContent = "Account created successfully. You can now log in.";
      }

      updateSessionStatus();
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

      updateSessionStatus();
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      await updateSessionStatus();
    });
  }

  updateSessionStatus();
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

function renderNBABets() { return renderOddsPage("nba"); }
function renderNHLBets() { return renderOddsPage("nhl"); }
function renderMLBBets() { return renderOddsPage("mlb"); }

function renderNBAProps() { return renderPropsPage("nba"); }
function renderNHLProps() { return renderPropsPage("nhl"); }
function renderMLBProps() { return renderPropsPage("mlb"); }

async function initNBAPropsPage() {
  await updateSessionStatus();
  await renderNBAProps();
}
document.addEventListener("DOMContentLoaded", () => {
  initAuthPage();
});