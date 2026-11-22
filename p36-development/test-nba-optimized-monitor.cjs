
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const crypto = require("node:crypto");

const expectedHash = "9bb431ae6f19cfdee6dab45e68ac9ced71b5b25449e2a1ded34a3b90b6bc1079";

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

    registryRawReads:0,
    checkpointReads:0,
    maintenanceBytes:500,
    maintenanceDuration:0,
    integrityValid:true,
    warnings:[],

    reconciliation:{
      action:"WAIT",
      reconciled:false
    },

    maintenance:{
      action:"WAIT",
      maintained:true,
      removedSlateKeys:[]
    },
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
      slateKey:"NBA:"+date,
      runId:"run-"+date,
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

    Logger:{
      log:value => f.warnings.push(String(value))
    },

    Utilities:{
      newBlob:value => ({
        getBytes:() =>
          Array.from(Buffer.from(value,"utf8"))
      })
    },

    getNBADailyPlayerGameLogTeams_:() => {

      f.events.push("resolve-teams");

      return [];

    },

    validateP36NBACompletedCheckpoint_:() => {

      f.events.push("validate-completion");

      return {
        valid:f.integrityValid,
        reason:"SIMULATED_INTEGRITY_RESULT"
      };

    },

    reconcileP36NBACompletionLocked_:receivedLock => {

      assert.equal(receivedLock,lock);

      f.events.push("reconcile");

      return f.reconciliation;

    },

    maintainP36NBARegistryLocked_:receivedLock => {

      assert.equal(receivedLock,lock);

      f.events.push("maintain");

      f.now += f.maintenanceDuration;

      return {
        ...f.maintenance,
        bytesAfter:f.maintenanceBytes
      };

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

      f.checkpointReads++;

      return {

        exists:f.exists,

        raw:
          f.changeCheckpoint &&
          f.checkpointReads > 1
            ? "changed-checkpoint"
            : JSON.stringify(f.state),

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

      f.registryRawReads++;

      return {

        registry:f.registry,

        raw:
          f.changeRegistry &&
          f.registryRawReads > 1
            ? "changed-registry"
            : JSON.stringify(f.registry)

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
    "\n\n/*\n * Evaluate the next safe NBA pipeline action.\n *\n * Lifecycle priority:\n * 1. Initialization recovery\n * 2. Existing unfinished work\n * 3. Verified completion reconciliation\n * 4. Protected registry maintenance\n * 5. Schedule observation\n * 6. Fresh initialization authorization\n *\n * Does not execute the mother pipeline or modify triggers.\n */\n\nfunction monitorP36NBASlatesLocked_(lock) {\n\n  if (!lock || lock.hasLock() !== true) {\n\n    throw new Error(\"SCRIPT_LOCK_REQUIRED\");\n\n  }\n\n  const startedAt = Date.now();\n\n  const budgetMs = 120000;\n\n  const capacityWarningBytes = 6500;\n\n  const capacityLimitBytes = 8000;\n\n  const respond = (action,reason,extra = {}) => ({\n    action,\n    reason,\n    ...extra\n  });\n\n  const today = getTodayString_();\n\n  if (!isValidP36Date_(today)) {\n\n    return respond(\n      \"BLOCK\",\n      \"INVALID_MONITOR_DATE\"\n    );\n\n  }\n\n  /*\n   * Recovery must precede all ordinary maintenance\n   * and Schedule operations.\n   */\n\n  const recovery =\n    inspectP36NBABoundJournalLocked_(lock);\n\n  if (recovery.action === \"BLOCK\") {\n\n    return respond(\"BLOCK\",recovery.reason);\n\n  }\n\n  if (\n    recovery.action === \"RECOVER_ASSIGNMENT\" ||\n    recovery.action === \"REAUTHORIZE\"\n  ) {\n\n    return orchestrateP36NBAInitializationLocked_(\n      lock,\n      today\n    );\n\n  }\n\n  if (recovery.action !== \"NO_ACTION\") {\n\n    return respond(\n      \"BLOCK\",\n      \"UNKNOWN_MONITOR_RECOVERY_ACTION\"\n    );\n\n  }\n\n  const checkpoint =\n    readP36NBACheckpointLocked_(lock);\n\n  if (!checkpoint.exists) {\n\n    return respond(\"BLOCK\",\"CHECKPOINT_MISSING\");\n\n  }\n\n  if (checkpoint.state.suspended === true) {\n\n    return respond(\"BLOCK\",\"CHECKPOINT_SUSPENDED\");\n\n  }\n\n  if (checkpoint.state.completed !== true) {\n\n    return orchestrateP36NBAInitializationLocked_(\n      lock,\n      today\n    );\n\n  }\n\n  const properties =\n    PropertiesService.getScriptProperties();\n\n  const initialRegistry =\n    loadP36SlateRegistry_(\"NBA\",properties);\n\n  validateP36RetentionBoundary_(\n    initialRegistry.registry\n  );\n\n  /*\n   * Only unresolved completion assignments require\n   * team inventory resolution during idle monitoring.\n   */\n\n  const processing =\n    Object.values(initialRegistry.registry.slates)\n      .filter(\n        slate => slate.state === \"PROCESSING\"\n      );\n\n  if (processing.length > 0) {\n\n    if (\n      processing.length !== 1 ||\n      processing[0].slateKey !==\n        checkpoint.state.p36SlateKey ||\n      processing[0].runId !==\n        checkpoint.state.p36RunId\n    ) {\n\n      return respond(\n        \"BLOCK\",\n        \"PROCESSING_ASSIGNMENT_INVALID\"\n      );\n\n    }\n\n    const playerTeams =\n      getNBADailyPlayerGameLogTeams_();\n\n    const completion =\n      validateP36NBACompletedCheckpoint_(\n        checkpoint.state,\n        playerTeams\n      );\n\n    if (completion.valid !== true) {\n\n      return respond(\n        \"BLOCK\",\n        \"PREVIOUS_CHECKPOINT_INTEGRITY_FAILED\",\n        {\n          validationReason:completion.reason\n        }\n      );\n\n    }\n\n  }\n\n  /*\n   * Protect against state changes during validation.\n   */\n\n  if (\n    readP36NBACheckpointLocked_(lock).raw !==\n      checkpoint.raw ||\n    loadP36SlateRegistry_(\"NBA\",properties).raw !==\n      initialRegistry.raw\n  ) {\n\n    return respond(\n      \"BLOCK\",\n      \"MONITOR_COMPLETION_BINDING_CHANGED\"\n    );\n\n  }\n\n  /*\n   * Reconcile before any Schedule API request.\n   */\n\n  const reconciliation =\n    reconcileP36NBACompletionLocked_(lock);\n\n  if (reconciliation.action !== \"WAIT\") {\n\n    return reconciliation;\n\n  }\n\n  /*\n   * Automatic maintenance before adding slate records.\n   */\n\n  const maintenance =\n    maintainP36NBARegistryLocked_(lock);\n\n  if (\n    maintenance.action !== \"WAIT\" ||\n    maintenance.maintained !== true\n  ) {\n\n    return maintenance;\n\n  }\n\n  const bytesBeforeRefresh =\n    maintenance.bytesAfter;\n\n  if (\n    !Number.isSafeInteger(bytesBeforeRefresh) ||\n    bytesBeforeRefresh < 1\n  ) {\n\n    return respond(\n      \"BLOCK\",\n      \"INVALID_REGISTRY_CAPACITY_METRICS\"\n    );\n\n  }\n\n  if (bytesBeforeRefresh >= capacityWarningBytes) {\n\n    Logger.log(\n      \"P36 NBA registry capacity warning: \" +\n      bytesBeforeRefresh + \"/\" +\n      capacityLimitBytes + \" bytes\"\n    );\n\n  }\n\n  if (bytesBeforeRefresh >= capacityLimitBytes) {\n\n    return respond(\n      \"BLOCK\",\n      \"REGISTRY_CAPACITY_EXHAUSTED\",\n      {\n        registryBytes:bytesBeforeRefresh\n      }\n    );\n\n  }\n\n  if (Date.now() - startedAt >= budgetMs) {\n\n    return respond(\n      \"WAIT\",\n      \"MONITOR_TIME_BUDGET_REACHED\",\n      {\n        attemptedDates:[]\n      }\n    );\n\n  }\n\n  /*\n   * Observe current and historical pending slates.\n   */\n\n  refreshP36NBAScheduleLocked_(lock);\n\n  const loaded =\n    loadP36SlateRegistry_(\"NBA\",properties);\n\n  validateP36RetentionBoundary_(\n    loaded.registry\n  );\n\n  const registryBytes =\n    Utilities.newBlob(\n      JSON.stringify(loaded.registry)\n    ).getBytes().length;\n\n  if (registryBytes >= capacityWarningBytes) {\n\n    Logger.log(\n      \"P36 NBA registry capacity warning: \" +\n      registryBytes + \"/\" +\n      capacityLimitBytes + \" bytes\"\n    );\n\n  }\n\n  const dates =\n    getP36SlateRefreshDates_(\n      loaded.registry,\n      today\n    );\n\n  const readyDates = dates.filter(date => {\n\n    const slate =\n      loaded.registry.slates[\"NBA:\" + date];\n\n    return slate &&\n      slate.state === \"READY\";\n\n  });\n\n  /*\n   * No fallback initialization attempt.\n   * Ordinary idle monitoring ends here.\n   */\n\n  if (readyDates.length === 0) {\n\n    return respond(\n      \"WAIT\",\n      \"NO_ELIGIBLE_COMPLETED_SLATE\",\n      {\n        attemptedDates:[],\n        registryBytes,\n        reconciled:\n          reconciliation.reconciled === true,\n        removedSlateCount:\n          maintenance.removedSlateKeys.length\n      }\n    );\n\n  }\n\n  const attemptedDates = [];\n\n  for (const date of readyDates) {\n\n    if (Date.now() - startedAt >= budgetMs) {\n\n      return respond(\n        \"WAIT\",\n        \"MONITOR_TIME_BUDGET_REACHED\",\n        {\n          attemptedDates,\n          registryBytes\n        }\n      );\n\n    }\n\n    attemptedDates.push(date);\n\n    /*\n     * Fresh authorization and checkpoint integrity\n     * remain independently enforced by the orchestrator.\n     */\n\n    const result =\n      orchestrateP36NBAInitializationLocked_(\n        lock,\n        date\n      );\n\n    if (\n      result.action !== \"WAIT\" &&\n      result.action !== \"STOP\"\n    ) {\n\n      return {\n        ...result,\n        attemptedDates\n      };\n\n    }\n\n  }\n\n  return respond(\n    \"WAIT\",\n    \"NO_ELIGIBLE_COMPLETED_SLATE\",\n    {\n      attemptedDates,\n      registryBytes\n    }\n  );\n\n}\n\n",
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
    f.events.indexOf("reconcile") <
    f.events.indexOf("refresh")
  );

  assert.ok(
    f.events.indexOf("maintain") <
    f.events.indexOf("refresh")
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

test("Empty registry avoids initialization fallback",() => {

  const f = fixture();

  assert.equal(
    f.run().reason,
    "NO_ELIGIBLE_COMPLETED_SLATE"
  );

  assert.equal(f.attempts.length,0);

  assert.equal(f.count("resolve-teams"),0);

});

test("No READY slates still permits reconciliation",() => {

  const f = fixture();

  f.addSlate("2026-11-15","PROCESSING");

  f.state.p36SlateKey = "NBA:2026-11-15";
  f.state.p36RunId = "run-2026-11-15";

  f.reconciliation.reconciled = true;

  const result = f.run();

  assert.equal(result.reconciled,true);

  assert.equal(f.attempts.length,0);

  assert.equal(f.count("validate-completion"),1);

  assert.equal(f.count("reconcile"),1);

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

  f.addSlate(f.today);

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



test("Idle monitoring skips team inventory resolution",() => {

  const f = fixture();

  f.run();

  assert.equal(f.count("resolve-teams"),0);
  assert.equal(f.attempts.length,0);
  assert.equal(f.count("maintain"),1);

});

test("Recovery bypasses maintenance",() => {

  const f = fixture();

  f.recovery = {
    action:"RECOVER_ASSIGNMENT"
  };

  f.run();

  assert.equal(f.count("maintain"),0);
  assert.equal(f.count("reconcile"),0);

});

test("Unfinished pipeline bypasses maintenance",() => {

  const f = fixture();

  f.state.completed = false;
  f.state.stage = "PLAYER_GAME_LOGS";

  f.run();

  assert.equal(f.count("maintain"),0);
  assert.equal(f.count("refresh"),0);

});

test("Suspended checkpoint bypasses maintenance",() => {

  const f = fixture();

  f.state.suspended = true;

  assert.equal(f.run().action,"BLOCK");
  assert.equal(f.count("maintain"),0);

});

test("Completion integrity validation precedes reconciliation",() => {

  const f = fixture();

  f.addSlate("2026-11-15","PROCESSING");

  f.state.p36SlateKey = "NBA:2026-11-15";
  f.state.p36RunId = "run-2026-11-15";

  f.run();

  assert.ok(
    f.events.indexOf("validate-completion") <
    f.events.indexOf("reconcile")
  );

});

test("Invalid completion evidence blocks reconciliation",() => {

  const f = fixture();

  f.addSlate("2026-11-15","PROCESSING");

  f.state.p36SlateKey = "NBA:2026-11-15";
  f.state.p36RunId = "run-2026-11-15";

  f.integrityValid = false;

  assert.equal(
    f.run().reason,
    "PREVIOUS_CHECKPOINT_INTEGRITY_FAILED"
  );

  assert.equal(f.count("reconcile"),0);
  assert.equal(f.count("refresh"),0);

});

test("Mismatched processing assignment blocks",() => {

  const f = fixture();

  f.addSlate("2026-11-15","PROCESSING");

  assert.equal(
    f.run().reason,
    "PROCESSING_ASSIGNMENT_INVALID"
  );

  assert.equal(f.count("resolve-teams"),0);
  assert.equal(f.count("maintain"),0);

});

test("Concurrent checkpoint change blocks",() => {

  const f = fixture();

  f.changeCheckpoint = true;

  assert.equal(
    f.run().reason,
    "MONITOR_COMPLETION_BINDING_CHANGED"
  );

  assert.equal(f.count("reconcile"),0);

});

test("Concurrent registry change blocks",() => {

  const f = fixture();

  f.changeRegistry = true;

  assert.equal(
    f.run().reason,
    "MONITOR_COMPLETION_BINDING_CHANGED"
  );

  assert.equal(f.count("maintain"),0);

});

test("Blocked reconciliation prevents maintenance",() => {

  const f = fixture();

  f.reconciliation = {
    action:"BLOCK",
    reason:"ASSIGNMENT_MISMATCH"
  };

  assert.equal(f.run().action,"BLOCK");
  assert.equal(f.count("maintain"),0);
  assert.equal(f.count("refresh"),0);

});

test("Blocked maintenance prevents Schedule refresh",() => {

  const f = fixture();

  f.maintenance = {
    action:"BLOCK",
    maintained:false
  };

  assert.equal(f.run().action,"BLOCK");
  assert.equal(f.count("refresh"),0);

});

test("Deferred maintenance prevents initialization",() => {

  const f = fixture();

  f.maintenance = {
    action:"WAIT",
    maintained:false,
    reason:"INITIALIZATION_JOURNAL_PENDING"
  };

  f.addSlate(f.today);

  assert.equal(
    f.run().reason,
    "INITIALIZATION_JOURNAL_PENDING"
  );

  assert.equal(f.attempts.length,0);

});

test("Invalid capacity metric blocks",() => {

  const f = fixture();

  f.maintenanceBytes = -1;

  assert.equal(
    f.run().reason,
    "INVALID_REGISTRY_CAPACITY_METRICS"
  );

  assert.equal(f.count("refresh"),0);

});

test("Capacity warning does not block monitoring",() => {

  const f = fixture();

  f.maintenanceBytes = 6500;

  assert.equal(f.run().action,"WAIT");

  assert.ok(
    f.warnings.some(
      warning => warning.includes("6500/8000")
    )
  );

  assert.equal(f.count("refresh"),1);

});

test("Exhausted capacity blocks Schedule growth",() => {

  const f = fixture();

  f.maintenanceBytes = 8000;

  assert.equal(
    f.run().reason,
    "REGISTRY_CAPACITY_EXHAUSTED"
  );

  assert.equal(f.count("refresh"),0);
  assert.equal(f.attempts.length,0);

});

test("Maintenance time counts toward monitor budget",() => {

  const f = fixture();

  f.maintenanceDuration = 120000;

  assert.equal(
    f.run().reason,
    "MONITOR_TIME_BUDGET_REACHED"
  );

  assert.equal(f.count("refresh"),0);

});

test("Schedule failure occurs after reconciliation",() => {

  const f = fixture();

  f.failRefresh = true;

  assert.throws(
    () => f.run(),
    /INJECTED_SCHEDULE_REFRESH_FAILURE/
  );

  assert.equal(f.count("reconcile"),1);
  assert.equal(f.count("maintain"),1);
  assert.equal(f.attempts.length,0);

});

test("Maintenance removal metrics reported",() => {

  const f = fixture();

  f.maintenance.removedSlateKeys = [
    "NBA:2026-10-01",
    "NBA:2026-10-02"
  ];

  const result = f.run();

  assert.equal(result.removedSlateCount,2);

  assert.ok(result.registryBytes > 0);

});

test("Processed checkpoint avoids team resolution",() => {

  const f = fixture();

  f.addSlate("2026-11-15","PROCESSED");

  f.state.p36SlateKey = "NBA:2026-11-15";
  f.state.p36RunId = "run-2026-11-15";

  f.run();

  assert.equal(f.count("resolve-teams"),0);
  assert.equal(f.count("maintain"),1);
  assert.equal(f.attempts.length,0);

});

test("READY slate still invokes fresh orchestration",() => {

  const f = fixture();

  f.addSlate(f.today);

  f.defaultResponse = {
    action:"RUN",
    initialized:true
  };

  assert.equal(f.run().action,"RUN");

  assert.deepEqual(f.attempts,[f.today]);

  assert.ok(
    f.events.indexOf("maintain") <
    f.events.indexOf("orchestrate")
  );

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
