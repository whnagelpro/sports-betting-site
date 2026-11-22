
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const crypto = require("node:crypto");

const expectedHash = "2c98d4a2c7c1ee8e64efafbf3dfc7cf62d8eaab18525038f562e53385b72dde4";

const hash = value => crypto
  .createHash("sha256")
  .update(value)
  .digest("hex");

assert.equal(
  hash(fs.readFileSync("nba-appscript")),
  expectedHash
);

function fixture() {

  const f = {

    today:"2026-11-16",

    held:true,
    exists:true,

    state:{
      completed:true,
      stage:"COMPLETE",
      suspended:false
    },

    recovery:{
      action:"NO_ACTION"
    },

    registry:{
      version:1,
      league:"NBA",
      slates:{}
    },

    events:[],
    attempts:[],
    responses:{},

    now:0,
    refreshDuration:0,
    attemptDuration:0,

    failRefresh:false,
    invalidRegistry:false,

    defaultResponse:{
      action:"WAIT",
      reason:"SLATE_NOT_COMPLETE"
    }

  };

  f.addSlate = (date,state = "READY") => {

    f.registry.slates["NBA:"+date] = {
      slateDate:date,
      state
    };

  };

  f.count = name =>
    f.events.filter(event => event === name).length;

  const lock = {
    hasLock:() => f.held
  };

  const context = vm.createContext({

    Date:{
      now:() => f.now
    },

    PropertiesService:{

      getScriptProperties:() => ({})

    },

    getTodayString_:() => f.today,

    isValidP36Date_:date => {

      if (
        typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
      ) return false;

      const parsed = new Date(date);

      return Number.isFinite(parsed.getTime()) &&
        parsed.toISOString().slice(0,10) === date;

    },

    inspectP36NBABoundJournalLocked_:() => {

      f.events.push("inspect");

      return f.recovery;

    },

    readP36NBACheckpointLocked_:() => {

      f.events.push("read-checkpoint");

      return {

        exists:f.exists,

        state:f.exists
          ? {...f.state}
          : null

      };

    },

    refreshP36NBAScheduleLocked_:() => {

      f.events.push("refresh");

      f.now += f.refreshDuration;

      if (f.failRefresh) {

        throw new Error(
          "INJECTED_SCHEDULE_REFRESH_FAILURE"
        );

      }

      if (f.onRefresh) {

        f.onRefresh();

      }

      return {};

    },

    loadP36SlateRegistry_:() => {

      f.events.push("load-registry");

      return {

        registry:f.registry

      };

    },

    validateP36RetentionBoundary_:() => {

      f.events.push("validate-retention");

      if (f.invalidRegistry) {

        throw new Error(
          "INJECTED_INVALID_REGISTRY"
        );

      }

    },

    getP36SlateRefreshDates_:
      (registry,today) => {

        f.events.push("select-dates");

        const dates = new Set([today]);

        for (
          const slate of
          Object.values(registry.slates)
        ) {

          if (
            slate.slateDate <= today &&
            ["READY","TRACKING"].includes(slate.state)
          ) {

            dates.add(slate.slateDate);

          }

        }

        return [...dates].sort();

      },

    orchestrateP36NBAInitializationLocked_:
      (receivedLock,date) => {

        assert.equal(receivedLock,lock);

        f.events.push("orchestrate");

        f.attempts.push(date);

        f.now += f.attemptDuration;

        return f.responses[date] ||
          f.defaultResponse;

      }

  });

  vm.runInContext(
    "\n\n/*\n * Evaluate the next safe NBA pipeline action.\n *\n * Requires an already-acquired script lock.\n *\n * Recovery takes precedence over Schedule refresh.\n *\n * Does not execute the mother pipeline or modify triggers.\n */\n\nfunction monitorP36NBASlatesLocked_(lock) {\n\n  if (\n    !lock ||\n    lock.hasLock() !== true\n  ) {\n\n    throw new Error(\"SCRIPT_LOCK_REQUIRED\");\n\n  }\n\n  const startedAt = Date.now();\n\n  const budgetMs = 120000;\n\n  const respond = (action,reason,extra = {}) => ({\n    action,\n    reason,\n    ...extra\n  });\n\n  const today = getTodayString_();\n\n  if (!isValidP36Date_(today)) {\n\n    return respond(\n      \"BLOCK\",\n      \"INVALID_MONITOR_DATE\"\n    );\n\n  }\n\n  /*\n   * Never refresh ordinary slate evidence before\n   * inspecting an interrupted initialization.\n   */\n\n  const recovery =\n    inspectP36NBABoundJournalLocked_(lock);\n\n  if (recovery.action === \"BLOCK\") {\n\n    return respond(\n      \"BLOCK\",\n      recovery.reason\n    );\n\n  }\n\n  if (\n    recovery.action === \"RECOVER_ASSIGNMENT\" ||\n    recovery.action === \"REAUTHORIZE\"\n  ) {\n\n    return orchestrateP36NBAInitializationLocked_(\n      lock,\n      today\n    );\n\n  }\n\n  if (recovery.action !== \"NO_ACTION\") {\n\n    return respond(\n      \"BLOCK\",\n      \"UNKNOWN_MONITOR_RECOVERY_ACTION\"\n    );\n\n  }\n\n  const checkpoint =\n    readP36NBACheckpointLocked_(lock);\n\n  if (!checkpoint.exists) {\n\n    return respond(\n      \"BLOCK\",\n      \"CHECKPOINT_MISSING\"\n    );\n\n  }\n\n  if (checkpoint.state.suspended === true) {\n\n    return respond(\n      \"BLOCK\",\n      \"CHECKPOINT_SUSPENDED\"\n    );\n\n  }\n\n  /*\n   * Existing unfinished work must take precedence\n   * over initializing another pipeline.\n   */\n\n  if (checkpoint.state.completed !== true) {\n\n    return orchestrateP36NBAInitializationLocked_(\n      lock,\n      today\n    );\n\n  }\n\n  /*\n   * Record current and previously observed pending\n   * slate evidence before choosing a new run.\n   */\n\n  refreshP36NBAScheduleLocked_(lock);\n\n  const properties =\n    PropertiesService.getScriptProperties();\n\n  const loaded =\n    loadP36SlateRegistry_(\n      \"NBA\",\n      properties\n    );\n\n  validateP36RetentionBoundary_(\n    loaded.registry\n  );\n\n  const dates =\n    getP36SlateRefreshDates_(\n      loaded.registry,\n      today\n    );\n\n  /*\n   * Prioritize older eligible slates.\n   *\n   * READY identifies candidates only.\n   * The orchestrator must independently obtain\n   * fresh completion authorization.\n   */\n\n  const readyDates = dates.filter(date => {\n\n    const slate =\n      loaded.registry.slates[\"NBA:\" + date];\n\n    return slate &&\n      slate.state === \"READY\";\n\n  });\n\n  /*\n   * Even without a READY slate, allow the orchestrator\n   * to reconcile a previously completed pipeline.\n   */\n\n  const candidates =\n    readyDates.length > 0\n      ? readyDates\n      : [today];\n\n  const attemptedDates = [];\n\n  for (const date of candidates) {\n\n    if (Date.now() - startedAt >= budgetMs) {\n\n      return respond(\n        \"WAIT\",\n        \"MONITOR_TIME_BUDGET_REACHED\",\n        {attemptedDates}\n      );\n\n    }\n\n    attemptedDates.push(date);\n\n    const result =\n      orchestrateP36NBAInitializationLocked_(\n        lock,\n        date\n      );\n\n    /*\n     * Stop immediately when a run has been assigned,\n     * existing work needs resumption, or a safety\n     * condition requires intervention.\n     */\n\n    if (\n      result.action !== \"WAIT\" &&\n      result.action !== \"STOP\"\n    ) {\n\n      return {\n        ...result,\n        attemptedDates\n      };\n\n    }\n\n  }\n\n  return respond(\n    \"WAIT\",\n    \"NO_ELIGIBLE_COMPLETED_SLATE\",\n    {attemptedDates}\n  );\n\n}\n\n",
    context
  );

  f.run = () =>
    context.monitorP36NBASlatesLocked_(lock);

  return f;

}

