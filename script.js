const SUPABASE_URL = "https://mbnptpnxmbeccqqfbtnd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibnB0cG54bWJlY2NxcWZidG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODE4MTcsImV4cCI6MjA5MDc1NzgxN30.deQoUkejk1NtRGxCY-CtJSX65qREdXqYpPwxLjpI7b4";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("SCRIPT VERSION TEST - 7:50 AM");

let CURRENT_USER = null;
let CURRENT_USER_PROFILE = null;
let CURRENT_USER_TIER = "Rookie";
let CURRENT_TEAM_TRENDS = [];

const DATA_CACHE = {
  games: {},
  props: {}
};

const NBA_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=1553479471&single=true&output=csv";
const NBA_ROSTERS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=2086896815&single=true&output=csv";
const NBA_SCHEDULE_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=1724367340&single=true&output=csv";
const NBA_TRENDS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=1458653646&single=true&output=csv";
const NBA_TEAM_GAME_LOGS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=572928850&single=true&output=csv";
const NBA_TEAM_SEASON_STATS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=1732528649&single=true&output=csv";
const NBA_TEAM_TRENDS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=133740316&single=true&output=csv";
const NHL_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYTgu9bsGUhI1gicOOfLrgYHmNMfrl3W1OKhAVs9cdrdd2CagJZSVM3F25hQ8vk0aRK7hapVmbNWQP/pub?gid=959803781&single=true&output=csv";
const NHL_PLAYERS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYTgu9bsGUhI1gicOOfLrgYHmNMfrl3W1OKhAVs9cdrdd2CagJZSVM3F25hQ8vk0aRK7hapVmbNWQP/pub?gid=445713385&single=true&output=csv";
const NHL_SCHEDULE_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYTgu9bsGUhI1gicOOfLrgYHmNMfrl3W1OKhAVs9cdrdd2CagJZSVM3F25hQ8vk0aRK7hapVmbNWQP/pub?gid=2048323486&single=true&output=csv";
const NHL_TRENDS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYTgu9bsGUhI1gicOOfLrgYHmNMfrl3W1OKhAVs9cdrdd2CagJZSVM3F25hQ8vk0aRK7hapVmbNWQP/pub?gid=620239444&single=true&output=csv";
const NHL_TEAM_GAME_LOGS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYTgu9bsGUhI1gicOOfLrgYHmNMfrl3W1OKhAVs9cdrdd2CagJZSVM3F25hQ8vk0aRK7hapVmbNWQP/pub?gid=593607447&single=true&output=csv";
const NHL_TEAM_SEASON_STATS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYTgu9bsGUhI1gicOOfLrgYHmNMfrl3W1OKhAVs9cdrdd2CagJZSVM3F25hQ8vk0aRK7hapVmbNWQP/pub?gid=1859902621&single=true&output=csv";
const NHL_TEAM_TRENDS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYTgu9bsGUhI1gicOOfLrgYHmNMfrl3W1OKhAVs9cdrdd2CagJZSVM3F25hQ8vk0aRK7hapVmbNWQP/pub?gid=482198043&single=true&output=csv";
const MLB_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=989861231&single=true&output=csv";
const MLB_SCHEDULE_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=314629327&single=true&output=csv";
const MLB_TRENDS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=1443511953&single=true&output=csv";
const MLB_TEAM_GAME_LOGS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=1820985984&single=true&output=csv";
const MLB_TEAM_SEASON_STATS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=1542865210&single=true&output=csv";
const MLB_TEAM_TRENDS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=2103952049&single=true&output=csv";
const MLB_TOP_PLAYER_TRENDS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=111828453&single=true&output=csv";
const MLB_TOP_TEAM_TRENDS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=1644397014&single=true&output=csv";
const NFL_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7eg-0liRvxa9q2k6IM2mipst48DHUMa8yXltD8irldOtim2Emic7w0rtl1gfT5xl_AVhR29jBrqY1/pub?gid=1933017030&single=true&output=csv";
const NFL_ROSTERS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7eg-0liRvxa9q2k6IM2mipst48DHUMa8yXltD8irldOtim2Emic7w0rtl1gfT5xl_AVhR29jBrqY1/pub?gid=1700733763&single=true&output=csv";
const NFL_SCHEDULE_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7eg-0liRvxa9q2k6IM2mipst48DHUMa8yXltD8irldOtim2Emic7w0rtl1gfT5xl_AVhR29jBrqY1/pub?gid=1131205016&single=true&output=csv";
const NFL_TRENDS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7eg-0liRvxa9q2k6IM2mipst48DHUMa8yXltD8irldOtim2Emic7w0rtl1gfT5xl_AVhR29jBrqY1/pub?gid=1953623841&single=true&output=csv";
const NFL_TEAM_GAME_LOGS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7eg-0liRvxa9q2k6IM2mipst48DHUMa8yXltD8irldOtim2Emic7w0rtl1gfT5xl_AVhR29jBrqY1/pub?gid=1231176215&single=true&output=csv";
const NFL_TEAM_SEASON_STATS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7eg-0liRvxa9q2k6IM2mipst48DHUMa8yXltD8irldOtim2Emic7w0rtl1gfT5xl_AVhR29jBrqY1/pub?gid=1207032232&single=true&output=csv";
const NFL_TEAM_TRENDS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7eg-0liRvxa9q2k6IM2mipst48DHUMa8yXltD8irldOtim2Emic7w0rtl1gfT5xl_AVhR29jBrqY1/pub?gid=40257281&single=true&output=csv";

const NBA_PROPS_PREMIUM_URL = "/.netlify/functions/nba-props-premium";
const NBA_PROPS_TEASER_URL = "/.netlify/functions/nba-props-teaser";
const NHL_PROPS_PREMIUM_URL = "/.netlify/functions/nhl-props-premium";
const NHL_PROPS_TEASER_URL = "/.netlify/functions/nhl-props-teaser";
const MLB_PROPS_PREMIUM_URL = "/.netlify/functions/mlb-props-premium";
const MLB_PROPS_TEASER_URL = "/.netlify/functions/mlb-props-teaser";
const NFL_PROPS_PREMIUM_URL = "/.netlify/functions/nfl-props-premium";
const NFL_PROPS_TEASER_URL = "/.netlify/functions/nfl-props-teaser";

const TEAM_PROFILE_CONFIG = {

  nfl: {
    seasonStats: NFL_TEAM_SEASON_STATS_CSV_URL,
    teamTrends: NFL_TEAM_TRENDS_CSV_URL,
    schedule: NFL_SCHEDULE_CSV_URL,
    teamGameLogs: NFL_TEAM_GAME_LOGS_CSV_URL
  },

  nba: {
    seasonStats: NBA_TEAM_SEASON_STATS_CSV_URL,
    teamTrends: NBA_TEAM_TRENDS_CSV_URL,
    schedule: NBA_SCHEDULE_CSV_URL,
    teamGameLogs: NBA_TEAM_GAME_LOGS_CSV_URL
  },

  nhl: {
    seasonStats: NHL_TEAM_SEASON_STATS_CSV_URL,
    teamTrends: NHL_TEAM_TRENDS_CSV_URL,
    schedule: NHL_SCHEDULE_CSV_URL,
    teamGameLogs: NHL_TEAM_GAME_LOGS_CSV_URL
  },

  mlb: {
    seasonStats: MLB_TEAM_SEASON_STATS_CSV_URL,
    teamTrends: MLB_TEAM_TRENDS_CSV_URL,
    schedule: MLB_SCHEDULE_CSV_URL,
    teamGameLogs: MLB_TEAM_GAME_LOGS_CSV_URL
  }

};

const TIER_RULES = {
  Rookie: {
    maxRankingsPerGame: 5,
    showPlayerProps: false,
    showGameOdds: true,
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
  },

  nfl: {
    csvUrl: NFL_CSV_URL,
    containerId: "nfl-bets-container",
    leaderboardId: "nfl-leaderboard",
    summaryId: "nfl-odds-filter-summary",
    sportsbookFilterId: "nfl-sportsbook-filter",
    gameFilterId: "nfl-game-filter",
    tierFilterId: "nfl-tier-filter",
    resetButtonId: "nfl-odds-reset-filters",
    seeButtonId: "nfl-see-odds-btn",
    lastUpdatedId: "nfl-last-updated",
    emptyLabel: "NFL"
  }
};

const PROPS_PAGE_CONFIG = {
  nba: {
    csvUrl: NBA_PROPS_PREMIUM_URL,
    teaserUrl: NBA_PROPS_TEASER_URL,
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
    teaserUrl: NHL_PROPS_TEASER_URL,
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
    teaserUrl: MLB_PROPS_TEASER_URL,
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
  },

  nfl: {
    csvUrl: NFL_PROPS_PREMIUM_URL,
    teaserUrl: NFL_PROPS_TEASER_URL,
    containerId: "nfl-props-container",
    leaderboardId: "nfl-props-leaderboard",
    summaryId: "nfl-props-filter-summary",
    gameFilterId: "nfl-props-game-filter",
    propTypeFilterId: "nfl-prop-type-filter",
    playerFilterId: "nfl-player-filter",
    sportsbookFilterId: "nfl-props-sportsbook-filter",
    sortFilterId: "nfl-props-sort-filter",
    resetButtonId: "nfl-props-reset-filters",
    lastUpdatedId: "nfl-props-last-updated",
    emptyLabel: "NFL"
  }
};

async function fetchSchedule(league) {

  const config = TEAM_PROFILE_CONFIG[league];

  if (!config) return [];

  const response =
    await fetch(config.schedule);

  const csv =
    await response.text();

  return parseCSV(csv);

}

async function fetchTeamSeasonStats(league) {

  const config = TEAM_PROFILE_CONFIG[league];

  if (!config) return [];

  const response = await fetch(config.seasonStats);

  const csv = await response.text();

  return parseCSV(csv);

}

async function fetchTeamTrends(league) {

  const config = TEAM_PROFILE_CONFIG[league];

  if (!config) return [];

  const response = await fetch(config.teamTrends);

  const csv = await response.text();

  return parseCSV(csv);

}

async function fetchTeamSchedule(league) {

  const config = TEAM_PROFILE_CONFIG[league];

  if (!config) return [];

  const response = await fetch(config.schedule);

  const csv = await response.text();

  return parseCSV(csv);

}

