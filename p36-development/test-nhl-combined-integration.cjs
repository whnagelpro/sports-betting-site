
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");

const source = fs.readFileSync(
  path.resolve(__dirname,"../nhl-appscript"),
  "utf8"
);

function extractFunction(name) {

  const pattern = new RegExp(
    "^function\\s+" + name + "\\s*\\(",
    "gm"
  );

  const matches = [...source.matchAll(pattern)];

  assert.equal(
    matches.length,1,
    "Function uniqueness: "+name
  );

  const remaining = source.slice(matches[0].index);

  const closing = /^}\s*$/m.exec(remaining);

  assert.ok(closing,"Function boundary: "+name);

  return remaining.slice(
    0,closing.index+1
  );

}

const universalStart =
  "// ===== P36 UNIVERSAL ENGINE START =====";

const universalEnd =
  "// ===== P36 UNIVERSAL ENGINE END =====";

assert.equal(
  source.split(universalStart).length,2
);

assert.equal(
  source.split(universalEnd).length,2
);

const universal = source
  .split(universalStart)[1]
  .split(universalEnd)[0];

const names = [

  "monitorP36NHLSlatesLocked_",
  "orchestrateP36NHLInitializationLocked_",
  "reconcileP36NHLCompletionLocked_",
  "maintainP36NHLRegistryLocked_",
  "validateP36NHLCompletedCheckpoint_",
  "authorizeP36NHLInitializationLocked_",
  "readP36NHLScheduleEvidenceLocked_",
  "commitP36NHLInitializationLocked_",
  "inspectP36NHLBoundJournalLocked_",
  "createP36NHLBoundJournalLocked_",
  "validateP36NHLBoundJournal_",
  "hashP36NHLCheckpointRaw_",
  "readP36NHLCheckpointLocked_",
  "writeP36NHLCheckpointLocked_",
  "createP36NHLCheckpointLocked_",
  "validateP36NHLCheckpoint_",
  "createNHLDailyAnalyticsState_",
  "refreshP36NHLScheduleLocked_",
  "refreshP36NHLSlateSheetLocked_",
  "refreshP36NHLPendingSlatesLocked_",
  "trackP36NHLSlateLocked_",
  "fetchP36VerifiedNHLSlate_",
  "isP36NHLFreshCheckpoint_"

];

const businessLogic = [
  universal,
  ...names.map(extractFunction)
].join("\n\n");

const compiled = new vm.Script(
  businessLogic,
  {filename:"actual-nhl-business-logic.js"}
);

const hash = value =>
  crypto.createHash("sha256")
    .update(value)
    .digest("hex");

const clone = value =>
  JSON.parse(JSON.stringify(value));

const checkpointKey =
  "NHL_DAILY_ANALYTICS_PIPELINE_STATE";