const cases = [];

function test(name,fn) {
  cases.push([name,fn]);
}

test("Script lock required",() => {

  const f = fixture();

  f.held = false;

  assert.throws(
    () => f.run(),
    /SCRIPT_LOCK_REQUIRED/
  );

  assert.equal(f.events.length,0);

});

test("Invalid monitor date blocks",() => {

  const f = fixture();

  f.today = "2026-02-30";

  assert.equal(
    f.run().reason,
    "INVALID_MONITOR_DATE"
  );

  assert.equal(f.events.length,0);

});

test("Journal inspection precedes refresh",() => {

  const f = fixture();

  f.run();

  assert.ok(
    f.events.indexOf("inspect") <
    f.events.indexOf("refresh")
  );

});

test("Blocked recovery prevents refresh",() => {

  const f = fixture();

  f.recovery = {
    action:"BLOCK",
    reason:"CHECKPOINT_JOURNAL_BINDING_MISMATCH"
  };

  assert.equal(f.run().action,"BLOCK");
  assert.equal(f.count("refresh"),0);
  assert.equal(f.attempts.length,0);

});

test("Exact candidate recovery takes priority",() => {

  const f = fixture();

  f.recovery = {
    action:"RECOVER_ASSIGNMENT"
  };

  f.defaultResponse = {
    action:"RUN",
    recovered:true
  };

  assert.equal(f.run().recovered,true);
  assert.equal(f.count("refresh"),0);
  assert.equal(f.count("read-checkpoint"),0);
  assert.equal(f.attempts.length,1);

});

