
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const crypto = require("node:crypto");

const sourcePath = "nba-appscript";

const expectedHash = "26dbd8ec7313b3c245b53d9948b8f57530cb636942db2d2c89ca06ee0412108d";

const hash = value => crypto
  .createHash("sha256")
  .update(value)
  .digest("hex");

assert.equal(
  hash(fs.readFileSync(sourcePath)),
  expectedHash
);

let uuid = 0;

const context = vm.createContext({

  Date,

  getNBADailyAnalyticsDateKey_:() =>
    "2026-11-16",

  Utilities:{

    getUuid:() => `mock-run-${++uuid}`

  }

});

vm.runInContext(
  "function isValidP36Date_(value) {\n\n  return (\n    typeof value === \"string\" &&\n    /^\\d{4}-\\d{2}-\\d{2}$/.test(value) &&\n    Number.isFinite(Date.parse(value)) &&\n    new Date(value).toISOString().slice(0,10) === value\n  );\n\n}\n\nfunction validateP36NBACheckpoint_(state) {\n\n  if (\n    !state ||\n    typeof state !== \"object\" ||\n    Array.isArray(state)\n  ) {\n    return false;\n  }\n\n  if (\n    !isValidP36Date_(state.runDate) ||\n    typeof state.completed !== \"boolean\" ||\n    typeof state.stage !== \"string\" ||\n    !state.stage.trim()\n  ) {\n    return false;\n  }\n\n  if (\n    state.completed !==\n    (state.stage === \"COMPLETE\")\n  ) {\n    return false;\n  }\n\n  if (\n    state.suspended !== undefined &&\n    typeof state.suspended !== \"boolean\"\n  ) {\n    return false;\n  }\n\n  if (\n    typeof state.playerGameLogsRunId !== \"string\" ||\n    !state.playerGameLogsRunId.trim()\n  ) {\n    return false;\n  }\n\n  for (const key of [\n    \"playerTeamIndex\",\n    \"teamTeamIndex\"\n  ]) {\n\n    if (\n      !Number.isSafeInteger(state[key]) ||\n      state[key] < 0 ||\n      state[key] > 30\n    ) {\n      return false;\n    }\n\n  }\n\n  for (const key of [\n    \"playerGameLogsCompletedTeamIds\",\n    \"teamGameLogsCompletedTeamIds\"\n  ]) {\n\n    if (!Array.isArray(state[key])) {\n      return false;\n    }\n\n    if (\n      state[key].length > 30 ||\n      new Set(state[key].map(String)).size !==\n      state[key].length\n    ) {\n      return false;\n    }\n\n  }\n\n  for (const key of [\n    \"playerGameLogsExpectedRowsByTeamId\",\n    \"playerGameLogsExpectedFingerprintsByTeamId\"\n  ]) {\n\n    if (\n      !state[key] ||\n      typeof state[key] !== \"object\" ||\n      Array.isArray(state[key])\n    ) {\n      return false;\n    }\n\n  }\n\n  for (const key of [\n    \"playerGameLogsStagingInitialized\",\n    \"teamGameLogsStagingInitialized\"\n  ]) {\n\n    if (typeof state[key] !== \"boolean\") {\n      return false;\n    }\n\n  }\n\n  const hasRunId =\n    state.p36RunId !== undefined;\n\n  const hasSlateKey =\n    state.p36SlateKey !== undefined;\n\n  if (hasRunId !== hasSlateKey) {\n    return false;\n  }\n\n  if (hasRunId) {\n\n    if (\n      typeof state.p36RunId !== \"string\" ||\n      !state.p36RunId.trim() ||\n      typeof state.p36SlateKey !== \"string\" ||\n      !state.p36SlateKey.startsWith(\"NBA:\")\n    ) {\n      return false;\n    }\n\n    const slateDate =\n      state.p36SlateKey.slice(4);\n\n    if (\n      !isValidP36Date_(slateDate) ||\n      slateDate > state.runDate\n    ) {\n      return false;\n    }\n\n  }\n\n  return true;\n\n}\n\nfunction validateP35NBAPlayerGameLogsCompletionLedger_(\n  state,\n  playerTeams\n) {\n  if (\n    !state ||\n    !Array.isArray(playerTeams) ||\n    playerTeams.length !== 30\n  ) {\n    throw new Error(\n      \"P35 NBA D4B: Invalid pipeline state or NBA team queue.\"\n    );\n  }\n\n  if (\n    !Array.isArray(\n      state.playerGameLogsCompletedTeamIds\n    )\n  ) {\n    throw new Error(\n      \"P35 NBA D4B: Completion ledger is missing.\"\n    );\n  }\n\n  const expectedIds = playerTeams.map(\n    team => Number(team.id)\n  );\n\n  const completedIds =\n    state.playerGameLogsCompletedTeamIds.map(\n      id => Number(id)\n    );\n\n  if (\n    expectedIds.some(\n      id => !Number.isSafeInteger(id) || id <= 0\n    ) ||\n    new Set(expectedIds).size !== 30\n  ) {\n    throw new Error(\n      \"P35 NBA D4B: Expected NBA team IDs are invalid or duplicated.\"\n    );\n  }\n\n  if (\n    completedIds.length !== 30 ||\n    completedIds.some(\n      id => !Number.isSafeInteger(id) || id <= 0\n    ) ||\n    new Set(completedIds).size !== 30\n  ) {\n    throw new Error(\n      \"P35 NBA D4B: Completion ledger does not contain 30 unique valid team IDs.\"\n    );\n  }\n\n  const expectedSet =\n    new Set(expectedIds);\n\n  const missingIds =\n    expectedIds.filter(\n      id => !completedIds.includes(id)\n    );\n\n  const unexpectedIds =\n    completedIds.filter(\n      id => !expectedSet.has(id)\n    );\n\n  if (\n    missingIds.length ||\n    unexpectedIds.length\n  ) {\n    throw new Error(\n      \"P35 NBA D4B: Completion ledger team mismatch. \" +\n      `Missing=${missingIds.join(\",\") || \"none\"}; ` +\n      `Unexpected=${unexpectedIds.join(\",\") || \"none\"}.`\n    );\n  }\n\n  if (\n    Number(state.playerTeamIndex) !== 30\n  ) {\n    throw new Error(\n      \"P35 NBA D4B: Pipeline team index is not 30.\"\n    );\n  }\n\n  return {\n    valid: true,\n    expectedTeamCount: 30,\n    completedTeamCount: 30,\n    runId: String(\n      state.playerGameLogsRunId || \"\"\n    )\n  };\n}\n\nfunction validateP35NBAPlayerGameLogsResumeState_(\n  state,\n  playerTeams\n) {\n\n  function reject(message) {\n    throw new Error(\n      \"P35 NBA D4B: Resume state invalid. \" +\n      message\n    );\n  }\n\n  if (\n    !state ||\n    typeof state !== \"object\" ||\n    Array.isArray(state)\n  ) {\n    reject(\"Missing or invalid state.\");\n  }\n\n  if (\n    !Array.isArray(playerTeams) ||\n    playerTeams.length !== 30\n  ) {\n    reject(\"Expected exactly 30 NBA teams.\");\n  }\n\n  const runId =\n    String(state.playerGameLogsRunId || \"\").trim();\n\n  if (!runId) {\n    reject(\"Missing run ID.\");\n  }\n\n  const completed =\n    state.playerGameLogsCompletedTeamIds;\n\n  if (!Array.isArray(completed)) {\n    reject(\"Missing completed-team ledger.\");\n  }\n\n  const rowLedger =\n    state.playerGameLogsExpectedRowsByTeamId;\n\n  const fingerprintLedger =\n    state.playerGameLogsExpectedFingerprintsByTeamId;\n\n  if (\n    !rowLedger ||\n    typeof rowLedger !== \"object\" ||\n    Array.isArray(rowLedger)\n  ) {\n    reject(\"Invalid row-count ledger.\");\n  }\n\n  if (\n    !fingerprintLedger ||\n    typeof fingerprintLedger !== \"object\" ||\n    Array.isArray(fingerprintLedger)\n  ) {\n    reject(\"Invalid fingerprint ledger.\");\n  }\n\n  const teamIndex =\n    Number(state.playerTeamIndex);\n\n  if (\n    !Number.isInteger(teamIndex) ||\n    teamIndex < 0 ||\n    teamIndex > 30\n  ) {\n    reject(\"Invalid team index.\");\n  }\n\n  if (completed.length !== teamIndex) {\n    reject(\n      \"Team index and completion count disagree.\"\n    );\n  }\n\n  const teamIds =\n    playerTeams.map(team => String(team.id));\n\n  if (\n    new Set(teamIds).size !== 30\n  ) {\n    reject(\"Duplicate team IDs in team list.\");\n  }\n\n  const expectedCompletedIds =\n    teamIds.slice(0, teamIndex);\n\n  const completedIds =\n    completed.map(id => String(id));\n\n  if (\n    new Set(completedIds).size !==\n    completedIds.length\n  ) {\n    reject(\"Duplicate completed-team IDs.\");\n  }\n\n  for (\n    let i = 0;\n    i < expectedCompletedIds.length;\n    i++\n  ) {\n    if (\n      completedIds[i] !==\n      expectedCompletedIds[i]\n    ) {\n      reject(\n        \"Completed-team order does not match team queue.\"\n      );\n    }\n  }\n\n  const expectedIdSet =\n    new Set(expectedCompletedIds);\n\n  const rowKeys =\n    Object.keys(rowLedger);\n\n  const fingerprintKeys =\n    Object.keys(fingerprintLedger);\n\n  if (\n    rowKeys.length !== teamIndex ||\n    fingerprintKeys.length !== teamIndex\n  ) {\n    reject(\n      \"Evidence-ledger sizes disagree with progress.\"\n    );\n  }\n\n  for (const key of rowKeys) {\n    if (!expectedIdSet.has(key)) {\n      reject(\n        \"Unexpected team in row-count ledger.\"\n      );\n    }\n\n    if (\n      !Number.isInteger(rowLedger[key]) ||\n      rowLedger[key] <= 0\n    ) {\n      reject(\n        \"Invalid expected row count.\"\n      );\n    }\n  }\n\n  for (const key of fingerprintKeys) {\n    if (!expectedIdSet.has(key)) {\n      reject(\n        \"Unexpected team in fingerprint ledger.\"\n      );\n    }\n\n    if (\n      typeof fingerprintLedger[key] !== \"string\" ||\n      !/^[a-f0-9]{64}$/.test(\n        fingerprintLedger[key]\n      )\n    ) {\n      reject(\n        \"Invalid SHA-256 fingerprint.\"\n      );\n    }\n  }\n\n  return {\n    valid: true,\n    runId: runId,\n    teamIndex: teamIndex,\n    completedTeams: completed.length,\n    rowLedgerEntries: rowKeys.length,\n    fingerprintLedgerEntries:\n      fingerprintKeys.length\n  };\n}\n\nfunction validateP36NBACompletedCheckpoint_(\n  state,\n  playerTeams\n) {\n\n  const reject = reason => ({\n    valid:false,\n    reason\n  });\n\n  if (!validateP36NBACheckpoint_(state)) {\n\n    return reject(\n      \"INVALID_CHECKPOINT\"\n    );\n\n  }\n\n  if (\n    state.completed !== true ||\n    state.stage !== \"COMPLETE\"\n  ) {\n\n    return reject(\n      \"CHECKPOINT_NOT_COMPLETE\"\n    );\n\n  }\n\n  if (state.suspended === true) {\n\n    return reject(\n      \"CHECKPOINT_SUSPENDED\"\n    );\n\n  }\n\n  if (state.lastError !== null) {\n\n    return reject(\n      \"UNRESOLVED_PIPELINE_ERROR\"\n    );\n\n  }\n\n  if (\n    state.lastSuccessfulStep !==\n    \"TOP_TEAM_TRENDS\"\n  ) {\n\n    return reject(\n      \"FINAL_PIPELINE_STEP_NOT_VERIFIED\"\n    );\n\n  }\n\n  if (\n    state.playerTeamIndex !== 30 ||\n    state.teamTeamIndex !== 30\n  ) {\n\n    return reject(\n      \"INCOMPLETE_TEAM_QUEUE\"\n    );\n\n  }\n\n  if (\n    state.playerGameLogsStagingInitialized !== true ||\n    state.teamGameLogsStagingInitialized !== true\n  ) {\n\n    return reject(\n      \"STAGING_INITIALIZATION_NOT_VERIFIED\"\n    );\n\n  }\n\n  if (\n    typeof state.teamGameLogsRunId !== \"string\" ||\n    !state.teamGameLogsRunId.trim() ||\n    state.teamGameLogsRunId === state.playerGameLogsRunId\n  ) {\n\n    return reject(\n      \"INVALID_TEAM_LOGS_RUN_ID\"\n    );\n\n  }\n\n  if (\n    !Array.isArray(playerTeams) ||\n    playerTeams.length !== 30 ||\n    playerTeams.some(team =>\n      !team ||\n      !Number.isSafeInteger(Number(team.id)) ||\n      Number(team.id) <= 0\n    )\n  ) {\n\n    return reject(\n      \"INVALID_AUTHORITATIVE_TEAM_QUEUE\"\n    );\n\n  }\n\n  const expectedIds =\n    playerTeams.map(team => String(team.id));\n\n  if (\n    new Set(expectedIds).size !== 30 ||\n    new Set(expectedIds.map(Number)).size !== 30\n  ) {\n\n    return reject(\n      \"DUPLICATE_AUTHORITATIVE_TEAM_IDS\"\n    );\n\n  }\n\n  let playerCompletion;\n  let playerResume;\n\n  try {\n\n    playerCompletion =\n      validateP35NBAPlayerGameLogsCompletionLedger_(\n        state,\n        playerTeams\n      );\n\n    playerResume =\n      validateP35NBAPlayerGameLogsResumeState_(\n        state,\n        playerTeams\n      );\n\n  } catch (error) {\n\n    return {\n\n      valid:false,\n\n      reason:\"INVALID_PLAYER_COMPLETION_EVIDENCE\",\n\n      detail:String(\n        error && error.message\n          ? error.message\n          : error\n      )\n\n    };\n\n  }\n\n  if (\n    !playerCompletion ||\n    playerCompletion.valid !== true ||\n    playerCompletion.expectedTeamCount !== 30 ||\n    playerCompletion.completedTeamCount !== 30 ||\n    playerCompletion.runId !== state.playerGameLogsRunId ||\n    !playerResume ||\n    playerResume.valid !== true ||\n    playerResume.runId !== state.playerGameLogsRunId ||\n    playerResume.teamIndex !== 30 ||\n    playerResume.completedTeams !== 30 ||\n    playerResume.rowLedgerEntries !== 30 ||\n    playerResume.fingerprintLedgerEntries !== 30\n  ) {\n\n    return reject(\n      \"PLAYER_COMPLETION_EVIDENCE_NOT_VERIFIED\"\n    );\n\n  }\n\n  const completedTeamIds =\n    state.teamGameLogsCompletedTeamIds.map(String);\n\n  if (\n    completedTeamIds.length !== 30 ||\n    new Set(completedTeamIds).size !== 30\n  ) {\n\n    return reject(\n      \"INVALID_TEAM_COMPLETION_LEDGER\"\n    );\n\n  }\n\n  if (\n    completedTeamIds.some(\n      (id,index) => id !== expectedIds[index]\n    )\n  ) {\n\n    return reject(\n      \"TEAM_COMPLETION_ORDER_MISMATCH\"\n    );\n\n  }\n\n  return {\n\n    valid:true,\n\n    reason:\"COMPLETED_CHECKPOINT_VERIFIED\",\n\n    playerTeamsCompleted:30,\n\n    teamTeamsCompleted:30,\n\n    playerRowLedgerEntries:\n      playerResume.rowLedgerEntries,\n\n    playerFingerprintLedgerEntries:\n      playerResume.fingerprintLedgerEntries,\n\n    playerGameLogsRunId:\n      state.playerGameLogsRunId,\n\n    teamGameLogsRunId:\n      state.teamGameLogsRunId,\n\n    lastSuccessfulStep:\n      state.lastSuccessfulStep,\n\n    runDate:\n      state.runDate\n\n  };\n\n}\n\nfunction createNBADailyAnalyticsState_() {\n\n  /*\n   * P35 NBA D4B\n   *\n   * Every newly created pipeline state receives\n   * a unique run identifier.\n   *\n   * This identifier will later be used to tie\n   * team completion evidence to the correct\n   * Player Game Logs staging run.\n   */\n\n  return {\n    runDate:\n      getNBADailyAnalyticsDateKey_(),\n\n    playerGameLogsRunId:\n      Utilities.getUuid(),\n\n    playerGameLogsCompletedTeamIds:\n      [],\n\n    /*\n     * P35 NBA D4B \u2014 STEP 3L\n     *\n     * Store the expected number of staged\n     * player-game records for each NBA team.\n     *\n     * Populated only after successful staging\n     * in a later controlled step.\n     */\n    playerGameLogsExpectedRowsByTeamId:\n      {},\n\n    /*\n     * P35 NBA D4B \u2014 STEP 3Q\n     *\n     * Store a SHA-256 fingerprint for each\n     * team's successfully staged player-game rows.\n     *\n     * The fingerprint ledger belongs to the\n     * current pipeline run.\n     *\n     * Fingerprints will be populated in a\n     * subsequent controlled step.\n     */\n    playerGameLogsExpectedFingerprintsByTeamId:\n      {},\n\n    playerGameLogsStagingInitialized:\n      false,\n\n    stage:\n      \"PLAYER_GAME_LOGS\",\n\n    playerTeamIndex:\n      0,\n\n    teamTeamIndex:\n      0,\n\n    teamGameLogsRunId:\n      null,\n\n    teamGameLogsStagingInitialized:\n      false,\n\n    teamGameLogsCompletedTeamIds:\n      [],\n\n    completed:\n      false,\n\n    lastSuccessfulStep:\n      null,\n\n    lastError:\n      null,\n\n    updatedAt:\n      new Date().toISOString()\n  };\n}",
  context
);