async function fetchTeamGameLogs(league) {

  const config = TEAM_PROFILE_CONFIG[league];

  if (!config || !config.teamGameLogs) return [];

  const response = await fetch(config.teamGameLogs);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${league.toUpperCase()} team game logs: ${response.status}`
    );
  }

  const csv = await response.text();

  return parseCSV(csv);
}

function renderTeamGameLog(games, league = "nfl") {

  const container =
    document.getElementById("team-game-log-content");

  if (!container) return;

  if (!games || !games.length) {

    container.innerHTML = `
      <div class="team-performance-empty">
        No recent games found.
      </div>
    `;

    return;
  }

  const sortedGames = [...games]
    .sort((a, b) => {
      return (
        new Date(b["Game Date"]).getTime() -
        new Date(a["Game Date"]).getTime()
      );
    })
    .slice(0, 10);

  if (league === "nfl") {

    container.innerHTML = `

      <div class="team-performance-table-wrap">

        <table class="team-performance-table">

          <thead>

            <tr>
              <th>Date</th>
              <th>Opponent</th>
              <th>Result</th>
              <th>PF</th>
              <th>PA</th>
              <th>Pass Yds</th>
              <th>Rush Yds</th>
              <th>TO</th>
              <th>Sacks</th>
            </tr>

          </thead>

          <tbody>

            ${sortedGames
              .map(createNFLTeamGameLogRow)
              .join("")}

          </tbody>

        </table>

      </div>

    `;

    return;
  }

  if (league === "mlb") {

    container.innerHTML = `

      <div class="team-performance-table-wrap">

        <table class="team-performance-table">

          <thead>

            <tr>
              <th>Date</th>
              <th>Opponent</th>
              <th>Result</th>
              <th>R</th>
              <th>RA</th>
              <th>Hits</th>
              <th>HR</th>
              <th>TB</th>
              <th>SO</th>
            </tr>

          </thead>

          <tbody>

            ${sortedGames
              .map(createMLBTeamGameLogRow)
              .join("")}

          </tbody>

        </table>

      </div>

    `;

    return;
  }

  if (league === "nba") {

    container.innerHTML = `

      <div class="team-performance-table-wrap">

        <table class="team-performance-table">

          <thead>

            <tr>
              <th>Date</th>
              <th>Opponent</th>
              <th>Result</th>
              <th>PF</th>
              <th>PA</th>
              <th>REB</th>
              <th>AST</th>
              <th>3PM</th>
              <th>TO</th>
            </tr>

          </thead>

          <tbody>

            ${sortedGames
              .map(createNBATeamGameLogRow)
              .join("")}

          </tbody>

        </table>

      </div>

    `;

    return;
  }

  if (league === "nhl") {

    container.innerHTML = `

      <div class="team-performance-table-wrap">

        <table class="team-performance-table">

          <thead>

            <tr>
              <th>Date</th>
              <th>Opponent</th>
              <th>Result</th>
              <th>GF</th>
              <th>GA</th>
              <th>SOG</th>
              <th>AST</th>
              <th>PTS</th>
              <th>SV</th>
            </tr>

          </thead>

          <tbody>

            ${sortedGames
              .map(createNHLTeamGameLogRow)
              .join("")}

          </tbody>

        </table>

      </div>

    `;

    return;
  }

  container.innerHTML =
    "<p>Recent-performance table not configured for this league yet.</p>";
}


function createNFLTeamGameLogRow(game) {

  const pointsFor =
    Number(game["Points For"] || 0);

  const pointsAllowed =
    Number(game["Points Allowed"] || 0);

  let result = "T";

  if (pointsFor > pointsAllowed) {
    result = "W";
  }

  if (pointsFor < pointsAllowed) {
    result = "L";
  }

  const resultClass =
    result === "W"
      ? "team-result-win"
      : result === "L"
        ? "team-result-loss"
        : "team-result-tie";

  return `

    <tr>

      <td>
        ${game["Game Date"] || "-"}
      </td>

      <td>
        ${game["Opponent"] || "-"}
      </td>

      <td>
        <span class="${resultClass}">
          ${result} ${pointsFor}-${pointsAllowed}
        </span>
      </td>

      <td>
        ${game["Points For"] || "0"}
      </td>

      <td>
        ${game["Points Allowed"] || "0"}
      </td>

      <td>
        ${game["Passing Yards"] || "0"}
      </td>

      <td>
        ${game["Rushing Yards"] || "0"}
      </td>

      <td>
        ${game["Turnovers"] || "0"}
      </td>

      <td>
        ${game["Sacks"] || "0"}
      </td>

    </tr>

  `;
}

function createMLBTeamGameLogRow(game) {

  const runsFor =
    Number(game["Runs For"] || 0);

  const runsAllowed =
    Number(game["Runs Allowed"] || 0);

  let result = "T";

  if (runsFor > runsAllowed) {
    result = "W";
  }

  if (runsFor < runsAllowed) {
    result = "L";
  }

  const resultClass =
    result === "W"
      ? "team-result-win"
      : result === "L"
        ? "team-result-loss"
        : "team-result-tie";

  return `

    <tr>

      <td>
        ${game["Game Date"] || "-"}
      </td>

      <td>
        ${game["Opponent"] || "-"}
      </td>

      <td>
        <span class="${resultClass}">
          ${result} ${runsFor}-${runsAllowed}
        </span>
      </td>

      <td>
        ${game["Runs For"] || "0"}
      </td>

      <td>
        ${game["Runs Allowed"] || "0"}
      </td>

      <td>
        ${game["Hits"] || "0"}
      </td>

      <td>
        ${game["Home Runs"] || "0"}
      </td>

      <td>
        ${game["Total Bases"] || "0"}
      </td>

      <td>
        ${game["Strikeouts"] || "0"}
      </td>

    </tr>

  `;
}

function createNHLTeamGameLogRow(game) {

  const goalsFor =
    Number(game["Goals For"] || 0);

  const goalsAllowed =
    Number(game["Goals Allowed"] || 0);

  let result = "T";

  if (goalsFor > goalsAllowed) {
    result = "W";
  }

  if (goalsFor < goalsAllowed) {
    result = "L";
  }

  const resultClass =
    result === "W"
      ? "team-result-win"
      : result === "L"
        ? "team-result-loss"
        : "team-result-tie";

  return `

    <tr>

      <td>
        ${game["Game Date"] || "-"}
      </td>

      <td>
        ${game["Opponent"] || "-"}
      </td>

      <td>
        <span class="${resultClass}">
          ${result} ${goalsFor}-${goalsAllowed}
        </span>
      </td>

      <td>
        ${game["Goals For"] || "0"}
      </td>

      <td>
        ${game["Goals Allowed"] || "0"}
      </td>

      <td>
        ${game["Shots On Goal"] || "0"}
      </td>

      <td>
        ${game["Assists"] || "0"}
      </td>

      <td>
        ${game["Points"] || "0"}
      </td>

      <td>
        ${game["Saves"] || "0"}
      </td>

    </tr>

  `;
}

function createNBATeamGameLogRow(game) {

  const pointsFor =
    Number(game["Points For"] || 0);

  const pointsAllowed =
    Number(game["Points Allowed"] || 0);

  let result = "T";

  if (pointsFor > pointsAllowed) {
    result = "W";
  }

  if (pointsFor < pointsAllowed) {
    result = "L";
  }

  const resultClass =
    result === "W"
      ? "team-result-win"
      : result === "L"
        ? "team-result-loss"
        : "team-result-tie";

  return `

    <tr>

      <td>
        ${game["Game Date"] || "-"}
      </td>

      <td>
        ${game["Opponent"] || "-"}
      </td>

      <td>
        <span class="${resultClass}">
          ${result} ${pointsFor}-${pointsAllowed}
        </span>
      </td>

      <td>
        ${game["Points For"] || "0"}
      </td>

      <td>
        ${game["Points Allowed"] || "0"}
      </td>

      <td>
        ${game["Rebounds"] || "0"}
      </td>

      <td>
        ${game["Assists"] || "0"}
      </td>

      <td>
        ${game["Threes"] || "0"}
      </td>

      <td>
        ${game["Turnovers"] || "0"}
      </td>

    </tr>

  `;
}

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
      const probabilityText =
        prop.league === "nfl" &&
        Number.isFinite(prop.bestModelProbability)
          ? formatProbability(prop.bestModelProbability)
          : formatProbability(prop.impliedProbability);

      return `
        <div class="leaderboard-item">
          <strong>
            #${index + 1}
            ${
              prop.playerId && prop.league
                ? `
                  <a
                    class="player-link"
                    href="player.html?league=${encodeURIComponent(prop.league)}&id=${encodeURIComponent(prop.playerId)}"
                  >
                    ${fullName}
                  </a>
                `
                : fullName
            }
            — ${formatPropTypeLabel(prop.propType)}
          </strong>

          <div class="${getEVClass(prop.ev)}">
            EV: ${formatEV(prop.ev)}
          </div>

          <div>
            ${prop.gameLabel ? `${prop.gameLabel} | ` : ""}${prop.vendor}
          </div>

          <div>
            Line: ${formatLineValue(prop.lineValue)}
            | Bet: ${prop.betType}
            | Probability: ${probabilityText}
          </div>
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
  const awayML = toNumber(row["EV Away ML ($1 bet)"]);
  const homeML = toNumber(row["EV Home ML ($1 bet)"]);
  const awaySpreadEV = toNumber(row["EV Away Spread ($1 bet)"]);
  const homeSpreadEV = toNumber(row["EV Home Spread ($1 bet)"]);

  if (!Number.isNaN(overEV) && totalValue) {
    rankings.push({
        bet: `Over ${totalValue}`,
        ev: overEV,

        modelEdge: overEV,

        sportacularScore: Math.round(Math.max(0, Math.min(100, overEV * 100))),

        confidence:
            overEV >= 0.25
                ? "High"
                : overEV >= 0.10
                    ? "Medium"
                    : "Low",

        recommendation:
            overEV >= 0
                ? "Consider"
                : "Pass"
    });
  }

  if (!Number.isNaN(underEV) && totalValue) {
    rankings.push({
        bet: `Under ${totalValue}`,
        ev: underEV,

        modelEdge: underEV,

        sportacularScore: Math.round(Math.max(0, Math.min(100, underEV * 100))),

        confidence:
            underEV >= 0.25
                ? "High"
                : underEV >= 0.10
                    ? "Medium"
                    : "Low",

        recommendation:
            underEV >= 0
                ? "Consider"
                : "Pass"
    });
  }

  if (!Number.isNaN(awayML)) {
    rankings.push({
        bet: `${awayTeam} ML`,
        ev: awayML,

        modelEdge: toNumber(row["Moneyline Edge Away"]),

        sportacularScore: Math.round(Math.max(0, Math.min(100, awayML * 100))),

        confidence:
            awayML >= 0.25
                ? "High"
                : awayML >= 0.10
                    ? "Medium"
                    : "Low",

        recommendation:
            awayML >= 0
                ? "Consider"
                : "Pass"
    });
  }

  if (!Number.isNaN(homeML)) {
    rankings.push({
        bet: `${homeTeam} ML`,
        ev: homeML,

        modelEdge: toNumber(row["Moneyline Edge Home"]),

        sportacularScore: Math.round(Math.max(0, Math.min(100, homeML * 100))),

        confidence:
            homeML >= 0.25
                ? "High"
                : homeML >= 0.10
                    ? "Medium"
                    : "Low",

        recommendation:
            homeML >= 0
                ? "Consider"
                : "Pass"
    });
  }

  if (!Number.isNaN(awaySpreadEV)) {
    rankings.push({
        bet: `${awayTeam} ${safeText(row["Spread Away Value"], "")}`,
        ev: awaySpreadEV,

        modelEdge: awaySpreadEV,

        sportacularScore: Math.round(Math.max(0, Math.min(100, awaySpreadEV * 100))),

        confidence:
            awaySpreadEV >= 0.25
                ? "High"
                : awaySpreadEV >= 0.10
                    ? "Medium"
                    : "Low",

        recommendation:
            awaySpreadEV >= 0
                ? "Consider"
                : "Pass"
    });
  }

  if (!Number.isNaN(homeSpreadEV)) {
    rankings.push({
        bet: `${homeTeam} ${safeText(row["Spread Home Value"], "")}`,
        ev: homeSpreadEV,

        modelEdge: homeSpreadEV,

        sportacularScore: Math.round(Math.max(0, Math.min(100, homeSpreadEV * 100))),

        confidence:
            homeSpreadEV >= 0.25
                ? "High"
                : homeSpreadEV >= 0.10
                    ? "Medium"
                    : "Low",

        recommendation:
            homeSpreadEV >= 0
                ? "Consider"
                : "Pass"
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

      impliedProbAwayML: toNumber(row["Implied Prob Away ML"]),
      impliedProbHomeML: toNumber(row["Implied Prob Home ML"]),
      vigFreeProbAwayML: toNumber(row["Vig-Free Prob Away ML"]),
      vigFreeProbHomeML: toNumber(row["Vig-Free Prob Home ML"]),
      moneylineEdgeAway: toNumber(row["Moneyline Edge Away"]),
      moneylineEdgeHome: toNumber(row["Moneyline Edge Home"]),
      bestMLEdge: toNumber(row["Best ML Edge"]),

      rankings: buildRankingsFromRow(row)
    }))
    .filter((game) => game.rankings.length > 0);
}

