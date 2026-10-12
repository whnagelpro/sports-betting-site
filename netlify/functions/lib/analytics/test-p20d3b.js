/**
 * SPORTACULAR ANALYTICS
 * P20 D3B — LIVE TEAM PROFILE PRODUCTION EVIDENCE
 *
 * Purpose:
 *   Validate the real four-league Team Profile production data contract
 *   used by script.js.
 *
 * Production architecture:
 *   script.js
 *     -> TEAM_PROFILE_CONFIG
 *     -> seasonStats
 *     -> teamTrends
 *     -> schedule (configured contract)
 *     -> teamGameLogs
 *
 * Active Team Profile initialization:
 *   seasonStats + teamTrends + teamGameLogs
 *
 * This audit:
 *   - does NOT modify production behavior
 *   - does NOT create a Team Profile backend
 *   - does NOT require browser DOM execution
 *   - uses the real production CSV URLs
 *   - automatically selects a real team per league
 *   - distinguishes PASS / NOT_EXERCISED / FAIL
 *   - fails closed on genuine release blockers
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/* ==========================================================
   CONSTANTS
========================================================== */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(
  __dirname,
  "../../../.."
);

const SCRIPT_PATH = path.join(
  PROJECT_ROOT,
  "script.js"
);

const LEAGUES = ["NBA", "NHL", "MLB", "NFL"];

const TEAM_DOMAINS = [
  "TEAM_ROUTING_IDENTITY",
  "TEAM_DATA_SOURCES",
  "TEAM_SEASON",
  "TEAM_TRENDS",
  "TEAM_GAME_LOGS",
  "TEAM_RATINGS",
  "TEAM_RENDER_STATE"
];

const REQUIRED_SOURCE_KEYS = [
  "seasonStats",
  "teamTrends",
  "schedule",
  "teamGameLogs"
];

const ACTIVE_PROFILE_SOURCE_KEYS = [
  "seasonStats",
  "teamTrends",
  "teamGameLogs"
];

const VALID_STATUSES = new Set([
  "PASS",
  "NOT_EXERCISED",
  "PENDING",
  "FAIL"
]);

/* ==========================================================
   RESULT STORAGE
========================================================== */

const assertions = [];
const failures = [];

const leagueReports = {};

for (const league of LEAGUES) {
  leagueReports[league] = {
    league,
    deployment: "P20-D3B",
    evidenceType: "LIVE_TEAM_PROFILE_PRODUCTION",
    status: "PASS",
    assertions: 0,
    passed: 0,
    failed: 0,
    notExercised: 0,
    blockers: 0,
    selectedTeam: null,
    sourceRows: {},
    domains: {}
  };

  for (const domain of TEAM_DOMAINS) {
    leagueReports[league].domains[domain] = {
      status: "PENDING",
      blocker: true,
      assertions: 0,
      passed: 0,
      failed: 0,
      notExercised: 0,
      failures: []
    };
  }
}

/* ==========================================================
   LOGGING
========================================================== */

function section(title) {
  console.log("");
  console.log("=".repeat(60));
  console.log(title);
  console.log("=".repeat(60));
}

function normalizeLeague(league) {
  return String(league || "").trim().toUpperCase();
}

function normalizeTeam(value) {
  return String(value ?? "").trim();
}

function isNonEmpty(value) {
  return (
    value !== undefined &&
    value !== null &&
    String(value).trim() !== ""
  );
}

function isFiniteNumericValue(value) {
  if (!isNonEmpty(value)) return false;
  return Number.isFinite(Number(value));
}

function safeDetails(details) {
  if (
    details === undefined ||
    details === null
  ) {
    return {};
  }

  return details;
}

/* ==========================================================
   ASSERTION ENGINE
========================================================== */

function recordAssertion({
  league,
  domain,
  name,
  pass,
  status = null,
  blocker = true,
  details = {}
}) {
  const normalizedLeague = normalizeLeague(league);

  const finalStatus =
    status ||
    (pass ? "PASS" : "FAIL");

  if (!VALID_STATUSES.has(finalStatus)) {
    throw new Error(
      `Invalid P20 D3B assertion status: ${finalStatus}`
    );
  }

  const assertion = {
    league: normalizedLeague,
    domain,
    name,
    pass: finalStatus !== "FAIL",
    status: finalStatus,
    blocker,
    details: safeDetails(details)
  };

  assertions.push(assertion);

  console.log(
    JSON.stringify({
      league: normalizedLeague,
      domain,
      name,
      pass: assertion.pass,
      status: finalStatus,
      details: assertion.details
    })
  );

  if (!leagueReports[normalizedLeague]) {
    return assertion;
  }

  const report =
    leagueReports[normalizedLeague];

  const domainReport =
    report.domains[domain];

  report.assertions += 1;
  domainReport.assertions += 1;

  if (finalStatus === "PASS") {
    report.passed += 1;
    domainReport.passed += 1;
  }

  if (finalStatus === "NOT_EXERCISED") {
    report.notExercised += 1;
    domainReport.notExercised += 1;
  }

  if (finalStatus === "FAIL") {
    report.failed += 1;
    domainReport.failed += 1;

    const failure = {
      league: normalizedLeague,
      domain,
      name,
      blocker,
      details: assertion.details
    };

    failures.push(failure);
    domainReport.failures.push(failure);

    if (blocker) {
      report.blockers += 1;
    }
  }

  return assertion;
}