function fixture() {

  // Synthetic authoritative team queue.
  // No production API requests.

  const teams = Array.from(
    {length:30},
    (_,index) => ({
      id:index+1,
      fullName:`Mock NBA Team ${index+1}`
    })
  );

  const ids = teams.map(team => team.id);

  const rows = Object.fromEntries(
    ids.map(id => [String(id),100+id])
  );

  const fingerprints = Object.fromEntries(
    ids.map(id => [
      String(id),
      hash(`mock-team-evidence-${id}`)
    ])
  );

  const state = {

    ...context.createNBADailyAnalyticsState_(),

    completed:true,
    stage:"COMPLETE",
    suspended:false,

    playerTeamIndex:30,
    teamTeamIndex:30,

    playerGameLogsStagingInitialized:true,
    teamGameLogsStagingInitialized:true,

    playerGameLogsCompletedTeamIds:[...ids],

    teamGameLogsCompletedTeamIds:[...ids],

    playerGameLogsExpectedRowsByTeamId:rows,

    playerGameLogsExpectedFingerprintsByTeamId:
      fingerprints,

    teamGameLogsRunId:`mock-team-run-${++uuid}`,

    lastSuccessfulStep:"TOP_TEAM_TRENDS",

    lastError:null

  };

  return {state,teams};

}

