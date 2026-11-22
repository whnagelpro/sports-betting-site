
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const crypto = require("node:crypto");

const expectedHash = "027da53a71f837f0da97bc917ebec1254df28bb847cda9294a7fb9353288a167";

const hash = value => crypto
  .createHash("sha256")
  .update(value)
  .digest("hex");

assert.equal(
  hash(fs.readFileSync("nba-appscript")),
  expectedHash
);

const clone = value =>
  JSON.parse(JSON.stringify(value));

const bytes = value =>
  Buffer.byteLength(value,"utf8");

function fixture() {

  const f = {

    today:"2026-11-16",
    held:true,
    exists:true,

    registry:{
      version:1,
      league:"NBA",
      slates:{}
    },

    state:{
      completed:true,
      stage:"COMPLETE"
    },

    journal:null,

    reads:{
      checkpoint:0,
      registry:0,
      journal:0
    },

    writes:0,
    failWrite:false,
    badReadback:false,

    invalidRegistry:false,
    invalidJournal:false

  };

  f.addSlate = (
    date,
    state = "PROCESSED",
    runId = null
  ) => {

    const key = "NBA:"+date;

    f.registry.slates[key] = {

      slateKey:key,
      slateDate:date,

      inventory:{
        expectedGameIds:["1","2","3"]
      },

      state,

      runId:[
        "PROCESSING","PROCESSED"
      ].includes(state)
        ? runId || "run-"+date
        : null

    };

    return key;

  };

  f.assign = date => {

    const key = "NBA:"+date;

    f.state.p36SlateKey = key;

    f.state.p36RunId =
      f.registry.slates[key].runId;

  };

  f.pending = date => {

    f.journal = {

      slateKey:"NBA:"+date,
      slateDate:date,
      runId:"pending-run-"+date

    };

  };

  f.raw = () =>
    JSON.stringify(f.registry);

  const properties = {};

  const lock = {
    hasLock:() => f.held
  };

  const context = vm.createContext({

    Date,

    PropertiesService:{

      getScriptProperties:() => properties

    },

    Utilities:{

      newBlob:value => ({

        getBytes:() =>
          Array.from(Buffer.from(value,"utf8"))

      })

    },

    getTodayString_:() => f.today,

    validateP36SlateRegistry_:registry => {

      if (
        f.invalidRegistry ||
        !registry ||
        registry.league !== "NBA" ||
        !registry.slates
      ) {

        throw new Error(
          "INJECTED_INVALID_REGISTRY"
        );

      }

    },

    readP36NBACheckpointLocked_:receivedLock => {

      assert.equal(receivedLock,lock);

      f.reads.checkpoint++;

      if (
        f.changeCheckpoint &&
        f.reads.checkpoint === 2
      ) {

        f.state.unexpected = true;

      }

      return {

        exists:f.exists,

        state:f.exists
          ? clone(f.state)
          : null,

        raw:f.exists
          ? JSON.stringify(f.state)
          : null

      };

    },

    loadP36SlateRegistry_:() => {

      f.reads.registry++;

      if (
        f.changeRegistry &&
        f.reads.registry === 2
      ) {

        f.registry.unexpected = true;

      }

      return {

        registry:clone(f.registry),

        raw:f.badReadback && f.writes > 0
          ? "incorrect-readback"
          : f.raw()

      };

    },

    loadP36Journal_:() => {

      f.reads.journal++;

      if (
        f.changeJournal &&
        f.reads.journal === 2
      ) {

        f.journal = {

          slateKey:"NBA:2026-11-15",
          runId:"unexpected"

        };

      }

      return {

        journal:f.journal
          ? clone(f.journal)
          : null,

        raw:f.journal
          ? JSON.stringify(f.journal)
          : null

      };

    },

    validateP36NBABoundJournal_:() => {

      if (f.invalidJournal) {

        throw new Error(
          "INJECTED_INVALID_JOURNAL"
        );

      }

    },

    saveP36SlateRegistry_:
      (league,props,registry,expectedRaw,getByteLength) => {

        assert.equal(league,"NBA");
        assert.equal(props,properties);
        assert.equal(expectedRaw,f.raw());

        if (f.failWrite) {

          throw new Error(
            "INJECTED_REGISTRY_WRITE_FAILURE"
          );

        }

        const raw = JSON.stringify(registry);

        assert.equal(
          getByteLength(raw),
          bytes(raw)
        );

        if (getByteLength(raw) > 8000) {

          throw new Error(
            "REGISTRY_STORAGE_LIMIT_EXCEEDED"
          );

        }

        f.registry = clone(registry);
        f.writes++;

        return {

          saved:true,
          raw,
          bytes:getByteLength(raw)

        };

      }

  });

  vm.runInContext(
    "function isValidP36Date_(value) {\n\n  return (\n    typeof value === \"string\" &&\n    /^\\d{4}-\\d{2}-\\d{2}$/.test(value) &&\n    Number.isFinite(Date.parse(value)) &&\n    new Date(value).toISOString().slice(0,10) === value\n  );\n\n}\n\nfunction validateP36RetentionBoundary_(registry) {\n\n  validateP36SlateRegistry_(registry);\n\n  const boundary =\n    registry.retiredThrough ?? null;\n\n  if (\n    boundary !== null &&\n    !isValidP36Date_(boundary)\n  ) {\n    throw new Error(\"INVALID_RETIREMENT_BOUNDARY\");\n  }\n\n  return boundary;\n\n}\n\nfunction compactP36SlateRegistry_(\n  registry,\n  today,\n  retentionDays = 14,\n  protectedSlateKeys = []\n) {\n\n  const previousBoundary =\n    validateP36RetentionBoundary_(registry);\n\n  if (!isValidP36Date_(today)) {\n    throw new Error(\"INVALID_TODAY_DATE\");\n  }\n\n  if (\n    !Number.isSafeInteger(retentionDays) ||\n    retentionDays < 1 ||\n    retentionDays > 365\n  ) {\n    throw new Error(\"INVALID_RETENTION_DAYS\");\n  }\n\n  if (\n    previousBoundary !== null &&\n    previousBoundary >= today\n  ) {\n    throw new Error(\"INVALID_RETIREMENT_CHRONOLOGY\");\n  }\n\n  if (!Array.isArray(protectedSlateKeys)) {\n    throw new Error(\"INVALID_PROTECTED_SLATE_KEYS\");\n  }\n\n  const protectedKeys = new Set();\n\n  for (const key of protectedSlateKeys) {\n\n    if (\n      typeof key !== \"string\" ||\n      !Object.prototype.hasOwnProperty.call(\n        registry.slates,key\n      )\n    ) {\n      throw new Error(\"INVALID_PROTECTED_SLATE_KEY\");\n    }\n\n    protectedKeys.add(key);\n\n  }\n\n  const cutoff = new Date(`${today}T00:00:00Z`);\n\n  cutoff.setUTCDate(\n    cutoff.getUTCDate() - retentionDays - 1\n  );\n\n  const eligibleThrough =\n    cutoff.toISOString().slice(0,10);\n\n  const boundary =\n    previousBoundary &&\n    previousBoundary > eligibleThrough\n      ? previousBoundary\n      : eligibleThrough;\n\n  const next =\n    JSON.parse(JSON.stringify(registry));\n\n  const removedSlateKeys = [];\n\n  for (const [key,slate] of Object.entries(next.slates)) {\n\n    if (\n      slate.state === \"PROCESSED\" &&\n      slate.slateDate <= boundary &&\n      !protectedKeys.has(key)\n    ) {\n\n      delete next.slates[key];\n      removedSlateKeys.push(key);\n\n    }\n\n  }\n\n  next.retiredThrough = boundary;\n\n  validateP36RetentionBoundary_(next);\n\n  return {\n    changed:\n      JSON.stringify(next) !== JSON.stringify(registry),\n    registry: next,\n    removedSlateKeys: removedSlateKeys.sort(),\n    retiredThrough: boundary\n  };\n\n}\n\nfunction maintainP36NBARegistryLocked_(\n  lock,\n  retentionDays = 14\n) {\n\n  if (\n    !lock ||\n    lock.hasLock() !== true\n  ) {\n\n    throw new Error(\"SCRIPT_LOCK_REQUIRED\");\n\n  }\n\n  const today = getTodayString_();\n\n  if (!isValidP36Date_(today)) {\n\n    throw new Error(\"INVALID_MAINTENANCE_DATE\");\n\n  }\n\n  const properties =\n    PropertiesService.getScriptProperties();\n\n  const loaded =\n    loadP36SlateRegistry_(\n      \"NBA\",properties\n    );\n\n  validateP36RetentionBoundary_(\n    loaded.registry\n  );\n\n  const checkpoint =\n    readP36NBACheckpointLocked_(lock);\n\n  if (!checkpoint.exists) {\n\n    return {\n      maintained:false,\n      action:\"BLOCK\",\n      reason:\"CHECKPOINT_MISSING\"\n    };\n\n  }\n\n  const pending =\n    loadP36Journal_(\n      \"NBA\",properties\n    );\n\n  const protectedKeys = new Set();\n\n  /*\n   * Preserve the current checkpoint's slate,\n   * regardless of its age.\n   */\n\n  const state = checkpoint.state;\n\n  if (\n    state.p36SlateKey != null ||\n    state.p36RunId != null\n  ) {\n\n    const assigned =\n      loaded.registry.slates[state.p36SlateKey];\n\n    if (\n      !assigned ||\n      assigned.runId !== state.p36RunId ||\n      ![\"PROCESSING\",\"PROCESSED\"].includes(\n        assigned.state\n      ) ||\n      (\n        assigned.state === \"PROCESSED\" &&\n        state.completed !== true\n      )\n    ) {\n\n      return {\n        maintained:false,\n        action:\"BLOCK\",\n        reason:\"MAINTENANCE_CHECKPOINT_ASSIGNMENT_MISMATCH\"\n      };\n\n    }\n\n    protectedKeys.add(\n      state.p36SlateKey\n    );\n\n  }\n\n  /*\n   * Preserve pending initialization evidence.\n   * Defer all maintenance until recovery concludes.\n   */\n\n  if (pending.raw !== null) {\n\n    validateP36NBABoundJournal_(\n      pending.journal\n    );\n\n    const pendingSlate =\n      loaded.registry.slates[\n        pending.journal.slateKey\n      ];\n\n    if (\n      !pendingSlate ||\n      ![\"READY\",\"PROCESSING\"].includes(\n        pendingSlate.state\n      ) ||\n      (\n        pendingSlate.state === \"PROCESSING\" &&\n        pendingSlate.runId !== pending.journal.runId\n      )\n    ) {\n\n      return {\n        maintained:false,\n        action:\"BLOCK\",\n        reason:\"MAINTENANCE_JOURNAL_ASSIGNMENT_MISMATCH\"\n      };\n\n    }\n\n    protectedKeys.add(\n      pending.journal.slateKey\n    );\n\n    return {\n      maintained:false,\n      action:\"WAIT\",\n      reason:\"INITIALIZATION_JOURNAL_PENDING\",\n      protectedSlateKeys:[...protectedKeys].sort()\n    };\n\n  }\n\n  const protectedSlateKeys =\n    [...protectedKeys].sort();\n\n  const compacted =\n    compactP36SlateRegistry_(\n      loaded.registry,\n      today,\n      retentionDays,\n      protectedSlateKeys\n    );\n\n  /*\n   * Verify that all protected and unprocessed\n   * records remain unchanged.\n   */\n\n  for (\n    const [key,slate] of\n    Object.entries(loaded.registry.slates)\n  ) {\n\n    if (\n      slate.state !== \"PROCESSED\" ||\n      protectedKeys.has(key)\n    ) {\n\n      if (\n        JSON.stringify(\n          compacted.registry.slates[key]\n        ) !== JSON.stringify(slate)\n      ) {\n\n        throw new Error(\n          \"P36_NBA_MAINTENANCE_PROTECTED_SLATE_CHANGED\"\n        );\n\n      }\n\n    }\n\n  }\n\n  const getByteLength = value =>\n    Utilities.newBlob(value).getBytes().length;\n\n  const bytesBefore =\n    getByteLength(\n      JSON.stringify(loaded.registry)\n    );\n\n  const bytesAfter =\n    getByteLength(\n      JSON.stringify(compacted.registry)\n    );\n\n  /*\n   * Recheck the checkpoint, registry and journal\n   * immediately before persistence.\n   */\n\n  if (\n    readP36NBACheckpointLocked_(lock).raw !==\n      checkpoint.raw ||\n    loadP36SlateRegistry_(\"NBA\",properties).raw !==\n      loaded.raw ||\n    loadP36Journal_(\"NBA\",properties).raw !==\n      pending.raw\n  ) {\n\n    return {\n      maintained:false,\n      action:\"BLOCK\",\n      reason:\"MAINTENANCE_STATE_CHANGED\"\n    };\n\n  }\n\n  if (!compacted.changed) {\n\n    return {\n      maintained:true,\n      action:\"WAIT\",\n      reason:\"REGISTRY_MAINTENANCE_UNCHANGED\",\n      saved:false,\n      removedSlateKeys:[],\n      protectedSlateKeys,\n      retiredThrough:compacted.retiredThrough,\n      bytesBefore,\n      bytesAfter\n    };\n\n  }\n\n  const saved =\n    saveP36SlateRegistry_(\n      \"NBA\",\n      properties,\n      compacted.registry,\n      loaded.raw,\n      getByteLength\n    );\n\n  const verified =\n    loadP36SlateRegistry_(\n      \"NBA\",properties\n    );\n\n  if (\n    verified.raw !== saved.raw ||\n    verified.raw !== JSON.stringify(\n      compacted.registry\n    )\n  ) {\n\n    throw new Error(\n      \"P36_NBA_MAINTENANCE_READBACK_MISMATCH\"\n    );\n\n  }\n\n  return {\n    maintained:true,\n    action:\"WAIT\",\n    reason:\"REGISTRY_MAINTENANCE_COMPLETE\",\n    saved:saved.saved,\n    removedSlateKeys:compacted.removedSlateKeys,\n    protectedSlateKeys,\n    retiredThrough:compacted.retiredThrough,\n    bytesBefore,\n    bytesAfter\n  };\n\n}",
    context
  );

  f.run = (retentionDays = 14) =>
    context.maintainP36NBARegistryLocked_(
      lock,retentionDays
    );

  f.compact = (
    retentionDays = 14,
    protectedKeys = []
  ) => context.compactP36SlateRegistry_(
    f.registry,
    f.today,
    retentionDays,
    protectedKeys
  );

  f.has = key =>
    Object.prototype.hasOwnProperty.call(
      f.registry.slates,key
    );

  return f;

}