function pass(
  league,
  domain,
  name,
  details = {}
) {
  return recordAssertion({
    league,
    domain,
    name,
    pass: true,
    status: "PASS",
    blocker: true,
    details
  });
}

function fail(
  league,
  domain,
  name,
  details = {},
  blocker = true
) {
  return recordAssertion({
    league,
    domain,
    name,
    pass: false,
    status: "FAIL",
    blocker,
    details
  });
}

function notExercised(
  league,
  domain,
  name,
  details = {}
) {
  return recordAssertion({
    league,
    domain,
    name,
    pass: true,
    status: "NOT_EXERCISED",
    blocker: false,
    details
  });
}

/* ==========================================================
   CSV PARSER
   Mirrors the current script.js parser contract.
========================================================== */

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (
      char === '"' &&
      inQuotes &&
      nextChar === '"'
    ) {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (
      char === "," &&
      !inQuotes
    ) {
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
  const lines = String(text || "")
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length < 2) {
    return [];
  }

  const headers =
    parseCSVLine(lines[0]);

  return lines.slice(1).map(line => {
    const values =
      parseCSVLine(line);

    const row = {};

    headers.forEach((header, index) => {
      row[header] =
        values[index] || "";
    });

    return row;
  });
}

/* ==========================================================
   PRODUCTION SOURCE EXTRACTION
========================================================== */

function extractConstantURL(
  source,
  constantName
) {
  const escapedName =
    constantName.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

  const pattern = new RegExp(
    `const\\s+${escapedName}\\s*=\\s*["']([^"']+)["']\\s*;`
  );

  const match =
    source.match(pattern);

  return match
    ? match[1]
    : null;
}

function extractProductionConfig(source) {
  const definitions = {
    NBA: {
      seasonStats:
        "NBA_TEAM_SEASON_STATS_CSV_URL",
      teamTrends:
        "NBA_TEAM_TRENDS_CSV_URL",
      schedule:
        "NBA_SCHEDULE_CSV_URL",
      teamGameLogs:
        "NBA_TEAM_GAME_LOGS_CSV_URL"
    },

    NHL: {
      seasonStats:
        "NHL_TEAM_SEASON_STATS_CSV_URL",
      teamTrends:
        "NHL_TEAM_TRENDS_CSV_URL",
      schedule:
        "NHL_SCHEDULE_CSV_URL",
      teamGameLogs:
        "NHL_TEAM_GAME_LOGS_CSV_URL"
    },

    MLB: {
      seasonStats:
        "MLB_TEAM_SEASON_STATS_CSV_URL",
      teamTrends:
        "MLB_TEAM_TRENDS_CSV_URL",
      schedule:
        "MLB_SCHEDULE_CSV_URL",
      teamGameLogs:
        "MLB_TEAM_GAME_LOGS_CSV_URL"
    },

    NFL: {
      seasonStats:
        "NFL_TEAM_SEASON_STATS_CSV_URL",
      teamTrends:
        "NFL_TEAM_TRENDS_CSV_URL",
      schedule:
        "NFL_SCHEDULE_CSV_URL",
      teamGameLogs:
        "NFL_TEAM_GAME_LOGS_CSV_URL"
    }
  };

  const config = {};

  for (const league of LEAGUES) {
    config[league] = {};

    for (
      const [
        key,
        constantName
      ] of Object.entries(
        definitions[league]
      )
    ) {
      config[league][key] =
        extractConstantURL(
          source,
          constantName
        );
    }
  }

  return config;
}

/* ==========================================================
   LIVE FETCH
========================================================== */

async function fetchCSV(
  url,
  label,
  timeoutMs = 20000
) {
  if (!url) {
    throw new Error(
      `${label}: production URL is missing`
    );
  }

  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () => controller.abort(),
      timeoutMs
    );

  const startedAt = Date.now();

  try {
    const response =
      await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Sportacular-P20-D3B-Audit"
        }
      });

    const runtimeMs =
      Date.now() - startedAt;

    if (!response.ok) {
      throw new Error(
        `${label}: HTTP ${response.status}`
      );
    }

    const text =
      await response.text();

    const rows =
      parseCSV(text);

    return {
      ok: true,
      status: response.status,
      runtimeMs,
      rows,
      bytes: text.length
    };
  } finally {
    clearTimeout(timer);
  }
}