function validate(state,teams) {

  return context.validateP36NBACompletedCheckpoint_(
    state,teams
  );

}

const cases = [];

function test(name,fn) {

  cases.push([name,fn]);

}

function rejectCase(name,mutate,reason) {

  test(name,() => {

    const {state,teams} = fixture();

    mutate(state,teams);

    const before = JSON.stringify({state,teams});

    const result = validate(state,teams);

    assert.equal(result.valid,false);

    if (reason) {

      assert.equal(result.reason,reason);

    }

    assert.equal(
      JSON.stringify({state,teams}),
      before,
      "Validation mutated its input"
    );

  });

}

test("Valid completed legacy checkpoint",() => {

  const {state,teams} = fixture();

  const result = validate(state,teams);

  assert.equal(result.valid,true);

  assert.equal(
    result.reason,
    "COMPLETED_CHECKPOINT_VERIFIED"
  );

  assert.equal(result.playerTeamsCompleted,30);
  assert.equal(result.teamTeamsCompleted,30);
  assert.equal(result.playerRowLedgerEntries,30);
  assert.equal(result.playerFingerprintLedgerEntries,30);

});

test("Valid P36 assigned completed checkpoint",() => {

  const {state,teams} = fixture();

  state.p36RunId = "mock-p36-run";

  state.p36SlateKey = "NBA:2026-11-15";

  assert.equal(
    validate(state,teams).valid,
    true
  );

});