const cases = [];

function test(name,fn) {
  cases.push([name,fn]);
}

test("Default compaction removes expired processed slate",() => {

  const f = fixture();

  const old = f.addSlate("2026-10-01");

  const result = f.compact();

  assert.equal(result.registry.slates[old],undefined);

});

test("Protected compaction retains expired processed slate",() => {

  const f = fixture();

  const old = f.addSlate("2026-10-01");

  const result = f.compact(14,[old]);

  assert.ok(result.registry.slates[old]);

  assert.equal(result.removedSlateKeys.length,0);

});

test("Compaction preserves original input",() => {

  const f = fixture();

  f.addSlate("2026-10-01");

  const before = f.raw();

  f.compact();

  assert.equal(f.raw(),before);

});

test("Invalid protected key collection rejected",() => {

  const f = fixture();

  assert.throws(
    () => f.compact(14,"invalid"),
    /INVALID_PROTECTED_SLATE_KEYS/
  );

});

test("Unknown protected slate rejected",() => {

  const f = fixture();

  assert.throws(
    () => f.compact(14,["NBA:2026-10-01"]),
    /INVALID_PROTECTED_SLATE_KEY/
  );

});

test("Expired unprotected slate removed",() => {

  const f = fixture();

  const old = f.addSlate("2026-10-01");

  const result = f.run();

  assert.equal(result.maintained,true);
  assert.equal(result.saved,true);
  assert.equal(f.has(old),false);
  assert.equal(f.writes,1);

});