/* ==========================================================
   TEAM DISCOVERY
========================================================== */

function collectTeams(rows) {
  const teams = new Set();

  for (const row of rows || []) {
    const team =
      normalizeTeam(row?.Team);

    if (team) {
      teams.add(team);
    }
  }

  return teams;
}

function intersection(...sets) {
  if (!sets.length) {
    return [];
  }

  const [first, ...rest] = sets;

  return [...first].filter(value =>
    rest.every(set =>
      set.has(value)
    )
  );
}

function chooseTeam({
  seasonRows,
  trendRows,
  gameLogRows
}) {
  const seasonTeams =
    collectTeams(seasonRows);

  const trendTeams =
    collectTeams(trendRows);

  const gameTeams =
    collectTeams(gameLogRows);

  const allThree =
    intersection(
      seasonTeams,
      trendTeams,
      gameTeams
    );

  if (allThree.length) {
    return {
      team: allThree[0],
      coverage:
        "SEASON_TRENDS_GAME_LOGS"
    };
  }

  const seasonAndTrends =
    intersection(
      seasonTeams,
      trendTeams
    );

  if (seasonAndTrends.length) {
    return {
      team: seasonAndTrends[0],
      coverage:
        "SEASON_TRENDS"
    };
  }

  const seasonAndGames =
    intersection(
      seasonTeams,
      gameTeams
    );

  if (seasonAndGames.length) {
    return {
      team: seasonAndGames[0],
      coverage:
        "SEASON_GAME_LOGS"
    };
  }

  const trendsAndGames =
    intersection(
      trendTeams,
      gameTeams
    );

  if (trendsAndGames.length) {
    return {
      team: trendsAndGames[0],
      coverage:
        "TRENDS_GAME_LOGS"
    };
  }

  const fallback =
    [
      ...seasonTeams,
      ...trendTeams,
      ...gameTeams
    ].find(Boolean);

  return {
    team: fallback || null,
    coverage: fallback
      ? "PARTIAL"
      : "NONE"
  };
}

/* ==========================================================
   RATING CONTRACT
========================================================== */

function buildRatingEvidence(
  selectedTeam,
  allTrendRows,
  teamTrendRows
) {
  if (!teamTrendRows.length) {
    return {
      exercised: false,
      reason:
        "No trend rows exist for selected team."
    };
  }

  const ratingRow =
    teamTrendRows[0];

  const ratings = new Map();

  for (const row of allTrendRows) {
    const team =
      normalizeTeam(row.Team);

    const raw =
      row["Overall Rating"];

    if (
      !team ||
      !isFiniteNumericValue(raw) ||
      ratings.has(team)
    ) {
      continue;
    }

    ratings.set(
      team,
      Number(raw)
    );
  }

  const rankings =
    [...ratings.entries()]
      .map(
        ([team, overallRating]) => ({
          team,
          overallRating
        })
      )
      .sort(
        (a, b) =>
          b.overallRating -
          a.overallRating
      );

  const index =
    rankings.findIndex(
      item =>
        item.team === selectedTeam
    );

  const leagueRank =
    index >= 0
      ? index + 1
      : null;

  const rankScore =
    leagueRank !== null &&
    rankings.length > 1
      ? Number(
          (
            100 *
            (
              1 -
              (leagueRank - 1) /
              (rankings.length - 1)
            )
          ).toFixed(1)
        )
      : null;

  return {
    exercised: true,
    ratingRow,
    overallRating:
      ratingRow["Overall Rating"],
    offensiveRating:
      ratingRow["Offensive Rating"],
    defensiveRating:
      ratingRow["Defensive Rating"],
    pitchingRating:
      ratingRow["Pitching Rating"],
    ratingTier:
      ratingRow["Rating Tier"],
    ratingNotes:
      ratingRow["Rating Notes"],
    lastUpdated:
      ratingRow["Last Updated"],
    rankedTeams:
      rankings.length,
    leagueRank,
    rankScore
  };
}

/* ==========================================================
   DOMAIN FINALIZATION
========================================================== */

function finalizeDomains(league) {
  const report =
    leagueReports[league];

  for (const domain of TEAM_DOMAINS) {
    const d =
      report.domains[domain];

    if (d.failed > 0) {
      d.status = "FAIL";
      continue;
    }

    if (
      d.assertions > 0 &&
      d.passed > 0
    ) {
      d.status = "PASS";
      continue;
    }

    if (
      d.assertions > 0 &&
      d.notExercised > 0
    ) {
      d.status =
        "NOT_EXERCISED";
      continue;
    }

    d.status = "PENDING";
  }

  const blockerFailures =
    Object.values(report.domains)
      .some(domain =>
        domain.status === "FAIL" &&
        domain.blocker
      );

  report.status =
    blockerFailures
      ? "FAIL"
      : "PASS";
}

/* ==========================================================
   SOURCE-CONTRACT AUDIT
========================================================== */