test("Legacy checkpoint without suspended field",() => {

  const {state,teams} = fixture();

  delete state.suspended;

  assert.equal(
    validate(state,teams).valid,
    true
  );

});

rejectCase(
  "Incomplete pipeline rejected",
  state => {
    state.completed = false;
    state.stage = "PLAYER_GAME_LOGS";
  },
  "CHECKPOINT_NOT_COMPLETE"
);

rejectCase(
  "Inconsistent completed flag rejected",
  state => {
    state.completed = false;
  },
  "INVALID_CHECKPOINT"
);

rejectCase(
  "Suspended pipeline rejected",
  state => {
    state.suspended = true;
  },
  "CHECKPOINT_SUSPENDED"
);

rejectCase(
  "Unresolved pipeline error rejected",
  state => {
    state.lastError = "Mock pipeline failure";
  },
  "UNRESOLVED_PIPELINE_ERROR"
);

rejectCase(
  "Missing error status rejected",
  state => {
    delete state.lastError;
  },
  "UNRESOLVED_PIPELINE_ERROR"
);

rejectCase(
  "Incorrect final downstream stage rejected",
  state => {
    state.lastSuccessfulStep = "TOP_PLAYER_TRENDS";
  },
  "FINAL_PIPELINE_STEP_NOT_VERIFIED"
);