test("Recent processed slate preserved",() => {

  const f = fixture();

  const recent = f.addSlate("2026-11-15");

  f.run();

  assert.equal(f.has(recent),true);

});

test("Exact retention boundary removed",() => {

  const f = fixture();

  const boundary = f.addSlate("2026-11-01");

  const result = f.run();

  assert.equal(result.retiredThrough,"2026-11-01");
  assert.equal(f.has(boundary),false);

});

test("Fourteen-day retained slate preserved",() => {

  const f = fixture();

  const recent = f.addSlate("2026-11-02");

  f.run();

  assert.equal(f.has(recent),true);

});

test("Expired tracking slate preserved",() => {

  const f = fixture();

  const key = f.addSlate("2026-10-01","TRACKING");

  f.run();

  assert.equal(f.has(key),true);

});

test("Expired ready slate preserved",() => {

  const f = fixture();

  const key = f.addSlate("2026-10-01","READY");

  f.run();

  assert.equal(f.has(key),true);

});

test("Expired processing slate preserved",() => {

  const f = fixture();

  const key = f.addSlate("2026-10-01","PROCESSING");

  f.assign("2026-10-01");
  f.state.completed = false;
  f.state.stage = "PLAYER_GAME_LOGS";

  f.run();

  assert.equal(f.has(key),true);

});