test("Pending reauthorization takes priority",() => {

  const f = fixture();

  f.recovery = {
    action:"REAUTHORIZE"
  };

  assert.equal(f.run().action,"WAIT");
  assert.equal(f.count("refresh"),0);
  assert.equal(f.attempts.length,1);

});

test("Unknown recovery action blocks",() => {

  const f = fixture();

  f.recovery = {
    action:"UNKNOWN"
  };

  assert.equal(
    f.run().reason,
    "UNKNOWN_MONITOR_RECOVERY_ACTION"
  );

  assert.equal(f.count("refresh"),0);

});

test("Missing checkpoint blocks",() => {

  const f = fixture();

  f.exists = false;

  assert.equal(
    f.run().reason,
    "CHECKPOINT_MISSING"
  );

  assert.equal(f.count("refresh"),0);

});

test("Suspended checkpoint preserved",() => {

  const f = fixture();

  f.state.suspended = true;

  assert.equal(
    f.run().reason,
    "CHECKPOINT_SUSPENDED"
  );

  assert.equal(f.count("refresh"),0);
  assert.equal(f.attempts.length,0);

});

test("Unfinished pipeline takes priority",() => {

  const f = fixture();

  f.state.completed = false;
  f.state.stage = "PLAYER_GAME_LOGS";

  f.defaultResponse = {
    action:"RESUME"
  };

  f.addSlate("2026-11-15");

  assert.equal(f.run().action,"RESUME");
  assert.equal(f.count("refresh"),0);
  assert.equal(f.attempts.length,1);

});

test("Completed checkpoint refreshes Schedule",() => {

  const f = fixture();

  f.run();

  assert.equal(f.count("refresh"),1);

  assert.ok(
    f.events.indexOf("refresh") <
    f.events.indexOf("load-registry")
  );

});

test("Freshly observed READY slate selected",() => {

  const f = fixture();

  f.onRefresh = () => f.addSlate(f.today);

  f.responses[f.today] = {
    action:"RUN"
  };

  assert.equal(f.run().action,"RUN");
  assert.deepEqual(f.attempts,[f.today]);

});

test("Oldest eligible slate prioritized",() => {

  const f = fixture();

  f.addSlate("2026-11-16");
  f.addSlate("2026-11-14");
  f.addSlate("2026-11-15");

  f.defaultResponse = {
    action:"RUN"
  };

  assert.equal(f.run().action,"RUN");

  assert.deepEqual(
    f.attempts,
    ["2026-11-14"]
  );

});

test("Only one successful assignment per invocation",() => {

  const f = fixture();

  f.addSlate("2026-11-15");
  f.addSlate("2026-11-16");

  f.defaultResponse = {
    action:"RUN",
    initialized:true
  };

  assert.equal(f.run().initialized,true);
  assert.equal(f.attempts.length,1);

});

test("WAIT permits next eligible candidate",() => {

  const f = fixture();

  f.addSlate("2026-11-15");
  f.addSlate("2026-11-16");

  f.responses["2026-11-16"] = {
    action:"RUN"
  };

  assert.equal(f.run().action,"RUN");

  assert.deepEqual(
    f.attempts,
    ["2026-11-15","2026-11-16"]
  );

});

test("STOP permits next eligible candidate",() => {

  const f = fixture();

  f.addSlate("2026-11-15");
  f.addSlate("2026-11-16");

  f.responses["2026-11-15"] = {
    action:"STOP"
  };

  f.responses["2026-11-16"] = {
    action:"RUN"
  };

  assert.equal(f.run().action,"RUN");
  assert.equal(f.attempts.length,2);

});

test("BLOCK prevents later candidate processing",() => {

  const f = fixture();

  f.addSlate("2026-11-15");
  f.addSlate("2026-11-16");

  f.defaultResponse = {
    action:"BLOCK"
  };

  assert.equal(f.run().action,"BLOCK");
  assert.equal(f.attempts.length,1);

});