rejectCase(
  "Incomplete player queue rejected",
  state => {
    state.playerTeamIndex = 29;
  },
  "INCOMPLETE_TEAM_QUEUE"
);

rejectCase(
  "Incomplete team queue rejected",
  state => {
    state.teamTeamIndex = 29;
  },
  "INCOMPLETE_TEAM_QUEUE"
);

rejectCase(
  "Uninitialized player staging rejected",
  state => {
    state.playerGameLogsStagingInitialized = false;
  },
  "STAGING_INITIALIZATION_NOT_VERIFIED"
);

rejectCase(
  "Uninitialized team staging rejected",
  state => {
    state.teamGameLogsStagingInitialized = false;
  },
  "STAGING_INITIALIZATION_NOT_VERIFIED"
);

rejectCase(
  "Missing player run identifier rejected",
  state => {
    state.playerGameLogsRunId = "";
  },
  "INVALID_CHECKPOINT"
);

rejectCase(
  "Missing team run identifier rejected",
  state => {
    state.teamGameLogsRunId = null;
  },
  "INVALID_TEAM_LOGS_RUN_ID"
);

rejectCase(
  "Reused staging run identifier rejected",
  state => {
    state.teamGameLogsRunId =
      state.playerGameLogsRunId;
  },
  "INVALID_TEAM_LOGS_RUN_ID"
);