function fixture() {

  const f = {

    today:"2026-11-16",

    locked:true,

    uuid:0,

    apiCalls:0,

    teamCalls:0,

    events:[],

    gamesByDate:new Map(),

    storage:new Map(),

    sheets:new Map(),

    apiFailure:false,

    wrongReadbackStatus:false,

    wrongReadbackDate:false,

    failPoint:null

  };

  const teams = Array.from(
    {length:32},
    (_,index) => ({
      id:index+1,
      full_name:`Mock NHL Team ${index+1}`
    })
  );

  const lock = {
    hasLock:() => f.locked
  };

  const properties = {

    getProperty:key =>
      f.storage.has(key)
        ? f.storage.get(key)
        : null,

    setProperty:(key,value) => {

      value = String(value);

      const isRegistry =
        key === f.registryKey;

      const isJournal =
        key === f.journalKey;

      const isCheckpoint =
        key === checkpointKey;

      if (isRegistry) {

        const registry = JSON.parse(value);

        const assigned = Object.values(
          registry.slates
        ).some(
          slate => slate.state === "PROCESSING"
        );

        if (
          assigned &&
          f.failPoint === "before-assignment"
        ) {

          f.failPoint = null;

          throw new Error(
            "INJECTED_BEFORE_ASSIGNMENT"
          );

        }

      }

      f.storage.set(key,value);

      if (isRegistry) {
        f.events.push("registry-write");
      }

      if (isJournal) {

        f.events.push("journal-write");

        if (f.failPoint === "after-journal") {

          f.failPoint = null;

          throw new Error(
            "INJECTED_AFTER_JOURNAL"
          );

        }

      }

      if (isCheckpoint) {

        f.events.push("checkpoint-write");

        if (
          f.failPoint === "after-checkpoint"
        ) {

          f.failPoint = null;

          throw new Error(
            "INJECTED_AFTER_CHECKPOINT"
          );

        }

      }

    },

    deleteProperty:key => {

      if (
        key === f.journalKey &&
        f.failPoint === "before-journal-clear"
      ) {

        f.failPoint = null;

        throw new Error(
          "INJECTED_BEFORE_JOURNAL_CLEAR"
        );

      }

      f.storage.delete(key);

      if (key === f.journalKey) {
        f.events.push("journal-clear");
      }

    }

  };

  function makeSheet(name) {

    let cells = [];

    const sheet = {

      name,

      hidden:false,

      getParent:() => spreadsheet,

      hideSheet:() => {
        sheet.hidden = true;
      },

      getLastRow:() => cells.length,

      getMaxRows:() => 1000,

      getRange:(row,column,numRows,numColumns) => {

        const read = () =>
          Array.from(
            {length:numRows},
            (_,r) => Array.from(
              {length:numColumns},
              (_,c) =>
                cells[row+r-1]?.[column+c-1] ?? ""
            )
          );

        return {

          setValues:values => {

            values.forEach((valuesRow,r) => {

              const index = row+r-1;

              cells[index] ||= [];

              valuesRow.forEach((value,c) => {

                cells[index][column+c-1] = value;

              });

            });

          },

          getValues:read,

          getDisplayValues:() =>
            read().map(
              row => row.map(String)
            )

        };

      },

      clear:() => {
        cells = [];
      },

      alterReadback:() => {

        if (
          f.wrongReadbackStatus &&
          cells[1]
        ) {

          cells[1][4] = "In Progress";

        }

        if (
          f.wrongReadbackDate &&
          cells[1]
        ) {

          cells[1][1] = "2026-11-14";

        }

      }

    };

    f.sheets.set(name,sheet);

    return sheet;

  }

  const spreadsheet = {

    getSheetByName:name =>
      f.sheets.get(name) || null,

    insertSheet:makeSheet,

    getSpreadsheetTimeZone:() =>
      "America/Phoenix"

  };

  makeSheet("Schedule");

  const context = vm.createContext({

    Date,

    Logger:{
      log:message =>
        f.events.push("log:"+String(message))
    },

    NHL_DAILY_ANALYTICS_PIPELINE:{
      stateKey:checkpointKey
    },

    getTodayString_:() => f.today,

    getNHLDailyAnalyticsDateKey_:() =>
      f.today,

    fetchActiveNHLTeams_:() => {

      f.teamCalls++;

      return clone(teams);

    },

    PropertiesService:{

      getScriptProperties:() =>
        properties

    },

    SpreadsheetApp:{

      getActiveSpreadsheet:() =>
        spreadsheet,

      flush:() => {

        for (const sheet of f.sheets.values()) {

          sheet.alterReadback();

        }

      }

    },

    Utilities:{

      DigestAlgorithm:{
        SHA_256:"SHA_256"
      },

      Charset:{
        UTF_8:"UTF_8"
      },

      computeDigest:(algorithm,value) =>

        Array.from(
          crypto.createHash("sha256")
            .update(String(value),"utf8")
            .digest(),
          byte => byte > 127 ? byte-256 : byte
        ),

      getUuid:() =>
        `integration-run-${++f.uuid}`,

      newBlob:value => ({

        getBytes:() =>
          Array.from(
            Buffer.from(value,"utf8")
          )

      }),

      formatDate:(date,timeZone,format) => {

        assert.equal(format,"yyyy-MM-dd");

        const parts =
          new Intl.DateTimeFormat(
            "en-US",
            {
              timeZone,
              year:"numeric",
              month:"2-digit",
              day:"2-digit"
            }
          ).formatToParts(date);

        const get = type =>
          parts.find(part => part.type===type).value;

        return [
          get("year"),
          get("month"),
          get("day")
        ].join("-");

      }

    },

    clearScheduleSheet_:sheet => {
      sheet.clear();
    },

    fetchApi_:(endpoint,params) => {

      f.apiCalls++;

      f.events.push("api-request");

      assert.equal(
        endpoint,"/nhl/v1/games"
      );

      if (f.apiFailure) {

        throw new Error("MOCK_API_FAILURE");

      }

      const requested = params["dates[]"];

      const date = Array.isArray(requested)
        ? requested[0]
        : requested;

      const games = f.gamesByDate.get(date) || [];

      const cursor = Number(params.cursor || 0);

      const pageSize = 2;

      const data = games.slice(
        cursor,cursor+pageSize
      );

      const next = cursor+pageSize;

      return {

        data:clone(data),

        meta:{
          next_cursor:
            next < games.length
              ? next
              : null
        }

      };

    }

  });

  compiled.runInContext(context);

  f.context = context;
  f.lock = lock;

  f.registryKey =
    context.getP36RegistryPropertyKey_("NHL");

  f.journalKey =
    context.getP36JournalKey_("NHL");

  f.checkpointRaw = () =>
    properties.getProperty(checkpointKey);

  f.checkpoint = () =>
    JSON.parse(f.checkpointRaw());

  f.registry = () =>
    context.loadP36SlateRegistry_(
      "NHL",properties
    ).registry;

  f.journalRaw = () =>
    properties.getProperty(f.journalKey);

  f.slate = date =>
    f.registry().slates["NHL:"+date];

  f.monitor = () =>
    context.monitorP36NHLSlatesLocked_(lock);

  f.complete = (
    state = f.checkpoint()
  ) => {

    const ids = teams.map(team => team.id);

    const completed = {

      ...state,

      completed:true,
      stage:"COMPLETE",
      suspended:false,

      pipelineVersion:"NHL_TEAM_BASED_V1",

      teamIds:[...ids],
      teamIndex:32,

      playerMonthIndex:0,
      teamMonthIndex:0,

      lastSuccessfulStep:"TOP_TEAM_TRENDS",

      lastError:null

    };

    f.storage.set(
      checkpointKey,
      JSON.stringify(completed)
    );

    return completed;

  };

  f.setGames = (date,statuses) => {

    const prefix = Number(
      date.replaceAll("-","")
    )*100;

    f.gamesByDate.set(

      date,

      statuses.map((status,index) => ({

        id:prefix+index+1,

        date,

        game_date:date,

        status:
          status === "Final"
            ? "OFF"
            : status === "In Progress"
              ? "LIVE"
              : "FUT",

        status_state:
          status === "Final"
            ? "final"
            : status === "In Progress"
              ? "in_progress"
              : "scheduled",

        season:2026,

        postseason:false,

        time:date+"T20:00:00Z",

        home_team:{
          id:1,
          full_name:"Mock Home Team"
        },

        away_team:{
          id:2,
          full_name:"Mock Away Team"
        }

      }))

    );

  };

  f.ready = (date = f.today) =>
    f.setGames(date,[
      "Final","Final","Final"
    ]);

  f.initialize = () => {

    f.ready();

    const result = f.monitor();

    assert.equal(
      result.action,"RUN",
      JSON.stringify(result)
    );

    assert.equal(
      f.slate(f.today).state,
      "PROCESSING"
    );

    assert.equal(f.journalRaw(),null);

    return result;

  };

  f.complete(
    context.createNHLDailyAnalyticsState_()
  );

  f.events.length = 0;

  return f;

}

