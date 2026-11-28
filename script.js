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
const MLB_ROSTERS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=71053884&single=true&output=csv";
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
const NBA_PROPS_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=590324617&single=true&output=csv";
const NHL_PROPS_PREMIUM_URL = "/.netlify/functions/nhl-props-premium";
const NHL_PROPS_TEASER_URL = "/.netlify/functions/nhl-props-teaser";
const MLB_PROPS_PREMIUM_URL = "/.netlify/functions/mlb-props-premium";
const MLB_PROPS_TEASER_URL = "/.netlify/functions/mlb-props-teaser";
const NFL_PROPS_PREMIUM_URL = "/.netlify/functions/nfl-props-premium";
const NFL_PROPS_TEASER_URL = "/.netlify/functions/nfl-props-teaser";
const NFL_PROPS_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7eg-0liRvxa9q2k6IM2mipst48DHUMa8yXltD8irldOtim2Emic7w0rtl1gfT5xl_AVhR29jBrqY1/pub?gid=2077637558&single=true&output=csv";

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
    csvUrl: NBA_PROPS_SHEET_URL,
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
    csvUrl: NFL_PROPS_SHEET_URL,
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

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${league.toUpperCase()} team season stats: ${response.status}`
    );
  }

  const csv = await response.text();

  return parseCSV(csv);

}

async function fetchTeamTrends(league) {

  const config = TEAM_PROFILE_CONFIG[league];

  if (!config) return [];

  const response = await fetch(config.teamTrends);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${league.toUpperCase()} team trends: ${response.status}`
    );
  }

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
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Phoenix" }).format(new Date());
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
    "score-desc": "Highest Sportacular Score",
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

function renderLeaderboard(containerId, games, tierName = "Rookie", league = "nba") {
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
      gameLabel: matchupLinks(league, game.awayTeam, game.homeTeam),
      vendor: game.vendor,
      scheduleStatus: game.scheduleStatus
    }))
  );

  const plays = allRankings.filter((item) => item.side && item.side !== "No Play" && Number.isFinite(item.sportacularScore));
  const pool = plays.length ? plays : allRankings;

  const limited = splitBalanced(
    pool.sort((a, b) => (b.sportacularScore ?? -1) - (a.sportacularScore ?? -1)),
    rules.showLeaderboardCount
  );
  const rows = [];
  const addGroup = (title, items) => {
    if (!items.length) return;
    rows.push(`<div class="leaderboard-group">${title}</div>`);
    rows.push(`
      <div class="odds-table-wrap">
        <table class="odds-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Game</th>
              <th>Bet</th>
              <th>Score</th>
              <th>EV</th>
              <th>Book</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.gameLabel}</td>
                <td>${item.bet || "—"}</td>
                <td>${formatSportacularScore(item.sportacularScore)}</td>
                <td class="${getEVClass(item.ev)}">${formatEV(item.ev)}</td>
                <td>${displayBook(item.vendor)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `);
  };
  addGroup("Live", limited.live);
  addGroup("Upcoming", limited.upcoming);

  container.innerHTML = rows.join("");
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

  const ranked = [...props].sort((a, b) => (b.sportacularScore ?? -1) - (a.sportacularScore ?? -1));
  const groups = splitBalanced(ranked, limit);
  const blocks = [];
  const addGroup = (title, items) => {
    if (!items.length) return;
    blocks.push(`<div class="leaderboard-group">${title}</div>`);
      blocks.push(`
        <div class="odds-table-wrap">
          <table class="odds-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Bet</th>
                <th>Line</th>
                <th>Score</th>
                <th>EV</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((prop, index) => {
                const fullName = getPropFullName(prop);
                const playerCell = prop.playerId && prop.league
                  ? `<a class="player-link" href="player.html?league=${encodeURIComponent(prop.league)}&id=${encodeURIComponent(prop.playerId)}">${fullName}</a>`
                  : fullName;
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${playerCell}</td>
                    <td>${prop.betType || "—"} ${formatPropTypeLabel(prop.propType)}</td>
                    <td>${formatLineValue(prop.lineValue)}</td>
                    <td>${formatSportacularScore(prop.sportacularScore)}</td>
                    <td class="${getEVClass(prop.ev)}">${formatEV(prop.ev)}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      `);
  };
  addGroup("Live", groups.live);
  addGroup("Upcoming", groups.upcoming);
  container.innerHTML = blocks.join("");
}

function readSheetNumber(value) {
  const number = toNumber(value);
  return Number.isFinite(number) ? number : null;
}

function formatSportacularScore(value) {
  return Number.isFinite(value) ? Number(value).toFixed(1) : "—";
}

function formatStoredPercent(value) {
  const number = toNumber(value);
  if (!Number.isFinite(number)) return "—";
  return `${number.toFixed(1)}%`;
}

function readTrendRate(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return NaN;
  const number = toNumber(raw);
  if (!Number.isFinite(number)) return NaN;
  return raw.includes("%") || Math.abs(number) > 1 ? number / 100 : number;
}

function formatTrendScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "N/A";
  return `${number > 0 ? "+" : ""}${number.toFixed(1)}`;
}

function formatComplementPercent(value) {
  const number = toNumber(value);
  if (!Number.isFinite(number)) return "—";
  return `${(100 - number).toFixed(1)}%`;
}

function oddsMarketHitRate(row, market, side) {
  if (market === "Total") {
    if (side === "Over") return formatStoredPercent(row["Total Over Rate"]);
    if (side === "Under") return formatComplementPercent(row["Total Over Rate"]);
  }

  if (market === "Spread") {
    if (side === "Away") return formatStoredPercent(row["Away Cover Rate"]);
    if (side === "Home") return formatStoredPercent(row["Home Cover Rate"]);
  }

  return "—";
}

function buildRankingsFromRow(row) {
  const awayTeam = safeText(row["Away Team"], "Away Team");
  const homeTeam = safeText(row["Home Team"], "Home Team");
  const totalValue = safeText(row["Total Value"], "");
  const markets = [
    {
      market: "Total",
      sideKey: "Total Best Side",
      scoreKey: "Total Sportacular Score",
      riskKey: "Total Risk Tier",
      confidenceKey: "Total Confidence Tier",
      evKey: "Total Best EV"
    },
    {
      market: "Spread",
      sideKey: "Spread Best Side",
      scoreKey: "Spread Sportacular Score",
      riskKey: "Spread Risk Tier",
      confidenceKey: "Spread Confidence Tier",
      evKey: "Spread Best EV"
    },
    {
      market: "Moneyline",
      sideKey: "Moneyline Best Side",
      scoreKey: "Moneyline Sportacular Score",
      riskKey: "Moneyline Risk Tier",
      confidenceKey: "Moneyline Confidence Tier",
      evKey: "Moneyline Best EV"
    }
  ];

  const rankings = markets.map((market) => {
    const side = safeText(row[market.sideKey], "No Play");
    let bet = market.market;

    if (market.market === "Total" && side === "Over") bet = totalValue ? `Over ${totalValue}` : "Over";
    if (market.market === "Total" && side === "Under") bet = totalValue ? `Under ${totalValue}` : "Under";
    if (market.market === "Total" && side === "No Play") bet = "Total · No Play";
    if (market.market === "Spread" && side === "Away") bet = `${awayTeam} ${safeText(row["Spread Away Value"], "")}`.trim();
    if (market.market === "Spread" && side === "Home") bet = `${homeTeam} ${safeText(row["Spread Home Value"], "")}`.trim();
    if (market.market === "Spread" && side === "No Play") bet = "Spread · No Play";
    if (market.market === "Moneyline" && side === "Away") bet = `${awayTeam} ML`;
    if (market.market === "Moneyline" && side === "Home") bet = `${homeTeam} ML`;
    if (market.market === "Moneyline" && side === "No Play") bet = "Moneyline · No Play";

    const score = readSheetNumber(row[market.scoreKey]);
    const ev = readSheetNumber(row[market.evKey]);

    return {
      market: market.market,
      bet,
      side,
      ev: ev === null ? NaN : ev,
      sportacularScore: score,
      risk: safeText(row[market.riskKey], "—"),
      confidence: safeText(row[market.confidenceKey], "—"),
      hitRate: oddsMarketHitRate(row, market.market, side),
      recommendation: side
    };
  });

  return rankings.sort((a, b) => (b.sportacularScore ?? -1) - (a.sportacularScore ?? -1));
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
      gameId: safeText(row["Game Id"], ""),
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
      bestMarket: safeText(row["Best Market"], "No Play"),
      bestMarketSide: safeText(row["Best Market Side"], ""),
      bestMarketScore: readSheetNumber(row["Best Market Score"]),

      rankings: buildRankingsFromRow(row)
    }))
    .filter((game) => game.rankings.length > 0);
}