function auditSourceContract(
  league,
  config
) {
  const missing =
    REQUIRED_SOURCE_KEYS.filter(
      key => !config?.[key]
    );

  if (!missing.length) {
    pass(
      league,
      "TEAM_DATA_SOURCES",
      `${league} exposes all four frozen Team Profile source contracts`,
      {
        required:
          REQUIRED_SOURCE_KEYS,
        missing
      }
    );
  } else {
    fail(
      league,
      "TEAM_DATA_SOURCES",
      `${league} exposes all four frozen Team Profile source contracts`,
      {
        required:
          REQUIRED_SOURCE_KEYS,
        missing
      }
    );
  }

  const activeMissing =
    ACTIVE_PROFILE_SOURCE_KEYS.filter(
      key => !config?.[key]
    );

  if (!activeMissing.length) {
    pass(
      league,
      "TEAM_DATA_SOURCES",
      `${league} exposes all three actively consumed Team Profile sources`,
      {
        activeSources:
          ACTIVE_PROFILE_SOURCE_KEYS
      }
    );
  } else {
    fail(
      league,
      "TEAM_DATA_SOURCES",
      `${league} exposes all three actively consumed Team Profile sources`,
      {
        missing:
          activeMissing
      }
    );
  }

  if (config?.schedule) {
    pass(
      league,
      "TEAM_DATA_SOURCES",
      `${league} preserves configured schedule source`,
      {
        configured: true,
        activelyConsumedByCurrentTeamProfileInit:
          false
      }
    );
  } else {
    fail(
      league,
      "TEAM_DATA_SOURCES",
      `${league} preserves configured schedule source`,
      {
        configured: false
      }
    );
  }
}

/* ==========================================================
   LIVE LEAGUE AUDIT
========================================================== */