const tests = [];

function test(name,fn) {
  tests.push({name,fn});
}

test("Empty slate preserves checkpoint",() => {

  const f = fixture();

  const before = f.checkpointRaw();

  assert.equal(f.monitor().action,"WAIT");

  assert.equal(f.checkpointRaw(),before);

  assert.equal(f.journalRaw(),null);

  assert.equal(f.teamCalls,0);

});

test("Incomplete daily slate is tracked",() => {

  const f = fixture();

  const before = f.checkpointRaw();

  f.setGames(f.today,[
    "Final","In Progress"
  ]);

  assert.equal(f.monitor().action,"WAIT");

  assert.equal(
    f.slate(f.today).state,"TRACKING"
  );

  assert.equal(f.checkpointRaw(),before);

});

test("Full slate initialization uses actual pagination",() => {

  const f = fixture();

  f.initialize();

  assert.ok(f.apiCalls >= 4);

  assert.equal(
    f.checkpoint().p36SlateKey,
    "NHL:"+f.today
  );

  assert.equal(
    f.checkpoint().completed,false
  );

  assert.equal(
    f.checkpoint().teamIndex,0
  );

});

test("Journal persists before checkpoint replacement",() => {

  const f = fixture();

  f.initialize();

  assert.ok(
    f.events.indexOf("journal-write") <
    f.events.indexOf("checkpoint-write")
  );

  assert.ok(
    f.events.indexOf("checkpoint-write") <
    f.events.indexOf("journal-clear")
  );

});