rejectCase(
  "Incomplete authoritative team queue rejected",
  (state,teams) => {
    teams.pop();
  },
  "INVALID_AUTHORITATIVE_TEAM_QUEUE"
);

rejectCase(
  "Invalid authoritative team ID rejected",
  (state,teams) => {
    teams[0].id = 0;
  },
  "INVALID_AUTHORITATIVE_TEAM_QUEUE"
);

rejectCase(
  "Duplicate authoritative team ID rejected",
  (state,teams) => {
    teams[1].id = teams[0].id;
  },
  "DUPLICATE_AUTHORITATIVE_TEAM_IDS"
);

rejectCase(
  "Missing player completion entry rejected",
  state => {
    state.playerGameLogsCompletedTeamIds.pop();
  },
  "INVALID_PLAYER_COMPLETION_EVIDENCE"
);

rejectCase(
  "Duplicate player completion entry rejected",
  state => {
    state.playerGameLogsCompletedTeamIds[1] =
      state.playerGameLogsCompletedTeamIds[0];
  },
  "INVALID_CHECKPOINT"
);

rejectCase(
  "Unexpected player completion ID rejected",
  state => {
    state.playerGameLogsCompletedTeamIds[0] = 999;
  },
  "INVALID_PLAYER_COMPLETION_EVIDENCE"
);

rejectCase(
  "Reversed player completion order rejected",
  state => {
    state.playerGameLogsCompletedTeamIds.reverse();
  },
  "INVALID_PLAYER_COMPLETION_EVIDENCE"
);

rejectCase(
  "Missing player row count rejected",
  state => {
    delete state.playerGameLogsExpectedRowsByTeamId["1"];
  },
  "INVALID_PLAYER_COMPLETION_EVIDENCE"
);

