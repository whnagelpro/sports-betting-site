
const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

console.log(
  "=== P36 D5 STEP 3C.3 — NBA PROTECTED JOURNAL TEST ==="
);

const expectedHash =
  "fd7e5911f477dec5dd60add7c3ee86c7f17b5f0eb8bafbec8a9283a90d489b59";

const original = fs.readFileSync("nba-appscript");

const hash = value =>
  crypto.createHash("sha256")
    .update(value)
    .digest("hex");

assert.equal(hash(original),expectedHash);

const source = original.toString("utf8");

new vm.Script(source);

console.log("PASS | Existing NBA source verified");

function extractBlock(label) {

  const startMarker =
    `// ===== ${label} START =====`;

  const endMarker =
    `// ===== ${label} END =====`;

  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);

  assert.ok(start >= 0, startMarker);
  assert.ok(end > start, endMarker);

  return source.slice(start,end);

}

const definitions = [
  ...source.matchAll(/^function\s+(\w+)\s*\(/gm)
];

function extractFunction(name) {

  const matches = definitions
    .map((match,index) => ({match,index}))
    .filter(entry => entry.match[1] === name);

  assert.equal(matches.length,1,name);

  const {match,index} = matches[0];

  return source.slice(
    match.index,
    definitions[index+1]?.index ?? source.length
  );

}

const installedCode = [

  extractBlock("P36 UNIVERSAL ENGINE"),

  extractFunction(
    "createNBADailyAnalyticsState_"
  ),

  extractBlock(
    "P36 NBA CHECKPOINT ADAPTER"
  ),

  extractBlock(
    "P36 NBA PROTECTED JOURNAL BINDING"
  )

].join("\n\n");

const compiled = new vm.Script(installedCode);

console.log(
  "PASS | Complete installed engine and adapters extracted"
);

const today = "2026-11-16";
const slateDate = "2026-11-15";
const slateKey = `NBA:${slateDate}`;
const runId = "mock-p36-run";
const stateKey = "mock-nba-checkpoint";

function fixture() {

  const storage = new Map();

  let uuidCounter = 0;

  const f = {

    locked:true,
    checkpointWrites:0,
    journalWrites:0,
    deletes:0

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

      DigestAlgorithm:{
        SHA_256:"SHA_256"
      },

      Charset:{
        UTF_8:"UTF_8"
      },

      computeDigest:(algorithm,value,charset) => {

        assert.equal(algorithm,"SHA_256");
        assert.equal(charset,"UTF_8");

        return Array.from(
          crypto.createHash("sha256")
            .update(value,"utf8")
            .digest(),
          byte => byte > 127 ? byte-256 : byte
        );

      },

      newBlob:value => ({

        getBytes:() =>
          Buffer.from(value,"utf8")

      })

    }

  });

  compiled.runInContext(context);

  f.journalKey =
    context.getP36JournalKey_("NBA");

  f.checkpointRaw = () =>
    storage.get(stateKey) ?? null;

  f.journalRaw = () =>
    storage.get(f.journalKey) ?? null;

  f.seedCheckpoint = state =>
    storage.set(
      stateKey,
      JSON.stringify(state)
    );

  f.seedCheckpointRaw = raw =>
    storage.set(stateKey,raw);

  f.seedJournal = journal =>
    storage.set(
      f.journalKey,
      JSON.stringify(journal)
    );

  f.seedJournalRaw = raw =>
    storage.set(f.journalKey,raw);

  f.removeCheckpoint = () =>
    storage.delete(stateKey);

  f.checkpoint = () =>
    JSON.parse(f.checkpointRaw());

  f.changeCheckpoint = changes =>
    f.seedCheckpoint({

      ...f.checkpoint(),
      ...changes

    });

  f.createJournal = (
    date = slateDate,
    id = runId
  ) =>

    context.createP36NBABoundJournalLocked_(
      lock,date,id
    );

  f.validateJournal = journal =>
    context.validateP36NBABoundJournal_(
      journal
    );

  f.inspect = () =>
    context.inspectP36NBABoundJournalLocked_(
      lock
    );

  f.hashRaw = raw =>
    context.hashP36NBACheckpointRaw_(raw);

  f.saveJournal = journal =>
    context.saveP36Journal_(
      "NBA",properties,journal,lock
    );

  f.writeCandidate = journal =>
    context.writeP36NBACheckpointLocked_(
      lock,
      f.checkpointRaw(),
      f.validateJournal(journal)
    );

  f.seedCheckpoint({

    ...context.createNBADailyAnalyticsState_(),

    completed:true,
    stage:"COMPLETE",
    playerTeamIndex:30,
    teamTeamIndex:30

  });

  return f;

}