test("RESUME prevents later candidate processing",() => {

  const f = fixture();

  f.addSlate("2026-11-15");
  f.addSlate("2026-11-16");

  f.defaultResponse = {
    action:"RESUME"
  };

  assert.equal(f.run().action,"RESUME");
  assert.equal(f.attempts.length,1);

});

test("TRACKING slate not selected as READY",() => {

  const f = fixture();

  f.addSlate("2026-11-14","TRACKING");
  f.addSlate("2026-11-15","READY");

  f.run();

  assert.deepEqual(
    f.attempts,
    ["2026-11-15"]
  );

});

test("PROCESSED slate not selected as READY",() => {

  const f = fixture();

  f.addSlate("2026-11-14","PROCESSED");
  f.addSlate("2026-11-15","READY");

  f.run();

  assert.deepEqual(
    f.attempts,
    ["2026-11-15"]
  );

});

test("Future slate excluded",() => {

  const f = fixture();

  f.addSlate("2026-11-17");
  f.addSlate("2026-11-15");

  f.run();

  assert.deepEqual(
    f.attempts,
    ["2026-11-15"]
  );

});

test("Empty registry falls back to current date",() => {

  const f = fixture();

  assert.equal(
    f.run().reason,
    "NO_ELIGIBLE_COMPLETED_SLATE"
  );

  assert.deepEqual(f.attempts,[f.today]);

});

test("No READY slates still permits reconciliation",() => {

  const f = fixture();

  f.addSlate("2026-11-15","PROCESSING");

  f.defaultResponse = {
    action:"WAIT",
    reconciled:true
  };

  f.run();

  assert.equal(f.attempts.length,1);

});

test("All candidates WAIT",() => {

  const f = fixture();

  f.addSlate("2026-11-15");
  f.addSlate("2026-11-16");

  const result = f.run();

  assert.equal(result.action,"WAIT");

  assert.equal(
    result.reason,
    "NO_ELIGIBLE_COMPLETED_SLATE"
  );

  assert.equal(result.attemptedDates.length,2);

});

test("Refresh failure prevents orchestration",() => {

  const f = fixture();

  f.failRefresh = true;

  assert.throws(
    () => f.run(),
    /INJECTED_SCHEDULE_REFRESH_FAILURE/
  );

  assert.equal(f.attempts.length,0);

});

test("Invalid registry prevents orchestration",() => {

  const f = fixture();

  f.invalidRegistry = true;

  assert.throws(
    () => f.run(),
    /INJECTED_INVALID_REGISTRY/
  );

  assert.equal(f.attempts.length,0);

});

test("Time budget exhausted by refresh",() => {

  const f = fixture();

  f.refreshDuration = 120000;

  assert.equal(
    f.run().reason,
    "MONITOR_TIME_BUDGET_REACHED"
  );

  assert.equal(f.attempts.length,0);

});

test("Time budget enforced between candidates",() => {

  const f = fixture();

  f.addSlate("2026-11-15");
  f.addSlate("2026-11-16");

  f.attemptDuration = 120000;

  const result = f.run();

  assert.equal(
    result.reason,
    "MONITOR_TIME_BUDGET_REACHED"
  );

  assert.equal(f.attempts.length,1);

});

test("Successful assignment retained at budget boundary",() => {

  const f = fixture();

  f.addSlate(f.today);

  f.attemptDuration = 120001;

  f.defaultResponse = {
    action:"RUN"
  };

  assert.equal(f.run().action,"RUN");
  assert.equal(f.attempts.length,1);

});

test("Orchestrator errors propagate without more attempts",() => {

  const f = fixture();

  f.addSlate("2026-11-15");
  f.addSlate("2026-11-16");

  Object.defineProperty(
    f.responses,
    "2026-11-15",
    {
      get() {
        throw new Error("INJECTED_ORCHESTRATOR_ERROR");
      }
    }
  );

  assert.throws(
    () => f.run(),
    /INJECTED_ORCHESTRATOR_ERROR/
  );

  assert.equal(f.attempts.length,1);

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
  hash(fs.readFileSync("nba-appscript")),
  expectedHash
);

console.log("ASSERTIONS:",cases.length);
console.log("PASS:",passed);
console.log("FAIL:",cases.length-passed);
console.log("EXECUTION ENVIRONMENT: LOCAL DEPENDENCY MOCKS");

console.log(
  "STATUS:",
  passed === cases.length ? "PASS" : "FAIL"
);

if (passed !== cases.length) {

  process.exitCode = 1;

}