rejectCase(
  "Zero player row count rejected",
  state => {
    state.playerGameLogsExpectedRowsByTeamId["1"] = 0;
  },
  "INVALID_PLAYER_COMPLETION_EVIDENCE"
);

rejectCase(
  "Negative player row count rejected",
  state => {
    state.playerGameLogsExpectedRowsByTeamId["1"] = -1;
  },
  "INVALID_PLAYER_COMPLETION_EVIDENCE"
);

rejectCase(
  "Unexpected row-count ledger entry rejected",
  state => {
    state.playerGameLogsExpectedRowsByTeamId["999"] = 100;
  },
  "INVALID_PLAYER_COMPLETION_EVIDENCE"
);

rejectCase(
  "Missing fingerprint rejected",
  state => {
    delete state.playerGameLogsExpectedFingerprintsByTeamId["1"];
  },
  "INVALID_PLAYER_COMPLETION_EVIDENCE"
);

rejectCase(
  "Malformed SHA-256 fingerprint rejected",
  state => {
    state.playerGameLogsExpectedFingerprintsByTeamId["1"] =
      "invalid-fingerprint";
  },
  "INVALID_PLAYER_COMPLETION_EVIDENCE"
);

rejectCase(
  "Unexpected fingerprint ledger entry rejected",
  state => {
    state.playerGameLogsExpectedFingerprintsByTeamId["999"] =
      hash("unexpected");
  },
  "INVALID_PLAYER_COMPLETION_EVIDENCE"
);

rejectCase(
  "Missing team completion entry rejected",
  state => {
    state.teamGameLogsCompletedTeamIds.pop();
  },
  "INVALID_TEAM_COMPLETION_LEDGER"
);

rejectCase(
  "Duplicate team completion entry rejected",
  state => {
    state.teamGameLogsCompletedTeamIds[1] =
      state.teamGameLogsCompletedTeamIds[0];
  },
  "INVALID_CHECKPOINT"
);

rejectCase(
  "Unexpected team completion ID rejected",
  state => {
    state.teamGameLogsCompletedTeamIds[0] = 999;
  },
  "TEAM_COMPLETION_ORDER_MISMATCH"
);

rejectCase(
  "Reversed team completion order rejected",
  state => {
    state.teamGameLogsCompletedTeamIds.reverse();
  },
  "TEAM_COMPLETION_ORDER_MISMATCH"
);

rejectCase(
  "Incomplete P36 assignment rejected",
  state => {
    state.p36RunId = "mock-assignment";
  },
  "INVALID_CHECKPOINT"
);

rejectCase(
  "Future slate relative to run date rejected",
  state => {
    state.p36RunId = "mock-assignment";
    state.p36SlateKey = "NBA:2026-11-17";
  },
  "INVALID_CHECKPOINT"
);

test("Successful validation preserves all inputs",() => {

  const {state,teams} = fixture();

  const before = JSON.stringify({state,teams});

  assert.equal(validate(state,teams).valid,true);

  assert.equal(
    JSON.stringify({state,teams}),
    before
  );

});

test("Missing checkpoint rejected",() => {

  const {teams} = fixture();

  assert.equal(
    validate(null,teams).reason,
    "INVALID_CHECKPOINT"
  );

});

test("Missing authoritative queue rejected",() => {

  const {state} = fixture();

  assert.equal(
    validate(state,null).reason,
    "INVALID_AUTHORITATIVE_TEAM_QUEUE"
  );

});

test("Repeated validation remains deterministic",() => {

  const {state,teams} = fixture();

  const first = validate(state,teams);

  const second = validate(state,teams);

  assert.equal(first.valid,true);

  assert.deepEqual(first,second);

});

let passed = 0;

for (const [name,fn] of cases) {

  try {

    fn();

    passed++;

  } catch (error) {

    console.log("FAIL | "+name);
    console.log(String(error.stack || error));

  }

}

assert.equal(
  hash(fs.readFileSync(sourcePath)),
  expectedHash
);

console.log("ASSERTIONS:",cases.length);
console.log("PASS:",passed);
console.log("FAIL:",cases.length-passed);
console.log("EXECUTION ENVIRONMENT: LOCAL SYNTHETIC");

console.log(
  "STATUS:",
  passed === cases.length ? "PASS" : "FAIL"
);

if (passed !== cases.length) {

  process.exitCode = 1;

}