test("Active assignment resumes without resetting",() => {

  const f = fixture();

  f.initialize();

  const before = f.checkpointRaw();

  assert.equal(f.monitor().action,"RESUME");

  assert.equal(f.checkpointRaw(),before);

});

test("Valid completed assignment reconciles",() => {

  const f = fixture();

  f.initialize();

  f.complete();

  assert.equal(f.monitor().action,"WAIT");

  assert.equal(
    f.slate(f.today).state,"PROCESSED"
  );

});

test("Processed slate cannot initialize twice",() => {

  const f = fixture();

  f.initialize();

  f.complete();

  f.monitor();

  const before = f.checkpointRaw();

  const teamCalls = f.teamCalls;

  for (let i=0;i<3;i++) {

    assert.equal(f.monitor().action,"WAIT");

    assert.equal(f.checkpointRaw(),before);

  }

  assert.equal(f.teamCalls,teamCalls);

  assert.equal(f.journalRaw(),null);

});

test("Next daily slate gets independent assignment",() => {

  const f = fixture();

  f.initialize();

  const first = f.checkpoint().p36RunId;

  f.complete();

  f.monitor();

  f.today = "2026-11-17";

  f.initialize();

  assert.notEqual(
    f.checkpoint().p36RunId,first
  );

  assert.equal(
    f.slate("2026-11-16").state,
    "PROCESSED"
  );

});

test("Older incomplete slate is recovered after midnight",() => {

  const f = fixture();

  const previous = f.today;

  f.setGames(previous,[
    "Final","In Progress"
  ]);

  f.monitor();

  f.today = "2026-11-17";

  f.ready(previous);

  const result = f.monitor();

  assert.equal(result.action,"RUN");

  assert.equal(
    f.checkpoint().p36SlateKey,
    "NHL:"+previous
  );

  assert.equal(
    f.sheets.get("P36 Schedule History").hidden,
    true
  );

});

test("Suspended checkpoint is preserved",() => {

  const f = fixture();

  const state = f.checkpoint();

  state.suspended = true;

  f.storage.set(
    checkpointKey,JSON.stringify(state)
  );

  f.ready();

  const before = f.checkpointRaw();

  assert.equal(f.monitor().action,"BLOCK");

  assert.equal(f.checkpointRaw(),before);

  assert.equal(f.apiCalls,0);

});

test("Missing checkpoint blocks initialization",() => {

  const f = fixture();

  f.storage.delete(checkpointKey);

  f.ready();

  assert.equal(f.monitor().action,"BLOCK");

  assert.equal(f.checkpointRaw(),null);

});

test("API outage preserves checkpoint",() => {

  const f = fixture();

  f.ready();

  const before = f.checkpointRaw();

  f.apiFailure = true;

  assert.throws(
    () => f.monitor(),
    /MOCK_API_FAILURE/
  );

  assert.equal(f.checkpointRaw(),before);

  assert.equal(f.journalRaw(),null);

});

test("Schedule status mismatch blocks assignment",() => {

  const f = fixture();

  f.ready();

  f.wrongReadbackStatus = true;

  const before = f.checkpointRaw();

  assert.equal(f.monitor().action,"WAIT");

  assert.equal(f.checkpointRaw(),before);

});

test("Schedule date mismatch blocks assignment",() => {

  const f = fixture();

  f.ready();

  f.wrongReadbackDate = true;

  const before = f.checkpointRaw();

  assert.equal(f.monitor().action,"WAIT");

  assert.equal(f.checkpointRaw(),before);

});

test("Invalid completed team inventory blocks reconciliation",() => {

  const f = fixture();

  f.initialize();

  const state = f.complete();

  state.teamIds[31] = 999999;

  f.storage.set(
    checkpointKey,JSON.stringify(state)
  );

  assert.equal(f.monitor().action,"BLOCK");

  assert.equal(
    f.slate(f.today).state,
    "PROCESSING"
  );

});

test("Completion reconciles before Schedule outage",() => {

  const f = fixture();

  f.initialize();

  f.complete();

  f.apiFailure = true;

  assert.throws(
    () => f.monitor(),
    /MOCK_API_FAILURE/
  );

  assert.equal(
    f.slate(f.today).state,
    "PROCESSED"
  );

});