function buildPropsFromRows(rows, league = "mlb") {

  const props = [];

  rows.forEach((row) => {

    const gameDate =
      normalizeDate(
        row["Game Date"]
      );

    const playerId =
      safeText(
        row["Player Id"],
        ""
      );

    const playerName =
      safeText(
        row["Player Name"],
        ""
      );

    const playerFirstName =
      safeText(
        row["Player First Name"],
        ""
      );

    const playerLastName =
      safeText(
        row["Player Last Name"],
        ""
      );

    const resolvedPlayerName =
      playerName ||
      `${playerFirstName} ${playerLastName}`.trim();

    const vendor =
      safeText(
        row["Vendor"],
        ""
      );

    const propType =
      safeText(
        row["Prop Type"],
        ""
      );

    const lineValue =
      safeText(
        row["Line Value"],
        ""
      );

    const overOdds =
      safeText(
        row["Over Odds"],
        ""
      );

    const underOdds =
      safeText(
        row["Under Odds"],
        ""
      );

    const genericOdds =
      safeText(
        row["Odds"],
        ""
      );

    const bestSide =
      safeText(
        row["Best Side"],
        ""
      );

    const normalizedBestSide =
      bestSide
        .trim()
        .toLowerCase();


    // --------------------------------------------
    // Universal A:AJ model outputs
    // --------------------------------------------

    const modelProbOver =
      toNumber(
        row["Model Prob Over"]
      );

    const modelProbUnder =
      toNumber(
        row["Model Prob Under"]
      );

    const evOver =
      toNumber(
        row["EV Over"]
      );

    const evUnder =
      toNumber(
        row["EV Under"]
      );

    const bestEVRaw =
      toNumber(
        row["Best EV"]
      );

    const bestEV =
      Number.isFinite(bestEVRaw)
        ? bestEVRaw
        : null;

    const bestModelProbabilityRaw =
      toNumber(
        row["Best Model Probability"]
      );

    const bestModelProbability =
      Number.isFinite(bestModelProbabilityRaw)
        ? bestModelProbabilityRaw
        : null;

    const bestPriceEdgeRaw =
      toNumber(
        row["Best Price Edge"]
      );

    const bestPriceEdge =
      Number.isFinite(bestPriceEdgeRaw)
        ? bestPriceEdgeRaw
        : null;

    const riskScoreRaw =
      toNumber(
        row["Risk Score"]
      );

    const riskScore =
      Number.isFinite(riskScoreRaw)
        ? riskScoreRaw
        : null;

    const modelConfidenceRaw =
      toNumber(
        row["Model Confidence"]
      );

    const modelConfidence =
      Number.isFinite(modelConfidenceRaw)
        ? modelConfidenceRaw
        : null;

    const sportacularScoreRaw =
      toNumber(
        row["Sportacular Score"]
      );

    const sportacularScore =
      Number.isFinite(sportacularScoreRaw)
        ? sportacularScoreRaw
        : null;

    const sportacularEdgeRaw =
      toNumber(
        row["Sportacular Edge"]
      );

    const sportacularEdge =
      Number.isFinite(sportacularEdgeRaw)
        ? sportacularEdgeRaw
        : null;


    // --------------------------------------------
    // Only actionable P15 sides become website
    // betting opportunities.
    // --------------------------------------------

    let betType = "";
    let ev = NaN;
    let probability = NaN;
    let selectedOdds = "";

    if (normalizedBestSide === "over") {

      betType = "Over";
      ev = evOver;
      probability = modelProbOver;
      selectedOdds = overOdds;

    } else if (normalizedBestSide === "under") {

      betType = "Under";
      ev = evUnder;
      probability = modelProbUnder;
      selectedOdds = underOdds;

    } else {

      // P15 explicitly decided No Play.
      return;

    }


    const awayTeam =
      safeText(
        row["Away Team"],
        ""
      );

    const homeTeam =
      safeText(
        row["Home Team"],
        ""
      );

    const gameLabel =
      awayTeam && homeTeam
        ? `${awayTeam} at ${homeTeam}`
        : "";


    if (
      !gameDate ||
      !resolvedPlayerName ||
      !vendor ||
      !propType ||
      lineValue === "" ||
      !Number.isFinite(ev)
    ) {
      return;
    }


    props.push({

      gameDate,

      playerId,

      gameId:
        safeText(
          row["Game Id"],
          ""
        ),

      league,

      playerName:
        resolvedPlayerName,

      playerFirstName,

      playerLastName,

      vendor,

      propType,

      lineValue,

      betType,

      overOdds,

      underOdds,

      genericOdds:
        selectedOdds ||
        genericOdds,

      // Existing frontend still uses this field name.
      // It now contains the selected P15 model probability.
      impliedProbability:
        Number.isFinite(probability)
          ? probability
          : bestModelProbability,

      ev,

      bestSide:
        bestSide || null,

      bestEV,

      bestModelProbability,

      bestPriceEdge,

      trendScore:
        toNumber(
          row["Trend Score"]
        ),

      trendStrength:
        safeText(
          row["Trend Strength"],
          ""
        ),

      riskScore,

      riskTier:
        safeText(
          row["Risk Tier"],
          ""
        ),

      modelConfidence,

      sportacularScore,

      sportacularEdge,

      confidenceTier:
        safeText(
          row["Confidence Tier"],
          ""
        ),

      lineHitRate: formatStoredPercent(row["Line Hit Rate"]),

      awayTeam,

      homeTeam,

      gameLabel

    });

  });


  return props;

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
    const listedOdds = safeText(row["Odds"], "");
    const overPrice = overOdds || listedOdds;

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

    const sportacularScore = readSheetNumber(row["Sportacular Score"]);
    const confidenceTier = safeText(row["Confidence Tier"], "");
    const lineHitRate = formatStoredPercent(row["Line Hit Rate"]);

    if (
      playerName &&
      vendor &&
      propType &&
      lineValue !== "" &&
      overPrice !== "" &&
      !Number.isNaN(overEV)
    ) {
    if (bestSide === "Over") {
      props.push({
        gameDate,
        playerId,
        gameId: safeText(row["Game Id"], ""),
        league: "nfl",
        playerName,
        playerFirstName,
        playerLastName,
        vendor,
        propType,
        lineValue,
        betType: "Over",
        overOdds: overPrice,
        underOdds,
        genericOdds: overPrice,
        impliedProbability: impliedProbOver,
        ev: overEV,

        bestSide,
        bestEV,
        bestModelProbability,
        bestPriceEdge,
        riskTier,
        modelConfidence,
        sportacularScore,
        confidenceTier,
        lineHitRate,

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
        gameId: safeText(row["Game Id"], ""),
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
        sportacularScore,
        confidenceTier,
        lineHitRate,

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

    const currentScore = Number.isFinite(prop.sportacularScore) ? prop.sportacularScore : -Infinity;
    const existingScore = Number.isFinite(existing.sportacularScore) ? existing.sportacularScore : -Infinity;

    if (currentScore > existingScore) {
      bestMarkets.set(marketKey, prop);
      return;
    }

    if (currentScore === existingScore) {
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

function createBetCard(game, tierName = "Rookie", league = "nba") {
  const rules = TIER_RULES[tierName] || TIER_RULES.Rookie;
  const ranked = [...game.rankings]
    .filter((item) => String(item.side || "").trim().toLowerCase() !== "no play")
    .sort((a, b) => (b.sportacularScore ?? -1) - (a.sportacularScore ?? -1));
  const visibleRankings = ranked.slice(0, rules.maxRankingsPerGame);
  const isPlay = game.bestMarket && game.bestMarket !== "No Play" && game.bestMarket !== "N/A";
  const headline = isPlay
    ? game.rankings.find((item) => item.market === game.bestMarket) || null
    : null;

  const rankingsHTML = visibleRankings.length
    ? visibleRankings.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.bet}</td>
          <td>${formatSportacularScore(item.sportacularScore)}</td>
          <td>${item.confidence || "—"}</td>
          <td>${item.risk || "—"}</td>
          <td>${item.hitRate || "—"}</td>
          <td class="${getEVClass(item.ev)}">${formatEV(item.ev)}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="7">No ranked sides</td></tr>`;

  const lockedCount = Math.max(ranked.length - visibleRankings.length, 0);

  return `
    <article class="bet-card">
      <div class="bet-card-header">
        <div>
          <h3>${matchupLinks(league, game.awayTeam, game.homeTeam)}</h3>
          <p class="bet-subtext">Sportsbook: ${game.vendor} | Game Date: ${game.gameDate}${game.scheduleStatus ? ` | ${statusLabel(game.scheduleStatus)}` : ""}</p>
        </div>
        <div class="bet-card-analytics">
          <table class="odds-table odds-summary-table">
            <tbody>
              <tr>
                <th scope="row">Best Market</th>
                <td>${isPlay ? `${game.bestMarket} · ${game.bestMarketSide}` : "No Play"}</td>
              </tr>
              <tr>
                <th scope="row">Sportacular Score</th>
                <td>${isPlay ? formatSportacularScore(game.bestMarketScore) : "—"}</td>
              </tr>
              <tr>
                <th scope="row">Confidence</th>
                <td>${headline?.confidence || "—"}</td>
              </tr>
              <tr>
                <th scope="row">Risk</th>
                <td>${headline?.risk || "—"}</td>
              </tr>
              <tr>
                <th scope="row">Hit Rate</th>
                <td>${headline?.hitRate || "—"}</td>
              </tr>
            </tbody>
          </table>
          ${isPlay && !gameHasStarted(game.scheduleStatus) ? `<a class="card-link" href="parlay.html?league=${encodeURIComponent(league)}&board=odds&q=${encodeURIComponent(headline?.bet || `${game.awayTeam} at ${game.homeTeam}`)}">Add best side to parlay</a>` : ""}
        </div>
      </div>

      <div class="market-grid">
        <div class="market-box">
          <h4>Spread</h4>
          <div class="odds-table-wrap">
            <table class="odds-table">
              <thead>
                <tr><th>Team</th><th>Line</th><th>Odds</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>${game.awayTeam}</td>
                  <td>${formatLineValue(game.spreadAwayValue)}</td>
                  <td>${formatAmericanOdds(game.spreadAwayOdds)}</td>
                </tr>
                <tr>
                  <td>${game.homeTeam}</td>
                  <td>${formatLineValue(game.spreadHomeValue)}</td>
                  <td>${formatAmericanOdds(game.spreadHomeOdds)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="market-box">
          <h4>Moneyline</h4>
          <div class="odds-table-wrap">
            <table class="odds-table">
              <thead>
                <tr><th>Team</th><th>Odds</th><th>Implied</th><th>Vig-Free</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>${game.awayTeam}</td>
                  <td>${formatAmericanOdds(game.moneylineAwayOdds)}</td>
                  <td>${formatProbability(game.impliedProbAwayML)}</td>
                  <td>${formatProbability(game.vigFreeProbAwayML)}</td>
                </tr>
                <tr>
                  <td>${game.homeTeam}</td>
                  <td>${formatAmericanOdds(game.moneylineHomeOdds)}</td>
                  <td>${formatProbability(game.impliedProbHomeML)}</td>
                  <td>${formatProbability(game.vigFreeProbHomeML)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="market-box">
          <h4>Total</h4>
          <div class="odds-table-wrap">
            <table class="odds-table">
              <thead>
                <tr><th>Side</th><th>Line</th><th>Odds</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>Over</td>
                  <td>${formatLineValue(game.totalValue)}</td>
                  <td>${formatAmericanOdds(game.totalOverOdds)}</td>
                </tr>
                <tr>
                  <td>Under</td>
                  <td>${formatLineValue(game.totalValue)}</td>
                  <td>${formatAmericanOdds(game.totalUnderOdds)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="rank-list">
        <h4>Sportacular Scores</h4>
        <div class="odds-table-wrap">
          <table class="odds-table odds-score-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Bet</th>
                <th>Score</th>
                <th>Confidence</th>
                <th>Risk</th>
                <th>Hit</th>
                <th>EV</th>
              </tr>
            </thead>
            <tbody>
              ${rankingsHTML}
            </tbody>
          </table>
        </div>
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
    oddsToShow = formatAmericanOdds(prop.overOdds || prop.genericOdds);
  } else if (betTypeLower.includes("under")) {
    oddsToShow = formatAmericanOdds(prop.underOdds || prop.genericOdds);
  } else {
    oddsToShow = formatAmericanOdds(prop.genericOdds || prop.overOdds || prop.underOdds);
  }

  const fullName = getPropFullName(prop);
  const confidenceText = prop.confidenceTier || (Number.isFinite(prop.modelConfidence) ? prop.modelConfidence.toFixed(1) : "—");
  const playerTitle = prop.playerId && prop.league
    ? `<a class="player-link" href="player.html?league=${encodeURIComponent(prop.league)}&id=${encodeURIComponent(prop.playerId)}">${fullName}</a>`
    : fullName;
  const parlayLink = prop.playerId && !gameHasStarted(prop.scheduleStatus)
    ? `<a class="card-link" href="parlay.html?league=${encodeURIComponent(prop.league || "")}&board=props&q=${encodeURIComponent(`${fullName} ${prop.propType || ""} ${prop.lineValue || ""} ${prop.bestSide || ""}`.trim())}">Add to parlay</a>`
    : "";

  return `
    <article class="prop-card">
      <div class="prop-card-header">
        <div>
          <h3>${playerTitle} — ${formatPropTypeLabel(prop.propType)}</h3>
          <p class="prop-meta">${prop.awayTeam && prop.homeTeam ? `${matchupLinks(prop.league, prop.awayTeam, prop.homeTeam)} | ` : ""}${prop.vendor} | ${prop.gameDate || "Today"}${prop.scheduleStatus ? ` | ${statusLabel(prop.scheduleStatus)}` : ""}</p>
        </div>
        <div class="bet-card-analytics">
          <table class="odds-table odds-summary-table">
            <tbody>
              <tr><th scope="row">Best Side</th><td>${prop.bestSide || prop.betType || "—"}</td></tr>
              <tr><th scope="row">Sportacular Score</th><td>${formatSportacularScore(prop.sportacularScore)}</td></tr>
              <tr><th scope="row">Confidence</th><td>${confidenceText}</td></tr>
              <tr><th scope="row">Risk</th><td>${prop.riskTier || "—"}</td></tr>
              <tr><th scope="row">Hit Rate</th><td>${prop.lineHitRate || "—"}</td></tr>
              <tr><th scope="row">EV</th><td class="${getEVClass(prop.ev)}">${formatEV(prop.ev)}</td></tr>
            </tbody>
          </table>
          ${parlayLink}
        </div>
      </div>
      <div class="odds-table-wrap">
        <table class="odds-table">
          <thead>
            <tr><th>Bet Type</th><th>Line</th><th>Odds</th><th>Model Probability</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>${prop.betType || "—"}</td>
              <td>${formatLineValue(prop.lineValue)}</td>
              <td>${oddsToShow}</td>
              <td>${probabilityText}</td>
            </tr>
          </tbody>
        </table>
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
        <a
          href="pricing.html"
          class="btn btn-primary"
          data-upgrade-analytics="true"
          data-upgrade-feature="game_odds"
          data-upgrade-league="${config.emptyLabel}"
          data-upgrade-required-tier="Veteran"
        >View Plans</a>
      </div>
    </div>
  `;
}

const SCHEDULE_CSV = {
  nba: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=1724367340&single=true&output=csv",
  nhl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYTgu9bsGUhI1gicOOfLrgYHmNMfrl3W1OKhAVs9cdrdd2CagJZSVM3F25hQ8vk0aRK7hapVmbNWQP/pub?gid=2048323486&single=true&output=csv",
  mlb: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=314629327&single=true&output=csv",
  nfl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7eg-0liRvxa9q2k6IM2mipst48DHUMa8yXltD8irldOtim2Emic7w0rtl1gfT5xl_AVhR29jBrqY1/pub?gid=1131205016&single=true&output=csv"
};

function leagueFromOddsUrl(csvUrl) {
  if (csvUrl === NBA_CSV_URL) return "nba";
  if (csvUrl === NHL_CSV_URL) return "nhl";
  if (csvUrl === MLB_CSV_URL) return "mlb";
  if (csvUrl === NFL_CSV_URL) return "nfl";
  return "";
}

function isClosedGameStatus(status) {
  const value = String(status || "").trim().toLowerCase();
  return ["final", "complete", "completed", "postponed", "cancelled", "canceled"].includes(value);
}

function isInGameClock(status) {
  return /\b(?:qtr|quarter|half|halftime|ot|overtime|[1-4](?:st|nd|rd|th))\b/i.test(String(status || ""));
}

function isKickoffStatus(status) {
  const value = String(status || "").trim();
  if (!value || isInGameClock(value)) return false;
  if (/^\d{4}-\d{2}-\d{2}T/i.test(value)) return true;
  if (/^\d{1,2}\/\d{1,2}/.test(value)) return true;
  if (/^(mon|tue|wed|thu|fri|sat|sun)\b/i.test(value) && /\d{1,2}:\d{2}/.test(value)) return true;
  if (/^\d{1,2}:\d{2}/.test(value)) return true;
  return false;
}

function gameHasStarted(status) {
  const value = String(status || "").trim().toLowerCase();
  if (!value || value === "scheduled" || value === "pregame" || value === "delayed" || value === "not started") return false;
  if (isKickoffStatus(value)) return false;
  return true;
}

function statusLabel(status) {
  return homeStatus(status);
}

function splitBalanced(items, limit) {
  const live = items.filter((item) => gameHasStarted(item.scheduleStatus));
  const upcoming = items.filter((item) => !gameHasStarted(item.scheduleStatus));
  if (!Number.isFinite(limit) || limit >= items.length) return { live, upcoming };
  if (!live.length) return { live, upcoming: upcoming.slice(0, limit) };
  if (!upcoming.length) return { live: live.slice(0, limit), upcoming };

  let liveSlots = Math.min(live.length, Math.ceil(limit / 2));
  let upcomingSlots = Math.min(upcoming.length, limit - liveSlots);
  if (liveSlots + upcomingSlots < limit) {
    liveSlots = Math.min(live.length, limit - upcomingSlots);
  }
  return {
    live: live.slice(0, liveSlots),
    upcoming: upcoming.slice(0, upcomingSlots)
  };
}

function ensureLinesFilter(pageKey, beforeFilterId, onChange) {
  const selectId = `${pageKey}-lines-filter`;
  let select = document.getElementById(selectId);
  if (!select) {
    const anchor = document.getElementById(beforeFilterId);
    const box = anchor && anchor.closest(".control-box");
    if (!box || !box.parentElement) return "both";
    const wrap = document.createElement("div");
    wrap.className = "control-box";
    wrap.innerHTML = `
      <span class="control-label">Lines</span>
      <select id="${selectId}" class="sportsbook-select">
        <option value="both">Live and pregame</option>
        <option value="live">Live lines</option>
        <option value="pregame">Pregame lines</option>
      </select>
    `;
    box.parentElement.insertBefore(wrap, box);
    select = wrap.querySelector("select");
  }
  select.onchange = onChange;
  return select.value || "both";
}

function matchesLinesFilter(status, linesFilter) {
  if (linesFilter === "live") return gameHasStarted(status);
  if (linesFilter === "pregame") return !gameHasStarted(status);
  return true;
}

function marketGroupHTML(title, cards) {
  if (!cards) return "";
  return `<h3 class="market-group-title">${title}</h3>${cards}`;
}

const GAME_STATUS_CACHE = {};
const GAME_SLATE_CACHE = {};

function scheduleTeamKey(awayTeam, homeTeam) {
  const away = String(awayTeam || "").trim().toLowerCase();
  const home = String(homeTeam || "").trim().toLowerCase();
  return away && home ? `${away}|${home}` : "";
}

function lookupScheduleStatus(statuses, game) {
  const id = String(game.gameId || "").trim();
  if (id && statuses[id]) return statuses[id];
  const teams = scheduleTeamKey(game.awayTeam, game.homeTeam);
  return teams && statuses[`teams:${teams}`] ? statuses[`teams:${teams}`] : "";
}

function isOnScheduleSlate(league, game) {
  const slate = GAME_SLATE_CACHE[league];
  if (!slate) return false;
  const id = String(game.gameId || "").trim();
  const teams = scheduleTeamKey(game.awayTeam, game.homeTeam);
  return (id && slate.has(id)) || (teams && slate.has(`teams:${teams}`));
}

const TONIGHT_STATUS = {};
let ACTIVE_TONIGHT = {};

async function loadTonightStatuses(league) {
  if (TONIGHT_STATUS[league]) {
    ACTIVE_TONIGHT = TONIGHT_STATUS[league];
    return ACTIVE_TONIGHT;
  }

  const map = {};
  const url = SCHEDULE_CSV[league];
  if (url) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const rows = parseCSV(await response.text());
        const today = getTodayDateString();
        rows.forEach((row) => {
          if (normalizeDate(row["Game Date"]) !== today) return;
          const status = String(row.Status || "").trim();
          if (!status) return;
          [row["Away Team"], row["Home Team"]].forEach((team) => {
            const name = String(team || "").trim().toLowerCase();
            if (name) map[name] = status;
          });
        });
      }
    } catch (error) {
      console.error("Trend schedule lookup failed:", error);
    }
  }

  TONIGHT_STATUS[league] = map;
  ACTIVE_TONIGHT = map;
  return map;
}

function tonightStatus(team) {
  const status = ACTIVE_TONIGHT[String(team || "").trim().toLowerCase()] || "";
  return status ? ` • ${status}` : "";
}

async function teamTonight(league, teamName) {
  const url = SCHEDULE_CSV[league];
  if (!url || !teamName) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const rows = parseCSV(await response.text());
    const today = getTodayDateString();
    const name = teamName.trim().toLowerCase();
    return rows.find((row) => {
      const away = String(row["Away Team"] || "").trim().toLowerCase();
      const home = String(row["Home Team"] || "").trim().toLowerCase();
      return normalizeDate(row["Game Date"]) === today && (away === name || home === name);
    }) || null;
  } catch (error) {
    console.error("Team schedule lookup failed:", error);
    return null;
  }
}

async function gameStatusMap(league) {
  if (GAME_STATUS_CACHE[league]) return GAME_STATUS_CACHE[league];
  const url = SCHEDULE_CSV[league];
  if (!url) return {};
  try {
    const response = await fetch(url);
    if (!response.ok) return {};
    const rows = parseCSV(await response.text());
    const statuses = {};
    const slate = new Set();
    rows.forEach((row) => {
      const id = String(row["Game Id"] || "").trim();
      const status = String(row.Status || "").trim();
      const teams = scheduleTeamKey(row["Away Team"], row["Home Team"]);
      if (id) {
        slate.add(id);
        if (status) statuses[id] = status;
      }
      if (teams) {
        slate.add(`teams:${teams}`);
        if (status) statuses[`teams:${teams}`] = status;
      }
    });
    GAME_STATUS_CACHE[league] = statuses;
    GAME_SLATE_CACHE[league] = slate;
    return statuses;
  } catch (error) {
    console.error("Game status lookup failed:", error);
    return {};
  }
}

async function finalGameIds(league) {
  const statuses = await gameStatusMap(league);
  return new Set(
    Object.entries(statuses)
      .filter(([, status]) => isClosedGameStatus(status))
      .map(([id]) => id)
  );
}

async function fetchLeagueGames(csvUrl) {
  if (DATA_CACHE.games[csvUrl]) return DATA_CACHE.games[csvUrl];

  const response = await fetch(csvUrl);
  if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.status}`);

  const text = await response.text();
  const rows = parseCSV(text);
  console.log("=== RAW CSV TEST ===");
  rows
    .slice(0, 3)
    .forEach((row) => {
      console.log(row["Game Date"]);
    });

  console.log("=== NORMALIZED ===");
  rows
    .slice(0, 3)
    .forEach((row) => {
      console.log(
        normalizeDate(row["Game Date"])
      );
    });
  const games = transformRowsToGames(rows);
  const today = getTodayDateString();
  console.log("CSV rows:", rows.length);
  console.log("Games built:", games.length);
  console.log("Today's date:", today);
  console.log("First game object:");
  console.log(games[0]);

  console.log("First 10 game dates:");
  games.slice(0,10).forEach(g => console.log(g.gameDate));
  const league = leagueFromOddsUrl(csvUrl);
  const statuses = league ? await gameStatusMap(league) : {};
  const todaysGames = league === "nfl"
    ? games.filter((game) => isOnScheduleSlate(league, game))
    : games.filter((game) => game.gameDate === today);
  todaysGames.forEach((game) => {
    game.scheduleStatus = lookupScheduleStatus(statuses, game);
  });
  todaysGames.sort((a, b) => (bestScoredRank(b)?.sportacularScore ?? -1) - (bestScoredRank(a)?.sportacularScore ?? -1));
  const finals = new Set(
    Object.entries(statuses)
      .filter(([, status]) => isClosedGameStatus(status))
      .map(([id]) => id)
  );
  const openGames = todaysGames.filter((game) => !game.gameId || !finals.has(String(game.gameId)));
  console.log("Today's games:", openGames.length);
  console.log(openGames);

  DATA_CACHE.games[csvUrl] = openGames;
  return openGames;
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

  console.log(
    "CSV Headers:",
    rows[0] ? Object.keys(rows[0]) : []
  );
  console.log(
    "First CSV Row:",
    rows[0] || null
  );

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

  const statuses = await gameStatusMap(league);
  const finals = new Set(
    Object.entries(statuses)
      .filter(([, status]) => isClosedGameStatus(status))
      .map(([id]) => id)
  );
  const todaysProps = props
    .filter((prop) => (league === "nfl" ? isOnScheduleSlate(league, prop) : prop.gameDate === today) && isPlayableSide(prop.bestSide))
    .filter((prop) => !prop.gameId || !finals.has(String(prop.gameId)))
    .map((prop) => ({ ...prop, scheduleStatus: lookupScheduleStatus(statuses, prop) }))
    .sort((a, b) => (b.sportacularScore ?? -1) - (a.sportacularScore ?? -1));

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

    case "score-desc":
      return sorted.sort((a, b) => (b.sportacularScore ?? -1) - (a.sportacularScore ?? -1));

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

      const linesFilter = ensureLinesFilter(pageKey, config.gameFilterId, renderPage);
      const selectedGame =
        document.getElementById(config.gameFilterId)?.value || "All";
      const selectedSportsbook =
        document.getElementById(config.sportsbookFilterId)?.value || "All";

      let filteredGames = games.filter((game) => matchesLinesFilter(game.scheduleStatus, linesFilter));

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

      const requestedTeam = new URLSearchParams(window.location.search).get("team");
      if (requestedTeam) {
        const teamName = requestedTeam.trim().toLowerCase();
        filteredGames = filteredGames.filter((game) =>
          game.awayTeam.toLowerCase() === teamName || game.homeTeam.toLowerCase() === teamName
        );
      }

      renderFilterSummary(config.summaryId, [
        { label: "Lines", value: linesFilter === "live" ? "Live lines" : linesFilter === "pregame" ? "Pregame lines" : "All" },
        { label: "Game", value: selectedGame },
        { label: "Team", value: requestedTeam || "All" },
        { label: "Sportsbook", value: selectedSportsbook },
        { label: "Tier", value: currentTier }
      ]);

      renderLeaderboard(config.leaderboardId, filteredGames, currentTier, config.emptyLabel.toLowerCase());

      setOddsFiltersDisabled(config, false);

      if (games.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No ${config.emptyLabel} games available today.</h3>
            <p>Check back later for upcoming game odds.</p>
          </div>
        `;
        return;
      }

      if (filteredGames.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No ${config.emptyLabel} odds found for this filter.</h3>
            <p>Try changing the game or sportsbook filters.</p>
          </div>
        `;
        return;
      }

      const groups = splitBalanced(filteredGames, filteredGames.length);
      container.innerHTML = [
        marketGroupHTML("Live", groups.live.map((game) => createBetCard(game, currentTier, config.emptyLabel.toLowerCase())).join("")),
        marketGroupHTML("Upcoming", groups.upcoming.map((game) => createBetCard(game, currentTier, config.emptyLabel.toLowerCase())).join(""))
      ].join("");
    };

    bindButton(config.resetButtonId, () => {
      resetSelectToAll(config.gameFilterId);
      resetSelectToAll(config.sportsbookFilterId);
      resetSelectToValue(`${pageKey}-lines-filter`, "both");
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

  /*
   * Resolve authentication and tier gating before attempting the
   * protected Player Props fetch.
   *
   * Logged-out users should see the Login Required state.
   * Authenticated Rookie/Veteran users should see the locked state.
   * All-Star+ users may continue to the protected fetch.
   */
  const initialTier =
    CURRENT_USER_TIER || "Rookie";

  const initialRules =
    TIER_RULES[initialTier] ||
    TIER_RULES.Rookie;

  if (!CURRENT_USER) {
    renderPropsLoginRequiredState(
      config,
      container
    );
    return;
  }

  if (!initialRules.showPlayerProps) {
    renderPropsLockedState(
      config,
      container,
      initialTier
    );
    return;
  }

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

      const linesFilter = ensureLinesFilter(pageKey, config.gameFilterId, renderPage);
      const selectedGame = document.getElementById(config.gameFilterId)?.value || "All";
      const selectedPropType = document.getElementById(config.propTypeFilterId)?.value || "All";
      const selectedSportsbook = document.getElementById(config.sportsbookFilterId)?.value || "All";
      const sortValue = document.getElementById(config.sortFilterId)?.value || "score-desc";

      let filteredProps = props.filter((prop) => matchesLinesFilter(prop.scheduleStatus, linesFilter));

      if (selectedGame !== "All") {
        filteredProps = filteredProps.filter((prop) => prop.gameLabel === selectedGame);
      }

      if (selectedPropType !== "All") {
        filteredProps = filteredProps.filter((prop) => prop.propType === selectedPropType);
      }

      if (selectedSportsbook !== "All") {
        filteredProps = filteredProps.filter((prop) => prop.vendor === selectedSportsbook);
      }

      const requestedTeam = new URLSearchParams(window.location.search).get("team");
      if (requestedTeam) {
        const teamName = requestedTeam.trim().toLowerCase();
        filteredProps = filteredProps.filter((prop) =>
          String(prop.awayTeam || "").toLowerCase() === teamName ||
          String(prop.homeTeam || "").toLowerCase() === teamName
        );
      }

      populatePlayerFilter(config.playerFilterId, filteredProps, renderPage);

      const requestedPlayer = new URLSearchParams(window.location.search).get("player");
      const playerSelect = document.getElementById(config.playerFilterId);
      if (requestedPlayer && playerSelect && (!playerSelect.value || playerSelect.value === "All")) {
        playerSelect.value = requestedPlayer;
      }

      const selectedPlayer = document.getElementById(config.playerFilterId)?.value || "All";

      if (selectedPlayer !== "All") {
        filteredProps = filteredProps.filter((prop) => getPropFullName(prop) === selectedPlayer);
      }

      filteredProps = sortProps(filteredProps, sortValue);

      renderFilterSummary(config.summaryId, [
        { label: "Lines", value: linesFilter === "live" ? "Live lines" : linesFilter === "pregame" ? "Pregame lines" : "All" },
        { label: "Game", value: selectedGame },
        { label: "Prop Type", value: selectedPropType !== "All" ? formatPropTypeLabel(selectedPropType) : "All" },
        { label: "Player", value: selectedPlayer },
        { label: "Sportsbook", value: selectedSportsbook },
        { label: "Sort", value: sortValue !== "score-desc" ? formatSortLabel(sortValue) : "All" },
        { label: "Tier", value: currentTier !== "Rookie" ? currentTier : "All" }
      ]);

      renderPropsLeaderboard(
        config.leaderboardId,
        filteredProps,
        Math.min(currentRules.showLeaderboardCount || 5, 10)
      );

      const propLimit = currentRules.maxPropsToShow;
      const groups = splitBalanced(filteredProps, propLimit);
      const visibleCount = groups.live.length + groups.upcoming.length;
      const hiddenPropsCount = Math.max(filteredProps.length - visibleCount, 0);

setPropsFiltersDisabled(config, !currentRules.showPlayerProps);

if (props.length === 0) {
  container.innerHTML = `
    <div class="empty-state">
      <h3>No ${config.emptyLabel} props available today.</h3>
      <p>Please check back once today’s player props are live.</p>
    </div>
  `;
  return;
}

if (visibleCount === 0) {
  container.innerHTML = `
    <div class="empty-state">
      <h3>No ${config.emptyLabel} props found for this filter.</h3>
      <p>Try changing the game, prop type, player, sportsbook, or sort settings.</p>
    </div>
  `;
  return;
}

container.innerHTML = `
  ${marketGroupHTML("Live", groups.live.map(createPropCard).join(""))}
  ${marketGroupHTML("Upcoming", groups.upcoming.map(createPropCard).join(""))}
  ${
    hiddenPropsCount > 0
      ? `
        <div class="locked-overlay">
          <h4>Unlock More Props</h4>
          <p>
            You’re viewing ${visibleCount} of ${filteredProps.length} props for this tier.
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
      resetSelectToValue(config.sortFilterId, "score-desc");
      resetSelectToValue(`${pageKey}-lines-filter`, "both");
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

function isPlayableSide(side) {
  const value = String(side || "").trim().toLowerCase();
  return value === "over" || value === "under";
}

function bestScoredRank(game) {
  const rankings = Array.isArray(game?.rankings) ? game.rankings : [];
  const plays = rankings.filter((item) => item.side && item.side !== "No Play" && Number.isFinite(item.sportacularScore));
  if (!plays.length) return null;
  return [...plays].sort((a, b) => (b.sportacularScore ?? -1) - (a.sportacularScore ?? -1))[0];
}

function topGameByScore(games) {
  const open = [...games].filter((game) => bestScoredRank(game));
  return open.sort((a, b) => bestScoredRank(b).sportacularScore - bestScoredRank(a).sportacularScore)[0];
}

function topPropByScore(props) {
  return [...props].sort((a, b) => {
    const scoreDiff = (Number.isFinite(b.sportacularScore) ? b.sportacularScore : -1) - (Number.isFinite(a.sportacularScore) ? a.sportacularScore : -1);
    if (scoreDiff !== 0) return scoreDiff;
    return (Number(b.ev) || 0) - (Number(a.ev) || 0);
  })[0];
}

function displayBook(vendor) {
  const value = String(vendor || "").trim();
  const names = {
    draftkings: "DraftKings",
    fanduel: "FanDuel",
    betmgm: "BetMGM",
    caesars: "Caesars",
    kalshi: "Kalshi",
    pointsbet: "PointsBet",
    betrivers: "BetRivers",
    espnbet: "ESPN BET"
  };
  return names[value.toLowerCase().replace(/[\s_-]/g, "")] || value || "—";
}

function homeStatus(status) {
  const value = String(status || "").trim();
  if (!value || isKickoffStatus(value)) return "Scheduled";
  return value;
}

function homePropTitle(league, prop) {
  const name = getPropFullName(prop);
  const label = formatPropTypeLabel(prop.propType);
  if (!prop.playerId) return `${name} — ${label}`;
  return `<a class="player-link" href="player.html?league=${encodeURIComponent(league)}&id=${encodeURIComponent(prop.playerId)}">${name}</a> — ${label}`;
}

function homeGameCard(league, game, bestRank) {
  return {
    title: matchupLinks(league, game.awayTeam, game.homeTeam),
    book: game.vendor,
    date: game.gameDate,
    status: game.scheduleStatus,
    score: bestRank?.sportacularScore,
    ev: bestRank?.ev,
    bet: bestRank?.bet || "—"
  };
}

function homePropCard(league, prop) {
  return {
    title: homePropTitle(league, prop),
    book: prop.vendor,
    date: prop.gameDate,
    status: prop.scheduleStatus,
    score: prop.sportacularScore,
    ev: prop.ev,
    bet: `${prop.betType || ""} ${formatLineValue(prop.lineValue)}`.trim()
  };
}

function homeStatTable(rows, ev) {
  return `
    <div class="home-stat-table">
      ${rows.map(([label, value]) => `
        <div class="home-stat">
          <span>${label}</span>
          <strong class="${label === "EV" ? getEVClass(ev) : ""}">${value}</strong>
        </div>
      `).join("")}
    </div>
  `;
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
      ${homeStatTable([
        ["Book", displayBook(data.book)],
        ["Date", data.date || "Today"],
        ["Status", homeStatus(data.status)],
        ["Score", formatSportacularScore(data.score)],
        ["EV", formatEV(data.ev)],
        ["Bet", data.bet || "—"]
      ], data.ev)}
    </div>
  `;
}

function renderHomeTopBetLockedState(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const league =
    containerId.match(/^home-top-(nba|nhl|mlb|nfl)-bet$/i)?.[1]?.toUpperCase() || "";

  container.innerHTML = `
    <div class="props-locked-box">
      <h3>🔒 Premium Top Bet</h3>
      <p>Unlock with <strong>Hall-of-Famer</strong> or <strong>Legend</strong>.</p>
      <div style="margin-top: 12px;">
        <a
          href="pricing.html"
          class="btn btn-primary"
          data-upgrade-analytics="true"
          data-upgrade-feature="top_bet"
          data-upgrade-league="${league}"
          data-upgrade-required-tier="Hall-of-Famer"
        >Compare Plans</a>
      </div>
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
    /*
     * Resolve the current authenticated tier before applying
     * homepage Top Bet visibility rules.
     *
     * index.html calls renderHomeSpotlights() immediately after
     * script.js loads, so CURRENT_USER_TIER may still contain its
     * default value until the Supabase session/profile has finished
     * loading.
     */
    await updateSessionStatus();

    const currentTier =
      CURRENT_USER_TIER || "Rookie";

    const currentRules =
      TIER_RULES[currentTier] ||
      TIER_RULES.Rookie;

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

      fetchHomepageProps("nba").catch(() => []),
      fetchHomepageProps("nhl").catch(() => []),
      fetchHomepageProps("mlb").catch(() => []),
      fetchHomepageProps("nfl").catch(() => [])
    ]);

    const topNBAGame = topGameByScore(nbaGames);
    const topNHLGame = topGameByScore(nhlGames);
    const topMLBGame = topGameByScore(mlbGames);
    const topNFLGame = topGameByScore(nflGames);

    const topNBAProp = topPropByScore(nbaProps);
    const topNHLProp = topPropByScore(nhlProps);
    const topMLBProp = topPropByScore(mlbProps);
    const topNFLProp = topPropByScore(nflProps);

    if (currentRules.showTopBet && topNBAGame) {
      const bestRank = [...topNBAGame.rankings]
        .sort((a, b) => (b.sportacularScore ?? -1) - (a.sportacularScore ?? -1))[0];

      renderHomeSpotlightCard(
        "home-top-nba-bet",
        homeGameCard("nba", topNBAGame, bestRank)
      );
    } else {
      renderHomeTopBetLockedState(
        "home-top-nba-bet"
      );
    }

    if (topNBAProp) {
      renderHomeSpotlightCard(
        "home-top-nba-prop",
        homePropCard("nba", topNBAProp)
      );
    } else {
      renderHomeSpotlightCard(
        "home-top-nba-prop",
        null
      );
    }

    if (currentRules.showTopBet && topNHLGame) {
      const bestRank = [...topNHLGame.rankings]
        .sort((a, b) => (b.sportacularScore ?? -1) - (a.sportacularScore ?? -1))[0];

      renderHomeSpotlightCard(
        "home-top-nhl-bet",
        homeGameCard("nhl", topNHLGame, bestRank)
      );
    } else {
      renderHomeTopBetLockedState(
        "home-top-nhl-bet"
      );
    }

    if (topNHLProp) {
      renderHomeSpotlightCard(
        "home-top-nhl-prop",
        homePropCard("nhl", topNHLProp)
      );
    } else {
      renderHomeSpotlightCard(
        "home-top-nhl-prop",
        null
      );
    }

    if (currentRules.showTopBet && topMLBGame) {
      const bestRank = [...topMLBGame.rankings]
        .sort((a, b) => (b.sportacularScore ?? -1) - (a.sportacularScore ?? -1))[0];

      renderHomeSpotlightCard(
        "home-top-mlb-bet",
        homeGameCard("mlb", topMLBGame, bestRank)
      );
    } else {
      renderHomeTopBetLockedState(
        "home-top-mlb-bet"
      );
    }

    if (topMLBProp) {
      renderHomeSpotlightCard(
        "home-top-mlb-prop",
        homePropCard("mlb", topMLBProp)
      );
    } else {
      renderHomeSpotlightCard(
        "home-top-mlb-prop",
        null
      );
    }

    if (currentRules.showTopBet && topNFLGame) {
      const bestRank = [...topNFLGame.rankings]
        .sort((a, b) => (b.sportacularScore ?? -1) - (a.sportacularScore ?? -1))[0];

      renderHomeSpotlightCard(
        "home-top-nfl-bet",
        homeGameCard("nfl", topNFLGame, bestRank)
      );
    } else {
      renderHomeTopBetLockedState(
        "home-top-nfl-bet"
      );
    }

    if (topNFLProp) {
      renderHomeSpotlightCard(
        "home-top-nfl-prop",
        homePropCard("nfl", topNFLProp)
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

async function renderHomeTopGames() {
  const container = document.getElementById("home-top-games");
  if (!container) return;

  try {
    const groups = await Promise.all([
      fetchLeagueGames(NBA_CSV_URL).then((games) => games.map((game) => ({ ...game, league: "nba" }))).catch(() => []),
      fetchLeagueGames(NHL_CSV_URL).then((games) => games.map((game) => ({ ...game, league: "nhl" }))).catch(() => []),
      fetchLeagueGames(MLB_CSV_URL).then((games) => games.map((game) => ({ ...game, league: "mlb" }))).catch(() => []),
      fetchLeagueGames(NFL_CSV_URL).then((games) => games.map((game) => ({ ...game, league: "nfl" }))).catch(() => [])
    ]);
    const rankedGames = groups.flat()
      .map((game) => ({ game, rank: bestScoredRank(game), scheduleStatus: game.scheduleStatus }))
      .filter((item) => item.rank)
      .sort((a, b) => (b.rank.sportacularScore ?? -1) - (a.rank.sportacularScore ?? -1));
    const balancedGames = splitBalanced(rankedGames, 5);
    const games = [...balancedGames.live, ...balancedGames.upcoming];

    if (!games.length) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No games available right now.</h3>
          <p>Please check back once today’s games are live.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = [
      marketGroupHTML("Live", balancedGames.live.map(({ game, rank }, index) => `
      <article class="home-top-card">
        <div class="home-spotlight-title">#${index + 1} ${matchupLinks(game.league, game.awayTeam, game.homeTeam)}</div>
        ${homeStatTable([
          ["League", String(game.league || "").toUpperCase()],
          ["Book", displayBook(game.vendor)],
          ["Status", homeStatus(game.scheduleStatus)],
          ["Score", formatSportacularScore(rank.sportacularScore)],
          ["EV", formatEV(rank.ev)],
          ["Bet", rank.bet || "—"]
        ], rank.ev)}
      </article>
    `).join("")),
      marketGroupHTML("Upcoming", balancedGames.upcoming.map(({ game, rank }, index) => `
      <article class="home-top-card">
        <div class="home-spotlight-title">#${index + 1} ${matchupLinks(game.league, game.awayTeam, game.homeTeam)}</div>
        ${homeStatTable([
          ["League", String(game.league || "").toUpperCase()],
          ["Book", displayBook(game.vendor)],
          ["Status", homeStatus(game.scheduleStatus)],
          ["Score", formatSportacularScore(rank.sportacularScore)],
          ["EV", formatEV(rank.ev)],
          ["Bet", rank.bet || "—"]
        ], rank.ev)}
      </article>
    `).join(""))
    ].join("");
  } catch (error) {
    console.error("Home top games render error:", error);
    container.innerHTML = `
      <div class="empty-state">
        <h3>Unable to load top games right now.</h3>
        <p>Please try again later.</p>
      </div>
    `;
  }
}

async function renderHomeTopProps() {
  const container = document.getElementById("home-top-props");
  if (!container) return;

  try {
    /*
     * Resolve the authenticated tier before rendering homepage
     * prop-preview messaging. The homepage invokes this function
     * before the Supabase session/profile may have finished loading.
     */
    await updateSessionStatus();

    const currentTier = CURRENT_USER_TIER || "Rookie";
    const [
  nbaProps,
  nhlProps,
  mlbProps,
  nflProps
] = await Promise.all([
  fetchHomepageProps("nba").catch(() => []),
  fetchHomepageProps("nhl").catch(() => []),
  fetchHomepageProps("mlb").catch(() => []),
  fetchHomepageProps("nfl").catch(() => [])
]);

const allProps = [
  ...nbaProps,
  ...nhlProps,
  ...mlbProps,
  ...nflProps
].sort((a, b) => {
  const scoreDiff = (Number.isFinite(b.sportacularScore) ? b.sportacularScore : -1) - (Number.isFinite(a.sportacularScore) ? a.sportacularScore : -1);
  if (scoreDiff !== 0) return scoreDiff;
  return (Number(b.ev) || 0) - (Number(a.ev) || 0);
});

    const propGroups = splitBalanced(allProps, 5);
    const visibleProps = [...propGroups.live, ...propGroups.upcoming];

    const hasFullPropsAccess =
      currentTier === "All-Star" ||
      currentTier === "Hall-of-Famer" ||
      currentTier === "Legend";

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

    container.innerHTML = [
      marketGroupHTML("Live", propGroups.live.map((prop, index) => {
          const fullName = getPropFullName(prop);
          const isLockedPreview = index >= 3 && !hasFullPropsAccess;
          return `
            <article class="home-top-card ${isLockedPreview ? "blurred" : ""}">
              <div class="home-spotlight-title">#${index + 1} ${
                prop.playerId && prop.league
                  ? `<a class="player-link" href="player.html?league=${encodeURIComponent(prop.league)}&id=${encodeURIComponent(prop.playerId)}">${fullName}</a>`
                  : fullName
              } — ${formatPropTypeLabel(prop.propType)}</div>
              ${homeStatTable([
                ["League", String(prop.league || "").toUpperCase()],
                ["Book", displayBook(prop.vendor)],
                ["Matchup", prop.awayTeam && prop.homeTeam ? matchupLinks(prop.league, prop.awayTeam, prop.homeTeam) : "—"],
                ["Status", homeStatus(prop.scheduleStatus)],
                ["Score", formatSportacularScore(prop.sportacularScore)],
                ["EV", formatEV(prop.ev)],
                ["Bet", `${prop.betType || ""} ${formatLineValue(prop.lineValue)}`.trim()]
              ], prop.ev)}
              ${isLockedPreview ? `<div class="prop-upgrade-hint">Unlock the full prop board with All-Star</div>` : ""}
            </article>
          `;
        }).join("")),
      marketGroupHTML("Upcoming", propGroups.upcoming.map((prop, index) => {
          const fullName = getPropFullName(prop);
          const isLockedPreview = (propGroups.live.length + index) >= 3 && !hasFullPropsAccess;
          return `
            <article class="home-top-card ${isLockedPreview ? "blurred" : ""}">
              <div class="home-spotlight-title">#${index + 1} ${
                prop.playerId && prop.league
                  ? `<a class="player-link" href="player.html?league=${encodeURIComponent(prop.league)}&id=${encodeURIComponent(prop.playerId)}">${fullName}</a>`
                  : fullName
              } — ${formatPropTypeLabel(prop.propType)}</div>
              ${homeStatTable([
                ["League", String(prop.league || "").toUpperCase()],
                ["Book", displayBook(prop.vendor)],
                ["Matchup", prop.awayTeam && prop.homeTeam ? matchupLinks(prop.league, prop.awayTeam, prop.homeTeam) : "—"],
                ["Status", homeStatus(prop.scheduleStatus)],
                ["Score", formatSportacularScore(prop.sportacularScore)],
                ["EV", formatEV(prop.ev)],
                ["Bet", `${prop.betType || ""} ${formatLineValue(prop.lineValue)}`.trim()]
              ], prop.ev)}
              ${isLockedPreview ? `<div class="prop-upgrade-hint">Unlock the full prop board with All-Star</div>` : ""}
            </article>
          `;
        }).join(""))
    ].join("") +
      (hasFullPropsAccess
        ? ""
        : `
        <div class="upgrade-cta-box">
          <h3>Unlock the Full Prop Board</h3>
          <p>Upgrade to All-Star or higher for the full board, advanced filters, and deeper prop analytics.</p>
          <a
            href="pricing.html"
            class="btn btn-primary"
            data-upgrade-analytics="true"
            data-upgrade-feature="full_prop_board"
            data-upgrade-required-tier="All-Star"
          >Compare Plans</a>
        </div>
      `);

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

const PUBLIC_PROPS_CSV = {
  nba: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=590324617&single=true&output=csv",
  nhl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYTgu9bsGUhI1gicOOfLrgYHmNMfrl3W1OKhAVs9cdrdd2CagJZSVM3F25hQ8vk0aRK7hapVmbNWQP/pub?gid=1839953184&single=true&output=csv",
  mlb: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=1502960090&single=true&output=csv",
  nfl: NFL_PROPS_SHEET_URL
};

function getPhoenixDateString() {
  return getTodayDateString();
}

async function fetchHomepageProps(league) {
  const cacheKey = `homepage-props-${league}`;
  if (DATA_CACHE.props[cacheKey]) return DATA_CACHE.props[cacheKey];

  const response = await fetch(PUBLIC_PROPS_CSV[league]);
  if (!response.ok) throw new Error(`Failed to fetch ${league} props: ${response.status}`);

  const rows = parseCSV(await response.text());
  const props = league === "nfl" ? buildNFLPropsFromRows(rows) : buildPropsFromRows(rows, league);
  const today = getPhoenixDateString();
  const statuses = await gameStatusMap(league);
  const finals = new Set(
    Object.entries(statuses)
      .filter(([, status]) => isClosedGameStatus(status))
      .map(([id]) => id)
  );
  const todaysProps = props
    .filter((prop) => (league === "nfl" ? isOnScheduleSlate(league, prop) : prop.gameDate === today) && isPlayableSide(prop.bestSide))
    .filter((prop) => !prop.gameId || !finals.has(String(prop.gameId)))
    .map((prop) => ({ ...prop, scheduleStatus: lookupScheduleStatus(statuses, prop) }));
  DATA_CACHE.props[cacheKey] = todaysProps;
  return todaysProps;
}

async function updateSessionStatus() {
  const statusEl = document.getElementById("session-status");
  const tierEl = document.getElementById("tier-status");
  const tierGuidanceEl = document.getElementById("tier-guidance");
  const manageSubscriptionBtn =
    document.getElementById("manage-subscription-btn");
  const logoutBtn = document.getElementById("logout-btn");

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
    if (tierGuidanceEl) tierGuidanceEl.textContent = "";
    if (manageSubscriptionBtn) {
      manageSubscriptionBtn.style.display = "none";
    }
    if (logoutBtn) {
      logoutBtn.style.display = "none";
    }
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

    if (tierGuidanceEl) {
      tierGuidanceEl.textContent =
        CURRENT_USER_TIER === "Rookie"
          ? "Your Rookie access includes daily Game Odds. Upgrade when you’re ready for deeper analytics."
          : "";
    }

    const paidTiers = [
      "Veteran",
      "All-Star",
      "Hall-of-Famer",
      "Legend"
    ];

    if (manageSubscriptionBtn) {
      manageSubscriptionBtn.style.display =
        paidTiers.includes(CURRENT_USER_TIER) ? "" : "none";
    }

    if (logoutBtn) {
      logoutBtn.style.display = "";
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
    if (tierGuidanceEl) tierGuidanceEl.textContent = "";
    if (manageSubscriptionBtn) {
      manageSubscriptionBtn.style.display = "none";
    }

    if (logoutBtn) {
      logoutBtn.style.display = "none";
    }
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
  const manageSubscriptionBtn =
    document.getElementById("manage-subscription-btn");
  const resetRequestForm = document.getElementById("reset-request-form");
  const resetUpdateForm = document.getElementById("reset-update-form");

  const signupMessage = document.getElementById("signup-message");
  const loginMessage = document.getElementById("login-message");
  const manageSubscriptionMessage =
    document.getElementById("manage-subscription-message");
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
        signupMessage.textContent = "Account created successfully. Check your email if confirmation is required, then log in to start with your Rookie access.";

        if (typeof plausible === "function") {
          plausible("Signup Completed", {
            props: {
              method: "email"
            }
          });
        }
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

        if (typeof plausible === "function") {
          plausible("Login Completed", {
            props: {
              method: "email"
            }
          });
        }

        if (loginView) loginView.style.display = "none";
        if (signupView) signupView.style.display = "none";
        if (resetRequestView) resetRequestView.style.display = "none";
        if (resetUpdateView) resetUpdateView.style.display = "none";
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

      const redirectTo = `https://sportacularanalytics.com/auth.html?view=update-password`;

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

  if (manageSubscriptionBtn) {
    manageSubscriptionBtn.addEventListener("click", async () => {
      manageSubscriptionBtn.disabled = true;

      if (manageSubscriptionMessage) {
        manageSubscriptionMessage.textContent =
          "Opening billing portal...";
      }

      try {
        let {
          data: sessionData,
          error: sessionError
        } = await supabaseClient.auth.getSession();

        if (sessionError || !sessionData?.session?.access_token) {
          throw new Error(
            "Please log in again before managing your subscription."
          );
        }

        let accessToken =
          sessionData.session.access_token;

        let response = await fetch(
          "/.netlify/functions/stripe-customer-portal",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        );

        if (response.status === 401) {
          const {
            data: refreshedData,
            error: refreshError
          } = await supabaseClient.auth.refreshSession();

          const refreshedToken =
            refreshedData?.session?.access_token || "";

          if (!refreshError && refreshedToken) {
            accessToken = refreshedToken;

            response = await fetch(
              "/.netlify/functions/stripe-customer-portal",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`
                }
              }
            );
          }
        }

        let payload = null;

        try {
          payload = await response.json();
        } catch (jsonError) {
          payload = null;
        }

        if (!response.ok) {
          throw new Error(
            payload?.error ||
            "Unable to open billing portal."
          );
        }

        if (
          !payload?.url ||
          !payload.url.startsWith("https://billing.stripe.com/")
        ) {
          throw new Error(
            "Billing portal returned an invalid redirect."
          );
        }

        if (typeof plausible === "function") {
          plausible("Billing Portal Opened");
        }

        window.location.href = payload.url;
      } catch (error) {
        if (manageSubscriptionMessage) {
          manageSubscriptionMessage.textContent =
            error?.message ||
            "Unable to open billing portal.";
        }

        manageSubscriptionBtn.disabled = false;
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
        <a
          href="pricing.html"
          class="btn btn-primary"
          data-upgrade-analytics="true"
          data-upgrade-feature="player_props"
          data-upgrade-league="${config.emptyLabel}"
          data-upgrade-required-tier="All-Star"
        >View Plans</a>
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
        <a
          href="pricing.html"
          class="btn btn-primary"
          data-upgrade-analytics="true"
          data-upgrade-feature="player_props"
          data-upgrade-league="${config.emptyLabel}"
          data-upgrade-required-tier="All-Star"
        >View Plans</a>
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


function playerProfileLink(league, row) {
  const id = String(row["Player ID"] || row["Player Id"] || "").trim();
  const name = row["Player Name"] || "Unknown Player";
  if (!id) return name;
  return `<a class="player-link" href="player.html?league=${encodeURIComponent(league)}&id=${encodeURIComponent(id)}">${name}</a>`;
}

function teamProfileLink(league, name) {
  const team = name || "Unknown Team";
  if (!team || team === "Unknown Team") return team;
  return `<a class="player-link" href="${league}-team.html?league=${encodeURIComponent(league)}&team=${encodeURIComponent(team)}">${team}</a>`;
}

function matchupLinks(league, away, home, fallback = "") {
  if (!away || !home) return fallback;
  return `${teamProfileLink(league, away)} at ${teamProfileLink(league, home)}`;
}

function formatNBATrendLabel(statKey) {
  return statKey || "Trend";
}


function profileSummaryTable(rows) {
  const body = rows.map(([label, value]) => {
    const shown = value === undefined || value === null || String(value).trim() === "" ? "—" : value;
    return `<tr><th scope="row">${label}</th><td>${shown}</td></tr>`;
  }).join("");
  return `<div class="odds-table-wrap"><table class="odds-table odds-summary-table"><tbody>${body}</tbody></table></div>`;
}

function bindProfileGuide(root) {
  if (!root) return;
  root.querySelectorAll(".hover-guide-term").forEach((term) => {
    term.addEventListener("click", (event) => {
      event.preventDefault();
      const item = term.closest(".hover-guide-item");
      if (!item) return;
      const open = item.classList.contains("tooltip-open");
      root.querySelectorAll(".hover-guide-item.tooltip-open").forEach((el) => el.classList.remove("tooltip-open"));
      if (!open) item.classList.add("tooltip-open");
    });
  });
}

function guideItem(term, body) {
  return `<div class="hover-guide-item"><span class="hover-guide-term">${term}</span><div class="hover-guide-tooltip"><strong>${term}</strong><br>${body}</div></div>`;
}

function renderTeamProfileGuide(league) {
  const slot = document.getElementById("team-profile-guide");
  if (!slot || slot.dataset.ready === "1") return;
  const ratingName = league === "mlb" ? "Pitching Rating" : "Defensive Rating";
  const notes = league === "mlb"
    ? "Balanced team profile., Offense carrying the team., or a pitching note."
    : "Balanced team profile., Offense carrying the team., or Defense carrying the team.";
  slot.dataset.ready = "1";
  slot.innerHTML = `<div class="guide-panel profile-guide">
    <h3 class="guide-panel-title">How to Read This Team Profile</h3>
    <p class="guide-panel-text">Hover over any term below for a quick explanation in plain English.</p>
    <div class="guide-panel-links">
      ${guideItem("League Rank", "The League Rank row in the ratings table. The page can say a place such as #4, or --.")}
      ${guideItem("Rank Score", "The Rank Score row. A 0 to 100 number for where the team sits in the league, or --.")}
      ${guideItem("Ratings", `The ratings table. Overall Rating and Offensive Rating are numbers. ${ratingName} is a number. A missing rating says --.`)}
      ${guideItem("Rating Tier", "The Rating Tier row. The page can say Elite, Strong, Average, Below Average, Weak, or --.")}
      ${guideItem("Rating Notes", `The Rating Notes row. The page can say ${notes}`)}
      ${guideItem("Season Snapshot", "The season table under the ratings. This team is what the team produced. Opponents is what the other team did in those same games. Use the View menu for Season totals or Per game. Open either section to see its table. A missing number says --.")}
      ${guideItem("Strength", "The Strength row on a trend card. The page can say Elite Trend, Strong Trend, Moderate Trend, Weak Trend, Cold Trend, or Unknown.")}
      ${guideItem("Direction", "The Direction row on a trend card. The page can say Up, Down, or Flat.")}
      ${guideItem("Trend Score", "The Trend Score row. The page can say a plus number such as +12.4 or a minus number such as -8.1.")}
      ${guideItem("Above Season", "The Above Season row. The page can say a plus percent such as +18.2% or a minus percent such as -6.4%.")}
      ${guideItem("Confidence", "The Confidence row on a trend card. A number from 0 to 100. It does not say Elite or Lean.")}
      ${guideItem("Risk", "The Risk row on a trend card. The page can say Low, Medium, or High.")}
      ${guideItem("Window", "The first column of the trend table. The page can say Last 3, Last 5, Last 10, or Season. The Season hit-rate cell says —.")}
      ${guideItem("Hit Rate", "The Hit Rate column. The page can say a percent such as 70%, or —.")}
    </div>
  </div>`;
  bindProfileGuide(slot);
}

function trendSummaryRow(label, value) {
  if (value === undefined || value === null || String(value).trim() === "") return "";
  return `<tr><th scope="row">${label}</th><td>${value}</td></tr>`;
}

function formatTrendAvg(value) {
  if (value === undefined || value === null || String(value).trim() === "") return "";
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : "N/A";
}

function formatTrendHit(value) {
  if (value === undefined || value === null || String(value).trim() === "") return "";
  const number = readTrendRate(value);
  return Number.isFinite(number) ? `${Math.round(number * 100)}%` : "N/A";
}

function formatAboveSeason(value) {
  if (value === undefined || value === null || String(value).trim() === "") return "";
  const number = Number(value);
  if (!Number.isFinite(number)) return "N/A";
  return `${number >= 0 ? "+" : ""}${number.toFixed(1)}%`;
}

function trendSummaryTable(row) {
  const scoreRaw = row["Trend Score"];
  const score = scoreRaw === undefined || String(scoreRaw).trim() === "" ? "" : formatTrendScore(scoreRaw);
  return `
    <table class="odds-table odds-summary-table">
      <tbody>
        ${trendSummaryRow("Strength", row["Trend Strength"])}
        ${trendSummaryRow("Direction", row["Trend Direction"])}
        ${trendSummaryRow("Trend Score", score)}
        ${trendSummaryRow("Above Season", formatAboveSeason(row["Above Season %"]))}
        ${trendSummaryRow("Confidence", row["Confidence Score"])}
        ${trendSummaryRow("Risk", row["Risk Tier"])}
      </tbody>
    </table>
  `;
}

function trendWindowTable(row) {
  const windows = [
    ["Last 3", "Last 3 Avg", "Hit Rate Last 3"],
    ["Last 5", "Last 5 Avg", "Hit Rate Last 5"],
    ["Last 10", "Last 10 Avg", "Hit Rate Last 10"]
  ];
  const body = [];
  windows.forEach(([label, avgKey, hitKey]) => {
    const avg = formatTrendAvg(row[avgKey]);
    const hit = formatTrendHit(row[hitKey]);
    if (!avg && !hit) return;
    body.push(`<tr><td>${label}</td><td>${avg || "—"}</td><td>${hit || "—"}</td></tr>`);
  });
  const season = formatTrendAvg(row["Season Avg"]);
  if (season) body.push(`<tr><td>Season</td><td>${season}</td><td>—</td></tr>`);
  if (!body.length) return "";
  return `
    <div class="odds-table-wrap">
      <table class="odds-table">
        <thead>
          <tr><th>Window</th><th>Average</th><th>Hit Rate</th></tr>
        </thead>
        <tbody>${body.join("")}</tbody>
      </table>
    </div>
  `;
}

function teamRatingTable(row, columns) {
  if (!columns.some(([, key]) => String(row[key] || "").trim())) return "";
  return `
    <div class="odds-table-wrap">
      <table class="odds-table">
        <thead>
          <tr>${columns.map(([label]) => `<th>${label}</th>`).join("")}</tr>
        </thead>
        <tbody>
          <tr>${columns.map(([, key]) => `<td>${row[key] || "N/A"}</td>`).join("")}</tr>
        </tbody>
      </table>
    </div>
  `;
}

function trendCardShell(titleHtml, subtitle, row, extraHtml = "") {
  const note = String(row["Trend Note"] || "").trim();
  return `
    <div class="trend-card">
      <div class="trend-card-header">
        <div class="trend-title">
          <h3>${titleHtml}</h3>
          <div class="trend-subtitle">${subtitle}</div>
        </div>
        <div class="bet-card-analytics">
          ${trendSummaryTable(row)}
        </div>
      </div>
      ${trendWindowTable(row)}
      ${extraHtml || ""}
      ${note ? `<div class="trend-note">${note}</div>` : ""}
    </div>
  `;
}

function createNBATrendCard(player) {
  return trendCardShell(
    playerProfileLink("nba", player),
    `${player["Team"] || "N/A"} • ${player["Stat Type"] || "Trend"}${tonightStatus(player["Team"])}`,
    player
  );
}

async function renderNBATrends() {
  await loadTonightStatuses("nba");
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

      if (rows.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No NBA player trends available right now.</h3>
            <p>Please check back once NBA trend data is available.</p>
          </div>
        `;
        return;
      }

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
        const aVal = Number(a["Trend Score"]);
        const bVal = Number(b["Trend Score"]);
        return selectedSort === "asc" ? aVal - bVal : bVal - aVal;
      });

      renderFilterSummary("nba-trends-filter-summary", [
        { label: "Trend", value: formatNBATrendLabel(selectedStat) },
        { label: "Player", value: selectedPlayer },
        { label: "Sort", value: selectedSort === "asc" ? "Weakest Trend First" : "Strongest Trend First" },
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
  return trendCardShell(
    teamProfileLink("nba", teamRow["Team"]),
    `${teamRow["Metric"] || "Trend"}${tonightStatus(teamRow["Team"])}`,
    teamRow,
    teamRatingTable(teamRow, [
      ["Offense", "Offensive Rating"],
      ["Defense", "Defensive Rating"],
      ["Overall", "Overall Rating"],
      ["Tier", "Rating Tier"],
      ["League Rank", "League Rank"]
    ])
  );
}

async function renderNBATeamTrends() {
  await loadTonightStatuses("nba");
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

      if (rows.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No NBA team trends available right now.</h3>
            <p>Please check back once NBA team trend data is available.</p>
          </div>
        `;
        return;
      }

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
        const aVal = Number(a["Trend Score"]);
        const bVal = Number(b["Trend Score"]);
        return selectedSort === "asc" ? aVal - bVal : bVal - aVal;
      });

      renderFilterSummary("nba-team-trends-filter-summary", [
        { label: "Team", value: selectedTeam },
        { label: "Trend", value: formatNBATeamTrendLabel(selectedStat) },
        { label: "Sort", value: selectedSort === "asc" ? "Weakest Trend First" : "Strongest Trend First" },
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
  return trendCardShell(
    playerProfileLink("nhl", player),
    `${player["Team"] || "N/A"} • ${player["Stat Type"] || "Trend"}${tonightStatus(player["Team"])}`,
    player
  );
}

async function renderNHLTrends() {
  await loadTonightStatuses("nhl");
  const container = document.getElementById("nhl-trends-container");
  if (!container) return;

  updateTierDisplay("nhl-tier-display");

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

      if (rows.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No NHL player trends available right now.</h3>
            <p>Please check back once NHL trend data is available.</p>
          </div>
        `;
        return;
      }

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
        const aVal = Number(a["Trend Score"]);
        const bVal = Number(b["Trend Score"]);
        return selectedSort === "asc" ? aVal - bVal : bVal - aVal;
      });

      renderFilterSummary("nhl-trends-filter-summary", [
        { label: "Trend", value: formatNHLTrendLabel(selectedStat) },
        { label: "Player", value: selectedPlayer },
        { label: "Sort", value: selectedSort === "asc" ? "Weakest Trend First" : "Strongest Trend First" },
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
  return trendCardShell(
    teamProfileLink("nhl", teamRow["Team"]),
    `${teamRow["Metric"] || "Trend"}${tonightStatus(teamRow["Team"])}`,
    teamRow,
    teamRatingTable(teamRow, [
      ["Offense", "Offensive Rating"],
      ["Defense", "Defensive Rating"],
      ["Overall", "Overall Rating"],
      ["Tier", "Rating Tier"],
      ["League Rank", "League Rank"]
    ])
  );
}

async function renderNHLTeamTrends() {
  await loadTonightStatuses("nhl");
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

      if (rows.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No NHL team trends available right now.</h3>
            <p>Please check back once NHL team trend data is available.</p>
          </div>
        `;
        return;
      }

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
        const aVal = Number(a["Trend Score"]);
        const bVal = Number(b["Trend Score"]);
        return selectedSort === "asc" ? aVal - bVal : bVal - aVal;
      });

      renderFilterSummary("nhl-team-trends-filter-summary", [
        { label: "Team", value: selectedTeam },
        { label: "Trend", value: formatNHLTeamTrendLabel(selectedStat) },
        { label: "Sort", value: selectedSort === "asc" ? "Weakest Trend First" : "Strongest Trend First" },
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
  return trendCardShell(
    playerProfileLink("mlb", player),
    `${player["Team"] || "N/A"} • ${player["Stat Type"] || "Trend"}${tonightStatus(player["Team"])}`,
    player
  );
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
        <a
          href="pricing.html"
          class="btn btn-primary"
          data-upgrade-analytics="true"
          data-upgrade-feature="${leagueLabel.includes("Team") ? "team_trends" : "player_trends"}"
          data-upgrade-league="${leagueLabel.split(" ")[0]}"
          data-upgrade-required-tier="${requiredTier}"
        >View Plans</a>
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
  await loadTonightStatuses("mlb");
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

    container.innerHTML = topRows.map((row) => trendCardShell(
      `#${row["Rank"] || ""} ${playerProfileLink("mlb", row)}`,
      `${row["Team"] || "N/A"} • ${row["Stat Type"] || "Trend"}${tonightStatus(row["Team"])}`,
      row
    )).join("");
  } catch (error) {
    console.error("Top MLB player trends error:", error);
    container.innerHTML = "";
  }
}

async function renderMLBTopTeamTrends() {
  await loadTonightStatuses("mlb");
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

    container.innerHTML = topRows.map((row) => trendCardShell(
      `#${row["Rank"] || ""} ${teamProfileLink("mlb", row["Team"])}`,
      `${row["Metric"] || "Trend"}${tonightStatus(row["Team"])}`,
      row
    )).join("");
  } catch (error) {
    console.error("Top MLB team trends error:", error);
    container.innerHTML = "";
  }
}

function formatMLBTeamTrendLabel(statKey) {
  return statKey || "Trend";
}

function createMLBTeamTrendCard(teamRow) {
  return trendCardShell(
    teamProfileLink("mlb", teamRow["Team"]),
    `${teamRow["Metric"] || "Trend"}${tonightStatus(teamRow["Team"])}`,
    teamRow,
    teamRatingTable(teamRow, [
      ["Offense", "Offensive Rating"],
      ["Pitching", "Pitching Rating"],
      ["Overall", "Overall Rating"],
      ["Tier", "Rating Tier"],
      ["League Rank", "League Rank"]
    ])
  );
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
  await loadTonightStatuses("mlb");
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

      if (rows.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No MLB team trends available right now.</h3>
            <p>Please check back once MLB team trend data is available.</p>
          </div>
        `;
        return;
      }

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
        const aVal = Number(a["Trend Score"]);
        const bVal = Number(b["Trend Score"]);
        return selectedSort === "asc" ? aVal - bVal : bVal - aVal;
      });

      renderFilterSummary("mlb-team-trends-filter-summary", [
        { label: "Team", value: selectedTeam },
        { label: "Trend", value: formatMLBTeamTrendLabel(selectedStat) },
        { label: "Sort", value: selectedSort === "asc" ? "Weakest Trend First" : "Strongest Trend First" },
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

async function initMLBTeamTrendsPage() {
  await updateSessionStatus();

  await Promise.all([
    renderMLBTeamTrends(),
    renderMLBTopTeamTrends()
  ]);
}

async function renderMLBTrends() {
  await loadTonightStatuses("mlb");
  const container = document.getElementById("mlb-trends-container");
  if (!container) return;

  updateTierDisplay("mlb-tier-display");

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

      if (rows.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No MLB player trends available right now.</h3>
            <p>Please check back once MLB trend data is available.</p>
          </div>
        `;
        return;
      }

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
        const aVal = Number(a["Trend Score"]);
        const bVal = Number(b["Trend Score"]);
        return selectedSort === "asc" ? aVal - bVal : bVal - aVal;
      });

      renderFilterSummary("mlb-trends-filter-summary", [
        { label: "Trend", value: formatTrendLabel(selectedStat) },
        { label: "Player", value: selectedPlayer },
        { label: "Sort", value: selectedSort === "asc" ? "Weakest Trend First" : "Strongest Trend First" },
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
  return trendCardShell(
    playerProfileLink("nfl", player),
    `${player["Team"] || "N/A"} • ${formatNFLTrendLabel(player["Stat Type"])}${tonightStatus(player["Team"])}`,
    player
  );
}

async function renderNFLTrends() {
  await loadTonightStatuses("nfl");
  const container =
    document.getElementById("nfl-trends-container");

  if (!container) return;

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

      if (rows.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No NFL player trends available right now.</h3>
            <p>Please check back once NFL trend data is available.</p>
          </div>
        `;
        return;
      }

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
        const aValue = Number(a["Trend Score"]);
        const bValue = Number(b["Trend Score"]);

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
                ? "Weakest Trend First"
                : "Strongest Trend First"
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
        <h3>Unable to load NFL player trends right now.</h3>
        <p>
          Please try again in a moment or check your data source.
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
  return trendCardShell(
    teamProfileLink("nfl", teamRow["Team"]),
    `${formatNFLTeamTrendLabel(teamRow["Metric"])}${tonightStatus(teamRow["Team"])}`,
    teamRow,
    teamRatingTable(teamRow, [
      ["Offense", "Offensive Rating"],
      ["Defense", "Defensive Rating"],
      ["Overall", "Overall Rating"],
      ["Tier", "Rating Tier"],
      ["League Rank", "League Rank"]
    ])
  );
}

async function renderNFLTeamTrends() {
  await loadTonightStatuses("nfl");
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

      if (rows.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No NFL team trends available right now.</h3>
            <p>Please check back once NFL team trend data is available.</p>
          </div>
        `;
        return;
      }

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
        const aValue = Number(a["Trend Score"]);
        const bValue = Number(b["Trend Score"]);

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
                ? "Weakest Trend First"
                : "Strongest Trend First"
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

  document.addEventListener("click", (event) => {
    const upgradeLink = event.target.closest(
      '[data-upgrade-analytics="true"]'
    );

    if (!upgradeLink) return;

    const feature = upgradeLink.dataset.upgradeFeature;
    const league = upgradeLink.dataset.upgradeLeague;
    const requiredTier = upgradeLink.dataset.upgradeRequiredTier;

    if (!feature || !requiredTier) return;

    const props = {
      feature,
      required_tier: requiredTier
    };

    if (league) {
      props.league = league;
    }

    if (typeof plausible === "function") {
      plausible("Upgrade CTA Clicked", {
        props
      });
    }
  });
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

    <div>
      <strong>Direction</strong><br>
      ${trend["Trend Direction"] || "N/A"}
    </div>

    <div>
      <strong>Trend Score</strong><br>
      ${formatTrendScore(trend["Trend Score"])}
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

function updateTeamProfileSEO(
  league,
  team
) {

  const normalizedLeague =
    (league || "").toLowerCase();

  const teamName =
    decodeURIComponent(team || "");

  const routeByLeague = {
    nba: "/nba-team.html",
    nhl: "/nhl-team.html",
    mlb: "/mlb-team.html",
    nfl: "/nfl-team.html"
  };

  const route =
    routeByLeague[normalizedLeague];

  if (
    !route ||
    !teamName
  ) {
    return;
  }

  const leagueLabel =
    normalizedLeague.toUpperCase();

  const canonicalUrl =
    new URL(
      route,
      window.location.origin
    );

  canonicalUrl.searchParams.set(
    "league",
    normalizedLeague
  );

  canonicalUrl.searchParams.set(
    "team",
    teamName
  );

  document.title =
    `${teamName} ${leagueLabel} Team Profile | Sportacular Analytics`;

  let description =
    document.querySelector(
      'meta[name="description"]'
    );

  if (!description) {

    description =
      document.createElement("meta");

    description.setAttribute(
      "name",
      "description"
    );

    document.head.appendChild(
      description
    );

  }

  description.setAttribute(
    "content",
    `Explore the ${teamName} ${leagueLabel} team profile with team statistics, trends, game logs, and Sportacular analytics.`
  );

  let canonical =
    document.querySelector(
      'link[rel="canonical"]'
    );

  if (!canonical) {

    canonical =
      document.createElement("link");

    canonical.setAttribute(
      "rel",
      "canonical"
    );

    document.head.appendChild(
      canonical
    );

  }

  canonical.setAttribute(
    "href",
    canonicalUrl.href
  );

  const pageTitle =
    document.title;

  const pageDescription =
    description.getAttribute("content");

  const socialImage =
    `${window.location.origin}/social-share.png`;

  const setMeta = (
    selector,
    attributeName,
    attributeValue,
    content
  ) => {

    let meta =
      document.querySelector(
        selector
      );

    if (!meta) {

      meta =
        document.createElement("meta");

      meta.setAttribute(
        attributeName,
        attributeValue
      );

      document.head.appendChild(
        meta
      );

    }

    meta.setAttribute(
      "content",
      content
    );

  };

  setMeta(
    'meta[property="og:type"]',
    "property",
    "og:type",
    "website"
  );

  setMeta(
    'meta[property="og:site_name"]',
    "property",
    "og:site_name",
    "Sportacular Analytics"
  );

  setMeta(
    'meta[property="og:title"]',
    "property",
    "og:title",
    pageTitle
  );

  setMeta(
    'meta[property="og:description"]',
    "property",
    "og:description",
    pageDescription
  );

  setMeta(
    'meta[property="og:url"]',
    "property",
    "og:url",
    canonicalUrl.href
  );

  setMeta(
    'meta[property="og:image"]',
    "property",
    "og:image",
    socialImage
  );

  setMeta(
    'meta[property="og:image:width"]',
    "property",
    "og:image:width",
    "1200"
  );

  setMeta(
    'meta[property="og:image:height"]',
    "property",
    "og:image:height",
    "630"
  );

  setMeta(
    'meta[property="og:image:alt"]',
    "property",
    "og:image:alt",
    "Sportacular Analytics sports analytics platform"
  );

  setMeta(
    'meta[name="twitter:card"]',
    "name",
    "twitter:card",
    "summary_large_image"
  );

  setMeta(
    'meta[name="twitter:title"]',
    "name",
    "twitter:title",
    pageTitle
  );

  setMeta(
    'meta[name="twitter:description"]',
    "name",
    "twitter:description",
    pageDescription
  );

  setMeta(
    'meta[name="twitter:image"]',
    "name",
    "twitter:image",
    socialImage
  );

  setMeta(
    'meta[name="twitter:image:alt"]',
    "name",
    "twitter:image:alt",
    "Sportacular Analytics sports analytics platform"
  );

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

  updateTeamProfileSEO(
    league,
    team
  );

  renderTeamProfileGuide(league);

  document.getElementById("team-name").textContent =
    decodeURIComponent(team);

  const teamSubtitle = document.getElementById("team-subtitle");
  if (teamSubtitle && !document.getElementById("team-board-links")) {
    const teamName = decodeURIComponent(team);
    const links = document.createElement("div");
    links.id = "team-board-links";
    links.innerHTML = `
      <a class="card-link" href="${league}-odds.html?team=${encodeURIComponent(teamName)}">Today's odds</a>
      <a class="card-link" href="${league}-props.html?team=${encodeURIComponent(teamName)}">Today's props</a>
    `;
    teamSubtitle.insertAdjacentElement("afterend", links);
    const tonight = await teamTonight(league, teamName);
    if (tonight) {
      const away = String(tonight["Away Team"] || "").trim();
      const home = String(tonight["Home Team"] || "").trim();
      const isAway = away.toLowerCase() === teamName.trim().toLowerCase();
      const note = document.createElement("p");
      note.id = "team-tonight";
      note.textContent = `Tonight: ${isAway ? "at" : "vs"} ${isAway ? home : away} · ${tonight.Status || "Scheduled"}`;
      links.insertAdjacentElement("afterend", note);
    }
  }

  document.getElementById("team-subtitle").textContent =
    league.toUpperCase();

  //-------------------------------------------------------
  // NEW CODE STARTS HERE
  //-------------------------------------------------------

  let stats = [];
  let seasonStatsLoadError = false;

  try {

    stats =
      await fetchTeamSeasonStats(league);

  } catch (error) {

    seasonStatsLoadError = true;

    console.error(
      "Team season stats load error:",
      error
    );

  }

  let trends = [];
  let teamTrendsLoadError = false;

  try {

    trends =
      await fetchTeamTrends(league);

  } catch (error) {

    teamTrendsLoadError = true;

    console.error(
      "Team trends load error:",
      error
    );

  }

  let teamGameLogs = [];
  let teamGameLogsLoadError = false;

  try {

    teamGameLogs =
      await fetchTeamGameLogs(league);

  } catch (error) {

    teamGameLogsLoadError = true;

    console.error(
      "Team game logs load error:",
      error
    );

  }

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

if (seasonStatsLoadError) {

  statsContainer.innerHTML =
    "<p>Unable to load season statistics right now.</p>";

} else if (!teamStats) {

  statsContainer.innerHTML =
    "<p>No season statistics found.</p>";

} else {

  const statFields = league === "mlb"
    ? [
        ["Runs", "Runs / Game", "Runs Against", "Runs Against / Game", "Runs For"],
        ["Hits", "Hits / Game", "Hits Against", "Hits Against / Game", "Hits"],
        ["Home Runs", "Home Runs / Game", "Home Runs Against", "Home Runs Against / Game", "Home Runs"],
        ["Total Bases", "Total Bases / Game", "Total Bases Against", "Total Bases Against / Game", "Total Bases"],
        ["Strikeouts", "Strikeouts / Game", "Strikeouts Against", "Strikeouts Against / Game", "Strikeouts"]
      ]
    : league === "nba"
      ? [
          ["Points", "Points / Game", "Points Against", "Points Against / Game", "Points For"],
          ["Rebounds", "Rebounds / Game", "Rebounds Against", "Rebounds Against / Game", "Rebounds"],
          ["Assists", "Assists / Game", "Assists Against", "Assists Against / Game", "Assists"],
          ["Threes", "Threes / Game", "Threes Against", "Threes Against / Game", "Threes"],
          ["Turnovers", "Turnovers / Game", "Turnovers Against", "Turnovers Against / Game", "Turnovers"]
        ]
      : league === "nhl"
        ? [
            ["Goals", "Goals / Game", "Goals Against", "Goals Against / Game", "Goals For"],
            ["Shots on Goal", "Shots on Goal / Game", "Shots Against", "Shots Against / Game", "Shots On Goal"],
            ["Assists", "Assists / Game", "Assists Against", "Assists Against / Game", "Assists"],
            ["Points", "Points / Game", "Points Against", "Points Against / Game", "Points"],
            ["Saves", "Saves / Game", "Saves Against", "Saves Against / Game", "Saves"]
          ]
        : [
            ["Points", "Points / Game", "Points Against", "Points Against / Game", "Points For"],
            ["Passing Yards", "Passing Yards / Game", "Passing Yards Against", "Passing Yards Against / Game", "Passing Yards"],
            ["Rushing Yards", "Rushing Yards / Game", "Rushing Yards Against", "Rushing Yards Against / Game", "Rushing Yards"],
            ["Turnovers", "Turnovers / Game", "Turnovers Against", "Turnovers Against / Game", "Turnovers"],
            ["Sacks", "Sacks / Game", "Sacks Against", "Sacks Against / Game", "Sacks"]
          ];

  const gamesById = new Map();
  teamGameLogs.forEach((row) => {
    const id = String(row["Game ID"] || "").trim();
    if (!id) return;
    if (!gamesById.has(id)) gamesById.set(id, []);
    gamesById.get(id).push(row);
  });

  const ownTotals = Object.fromEntries(statFields.map((field) => [field[4], 0]));
  const againstTotals = Object.fromEntries(statFields.map((field) => [field[4], 0]));
  let gamesPlayed = 0;
  teamGames.forEach((game) => {
    const id = String(game["Game ID"] || "").trim();
    const opponent = (gamesById.get(id) || []).find((row) => String(row["Team"] || "").trim() !== selectedTeam);
    if (!opponent) return;
    gamesPlayed += 1;
    statFields.forEach((field) => {
      const key = field[4];
      const ownValue = Number(game[key]);
      const againstValue = Number(opponent[key]);
      ownTotals[key] += Number.isFinite(ownValue) ? ownValue : 0;
      againstTotals[key] += Number.isFinite(againstValue) ? againstValue : 0;
    });
  });

  if (!gamesPlayed) {
    statsContainer.innerHTML = "<p>No season statistics found.</p>";
  } else {

  const seasonNumber = (value, decimals) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "--";
    return decimals === 0 ? String(Math.round(num)) : num.toFixed(1);
  };
  const seasonRows = (mode, side) => [
    ["Games Played", String(gamesPlayed)],
    ...statFields.map(([ownTotal, ownPer, againstTotal, againstPer, field]) => {
      const total = side === "own" ? ownTotals[field] : againstTotals[field];
      return [
        mode === "totals"
          ? (side === "own" ? ownTotal : againstTotal)
          : (side === "own" ? ownPer : againstPer),
        seasonNumber(mode === "totals" ? total : total / gamesPlayed, mode === "totals" ? 0 : 1)
      ];
    })
  ];

  statsContainer.innerHTML = `
    <div class="season-view-head">
      <label class="season-view-toggle">
        <span>View</span>
        <select id="team-season-mode" aria-label="Season snapshot view">
          <option value="totals">Season totals</option>
          <option value="per-game">Per game</option>
        </select>
      </label>
    </div>
    <details class="home-accordion season-accordion" open>
      <summary>This team</summary>
      <div class="home-accordion-body" id="team-season-own"></div>
    </details>
    <details class="home-accordion season-accordion" open>
      <summary>Opponents</summary>
      <div class="home-accordion-body" id="team-season-against"></div>
    </details>
  `;

  const seasonSelect = document.getElementById("team-season-mode");
  const ownTable = document.getElementById("team-season-own");
  const againstTable = document.getElementById("team-season-against");
  const drawSeason = () => {
    const mode = seasonSelect ? seasonSelect.value : "totals";
    if (ownTable) ownTable.innerHTML = profileSummaryTable(seasonRows(mode, "own"));
    if (againstTable) againstTable.innerHTML = profileSummaryTable(seasonRows(mode, "against"));
  };
  if (seasonSelect) seasonSelect.onchange = drawSeason;
  drawSeason();

  }

}

const trendsContainer =
  document.getElementById("team-trends-content");

if (teamTrendsLoadError) {

  trendsContainer.innerHTML =
    "<p>Unable to load team trends right now.</p>";

} else if (!teamTrends.length) {

  trendsContainer.innerHTML =
    "<p>No current team trends found.</p>";

} else {

  const rankedTeamTrends = [...teamTrends].sort(
    (a, b) => Number(b["Trend Score"]) - Number(a["Trend Score"])
  );

  trendsContainer.innerHTML =
    rankedTeamTrends.map((row) => trendCardShell(
      row["Metric"] || "Trend",
      row["Team"] || "",
      row
    )).join("");

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

if (teamGameLogsLoadError) {

  const gameLogContainer =
    document.getElementById(
      "team-game-log-content"
    );

  if (gameLogContainer) {
    gameLogContainer.innerHTML = `
      <div class="team-performance-empty">
        Unable to load recent games right now.
      </div>
    `;
  }

} else {

  renderTeamGameLog(
    teamGames,
    league
  );

}

}

/* ==========================================================
   PLAYER PROFILE DIRECTORY
   Shared directory engine for all leagues
========================================================== */

const PLAYER_PROFILE_DIRECTORY_CONFIG = {

  nfl: {
    label: "NFL",
    rosterUrl: NFL_ROSTERS_CSV_URL,
    type: "standard"
  },

  nba: {
    label: "NBA",
    rosterUrl: NBA_ROSTERS_CSV_URL,
    type: "standard"
  },

  nhl: {
    label: "NHL",
    rosterUrl: NHL_PLAYERS_CSV_URL,
    type: "nhl"
  },

  mlb: {
    label: "MLB",
    rosterUrl: MLB_ROSTERS_CSV_URL,
    type: "standard"
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

            const standardTeam =
              String(row["Team Name"] || "").trim();

            if (standardTeam || row["Status"]) {

              return {

                id,

                name,

                team: standardTeam,

                position:
                  String(
                    row["Position"] ||
                    row["Position Code"] ||
                    ""
                  ).trim(),

                status:
                  String(row["Status"] || "active").trim()

              };

            }

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
   TEAM PROFILE DIRECTORY
========================================================== */

function teamRankingExplainerHtml(league) {
  const copy = {
    nba: {
      side: "Defense",
      offense: "Points For, Assists, and Threes",
      other: "Points Allowed, Rebounds, and Turnovers",
      lower: "Points Allowed and Turnovers are flipped, so the smaller number ranks higher."
    },
    nhl: {
      side: "Defense",
      offense: "Goals For, Shots on Goal, Assists, and Points",
      other: "Goals Allowed and Saves",
      lower: "Goals Allowed is flipped, so the smaller number ranks higher."
    },
    nfl: {
      side: "Defense",
      offense: "Points For, Passing Yards, Rushing Yards, and Turnovers",
      other: "Points Allowed and Sacks",
      lower: "Points Allowed and Turnovers are flipped, so the smaller number ranks higher."
    },
    mlb: {
      side: "Pitching",
      offense: "Hits, Home Runs, Runs For, and Total Bases",
      other: "Runs Allowed and Strikeouts",
      lower: "Runs Allowed is flipped, so the smaller number ranks higher."
    }
  }[league];
  if (!copy) return "";
  return `<div id="team-ranking-explainer" class="guide-panel ranking-explainer">
    <h3 class="guide-panel-title">How Sportacular ranks these teams</h3>
    <p>This is not a win-loss list and it is not point differential. Sportacular first asks where each team stands against the rest of the league in each stat, then blends those ranks into one power rating.</p>
    <ol>
      <li>Every stat becomes a rank score from 0 to 100. The best team in that stat gets 100. The last team gets 0. Everyone else is spaced evenly between them. ${copy.lower}</li>
      <li>Offense is the average of the rank scores for ${copy.offense}. ${copy.side} is the average of the rank scores for ${copy.other}.</li>
      <li>Overall Rating is 60% Offense and 40% ${copy.side}. It is not a straight average of the two numbers. Offense carries more weight, so a team that only scores is not treated the same as a team that scores and gets stops.</li>
      <li>The list is ordered by that Overall Rating. The same number is the Overall Rating on the team page, so the place in this list matches the profile.</li>
      <li>Rating Tier comes from Overall Rating. Elite is 90 or higher. Strong is 75 to 89.9. Average is 55 to 74.9. Below Average is 40 to 54.9. Weak is under 40.</li>
    </ol>
  </div>`;
}

function showTeamRankingExplainer(league, anchor) {
  if (!anchor || document.getElementById("team-ranking-explainer")) return;
  const html = teamRankingExplainerHtml(league);
  if (!html) return;
  anchor.insertAdjacentHTML("afterend", html);
}

function directoryRating(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(1) : "—";
}

async function initTeamProfileDirectory() {
  const directory = document.querySelector(".team-directory");
  const firstLink = directory?.querySelector("a");
  if (!directory || !firstLink) return;

  const league = new URL(firstLink.href, window.location.href).searchParams.get("league");
  if (!league || !TEAM_PROFILE_CONFIG[league]) return;

  showTeamRankingExplainer(league, document.querySelector(".league-description"));

  let trends = [];
  try {
    trends = await fetchTeamTrends(league);
  } catch (error) {
    console.error("Team directory ratings failed:", error);
    return;
  }

  const sideKey = league === "mlb" ? "Pitching Rating" : "Defensive Rating";
  const sideLabel = league === "mlb" ? "Pitching" : "Defense";
  const byTeam = new Map();
  trends.forEach((row) => {
    const name = String(row["Team"] || "").trim();
    if (name && !byTeam.has(name)) byTeam.set(name, row);
  });

  const teams = [...directory.querySelectorAll("a")].map((link) => {
    const name = link.textContent.trim();
    const row = byTeam.get(name) || {};
    const overall = Number(row["Overall Rating"]);
    return {
      name,
      href: link.getAttribute("href"),
      overall: Number.isFinite(overall) ? overall : null,
      offense: row["Offensive Rating"],
      side: row[sideKey],
      tier: String(row["Rating Tier"] || "").trim()
    };
  });

  const rated = teams.filter((team) => team.overall !== null).sort((a, b) => b.overall - a.overall);
  const unrated = teams.filter((team) => team.overall === null).sort((a, b) => a.name.localeCompare(b.name));
  const ordered = [...rated, ...unrated];

  const rows = ordered.map((team, index) => {
    const rank = team.overall === null ? "—" : index + 1;
    const safeName = team.name.replaceAll("&", "&").replaceAll("<", "<");
    return `<tr>
      <td>${rank}</td>
      <td><a href="${team.href}">${safeName}</a></td>
      <td>${directoryRating(team.overall)}</td>
      <td>${directoryRating(team.offense)}</td>
      <td>${directoryRating(team.side)}</td>
      <td>${team.tier || "—"}</td>
    </tr>`;
  }).join("");

  directory.innerHTML = `
    <div class="odds-table-wrap">
      <table class="odds-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>Overall</th>
            <th>Offense</th>
            <th>${sideLabel}</th>
            <th>Tier</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="player-directory-message">Ordered by Overall Rating. # is the league rank. A missing rating says —.</p>
  `;
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
    initPlayerProfileDirectory("mlb");
    initTeamProfileDirectory();

  }
);

document.addEventListener("DOMContentLoaded", () => {
  const leaguePages = {
    nba: "nba-odds.html",
    nhl: "nhl-odds.html",
    mlb: "mlb-odds.html",
    nfl: "nfl-odds.html"
  };

  document.querySelectorAll(".dropdown > a").forEach((link) => {
    const page = leaguePages[link.textContent.trim().toLowerCase()];
    if (page) link.setAttribute("href", page);
  });

  if (!document.getElementById("about")) {
    document.querySelectorAll('a[href="#about"]').forEach((link) => {
      link.setAttribute("href", "index.html#about");
    });
  }
});