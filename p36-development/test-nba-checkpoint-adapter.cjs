
const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

console.log(
  "=== P36 D5 STEP 3A.3 — NBA CHECKPOINT ADAPTER TEST ==="
);

const expectedHash =
  "7588e4962e98e6c362dfe41571a8b2f44bb7e3c9001399f6fa69794c18954b51";

const original = fs.readFileSync("nba-appscript");

const hash = value =>
  crypto.createHash("sha256")
    .update(value)
    .digest("hex");

assert.equal(
  hash(original),
  expectedHash
);

const source = original.toString("utf8");

new vm.Script(source);

console.log("PASS | Existing NBA source verified");

const definitions = [
  ...source.matchAll(/^function\s+(\w+)\s*\(/gm)
];

function extractFunction(name) {

  const matches = definitions
    .map((match,index) => ({match,index}))
    .filter(entry => entry.match[1] === name);

  assert.equal(matches.length,1);

  const {match,index} = matches[0];

  return source.slice(
    match.index,
    definitions[index+1]?.index ?? source.length
  );

}

const start = source.indexOf(
  "// ===== P36 NBA CHECKPOINT ADAPTER START ====="
);

const end = source.indexOf(
  "// ===== P36 NBA CHECKPOINT ADAPTER END ====="
);

assert.ok(start >= 0);
assert.ok(end > start);

const installedCode = [

  extractFunction("isValidP36Date_"),

  extractFunction("createNBADailyAnalyticsState_"),

  source.slice(start,end)

].join("\n\n");

const compiled = new vm.Script(installedCode);

console.log(
  "PASS | Installed adapter and P35 constructor extracted"
);

const today = "2026-11-16";
const slateDate = "2026-11-15";
const stateKey = "mock-nba-pipeline-state";

function fixture() {

  const storage = new Map();

  let uuidCounter = 0;

  const f = {

    locked:true,
    writes:0,
    deletes:0,
    readbackMismatch:false

  };

  const lock = {

    hasLock:() => f.locked

  };

  const properties = {

    getProperty:key =>
      storage.has(key)
        ? storage.get(key)
        : null,

    setProperty:(key,value) => {

      assert.equal(f.locked,true);

      f.writes++;

      storage.set(
        key,
        f.readbackMismatch
          ? value + " "
          : value
      );

    },

    deleteProperty:key => {

      f.deletes++;

      storage.delete(key);

    }

  };

  const context = vm.createContext({

    NBA_DAILY_ANALYTICS_PIPELINE:{
      stateKey
    },

    getNBADailyAnalyticsDateKey_:() =>
      today,

    PropertiesService:{
      getScriptProperties:() =>
        properties
    },

    Utilities:{

      getUuid:() =>
        `mock-staging-run-${++uuidCounter}`,

      newBlob:value => ({

        getBytes:() =>
          Buffer.from(value,"utf8")

      })

    }

  });

  compiled.runInContext(context);

  f.validate = state =>
    context.validateP36NBACheckpoint_(state);

  f.construct = () =>
    context.createNBADailyAnalyticsState_();

  f.create = (
    date = slateDate,
    runId = "mock-p36-run"
  ) =>
    context.createP36NBACheckpointLocked_(
      lock,
      date,
      runId
    );

  f.read = () =>
    context.readP36NBACheckpointLocked_(lock);

  f.write = (expectedRaw,candidate) =>
    context.writeP36NBACheckpointLocked_(
      lock,
      expectedRaw,
      candidate
    );

  f.seedRaw = value =>
    storage.set(stateKey,value);

  f.raw = () =>
    storage.get(stateKey) ?? null;

  f.seed = state =>
    f.seedRaw(JSON.stringify(state));

  f.completed = () => ({

    ...f.construct(),

    completed:true,
    stage:"COMPLETE",
    playerTeamIndex:30,
    teamTeamIndex:30

  });

  f.seed(f.completed());

  return f;

}

function expectBlocked(f,action,pattern) {

  const before = f.raw();
  const writes = f.writes;
  const deletes = f.deletes;

  assert.throws(action,pattern);

  assert.equal(f.raw(),before);
  assert.equal(f.writes,writes);
  assert.equal(f.deletes,deletes);

}

const cases = [

  ["Existing P35 checkpoint remains compatible",() => {

    const f = fixture();

    assert.equal(
      f.validate(f.completed()),
      true
    );

  }],

  ["Strict reader preserves exact raw checkpoint",() => {

    const f = fixture();

    assert.equal(f.read().raw,f.raw());
    assert.equal(f.read().exists,true);

  }],

  ["Missing checkpoint is identified explicitly",() => {

    const f = fixture();

    // Use an isolated replacement mock for missing state.

    f.seedRaw(null);

    assert.equal(f.read().exists,false);
    assert.equal(f.read().state,null);

  }],

  ["Corrupted JSON is rejected",() => {

    const f = fixture();

    f.seedRaw("{invalid");

    expectBlocked(
      f,
      f.read,
      /CHECKPOINT_CORRUPTED/
    );

  }],

  ["Invalid checkpoint structure is rejected",() => {

    const f = fixture();

    f.seed({completed:true});

    expectBlocked(
      f,
      f.read,
      /CHECKPOINT_INVALID/
    );

  }],

  ["Reader requires script lock",() => {

    const f = fixture();

    f.locked = false;

    expectBlocked(
      f,
      f.read,
      /SCRIPT_LOCK_REQUIRED/
    );

  }],

  ["Constructor requires script lock",() => {

    const f = fixture();

    f.locked = false;

    expectBlocked(
      f,
      f.create,
      /SCRIPT_LOCK_REQUIRED/
    );

  }],

  ["Writer requires script lock",() => {

    const f = fixture();

    const candidate = f.create();

    f.locked = false;

    expectBlocked(
      f,
      () => f.write(f.raw(),candidate),
      /SCRIPT_LOCK_REQUIRED/
    );

  }],

  ["Fresh checkpoint preserves P35 contract",() => {

    const f = fixture();

    const state = f.create();

    assert.equal(state.stage,"PLAYER_GAME_LOGS");
    assert.equal(state.completed,false);
    assert.equal(state.playerTeamIndex,0);
    assert.equal(state.teamTeamIndex,0);

    assert.equal(
      state.playerGameLogsStagingInitialized,
      false
    );

    assert.equal(
      state.teamGameLogsStagingInitialized,
      false
    );

    assert.equal(
      state.playerGameLogsCompletedTeamIds.length,
      0
    );

    assert.equal(
      state.teamGameLogsCompletedTeamIds.length,
      0
    );

    assert.equal(state.teamGameLogsRunId,null);

    assert.equal(
      Object.keys(
        state.playerGameLogsExpectedRowsByTeamId
      ).length,
      0
    );

    assert.equal(
      Object.keys(
        state.playerGameLogsExpectedFingerprintsByTeamId
      ).length,
      0
    );

    assert.equal(f.writes,0);

  }],

  ["Historical slate retains independent identity",() => {

    const f = fixture();

    const state = f.create();

    assert.equal(state.runDate,today);

    assert.equal(
      state.p36SlateKey,
      `NBA:${slateDate}`
    );

    assert.equal(
      state.p36RunId,
      "mock-p36-run"
    );

  }],

  ["Staging run identifiers remain unique",() => {

    const f = fixture();

    assert.notEqual(
      f.create().playerGameLogsRunId,
      f.create().playerGameLogsRunId
    );

  }],

  ["Invalid slate date is rejected",() => {

    const f = fixture();

    expectBlocked(
      f,
      () => f.create("2026-02-30"),
      /INITIALIZATION_IDENTITY_INVALID/
    );

  }],

  ["Future slate is rejected",() => {

    const f = fixture();

    expectBlocked(
      f,
      () => f.create("2026-11-17"),
      /FRESH_CHECKPOINT_INVALID/
    );

  }],

  ["Empty initialization run ID is rejected",() => {

    const f = fixture();

    expectBlocked(
      f,
      () => f.create(slateDate,""),
      /INITIALIZATION_IDENTITY_INVALID/
    );

  }],

  ["Incomplete P36 identity is rejected",() => {

    const f = fixture();

    const state = f.create();

    delete state.p36SlateKey;

    assert.equal(f.validate(state),false);

  }],

  ["Duplicate team ledger entries are rejected",() => {

    const f = fixture();

    const state = f.create();

    state.playerGameLogsCompletedTeamIds =
      [1,"1"];

    assert.equal(f.validate(state),false);

  }],

  ["Invalid team index is rejected",() => {

    const f = fixture();

    const state = f.create();

    state.playerTeamIndex = 31;

    assert.equal(f.validate(state),false);

  }],

  ["Unfinished checkpoint cannot be replaced",() => {

    const f = fixture();

    f.seed(f.construct());

    const candidate = f.create();

    expectBlocked(
      f,
      () => f.write(f.raw(),candidate),
      /UNFINISHED_CHECKPOINT_PROTECTED/
    );

  }],

  ["Suspended checkpoint cannot be replaced",() => {

    const f = fixture();

    f.seed({

      ...f.completed(),

      suspended:true

    });

    const candidate = f.create();

    expectBlocked(
      f,
      () => f.write(f.raw(),candidate),
      /UNFINISHED_CHECKPOINT_PROTECTED/
    );

  }],

  ["Missing checkpoint cannot authorize replacement",() => {

    const f = fixture();

    f.seedRaw(null);

    const candidate = f.create();

    expectBlocked(
      f,
      () => f.write(null,candidate),
      /EXISTING_CHECKPOINT_REQUIRED/
    );

  }],

  ["Changed raw checkpoint prevents replacement",() => {

    const f = fixture();

    const expectedRaw = f.raw();

    const state = f.completed();

    f.seed(state);

    const candidate = f.create();

    expectBlocked(
      f,
      () => f.write(expectedRaw,candidate),
      /CHECKPOINT_CONCURRENT_MODIFICATION/
    );

  }],

  ["Reused staging run ID prevents replacement",() => {

    const f = fixture();

    const candidate = f.create();

    candidate.playerGameLogsRunId =
      f.read().state.playerGameLogsRunId;

    expectBlocked(
      f,
      () => f.write(f.raw(),candidate),
      /STAGING_RUN_ID_REUSED/
    );

  }],

  ["Same slate cannot initialize a duplicate run",() => {

    const f = fixture();

    const state = {

      ...f.create(),

      completed:true,
      stage:"COMPLETE"

    };

    f.seed(state);

    const candidate =
      f.create(slateDate,"different-run-id");

    expectBlocked(
      f,
      () => f.write(f.raw(),candidate),
      /PIPELINE_IDENTITY_REUSED/
    );

  }],

  ["Reused P36 run ID prevents replacement",() => {

    const f = fixture();

    f.seed({

      ...f.create(),

      completed:true,
      stage:"COMPLETE"

    });

    const candidate =
      f.create(today,"mock-p36-run");

    expectBlocked(
      f,
      () => f.write(f.raw(),candidate),
      /PIPELINE_IDENTITY_REUSED/
    );

  }],

  ["Nonfresh replacement checkpoint is rejected",() => {

    const f = fixture();

    const candidate = f.create();

    candidate.playerTeamIndex = 1;

    expectBlocked(
      f,
      () => f.write(f.raw(),candidate),
      /REPLACEMENT_CHECKPOINT_INVALID/
    );

  }],

  ["Oversized checkpoint is rejected before writing",() => {

    const f = fixture();

    const candidate = f.create();

    candidate.lastError = "x".repeat(9000);

    expectBlocked(
      f,
      () => f.write(f.raw(),candidate),
      /CHECKPOINT_CAPACITY_EXCEEDED/
    );

  }],

  ["Eligible checkpoint is replaced and verified exactly",() => {

    const f = fixture();

    const candidate = f.create();

    const result =
      f.write(f.raw(),candidate);

    assert.equal(
      result.raw,
      JSON.stringify(candidate)
    );

    assert.equal(
      f.raw(),
      JSON.stringify(candidate)
    );

    assert.equal(f.writes,1);
    assert.equal(f.deletes,0);

  }],

  ["Incorrect checkpoint readback is detected",() => {

    const f = fixture();

    const candidate = f.create();

    f.readbackMismatch = true;

    assert.throws(
      () => f.write(f.raw(),candidate),
      /CHECKPOINT_READBACK_MISMATCH/
    );

    assert.equal(f.writes,1);
    assert.equal(f.deletes,0);

  }],

  ["Existing NBA source remains unchanged",() => {

    assert.equal(
      hash(fs.readFileSync("nba-appscript")),
      expectedHash
    );

  }]

];

let passed = 0;

console.log("\n--- CHECKPOINT ADAPTER TESTS ---");

for (const [name,run] of cases) {

  try {

    run();

    passed++;

    console.log(`PASS | ${name}`);

  } catch(error) {

    console.log(
      `FAIL | ${name} | ${error.message}`
    );

  }

}

console.log("\n--- FINAL RESULTS ---");
console.log(`ASSERTIONS: ${cases.length}`);
console.log(`PASS: ${passed}`);
console.log(`FAIL: ${cases.length-passed}`);
console.log("EXECUTION ENVIRONMENT: LOCAL MOCK");
console.log("TEST HARNESS SAVED: YES");
console.log("NBA SOURCE MODIFIED: NO");
console.log("PRODUCTION MODIFIED: NO");
console.log("LIVE API REQUESTS: 0");
console.log("PRODUCTION STATE WRITES: 0");
console.log("PIPELINE RESETS: 0");
console.log("PIPELINE EXECUTIONS: 0");
console.log("TRIGGER CHANGES: 0");

console.log(
  `STATUS: ${passed === cases.length ? "PASS" : "FAIL"}`
);

if (passed !== cases.length) {

  process.exitCode = 1;

}