test("Current completed checkpoint reference preserved",() => {

  const f = fixture();

  const key = f.addSlate("2026-10-01");

  const removable = f.addSlate("2026-10-02");

  f.assign("2026-10-01");

  const before = JSON.stringify(f.state);

  const result = f.run();

  assert.equal(f.has(key),true);
  assert.equal(f.has(removable),false);

  assert.ok(
    result.protectedSlateKeys.includes(key)
  );

  assert.equal(JSON.stringify(f.state),before);

});

test("Old checkpoint can be retired after reassignment",() => {

  const f = fixture();

  const old = f.addSlate("2026-10-01");

  const recent = f.addSlate("2026-11-15");

  f.assign("2026-10-01");

  f.run();

  assert.equal(f.has(old),true);

  f.assign("2026-11-15");

  f.run();

  assert.equal(f.has(old),false);
  assert.equal(f.has(recent),true);

});

test("Missing checkpoint blocks maintenance",() => {

  const f = fixture();

  f.exists = false;

  assert.equal(f.run().reason,"CHECKPOINT_MISSING");
  assert.equal(f.writes,0);

});

test("Missing checkpoint assignment blocks",() => {

  const f = fixture();

  f.state.p36SlateKey = "NBA:2026-10-01";
  f.state.p36RunId = "missing-run";

  assert.equal(
    f.run().reason,
    "MAINTENANCE_CHECKPOINT_ASSIGNMENT_MISMATCH"
  );

  assert.equal(f.writes,0);

});