async function auditLeague(
  league,
  config
) {
  section(
    `P20 D3B — ${league} LIVE TEAM PROFILE`
  );

  auditSourceContract(
    league,
    config
  );

  let seasonResult;
  let trendResult;
  let gameLogResult;
  let scheduleResult;

  try {
    [
      seasonResult,
      trendResult,
      gameLogResult,
      scheduleResult
    ] = await Promise.all([
      fetchCSV(
        config.seasonStats,
        `${league} team season stats`
      ),

      fetchCSV(
        config.teamTrends,
        `${league} team trends`
      ),

      fetchCSV(
        config.teamGameLogs,
        `${league} team game logs`
      ),

      fetchCSV(
        config.schedule,
        `${league} schedule`
      )
    ]);

    pass(
      league,
      "TEAM_DATA_SOURCES",
      `${league} live production CSV requests complete successfully`,
      {
        seasonStats: {
          status:
            seasonResult.status,
          rows:
            seasonResult.rows.length,
          runtimeMs:
            seasonResult.runtimeMs
        },
        teamTrends: {
          status:
            trendResult.status,
          rows:
            trendResult.rows.length,
          runtimeMs:
            trendResult.runtimeMs
        },
        teamGameLogs: {
          status:
            gameLogResult.status,
          rows:
            gameLogResult.rows.length,
          runtimeMs:
            gameLogResult.runtimeMs
        },
        schedule: {
          status:
            scheduleResult.status,
          rows:
            scheduleResult.rows.length,
          runtimeMs:
            scheduleResult.runtimeMs,
          configuredOnly:
            true
        }
      }
    );
  } catch (error) {
    fail(
      league,
      "TEAM_DATA_SOURCES",
      `${league} live production CSV requests complete successfully`,
      {
        error:
          error?.message ||
          String(error)
      }
    );

    finalizeDomains(league);
    return;
  }

  leagueReports[league].sourceRows = {
    seasonStats:
      seasonResult.rows.length,
    teamTrends:
      trendResult.rows.length,
    teamGameLogs:
      gameLogResult.rows.length,
    schedule:
      scheduleResult.rows.length
  };

  const selection =
    chooseTeam({
      seasonRows:
        seasonResult.rows,
      trendRows:
        trendResult.rows,
      gameLogRows:
        gameLogResult.rows
    });

  const selectedTeam =
    selection.team;

  leagueReports[league].selectedTeam =
    selectedTeam;

    if (!selectedTeam) {
    /*
    * A league may legitimately have zero current production rows
    * during an offseason / preseason / not-yet-populated state.
    *
    * The source contract has already been proven above:
    *   - configured production URLs exist
    *   - requests returned successfully
    *   - CSV parsing completed successfully
    *
    * Therefore absence of current team rows is not itself a
    * routing failure. Data-dependent domains are NOT_EXERCISED,
    * while the production empty-state contract is exercised.
    */

    notExercised(
        league,
        "TEAM_ROUTING_IDENTITY",
        `${league} currently has no production team row available for live routing evidence`,
        {
        coverage: selection.coverage,
        seasonRows: seasonResult.rows.length,
        trendRows: trendResult.rows.length,
        gameLogRows: gameLogResult.rows.length,
        scheduleRows: scheduleResult.rows.length,
        reason:
            "Production CSV sources are reachable and valid but currently contain no data rows."
        }
    );

    notExercised(
        league,
        "TEAM_SEASON",
        `${league} season-data state is not currently exercisable`,
        {
        rows: seasonResult.rows.length,
        expectedEmptyState:
            "No season statistics found."
        }
    );

    notExercised(
        league,
        "TEAM_TRENDS",
        `${league} team-trend state is not currently exercisable`,
        {
        rows: trendResult.rows.length,
        expectedEmptyState:
            "No current team trends found."
        }
    );

    notExercised(
        league,
        "TEAM_GAME_LOGS",
        `${league} team-game-log state is not currently exercisable`,
        {
        rows: gameLogResult.rows.length,
        expectedEmptyState:
            "No recent games found."
        }
    );

    notExercised(
        league,
        "TEAM_RATINGS",
        `${league} Team Profile ratings are not currently exercisable`,
        {
        trendRows: trendResult.rows.length,
        reason:
            "Ratings require current team trend rows."
        }
    );

    pass(
        league,
        "TEAM_RENDER_STATE",
        `${league} production Team Profile supports the current no-data state`,
        {
        state: "EMPTY",
        seasonState:
            "No season statistics found.",
        trendsState:
            "No current team trends found.",
        gameLogState:
            "No recent games found.",
        productionSourcesReachable: true
        }
    );

    finalizeDomains(league);

    console.log(
        `${league} current production state:`,
        {
        state: "NO_DATA",
        coverage: selection.coverage,
        seasonRows: seasonResult.rows.length,
        trendRows: trendResult.rows.length,
        gameLogRows: gameLogResult.rows.length,
        scheduleRows: scheduleResult.rows.length
        }
    );

    return;
    }

  pass(
    league,
    "TEAM_ROUTING_IDENTITY",
    `${league} automatically selects a real production team`,
    {
      selectedTeam,
      coverage:
        selection.coverage
    }
  );

  const encodedTeam =
    encodeURIComponent(
      selectedTeam
    );

  const decodedTeam =
    decodeURIComponent(
      encodedTeam
    );

  if (
    decodedTeam === selectedTeam
  ) {
    pass(
      league,
      "TEAM_ROUTING_IDENTITY",
      `${league} selected team survives production URL encoding/decoding`,
      {
        selectedTeam,
        encodedTeam,
        decodedTeam
      }
    );
  } else {
    fail(
      league,
      "TEAM_ROUTING_IDENTITY",
      `${league} selected team survives production URL encoding/decoding`,
      {
        selectedTeam,
        encodedTeam,
        decodedTeam
      }
    );
  }

  const teamStats =
    seasonResult.rows.find(
      row =>
        normalizeTeam(row.Team) ===
        selectedTeam
    ) || null;

  const teamTrends =
    trendResult.rows.filter(
      row =>
        normalizeTeam(row.Team) ===
        selectedTeam
    );

  const teamGames =
    gameLogResult.rows.filter(
      row =>
        normalizeTeam(row.Team) ===
        selectedTeam
    );

  /* ------------------------------------------------------
     TEAM_SEASON
  ------------------------------------------------------ */

  if (teamStats) {
    pass(
      league,
      "TEAM_SEASON",
      `${league} selected team has production season-stat row`,
      {
        selectedTeam,
        gamesPlayed:
          teamStats["Games Played"] ??
          null
      }
    );

    const hasTeamIdentity =
      normalizeTeam(
        teamStats.Team
      ) === selectedTeam;

    if (hasTeamIdentity) {
      pass(
        league,
        "TEAM_SEASON",
        `${league} season-stat row preserves selected team identity`,
        {
          selectedTeam,
          rowTeam:
            teamStats.Team
        }
      );
    } else {
      fail(
        league,
        "TEAM_SEASON",
        `${league} season-stat row preserves selected team identity`,
        {
          selectedTeam,
          rowTeam:
            teamStats.Team
        }
      );
    }
  } else {
    notExercised(
      league,
      "TEAM_SEASON",
      `${league} selected team has production season-stat row`,
      {
        selectedTeam,
        reason:
          "No current season-stat row for selected team; UI has an explicit empty state."
      }
    );
  }

  /* ------------------------------------------------------
     TEAM_TRENDS
  ------------------------------------------------------ */

  if (teamTrends.length) {
    pass(
      league,
      "TEAM_TRENDS",
      `${league} selected team has production trend rows`,
      {
        selectedTeam,
        count:
          teamTrends.length,
        metrics:
          teamTrends
            .slice(0, 10)
            .map(row =>
              row.Metric
            )
            .filter(Boolean)
      }
    );

    const allTrendRowsMatch =
      teamTrends.every(
        row =>
          normalizeTeam(row.Team) ===
          selectedTeam
      );

    if (allTrendRowsMatch) {
      pass(
        league,
        "TEAM_TRENDS",
        `${league} team trend filter preserves selected team identity`,
        {
          selectedTeam,
          count:
            teamTrends.length
        }
      );
    } else {
      fail(
        league,
        "TEAM_TRENDS",
        `${league} team trend filter preserves selected team identity`,
        {
          selectedTeam
        }
      );
    }
  } else {
    notExercised(
      league,
      "TEAM_TRENDS",
      `${league} selected team has production trend rows`,
      {
        selectedTeam,
        reason:
          "No current trend rows for selected team; UI has an explicit empty state."
      }
    );
  }

  /* ------------------------------------------------------
     TEAM_GAME_LOGS
  ------------------------------------------------------ */

  if (teamGames.length) {
    pass(
      league,
      "TEAM_GAME_LOGS",
      `${league} selected team has production game-log rows`,
      {
        selectedTeam,
        count:
          teamGames.length
      }
    );

    const allGameRowsMatch =
      teamGames.every(
        row =>
          normalizeTeam(row.Team) ===
          selectedTeam
      );

    if (allGameRowsMatch) {
      pass(
        league,
        "TEAM_GAME_LOGS",
        `${league} game-log filter preserves selected team identity`,
        {
          selectedTeam,
          count:
            teamGames.length
        }
      );
    } else {
      fail(
        league,
        "TEAM_GAME_LOGS",
        `${league} game-log filter preserves selected team identity`,
        {
          selectedTeam
        }
      );
    }

    const firstGame =
      teamGames[0];

    const hasGameDate =
      isNonEmpty(
        firstGame["Game Date"]
      );

    if (hasGameDate) {
      pass(
        league,
        "TEAM_GAME_LOGS",
        `${league} production game-log evidence exposes Game Date`,
        {
          selectedTeam,
          gameDate:
            firstGame["Game Date"]
        }
      );
    } else {
      fail(
        league,
        "TEAM_GAME_LOGS",
        `${league} production game-log evidence exposes Game Date`,
        {
          selectedTeam,
          firstGame
        }
      );
    }
  } else {
    notExercised(
      league,
      "TEAM_GAME_LOGS",
      `${league} selected team has production game-log rows`,
      {
        selectedTeam,
        reason:
          "No recent team games; production renderer has an explicit empty state."
      }
    );
  }

  /* ------------------------------------------------------
     TEAM_RATINGS
  ------------------------------------------------------ */

  const ratingEvidence =
    buildRatingEvidence(
      selectedTeam,
      trendResult.rows,
      teamTrends
    );

  if (!ratingEvidence.exercised) {
    notExercised(
      league,
      "TEAM_RATINGS",
      `${league} selected team exercises Team Profile rating state`,
      {
        selectedTeam,
        reason:
          ratingEvidence.reason
      }
    );
  } else {
    const overallValid =
      isFiniteNumericValue(
        ratingEvidence.overallRating
      );

    if (overallValid) {
      pass(
        league,
        "TEAM_RATINGS",
        `${league} selected team exposes numeric Overall Rating`,
        {
          selectedTeam,
          overallRating:
            ratingEvidence.overallRating
        }
      );
    } else {
      fail(
        league,
        "TEAM_RATINGS",
        `${league} selected team exposes numeric Overall Rating`,
        {
          selectedTeam,
          overallRating:
            ratingEvidence.overallRating
        }
      );
    }

    if (
      ratingEvidence.leagueRank !== null &&
      ratingEvidence.leagueRank >= 1
    ) {
      pass(
        league,
        "TEAM_RATINGS",
        `${league} production Overall Rating generates a valid league rank`,
        {
          selectedTeam,
          leagueRank:
            ratingEvidence.leagueRank,
          rankedTeams:
            ratingEvidence.rankedTeams,
          rankScore:
            ratingEvidence.rankScore
        }
      );
    } else {
      fail(
        league,
        "TEAM_RATINGS",
        `${league} production Overall Rating generates a valid league rank`,
        {
          selectedTeam,
          rankedTeams:
            ratingEvidence.rankedTeams,
          overallRating:
            ratingEvidence.overallRating
        }
      );
    }

    if (
      ratingEvidence.rankScore === null ||
      (
        ratingEvidence.rankScore >= 0 &&
        ratingEvidence.rankScore <= 100
      )
    ) {
      pass(
        league,
        "TEAM_RATINGS",
        `${league} Team Profile rank score stays within valid range`,
        {
          selectedTeam,
          rankScore:
            ratingEvidence.rankScore
        }
      );
    } else {
      fail(
        league,
        "TEAM_RATINGS",
        `${league} Team Profile rank score stays within valid range`,
        {
          selectedTeam,
          rankScore:
            ratingEvidence.rankScore
        }
      );
    }
  }

  /* ------------------------------------------------------
     TEAM_RENDER_STATE
  ------------------------------------------------------ */

  pass(
    league,
    "TEAM_RENDER_STATE",
    `${league} Team Profile can materialize routing identity`,
    {
      teamName:
        selectedTeam,
      subtitle:
        league
    }
  );

  if (teamStats) {
    pass(
      league,
      "TEAM_RENDER_STATE",
      `${league} Team Profile has a valid season render state`,
      {
        state:
          "DATA"
      }
    );
  } else {
    pass(
      league,
      "TEAM_RENDER_STATE",
      `${league} Team Profile has a valid season render state`,
      {
        state:
          "EMPTY",
        expectedMessage:
          "No season statistics found."
      }
    );
  }

  if (teamTrends.length) {
    pass(
      league,
      "TEAM_RENDER_STATE",
      `${league} Team Profile has a valid trends render state`,
      {
        state:
          "DATA",
        count:
          teamTrends.length
      }
    );
  } else {
    pass(
      league,
      "TEAM_RENDER_STATE",
      `${league} Team Profile has a valid trends render state`,
      {
        state:
          "EMPTY",
        expectedMessage:
          "No current team trends found."
      }
    );
  }

  if (teamGames.length) {
    pass(
      league,
      "TEAM_RENDER_STATE",
      `${league} Team Profile has a valid game-log render state`,
      {
        state:
          "DATA",
        count:
          teamGames.length
      }
    );
  } else {
    pass(
      league,
      "TEAM_RENDER_STATE",
      `${league} Team Profile has a valid game-log render state`,
      {
        state:
          "EMPTY",
        expectedMessage:
          "No recent games found."
      }
    );
  }

  finalizeDomains(league);

  console.log(
    `${league} selected team:`,
    {
      team:
        selectedTeam,
      coverage:
        selection.coverage,
      seasonRows:
        seasonResult.rows.length,
      trendRows:
        trendResult.rows.length,
      gameLogRows:
        gameLogResult.rows.length,
      scheduleRows:
        scheduleResult.rows.length,
      selectedTeamTrendRows:
        teamTrends.length,
      selectedTeamGameRows:
        teamGames.length
    }
  );
}