function assertNoWrites(f) {

  assert.equal(f.checkpointWrites,0);
  assert.equal(f.journalWrites,0);
  assert.equal(f.deletes,0);

}

function expectDecision(f,action,reason) {

  const beforeCheckpoint = f.checkpointRaw();
  const beforeJournal = f.journalRaw();

  const result = f.inspect();

  assert.equal(result.action,action);
  assert.equal(result.reason,reason);

  assert.equal(f.checkpointRaw(),beforeCheckpoint);
  assert.equal(f.journalRaw(),beforeJournal);

  assertNoWrites(f);

}

const cases = [

  ["SHA256 matches independent Node implementation",() => {

    const f = fixture();

    const raw = '{"test":"NBA checkpoint"}';

    assert.equal(f.hashRaw(raw),hash(raw));

  }],

  ["SHA256 preserves exact serialized content",() => {

    const f = fixture();

    assert.notEqual(
      f.hashRaw('{"a":1}'),
      f.hashRaw('{"a":1} ')
    );

  }],

  ["Empty checkpoint raw is rejected",() => {

    const f = fixture();

    assert.throws(
      () => f.hashRaw(""),
      /INVALID_CHECKPOINT_RAW/
    );

  }],

  ["Journal construction binds both checkpoints",() => {

    const f = fixture();

    const journal = f.createJournal();

    assert.equal(journal.bindingVersion,1);

    assert.equal(
      journal.previousCheckpointHash,
      hash(f.checkpointRaw())
    );

    assert.equal(
      journal.candidateCheckpointHash,
      hash(journal.candidateCheckpoint)
    );

    assert.notEqual(
      journal.previousCheckpointHash,
      journal.candidateCheckpointHash
    );

    assertNoWrites(f);

  }],

  ["Journal retains exact replacement checkpoint",() => {

    const f = fixture();

    const journal = f.createJournal();

    const candidate = f.validateJournal(journal);

    assert.equal(
      JSON.stringify(candidate),
      journal.candidateCheckpoint
    );

    assert.equal(candidate.p36RunId,runId);
    assert.equal(candidate.p36SlateKey,slateKey);
    assert.equal(candidate.stage,"PLAYER_GAME_LOGS");
    assert.equal(candidate.completed,false);
    assert.equal(candidate.playerTeamIndex,0);
    assert.equal(candidate.teamTeamIndex,0);

  }],

  ["Historical slate preserves independent execution date",() => {

    const f = fixture();

    const candidate =
      f.validateJournal(f.createJournal());

    assert.equal(candidate.runDate,today);
    assert.equal(candidate.p36SlateKey,slateKey);

  }],

  ["Journal construction requires script lock",() => {

    const f = fixture();

    f.locked = false;

    assert.throws(
      () => f.createJournal(),
      /SCRIPT_LOCK_REQUIRED/
    );

    assertNoWrites(f);

  }],

  ["Journal inspection requires script lock",() => {

    const f = fixture();

    f.locked = false;

    assert.throws(
      f.inspect,
      /SCRIPT_LOCK_REQUIRED/
    );

    assertNoWrites(f);

  }],

  ["Unfinished checkpoint cannot create replacement journal",() => {

    const f = fixture();

    f.changeCheckpoint({
      completed:false,
      stage:"PLAYER_GAME_LOGS"
    });

    assert.throws(
      () => f.createJournal(),
      /PREVIOUS_CHECKPOINT_NOT_REPLACEABLE/
    );

    assertNoWrites(f);

  }],

  ["Suspended checkpoint cannot create replacement journal",() => {

    const f = fixture();

    f.changeCheckpoint({
      suspended:true
    });

    assert.throws(
      () => f.createJournal(),
      /PREVIOUS_CHECKPOINT_NOT_REPLACEABLE/
    );

    assertNoWrites(f);

  }],

  ["Missing checkpoint cannot create replacement journal",() => {

    const f = fixture();

    f.removeCheckpoint();

    assert.throws(
      () => f.createJournal(),
      /PREVIOUS_CHECKPOINT_NOT_REPLACEABLE/
    );

    assertNoWrites(f);

  }],

  ["Previously assigned slate cannot create duplicate journal",() => {

    const f = fixture();

    f.changeCheckpoint({
      p36RunId:"older-run",
      p36SlateKey:slateKey
    });

    assert.throws(
      () => f.createJournal(),
      /JOURNAL_IDENTITY_REUSED/
    );

  }],

  ["Reused pipeline run identity is rejected",() => {

    const f = fixture();

    f.changeCheckpoint({
      p36RunId:runId,
      p36SlateKey:"NBA:2026-11-14"
    });

    assert.throws(
      () => f.createJournal(),
      /JOURNAL_IDENTITY_REUSED/
    );

  }],

  ["No journal returns NO_ACTION",() => {

    const f = fixture();

    expectDecision(
      f,"NO_ACTION","NO_PENDING_JOURNAL"
    );

  }],

  ["Original checkpoint requires fresh authorization",() => {

    const f = fixture();

    f.seedJournal(f.createJournal());

    expectDecision(
      f,
      "REAUTHORIZE",
      "ORIGINAL_CHECKPOINT_PRESENT"
    );

  }],

  ["Exact candidate checkpoint permits assignment recovery",() => {

    const f = fixture();

    const journal = f.createJournal();

    f.seedJournal(journal);

    f.seedCheckpointRaw(
      journal.candidateCheckpoint
    );

    expectDecision(
      f,
      "RECOVER_ASSIGNMENT",
      "EXACT_CANDIDATE_CHECKPOINT_PRESENT"
    );

  }],

  ["Unexpected checkpoint blocks recovery",() => {

    const f = fixture();

    f.seedJournal(f.createJournal());

    f.changeCheckpoint({
      lastError:"unexpected change"
    });

    expectDecision(
      f,
      "BLOCK",
      "CHECKPOINT_JOURNAL_BINDING_MISMATCH"
    );

  }],

  ["Changed raw serialization blocks recovery",() => {

    const f = fixture();

    f.seedJournal(f.createJournal());

    f.seedCheckpointRaw(
      f.checkpointRaw()+" "
    );

    expectDecision(
      f,
      "BLOCK",
      "CHECKPOINT_JOURNAL_BINDING_MISMATCH"
    );

  }],

  ["Missing checkpoint blocks pending recovery",() => {

    const f = fixture();

    f.seedJournal(f.createJournal());
    f.removeCheckpoint();

    expectDecision(
      f,"BLOCK","CHECKPOINT_MISSING"
    );

  }],

  ["Suspended checkpoint blocks pending recovery",() => {

    const f = fixture();

    f.seedJournal(f.createJournal());

    f.changeCheckpoint({
      suspended:true
    });

    expectDecision(
      f,"BLOCK","CHECKPOINT_SUSPENDED"
    );

  }],

  ["Unbound legacy journal is rejected",() => {

    const f = fixture();

    const journal = f.createJournal();

    delete journal.bindingVersion;

    f.seedJournal(journal);

    assert.throws(
      f.inspect,
      /JOURNAL_BINDING_INVALID/
    );

    assertNoWrites(f);

  }],

  ["Corrupted journal JSON is rejected",() => {

    const f = fixture();

    f.seedJournalRaw("{invalid");

    assert.throws(
      f.inspect,
      /JOURNAL_JSON_CORRUPTED/
    );

    assertNoWrites(f);

  }],

  ["Corrupted candidate JSON is rejected",() => {

    const f = fixture();

    const journal = f.createJournal();

    journal.candidateCheckpoint = "{invalid";

    assert.throws(
      () => f.validateJournal(journal),
      /JOURNAL_CANDIDATE_CORRUPTED/
    );

  }],

  ["Incorrect candidate fingerprint is rejected",() => {

    const f = fixture();

    const journal = f.createJournal();

    journal.candidateCheckpointHash =
      "0".repeat(64);

    assert.throws(
      () => f.validateJournal(journal),
      /JOURNAL_CANDIDATE_HASH_MISMATCH/
    );

  }],

  ["Candidate identity mismatch is rejected",() => {

    const f = fixture();

    const journal = f.createJournal();

    const candidate =
      JSON.parse(journal.candidateCheckpoint);

    candidate.p36RunId = "unexpected-run";

    journal.candidateCheckpoint =
      JSON.stringify(candidate);

    journal.candidateCheckpointHash =
      hash(journal.candidateCheckpoint);

    assert.throws(
      () => f.validateJournal(journal),
      /JOURNAL_CANDIDATE_INVALID/
    );

  }],

  ["Nonfresh candidate checkpoint is rejected",() => {

    const f = fixture();

    const journal = f.createJournal();

    const candidate =
      JSON.parse(journal.candidateCheckpoint);

    candidate.playerTeamIndex = 1;

    journal.candidateCheckpoint =
      JSON.stringify(candidate);

    journal.candidateCheckpointHash =
      hash(journal.candidateCheckpoint);

    assert.throws(
      () => f.validateJournal(journal),
      /JOURNAL_CANDIDATE_INVALID/
    );

  }],

  ["Oversized journal is rejected before persistence",() => {

    const f = fixture();

    const journal = f.createJournal();

    journal.padding = "x".repeat(9000);

    assert.throws(
      () => f.validateJournal(journal),
      /JOURNAL_CAPACITY_EXCEEDED/
    );

    assertNoWrites(f);

  }],

  ["Universal journal storage preserves exact binding",() => {

    const f = fixture();

    const journal = f.createJournal();

    const saved = f.saveJournal(journal);

    assert.equal(saved.saved,true);

    assert.equal(
      f.journalRaw(),
      JSON.stringify(journal)
    );

    assert.equal(f.journalWrites,1);
    assert.equal(f.checkpointWrites,0);

  }],

  ["Interrupted initialization retains same candidate identity",() => {

    const f = fixture();

    const journal = f.createJournal();

    f.saveJournal(journal);

    const first = f.inspect();
    const second = f.inspect();

    assert.equal(first.action,"REAUTHORIZE");
    assert.equal(second.action,"REAUTHORIZE");

    assert.equal(
      JSON.stringify(first.candidate),
      JSON.stringify(second.candidate)
    );

    assert.equal(f.journalWrites,1);
    assert.equal(f.checkpointWrites,0);

  }],

  ["Protected checkpoint write enables exact assignment recovery",() => {

    const f = fixture();

    const journal = f.createJournal();

    f.saveJournal(journal);

    const written = f.writeCandidate(journal);

    assert.equal(
      written.raw,
      journal.candidateCheckpoint
    );

    const result = f.inspect();

    assert.equal(
      result.action,
      "RECOVER_ASSIGNMENT"
    );

    assert.equal(f.checkpointWrites,1);
    assert.equal(f.journalWrites,1);
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

console.log("\n--- PROTECTED JOURNAL TESTS ---");

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

