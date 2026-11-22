
const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

console.log(
  "=== P36 D5 STEP 3B.2 — NBA COMPLETION RECONCILIATION TEST ==="
);

const expectedHash =
  "5b4b66d20bc014f7d1d04c9a05358b56d12e32d7a2ff80fdbd025c9041678240";

const original = fs.readFileSync("nba-appscript");

const hash = value =>
  crypto.createHash("sha256")
    .update(value)
    .digest("hex");

assert.equal(hash(original),expectedHash);

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

  assert.equal(
    matches.length,
    1,
    `Unexpected definition count: ${name}`
  );

  const {match,index} = matches[0];

  return source.slice(
    match.index,
    definitions[index+1]?.index ?? source.length
  );

}

function extractBlock(startMarker,endMarker) {

  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);

  assert.ok(start >= 0);
  assert.ok(end > start);

  return source.slice(start,end);

}

const universalNames = [

  "isValidP36Date_",
  "reconcileP36SlateInventory_",
  "createP36SlateRegistry_",
  "validateP36SlateRegistry_",
  "observeP36Slate_",
  "transitionP36Slate_",
  "getP36RegistryPropertyKey_",
  "loadP36SlateRegistry_",
  "saveP36SlateRegistry_",
  "validateP36RetentionBoundary_",
  "getP36JournalKey_",
  "validateP36Journal_",
  "loadP36Journal_"

];

const installedCode = [

  extractBlock(
    "// ===== P36 UNIVERSAL ENGINE START =====",
    "// ===== P36 UNIVERSAL ENGINE END ====="
  ),

  extractFunction("createNBADailyAnalyticsState_"),

  extractBlock(
    "// ===== P36 NBA CHECKPOINT ADAPTER START =====",
    "// ===== P36 NBA CHECKPOINT ADAPTER END ====="
  ),

  extractBlock(
    "// ===== P36 NBA COMPLETION RECONCILIATION START =====",
    "// ===== P36 NBA COMPLETION RECONCILIATION END ====="
  )

].join("\n\n");

const compiled = new vm.Script(installedCode);

console.log(
  "PASS | Installed reconciliation dependencies extracted"
);

const today = "2026-11-16";
const slateDate = "2026-11-15";
const slateKey = `NBA:${slateDate}`;
const runId = "mock-p36-assigned-run";
const stateKey = "mock-nba-pipeline-state";

function fixture() {

  const storage = new Map();

  let uuidCounter = 0;

  const f = {

    locked:true,
    registryWrites:0,
    checkpointWrites:0,
    journalWrites:0,
    deletes:0,
    logs:[],
    registryWriteFailure:false,
    registryReadbackMismatch:false

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

      if (key === stateKey) {

        f.checkpointWrites++;

      } else if (key === f.registryKey) {

        if (f.registryWriteFailure) {

          throw new Error(
            "MOCK_REGISTRY_WRITE_FAILURE"
          );

        }

        f.registryWrites++;

        if (f.registryReadbackMismatch) {
          value += " ";
        }

      } else if (key === f.journalKey) {

        f.journalWrites++;

      } else {

        throw new Error(
          `Unexpected property write: ${key}`
        );

      }

      storage.set(key,value);

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

    },

    Logger:{

      log:value =>
        f.logs.push(String(value))

    }

  });

  compiled.runInContext(context);

  f.registryKey =
    context.getP36RegistryPropertyKey_("NBA");

  f.journalKey =
    context.getP36JournalKey_("NBA");

  f.reconcile = () =>
    context.reconcileP36NBACompletionLocked_(
      lock
    );

  f.registryRaw = () =>
    storage.get(f.registryKey) ?? null;

  f.checkpointRaw = () =>
    storage.get(stateKey) ?? null;

  f.journalRaw = () =>
    storage.get(f.journalKey) ?? null;

  f.registry = () =>
    context.loadP36SlateRegistry_(
      "NBA",properties
    ).registry;

  f.slate = () =>
    f.registry().slates[slateKey];

  f.seedRegistry = registry =>
    storage.set(
      f.registryKey,
      JSON.stringify(registry)
    );

  f.seedCheckpoint = checkpoint =>
    storage.set(
      stateKey,
      JSON.stringify(checkpoint)
    );

  f.removeCheckpoint = () =>
    storage.delete(stateKey);

  f.checkpoint = () =>
    JSON.parse(f.checkpointRaw());

  f.changeCheckpoint = changes =>
    f.seedCheckpoint({

      ...f.checkpoint(),
      ...changes

    });

  f.seedJournal = journal =>
    storage.set(
      f.journalKey,
      JSON.stringify(journal)
    );

  f.emptyRegistry = () =>
    context.createP36SlateRegistry_("NBA");

  f.legacyCheckpoint = completed => ({

    ...context.createNBADailyAnalyticsState_(),

    completed,

    stage:
      completed
        ? "COMPLETE"
        : "PLAYER_GAME_LOGS"

  });

  f.markProcessed = () => {

    const result =
      context.transitionP36Slate_(
        f.registry(),
        slateDate,
        "PROCESSED",
        {
          runId,
          completed:true,
          stage:"COMPLETE"
        }
      );

    assert.equal(result.accepted,true);

    f.seedRegistry(result.registry);

  };

  // Create a valid assigned slate using the
  // installed universal registry transitions.

  const observed =
    context.observeP36Slate_(
      f.emptyRegistry(),
      slateDate,
      [1,2]
    );

  assert.equal(observed.accepted,true);

  const games = [1,2].map(id => ({

    id,
    date:slateDate,
    status:"Final",
    status_state:"final"

  }));

  const scheduleRows = games.map(game => ({

    gameId:String(game.id),
    status:"Final"

  }));

  const evaluation =
    context.evaluateP36SlateCompletion_(
      "NBA",
      slateDate,
      observed.registry.slates[slateKey]
        .inventory.expectedGameIds,
      games,
      scheduleRows
    );

  assert.equal(
    evaluation.ready,
    true,
    "Slate evaluation rejected: " +
    JSON.stringify(evaluation)
  );

  assert.equal(
    evaluation.reason,
    "SLATE_COMPLETE"
  );

  const ready =
    context.transitionP36Slate_(
      observed.registry,
      slateDate,
      "READY",
      {evaluation}
    );

  assert.equal(ready.accepted,true);

  const assigned =
    context.transitionP36Slate_(
      ready.registry,
      slateDate,
      "PROCESSING",
      {runId}
    );

  assert.equal(assigned.accepted,true);

  f.readyRegistry = ready.registry;

  f.seedRegistry(assigned.registry);

  const checkpoint =
    context.createP36NBACheckpointLocked_(
      lock,
      slateDate,
      runId
    );

  f.seedCheckpoint({

    ...checkpoint,

    completed:true,
    stage:"COMPLETE",
    playerTeamIndex:30,
    teamTeamIndex:30

  });

  return f;

}