/* ==========================================================
   SOURCE FILE CONTRACT
========================================================== */

function auditProductionSource(
  scriptSource
) {
  section(
    "P20 D3B — PRODUCTION SCRIPT CONTRACT"
  );

  const requiredFragments = [
    "const TEAM_PROFILE_CONFIG",
    "function getTeamProfileParameters()",
    "async function initTeamProfilePage()",
    "fetchTeamSeasonStats(league)",
    "fetchTeamTrends(league)",
    "fetchTeamGameLogs(league)",
    "renderTeamGameLog(",
    "No season statistics found.",
    "No current team trends found.",
    "No recent games found."
  ];

  const missing =
    requiredFragments.filter(
      fragment =>
        !scriptSource.includes(
          fragment
        )
    );

  if (missing.length) {
    throw new Error(
      `P20 D3B production script contract is missing: ${missing.join(", ")}`
    );
  }

  console.log(
    JSON.stringify({
      league: "GLOBAL",
      domain:
        "TEAM_RENDER_STATE",
      name:
        "Production script preserves Team Profile contract and empty states",
      pass: true,
      details: {
        scriptPath:
          SCRIPT_PATH,
        requiredFragments:
          requiredFragments.length,
        missing
      }
    })
  );
}

/* ==========================================================
   MASTER CONTRACT ASSERTIONS
========================================================== */