test("Mismatched checkpoint run identity blocks",() => {

  const f = fixture();

  f.addSlate("2026-10-01");
  f.assign("2026-10-01");

  f.state.p36RunId = "incorrect-run";

  assert.equal(f.run().action,"BLOCK");
  assert.equal(f.writes,0);

});

test("Incomplete checkpoint cannot reference PROCESSED",() => {

  const f = fixture();

  f.addSlate("2026-10-01");
  f.assign("2026-10-01");

  f.state.completed = false;
  f.state.stage = "PLAYER_GAME_LOGS";

  assert.equal(f.run().action,"BLOCK");
  assert.equal(f.writes,0);

});

test("Pending journal defers maintenance",() => {

  const f = fixture();

  const old = f.addSlate("2026-10-01");

  f.addSlate("2026-11-15","READY");
  f.pending("2026-11-15");

  assert.equal(
    f.run().reason,
    "INITIALIZATION_JOURNAL_PENDING"
  );

  assert.equal(f.has(old),true);
  assert.equal(f.writes,0);

});

test("Pending journal and checkpoint both preserved",() => {

  const f = fixture();

  const previous = f.addSlate("2026-10-01");

  const pending = f.addSlate("2026-11-15","READY");

  f.assign("2026-10-01");
  f.pending("2026-11-15");

  const result = f.run();

  assert.ok(result.protectedSlateKeys.includes(previous));
  assert.ok(result.protectedSlateKeys.includes(pending));

  assert.equal(f.writes,0);

});

test("Missing journal slate blocks",() => {

  const f = fixture();

  f.pending("2026-11-15");

  assert.equal(
    f.run().reason,
    "MAINTENANCE_JOURNAL_ASSIGNMENT_MISMATCH"
  );

  assert.equal(f.writes,0);

});

test("Journal processing run mismatch blocks",() => {

  const f = fixture();

  f.addSlate("2026-11-15","PROCESSING","another-run");

  f.pending("2026-11-15");

  assert.equal(f.run().action,"BLOCK");
  assert.equal(f.writes,0);

});

test("Invalid journal blocks maintenance",() => {

  const f = fixture();

  f.addSlate("2026-11-15","READY");
  f.pending("2026-11-15");
  f.invalidJournal = true;

  assert.throws(
    () => f.run(),
    /INJECTED_INVALID_JOURNAL/
  );

  assert.equal(f.writes,0);

});

test("Repeated maintenance avoids redundant writes",() => {

  const f = fixture();

  f.addSlate("2026-10-01");

  assert.equal(f.run().saved,true);
  assert.equal(f.run().saved,false);
  assert.equal(f.writes,1);

});

