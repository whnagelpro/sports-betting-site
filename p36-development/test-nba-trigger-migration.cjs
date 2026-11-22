
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

const names = [

  "monitorNBADailyAnalyticsPipeline",
  "getP36NBATriggerConfiguration_",
  "getP36NBATriggerInventory_",
  "inspectP36NBATriggerConfiguration",
  "migrateP36NBAPermanentTriggers",
  "installNBADailyAnalyticsPermanentTriggers",
  "testNBADailyAnalyticsTriggerSeparation",
  "testNBAPermanentTriggerSurvival",
  "scheduleNBADailyAnalyticsRetry_",
  "clearNBADailyAnalyticsContinuationTriggers_"

];

const compiled = new vm.Script(
  names.map(extract).join("\n\n")
);

const MONITOR =
  "monitorNBADailyAnalyticsPipeline";

const RUN =
  "runNBADailyAnalyticsPipeline";

const RESET =
  "resetNBADailyAnalyticsPipeline";

const CONTINUE =
  "continueNBADailyAnalyticsPipeline";

const ID_KEY =
  "P36_NBA_MONITOR_TRIGGER_ID_V1";

const clone = value =>
  JSON.parse(JSON.stringify(value));

function fixture() {

  const f = {

    held:false,
    lockAvailable:true,

    releaseCalls:0,
    createCalls:0,
    deleteCalls:0,
    propertyWrites:0,
    motherCalls:0,

    nextId:100,

    events:[],
    storage:new Map(),
    triggers:[],

    journalRaw:null,

    state:{

      runDate:"2026-11-16",

      stage:"COMPLETE",

      completed:true,

      suspended:false,

      playerGameLogsRunId:"legacy-player-run"

    },

    failCreate:false,
    invisibleCreation:false,
    failPropertyWrite:false,
    wrongPropertyReadback:false,
    failDeleteId:null

  };

  f.add = (
    handler,
    id,
    eventType = "CLOCK"
  ) => {

    const item = {

      id:id || `trigger-${++f.nextId}`,

      handler,

      eventType,

      getUniqueId() {
        return this.id;
      },

      getHandlerFunction() {
        return this.handler;
      },

      getEventType() {
        return this.eventType;
      }

    };

    f.triggers.push(item);

    return item;

  };

  f.add(RESET,"legacy-reset");
  f.add(RUN,"legacy-run");
  f.add(CONTINUE,"continuation-original");
  f.add("refreshNBAScheduleSheet","schedule");
  f.add("refreshNBAGameOddsSheet","odds");
  f.add("refreshNBAPlayerPropsSheet","props");
  f.add("refreshNBARostersSheet","rosters");

  const lock = {

    tryLock:() => {

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

  const properties = {

    getProperty:key =>
      f.storage.has(key)
        ? f.storage.get(key)
        : null,

    setProperty:(key,value) => {

      assert.equal(f.held,true);

      assert.equal(key,ID_KEY);

      f.propertyWrites++;

      f.events.push("property-write");

      if (f.failPropertyWrite) {

        throw new Error(
          "MOCK_PROPERTY_WRITE_FAILURE"
        );

      }

      f.storage.set(
        key,
        f.wrongPropertyReadback
          ? "incorrect-monitor-id"
          : String(value)
      );

    }

  };

  const context = vm.createContext({

    NBA_DAILY_ANALYTICS_PIPELINE:{

      retryFunction:CONTINUE,

      retryDelayMs:60000

    },

    Logger:{

      log:message =>
        f.events.push("log:"+String(message))

    },

    LockService:{

      getScriptLock:() => lock

    },

    PropertiesService:{

      getScriptProperties:() => properties

    },

    readP36NBACheckpointLocked_:receivedLock => {

      assert.equal(receivedLock.hasLock(),true);

      if (!f.state) {

        return {
          exists:false,
          raw:null,
          state:null
        };

      }

      return {

        exists:true,

        raw:JSON.stringify(f.state),

        state:clone(f.state)

      };

    },

    loadP36Journal_:league => {

      assert.equal(league,"NBA");

      return {
        raw:f.journalRaw
      };

    },

    runNBADailyAnalyticsPipeline:() => {

      f.motherCalls++;

    },

    ScriptApp:{

      getProjectTriggers:() =>
        [...f.triggers],

      newTrigger:handler => {

        let interval = null;
        let delay = null;

        const builder = {

          timeBased() {
            return this;
          },

          everyMinutes(minutes) {

            interval = minutes;

            return this;

          },

          after(milliseconds) {

            delay = milliseconds;

            return this;

          },

          create() {

            assert.equal(f.held,true);

            f.createCalls++;

            f.events.push(
              "create:"+handler
            );

            if (f.failCreate) {

              throw new Error(
                "MOCK_TRIGGER_CREATION_FAILURE"
              );

            }

            const trigger = f.add(handler);

            trigger.interval = interval;
            trigger.delay = delay;

            if (f.invisibleCreation) {

              f.triggers = f.triggers.filter(
                item => item.id !== trigger.id
              );

            }

            return trigger;

          }

        };

        return builder;

      },

      deleteTrigger:trigger => {

        assert.equal(f.held,true);

        f.deleteCalls++;

        f.events.push(
          "delete:"+trigger.id
        );

        if (trigger.id === f.failDeleteId) {

          throw new Error(
            "MOCK_TRIGGER_DELETION_FAILURE"
          );

        }

        f.triggers = f.triggers.filter(
          item => item.id !== trigger.id
        );

      }

    }

  });

  compiled.runInContext(context);

  f.context = context;

  f.migrate = () =>

    context.migrateP36NBAPermanentTriggers();

  f.inspect = () =>

    context.inspectP36NBATriggerConfiguration();

  f.count = handler =>

    f.triggers.filter(
      item => item.handler === handler
    ).length;

  f.ids = () =>

    f.triggers.map(
      item => item.id
    ).sort();

  f.monitor = () =>

    f.triggers.find(
      item => item.handler === MONITOR
    );

  f.withLock = fn => {

    assert.equal(f.held,false);

    f.held = true;

    try {

      return fn();

    } finally {

      f.held = false;

    }

  };

  return f;

}

const tests = [];

function test(name,fn) {

  tests.push({name,fn});

}

function assertNoWrites(f) {

  assert.equal(f.createCalls,0);
  assert.equal(f.deleteCalls,0);
  assert.equal(f.propertyWrites,0);
  assert.equal(f.motherCalls,0);

}

function assertLegacyPreserved(f) {

  assert.equal(f.count(RUN),1);
  assert.equal(f.count(RESET),1);

}

function assertHealthy(f) {

  assert.equal(f.inspect().healthy,true);

  assert.equal(f.count(MONITOR),1);

  assert.equal(f.count(RUN),0);

  assert.equal(f.count(RESET),0);

  assert.equal(f.held,false);

}

test("Initial migration installs one monitor",() => {

  const f = fixture();

  const result = f.migrate();

  assert.equal(result.migrated,true);

  assert.equal(result.created,true);

  assertHealthy(f);

});

test("Monitoring cadence requests exactly 15 minutes",() => {

  const f = fixture();

  f.migrate();

  assert.equal(f.monitor().interval,15);

});

test("Replacement created before legacy deletion",() => {

  const f = fixture();

  f.migrate();

  const creation = f.events.indexOf(
    "create:"+MONITOR
  );

  const deletion = f.events.findIndex(
    event => event.startsWith("delete:")
  );

  assert.ok(creation >= 0);
  assert.ok(deletion > creation);

});

test("Monitor identity persisted before legacy deletion",() => {

  const f = fixture();

  f.migrate();

  const write = f.events.indexOf(
    "property-write"
  );

  const deletion = f.events.findIndex(
    event => event.startsWith("delete:")
  );

  assert.ok(write >= 0);
  assert.ok(deletion > write);

});

test("All independent triggers retain their IDs",() => {

  const f = fixture();

  const protectedIds = f.triggers.filter(
    item => ![RESET,RUN].includes(item.handler)
  ).map(item => item.id);

  f.migrate();

  for (const id of protectedIds) {

    assert.ok(f.ids().includes(id));

  }

});

test("Migration preserves exact checkpoint",() => {

  const f = fixture();

  const before = JSON.stringify(f.state);

  f.migrate();

  assert.equal(
    JSON.stringify(f.state),before
  );

  assert.equal(f.motherCalls,0);

});

test("Repeated migration is idempotent",() => {

  const f = fixture();

  f.migrate();

  const ids = f.ids();

  const creates = f.createCalls;

  const deletions = f.deleteCalls;

  const writes = f.propertyWrites;

  for (let i=0;i<5;i++) {

    const result = f.migrate();

    assert.equal(result.created,false);

    assert.equal(
      result.reason,
      "TRIGGER_CONFIGURATION_UNCHANGED"
    );

  }

  assert.deepEqual(f.ids(),ids);

  assert.equal(f.createCalls,creates);
  assert.equal(f.deleteCalls,deletions);
  assert.equal(f.propertyWrites,writes);

  assertHealthy(f);

});

test("Busy lock defers migration without writes",() => {

  const f = fixture();

  f.lockAvailable = false;

  const result = f.migrate();

  assert.equal(result.action,"WAIT");

  assertNoWrites(f);

  assertLegacyPreserved(f);

  assert.equal(f.releaseCalls,0);

});

for (const scenario of [

  "missing",
  "unfinished",
  "suspended"

]) {

  test(scenario+" checkpoint blocks migration",() => {

    const f = fixture();

    if (scenario === "missing") {

      f.state = null;

    } else if (scenario === "unfinished") {

      f.state.completed = false;

      f.state.stage = "PLAYER_GAME_LOGS";

    } else {

      f.state.suspended = true;

    }

    assert.equal(f.migrate().action,"BLOCK");

    assertNoWrites(f);

    assertLegacyPreserved(f);

    assert.equal(f.releaseCalls,1);

  });

}

test("Pending initialization journal blocks migration",() => {

  const f = fixture();

  f.journalRaw = "pending";

  assert.equal(f.migrate().action,"BLOCK");

  assertNoWrites(f);

  assertLegacyPreserved(f);

});

test("Creation failure preserves all legacy triggers",() => {

  const f = fixture();

  const ids = f.ids();

  f.failCreate = true;

  assert.throws(
    () => f.migrate(),
    /MOCK_TRIGGER_CREATION_FAILURE/
  );

  assert.deepEqual(f.ids(),ids);

  assert.equal(f.deleteCalls,0);

  assert.equal(f.held,false);

});

test("Unverified creation prevents legacy deletion",() => {

  const f = fixture();

  f.invisibleCreation = true;

  assert.throws(
    () => f.migrate(),
    /P36_NBA_MONITOR_CREATION_UNVERIFIED/
  );

  assertLegacyPreserved(f);

  assert.equal(f.deleteCalls,0);

});

test("Identity write failure preserves legacy triggers",() => {

  const f = fixture();

  f.failPropertyWrite = true;

  assert.throws(
    () => f.migrate(),
    /MOCK_PROPERTY_WRITE_FAILURE/
  );

  assertLegacyPreserved(f);

  assert.equal(f.deleteCalls,0);

  assert.equal(f.count(MONITOR),1);

});

test("Identity readback failure prevents legacy deletion",() => {

  const f = fixture();

  f.wrongPropertyReadback = true;

  assert.throws(
    () => f.migrate(),
    /P36_NBA_MONITOR_IDENTITY_READBACK_FAILED/
  );

  assertLegacyPreserved(f);

  assert.equal(f.deleteCalls,0);

});

test("Interrupted identity persistence remains recoverable",() => {

  const f = fixture();

  f.failPropertyWrite = true;

  assert.throws(
    () => f.migrate(),
    /MOCK_PROPERTY_WRITE_FAILURE/
  );

  f.failPropertyWrite = false;

  f.migrate();

  assertHealthy(f);

});

test("Interrupted cleanup retains verified monitor",() => {

  const f = fixture();

  f.failDeleteId = "legacy-run";

  assert.throws(
    () => f.migrate(),
    /MOCK_TRIGGER_DELETION_FAILURE/
  );

  assert.equal(f.count(MONITOR),1);

  assert.equal(
    f.storage.get(ID_KEY),
    f.monitor().id
  );

  assert.equal(f.held,false);

});

test("Interrupted cleanup resumes without new monitor",() => {

  const f = fixture();

  f.failDeleteId = "legacy-run";

  assert.throws(
    () => f.migrate(),
    /MOCK_TRIGGER_DELETION_FAILURE/
  );

  const id = f.monitor().id;

  f.failDeleteId = null;

  f.migrate();

  assert.equal(f.monitor().id,id);

  assert.equal(f.createCalls,1);

  assertHealthy(f);

});

test("Duplicate monitors are safely consolidated",() => {

  const f = fixture();

  f.add(MONITOR,"known-monitor");

  f.add(MONITOR,"duplicate-monitor");

  f.storage.set(ID_KEY,"known-monitor");

  f.migrate();

  assert.equal(f.monitor().id,"known-monitor");

  assert.equal(f.createCalls,0);

  assertHealthy(f);

});

test("Missing recorded monitor is replaced",() => {

  const f = fixture();

  f.storage.set(ID_KEY,"missing-monitor");

  f.migrate();

  assert.notEqual(
    f.monitor().id,"missing-monitor"
  );

  assertHealthy(f);

});

test("Unrecorded monitor is replaced",() => {

  const f = fixture();

  f.add(MONITOR,"unrecorded");

  f.migrate();

  assert.notEqual(
    f.monitor().id,"unrecorded"
  );

  assertHealthy(f);

});

test("Incorrect monitor event type is replaced",() => {

  const f = fixture();

  f.add(
    MONITOR,
    "incorrect-type",
    "ON_EDIT"
  );

  f.storage.set(
    ID_KEY,"incorrect-type"
  );

  f.migrate();

  assert.equal(
    f.monitor().eventType,"CLOCK"
  );

  assertHealthy(f);

});

test("Duplicate trigger IDs block unsafe migration",() => {

  const f = fixture();

  f.add(
    "anotherHandler",
    "legacy-run"
  );

  assert.throws(
    () => f.migrate(),
    /P36_NBA_INVALID_TRIGGER_INVENTORY/
  );

  assertNoWrites(f);

});

test("Legacy installer invokes protected migration",() => {

  const f = fixture();

  const result =
    f.context.installNBADailyAnalyticsPermanentTriggers();

  assert.equal(result.migrated,true);

  assertHealthy(f);

});

test("Trigger health diagnostic is read-only",() => {

  const f = fixture();

  const ids = f.ids();

  const result = f.inspect();

  assert.equal(result.healthy,false);

  assert.deepEqual(f.ids(),ids);

  assertNoWrites(f);

});

for (const name of [

  "testNBADailyAnalyticsTriggerSeparation",

  "testNBAPermanentTriggerSurvival"

]) {

  test(name+" is read-only",() => {

    const f = fixture();

    const ids = f.ids();

    f.context[name]();

    assert.deepEqual(f.ids(),ids);

    assertNoWrites(f);

  });

}

test("Permanent handler delegates to protected mother",() => {

  const f = fixture();

  f.context.monitorNBADailyAnalyticsPipeline();

  assert.equal(f.motherCalls,1);

  assert.equal(f.createCalls,0);
  assert.equal(f.deleteCalls,0);

});

test("Continuation cleanup preserves permanent monitor",() => {

  const f = fixture();

  f.migrate();

  const monitorId = f.monitor().id;

  f.withLock(() =>

    f.context.clearNBADailyAnalyticsContinuationTriggers_()

  );

  assert.equal(f.count(CONTINUE),0);

  assert.equal(f.monitor().id,monitorId);

  assertHealthy(f);

});

test("Continuation replacement preserves monitor",() => {

  const f = fixture();

  f.migrate();

  const monitorId = f.monitor().id;

  f.withLock(() =>

    f.context.scheduleNBADailyAnalyticsRetry_()

  );

  assert.equal(f.count(CONTINUE),1);

  const retry = f.triggers.find(
    item => item.handler === CONTINUE
  );

  assert.equal(retry.delay,60000);

  assert.equal(f.monitor().id,monitorId);

  assertHealthy(f);

});

test("Failed continuation replacement preserves original",() => {

  const f = fixture();

  f.migrate();

  f.failCreate = true;

  assert.throws(
    () => f.withLock(() =>

      f.context.scheduleNBADailyAnalyticsRetry_()

    ),

    /MOCK_TRIGGER_CREATION_FAILURE/
  );

  assert.ok(
    f.ids().includes("continuation-original")
  );

  assertHealthy(f);

});

let passed = 0;

console.log(
  "ACTUAL TRIGGER FUNCTIONS:",names.length
);

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
  "LOCAL SIMULATED TRIGGER INFRASTRUCTURE"
);

console.log(
  "STATUS:",
  passed===tests.length ? "PASS" : "FAIL"
);

if (passed!==tests.length) {

  process.exitCode = 1;

}
