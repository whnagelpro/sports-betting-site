
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const source = fs.readFileSync(
  path.resolve(__dirname,"../nba-appscript"),
  "utf8"
);

function extract(name) {

  const matches = [...source.matchAll(
    new RegExp(
      "^function\\s+"+name+"\\s*\\(",
      "gm"
    )
  )];

  assert.equal(matches.length,1,name);

  const remaining =
    source.slice(matches[0].index);

  const closing = /^}[ \t]*$/m.exec(remaining);

  assert.ok(closing,name);

  return remaining.slice(
    0,closing.index+1
  );

}

const mother = extract(
  "runNBADailyAnalyticsPipeline"
);

const entryEndMarker =
  "// ===== P36 PROTECTED MOTHER ENTRY END =====";

const errorStartMarker =
  "// ===== P36 PROTECTED MOTHER ERROR HANDLING START =====";

assert.equal(
  mother.split(entryEndMarker).length,2
);

assert.equal(
  mother.split(errorStartMarker).length,2
);

const bodyStart =
  mother.indexOf(entryEndMarker)+entryEndMarker.length;

const catchStart =
  mother.lastIndexOf(
    "  } catch (error) {",
    mother.indexOf(errorStartMarker)
  );

assert.ok(catchStart > bodyStart);

const originalBody =
  mother.slice(bodyStart,catchStart);

assert.ok(originalBody.length > 20000);

// Substitute only the analytics processing body
// inside the local VM. The real protected entry,
// catch handler and finally block remain intact.

const simulatedMother =

  mother.slice(0,bodyStart) +

  "\n    simulateAnalyticsProcessing_(state);\n\n" +

  mother.slice(catchStart);

const compiled = new vm.Script([

  simulatedMother,

  extract("resetNBADailyAnalyticsPipeline"),

  extract("continueNBADailyAnalyticsPipeline")

].join("\n\n"));

const clone = value =>
  JSON.parse(JSON.stringify(value));