test("Retirement boundary never regresses",() => {

  const f = fixture();

  f.registry.retiredThrough = "2026-11-05";

  const result = f.run(30);

  assert.equal(result.retiredThrough,"2026-11-05");

});

test("Invalid retirement chronology rejected",() => {

  const f = fixture();

  f.registry.retiredThrough = f.today;

  assert.throws(
    () => f.run(),
    /INVALID_RETIREMENT_CHRONOLOGY/
  );

  assert.equal(f.writes,0);

});

test("Invalid retention duration rejected",() => {

  const f = fixture();

  assert.throws(
    () => f.run(0),
    /INVALID_RETENTION_DAYS/
  );

  assert.equal(f.writes,0);

});

test("Invalid maintenance date rejected",() => {

  const f = fixture();

  f.today = "2026-02-30";

  assert.throws(
    () => f.run(),
    /INVALID_MAINTENANCE_DATE/
  );

  assert.equal(f.writes,0);

});

test("Script lock required",() => {

  const f = fixture();

  f.held = false;

  assert.throws(
    () => f.run(),
    /SCRIPT_LOCK_REQUIRED/
  );

  assert.equal(f.writes,0);

});

test("Concurrent checkpoint mutation blocks",() => {

  const f = fixture();

  f.addSlate("2026-10-01");
  f.changeCheckpoint = true;

  assert.equal(f.run().reason,"MAINTENANCE_STATE_CHANGED");
  assert.equal(f.writes,0);

});

test("Concurrent registry mutation blocks",() => {

  const f = fixture();

  f.addSlate("2026-10-01");
  f.changeRegistry = true;

  assert.equal(f.run().reason,"MAINTENANCE_STATE_CHANGED");
  assert.equal(f.writes,0);

});

test("Unexpected journal creation blocks",() => {

  const f = fixture();

  f.addSlate("2026-10-01");
  f.changeJournal = true;

  assert.equal(f.run().reason,"MAINTENANCE_STATE_CHANGED");
  assert.equal(f.writes,0);

});

test("Registry write failure preserves original state",() => {

  const f = fixture();

  f.addSlate("2026-10-01");

  const before = f.raw();

  f.failWrite = true;

  assert.throws(
    () => f.run(),
    /INJECTED_REGISTRY_WRITE_FAILURE/
  );

  assert.equal(f.raw(),before);
  assert.equal(f.writes,0);

});

test("Registry readback mismatch detected",() => {

  const f = fixture();

  f.addSlate("2026-10-01");
  f.badReadback = true;

  assert.throws(
    () => f.run(),
    /P36_NBA_MAINTENANCE_READBACK_MISMATCH/
  );

});

test("Compaction reports storage savings",() => {

  const f = fixture();

  for (let day = 1; day <= 10; day++) {

    f.addSlate(
      "2026-10-"+String(day).padStart(2,"0")
    );

  }

  const result = f.run();

  assert.ok(result.bytesAfter < result.bytesBefore);
  assert.equal(result.removedSlateKeys.length,10);

});

test("Invalid registry rejected",() => {

  const f = fixture();

  f.invalidRegistry = true;

  assert.throws(
    () => f.run(),
    /INJECTED_INVALID_REGISTRY/
  );

  assert.equal(f.writes,0);

});

test("Long offseason retains final assigned checkpoint",() => {

  const f = fixture();

  const key = f.addSlate("2026-04-15");

  f.assign("2026-04-15");

  f.today = "2026-10-20";

  f.run();

  assert.equal(f.has(key),true);

  f.today = "2026-11-16";

  f.run();

  assert.equal(f.has(key),true);

});

test("Storage limit failure never discards unresolved slates",() => {

  const f = fixture();

  const key = f.addSlate("2026-10-01","TRACKING");

  f.registry.slates[key].inventory.expectedGameIds =
    Array.from(
      {length:2500},
      (_,i) => String(i+100000)
    );

  const before = f.raw();

  assert.throws(
    () => f.run(),
    /REGISTRY_STORAGE_LIMIT_EXCEEDED/
  );

  assert.equal(f.raw(),before);
  assert.equal(f.writes,0);

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
console.log("EXECUTION ENVIRONMENT: LOCAL SIMULATED STORAGE");

console.log(
  "STATUS:",
  passed === cases.length ? "PASS" : "FAIL"
);

if (passed !== cases.length) {

  process.exitCode = 1;

}