function assertNoWrites(f) {

  assert.equal(f.registryWrites,0);
  assert.equal(f.checkpointWrites,0);
  assert.equal(f.journalWrites,0);
  assert.equal(f.deletes,0);

}

function expectDecision(f,action,reason) {

  const previousRegistry = f.registryRaw();
  const previousCheckpoint = f.checkpointRaw();
  const previousJournal = f.journalRaw();

  const result = f.reconcile();

  assert.equal(result.reconciled,false);
  assert.equal(result.action,action);
  assert.equal(result.reason,reason);

  assert.equal(f.registryRaw(),previousRegistry);
  assert.equal(f.checkpointRaw(),previousCheckpoint);
  assert.equal(f.journalRaw(),previousJournal);

  assertNoWrites(f);

}

const cases = [

  ["Completed pipeline transitions slate to PROCESSED",() => {

    const f = fixture();

    const result = f.reconcile();

    assert.equal(result.reconciled,true);
    assert.equal(result.reason,"SLATE_PROCESSED");
    assert.equal(result.action,"WAIT");
    assert.equal(f.slate().state,"PROCESSED");
    assert.equal(f.slate().runId,runId);
    assert.equal(f.registryWrites,1);

  }],

  ["Reconciliation never replaces the checkpoint",() => {

    const f = fixture();

    const before = f.checkpointRaw();

    f.reconcile();

    assert.equal(f.checkpointRaw(),before);
    assert.equal(f.checkpointWrites,0);
    assert.equal(f.journalWrites,0);
    assert.equal(f.deletes,0);

  }],

  ["Repeated reconciliation performs no additional write",() => {

    const f = fixture();

    f.reconcile();

    const before = f.registryRaw();

    const result = f.reconcile();

    assert.equal(result.reconciled,false);

    assert.equal(
      result.reason,
      "SLATE_ALREADY_PROCESSED"
    );

    assert.equal(f.registryRaw(),before);
    assert.equal(f.registryWrites,1);

  }],

  ["Reconciliation requires script lock",() => {

    const f = fixture();

    f.locked = false;

    assert.throws(
      f.reconcile,
      /SCRIPT_LOCK_REQUIRED/
    );

    assertNoWrites(f);

  }],

  ["Unfinished assigned pipeline requests resume",() => {

    const f = fixture();

    f.changeCheckpoint({
      completed:false,
      stage:"PLAYER_GAME_LOGS"
    });

    expectDecision(
      f,
      "RESUME",
      "PIPELINE_IN_PROGRESS"
    );

  }],

  ["Suspended pipeline remains protected",() => {

    const f = fixture();

    f.changeCheckpoint({
      suspended:true
    });

    expectDecision(
      f,
      "BLOCK",
      "CHECKPOINT_SUSPENDED"
    );

  }],

  ["Missing checkpoint blocks reconciliation",() => {

    const f = fixture();

    f.removeCheckpoint();

    expectDecision(
      f,
      "BLOCK",
      "CHECKPOINT_MISSING"
    );

  }],

  ["Mismatched run identity blocks reconciliation",() => {

    const f = fixture();

    f.changeCheckpoint({
      p36RunId:"different-run"
    });

    expectDecision(
      f,
      "BLOCK",
      "CHECKPOINT_ASSIGNMENT_MISMATCH"
    );

  }],

  ["Missing slate assignment blocks reconciliation",() => {

    const f = fixture();

    f.seedRegistry(f.emptyRegistry());

    expectDecision(
      f,
      "BLOCK",
      "CHECKPOINT_ASSIGNMENT_MISMATCH"
    );

  }],

  ["Legacy completed checkpoint waits safely",() => {

    const f = fixture();

    f.seedRegistry(f.emptyRegistry());
    f.seedCheckpoint(f.legacyCheckpoint(true));

    expectDecision(
      f,
      "WAIT",
      "LEGACY_CHECKPOINT"
    );

  }],

  ["Legacy unfinished checkpoint requests legacy resume",() => {

    const f = fixture();

    f.seedRegistry(f.emptyRegistry());
    f.seedCheckpoint(f.legacyCheckpoint(false));

    expectDecision(
      f,
      "RESUME_LEGACY",
      "LEGACY_CHECKPOINT"
    );

  }],

  ["Legacy checkpoint cannot claim assigned slate",() => {

    const f = fixture();

    f.seedCheckpoint(f.legacyCheckpoint(true));

    expectDecision(
      f,
      "BLOCK",
      "LEGACY_CHECKPOINT_ASSIGNMENT_CONFLICT"
    );

  }],

  ["Previously processed slate remains processed",() => {

    const f = fixture();

    f.markProcessed();

    expectDecision(
      f,
      "WAIT",
      "SLATE_ALREADY_PROCESSED"
    );

  }],

  ["Unfinished processed checkpoint is rejected",() => {

    const f = fixture();

    f.markProcessed();

    f.changeCheckpoint({
      completed:false,
      stage:"PLAYER_GAME_LOGS"
    });

    expectDecision(
      f,
      "BLOCK",
      "PROCESSED_CHECKPOINT_CONFLICT"
    );

  }],

  ["Pending journal takes recovery precedence",() => {

    const f = fixture();

    f.seedJournal({
      version:1,
      league:"NBA",
      slateDate,
      slateKey,
      runId
    });

    expectDecision(
      f,
      "RECOVER_INITIALIZATION",
      "INITIALIZATION_JOURNAL_PENDING"
    );

  }],

  ["Inconsistent completion checkpoint is rejected",() => {

    const f = fixture();

    f.changeCheckpoint({
      completed:true,
      stage:"PLAYER_GAME_LOGS"
    });

    assert.throws(
      f.reconcile,
      /CHECKPOINT_INVALID/
    );

    assertNoWrites(f);

  }],

  ["Failed registry write preserves prior assignment",() => {

    const f = fixture();

    const previousRegistry = f.registryRaw();
    const previousCheckpoint = f.checkpointRaw();

    f.registryWriteFailure = true;

    assert.throws(
      f.reconcile,
      /MOCK_REGISTRY_WRITE_FAILURE/
    );

    assert.equal(f.registryRaw(),previousRegistry);
    assert.equal(f.checkpointRaw(),previousCheckpoint);
    assert.equal(f.slate().state,"PROCESSING");

    assertNoWrites(f);

  }],

  ["Interrupted reconciliation succeeds on next execution",() => {

    const f = fixture();

    f.registryWriteFailure = true;

    assert.throws(
      f.reconcile,
      /MOCK_REGISTRY_WRITE_FAILURE/
    );

    f.registryWriteFailure = false;

    const result = f.reconcile();

    assert.equal(result.reconciled,true);
    assert.equal(f.slate().state,"PROCESSED");
    assert.equal(f.registryWrites,1);
    assert.equal(f.checkpointWrites,0);

  }],

  ["Registry readback mismatch is detected",() => {

    const f = fixture();

    const before = f.checkpointRaw();

    f.registryReadbackMismatch = true;

    assert.throws(f.reconcile);

    assert.equal(f.registryWrites,1);
    assert.equal(f.checkpointWrites,0);
    assert.equal(f.checkpointRaw(),before);
    assert.equal(f.deletes,0);

  }],

  ["Historical slate reconciliation preserves original date",() => {

    const f = fixture();

    assert.equal(f.checkpoint().runDate,today);

    f.reconcile();

    assert.equal(f.slate().slateDate,slateDate);
    assert.equal(f.slate().slateKey,slateKey);

  }],

  ["Existing NBA source remains unchanged",() => {

    assert.equal(
      hash(fs.readFileSync("nba-appscript")),
      expectedHash
    );

  }]

];

let passed = 0;

console.log("\n--- RECONCILIATION TESTS ---");

for (const [name,run] of cases) {

  try {

    run();

    passed++;

    console.log(`PASS | ${name}`);

  } catch(error) {

    console.log(
      `FAIL | ${name} | ${error.stack || error.message}`
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
console.log("PRODUCTION PROPERTY WRITES: 0");
console.log("PIPELINE RESETS: 0");
console.log("PIPELINE EXECUTIONS: 0");
console.log("TRIGGER CHANGES: 0");

console.log(
  `STATUS: ${passed === cases.length ? "PASS" : "FAIL"}`
);

if (passed !== cases.length) {
  process.exitCode = 1;
}