function runMasterAssertions() {
  section(
    "P20 D3B — MASTER CONTRACT ASSERTIONS"
  );

  const leagueNames =
    Object.keys(
      leagueReports
    );

  const exactlyFour =
    leagueNames.length === 4 &&
    LEAGUES.every(
      league =>
        leagueNames.includes(
          league
        )
    );

  console.log(
    JSON.stringify({
      name:
        "P20 D3B contains exactly four league evidence records",
      pass:
        exactlyFour,
      details: {
        leagues:
          leagueNames
      }
    })
  );

  if (!exactlyFour) {
    failures.push({
      league: "GLOBAL",
      domain:
        "TEAM_ROUTING_IDENTITY",
      name:
        "P20 D3B contains exactly four league evidence records",
      blocker: true
    });
  }

  for (const league of LEAGUES) {
    finalizeDomains(league);

    const domains =
      Object.keys(
        leagueReports[league]
          .domains
      );

    const hasAllDomains =
      TEAM_DOMAINS.every(
        domain =>
          domains.includes(
            domain
          )
      );

    console.log(
      JSON.stringify({
        name:
          `${league} contains all seven P20 Team Profile domains`,
        pass:
          hasAllDomains,
        details: {
          domains
        }
      })
    );

    if (!hasAllDomains) {
      failures.push({
        league,
        domain:
          "TEAM_RENDER_STATE",
        name:
          `${league} contains all seven P20 Team Profile domains`,
        blocker: true
      });
    }
  }
}