function buildPropsFromRows(rows, league = "mlb") {
  return rows
    .map((row, index) => {

        if (index === 0) {
          console.log(Object.keys(row));
        }
    
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

      const impliedProbability = toNumber(
        row["Implied Probability"] ||
        row["Implied Prob"] ||
        row["Implied Probability (%)"]
      );

      const ev = toNumber(row["EV Over/Milestone ($1 Bet)"]);

      const awayTeam = safeText(row["Away Team"], "");
      const homeTeam = safeText(row["Home Team"], "");

      let gameLabel = "";
      if (awayTeam && homeTeam) {
        gameLabel = `${awayTeam} at ${homeTeam}`;
      }

return {
    gameDate,

    playerId: safeText(row["Player Id"], ""),

    gameId: safeText(row["Game Id"], ""),

    league,

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

    impliedProbability,
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

function buildNFLPropsFromRows(rows) {
  const props = [];

  rows.forEach((row) => {
    const gameDate = normalizeDate(row["Game Date"]);

    const playerId =
      safeText(
        row["Player Id"] ||
        row["Player ID"],
        ""
      );

    const playerFirstName = safeText(
      row["Player First Name"],
      ""
    );

    const playerLastName = safeText(
      row["Player Last Name"],
      ""
    );

    const combinedName =
      `${playerFirstName} ${playerLastName}`.trim();

    const playerName =
      safeText(row["Player Name"], "") ||
      combinedName;

    const vendor = safeText(row["Vendor"], "");
    const propType = safeText(row["Prop Type"], "");
    const lineValue = safeText(row["Line Value"], "");

    const overOdds = safeText(row["Over Odds"], "");
    const underOdds = safeText(row["Under Odds"], "");

    const awayTeam = safeText(row["Away Team"], "");
    const homeTeam = safeText(row["Home Team"], "");

    const gameLabel =
      awayTeam && homeTeam
        ? `${awayTeam} at ${homeTeam}`
        : "";

    const overEV = toNumber(row["EV Over"]);
    const underEV = toNumber(row["EV Under"]);

    const impliedProbOver = toNumber(
      row["Model Prob Over"] ||
      row["Implied Prob Over"]
    );

    const impliedProbUnder = toNumber(
      row["Model Prob Under"] ||
      row["Implied Prob Under"]
    );

    const bestSide = safeText(
      row["Best Side"],
      ""
    );

    const bestEVRaw = toNumber(
      row["Best EV"]
    );

    const bestEV =
      Number.isFinite(bestEVRaw)
        ? bestEVRaw
        : null;

    const bestModelProbabilityRaw = toNumber(
      row["Best Model Probability"]
    );

    const bestModelProbability =
      Number.isFinite(bestModelProbabilityRaw)
        ? bestModelProbabilityRaw
        : null;

    const riskTier = safeText(
      row["Risk Tier"],
      ""
    );

    const bestPriceEdgeRaw = toNumber(
      row["Best Price Edge"]
    );

    const bestPriceEdge =
      Number.isFinite(bestPriceEdgeRaw)
        ? bestPriceEdgeRaw
        : null;

    const modelConfidenceRaw = toNumber(
      row["Model Confidence"]
    );

    const modelConfidence =
      Number.isFinite(modelConfidenceRaw)
        ? modelConfidenceRaw
        : null;

    if (
      playerName &&
      vendor &&
      propType &&
      lineValue !== "" &&
      overOdds !== "" &&
      !Number.isNaN(overEV)
    ) {
    if (bestSide === "Over") {
      props.push({
        gameDate,
        playerId,
        league: "nfl",
        playerName,
        playerFirstName,
        playerLastName,
        vendor,
        propType,
        lineValue,
        betType: "Over",
        overOdds,
        underOdds,
        genericOdds: overOdds,
        impliedProbability: impliedProbOver,
        ev: overEV,

        bestSide,
        bestEV,
        bestModelProbability,
        bestPriceEdge,
        riskTier,
        modelConfidence,

        awayTeam,
        homeTeam,
        gameLabel
      });
    }
    }

    if (
      playerName &&
      vendor &&
      propType &&
      lineValue !== "" &&
      underOdds !== "" &&
      !Number.isNaN(underEV)
    ) {
    if (bestSide === "Under") {
      props.push({
        gameDate,
        playerId,
        league: "nfl",
        playerName,
        playerFirstName,
        playerLastName,
        vendor,
        propType,
        lineValue,
        betType: "Under",
        overOdds,
        underOdds,
        genericOdds: underOdds,
        impliedProbability: impliedProbUnder,
        ev: underEV,

        bestSide,
        bestEV,
        bestModelProbability,
        bestPriceEdge,
        riskTier,
        modelConfidence,

        awayTeam,
        homeTeam,
        gameLabel
      });
    }
  }
  });

  const bestMarkets = new Map();

  props.forEach((prop) => {
    const marketKey = [
      prop.gameDate,
      prop.awayTeam,
      prop.homeTeam,
      prop.playerId || prop.playerName,
      prop.propType
    ].join("|");

    const existing = bestMarkets.get(marketKey);

    if (!existing) {
      bestMarkets.set(marketKey, prop);
      return;
    }

    const currentEV =
      Number.isFinite(prop.bestEV)
        ? prop.bestEV
        : -Infinity;

    const existingEV =
      Number.isFinite(existing.bestEV)
        ? existing.bestEV
        : -Infinity;

    if (currentEV > existingEV) {
      bestMarkets.set(marketKey, prop);
      return;
    }

    if (currentEV === existingEV) {
      const currentProbability =
        Number.isFinite(prop.bestModelProbability)
          ? prop.bestModelProbability
          : -Infinity;

      const existingProbability =
        Number.isFinite(existing.bestModelProbability)
          ? existing.bestModelProbability
          : -Infinity;

      if (currentProbability > existingProbability) {
        bestMarkets.set(marketKey, prop);
      }
    }
  });

  const consolidatedProps =
    Array.from(bestMarkets.values());

  return consolidatedProps;
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
        <div class="bet-card-analytics">

          <div class="analytics-row">
              <span class="analytics-label">⭐ Score</span>
              <span class="analytics-value">
                  ${topEV?.sportacularScore ?? "N/A"}
              </span>
          </div>

          <div class="analytics-row">
              <span class="analytics-label">📈 Model Edge</span>
              <span class="analytics-value">
                  ${
                      topEV?.modelEdge != null
                          ? `${topEV.modelEdge.toFixed(2)}%`
                          : "N/A"
                  }
              </span>
          </div>

          <div class="analytics-row">
              <span class="analytics-label">🟢 Confidence</span>
              <span class="analytics-value">
                  ${topEV?.confidence ?? "N/A"}
              </span>
          </div>

          <div class="analytics-row">
              <span class="analytics-label">🏆 Recommendation</span>
              <span class="analytics-value">
                  ${topEV?.recommendation ?? "N/A"}
              </span>
          </div>

        </div>

            <div style="margin-top:6px;">
                <strong>Model Edge</strong><br>
                ${
                    topEV?.modelEdge != null
                        ? formatEV(topEV.modelEdge)
                        : "N/A"
                }
            </div>

        </div>
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

          <div class="market-prob-breakdown" style="margin-top: 10px;">
            <p class="market-line"><strong>Implied:</strong> ${game.awayTeam} ${formatProbability(game.impliedProbAwayML)} | ${game.homeTeam} ${formatProbability(game.impliedProbHomeML)}</p>
            <p class="market-line"><strong>Vig-Free:</strong> ${game.awayTeam} ${formatProbability(game.vigFreeProbAwayML)} | ${game.homeTeam} ${formatProbability(game.vigFreeProbHomeML)}</p>
          </div>
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
  const probabilityText =
    prop.league === "nfl" &&
    Number.isFinite(prop.bestModelProbability)
      ? formatProbability(prop.bestModelProbability)
      : formatProbability(prop.impliedProbability);
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

  const isNFLDecisionProp =
    prop.league === "nfl" &&
    prop.bestSide;

  let nflDecisionHTML = "";

  if (isNFLDecisionProp) {
    const isNoPlay =
      prop.bestSide === "No Play";

    const bestEVText =
      Number.isFinite(prop.bestEV)
        ? formatEV(prop.bestEV)
        : "—";

    const edgeText =
      Number.isFinite(prop.bestPriceEdge)
        ? formatProbability(prop.bestPriceEdge)
        : "—";

    const confidenceText =
      Number.isFinite(prop.modelConfidence)
        ? `${prop.modelConfidence.toFixed(1)}`
        : "—";

    nflDecisionHTML = `
      <div class="nfl-model-decision">
        <div>
          <strong>Sportacular Model:</strong>
          ${isNoPlay ? "No Play" : prop.bestSide}
        </div>

        <div>
          Best EV: ${bestEVText}
        </div>

        <div>
          Edge: ${edgeText}
        </div>

        <div>
          Risk: ${prop.riskTier || "—"}
          | Confidence: ${confidenceText}
        </div>
      </div>
    `;
  }

  return `
    <article class="prop-card">
      <div class="prop-card-header">
        <div>
          <h3>

${
    prop.playerId && prop.league
        ? `
            <a
                class="player-link"
                href="player.html?league=${encodeURIComponent(prop.league)}&id=${encodeURIComponent(prop.playerId)}"
            >
                ${fullName}
            </a>
        `
        : fullName
}

—

${formatPropTypeLabel(prop.propType)}

</h3>
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
      ${nflDecisionHTML}
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
  console.log("=== RAW CSV TEST ===");
  console.log(rows[0]["Game Date"]);
  console.log(rows[1]["Game Date"]);
  console.log(rows[2]["Game Date"]);

  console.log("=== NORMALIZED ===");
  console.log(normalizeDate(rows[0]["Game Date"]));
  console.log(normalizeDate(rows[1]["Game Date"]));
  console.log(normalizeDate(rows[2]["Game Date"]));
  const games = transformRowsToGames(rows);
  const today = getTodayDateString();
  console.log("CSV rows:", rows.length);
  console.log("Games built:", games.length);
  console.log("Today's date:", today);
  console.log("First game object:");
  console.log(games[0]);

  console.log("First 10 game dates:");
  games.slice(0,10).forEach(g => console.log(g.gameDate));
  const todaysGames = games
    .filter((game) => game.gameDate === today)
    .sort((a, b) => {
      const aTopEV = Math.max(...a.rankings.map((item) => item.ev));
      const bTopEV = Math.max(...b.rankings.map((item) => item.ev));
      return bTopEV - aTopEV;
    });
  console.log("Today's games:", todaysGames.length);
  console.log(todaysGames);

  DATA_CACHE.games[csvUrl] = todaysGames;
  return todaysGames;
}

async function fetchLeagueProps(csvUrl, league) {
  if (DATA_CACHE.props[csvUrl]) return DATA_CACHE.props[csvUrl];

  const headers = {};

  if (csvUrl.includes("/.netlify/functions/")) {
  /*
   * Refresh the stored Supabase session before making a protected
   * Player Props request. This prevents an expired or stale token
   * from producing a false "Please Login" state.
   */
  let session = null;

  const {
    data: refreshedData,
    error: refreshError
  } = await supabaseClient.auth.refreshSession();

  if (!refreshError && refreshedData?.session) {
    session = refreshedData.session;
  } else {
    /*
     * Fall back to the currently stored session if Supabase determines
     * that a refresh is not necessary or cannot be completed.
     */
    const {
      data: sessionData,
      error: sessionError
    } = await supabaseClient.auth.getSession();

    if (sessionError) {
      const authError = new Error(
        "Unable to verify your login session."
      );

      authError.status = 401;
      throw authError;
    }

    session = sessionData?.session || null;
  }

  const accessToken =
    session?.access_token || "";

  if (!accessToken) {
    const tokenError = new Error(
      "No valid access token is available. Please log in again."
    );

    tokenError.status = 401;
    throw tokenError;
  }

  CURRENT_USER =
    session.user || CURRENT_USER;

  headers.Authorization =
    `Bearer ${accessToken}`;
}

  let response =
  await fetch(csvUrl, { headers });

/*
 * If the server rejects an existing token, refresh it once and retry.
 * This is especially useful after Supabase resumes from a paused state.
 */
if (
  response.status === 401 &&
  csvUrl.includes("/.netlify/functions/")
) {
  const {
    data: retryData,
    error: retryError
  } = await supabaseClient.auth.refreshSession();

  const retryToken =
    retryData?.session?.access_token || "";

  if (!retryError && retryToken) {
    headers.Authorization =
      `Bearer ${retryToken}`;

    response =
      await fetch(csvUrl, { headers });
  }
}

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

  console.log("CSV Headers:", Object.keys(rows[0]));
  console.log("First CSV Row:", rows[0]);

  const props =
    league === "nfl"
      ? buildNFLPropsFromRows(rows)
      : buildPropsFromRows(rows, league);

  const today = getTodayDateString();

  console.log("fetchLeagueProps csvUrl:", csvUrl);
  console.log("Today string:", today);
  console.log("Parsed rows count:", rows.length);
  console.log("Built props count:", props.length);
  console.log("First 5 props before date filter:", props.slice(0, 5));

  const todaysProps = props.sort((a, b) => b.ev - a.ev);

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
  if (
    prop.league === "nfl" &&
    Number.isFinite(prop.bestModelProbability) &&
    prop.bestModelProbability > 0
  ) {
    return prop.bestModelProbability;
  }

  if (
    Number.isFinite(prop.impliedProbability) &&
    prop.impliedProbability > 0
  ) {
    return prop.impliedProbability;
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
    const props =
      await fetchLeagueProps(
        config.csvUrl,
        pageKey
      );
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
    const [
      nbaGames,
      nhlGames,
      mlbGames,
      nflGames,
      nbaProps,
      nhlProps,
      mlbProps,
      nflProps
    ] = await Promise.all([
      fetchLeagueGames(NBA_CSV_URL).catch(() => []),
      fetchLeagueGames(NHL_CSV_URL).catch(() => []),
      fetchLeagueGames(MLB_CSV_URL).catch(() => []),
      fetchLeagueGames(NFL_CSV_URL).catch(() => []),

      fetchTeaserPropsJson(NBA_PROPS_TEASER_URL).catch(() => []),
      fetchTeaserPropsJson(NHL_PROPS_TEASER_URL).catch(() => []),
      fetchTeaserPropsJson(MLB_PROPS_TEASER_URL).catch(() => []),
      fetchTeaserPropsJson(NFL_PROPS_TEASER_URL).catch(() => [])
    ]);

    const topNBAGame = [...nbaGames].sort((a, b) => {
      const aTopEV = Math.max(
        ...a.rankings.map((item) => item.ev)
      );

      const bTopEV = Math.max(
        ...b.rankings.map((item) => item.ev)
      );

      return bTopEV - aTopEV;
    })[0];

    const topNHLGame = [...nhlGames].sort((a, b) => {
      const aTopEV = Math.max(
        ...a.rankings.map((item) => item.ev)
      );

      const bTopEV = Math.max(
        ...b.rankings.map((item) => item.ev)
      );

      return bTopEV - aTopEV;
    })[0];

    const topMLBGame = [...mlbGames].sort((a, b) => {
      const aTopEV = Math.max(
        ...a.rankings.map((item) => item.ev)
      );

      const bTopEV = Math.max(
        ...b.rankings.map((item) => item.ev)
      );

      return bTopEV - aTopEV;
    })[0];

    const topNFLGame = [...nflGames].sort((a, b) => {
      const aTopEV = Math.max(
        ...a.rankings.map((item) => item.ev)
      );

      const bTopEV = Math.max(
        ...b.rankings.map((item) => item.ev)
      );

      return bTopEV - aTopEV;
    })[0];

    const topNBAProp = [...nbaProps]
      .sort((a, b) => b.ev - a.ev)[0];

    const topNHLProp = [...nhlProps]
      .sort((a, b) => b.ev - a.ev)[0];

    const topMLBProp = [...mlbProps]
      .sort((a, b) => b.ev - a.ev)[0];

    const topNFLProp = [...nflProps]
      .sort((a, b) => b.ev - a.ev)[0];

    if (topNBAGame) {
      const bestRank = [...topNBAGame.rankings]
        .sort((a, b) => b.ev - a.ev)[0];

      renderHomeSpotlightCard(
        "home-top-nba-bet",
        {
          title:
            `${topNBAGame.awayTeam} at ` +
            `${topNBAGame.homeTeam}`,

          meta:
            `Featured High-EV Play | ` +
            `${topNBAGame.vendor} | ` +
            `${topNBAGame.gameDate}`,

          ev: bestRank.ev,
          subtext: `Top Bet: ${bestRank.bet}`
        }
      );
    } else {
      renderHomeSpotlightCard(
        "home-top-nba-bet",
        null
      );
    }

    if (topNBAProp) {
      renderHomeSpotlightCard(
        "home-top-nba-prop",
        {
          title:
            `${getPropFullName(topNBAProp)} — ` +
            `${formatPropTypeLabel(topNBAProp.propType)}`,

          meta:
            `Top Free Props Today | ` +
            `${topNBAProp.vendor} | ` +
            `${topNBAProp.gameDate || "Today"}`,

          ev: topNBAProp.ev,

          subtext:
            `Bet: ${topNBAProp.betType} ` +
            `${formatLineValue(topNBAProp.lineValue)}`
        }
      );
    } else {
      renderHomeSpotlightCard(
        "home-top-nba-prop",
        null
      );
    }

    if (topNHLGame) {
      const bestRank = [...topNHLGame.rankings]
        .sort((a, b) => b.ev - a.ev)[0];

      renderHomeSpotlightCard(
        "home-top-nhl-bet",
        {
          title:
            `${topNHLGame.awayTeam} at ` +
            `${topNHLGame.homeTeam}`,

          meta:
            `Featured High-EV Play | ` +
            `${topNHLGame.vendor} | ` +
            `${topNHLGame.gameDate}`,

          ev: bestRank.ev,
          subtext: `Top Bet: ${bestRank.bet}`
        }
      );
    } else {
      renderHomeSpotlightCard(
        "home-top-nhl-bet",
        null
      );
    }

    if (topNHLProp) {
      renderHomeSpotlightCard(
        "home-top-nhl-prop",
        {
          title:
            `${getPropFullName(topNHLProp)} — ` +
            `${formatPropTypeLabel(topNHLProp.propType)}`,

          meta:
            `Top Free Props Today | ` +
            `${topNHLProp.vendor} | ` +
            `${topNHLProp.gameDate || "Today"}`,

          ev: topNHLProp.ev,

          subtext:
            `Bet: ${topNHLProp.betType} ` +
            `${formatLineValue(topNHLProp.lineValue)}`
        }
      );
    } else {
      renderHomeSpotlightCard(
        "home-top-nhl-prop",
        null
      );
    }

    if (topMLBGame) {
      const bestRank = [...topMLBGame.rankings]
        .sort((a, b) => b.ev - a.ev)[0];

      renderHomeSpotlightCard(
        "home-top-mlb-bet",
        {
          title:
            `${topMLBGame.awayTeam} at ` +
            `${topMLBGame.homeTeam}`,

          meta:
            `Featured High-EV Play | ` +
            `${topMLBGame.vendor} | ` +
            `${topMLBGame.gameDate}`,

          ev: bestRank.ev,
          subtext: `Top Bet: ${bestRank.bet}`
        }
      );
    } else {
      renderHomeSpotlightCard(
        "home-top-mlb-bet",
        null
      );
    }

    if (topMLBProp) {
      renderHomeSpotlightCard(
        "home-top-mlb-prop",
        {
          title:
            `${getPropFullName(topMLBProp)} — ` +
            `${formatPropTypeLabel(topMLBProp.propType)}`,

          meta:
            `Top Free Props Today | ` +
            `${topMLBProp.vendor} | ` +
            `${topMLBProp.gameDate || "Today"}`,

          ev: topMLBProp.ev,

          subtext:
            `Bet: ${topMLBProp.betType} ` +
            `${formatLineValue(topMLBProp.lineValue)}`
        }
      );
    } else {
      renderHomeSpotlightCard(
        "home-top-mlb-prop",
        null
      );
    }

    if (topNFLGame) {
      const bestRank = [...topNFLGame.rankings]
        .sort((a, b) => b.ev - a.ev)[0];

      renderHomeSpotlightCard(
        "home-top-nfl-bet",
        {
          title:
            `${topNFLGame.awayTeam} at ` +
            `${topNFLGame.homeTeam}`,

          meta:
            `Featured High-EV Play | ` +
            `${topNFLGame.vendor} | ` +
            `${topNFLGame.gameDate}`,

          ev: bestRank.ev,
          subtext: `Top Bet: ${bestRank.bet}`
        }
      );
    } else {
      renderHomeSpotlightCard(
        "home-top-nfl-bet",
        null
      );
    }

    if (topNFLProp) {
      renderHomeSpotlightCard(
        "home-top-nfl-prop",
        {
          title:
            `${getPropFullName(topNFLProp)} — ` +
            `${formatPropTypeLabel(topNFLProp.propType)}`,

          meta:
            `Top Free Props Today | ` +
            `${topNFLProp.vendor} | ` +
            `${topNFLProp.gameDate || "Today"}`,

          ev: topNFLProp.ev,

          subtext:
            `Bet: ${topNFLProp.betType} ` +
            `${formatLineValue(topNFLProp.lineValue)}`
        }
      );
    } else {
      renderHomeSpotlightCard(
        "home-top-nfl-prop",
        null
      );
    }

    updateHomeLastUpdated();
  } catch (error) {
    console.error(
      "Home spotlight render error:",
      error
    );

    renderHomeSpotlightCard(
      "home-top-nba-bet",
      null
    );

    renderHomeSpotlightCard(
      "home-top-nba-prop",
      null
    );

    renderHomeSpotlightCard(
      "home-top-nhl-bet",
      null
    );

    renderHomeSpotlightCard(
      "home-top-nhl-prop",
      null
    );

    renderHomeSpotlightCard(
      "home-top-mlb-bet",
      null
    );

    renderHomeSpotlightCard(
      "home-top-mlb-prop",
      null
    );

    renderHomeSpotlightCard(
      "home-top-nfl-bet",
      null
    );

    renderHomeSpotlightCard(
      "home-top-nfl-prop",
      null
    );

    updateHomeLastUpdated();
  }
}

async function renderHomeTopProps() {
  const container = document.getElementById("home-top-props");
  if (!container) return;

  const currentTier = CURRENT_USER_TIER || "Rookie";

  try {
    const [
  nbaProps,
  nhlProps,
  mlbProps,
  nflProps
] = await Promise.all([
  fetchTeaserPropsJson(
    NBA_PROPS_TEASER_URL
  ).catch(() => []),

  fetchTeaserPropsJson(
    NHL_PROPS_TEASER_URL
  ).catch(() => []),

  fetchTeaserPropsJson(
    MLB_PROPS_TEASER_URL
  ).catch(() => []),

  fetchTeaserPropsJson(
    NFL_PROPS_TEASER_URL
  ).catch(() => [])
]);

const allProps = [
  ...nbaProps,
  ...nhlProps,
  ...mlbProps,
  ...nflProps
].sort((a, b) => b.ev - a.ev);

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
    updateTierDisplay("nfl-tier-display");

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
    updateTierDisplay("nfl-tier-display");

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
    updateTierDisplay("nfl-tier-display");

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

function formatNBATrendLabel(statKey) {
  return statKey || "Trend";
}

function createNBATrendCard(player) {
  const seasonAvg = Number(player["Season Avg"]);
  const last3 = Number(player["Last 3 Avg"]);
  const last5 = Number(player["Last 5 Avg"]);
  const last10 = Number(player["Last 10 Avg"]);
  const hitRate5 = Number(player["Hit Rate Last 5"]);
  const aboveSeason = Number(player["Above Season %"]);

  const hitRateText = Number.isNaN(hitRate5) ? "N/A" : `${Math.round(hitRate5 * 100)}%`;
  const aboveSeasonText = Number.isNaN(aboveSeason)
    ? "N/A"
    : `${aboveSeason >= 0 ? "+" : ""}${aboveSeason.toFixed(1)}%`;

  return `
    <div class="trend-card">
      <div class="trend-card-header">
        <div class="trend-title">
          <h3>${player["Player Name"] || "Unknown Player"}</h3>
          <div class="trend-subtitle">${player["Team"] || "N/A"} • ${player["Stat Type"] || "Trend"}</div>
        </div>

        <div class="trend-strength-badge">
          ${player["Trend Strength"] || "N/A"}
        </div>

        <div class="trend-analytics">

          <div class="trend-analytics-item">
            <span class="trend-analytics-label">Model Edge</span>
            <span class="trend-analytics-value">
              ${
                Number.isFinite(aboveSeason)
                  ? `${aboveSeason >= 0 ? "+" : ""}${aboveSeason.toFixed(1)}%`
                  : "N/A"
              }
            </span>
          </div>

          <div class="trend-analytics-item">
            <span class="trend-analytics-label">Confidence</span>
            <span class="trend-analytics-value">
              ${player["Consistency"] || "N/A"}
            </span>
          </div>

          <div class="trend-analytics-item">
            <span class="trend-analytics-label">Recommendation</span>
            <span class="trend-analytics-value">
              ${player["Trend Strength"] || "N/A"}
            </span>
          </div>

        </div>
      </div>

      <div class="trend-metric-grid">
        <div class="trend-metric-box">
          <div class="trend-metric-label">Last 5 Avg</div>
          <div class="trend-metric-value">${Number.isNaN(last5) ? "N/A" : last5.toFixed(2)}</div>
        </div>

        <div class="trend-metric-box">
          <div class="trend-metric-label">Hit Rate Last 5</div>
          <div class="trend-metric-value">${hitRateText}</div>
        </div>

        <div class="trend-metric-box">
          <div class="trend-metric-label">Above Season</div>
          <div class="trend-metric-value">${aboveSeasonText}</div>
        </div>

        <div class="trend-metric-box">
          <div class="trend-metric-label">Season Avg</div>
          <div class="trend-metric-value">${Number.isNaN(seasonAvg) ? "N/A" : seasonAvg.toFixed(2)}</div>
        </div>
      </div>

      <div class="trend-secondary-line">
        Last 3: ${Number.isNaN(last3) ? "N/A" : last3.toFixed(2)}
        |
        Last 10: ${Number.isNaN(last10) ? "N/A" : last10.toFixed(2)}
      </div>

      <div class="trend-note">
        ${player["Trend Note"] || ""}
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

      const filterIds = [
        "nba-trends-stat-filter",
        "nba-trends-sort-filter",
        "nba-trends-player-filter"
      ];

      if (!currentRules.showPlayerProps) {
        setTrendsFiltersDisabled(filterIds, true);
        renderTrendsLockedState(
          container,
          "nba-trends-filter-summary",
          currentTier,
          "NBA Player"
        );
        return;
      }

      setTrendsFiltersDisabled(filterIds, false);

      const selectedStat =
        document.getElementById("nba-trends-stat-filter")?.value || "Points";

      const selectedSort =
        document.getElementById("nba-trends-sort-filter")?.value || "desc";

      let filteredRows = rows
        .filter((row) => row["Player Name"])
        .filter((row) => row["Stat Type"] === selectedStat)
        .filter((row) => !Number.isNaN(Number(row["Last 5 Avg"])));

      populateTrendsPlayerFilter("nba-trends-player-filter", filteredRows, renderPage);

      const selectedPlayer =
        document.getElementById("nba-trends-player-filter")?.value || "All";

      if (selectedPlayer !== "All") {
        filteredRows = filteredRows.filter(
          (row) => (row["Player Name"] || "").trim() === selectedPlayer
        );
      }

      filteredRows.sort((a, b) => {
        const aVal = Number(a["Last 5 Avg"]);
        const bVal = Number(b["Last 5 Avg"]);
        return selectedSort === "asc" ? aVal - bVal : bVal - aVal;
      });

      renderFilterSummary("nba-trends-filter-summary", [
        { label: "Trend", value: formatNBATrendLabel(selectedStat) },
        { label: "Player", value: selectedPlayer },
        { label: "Sort", value: selectedSort === "asc" ? "Lowest First" : "Highest First" },
        { label: "Tier", value: currentTier }
      ]);

      if (filteredRows.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No NBA trends found for this filter.</h3>
            <p>Try changing the trend category, player, or sort order.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = filteredRows
        .map((row) => createNBATrendCard(row))
        .join("");
    };

    bindSelectChange("nba-trends-stat-filter", renderPage);
    bindSelectChange("nba-trends-sort-filter", renderPage);

    bindButton("nba-trends-reset-filters", () => {
      resetSelectToValue("nba-trends-stat-filter", "Points");
      resetSelectToValue("nba-trends-sort-filter", "desc");
      resetSelectToAll("nba-trends-player-filter");
      renderPage();
    });

    renderPage();
  } catch (error) {
    console.error("NBA trends render error:", error);

    container.innerHTML = `
      <div class="empty-state">
        <h3>Unable to load NBA trends right now.</h3>
        <p>Please check your published NBA Player Trends CSV.</p>
      </div>
    `;
  }
}

function formatNBATeamTrendLabel(statKey) {
  return statKey || "Trend";
}

function createNBATeamTrendCard(teamRow) {
  const seasonAvg = Number(teamRow["Season Avg"]);
  const last3 = Number(teamRow["Last 3 Avg"]);
  const last5 = Number(teamRow["Last 5 Avg"]);
  const last10 = Number(teamRow["Last 10 Avg"]);
  const hitRate5 = Number(teamRow["Hit Rate Last 5"]);
  const aboveSeason = Number(teamRow["Above Season %"]);

  const hitRateText = Number.isNaN(hitRate5) ? "N/A" : `${Math.round(hitRate5 * 100)}%`;
  const aboveSeasonText = Number.isNaN(aboveSeason)
    ? "N/A"
    : `${aboveSeason >= 0 ? "+" : ""}${aboveSeason.toFixed(1)}%`;

  return `
    <div class="trend-card">
      <div class="trend-card-header">
        <div class="trend-title">
          <h3>${teamRow["Team"] || "Unknown Team"}</h3>
          <div class="trend-subtitle">${teamRow["Metric"] || "Trend"}</div>
        </div>

        <div class="trend-strength-badge">
          ${teamRow["Trend Strength"] || "N/A"}
        </div>
      </div>

      <div class="trend-metric-grid">
        <div class="trend-metric-box">
          <div class="trend-metric-label">Last 5 Avg</div>
          <div class="trend-metric-value">${Number.isNaN(last5) ? "N/A" : last5.toFixed(2)}</div>
        </div>

        <div class="trend-metric-box">
          <div class="trend-metric-label">Hit Rate Last 5</div>
          <div class="trend-metric-value">${hitRateText}</div>
        </div>

        <div class="trend-metric-box">
          <div class="trend-metric-label">Above Season</div>
          <div class="trend-metric-value">${aboveSeasonText}</div>
        </div>

        <div class="trend-metric-box">
          <div class="trend-metric-label">Season Avg</div>
          <div class="trend-metric-value">${Number.isNaN(seasonAvg) ? "N/A" : seasonAvg.toFixed(2)}</div>
        </div>
      </div>

      <div class="trend-secondary-line">
        Last 3: ${Number.isNaN(last3) ? "N/A" : last3.toFixed(2)}
        |
        Last 10: ${Number.isNaN(last10) ? "N/A" : last10.toFixed(2)}
      </div>

      <div class="trend-note">
        ${teamRow["Trend Note"] || ""}
      </div>
    </div>
  `;
}

async function renderNBATeamTrends() {
  const container = document.getElementById("nba-team-trends-container");
  if (!container) return;

  updateTierDisplay("nba-tier-display");

  container.innerHTML = `
    <div class="empty-state">
      <h3>Loading NBA team trends...</h3>
      <p>Please wait while recent team trend data is pulled in.</p>
    </div>
  `;

  try {
    const rows = await fetchLeagueTrends(NBA_TEAM_TRENDS_CSV_URL);
    updateLastUpdated("nba-team-trends-last-updated");

    const renderPage = () => {
      const currentTier = CURRENT_USER_TIER || "Rookie";

      const filterIds = [
        "nba-team-trends-team-filter",
        "nba-team-trends-stat-filter",
        "nba-team-trends-sort-filter"
      ];

      if (currentTier === "Rookie") {
        setTrendsFiltersDisabled(filterIds, true);
        renderTrendsLockedState(
          container,
          "nba-team-trends-filter-summary",
          currentTier,
          "NBA Team",
          "Veteran"
        );
        return;
      }

      setTrendsFiltersDisabled(filterIds, false);

      const selectedStat =
        document.getElementById("nba-team-trends-stat-filter")?.value || "Points For";

      const selectedSort =
        document.getElementById("nba-team-trends-sort-filter")?.value || "desc";

      let filteredRows = rows
        .filter((row) => row["Team"])
        .filter((row) => row["Metric"] === selectedStat)
        .filter((row) => !Number.isNaN(Number(row["Last 5 Avg"])));

      populateTeamFilter("nba-team-trends-team-filter", filteredRows, renderPage);

      const selectedTeam =
        document.getElementById("nba-team-trends-team-filter")?.value || "All";

      if (selectedTeam !== "All") {
        filteredRows = filteredRows.filter(
          (row) => (row["Team"] || "").trim() === selectedTeam
        );
      }

      filteredRows.sort((a, b) => {
        const aVal = Number(a["Last 5 Avg"]);
        const bVal = Number(b["Last 5 Avg"]);
        return selectedSort === "asc" ? aVal - bVal : bVal - aVal;
      });

      renderFilterSummary("nba-team-trends-filter-summary", [
        { label: "Team", value: selectedTeam },
        { label: "Trend", value: formatNBATeamTrendLabel(selectedStat) },
        { label: "Sort", value: selectedSort === "asc" ? "Lowest First" : "Highest First" },
        { label: "Tier", value: currentTier }
      ]);

      if (filteredRows.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No NBA team trends found for this filter.</h3>
            <p>Try changing the team, trend category, or sort order.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = filteredRows
        .map((row) => createNBATeamTrendCard(row))
        .join("");
    };

    bindSelectChange("nba-team-trends-stat-filter", renderPage);
    bindSelectChange("nba-team-trends-sort-filter", renderPage);

    bindButton("nba-team-trends-reset-filters", () => {
      resetSelectToAll("nba-team-trends-team-filter");
      resetSelectToValue("nba-team-trends-stat-filter", "Points For");
      resetSelectToValue("nba-team-trends-sort-filter", "desc");
      renderPage();
    });

    renderPage();
  } catch (error) {
    console.error("NBA team trends render error:", error);

    container.innerHTML = `
      <div class="empty-state">
        <h3>Unable to load NBA team trends right now.</h3>
        <p>Please check your published NBA Team Trends CSV.</p>
      </div>
    `;
  }
}

async function initNBATeamTrendsPage() {
  await updateSessionStatus();
  await renderNBATeamTrends();
}

function formatNHLTrendLabel(statKey) {
  return statKey || "Trend";
}

function createNHLTrendCard(player) {
  const seasonAvg = Number(player["Season Avg"]);
  const last3 = Number(player["Last 3 Avg"]);
  const last5 = Number(player["Last 5 Avg"]);
  const last10 = Number(player["Last 10 Avg"]);
  const hitRate5 = Number(player["Hit Rate Last 5"]);
  const aboveSeason = Number(player["Above Season %"]);

  const hitRateText = Number.isNaN(hitRate5) ? "N/A" : `${Math.round(hitRate5 * 100)}%`;
  const aboveSeasonText = Number.isNaN(aboveSeason)
    ? "N/A"
    : `${aboveSeason >= 0 ? "+" : ""}${aboveSeason.toFixed(1)}%`;

  return `
    <div class="trend-card">
      <div class="trend-card-header">
        <div class="trend-title">
          <h3>${player["Player Name"] || "Unknown Player"}</h3>
          <div class="trend-subtitle">${player["Team"] || "N/A"} • ${player["Stat Type"] || "Trend"}</div>
        </div>

        <div class="trend-strength-badge">
          ${player["Trend Strength"] || "N/A"}
        </div>
      </div>

      <div class="trend-metric-grid">
        <div class="trend-metric-box">
          <div class="trend-metric-label">Last 5 Avg</div>
          <div class="trend-metric-value">${Number.isNaN(last5) ? "N/A" : last5.toFixed(2)}</div>
        </div>

        <div class="trend-metric-box">
          <div class="trend-metric-label">Hit Rate Last 5</div>
          <div class="trend-metric-value">${hitRateText}</div>
        </div>

        <div class="trend-metric-box">
          <div class="trend-metric-label">Above Season</div>
          <div class="trend-metric-value">${aboveSeasonText}</div>
        </div>

        <div class="trend-metric-box">
          <div class="trend-metric-label">Season Avg</div>
          <div class="trend-metric-value">${Number.isNaN(seasonAvg) ? "N/A" : seasonAvg.toFixed(2)}</div>
        </div>
      </div>

      <div class="trend-secondary-line">
        Last 3: ${Number.isNaN(last3) ? "N/A" : last3.toFixed(2)}
        |
        Last 10: ${Number.isNaN(last10) ? "N/A" : last10.toFixed(2)}
      </div>

      <div class="trend-note">
        ${player["Trend Note"] || ""}
      </div>
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

      const filterIds = [
        "nhl-trends-stat-filter",
        "nhl-trends-sort-filter",
        "nhl-trends-player-filter"
      ];

      if (!currentRules.showPlayerProps) {
        setTrendsFiltersDisabled(filterIds, true);
        renderTrendsLockedState(
          container,
          "nhl-trends-filter-summary",
          currentTier,
          "NHL Player"
        );
        return;
      }

      setTrendsFiltersDisabled(filterIds, false);

      const selectedStat =
        document.getElementById("nhl-trends-stat-filter")?.value || "Shots On Goal";

      const selectedSort =
        document.getElementById("nhl-trends-sort-filter")?.value || "desc";

      let filteredRows = rows
        .filter((row) => row["Player Name"])
        .filter((row) => row["Stat Type"] === selectedStat)
        .filter((row) => !Number.isNaN(Number(row["Last 5 Avg"])));

      populateTrendsPlayerFilter("nhl-trends-player-filter", filteredRows, renderPage);

      const selectedPlayer =
        document.getElementById("nhl-trends-player-filter")?.value || "All";

      if (selectedPlayer !== "All") {
        filteredRows = filteredRows.filter(
          (row) => (row["Player Name"] || "").trim() === selectedPlayer
        );
      }

      filteredRows.sort((a, b) => {
        const aVal = Number(a["Last 5 Avg"]);
        const bVal = Number(b["Last 5 Avg"]);
        return selectedSort === "asc" ? aVal - bVal : bVal - aVal;
      });

      renderFilterSummary("nhl-trends-filter-summary", [
        { label: "Trend", value: formatNHLTrendLabel(selectedStat) },
        { label: "Player", value: selectedPlayer },
        { label: "Sort", value: selectedSort === "asc" ? "Lowest First" : "Highest First" },
        { label: "Tier", value: currentTier }
      ]);

      if (filteredRows.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No NHL trends found for this filter.</h3>
            <p>Try changing the trend category, player, or sort order.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = filteredRows
        .map((row) => createNHLTrendCard(row))
        .join("");
    };

    bindSelectChange("nhl-trends-stat-filter", renderPage);
    bindSelectChange("nhl-trends-sort-filter", renderPage);

    bindButton("nhl-trends-reset-filters", () => {
      resetSelectToValue("nhl-trends-stat-filter", "Shots On Goal");
      resetSelectToValue("nhl-trends-sort-filter", "desc");
      resetSelectToAll("nhl-trends-player-filter");
      renderPage();
    });

    renderPage();
  } catch (error) {
    console.error("NHL trends render error:", error);

    container.innerHTML = `
      <div class="empty-state">
        <h3>Unable to load NHL trends right now.</h3>
        <p>Please check your published NHL Player Trends CSV.</p>
      </div>
    `;
  }
}

function formatNHLTeamTrendLabel(statKey) {
  return statKey || "Trend";
}

function createNHLTeamTrendCard(teamRow) {
  const seasonAvg = Number(teamRow["Season Avg"]);
  const last3 = Number(teamRow["Last 3 Avg"]);
  const last5 = Number(teamRow["Last 5 Avg"]);
  const last10 = Number(teamRow["Last 10 Avg"]);
  const hitRate5 = Number(teamRow["Hit Rate Last 5"]);
  const aboveSeason = Number(teamRow["Above Season %"]);

  const hitRateText = Number.isNaN(hitRate5) ? "N/A" : `${Math.round(hitRate5 * 100)}%`;
  const aboveSeasonText = Number.isNaN(aboveSeason)
    ? "N/A"
    : `${aboveSeason >= 0 ? "+" : ""}${aboveSeason.toFixed(1)}%`;

  return `
    <div class="trend-card">
      <div class="trend-card-header">
        <div class="trend-title">
          <h3>${teamRow["Team"] || "Unknown Team"}</h3>
          <div class="trend-subtitle">${teamRow["Metric"] || "Trend"}</div>
        </div>

        <div class="trend-strength-badge">
          ${teamRow["Trend Strength"] || "N/A"}
        </div>
      </div>

      <div class="trend-metric-grid">
        <div class="trend-metric-box">
          <div class="trend-metric-label">Last 5 Avg</div>
          <div class="trend-metric-value">${Number.isNaN(last5) ? "N/A" : last5.toFixed(2)}</div>
        </div>

        <div class="trend-metric-box">
          <div class="trend-metric-label">Hit Rate Last 5</div>
          <div class="trend-metric-value">${hitRateText}</div>
        </div>

        <div class="trend-metric-box">
          <div class="trend-metric-label">Above Season</div>
          <div class="trend-metric-value">${aboveSeasonText}</div>
        </div>

        <div class="trend-metric-box">
          <div class="trend-metric-label">Season Avg</div>
          <div class="trend-metric-value">${Number.isNaN(seasonAvg) ? "N/A" : seasonAvg.toFixed(2)}</div>
        </div>
      </div>

      <div class="trend-secondary-line">
        Last 3: ${Number.isNaN(last3) ? "N/A" : last3.toFixed(2)}
        |
        Last 10: ${Number.isNaN(last10) ? "N/A" : last10.toFixed(2)}
      </div>

      <div class="trend-note">
        ${teamRow["Trend Note"] || ""}
      </div>
    </div>
  `;
}

async function renderNHLTeamTrends() {
  const container = document.getElementById("nhl-team-trends-container");
  if (!container) return;

  updateTierDisplay("nhl-tier-display");

  container.innerHTML = `
    <div class="empty-state">
      <h3>Loading NHL team trends...</h3>
      <p>Please wait while recent team trend data is pulled in.</p>
    </div>
  `;

  try {
    const rows = await fetchLeagueTrends(NHL_TEAM_TRENDS_CSV_URL);
    updateLastUpdated("nhl-team-trends-last-updated");

    const renderPage = () => {
      const currentTier = CURRENT_USER_TIER || "Rookie";

      const filterIds = [
        "nhl-team-trends-team-filter",
        "nhl-team-trends-stat-filter",
        "nhl-team-trends-sort-filter"
      ];

      if (currentTier === "Rookie") {
        setTrendsFiltersDisabled(filterIds, true);
        renderTrendsLockedState(
          container,
          "nhl-team-trends-filter-summary",
          currentTier,
          "NHL Team",
          "Veteran"
        );
        return;
      }

      setTrendsFiltersDisabled(filterIds, false);

      const selectedStat =
        document.getElementById("nhl-team-trends-stat-filter")?.value || "Goals For";

      const selectedSort =
        document.getElementById("nhl-team-trends-sort-filter")?.value || "desc";

      let filteredRows = rows
        .filter((row) => row["Team"])
        .filter((row) => row["Metric"] === selectedStat)
        .filter((row) => !Number.isNaN(Number(row["Last 5 Avg"])));

      populateTeamFilter("nhl-team-trends-team-filter", filteredRows, renderPage);

      const selectedTeam =
        document.getElementById("nhl-team-trends-team-filter")?.value || "All";

      if (selectedTeam !== "All") {
        filteredRows = filteredRows.filter(
          (row) => (row["Team"] || "").trim() === selectedTeam
        );
      }

      filteredRows.sort((a, b) => {
        const aVal = Number(a["Last 5 Avg"]);
        const bVal = Number(b["Last 5 Avg"]);
        return selectedSort === "asc" ? aVal - bVal : bVal - aVal;
      });

      renderFilterSummary("nhl-team-trends-filter-summary", [
        { label: "Team", value: selectedTeam },
        { label: "Trend", value: formatNHLTeamTrendLabel(selectedStat) },
        { label: "Sort", value: selectedSort === "asc" ? "Lowest First" : "Highest First" },
        { label: "Tier", value: currentTier }
      ]);

      if (filteredRows.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No NHL team trends found for this filter.</h3>
            <p>Try changing the team, trend category, or sort order.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = filteredRows
        .map((row) => createNHLTeamTrendCard(row))
        .join("");
    };

    bindSelectChange("nhl-team-trends-stat-filter", renderPage);
    bindSelectChange("nhl-team-trends-sort-filter", renderPage);

    bindButton("nhl-team-trends-reset-filters", () => {
      resetSelectToAll("nhl-team-trends-team-filter");
      resetSelectToValue("nhl-team-trends-stat-filter", "Goals For");
      resetSelectToValue("nhl-team-trends-sort-filter", "desc");
      renderPage();
    });

    renderPage();
  } catch (error) {
    console.error("NHL team trends render error:", error);

    container.innerHTML = `
      <div class="empty-state">
        <h3>Unable to load NHL team trends right now.</h3>
        <p>Please check your published NHL Team Trends CSV.</p>
      </div>
    `;
  }
}

async function initNHLTeamTrendsPage() {
  await updateSessionStatus();
  await renderNHLTeamTrends();
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
  return statKey || "Trend";
}

function createTrendCard(player) {
  const seasonAvg = Number(player["Season Avg"]);
  const last3 = Number(player["Last 3 Avg"]);
  const last5 = Number(player["Last 5 Avg"]);
  const last10 = Number(player["Last 10 Avg"]);
  const hitRate5 = Number(player["Hit Rate Last 5"]);
  const aboveSeason = Number(player["Above Season %"]);

  const hitRateText = Number.isNaN(hitRate5) ? "N/A" : `${Math.round(hitRate5 * 100)}%`;
  const aboveSeasonText = Number.isNaN(aboveSeason)
    ? "N/A"
    : `${aboveSeason >= 0 ? "+" : ""}${aboveSeason.toFixed(1)}%`;

  return `
    <div class="trend-card">
      <div class="trend-card-header">
        <div class="trend-title">
          <h3>${player["Player Name"] || "Unknown Player"}</h3>
          <div class="trend-subtitle">${player["Team"] || "N/A"} • ${player["Stat Type"] || "Trend"}</div>
        </div>

        <div class="trend-strength-badge">
          ${player["Trend Strength"] || "N/A"}
        </div>
      </div>

      <div class="trend-metric-grid">
        <div class="trend-metric-box">
          <div class="trend-metric-label">Last 5 Avg</div>
          <div class="trend-metric-value">${Number.isNaN(last5) ? "N/A" : last5.toFixed(2)}</div>
        </div>

        <div class="trend-metric-box">
          <div class="trend-metric-label">Hit Rate Last 5</div>
          <div class="trend-metric-value">${hitRateText}</div>
        </div>

        <div class="trend-metric-box">
          <div class="trend-metric-label">Above Season</div>
          <div class="trend-metric-value">${aboveSeasonText}</div>
        </div>

        <div class="trend-metric-box">
          <div class="trend-metric-label">Season Avg</div>
          <div class="trend-metric-value">${Number.isNaN(seasonAvg) ? "N/A" : seasonAvg.toFixed(2)}</div>
        </div>
      </div>

      <div class="trend-secondary-line">
        Last 3: ${Number.isNaN(last3) ? "N/A" : last3.toFixed(2)}
        |
        Last 10: ${Number.isNaN(last10) ? "N/A" : last10.toFixed(2)}
      </div>

      <div class="trend-note">
        ${player["Trend Note"] || ""}
      </div>
    </div>
  `;
}

function populateTrendsPlayerFilter(selectId, rows, onChange) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const currentValue = select.value || "All";

  const players = [...new Set(
    rows
      .map((row) => (row["Player Name"] || "").trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));

  populateSelectOptions(selectId, players, "All Players", currentValue);
  select.onchange = () => onChange();
}

function setTrendsFiltersDisabled(filterIds, isDisabled) {
  filterIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = isDisabled;
  });
}

function renderTrendsLockedState(container, summaryId, currentTier, leagueLabel, requiredTier = "All-Star") {
  renderFilterSummary(summaryId, [
    { label: "Tier", value: currentTier || "Rookie" }
  ]);

  container.innerHTML = `
    <div class="props-locked-box">
      <h3>${leagueLabel} Trends Locked</h3>
      <p>Your current plan is <strong>${currentTier || "Rookie"}</strong>.</p>
      <p>Upgrade to <strong>${requiredTier}</strong> or higher to unlock ${leagueLabel} trends.</p>
      <div style="margin-top: 16px;">
        <a href="pricing.html" class="btn btn-primary">View Plans</a>
      </div>
    </div>
  `;
}

function getTeamProfileParameters() {

  const params = new URLSearchParams(window.location.search);

  return {

    league: (params.get("league") || "").toLowerCase(),

    team: params.get("team") || ""

  };

}

async function initNBATrendsPage() {
  await updateSessionStatus();
  await renderNBATrends();
}

async function initNHLTrendsPage() {
  await updateSessionStatus();
  await renderNHLTrends();
}

async function renderMLBTopPlayerTrends() {
  const container = document.getElementById("mlb-top-player-trends-container");
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <h3>Loading top MLB player trends...</h3>
    </div>
  `;

  try {
    const rows = await fetchLeagueTrends(MLB_TOP_PLAYER_TRENDS_CSV_URL);
    const topRows = rows.filter(row => row["Player Name"]).slice(0, 5);

    if (!topRows.length) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = topRows.map(row => `
      <div class="trend-card">
        <div class="trend-card-header">
          <div class="trend-title">
            <h3>#${row["Rank"] || ""} ${row["Player Name"] || "Unknown Player"}</h3>
            <div class="trend-subtitle">${row["Team"] || "N/A"} • ${row["Stat Type"] || "Trend"}</div>
          </div>

          <div class="trend-strength-badge">
            ${row["Trend Strength"] || "N/A"}
          </div>
        </div>

        <div class="trend-note">
          ${row["Trend Note"] || ""}
        </div>
      </div>
    `).join("");
  } catch (error) {
    console.error("Top MLB player trends error:", error);
    container.innerHTML = "";
  }
}

async function renderMLBTopTeamTrends() {
  const container = document.getElementById("mlb-top-team-trends-container");
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <h3>Loading top MLB team trends...</h3>
    </div>
  `;

  try {
    const rows = await fetchLeagueTrends(MLB_TOP_TEAM_TRENDS_CSV_URL);
    const topRows = rows.filter(row => row["Team"]).slice(0, 5);

    if (!topRows.length) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = topRows.map(row => `
      <div class="trend-card">
        <div class="trend-card-header">
          <div class="trend-title">
            <h3>#${row["Rank"] || ""} ${row["Team"] || "Unknown Team"}</h3>
            <div class="trend-subtitle">${row["Metric"] || "Trend"}</div>
          </div>

          <div class="trend-strength-badge">
            ${row["Trend Strength"] || "N/A"}
          </div>
        </div>

        <div class="trend-note">
          ${row["Trend Note"] || ""}
        </div>
      </div>
    `).join("");
  } catch (error) {
    console.error("Top MLB team trends error:", error);
    container.innerHTML = "";
  }
}

function formatMLBTeamTrendLabel(statKey) {
  return statKey || "Trend";
}

function createMLBTeamTrendCard(teamRow) {
  const seasonAvg = Number(teamRow["Season Avg"]);
  const last3 = Number(teamRow["Last 3 Avg"]);
  const last5 = Number(teamRow["Last 5 Avg"]);
  const last10 = Number(teamRow["Last 10 Avg"]);
  const hitRate5 = Number(teamRow["Hit Rate Last 5"]);
  const aboveSeason = Number(teamRow["Above Season %"]);

  const hitRateText = Number.isNaN(hitRate5) ? "N/A" : `${Math.round(hitRate5 * 100)}%`;
  const aboveSeasonText = Number.isNaN(aboveSeason)
    ? "N/A"
    : `${aboveSeason >= 0 ? "+" : ""}${aboveSeason.toFixed(1)}%`;

  return `
    <div class="trend-card">
      <div class="trend-card-header">
        <div class="trend-title">
          <h3>${teamRow["Team"] || "Unknown Team"}</h3>
          <div class="trend-subtitle">${teamRow["Metric"] || "Trend"}</div>
        </div>

        <div class="trend-strength-badge">
          ${teamRow["Trend Strength"] || "N/A"}
        </div>
      </div>

      <div class="trend-metric-grid">
        <div class="trend-metric-box">
          <div class="trend-metric-label">Last 5 Avg</div>
          <div class="trend-metric-value">${Number.isNaN(last5) ? "N/A" : last5.toFixed(2)}</div>
        </div>

        <div class="trend-metric-box">
          <div class="trend-metric-label">Hit Rate Last 5</div>
          <div class="trend-metric-value">${hitRateText}</div>
        </div>

        <div class="trend-metric-box">
          <div class="trend-metric-label">Above Season</div>
          <div class="trend-metric-value">${aboveSeasonText}</div>
        </div>

        <div class="trend-metric-box">
          <div class="trend-metric-label">Season Avg</div>
          <div class="trend-metric-value">${Number.isNaN(seasonAvg) ? "N/A" : seasonAvg.toFixed(2)}</div>
        </div>
      </div>

      <div class="trend-secondary-line">
        Last 3: ${Number.isNaN(last3) ? "N/A" : last3.toFixed(2)}
        |
        Last 10: ${Number.isNaN(last10) ? "N/A" : last10.toFixed(2)}
      </div>

      <div class="trend-note">
        ${teamRow["Trend Note"] || ""}
      </div>
    </div>
  `;
}

function populateTeamFilter(selectId, rows, onChange) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const currentValue = select.value || "All";

  const teams = [...new Set(
    rows
      .map((row) => (row["Team"] || "").trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));

  populateSelectOptions(selectId, teams, "All Teams", currentValue);
  select.onchange = () => onChange();
}

async function renderMLBTeamTrends() {
  const container = document.getElementById("mlb-team-trends-container");
  if (!container) return;

  updateTierDisplay("mlb-tier-display");

  container.innerHTML = `
    <div class="empty-state">
      <h3>Loading MLB team trends...</h3>
      <p>Please wait while recent team trend data is pulled in.</p>
    </div>
  `;

  try {
    const rows = await fetchLeagueTrends(MLB_TEAM_TRENDS_CSV_URL);
    updateLastUpdated("mlb-team-trends-last-updated");

    const renderPage = () => {
      const currentTier = CURRENT_USER_TIER || "Rookie";

      const filterIds = [
        "mlb-team-trends-team-filter",
        "mlb-team-trends-stat-filter",
        "mlb-team-trends-sort-filter"
      ];

      if (currentTier === "Rookie") {
        setTrendsFiltersDisabled(filterIds, true);
        renderTrendsLockedState(
          container,
          "mlb-team-trends-filter-summary",
          currentTier,
          "MLB Team",
          "Veteran"
        );
        return;
      }

      setTrendsFiltersDisabled(filterIds, false);

      const selectedStat =
        document.getElementById("mlb-team-trends-stat-filter")?.value || "Runs For";

      const selectedSort =
        document.getElementById("mlb-team-trends-sort-filter")?.value || "desc";

      let filteredRows = rows
        .filter((row) => row["Team"])
        .filter((row) => row["Metric"] === selectedStat)
        .filter((row) => !Number.isNaN(Number(row["Last 5 Avg"])));

      populateTeamFilter("mlb-team-trends-team-filter", filteredRows, renderPage);

      const selectedTeam =
        document.getElementById("mlb-team-trends-team-filter")?.value || "All";

      if (selectedTeam !== "All") {
        filteredRows = filteredRows.filter(
          (row) => (row["Team"] || "").trim() === selectedTeam
        );
      }

      filteredRows.sort((a, b) => {
        const aVal = Number(a["Last 5 Avg"]);
        const bVal = Number(b["Last 5 Avg"]);
        return selectedSort === "asc" ? aVal - bVal : bVal - aVal;
      });

      renderFilterSummary("mlb-team-trends-filter-summary", [
        { label: "Team", value: selectedTeam },
        { label: "Trend", value: formatMLBTeamTrendLabel(selectedStat) },
        { label: "Sort", value: selectedSort === "asc" ? "Lowest First" : "Highest First" },
        { label: "Tier", value: currentTier }
      ]);

      if (filteredRows.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No MLB team trends found for this filter.</h3>
            <p>Try changing the team, trend category, or sort order.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = filteredRows
        .map((row) => createMLBTeamTrendCard(row))
        .join("");
    };

    bindSelectChange("mlb-team-trends-stat-filter", renderPage);
    bindSelectChange("mlb-team-trends-sort-filter", renderPage);

    bindButton("mlb-team-trends-reset-filters", () => {
      resetSelectToAll("mlb-team-trends-team-filter");
      resetSelectToValue("mlb-team-trends-stat-filter", "Runs For");
      resetSelectToValue("mlb-team-trends-sort-filter", "desc");
      renderPage();
    });

    renderPage();
  } catch (error) {
    console.error("MLB team trends render error:", error);

    container.innerHTML = `
      <div class="empty-state">
        <h3>Unable to load MLB team trends right now.</h3>
        <p>Please check your published MLB Team Trends CSV.</p>
      </div>
    `;
  }
}

async function renderMLBTopPlayerTrends() {
  const container = document.getElementById("mlb-top-player-trends-container");
  if (!container) return;

  try {
    const rows = await fetchLeagueTrends(MLB_TOP_PLAYER_TRENDS_CSV_URL);
    const topRows = rows.filter(row => row["Player Name"]).slice(0, 5);

    if (!topRows.length) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = topRows.map(row => `
      <div class="trend-card">
        <div class="trend-card-header">
          <div class="trend-title">
            <h3>#${row["Rank"] || ""} ${row["Player Name"] || "Unknown Player"}</h3>
            <div class="trend-subtitle">${row["Team"] || "N/A"} • ${row["Stat Type"] || "Trend"}</div>
          </div>
          <div class="trend-strength-badge">${row["Trend Strength"] || "N/A"}</div>
        </div>

        <div class="trend-note">${row["Trend Note"] || ""}</div>
      </div>
    `).join("");
  } catch (error) {
    console.error("Top MLB player trends error:", error);
    container.innerHTML = "";
  }
}

async function renderMLBTopTeamTrends() {
  const container = document.getElementById("mlb-top-team-trends-container");
  if (!container) return;

  try {
    const rows = await fetchLeagueTrends(MLB_TOP_TEAM_TRENDS_CSV_URL);
    const topRows = rows.filter(row => row["Team"]).slice(0, 5);

    if (!topRows.length) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = topRows.map(row => `
      <div class="trend-card">
        <div class="trend-card-header">
          <div class="trend-title">
            <h3>#${row["Rank"] || ""} ${row["Team"] || "Unknown Team"}</h3>
            <div class="trend-subtitle">${row["Metric"] || "Trend"}</div>
          </div>
          <div class="trend-strength-badge">${row["Trend Strength"] || "N/A"}</div>
        </div>

        <div class="trend-note">${row["Trend Note"] || ""}</div>
      </div>
    `).join("");
  } catch (error) {
    console.error("Top MLB team trends error:", error);
    container.innerHTML = "";
  }
}

async function initMLBTeamTrendsPage() {
  await updateSessionStatus();

  await Promise.all([
    renderMLBTeamTrends(),
    renderMLBTopTeamTrends()
  ]);
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

      const filterIds = [
        "mlb-trends-stat-filter",
        "mlb-trends-sort-filter",
        "mlb-trends-player-filter"
      ];

      if (!currentRules.showPlayerProps) {
        setTrendsFiltersDisabled(filterIds, true);
        renderTrendsLockedState(
          container,
          "mlb-trends-filter-summary",
          currentTier,
          "MLB Player"
        );
        return;
      }

      setTrendsFiltersDisabled(filterIds, false);

      const selectedStat =
        document.getElementById("mlb-trends-stat-filter")?.value || "Hits";

      const selectedSort =
        document.getElementById("mlb-trends-sort-filter")?.value || "desc";

      let filteredRows = rows
        .filter((row) => row["Player Name"])
        .filter((row) => row["Stat Type"] === selectedStat)
        .filter((row) => !Number.isNaN(Number(row["Last 5 Avg"])));

      populateTrendsPlayerFilter("mlb-trends-player-filter", filteredRows, renderPage);

      const selectedPlayer =
        document.getElementById("mlb-trends-player-filter")?.value || "All";

      if (selectedPlayer !== "All") {
        filteredRows = filteredRows.filter(
          (row) => (row["Player Name"] || "").trim() === selectedPlayer
        );
      }

      filteredRows.sort((a, b) => {
        const aVal = Number(a["Last 5 Avg"]);
        const bVal = Number(b["Last 5 Avg"]);
        return selectedSort === "asc" ? aVal - bVal : bVal - aVal;
      });

      renderFilterSummary("mlb-trends-filter-summary", [
        { label: "Trend", value: formatTrendLabel(selectedStat) },
        { label: "Player", value: selectedPlayer },
        { label: "Sort", value: selectedSort === "asc" ? "Lowest First" : "Highest First" },
        { label: "Tier", value: currentTier }
      ]);

      if (filteredRows.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No MLB trends found for this filter.</h3>
            <p>Try changing the trend category, player, or sort order.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = filteredRows
        .map((row) => createTrendCard(row))
        .join("");
    };

    bindSelectChange("mlb-trends-stat-filter", renderPage);
    bindSelectChange("mlb-trends-sort-filter", renderPage);

    bindButton("mlb-trends-reset-filters", () => {
      resetSelectToValue("mlb-trends-stat-filter", "Hits");
      resetSelectToValue("mlb-trends-sort-filter", "desc");
      resetSelectToAll("mlb-trends-player-filter");
      renderPage();
    });

    renderPage();
  } catch (error) {
    console.error("MLB trends render error:", error);

    container.innerHTML = `
      <div class="empty-state">
        <h3>Unable to load MLB trends right now.</h3>
        <p>Please check your published MLB Player Trends CSV.</p>
      </div>
    `;
  }
}

async function initMLBTrendsPage() {
  await updateSessionStatus();

  await Promise.all([
    renderMLBTrends(),
    renderMLBTopPlayerTrends()
  ]);
}

function formatNFLTrendLabel(statKey) {
  return statKey || "Trend";
}

function createNFLTrendCard(player) {
  const seasonAvg = Number(player["Season Avg"]);
  const last3 = Number(player["Last 3 Avg"]);
  const last5 = Number(player["Last 5 Avg"]);
  const last10 = Number(player["Last 10 Avg"]);
  const hitRateLast5 = Number(player["Hit Rate Last 5"]);
  const aboveSeason = Number(player["Above Season %"]);

  const hitRateText = Number.isNaN(hitRateLast5)
    ? "N/A"
    : `${Math.round(hitRateLast5 * 100)}%`;

  const aboveSeasonText = Number.isNaN(aboveSeason)
    ? "N/A"
    : `${aboveSeason >= 0 ? "+" : ""}${aboveSeason.toFixed(1)}%`;

  return `
    <div class="leaderboard-item">
      <strong>
        ${player["Player Name"] || "Unknown Player"}
      </strong>

      <div>
        ${player["Team"] || "N/A"} |
        ${formatNFLTrendLabel(player["Stat Type"])}
      </div>

      <div>
        Last 5 Avg:
        ${Number.isNaN(last5) ? "N/A" : last5.toFixed(2)}
      </div>

      <div>
        Season Avg:
        ${Number.isNaN(seasonAvg) ? "N/A" : seasonAvg.toFixed(2)}
      </div>

      <div>
        Last 3:
        ${Number.isNaN(last3) ? "N/A" : last3.toFixed(2)}
        |
        Last 10:
        ${Number.isNaN(last10) ? "N/A" : last10.toFixed(2)}
      </div>

      <div>
        Hit Rate Last 5: ${hitRateText}
        |
        Above Season: ${aboveSeasonText}
      </div>

      <div>
        Trend Strength:
        ${player["Trend Strength"] || "N/A"}
        |
        Risk:
        ${player["Risk Tier"] || "N/A"}
      </div>

      <div>
        ${player["Trend Note"] || ""}
      </div>
    </div>
  `;
}

async function renderNFLTrends() {
  const container =
    document.getElementById("nfl-trends-container");

  if (!container) return;

  try {
    const rows =
      await fetchLeagueTrends(NFL_TRENDS_CSV_URL);

    updateLastUpdated(
      "nfl-trends-last-updated"
    );

    const renderPage = () => {
      const currentTier =
        CURRENT_USER_TIER || "Rookie";

      const currentRules =
        TIER_RULES[currentTier] ||
        TIER_RULES.Rookie;

      const filterIds = [
        "nfl-trends-player-filter",
        "nfl-trends-stat-filter",
        "nfl-trends-sort-filter"
      ];

      if (!currentRules.showPlayerProps) {
        setTrendsFiltersDisabled(
          filterIds,
          true
        );

        renderTrendsLockedState(
          container,
          "nfl-trends-filter-summary",
          currentTier,
          "NFL Player"
        );

        return;
      }

      setTrendsFiltersDisabled(
        filterIds,
        false
      );

      const selectedStat =
        document.getElementById(
          "nfl-trends-stat-filter"
        )?.value || "Passing Yards";

      const selectedSort =
        document.getElementById(
          "nfl-trends-sort-filter"
        )?.value || "desc";

      let filteredRows = rows
        .filter((row) => row["Player Name"])
        .filter(
          (row) =>
            row["Stat Type"] === selectedStat
        )
        .filter(
          (row) =>
            !Number.isNaN(
              Number(row["Last 5 Avg"])
            )
        );

      populateTrendsPlayerFilter(
        "nfl-trends-player-filter",
        filteredRows,
        renderPage
      );

      const selectedPlayer =
        document.getElementById(
          "nfl-trends-player-filter"
        )?.value || "All";

      if (selectedPlayer !== "All") {
        filteredRows =
          filteredRows.filter(
            (row) =>
              String(
                row["Player Name"] || ""
              ).trim() === selectedPlayer
          );
      }

      filteredRows.sort((a, b) => {
        const aValue =
          Number(a["Last 5 Avg"]);

        const bValue =
          Number(b["Last 5 Avg"]);

        return selectedSort === "asc"
          ? aValue - bValue
          : bValue - aValue;
      });

      renderFilterSummary(
        "nfl-trends-filter-summary",
        [
          {
            label: "Trend",
            value: selectedStat
          },
          {
            label: "Player",
            value: selectedPlayer
          },
          {
            label: "Sort",
            value:
              selectedSort === "asc"
                ? "Lowest First"
                : "Highest First"
          },
          {
            label: "Tier",
            value: currentTier
          }
        ]
      );

      if (!filteredRows.length) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No NFL player trends found.</h3>
            <p>
              Try changing the player, trend category,
              or sort order.
            </p>
          </div>
        `;

        return;
      }

      container.innerHTML =
        filteredRows
          .map(createNFLTrendCard)
          .join("");
    };

    bindSelectChange(
      "nfl-trends-stat-filter",
      renderPage
    );

    bindSelectChange(
      "nfl-trends-sort-filter",
      renderPage
    );

    bindButton(
      "nfl-trends-reset-filters",
      () => {
        resetSelectToAll(
          "nfl-trends-player-filter"
        );

        resetSelectToValue(
          "nfl-trends-stat-filter",
          "Passing Yards"
        );

        resetSelectToValue(
          "nfl-trends-sort-filter",
          "desc"
        );

        renderPage();
      }
    );

    renderPage();
  } catch (error) {
    console.error(
      "NFL trends render error:",
      error
    );

    container.innerHTML = `
      <div class="empty-state">
        <h3>No NFL trends available right now.</h3>
        <p>
          Please check back when NFL games and trend
          data are live.
        </p>
      </div>
    `;
  }
}

async function initNFLTrendsPage() {
  await updateSessionStatus();
  await renderNFLTrends();
}

function formatNFLTeamTrendLabel(statKey) {
  return statKey || "Trend";
}

function createNFLTeamTrendCard(teamRow) {
  const seasonAvg = Number(teamRow["Season Avg"]);
  const last3 = Number(teamRow["Last 3 Avg"]);
  const last5 = Number(teamRow["Last 5 Avg"]);
  const last10 = Number(teamRow["Last 10 Avg"]);
  const hitRateLast5 = Number(
    teamRow["Hit Rate Last 5"]
  );
  const aboveSeason = Number(
    teamRow["Above Season %"]
  );

  const hitRateText = Number.isNaN(hitRateLast5)
    ? "N/A"
    : `${Math.round(hitRateLast5 * 100)}%`;

  const aboveSeasonText =
    Number.isNaN(aboveSeason)
      ? "N/A"
      : `${aboveSeason >= 0 ? "+" : ""}${aboveSeason.toFixed(1)}%`;

  return `
    <div class="leaderboard-item">
      <strong>
        ${teamRow["Team"] || "Unknown Team"}
      </strong>

      <div>
        ${formatNFLTeamTrendLabel(
          teamRow["Metric"]
        )}
      </div>

      <div>
        Last 5 Avg:
        ${Number.isNaN(last5) ? "N/A" : last5.toFixed(2)}
      </div>

      <div>
        Season Avg:
        ${Number.isNaN(seasonAvg) ? "N/A" : seasonAvg.toFixed(2)}
      </div>

      <div>
        Last 3:
        ${Number.isNaN(last3) ? "N/A" : last3.toFixed(2)}
        |
        Last 10:
        ${Number.isNaN(last10) ? "N/A" : last10.toFixed(2)}
      </div>

      <div>
        Hit Rate Last 5: ${hitRateText}
        |
        Above Season: ${aboveSeasonText}
      </div>

      <div>
        Trend Strength:
        ${teamRow["Trend Strength"] || "N/A"}
        |
        Risk:
        ${teamRow["Risk Tier"] || "N/A"}
      </div>

      <div>
        ${teamRow["Trend Note"] || ""}
      </div>
    </div>
  `;
}

async function renderNFLTeamTrends() {
  const container =
    document.getElementById(
      "nfl-team-trends-container"
    );

  if (!container) return;

  try {
    const rows =
      await fetchLeagueTrends(
        NFL_TEAM_TRENDS_CSV_URL
      );

    updateLastUpdated(
      "nfl-team-trends-last-updated"
    );

    const renderPage = () => {
      const currentTier =
        CURRENT_USER_TIER || "Rookie";

      const filterIds = [
        "nfl-team-trends-team-filter",
        "nfl-team-trends-stat-filter",
        "nfl-team-trends-sort-filter"
      ];

      if (currentTier === "Rookie") {
        setTrendsFiltersDisabled(
          filterIds,
          true
        );

        renderTrendsLockedState(
          container,
          "nfl-team-trends-filter-summary",
          currentTier,
          "NFL Team",
          "Veteran"
        );

        return;
      }

      setTrendsFiltersDisabled(
        filterIds,
        false
      );

      const selectedStat =
        document.getElementById(
          "nfl-team-trends-stat-filter"
        )?.value || "Points For";

      const selectedSort =
        document.getElementById(
          "nfl-team-trends-sort-filter"
        )?.value || "desc";

      let filteredRows = rows
        .filter((row) => row["Team"])
        .filter(
          (row) =>
            row["Metric"] === selectedStat
        )
        .filter(
          (row) =>
            !Number.isNaN(
              Number(row["Last 5 Avg"])
            )
        );

      populateTeamFilter(
        "nfl-team-trends-team-filter",
        filteredRows,
        renderPage
      );

      const selectedTeam =
        document.getElementById(
          "nfl-team-trends-team-filter"
        )?.value || "All";

      if (selectedTeam !== "All") {
        filteredRows =
          filteredRows.filter(
            (row) =>
              String(
                row["Team"] || ""
              ).trim() === selectedTeam
          );
      }

      filteredRows.sort((a, b) => {
        const aValue =
          Number(a["Last 5 Avg"]);

        const bValue =
          Number(b["Last 5 Avg"]);

        return selectedSort === "asc"
          ? aValue - bValue
          : bValue - aValue;
      });

      renderFilterSummary(
        "nfl-team-trends-filter-summary",
        [
          {
            label: "Team",
            value: selectedTeam
          },
          {
            label: "Trend",
            value: selectedStat
          },
          {
            label: "Sort",
            value:
              selectedSort === "asc"
                ? "Lowest First"
                : "Highest First"
          },
          {
            label: "Tier",
            value: currentTier
          }
        ]
      );

      if (!filteredRows.length) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No NFL team trends found.</h3>
            <p>
              Try changing the team, trend category,
              or sort order.
            </p>
          </div>
        `;

        return;
      }

      container.innerHTML =
        filteredRows
          .map(createNFLTeamTrendCard)
          .join("");
    };

    bindSelectChange(
      "nfl-team-trends-stat-filter",
      renderPage
    );

    bindSelectChange(
      "nfl-team-trends-sort-filter",
      renderPage
    );

    bindButton(
      "nfl-team-trends-reset-filters",
      () => {
        resetSelectToAll(
          "nfl-team-trends-team-filter"
        );

        resetSelectToValue(
          "nfl-team-trends-stat-filter",
          "Points For"
        );

        resetSelectToValue(
          "nfl-team-trends-sort-filter",
          "desc"
        );

        renderPage();
      }
    );

    renderPage();
  } catch (error) {
    console.error(
      "NFL team trends render error:",
      error
    );

    container.innerHTML = `
      <div class="empty-state">
        <h3>
          Unable to load NFL team trends right now.
        </h3>
        <p>
          Please check your published NFL Team Trends CSV.
        </p>
      </div>
    `;
  }
}

async function initNFLTeamTrendsPage() {
  await updateSessionStatus();
  await renderNFLTeamTrends();
}

function renderNBABets() { return renderOddsPage("nba"); }
function renderNHLBets() { return renderOddsPage("nhl"); }
function renderMLBBets() { return renderOddsPage("mlb"); }
function renderNFLBets() { return renderOddsPage("nfl"); }

function renderNBAProps() { return renderPropsPage("nba"); }
function renderNHLProps() { return renderPropsPage("nhl"); }
function renderMLBProps() { return renderPropsPage("mlb"); }
function renderNFLProps() { return renderPropsPage("nfl"); }

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

async function initNFLBetsPage() {
  await updateSessionStatus();
  await renderNFLBets();
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

async function initNFLPropsPage() {
  await updateSessionStatus();
  await renderNFLProps();
}

document.addEventListener("DOMContentLoaded", () => {
  updateNavAuthState();
  initAuthPage();
});

function createTeamTrendCard(trend) {

  return `

<div
  class="team-trend-card"
  data-metric="${trend.Metric}"
>

  <h4>${trend["Metric"]}</h4>

  <div class="team-trend-grid">

    <div>
      <strong>Last 5 Avg</strong><br>
      ${trend["Last 5 Avg"]}
    </div>

    <div>
      <strong>Season Avg</strong><br>
      ${trend["Season Avg"]}
    </div>

    <div>
      <strong>Above Season</strong><br>
      ${trend["Above Season %"]}%
    </div>

    <div>
      <strong>Trend Strength</strong><br>
      ${trend["Trend Strength"]}
    </div>

    <div>
      <strong>Risk Tier</strong><br>
      ${trend["Risk Tier"]}
    </div>

    <div>
      <strong>Hit Rate</strong><br>
      ${trend["Hit Rate Last 5"]}
    </div>

  </div>

  <div class="team-trend-note">
    ${trend["Trend Note"]}
  </div>

</div>

`;

}

function buildTeamModelEdge(teamStats, teamTrends) {

  const offenseMetrics = [
    "Points For",
    "Passing Yards",
    "Rushing Yards"
  ];

  const defenseMetrics = [
    "Points Allowed",
    "Turnovers",
    "Sacks"
  ];

  const offense =
    teamTrends.filter(t =>
      offenseMetrics.includes(t["Metric"])
    );

  const defense =
    teamTrends.filter(t =>
      defenseMetrics.includes(t["Metric"])
    );

  return {

    offenseScore: offense.length,

    defenseScore: defense.length,

    momentum:
      offense.filter(t =>
        t["Trend Direction"] === "Improving"
      ).length -

      defense.filter(t =>
        t["Trend Direction"] === "Declining"
      ).length

  };

}

function renderModelEdge(trend) {

  const container =
    document.getElementById(
      "team-model-edge-content"
    );

  if (!container) return;

  container.innerHTML = `

<div class="team-model-card">

<h3>

Sportacular Edge

<span class="edge-metric">

${trend["Metric"]}

</span>

</h3>

<div class="team-stat-grid">

<div class="team-stat-card">

<strong>Trend Strength</strong><br>

${trend["Trend Strength"]}

</div>

<div class="team-stat-card">

<strong>Risk Tier</strong><br>

${trend["Risk Tier"]}

</div>

<div class="team-stat-card">

<strong>Hit Rate</strong><br>

${trend["Hit Rate Last 5"]}

</div>

<div class="team-stat-card">

<strong>Last 5 Avg</strong><br>

${trend["Last 5 Avg"]}

</div>

<div class="team-stat-card">

<strong>Season Avg</strong><br>

${trend["Season Avg"]}

</div>

<div class="team-stat-card">

<strong>Above Season</strong><br>

${trend["Above Season %"]}%

</div>

</div>

<div class="team-model-note">

${trend["Trend Note"]}

</div>

`;

}

function initializeTrendCardInteractions() {

  const cards =
    document.querySelectorAll(".team-trend-card");

  cards.forEach(card => {

    card.addEventListener("mouseenter", () => {

      const metric =
        card.dataset.metric;

      updateModelEdge(metric);

      highlightTrendCard(card);

    });

    card.addEventListener("click", () => {

      const metric =
        card.dataset.metric;

      updateModelEdge(metric);

      highlightTrendCard(card);

    });

  });

}

function highlightTrendCard(activeCard) {

  document
    .querySelectorAll(".team-trend-card")
    .forEach(card => {

      card.classList.remove("active");

    });

  activeCard.classList.add("active");

}

async function initTeamProfilePage() {

  console.log("Initializing Team Profile Page...");

  const { league, team } = getTeamProfileParameters();

  console.log("League:", league);
  console.log("Team:", team);

  if (!league || !team) {

    document.getElementById("team-name").textContent =
      "No Team Selected";

    document.getElementById("team-subtitle").textContent =
      "Please choose a team.";

    return;

  }

  document.getElementById("team-name").textContent =
    decodeURIComponent(team);

  document.getElementById("team-subtitle").textContent =
    league.toUpperCase();

  //-------------------------------------------------------
  // NEW CODE STARTS HERE
  //-------------------------------------------------------

  const stats = await fetchTeamSeasonStats(league);

  const trends = await fetchTeamTrends(league);

  const teamGameLogs =
    await fetchTeamGameLogs(league);

  console.log(
    "Team Game Logs:",
    teamGameLogs
  );

  const teamTrends = trends.filter(
    row => row.Team === decodeURIComponent(team)
  );

  CURRENT_TEAM_TRENDS = teamTrends;

  // =====================================================
  // MLB TEAM HERO RATINGS
  // =====================================================

  if (league === "mlb" && teamTrends.length) {

    const ratingRow = teamTrends[0];

    // -----------------------------------------------------
    // MLB OVERALL TEAM RANKING
    // -----------------------------------------------------

    const mlbTeamRatingsMap = new Map();

    trends.forEach(row => {

      const teamName =
        String(row["Team"] || "").trim();

      const overallRating =
        Number(row["Overall Rating"]);

      if (
        teamName &&
        !Number.isNaN(overallRating) &&
        !mlbTeamRatingsMap.has(teamName)
      ) {
        mlbTeamRatingsMap.set(
          teamName,
          overallRating
        );
      }

    });

    const mlbOverallRankings =
      [...mlbTeamRatingsMap.entries()]
        .map(([teamName, overallRating]) => ({
          teamName,
          overallRating
        }))
        .sort(
          (a, b) =>
            b.overallRating - a.overallRating
        );

    const currentTeamName =
      decodeURIComponent(team);

    const currentTeamRankIndex =
      mlbOverallRankings.findIndex(
        item =>
          item.teamName === currentTeamName
      );

    const overallLeagueRank =
      currentTeamRankIndex >= 0
        ? currentTeamRankIndex + 1
        : null;

    const overallRankScore =
      overallLeagueRank !== null &&
      mlbOverallRankings.length > 1
        ? (
            100 *
            (
              1 -
              (overallLeagueRank - 1) /
              (mlbOverallRankings.length - 1)
            )
          ).toFixed(1)
        : null;

    const setHeroValue = (id, value) => {

      const element =
        document.getElementById(id);

      if (!element) return;

      element.textContent =
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
          ? value
          : "--";

    };

    setHeroValue(
      "league-rank",
      overallLeagueRank !== null
        ? `#${overallLeagueRank}`
        : "--"
    );

    setHeroValue(
      "rank-score",
      overallRankScore
    );


    setHeroValue(
      "offensive-rating",
      ratingRow["Offensive Rating"]
    );

    setHeroValue(
      "pitching-rating",
      ratingRow["Pitching Rating"]
    );

    setHeroValue(
      "overall-rating",
      ratingRow["Overall Rating"]
    );

    setHeroValue(
      "rating-tier",
      ratingRow["Rating Tier"]
    );

    setHeroValue(
      "rating-notes",
      ratingRow["Rating Notes"]
    );

    setHeroValue(
      "last-updated",
      ratingRow["Last Updated"]
    );

  }

  // =====================================================
  // NBA TEAM HERO RATINGS
  // =====================================================

  if (league === "nba" && teamTrends.length) {

    const ratingRow = teamTrends[0];

    // -----------------------------------------------------
    // NBA OVERALL TEAM RANKING
    // -----------------------------------------------------

    const nbaTeamRatingsMap = new Map();

    trends.forEach(row => {

      const teamName =
        String(row["Team"] || "").trim();

      const overallRating =
        Number(row["Overall Rating"]);

      if (
        teamName &&
        !Number.isNaN(overallRating) &&
        String(row["Overall Rating"] || "").trim() !== "" &&
        !nbaTeamRatingsMap.has(teamName)
      ) {

        nbaTeamRatingsMap.set(
          teamName,
          overallRating
        );

      }

    });

    const nbaOverallRankings =
      [...nbaTeamRatingsMap.entries()]
        .map(([teamName, overallRating]) => ({
          teamName,
          overallRating
        }))
        .sort(
          (a, b) =>
            b.overallRating - a.overallRating
        );

    const currentTeamName =
      decodeURIComponent(team);

    const currentTeamRankIndex =
      nbaOverallRankings.findIndex(
        item =>
          item.teamName === currentTeamName
      );

    const overallLeagueRank =
      currentTeamRankIndex >= 0
        ? currentTeamRankIndex + 1
        : null;

    const overallRankScore =
      overallLeagueRank !== null &&
      nbaOverallRankings.length > 1
        ? (
            100 *
            (
              1 -
              (overallLeagueRank - 1) /
              (nbaOverallRankings.length - 1)
            )
          ).toFixed(1)
        : null;

    const setHeroValue = (id, value) => {

      const element =
        document.getElementById(id);

      if (!element) return;

      element.textContent =
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
          ? value
          : "--";

    };

    setHeroValue(
      "league-rank",
      overallLeagueRank !== null
        ? `#${overallLeagueRank}`
        : "--"
    );

    setHeroValue(
      "rank-score",
      overallRankScore
    );

    setHeroValue(
      "offensive-rating",
      ratingRow["Offensive Rating"]
    );

    setHeroValue(
      "defensive-rating",
      ratingRow["Defensive Rating"]
    );

    setHeroValue(
      "overall-rating",
      ratingRow["Overall Rating"]
    );

    setHeroValue(
      "rating-tier",
      ratingRow["Rating Tier"]
    );

    setHeroValue(
      "rating-notes",
      ratingRow["Rating Notes"]
    );

    setHeroValue(
      "last-updated",
      ratingRow["Last Updated"]
    );

  }

  // =====================================================
  // NHL TEAM HERO RATINGS
  // =====================================================

  if (league === "nhl" && teamTrends.length) {

    const ratingRow = teamTrends[0];

    // -----------------------------------------------------
    // NHL OVERALL TEAM RANKING
    // -----------------------------------------------------

    const nhlTeamRatingsMap = new Map();

    trends.forEach(row => {

      const teamName =
        String(row["Team"] || "").trim();

      const overallRating =
        Number(row["Overall Rating"]);

      if (
        teamName &&
        !Number.isNaN(overallRating) &&
        String(row["Overall Rating"] || "").trim() !== "" &&
        !nhlTeamRatingsMap.has(teamName)
      ) {

        nhlTeamRatingsMap.set(
          teamName,
          overallRating
        );

      }

    });

    const nhlOverallRankings =
      [...nhlTeamRatingsMap.entries()]
        .map(([teamName, overallRating]) => ({
          teamName,
          overallRating
        }))
        .sort(
          (a, b) =>
            b.overallRating - a.overallRating
        );

    const currentTeamName =
      decodeURIComponent(team);

    const currentTeamRankIndex =
      nhlOverallRankings.findIndex(
        item =>
          item.teamName === currentTeamName
      );

    const overallLeagueRank =
      currentTeamRankIndex >= 0
        ? currentTeamRankIndex + 1
        : null;

    const overallRankScore =
      overallLeagueRank !== null &&
      nhlOverallRankings.length > 1
        ? (
            100 *
            (
              1 -
              (overallLeagueRank - 1) /
              (nhlOverallRankings.length - 1)
            )
          ).toFixed(1)
        : null;

    const setHeroValue = (id, value) => {

      const element =
        document.getElementById(id);

      if (!element) return;

      element.textContent =
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
          ? value
          : "--";

    };

    setHeroValue(
      "league-rank",
      overallLeagueRank !== null
        ? `#${overallLeagueRank}`
        : "--"
    );

    setHeroValue(
      "rank-score",
      overallRankScore
    );

    setHeroValue(
      "offensive-rating",
      ratingRow["Offensive Rating"]
    );

    setHeroValue(
      "defensive-rating",
      ratingRow["Defensive Rating"]
    );

    setHeroValue(
      "overall-rating",
      ratingRow["Overall Rating"]
    );

    setHeroValue(
      "rating-tier",
      ratingRow["Rating Tier"]
    );

    setHeroValue(
      "rating-notes",
      ratingRow["Rating Notes"]
    );

    setHeroValue(
      "last-updated",
      ratingRow["Last Updated"]
    );

  }

  // =====================================================
  // NFL TEAM HERO RATINGS
  // =====================================================

  if (league === "nfl" && teamTrends.length) {

    const ratingRow = teamTrends[0];

    // -----------------------------------------------------
    // NFL OVERALL TEAM RANKING
    // -----------------------------------------------------

    const nflTeamRatingsMap = new Map();

    trends.forEach(row => {

      const teamName =
        String(row["Team"] || "").trim();

      const overallRating =
        Number(row["Overall Rating"]);

      if (
        teamName &&
        !Number.isNaN(overallRating) &&
        String(row["Overall Rating"] || "").trim() !== "" &&
        !nflTeamRatingsMap.has(teamName)
      ) {

        nflTeamRatingsMap.set(
          teamName,
          overallRating
        );

      }

    });

    const nflOverallRankings =
      [...nflTeamRatingsMap.entries()]
        .map(([teamName, overallRating]) => ({
          teamName,
          overallRating
        }))
        .sort(
          (a, b) =>
            b.overallRating - a.overallRating
        );

    const currentTeamName =
      decodeURIComponent(team);

    const currentTeamRankIndex =
      nflOverallRankings.findIndex(
        item =>
          item.teamName === currentTeamName
      );

    const overallLeagueRank =
      currentTeamRankIndex >= 0
        ? currentTeamRankIndex + 1
        : null;

    const overallRankScore =
      overallLeagueRank !== null &&
      nflOverallRankings.length > 1
        ? (
            100 *
            (
              1 -
              (overallLeagueRank - 1) /
              (nflOverallRankings.length - 1)
            )
          ).toFixed(1)
        : null;

    const setHeroValue = (id, value) => {

      const element =
        document.getElementById(id);

      if (!element) return;

      element.textContent =
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
          ? value
          : "--";

    };

    setHeroValue(
      "league-rank",
      overallLeagueRank !== null
        ? `#${overallLeagueRank}`
        : "--"
    );

    setHeroValue(
      "rank-score",
      overallRankScore
    );

    setHeroValue(
      "overall-rating",
      ratingRow["Overall Rating"]
    );

    setHeroValue(
      "offensive-rating",
      ratingRow["Offensive Rating"]
    );

    setHeroValue(
      "defensive-rating",
      ratingRow["Defensive Rating"]
    );

    setHeroValue(
      "rating-tier",
      ratingRow["Rating Tier"]
    );

    setHeroValue(
      "rating-notes",
      ratingRow["Rating Notes"]
    );

    setHeroValue(
      "last-updated",
      ratingRow["Last Updated"]
    );

  }

  console.log("First Team Trend:", teamTrends[0]);

  console.log("All Trends:", trends);

  console.log("Team Trends:", teamTrends);

  console.log("Trend Count:", teamTrends.length);

  console.table(teamTrends);

  const teamStats = stats.find(row => row.Team === decodeURIComponent(team));

  const selectedTeam =
    decodeURIComponent(team);

  const teamGames =
    teamGameLogs.filter(game => {

      return (
        String(game["Team"] || "").trim() ===
        selectedTeam
      );

    });

  console.log(
    "Filtered Team Game Logs:",
    teamGames
  );

  console.log("Team Games:", teamGames);

  console.log("Season Stats:", teamStats);

  /*

  const model =
    buildTeamModelEdge(teamStats, teamTrends);

  document.getElementById(
    "team-model-edge-content"
  ).innerHTML =
    renderModelEdge(model);

  */

  const statsContainer =
    document.getElementById("team-season-stats-content");

if (!teamStats) {

  statsContainer.innerHTML =
    "<p>No season statistics found.</p>";

} else if (league === "mlb") {

  const formatMLBSnapshotValue = (value, decimals = 1) => {

    const num = Number(value);

    if (
      value === undefined ||
      value === null ||
      value === "" ||
      Number.isNaN(num)
    ) {
      return "--";
    }

    return decimals === 0
      ? Math.round(num)
      : num.toFixed(decimals);

  };


  statsContainer.innerHTML = `

    <div class="team-stat-grid">

      <div class="team-stat-card">
        <strong>Games Played</strong><br>
        ${formatMLBSnapshotValue(
          teamStats["Games Played"],
          0
        )}
      </div>

      <div class="team-stat-card">
        <strong>Runs / Game</strong><br>
        ${formatMLBSnapshotValue(
          teamStats["Avg Runs For"]
        )}
      </div>

      <div class="team-stat-card">
        <strong>Runs Allowed / Game</strong><br>
        ${formatMLBSnapshotValue(
          teamStats["Avg Runs Allowed"]
        )}
      </div>

      <div class="team-stat-card">
        <strong>Hits / Game</strong><br>
        ${formatMLBSnapshotValue(
          teamStats["Avg Hits"]
        )}
      </div>

      <div class="team-stat-card">
        <strong>Home Runs / Game</strong><br>
        ${formatMLBSnapshotValue(
          teamStats["Avg Home Runs"]
        )}
      </div>

      <div class="team-stat-card">
        <strong>Total Bases / Game</strong><br>
        ${formatMLBSnapshotValue(
          teamStats["Avg Total Bases"]
        )}
      </div>

      <div class="team-stat-card">
        <strong>Strikeouts / Game</strong><br>
        ${formatMLBSnapshotValue(
          teamStats["Avg Strikeouts"]
        )}
      </div>

    </div>

  `;

  } else if (league === "nba") {

  const formatNBASnapshotValue = (value, decimals = 1) => {

    const num = Number(value);

    if (
      value === undefined ||
      value === null ||
      value === "" ||
      Number.isNaN(num)
    ) {
      return "--";
    }

    return decimals === 0
      ? Math.round(num)
      : num.toFixed(decimals);

  };

  statsContainer.innerHTML = `

    <div class="team-stat-grid">

      <div class="team-stat-card">
        <strong>Games Played</strong><br>
        ${formatNBASnapshotValue(
          teamStats["Games Played"],
          0
        )}
      </div>

      <div class="team-stat-card">
        <strong>Points / Game</strong><br>
        ${formatNBASnapshotValue(
          teamStats["Avg Points For"]
        )}
      </div>

      <div class="team-stat-card">
        <strong>Points Allowed / Game</strong><br>
        ${formatNBASnapshotValue(
          teamStats["Avg Points Allowed"]
        )}
      </div>

      <div class="team-stat-card">
        <strong>Rebounds / Game</strong><br>
        ${formatNBASnapshotValue(
          teamStats["Avg Rebounds"]
        )}
      </div>

      <div class="team-stat-card">
        <strong>Assists / Game</strong><br>
        ${formatNBASnapshotValue(
          teamStats["Avg Assists"]
        )}
      </div>

      <div class="team-stat-card">
        <strong>Threes / Game</strong><br>
        ${formatNBASnapshotValue(
          teamStats["Avg Threes"]
        )}
      </div>

      <div class="team-stat-card">
        <strong>Turnovers / Game</strong><br>
        ${formatNBASnapshotValue(
          teamStats["Avg Turnovers"]
        )}
      </div>

    </div>

  `;

} else if (league === "nhl") {

  const formatNHLSnapshotValue = (value, decimals = 1) => {

    const num = Number(value);

    if (
      value === undefined ||
      value === null ||
      value === "" ||
      Number.isNaN(num)
    ) {
      return "--";
    }

    return decimals === 0
      ? Math.round(num)
      : num.toFixed(decimals);

  };

  statsContainer.innerHTML = `

    <div class="team-stat-grid">

      <div class="team-stat-card">
        <strong>Games Played</strong><br>
        ${formatNHLSnapshotValue(
          teamStats["Games Played"],
          0
        )}
      </div>

      <div class="team-stat-card">
        <strong>Goals / Game</strong><br>
        ${formatNHLSnapshotValue(
          teamStats["Avg Goals For"]
        )}
      </div>

      <div class="team-stat-card">
        <strong>Goals Allowed / Game</strong><br>
        ${formatNHLSnapshotValue(
          teamStats["Avg Goals Allowed"]
        )}
      </div>

      <div class="team-stat-card">
        <strong>Shots On Goal / Game</strong><br>
        ${formatNHLSnapshotValue(
          teamStats["Avg Shots On Goal"]
        )}
      </div>

      <div class="team-stat-card">
        <strong>Assists / Game</strong><br>
        ${formatNHLSnapshotValue(
          teamStats["Avg Assists"]
        )}
      </div>

      <div class="team-stat-card">
        <strong>Points / Game</strong><br>
        ${formatNHLSnapshotValue(
          teamStats["Avg Points"]
        )}
      </div>

      <div class="team-stat-card">
        <strong>Saves / Game</strong><br>
        ${formatNHLSnapshotValue(
          teamStats["Avg Saves"]
        )}
      </div>

    </div>

  `;

} else {

  statsContainer.innerHTML = `

    <div class="team-stat-grid">

      <div class="team-stat-card">
        <strong>Games Played</strong><br>
        ${teamStats["Games Played"]}
      </div>

      <div class="team-stat-card">
        <strong>Points For</strong><br>
        ${teamStats["Points For"]}
      </div>

      <div class="team-stat-card">
        <strong>Points Allowed</strong><br>
        ${teamStats["Points Allowed"]}
      </div>

      <div class="team-stat-card">
        <strong>Passing Yards</strong><br>
        ${teamStats["Passing Yards"]}
      </div>

      <div class="team-stat-card">
        <strong>Rushing Yards</strong><br>
        ${teamStats["Rushing Yards"]}
      </div>

      <div class="team-stat-card">
        <strong>Turnovers</strong><br>
        ${teamStats["Turnovers"]}
      </div>

      <div class="team-stat-card">
        <strong>Sacks</strong><br>
        ${teamStats["Sacks"]}
      </div>

    </div>

  `;

}

const trendsContainer =
  document.getElementById("team-trends-content");

if (!teamTrends.length) {

  trendsContainer.innerHTML =
    "<p>No current team trends found.</p>";

} else {

  trendsContainer.innerHTML =
    teamTrends.map(createTeamTrendCard).join("");

    document
      .querySelectorAll(".team-trend-card")
      .forEach(card => {

        card.addEventListener("click", () => {

          document
            .querySelectorAll(".team-trend-card")
            .forEach(c => c.classList.remove("selected"));

          card.classList.add("selected");

          const metric = card.dataset.metric;

          const trend =
            teamTrends.find(
              t => t["Metric"] === metric
            );

          if (!trend) return;

          // renderModelEdge(trend);

        });

      });

      if (teamTrends.length > 0) {

          // renderModelEdge(teamTrends[0]);

      }
}

console.log(teamGames);
console.log(teamGames[0]);

renderTeamGameLog(
  teamGames,
  league
);

}

/* ==========================================================
   PLAYER PROFILE DIRECTORY
   Shared directory engine for all leagues
========================================================== */

const PLAYER_PROFILE_DIRECTORY_CONFIG = {

  nfl: {
    label: "NFL",
    rosterUrl: NFL_ROSTERS_CSV_URL
  },

  nba: {
    label: "NBA",
    rosterUrl: NBA_ROSTERS_CSV_URL
  },

  nhl: {
    label: "NHL",
    rosterUrl: NHL_PLAYERS_CSV_URL,
    type: "nhl"
  }

};

function getNHLCurrentTeam(teamsValue) {

  if (!teamsValue) {
    return "";
  }

  let teams;

  try {
    teams = JSON.parse(teamsValue);
  } catch (error) {
    return "";
  }

  if (!Array.isArray(teams) || !teams.length) {
    return "";
  }

  /*
    The NHL Players sheet contains team history.
    Use the highest season as the player's
    current/latest team.
  */
  const latestTeam =
    [...teams]
      .filter((team) =>
        team &&
        team.full_name &&
        team.season !== undefined &&
        team.season !== null
      )
      .sort(
        (a, b) =>
          Number(b.season) - Number(a.season)
      )[0];

  return latestTeam
    ? String(latestTeam.full_name || "").trim()
    : "";
}

async function initPlayerProfileDirectory(league) {

  const config =
    PLAYER_PROFILE_DIRECTORY_CONFIG[league];

  if (!config) {
    return;
  }


  const leagueLabel =
    config.label;


  const teamSelect =
    document.getElementById(
      `${league}-player-profile-team`
    );

  const playerSelect =
    document.getElementById(
      `${league}-player-profile-player`
    );

  const profileButton =
    document.getElementById(
      `${league}-player-profile-button`
    );

  const message =
    document.getElementById(
      `${league}-player-profile-directory-message`
    );


  /*
    This allows the same script.js to load on every
    Sportacular page without running directory logic
    unless the required controls actually exist.
  */
  if (
    !teamSelect ||
    !playerSelect ||
    !profileButton
  ) {
    return;
  }


  try {

    const response =
      await fetch(config.rosterUrl);


    if (!response.ok) {

      throw new Error(
        `${leagueLabel} roster request failed: ${response.status}`
      );

    }


    const csv =
      await response.text();


    const rows =
      parseCSV(csv);


    /*
      NFL and NBA currently share these exact
      directory-relevant Rosters headers:

      Id
      Full Name
      Team Name
      Position
      Status
    */
    const players =
      rows
        .map((row) => {

          const id =
            String(
              row["Id"] || ""
            ).trim();

          const name =
            String(
              row["Full Name"] || ""
            ).trim();

          /*
            NHL uses:
              Teams
              Position Code

            NFL/NBA use:
              Team Name
              Position
              Status
          */
          if (config.type === "nhl") {

            return {

              id,

              name,

              team:
                getNHLCurrentTeam(
                  row["Teams"]
                ),

              position:
                String(
                  row["Position Code"] || ""
                ).trim(),

              /*
                NHL Players does not use the same
                Status field as NFL/NBA.
              */
              status: "active"

            };

          }

          return {

            id,

            name,

            team:
              String(
                row["Team Name"] || ""
              ).trim(),

            position:
              String(
                row["Position"] || ""
              ).trim(),

            status:
              String(
                row["Status"] || ""
              ).trim()

          };

        })
        .filter((player) =>

          player.id &&
          player.name &&
          player.team &&
          player.status.toLowerCase() === "active"

        );


    if (!players.length) {

      throw new Error(
        `No active ${leagueLabel} players were found in the roster.`
      );

    }


    /*
      Build the team list dynamically from
      the actual active roster.
    */
    const teams =
      [
        ...new Set(
          players.map(
            (player) => player.team
          )
        )
      ]
        .filter(Boolean)
        .sort(
          (a, b) =>
            a.localeCompare(b)
        );


    teamSelect.innerHTML = `
      <option value="">
        Select an ${leagueLabel} team
      </option>
    `;


    teams.forEach((team) => {

      const option =
        document.createElement("option");

      option.value =
        team;

      option.textContent =
        team;

      teamSelect.appendChild(option);

    });


    /*
      Team selection
      ----------------
      Filter active players to the selected team.
    */
    teamSelect.addEventListener(
      "change",
      () => {

        const selectedTeam =
          teamSelect.value;


        playerSelect.innerHTML = `
          <option value="">
            Select a player
          </option>
        `;


        playerSelect.disabled =
          true;

        profileButton.disabled =
          true;


        if (message) {
          message.textContent = "";
        }


        if (!selectedTeam) {

          playerSelect.innerHTML = `
            <option value="">
              Select a team first
            </option>
          `;

          return;

        }


        const teamPlayers =
          players
            .filter(
              (player) =>
                player.team === selectedTeam
            )
            .sort(
              (a, b) =>
                a.name.localeCompare(b.name)
            );


        teamPlayers.forEach((player) => {

          const option =
            document.createElement("option");


          option.value =
            player.id;


          option.textContent =
            player.position
              ? `${player.name} — ${player.position}`
              : player.name;


          playerSelect.appendChild(option);

        });


        if (!teamPlayers.length) {

          playerSelect.innerHTML = `
            <option value="">
              No active players found
            </option>
          `;


          if (message) {

            message.textContent =
              "No active players were found for this team.";

          }


          return;

        }


        playerSelect.disabled =
          false;

      }
    );


    /*
      Player selection
      ----------------
      Enable profile navigation only after
      an actual player ID is selected.
    */
    playerSelect.addEventListener(
      "change",
      () => {

        profileButton.disabled =
          !playerSelect.value;


        if (message) {
          message.textContent = "";
        }

      }
    );


    /*
      Universal Player Profile navigation.
    */
    profileButton.addEventListener(
      "click",
      () => {

        const playerId =
          playerSelect.value;


        if (!playerId) {
          return;
        }


        window.location.href =
          `player.html?league=${encodeURIComponent(league)}&id=${encodeURIComponent(playerId)}`;

      }
    );


    if (message) {
      message.textContent = "";
    }


    console.log(
      `${leagueLabel} Player Profile Directory:`,
      {
        players: players.length,
        teams: teams.length
      }
    );


  } catch (error) {

    console.error(
      `${leagueLabel} Player Profile Directory Error:`,
      error
    );


    teamSelect.innerHTML = `
      <option value="">
        Unable to load ${leagueLabel} teams
      </option>
    `;


    teamSelect.disabled =
      true;


    playerSelect.innerHTML = `
      <option value="">
        Players unavailable
      </option>
    `;


    playerSelect.disabled =
      true;

    profileButton.disabled =
      true;


    if (message) {

      message.textContent =
        `${leagueLabel} player directory data is temporarily unavailable.`;

    }

  }

}


/* ==========================================================
   PLAYER PROFILE DIRECTORY INITIALIZATION
========================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initPlayerProfileDirectory("nfl");
    initPlayerProfileDirectory("nba");
    initPlayerProfileDirectory("nhl");

  }
);