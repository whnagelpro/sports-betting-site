
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const crypto = require("node:crypto");

const expectedHash = "5ea6a07a8c15c31cf82760b9136d83c2b8a980639d799a0ed5b25e4fdc684c52";

const hash = value => crypto
  .createHash("sha256")
  .update(value)
  .digest("hex");

const sourcePath = "nba-appscript";

assert.equal(
  hash(fs.readFileSync(sourcePath)),
  expectedHash
);

function fixture() {

  const f = {

    today:"2026-11-16",
    slateDate:"2026-11-15",

    held:true,
    exists:true,
    evidenceValid:true,
    freshAuthorized:true,

    registryRaw:"registry-ready",
    journalRaw:null,

    state:{
      completed:true,
      stage:"COMPLETE",
      suspended:false
    },

    events:[],
    failAt:null,
    uuid:0

  };

  f.checkpointRaw =
    JSON.stringify(f.state);

  f.changeCheckpoint = values => {

    Object.assign(f.state,values);

    f.checkpointRaw =
      JSON.stringify(f.state);

  };

  f.event = name => {

    f.events.push(name);

    if (f.failAt === name) {

      throw new Error(
        "INJECTED_FAILURE:"+name
      );

    }

  };

  f.count = name =>
    f.events.filter(event => event === name).length;

  const properties = {};

  const lock = {
    hasLock:() => f.held
  };

  const context = vm.createContext({

    PropertiesService:{

      getScriptProperties:() => properties

    },

    Utilities:{

      getUuid:() => `mock-run-${++f.uuid}`

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

    readP36NBACheckpointLocked_:() => ({

      exists:f.exists,
      raw:f.exists ? f.checkpointRaw : null,
      state:f.exists ? {...f.state} : null

    }),

    loadP36SlateRegistry_:() => ({

      raw:f.registryRaw

    }),

    loadP36Journal_:() => ({

      raw:f.journalRaw,

      journal:f.journalRaw
        ? JSON.parse(f.journalRaw)
        : null

    }),

    hashP36NBACheckpointRaw_:hash,

    inspectP36NBABoundJournalLocked_:() => {

      f.event("inspect");

      if (f.forcedRecovery) {

        return f.forcedRecovery;

      }

      if (!f.journalRaw) {

        return {action:"NO_ACTION"};

      }

      const journal = JSON.parse(f.journalRaw);

      if (f.checkpointRaw === journal.candidateCheckpoint) {

        return {
          action:"RECOVER_ASSIGNMENT",
          journal,
          journalRaw:f.journalRaw
        };

      }

      if (
        f.state.completed === true &&
        hash(f.checkpointRaw) ===
          journal.previousCheckpointHash
      ) {

        return {
          action:"REAUTHORIZE",
          journal,
          journalRaw:f.journalRaw
        };

      }

      return {
        action:"BLOCK",
        reason:"CHECKPOINT_JOURNAL_BINDING_MISMATCH"
      };

    },

    getNBADailyPlayerGameLogTeams_:() => {

      f.event("team-queue");

      return Array.from(
        {length:30},
        (_,i) => ({id:i+1})
      );

    },

    validateP36NBACompletedCheckpoint_:() => {

      f.event("completion-validation");

      if (f.changeDuringValidation) {

        f.changeCheckpoint({
          changed:true
        });

      }

      return {

        valid:f.evidenceValid,

        reason:f.evidenceValid
          ? "COMPLETED_CHECKPOINT_VERIFIED"
          : "INVALID_PLAYER_COMPLETION_EVIDENCE"

      };

    },

    reconcileP36NBACompletionLocked_:() => {

      f.event("reconcile");

      if (f.reconciliation) {

        return f.reconciliation;

      }

      return f.state.completed
        ? {action:"WAIT"}
        : {action:"RESUME"};

    },

    authorizeP36NBAInitializationLocked_:
      (_,date) => {

      f.event("authorize");

      f.authorizedDate = date;

      if (!f.freshAuthorized) {

        return {

          authorized:false,

          action:"WAIT",

          reason:"SLATE_NOT_COMPLETE"

        };

      }

      if (f.authorizationOverride) {

        return f.authorizationOverride;

      }

      const result = {

        authorized:true,

        action:"INITIALIZE",

        slateDate:date,

        slateKey:"NBA:"+date,

        checkpointRaw:f.checkpointRaw,

        registryRaw:f.registryRaw

      };

      if (f.changeAfterAuthorization === "checkpoint") {

        f.changeCheckpoint({
          unexpected:true
        });

      }

      if (f.changeAfterAuthorization === "registry") {

        f.registryRaw = "unexpected-registry";

      }

      if (f.changeAfterAuthorization === "journal") {

        f.journalRaw = '{"unexpected":true}';

      }

      return result;

    },

    createP36NBABoundJournalLocked_:
      (_,date,runId) => {

      f.event("create-journal");

      const candidate = {

        stage:"PLAYER_GAME_LOGS",

        completed:false,

        suspended:false,

        p36RunId:runId,

        p36SlateKey:"NBA:"+date

      };

      const journal = {

        slateDate:date,

        slateKey:"NBA:"+date,

        runId,

        previousCheckpointHash:
          hash(f.checkpointRaw),

        candidateCheckpoint:
          JSON.stringify(candidate)

      };

      if (f.invalidJournalBinding) {

        journal.previousCheckpointHash =
          "incorrect-hash";

      }

      return journal;

    },

    validateP36NBABoundJournal_:journal => {

      f.event("validate-journal");

      return JSON.parse(
        journal.candidateCheckpoint
      );

    },

    saveP36Journal_:(_,props,journal) => {

      f.event("save-journal");

      const raw = JSON.stringify(journal);

      if (
        f.journalRaw !== null &&
        f.journalRaw !== raw
      ) {

        throw new Error("JOURNAL_CONFLICT");

      }

      f.journalRaw = raw;

      f.event("after-journal-save");

      if (f.changeAfterJournalSave) {

        f.registryRaw =
          "unexpected-registry";

      }

    },

    writeP36NBACheckpointLocked_:
      (_,expectedRaw,candidate) => {

      f.event("write-checkpoint");

      assert.equal(
        f.checkpointRaw,
        expectedRaw
      );

      f.state = {...candidate};

      f.checkpointRaw =
        JSON.stringify(candidate);

      f.event("after-checkpoint-write");

      return {

        raw:f.badWriteReadback
          ? "incorrect-readback"
          : f.checkpointRaw

      };

    },

    commitP36NBAInitializationLocked_:() => {

      f.event("commit");

      if (f.commitBlocked) {

        return {
          committed:false,
          action:"BLOCK",
          reason:"INITIALIZATION_RUN_ID_MISMATCH"
        };

      }

      assert.ok(f.journalRaw);

      const journal =
        JSON.parse(f.journalRaw);

      assert.equal(
        f.checkpointRaw,
        journal.candidateCheckpoint
      );

      f.registryRaw =
        "registry-processing:"+journal.runId;

      f.event("after-assignment");

      f.journalRaw = null;

      f.event("after-journal-clear");

      return {

        committed:true,

        action:"RUN",

        reason:"INITIALIZATION_COMMITTED",

        runId:journal.runId,

        slateDate:journal.slateDate

      };

    }

  });

  vm.runInContext(
    "\n\n/*\n * Coordinate protected initialization for one NBA daily slate.\n *\n * Requires an already-acquired script lock.\n *\n * Does not directly run the mother pipeline, reset staging,\n * schedule continuations or modify triggers.\n */\n\nfunction orchestrateP36NBAInitializationLocked_(\n  lock,\n  slateDate\n) {\n\n  if (\n    !lock ||\n    lock.hasLock() !== true\n  ) {\n    throw new Error(\"SCRIPT_LOCK_REQUIRED\");\n  }\n\n  const respond = (action,reason,extra = {}) => ({\n    initialized:false,\n    action,\n    reason,\n    ...extra\n  });\n\n  const properties =\n    PropertiesService.getScriptProperties();\n\n  /*\n   * Recovery must precede ordinary authorization.\n   */\n\n  const recovery =\n    inspectP36NBABoundJournalLocked_(lock);\n\n  if (recovery.action === \"BLOCK\") {\n\n    return respond(\n      \"BLOCK\",\n      recovery.reason\n    );\n\n  }\n\n  if (\n    recovery.action ===\n    \"RECOVER_ASSIGNMENT\"\n  ) {\n\n    const committed =\n      commitP36NBAInitializationLocked_(lock);\n\n    return {\n      ...committed,\n      initialized:committed.committed === true,\n      recovered:committed.committed === true\n    };\n\n  }\n\n  const reauthorizing =\n    recovery.action === \"REAUTHORIZE\";\n\n  if (\n    !reauthorizing &&\n    recovery.action !== \"NO_ACTION\"\n  ) {\n\n    return respond(\n      \"BLOCK\",\n      \"UNKNOWN_JOURNAL_RECOVERY_ACTION\"\n    );\n\n  }\n\n  /*\n   * An interrupted initialization retains its original\n   * slate identity regardless of the current date.\n   */\n\n  const requestedDate =\n    reauthorizing\n      ? recovery.journal.slateDate\n      : slateDate;\n\n  if (\n    !isValidP36Date_(requestedDate) ||\n    requestedDate > getTodayString_()\n  ) {\n\n    return respond(\n      \"BLOCK\",\n      \"INVALID_INITIALIZATION_SLATE_DATE\"\n    );\n\n  }\n\n  const previous =\n    readP36NBACheckpointLocked_(lock);\n\n  if (!previous.exists) {\n\n    return respond(\n      \"BLOCK\",\n      \"CHECKPOINT_MISSING\"\n    );\n\n  }\n\n  if (previous.state.suspended === true) {\n\n    return respond(\n      \"BLOCK\",\n      \"CHECKPOINT_SUSPENDED\"\n    );\n\n  }\n\n  if (previous.state.completed !== true) {\n\n    if (reauthorizing) {\n\n      return respond(\n        \"BLOCK\",\n        \"PENDING_JOURNAL_CHECKPOINT_INCOMPLETE\"\n      );\n\n    }\n\n    return reconcileP36NBACompletionLocked_(lock);\n\n  }\n\n  /*\n   * Verify retained completion evidence before reconciliation\n   * or checkpoint replacement.\n   */\n\n  const playerTeams =\n    getNBADailyPlayerGameLogTeams_();\n\n  const completion =\n    validateP36NBACompletedCheckpoint_(\n      previous.state,\n      playerTeams\n    );\n\n  if (completion.valid !== true) {\n\n    return respond(\n      \"BLOCK\",\n      \"PREVIOUS_CHECKPOINT_INTEGRITY_FAILED\",\n      {\n        validationReason:completion.reason\n      }\n    );\n\n  }\n\n  if (\n    readP36NBACheckpointLocked_(lock).raw !==\n    previous.raw\n  ) {\n\n    return respond(\n      \"BLOCK\",\n      \"CHECKPOINT_CHANGED_DURING_COMPLETION_VALIDATION\"\n    );\n\n  }\n\n  /*\n   * Reconcile a previously assigned completed run before\n   * considering another slate.\n   *\n   * A pending journal must instead follow its recovery path.\n   */\n\n  if (!reauthorizing) {\n\n    const reconciliation =\n      reconcileP36NBACompletionLocked_(lock);\n\n    if (reconciliation.action !== \"WAIT\") {\n\n      return reconciliation;\n\n    }\n\n  }\n\n  /*\n   * Independently authorize the requested slate using fresh\n   * API evidence and Schedule readback.\n   */\n\n  const authorization =\n    authorizeP36NBAInitializationLocked_(\n      lock,\n      requestedDate\n    );\n\n  if (\n    authorization.authorized !== true ||\n    authorization.action !== \"INITIALIZE\"\n  ) {\n\n    return {\n      ...authorization,\n      initialized:false\n    };\n\n  }\n\n  if (\n    authorization.slateDate !== requestedDate ||\n    authorization.slateKey !== \"NBA:\" + requestedDate ||\n    authorization.checkpointRaw !== previous.raw\n  ) {\n\n    return respond(\n      \"BLOCK\",\n      \"AUTHORIZATION_BINDING_MISMATCH\"\n    );\n\n  }\n\n  const verifyBinding = expectedJournalRaw => {\n\n    if (\n      readP36NBACheckpointLocked_(lock).raw !==\n      authorization.checkpointRaw\n    ) {\n\n      throw new Error(\n        \"P36_NBA_AUTHORIZED_CHECKPOINT_CHANGED\"\n      );\n\n    }\n\n    if (\n      loadP36SlateRegistry_(\"NBA\",properties).raw !==\n      authorization.registryRaw\n    ) {\n\n      throw new Error(\n        \"P36_NBA_AUTHORIZED_REGISTRY_CHANGED\"\n      );\n\n    }\n\n    if (\n      loadP36Journal_(\"NBA\",properties).raw !==\n      expectedJournalRaw\n    ) {\n\n      throw new Error(\n        \"P36_NBA_INITIALIZATION_JOURNAL_CHANGED\"\n      );\n\n    }\n\n  };\n\n  verifyBinding(\n    reauthorizing\n      ? recovery.journalRaw\n      : null\n  );\n\n  let journal;\n\n  if (reauthorizing) {\n\n    journal = recovery.journal;\n\n  } else {\n\n    journal =\n      createP36NBABoundJournalLocked_(\n        lock,\n        requestedDate,\n        Utilities.getUuid()\n      );\n\n  }\n\n  const candidate =\n    validateP36NBABoundJournal_(journal);\n\n  const journalRaw =\n    JSON.stringify(journal);\n\n  if (\n    journal.slateDate !== requestedDate ||\n    journal.slateKey !== authorization.slateKey ||\n    journal.previousCheckpointHash !==\n      hashP36NBACheckpointRaw_(\n        authorization.checkpointRaw\n      )\n  ) {\n\n    return respond(\n      \"BLOCK\",\n      \"INITIALIZATION_JOURNAL_BINDING_MISMATCH\"\n    );\n\n  }\n\n  /*\n   * Persist the recovery journal before replacing the\n   * previous completed checkpoint.\n   */\n\n  verifyBinding(\n    reauthorizing\n      ? recovery.journalRaw\n      : null\n  );\n\n  saveP36Journal_(\n    \"NBA\",\n    properties,\n    journal,\n    lock\n  );\n\n  verifyBinding(journalRaw);\n\n  const verified =\n    writeP36NBACheckpointLocked_(\n      lock,\n      authorization.checkpointRaw,\n      candidate\n    );\n\n  if (\n    verified.raw !== journal.candidateCheckpoint\n  ) {\n\n    throw new Error(\n      \"P36_NBA_ORCHESTRATED_CHECKPOINT_MISMATCH\"\n    );\n\n  }\n\n  /*\n   * Commit the assignment and clear the journal only after\n   * exact candidate checkpoint verification.\n   */\n\n  const committed =\n    commitP36NBAInitializationLocked_(lock);\n\n  return {\n    ...committed,\n    initialized:committed.committed === true,\n    recovered:reauthorizing &&\n      committed.committed === true\n  };\n\n}\n\n",
    context
  );

  f.run = (date = f.slateDate) =>
    context.orchestrateP36NBAInitializationLocked_(
      lock,date
    );

  f.assertNoReplacement = () => {

    assert.equal(f.count("create-journal"),0);
    assert.equal(f.count("save-journal"),0);
    assert.equal(f.count("write-checkpoint"),0);
    assert.equal(f.count("commit"),0);

  };

  return f;

}

const cases = [];

function test(name,fn) {

  cases.push([name,fn]);

}

test("Successful initialization",() => {

  const f = fixture();

  const result = f.run();

  assert.equal(result.initialized,true);
  assert.equal(result.action,"RUN");
  assert.equal(f.state.completed,false);
  assert.equal(f.journalRaw,null);
  assert.equal(f.count("write-checkpoint"),1);

});

test("Recovery occurs before authorization",() => {

  const f = fixture();

  f.run();

  assert.ok(
    f.events.indexOf("inspect") <
    f.events.indexOf("authorize")
  );

});

test("Completion validated before fresh authorization",() => {

  const f = fixture();

  f.run();

  assert.ok(
    f.events.indexOf("completion-validation") <
    f.events.indexOf("authorize")
  );

});

test("Journal precedes checkpoint replacement",() => {

  const f = fixture();

  f.run();

  assert.ok(
    f.events.indexOf("save-journal") <
    f.events.indexOf("write-checkpoint")
  );

});

test("Checkpoint replacement precedes assignment",() => {

  const f = fixture();

  f.run();

  assert.ok(
    f.events.indexOf("write-checkpoint") <
    f.events.indexOf("commit")
  );

});

test("Script lock required",() => {

  const f = fixture();

  f.held = false;

  assert.throws(
    () => f.run(),
    /SCRIPT_LOCK_REQUIRED/
  );

  assert.equal(f.events.length,0);

});

test("Missing checkpoint blocks",() => {

  const f = fixture();

  f.exists = false;

  assert.equal(
    f.run().reason,
    "CHECKPOINT_MISSING"
  );

  f.assertNoReplacement();

});

test("Suspended checkpoint preserved",() => {

  const f = fixture();

  f.changeCheckpoint({suspended:true});

  assert.equal(
    f.run().reason,
    "CHECKPOINT_SUSPENDED"
  );

  f.assertNoReplacement();

});

test("Unfinished checkpoint resumes",() => {

  const f = fixture();

  f.changeCheckpoint({
    completed:false,
    stage:"PLAYER_GAME_LOGS"
  });

  assert.equal(f.run().action,"RESUME");

  assert.equal(
    f.count("authorize"),0
  );

  f.assertNoReplacement();

});

test("Invalid previous completion blocks",() => {

  const f = fixture();

  f.evidenceValid = false;

  assert.equal(
    f.run().reason,
    "PREVIOUS_CHECKPOINT_INTEGRITY_FAILED"
  );

  f.assertNoReplacement();

});

test("Incomplete daily slate waits",() => {

  const f = fixture();

  f.freshAuthorized = false;

  assert.equal(f.run().action,"WAIT");

  f.assertNoReplacement();

});

test("Invalid date rejected",() => {

  const f = fixture();

  assert.equal(
    f.run("2026-02-30").reason,
    "INVALID_INITIALIZATION_SLATE_DATE"
  );

  f.assertNoReplacement();

});

test("Future date rejected",() => {

  const f = fixture();

  assert.equal(
    f.run("2026-11-17").reason,
    "INVALID_INITIALIZATION_SLATE_DATE"
  );

  f.assertNoReplacement();

});

test("Reconciliation block preserved",() => {

  const f = fixture();

  f.reconciliation = {
    action:"BLOCK",
    reason:"CHECKPOINT_ASSIGNMENT_MISMATCH"
  };

  assert.equal(
    f.run().reason,
    "CHECKPOINT_ASSIGNMENT_MISMATCH"
  );

  f.assertNoReplacement();

});

test("Already processed authorization respected",() => {

  const f = fixture();

  f.authorizationOverride = {
    authorized:false,
    action:"STOP",
    reason:"SLATE_ALREADY_PROCESSED"
  };

  assert.equal(f.run().action,"STOP");

  f.assertNoReplacement();

});

test("Checkpoint change during validation blocks",() => {

  const f = fixture();

  f.changeDuringValidation = true;

  assert.equal(
    f.run().reason,
    "CHECKPOINT_CHANGED_DURING_COMPLETION_VALIDATION"
  );

  f.assertNoReplacement();

});

test("Checkpoint change after authorization blocks",() => {

  const f = fixture();

  f.changeAfterAuthorization = "checkpoint";

  assert.throws(
    () => f.run(),
    /AUTHORIZED_CHECKPOINT_CHANGED/
  );

  f.assertNoReplacement();

});

test("Registry change after authorization blocks",() => {

  const f = fixture();

  f.changeAfterAuthorization = "registry";

  assert.throws(
    () => f.run(),
    /AUTHORIZED_REGISTRY_CHANGED/
  );

  f.assertNoReplacement();

});

test("Journal change after authorization blocks",() => {

  const f = fixture();

  f.changeAfterAuthorization = "journal";

  assert.throws(
    () => f.run(),
    /INITIALIZATION_JOURNAL_CHANGED/
  );

  f.assertNoReplacement();

});

test("Wrong slate authorization rejected",() => {

  const f = fixture();

  f.authorizationOverride = {

    authorized:true,

    action:"INITIALIZE",

    slateDate:"2026-11-14",

    slateKey:"NBA:2026-11-14",

    checkpointRaw:f.checkpointRaw,

    registryRaw:f.registryRaw

  };

  assert.equal(
    f.run().reason,
    "AUTHORIZATION_BINDING_MISMATCH"
  );

  f.assertNoReplacement();

});

test("Invalid journal binding rejected",() => {

  const f = fixture();

  f.invalidJournalBinding = true;

  assert.equal(
    f.run().reason,
    "INITIALIZATION_JOURNAL_BINDING_MISMATCH"
  );

  assert.equal(f.count("save-journal"),0);
  assert.equal(f.count("write-checkpoint"),0);

});

test("Failure before journal persistence preserves checkpoint",() => {

  const f = fixture();

  const before = f.checkpointRaw;

  f.failAt = "save-journal";

  assert.throws(() => f.run(),/INJECTED_FAILURE/);

  assert.equal(f.checkpointRaw,before);
  assert.equal(f.journalRaw,null);

});

test("Journal persistence interruption recovers",() => {

  const f = fixture();

  const before = f.checkpointRaw;

  f.failAt = "after-journal-save";

  assert.throws(() => f.run(),/INJECTED_FAILURE/);

  assert.equal(f.checkpointRaw,before);
  assert.ok(f.journalRaw);

  const journal = f.journalRaw;

  f.failAt = null;

  const result = f.run();

  assert.equal(result.initialized,true);
  assert.equal(result.recovered,true);

  assert.equal(
    result.runId,
    JSON.parse(journal).runId
  );

  assert.equal(f.count("create-journal"),1);

});

test("Reauthorization failure preserves pending journal",() => {

  const f = fixture();

  f.failAt = "after-journal-save";

  assert.throws(() => f.run());

  const before = f.checkpointRaw;
  const journal = f.journalRaw;

  f.failAt = null;
  f.freshAuthorized = false;

  assert.equal(f.run().action,"WAIT");

  assert.equal(f.checkpointRaw,before);
  assert.equal(f.journalRaw,journal);
  assert.equal(f.count("write-checkpoint"),0);

});

test("Original historical slate retained across midnight",() => {

  const f = fixture();

  f.failAt = "after-journal-save";

  assert.throws(() => f.run());

  f.failAt = null;
  f.today = "2026-11-17";

  const result = f.run("2026-11-17");

  assert.equal(result.initialized,true);
  assert.equal(result.slateDate,"2026-11-15");
  assert.equal(f.authorizedDate,"2026-11-15");

});

test("Registry change after journal save blocks replacement",() => {

  const f = fixture();

  f.changeAfterJournalSave = true;

  assert.throws(
    () => f.run(),
    /AUTHORIZED_REGISTRY_CHANGED/
  );

  assert.ok(f.journalRaw);
  assert.equal(f.count("write-checkpoint"),0);

});

test("Checkpoint write interruption recovers exact assignment",() => {

  const f = fixture();

  f.failAt = "after-checkpoint-write";

  assert.throws(() => f.run());

  assert.ok(f.journalRaw);

  const candidate = f.checkpointRaw;

  f.failAt = null;

  const result = f.run();

  assert.equal(result.initialized,true);
  assert.equal(result.recovered,true);
  assert.equal(f.checkpointRaw,candidate);
  assert.equal(f.count("authorize"),1);
  assert.equal(f.count("write-checkpoint"),1);

});

test("Checkpoint readback mismatch preserves journal",() => {

  const f = fixture();

  f.badWriteReadback = true;

  assert.throws(
    () => f.run(),
    /ORCHESTRATED_CHECKPOINT_MISMATCH/
  );

  assert.ok(f.journalRaw);
  assert.equal(f.count("commit"),0);

});

test("Assignment interruption recovers without new initialization",() => {

  const f = fixture();

  f.failAt = "after-assignment";

  assert.throws(() => f.run());

  assert.ok(f.journalRaw);

  f.failAt = null;

  assert.equal(f.run().recovered,true);
  assert.equal(f.count("write-checkpoint"),1);
  assert.equal(f.count("create-journal"),1);

});

test("Interruption after journal cleanup resumes assigned run",() => {

  const f = fixture();

  f.failAt = "after-journal-clear";

  assert.throws(() => f.run());

  assert.equal(f.journalRaw,null);

  f.failAt = null;

  assert.equal(f.run().action,"RESUME");
  assert.equal(f.count("write-checkpoint"),1);

});

test("Blocked commit never reports initialization success",() => {

  const f = fixture();

  f.commitBlocked = true;

  const result = f.run();

  assert.equal(result.initialized,false);
  assert.equal(result.action,"BLOCK");
  assert.ok(f.journalRaw);

});

test("Unexpected checkpoint mutation during recovery blocks",() => {

  const f = fixture();

  f.failAt = "after-journal-save";

  assert.throws(() => f.run());

  f.failAt = null;

  f.changeCheckpoint({
    unexpected:true
  });

  assert.equal(
    f.run().reason,
    "CHECKPOINT_JOURNAL_BINDING_MISMATCH"
  );

  assert.equal(f.count("write-checkpoint"),0);

});

test("Unknown recovery action blocks",() => {

  const f = fixture();

  f.forcedRecovery = {
    action:"UNEXPECTED"
  };

  assert.equal(
    f.run().reason,
    "UNKNOWN_JOURNAL_RECOVERY_ACTION"
  );

  f.assertNoReplacement();

});

test("Repeated monitor invocation does not replace active checkpoint",() => {

  const f = fixture();

  assert.equal(f.run().initialized,true);

  const checkpoint = f.checkpointRaw;

  assert.equal(f.run().action,"RESUME");

  assert.equal(f.checkpointRaw,checkpoint);
  assert.equal(f.count("write-checkpoint"),1);

});

let passed = 0;

for (const [name,fn] of cases) {

  try {

    fn();
    passed++;

  } catch (error) {

    console.log("FAIL | "+name);

    console.log(
      String(error.stack || error)
    );

  }

}

assert.equal(
  hash(fs.readFileSync(sourcePath)),
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