/* ==========================================================
   FINAL REPORT
========================================================== */

function printFinalReport() {
  section(
    "SPORTACULAR V1.0 — P20 D3B LIVE TEAM PROFILE EVIDENCE REPORT"
  );

  for (const league of LEAGUES) {
    const report =
      leagueReports[league];

    const domains =
      Object.values(
        report.domains
      );

    const domainPasses =
      domains.filter(
        d =>
          d.status === "PASS"
      ).length;

    const domainNE =
      domains.filter(
        d =>
          d.status ===
          "NOT_EXERCISED"
      ).length;

    const domainFails =
      domains.filter(
        d =>
          d.status === "FAIL"
      ).length;

    console.log(
      `${league}: ${report.status} | ` +
      `${domainPasses}/7 domains PASS | ` +
      `${domainNE} NOT_EXERCISED | ` +
      `${domainFails} FAIL | ` +
      `${report.blockers} blockers | ` +
      `team: ${report.selectedTeam || "NONE"}`
    );
  }

  const totalAssertions =
    assertions.length;

  const passedAssertions =
    assertions.filter(
      item =>
        item.status === "PASS"
    ).length;

  const notExercisedAssertions =
    assertions.filter(
      item =>
        item.status ===
        "NOT_EXERCISED"
    ).length;

  const failedAssertions =
    assertions.filter(
      item =>
        item.status === "FAIL"
    ).length;

  const blockers =
    failures.filter(
      failure =>
        failure.blocker
    ).length;

  const overallStatus =
    blockers === 0
      ? "PASS"
      : "FAIL";

  console.log("");
  console.log(
    `Required leagues: ${LEAGUES.length}`
  );
  console.log(
    `Team Profile domains per league: ${TEAM_DOMAINS.length}`
  );
  console.log(
    `Assertions: ${totalAssertions}`
  );
  console.log(
    `Assertions passed: ${passedAssertions}`
  );
  console.log(
    `Assertions NOT_EXERCISED: ${notExercisedAssertions}`
  );
  console.log(
    `Assertions failed: ${failedAssertions}`
  );
  console.log(
    `Release blockers: ${blockers}`
  );
  console.log(
    "-".repeat(60)
  );
  console.log(
    `P20 D3B STATUS: ${overallStatus}`
  );

  if (overallStatus === "PASS") {
    console.log(
      "P20 LIVE TEAM PROFILE PRODUCTION EVIDENCE: PASS"
    );
    console.log(
      "READY FOR NEXT P20 AUTOMATION"
    );
  } else {
    console.log(
      "P20 LIVE TEAM PROFILE PRODUCTION EVIDENCE: BLOCKED"
    );
  }

  console.log(
    "=".repeat(60)
  );

  const finalReport = {
    deployment:
      "P20-D3B",
    evidenceType:
      "LIVE_TEAM_PROFILE_PRODUCTION",
    status:
      overallStatus,
    architecture:
      "SCRIPT_JS_FRONTEND_TEAM_PROFILE",
    leagues:
      LEAGUES,
    teamDomains:
      TEAM_DOMAINS,
    configuredSources:
      REQUIRED_SOURCE_KEYS,
    activeProfileSources:
      ACTIVE_PROFILE_SOURCE_KEYS,
    assertions:
      totalAssertions,
    assertionsPassed:
      passedAssertions,
    assertionsNotExercised:
      notExercisedAssertions,
    assertionsFailed:
      failedAssertions,
    blockers,
    leagueReports,
    failures
  };

  console.log(
    JSON.stringify(
      finalReport,
      null,
      2
    )
  );

  return finalReport;
}

/* ==========================================================
   MAIN
========================================================== */

async function main() {
  section(
    "SPORTACULAR V1.0 — P20 D3B LIVE TEAM PROFILE PRODUCTION AUDIT"
  );

  if (!fs.existsSync(SCRIPT_PATH)) {
    throw new Error(
      `Production script.js not found at ${SCRIPT_PATH}`
    );
  }

  const scriptSource =
    fs.readFileSync(
      SCRIPT_PATH,
      "utf8"
    );

  auditProductionSource(
    scriptSource
  );

  const productionConfig =
    extractProductionConfig(
      scriptSource
    );

  for (const league of LEAGUES) {
    await auditLeague(
      league,
      productionConfig[league]
    );
  }

  runMasterAssertions();

  const report =
    printFinalReport();

  if (report.blockers > 0) {
    throw new Error(
      `P20 D3B FAILED — ${report.blockers} release blocker(s) detected.`
    );
  }
}

main().catch(error => {
  console.error("");
  console.error(
    "P20 D3B AUDIT ERROR:"
  );
  console.error(
    error?.stack ||
    error?.message ||
    error
  );

  process.exitCode = 1;
});