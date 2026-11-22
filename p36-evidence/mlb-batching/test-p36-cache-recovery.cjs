"use strict";

const fs = require("fs");
const vm = require("vm");
const crypto = require("crypto");

const path =
  "p36-evidence/mlb-batching/MLB_P36_Production_Batched_Code.js";

const source = fs.readFileSync(path, "utf8");

const expectedHash =
  "c92c96ecbd3a5aa3ebfada4607ef3281b14ec3d0ec261fabee8d37a277c8b17c";

const actualHash = crypto
  .createHash("sha256")
  .update(source)
  .digest("hex");

if (actualHash !== expectedHash) {
  throw new Error("STOP: Patch fingerprint mismatch.");
}

function extract(name) {
  const match = new RegExp(
    "function\\s+" + name + "\\s*\\("
  ).exec(source);

  if (!match) {
    throw new Error("Missing function: " + name);
  }

  const start = match.index;
  const brace = source.indexOf("{", start);

  let depth = 0;

  for (let i = brace; i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}") depth--;

    if (depth === 0) {
      return source.slice(start, i + 1);
    }
  }

  throw new Error("Extraction failed: " + name);
}

const cacheFunction =
  extract("getP36MLBBatchCacheSheet_");

const teams = [
  {id: "1"},
  {id: "2"},
  {id: "3"}
];

const headers = [
  "Run ID",
  "Team ID",
  "Inventory SHA256",
  "Game ID",
  "Stats JSON",
  "Stats SHA256"
];

const runId = "MLB-P36-TEST";

const cacheRow = (id, team) => [
  id,
  team,
  "inventory",
  "game",
  "[]",
  "hash"
];

function runScenario(name, state, cacheRows, expected) {
  let cleared = false;

  const rows = [headers, ...cacheRows];

  const sheet = {
    getLastRow() {
      return rows.length;
    },

    getRange(row, col, count, width) {
      return {
        getValues() {
          return rows
            .slice(row - 1, row - 1 + count)
            .map(r =>
              r.slice(col - 1, col - 1 + width)
            );
        },

        clearContent() {
          cleared = true;
        }
      };
    }
  };

  const context = {
    SpreadsheetApp: {
      getActiveSpreadsheet() {
        return {
          getSheetByName() {
            return sheet;
          }
        };
      }
    },

    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty() {
            return JSON.stringify(state);
          }
        };
      }
    },

    Logger: {
      log() {}
    },

    MLB_DAILY_ANALYTICS_STATE_KEY:
      "MLB_DAILY_ANALYTICS_STATE",

    P36_MLB_PLAYER_STATS_BATCH_CONFIG: {
      storageSheetName: "P36 MLB Player Stats Batch Cache"
    },

    getMLBDailyPlayerGameLogTeams_() {
      return teams;
    },

    getP36MLBPlayerStatsBatchHeaders_() {
      return headers;
    }
  };

  vm.createContext(context);

  vm.runInContext(cacheFunction, context);

  let error = null;

  try {
    vm.runInContext(
      "getP36MLBBatchCacheSheet_()",
      context
    );
  } catch (e) {
    error = String(e.message || e);
  }

  const passed =
    cleared === expected.cleared &&
    Boolean(error) === expected.error;

  console.log(
    `${passed ? "PASS" : "FAIL"} | ${name}`
  );

  console.log(
    `  Cache cleared: ${cleared}`
  );

  console.log(
    `  Error: ${error || "none"}`
  );

  return passed;
}

const scenarios = [
  {
    name: "Active-team cache preserved",
    state: {
      stage: "PLAYER_GAME_LOGS",
      playerTeamIndex: 1,
      teamTeamIndex: 0,
      p36BatchRunId: runId
    },
    rows: [cacheRow(runId, "2")],
    expected: {cleared: false, error: false}
  },

  {
    name: "Completed-team cache recovered",
    state: {
      stage: "PLAYER_GAME_LOGS",
      playerTeamIndex: 2,
      teamTeamIndex: 0,
      p36BatchRunId: runId
    },
    rows: [cacheRow(runId, "2")],
    expected: {cleared: true, error: false}
  },

  {
    name: "Unknown-team cache rejected",
    state: {
      stage: "PLAYER_GAME_LOGS",
      playerTeamIndex: 1,
      teamTeamIndex: 0,
      p36BatchRunId: runId
    },
    rows: [cacheRow(runId, "999")],
    expected: {cleared: false, error: true}
  },

  {
    name: "Mixed identities rejected",
    state: {
      stage: "PLAYER_GAME_LOGS",
      playerTeamIndex: 1,
      teamTeamIndex: 0,
      p36BatchRunId: runId
    },
    rows: [
      cacheRow(runId, "1"),
      cacheRow(runId, "2")
    ],
    expected: {cleared: false, error: true}
  },

  {
    name: "Unexpected stage transition protected",
    state: {
      stage: "PLAYER_GAME_LOGS",
      playerTeamIndex: 0,
      teamTeamIndex: 0,
      p36BatchRunId: runId
    },
    rows: [cacheRow(runId + "-TEAM", "2")],
    expected: {cleared: false, error: true}
  },

  {
    name: "Verified forward-stage cleanup",
    state: {
      stage: "TEAM_GAME_LOGS",
      playerTeamIndex: 3,
      teamTeamIndex: 0,
      p36BatchRunId: runId
    },
    rows: [cacheRow(runId, "3")],
    expected: {cleared: true, error: false}
  }
];

console.log(
  "=== P36 MLB STEP 4N — FINAL CACHE RECOVERY QA ===\n"
);

let passed = 0;

for (const scenario of scenarios) {
  if (
    runScenario(
      scenario.name,
      scenario.state,
      scenario.rows,
      scenario.expected
    )
  ) {
    passed++;
  }
}

console.log(
  `\nRESULT: ${passed}/${scenarios.length} PASS`
);

console.log(
  "STATUS:",
  passed === scenarios.length
    ? "CACHE RECOVERY QA PASS"
    : "CACHE RECOVERY QA FAILED"
);

if (passed !== scenarios.length) {
  process.exitCode = 1;
}