function fixture() {

  const f = {

    held:false,
    lockAvailable:true,

    monitorCalls:0,
    checkpointReads:0,
    checkpointWrites:0,

    processingCalls:0,
    releaseCalls:0,

    triggerClears:0,
    retryCalls:0,

    events:[],

    decision:{
      action:"RUN"
    },

    state:{

      runDate:"2026-11-16",

      playerGameLogsRunId:"player-run-1",

      p36SlateKey:"NBA:2026-11-15",

      p36RunId:"slate-run-1",

      stage:"PLAYER_GAME_LOGS",

      completed:false,

      suspended:false,

      lastError:null

    },

    journalRaw:null,

    monitorError:false,

    processingError:false,

    clearError:false,

    mutateCheckpoint:false,

    mutateDuringProcessing:null

  };

  f.processingAssignments = [{

    slateKey:"NBA:2026-11-15",

    slateDate:"2026-11-15",

    runId:"slate-run-1",

    state:"PROCESSING"

  }];

  const lock = {

    tryLock:() => {

      f.events.push("acquire-lock");

      f.held = f.lockAvailable;

      return f.held;

    },

    hasLock:() => f.held,

    releaseLock:() => {

      assert.equal(f.held,true);

      f.releaseCalls++;

      f.held = false;

      f.events.push("release-lock");

    }

  };

  const context = vm.createContext({

    Date,

    LockService:{

      getScriptLock:() => lock

    },

    Logger:{

      log:message =>
        f.events.push("log:"+String(message))

    },

    PropertiesService:{

      getScriptProperties:() => ({})

    },

    monitorP36NBASlatesLocked_:receivedLock => {

      assert.equal(receivedLock.hasLock(),true);

      f.monitorCalls++;

      f.events.push("monitor");

      if (f.monitorError) {

        throw new Error("MOCK_MONITOR_FAILURE");

      }

      return f.decision;

    },

    readP36NBACheckpointLocked_:receivedLock => {

      assert.equal(receivedLock.hasLock(),true);

      f.checkpointReads++;

      f.events.push("read-checkpoint");

      if (!f.state) {

        return {
          exists:false,
          raw:null,
          state:null
        };

      }

      if (
        f.mutateCheckpoint &&
        f.checkpointReads === 2
      ) {

        f.state.lastError =
          "Concurrent checkpoint mutation";

      }

      return {

        exists:true,

        raw:JSON.stringify(f.state),

        state:clone(f.state)

      };

    },

    loadP36Journal_:league => {

      assert.equal(league,"NBA");

      f.events.push("read-journal");

      return {
        raw:f.journalRaw
      };

    },

    loadP36SlateRegistry_:league => {

      assert.equal(league,"NBA");

      f.events.push("read-registry");

      return {

        registry:{

          league:"NBA",

          slates:Object.fromEntries(

            f.processingAssignments.map(
              (slate,index) => [
                "assignment-"+index,
                clone(slate)
              ]
            )

          )

        }

      };

    },

    validateP36RetentionBoundary_:() => {

      f.events.push("validate-retention");

    },

    clearNBADailyAnalyticsContinuationTriggers_:() => {

      assert.equal(f.held,true);

      f.triggerClears++;

      f.events.push("clear-continuations");

      if (f.clearError) {

        throw new Error("MOCK_CLEAR_FAILURE");

      }

    },

    saveNBADailyAnalyticsState_:state => {

      assert.equal(f.held,true);

      f.checkpointWrites++;

      f.events.push("save-checkpoint");

      f.state = clone(state);

    },

    scheduleNBADailyAnalyticsRetry_:() => {

      assert.equal(f.held,true);

      f.retryCalls++;

      f.events.push("schedule-retry");

    },

    simulateAnalyticsProcessing_:state => {

      assert.equal(f.held,true);

      f.processingCalls++;

      f.events.push("analytics-processing");

      assert.equal(state.completed,false);

      if (f.mutateDuringProcessing) {

        f.mutateDuringProcessing(f);

      }

      if (f.processingError) {

        throw new Error("MOCK_PROCESSING_FAILURE");

      }

    },

    createNBADailyAnalyticsState_:() => {

      throw new Error(
        "FORBIDDEN_LEGACY_INITIALIZATION"
      );

    },

    clearNBADailyAnalyticsState_:() => {

      throw new Error(
        "FORBIDDEN_LEGACY_RESET"
      );

    },

    getNBADailyAnalyticsState_:() => {

      throw new Error(
        "FORBIDDEN_LEGACY_CHECKPOINT_READ"
      );

    }

  });

  compiled.runInContext(context);

  f.run = () =>
    context.runNBADailyAnalyticsPipeline();

  f.reset = () =>
    context.resetNBADailyAnalyticsPipeline();

  f.continue = () =>
    context.continueNBADailyAnalyticsPipeline();

  f.makeLegacy = () => {

    delete f.state.p36SlateKey;

    delete f.state.p36RunId;

    f.processingAssignments = [];

    f.decision.action = "RESUME_LEGACY";

  };

  return f;

}

const tests = [];

function test(name,fn) {

  tests.push({name,fn});

}

function assertNoExecution(f) {

  assert.equal(f.processingCalls,0);

  assert.equal(f.checkpointWrites,0);

  assert.equal(f.retryCalls,0);

  assert.equal(f.triggerClears,0);

}

function assertReleased(f) {

  assert.equal(f.releaseCalls,1);

  assert.equal(f.held,false);

}

for (const action of ["WAIT","STOP","BLOCK","UNKNOWN"]) {

  test(action+" prevents analytics execution",() => {

    const f = fixture();

    f.decision.action = action;

    f.run();

    assertNoExecution(f);

    assertReleased(f);

  });

}

for (const action of ["RUN","RESUME"]) {

  test(action+" authorizes matching checkpoint",() => {

    const f = fixture();

    f.decision.action = action;

    f.run();

    assert.equal(f.processingCalls,1);

    assert.equal(f.triggerClears,1);

    assert.equal(f.checkpointWrites,0);

    assertReleased(f);

  });

}

test("Unavailable lock prevents duplicate execution",() => {

  const f = fixture();

  f.lockAvailable = false;

  f.run();

  assert.equal(f.monitorCalls,0);

  assert.equal(f.releaseCalls,0);

  assertNoExecution(f);

});

test("Legacy unfinished checkpoint may resume",() => {

  const f = fixture();

  f.makeLegacy();

  f.run();

  assert.equal(f.processingCalls,1);

  assertReleased(f);

});

test("Legacy resume with assigned identity blocks",() => {

  const f = fixture();

  f.decision.action = "RESUME_LEGACY";

  assert.throws(
    () => f.run(),
    /P36_NBA_LEGACY_EXECUTION_CONFLICT/
  );

  assertNoExecution(f);

  assertReleased(f);

});