test("Journal-only interruption safely reauthorizes",() => {

  const f = fixture();

  f.ready();

  const before = f.checkpointRaw();

  f.failPoint = "after-journal";

  assert.throws(
    () => f.monitor(),
    /INJECTED_AFTER_JOURNAL/
  );

  assert.equal(f.checkpointRaw(),before);

  assert.ok(f.journalRaw());

  assert.equal(f.monitor().action,"RUN");

  assert.equal(f.journalRaw(),null);

});

test("Checkpoint interruption recovers exact assignment",() => {

  const f = fixture();

  f.ready();

  f.failPoint = "after-checkpoint";

  assert.throws(
    () => f.monitor(),
    /INJECTED_AFTER_CHECKPOINT/
  );

  const candidate = f.checkpointRaw();

  assert.ok(f.journalRaw());

  f.apiFailure = true;

  assert.equal(f.monitor().action,"RUN");

  assert.equal(f.checkpointRaw(),candidate);

  assert.equal(f.journalRaw(),null);

});

test("Failed assignment write recovers without replacement",() => {

  const f = fixture();

  f.ready();

  f.failPoint = "before-assignment";

  assert.throws(
    () => f.monitor(),
    /INJECTED_BEFORE_ASSIGNMENT/
  );

  const before = f.checkpointRaw();

  assert.equal(f.monitor().action,"RUN");

  assert.equal(f.checkpointRaw(),before);

  assert.equal(
    f.slate(f.today).state,
    "PROCESSING"
  );

});

test("Interrupted journal clearing remains idempotent",() => {

  const f = fixture();

  f.ready();

  f.failPoint = "before-journal-clear";

  assert.throws(
    () => f.monitor(),
    /INJECTED_BEFORE_JOURNAL_CLEAR/
  );

  const before = f.checkpointRaw();

  assert.equal(
    f.slate(f.today).state,
    "PROCESSING"
  );

  assert.equal(f.monitor().action,"RUN");

  assert.equal(f.checkpointRaw(),before);

  assert.equal(f.journalRaw(),null);

});

test("Maintenance preserves current assigned processed slate",() => {

  const f = fixture();

  const date = f.today;

  f.initialize();

  f.complete();

  f.monitor();

  f.today = "2026-12-20";

  assert.equal(f.monitor().action,"WAIT");

  assert.equal(
    f.slate(date).state,"PROCESSED"
  );

});

test("Maintenance retires old unprotected processed slate",() => {

  const f = fixture();

  const old = f.today;

  f.initialize();

  f.complete();

  f.monitor();

  f.today = "2026-11-17";

  f.initialize();

  f.complete();

  f.monitor();

  f.today = "2026-12-20";

  f.monitor();

  assert.equal(f.slate(old),undefined);

  assert.equal(
    f.slate("2026-11-17").state,
    "PROCESSED"
  );

});

test("Realistic 45-day completed slate simulation",() => {

  const f = fixture();

  let peak = 0;

  for (let day=0;day<45;day++) {

    const date = new Date(
      Date.UTC(2026,10,16+day)
    ).toISOString().slice(0,10);

    f.today = date;

    const games = 1+(day%16);

    f.setGames(
      date,
      Array(games).fill("Final")
    );

    const result = f.monitor();

    assert.equal(
      result.action,"RUN",
      "Daily initialization: "+date+
      " "+JSON.stringify(result)
    );

    f.complete();

    assert.equal(
      f.monitor().action,"WAIT"
    );

    assert.equal(
      f.slate(date).state,"PROCESSED"
    );

    const bytes = Buffer.byteLength(
      JSON.stringify(f.registry()),"utf8"
    );

    peak = Math.max(peak,bytes);

    assert.ok(bytes <= 8000);

  }

  console.log(
    "45-DAY PEAK REGISTRY BYTES:",peak
  );

});

let passed = 0;

console.log(
  "ACTUAL BUSINESS LOGIC FUNCTIONS:",
  names.length+
  [...universal.matchAll(/^function\s+/gm)].length
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
  "LOCAL SIMULATED APPS SCRIPT INFRASTRUCTURE"
);

console.log(
  "STATUS:",
  passed===tests.length ? "PASS" : "FAIL"
);

if (passed!==tests.length) {
  process.exitCode = 1;
}