test("Legacy resume with orphan assignment blocks",() => {

  const f = fixture();

  const assigned = f.processingAssignments;

  f.makeLegacy();

  f.processingAssignments = assigned;

  assert.throws(
    () => f.run(),
    /P36_NBA_LEGACY_EXECUTION_CONFLICT/
  );

  assertNoExecution(f);

});

test("Missing checkpoint cannot initialize through mother",() => {

  const f = fixture();

  f.state = null;

  assert.throws(
    () => f.run(),
    /P36_NBA_EXECUTION_CHECKPOINT_INVALID/
  );

  assertNoExecution(f);

  assertReleased(f);

});

test("Completed checkpoint cannot execute stages",() => {

  const f = fixture();

  f.state.completed = true;
  f.state.stage = "COMPLETE";

  assert.throws(
    () => f.run(),
    /P36_NBA_EXECUTION_CHECKPOINT_INVALID/
  );

  assertNoExecution(f);

});

test("Suspended checkpoint cannot execute stages",() => {

  const f = fixture();

  f.state.suspended = true;

  assert.throws(
    () => f.run(),
    /P36_NBA_EXECUTION_CHECKPOINT_INVALID/
  );

  assertNoExecution(f);

});

test("Pending journal prevents mother execution",() => {

  const f = fixture();

  f.journalRaw = "pending-journal";

  assert.throws(
    () => f.run(),
    /P36_NBA_EXECUTION_JOURNAL_PENDING/
  );

  assertNoExecution(f);

});

test("Missing processing assignment blocks",() => {

  const f = fixture();

  f.processingAssignments = [];

  assert.throws(
    () => f.run(),
    /P36_NBA_EXECUTION_ASSIGNMENT_MISMATCH/
  );

  assertNoExecution(f);

});

test("Mismatched run ID blocks",() => {

  const f = fixture();

  f.processingAssignments[0].runId = "wrong-run";

  assert.throws(
    () => f.run(),
    /P36_NBA_EXECUTION_ASSIGNMENT_MISMATCH/
  );

  assertNoExecution(f);

});

test("Mismatched slate key blocks",() => {

  const f = fixture();

  f.processingAssignments[0].slateKey =
    "NBA:2026-11-14";

  assert.throws(
    () => f.run(),
    /P36_NBA_EXECUTION_ASSIGNMENT_MISMATCH/
  );

  assertNoExecution(f);

});

test("Multiple processing assignments block",() => {

  const f = fixture();

  f.processingAssignments.push({

    slateKey:"NBA:2026-11-14",

    runId:"another-run",

    state:"PROCESSING"

  });

  assert.throws(
    () => f.run(),
    /P36_NBA_EXECUTION_ASSIGNMENT_MISMATCH/
  );

  assertNoExecution(f);

});

test("Checkpoint change before execution blocks",() => {

  const f = fixture();

  f.mutateCheckpoint = true;

  assert.throws(
    () => f.run(),
    /P36_NBA_EXECUTION_CHECKPOINT_CHANGED/
  );

  assertNoExecution(f);

});

test("Authorization precedes continuation cleanup",() => {

  const f = fixture();

  f.run();

  assert.ok(

    f.events.lastIndexOf("read-checkpoint") <

    f.events.indexOf("clear-continuations")

  );

  assert.ok(

    f.events.indexOf("clear-continuations") <

    f.events.indexOf("analytics-processing")

  );

});

test("Monitor exception preserves checkpoint",() => {

  const f = fixture();

  const before = JSON.stringify(f.state);

  f.monitorError = true;

  assert.throws(
    () => f.run(),
    /MOCK_MONITOR_FAILURE/
  );

  assert.equal(JSON.stringify(f.state),before);

  assertNoExecution(f);

  assertReleased(f);

});

test("Invalid monitor decision fails safely",() => {

  const f = fixture();

  f.decision = null;

  assert.throws(
    () => f.run(),
    /P36_NBA_INVALID_MONITOR_DECISION/
  );

  assertNoExecution(f);

  assertReleased(f);

});

test("Authorized processing failure schedules retry",() => {

  const f = fixture();

  f.processingError = true;

  f.run();

  assert.equal(f.processingCalls,1);

  assert.equal(f.checkpointWrites,1);

  assert.equal(f.retryCalls,1);

  assert.match(
    f.state.lastError,
    /MOCK_PROCESSING_FAILURE/
  );

  assert.equal(
    f.state.p36RunId,"slate-run-1"
  );

  assertReleased(f);

});

test("Retry retains latest persisted stage",() => {

  const f = fixture();

  f.processingError = true;

  f.mutateDuringProcessing = fixture => {

    fixture.state.stage = "TEAM_GAME_LOGS";

  };

  f.run();

  assert.equal(
    f.state.stage,"TEAM_GAME_LOGS"
  );

  assert.equal(f.retryCalls,1);

});

test("Missing checkpoint during failure prevents retry write",() => {

  const f = fixture();

  f.processingError = true;

  f.mutateDuringProcessing = fixture => {

    fixture.state = null;

  };

  assert.throws(
    () => f.run(),
    /MOCK_PROCESSING_FAILURE/
  );

  assert.equal(f.checkpointWrites,0);

  assert.equal(f.retryCalls,0);

  assertReleased(f);

});

for (const field of [

  "runDate",
  "playerGameLogsRunId",
  "p36SlateKey",
  "p36RunId"

]) {

  test("Changed "+field+" protects retry checkpoint",() => {

    const f = fixture();

    f.processingError = true;

    f.mutateDuringProcessing = fixture => {

      fixture.state[field] = "changed-identity";

    };

    assert.throws(
      () => f.run(),
      /MOCK_PROCESSING_FAILURE/
    );

    assert.equal(f.checkpointWrites,0);

    assert.equal(f.retryCalls,0);

    assertReleased(f);

  });

}

test("Completed checkpoint survives late processing error",() => {

  const f = fixture();

  f.processingError = true;

  f.mutateDuringProcessing = fixture => {

    fixture.state.completed = true;

    fixture.state.stage = "COMPLETE";

  };

  assert.throws(
    () => f.run(),
    /MOCK_PROCESSING_FAILURE/
  );

  assert.equal(f.checkpointWrites,0);

  assert.equal(f.retryCalls,0);

  assert.equal(f.state.completed,true);

});

test("Suspended checkpoint survives processing error",() => {

  const f = fixture();

  f.processingError = true;

  f.mutateDuringProcessing = fixture => {

    fixture.state.suspended = true;

  };

  assert.throws(
    () => f.run(),
    /MOCK_PROCESSING_FAILURE/
  );

  assert.equal(f.checkpointWrites,0);

  assert.equal(f.retryCalls,0);

});

test("Pending journal protects error recovery evidence",() => {

  const f = fixture();

  f.processingError = true;

  f.mutateDuringProcessing = fixture => {

    fixture.journalRaw = "new-pending-journal";

  };

  assert.throws(
    () => f.run(),
    /MOCK_PROCESSING_FAILURE/
  );

  assert.equal(f.checkpointWrites,0);

  assert.equal(f.retryCalls,0);

});

test("Continuation cleanup failure schedules protected retry",() => {

  const f = fixture();

  f.clearError = true;

  f.run();

  assert.equal(f.processingCalls,0);

  assert.equal(f.checkpointWrites,1);

  assert.equal(f.retryCalls,1);

  assertReleased(f);

});

test("Legacy reset preserves all checkpoint data",() => {

  const f = fixture();

  const before = JSON.stringify(f.state);

  const result = f.reset();

  assert.equal(result.reset,false);

  assert.equal(
    result.reason,"LEGACY_RESET_RETIRED"
  );

  assert.equal(JSON.stringify(f.state),before);

  assert.equal(f.monitorCalls,0);

  assertNoExecution(f);

});

test("Continuation uses protected monitor entry",() => {

  const f = fixture();

  f.decision.action = "WAIT";

  f.continue();

  assert.equal(f.monitorCalls,1);

  assertNoExecution(f);

  assertReleased(f);

});

let passed = 0;

for (const {name,fn} of tests) {

  try {

    fn();

    passed++;

    console.log("PASS |",name);

  } catch (error) {

    console.error("FAIL |",name);

    console.error(error.stack);

  }

}

console.log("\nTEST CASES:",tests.length);
console.log("PASS:",passed);
console.log("FAIL:",tests.length-passed);

console.log(
  "EXECUTION ENVIRONMENT:",
  "LOCAL PROTECTED MOTHER SIMULATION"
);

console.log(
  "STATUS:",
  passed===tests.length ? "PASS" : "FAIL"
);

if (passed!==tests.length) {

  process.exitCode = 1;

}
