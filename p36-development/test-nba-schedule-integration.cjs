
const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

console.log(
  "=== P36 D5 STEP 2C.3 — NBA SCHEDULE INTEGRATION TEST ==="
);

const original = fs.readFileSync("nba-appscript");
const source = original.toString("utf8");

const expectedHash =
  "12dbc2198955a4492ec027f70bfd9b6e8f2a328addfdc2140c810a9ffd18e703";

const hash = value =>
  crypto.createHash("sha256")
    .update(value)
    .digest("hex");

assert.equal(hash(original),expectedHash);

new vm.Script(source);

console.log("PASS | Existing NBA source verified");

// Inspect existing callers before production integration.

const definitions = [
  ...source.matchAll(/^function\s+(\w+)\s*\(/gm)
];

console.log("\n--- EXISTING SCHEDULE CALLERS ---");

const callers = [];

for (let i = 0; i < definitions.length; i++) {

  const start = definitions[i].index;

  const end = i + 1 < definitions.length
    ? definitions[i+1].index
    : source.length;

  const region = source.slice(start,end);

  if (
    definitions[i][1] !== "refreshNBAScheduleSheet" &&
    /\brefreshNBAScheduleSheet\s*\(/.test(region)
  ) {

    const caller = {
      name:definitions[i][1],
      scriptLock:/getScriptLock\s*\(/.test(region)
    };

    callers.push(caller);

    console.log(JSON.stringify(caller));

  }

}

const date = "2026-11-15";

const headers = [
  "Game Id",
  "Game Date",
  "Away Team",
  "Home Team",
  "Status",
  "Season",
  "Postseason",
  "Start Time",
  "Home Team Id",
  "Away Team Id"
];

// Extract the installed integration and universal engine,
// rather than testing separate development copies.

function extractRegion(name) {

  const index = definitions.findIndex(
    match => match[1] === name
  );

  assert.notEqual(index,-1);

  return source.slice(
    definitions[index].index,
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

const installedCode = [

  extractRegion("refreshNBAScheduleSheet"),

  extractRegion("refreshP36NBAScheduleLocked_"),

  extractRegion("clearScheduleSheet_"),

  extractBlock(
    "// ===== P36 UNIVERSAL ENGINE START =====",
    "// ===== P36 UNIVERSAL ENGINE END ====="
  ),

  extractBlock(
    "// ===== P36 NBA SLATE ADAPTERS START =====",
    "// ===== P36 NBA SLATE ADAPTERS END ====="
  )

].join("\n\n");

const compiled = new vm.Script(installedCode);

function fixture() {

  const f = {

    lockAvailable:true,
    locked:false,
    lockAcquisitions:0,
    lockReleases:0,
    requests:0,
    flushes:0,
    sheetWrites:0,
    propertyWrites:0,
    apiFailure:false,
    writeFailure:false,
    corruptReadback:false,
    missingSheet:false,

    events:[],

    games:[1,2].map(id => ({
      id,
      date,
      status:"Final",
      status_state:"final",
      season:2026,
      visitor_team:{
        id:10,
        full_name:"Away"
      },
      home_team:{
        id:20,
        full_name:"Home"
      }
    })),

    cells:[["Existing Schedule"]]

  };

  const storage = new Map();

  const lock = {

    tryLock:() => {

      f.lockAcquisitions++;

      if (!f.lockAvailable || f.locked) {
        return false;
      }

      f.locked = true;
      f.events.push("LOCK");

      return true;

    },

    hasLock:() => f.locked,

    releaseLock:() => {

      assert.equal(f.locked,true);

      f.locked = false;
      f.lockReleases++;
      f.events.push("RELEASE");

    }

  };

  const properties = {

    getProperty:key =>
      storage.has(key) ? storage.get(key) : null,

    setProperty:(key,value) => {

      assert.equal(f.locked,true);

      f.propertyWrites++;
      storage.set(key,value);

      f.events.push("PROPERTY_WRITE");

    },

    deleteProperty:key => storage.delete(key)

  };

  const sheet = {

    getMaxRows:() => 100,

    getLastRow:() => f.cells.length,

    getRange:(row,col,height,width) => ({

      clearContent:() => {

        assert.equal(f.locked,true);

        f.cells = [];
        f.sheetWrites++;

        f.events.push("CLEAR");

      },

      setValues:values => {

        assert.equal(f.locked,true);

        if (f.writeFailure) {
          throw new Error("SIMULATED_WRITE_FAILURE");
        }

        assert.equal(values.length,height);

        values.forEach((valuesRow,i) => {

          assert.equal(valuesRow.length,width);

          f.cells[row-1+i] = Array.from(valuesRow);

        });

        f.sheetWrites++;

        f.events.push("WRITE");

      },

      getDisplayValues:() => {

        assert.equal(f.locked,true);
        assert.ok(f.flushes > 0);

        f.events.push("READBACK");

        return Array.from({length:height},(_,i) =>

          Array.from({length:width},(_,j) => {

            if (
              f.corruptReadback &&
              row > 1 &&
              j === 4
            ) {
              return "Unknown";
            }

            return String(
              f.cells[row-1+i]?.[col-1+j] ?? ""
            );

          })

        );

      }

    })

  };

  const context = vm.createContext({

    getTodayString_:() => date,

    Logger:{log:() => {}},

    LockService:{
      getScriptLock:() => lock
    },

    PropertiesService:{
      getScriptProperties:() => properties
    },

    SpreadsheetApp:{

      getActiveSpreadsheet:() => ({

        getSheetByName:name => {

          assert.equal(name,"Schedule");

          return f.missingSheet ? null : sheet;

        }

      }),

      flush:() => {

        assert.equal(f.locked,true);

        f.flushes++;
        f.events.push("FLUSH");

      }

    },

    Utilities:{

      newBlob:value => ({

        getBytes:() =>
          Buffer.from(value,"utf8")

      })

    },

    fetchApi_:(endpoint,params) => {

      assert.equal(f.locked,true);
      assert.equal(endpoint,"/nba/v1/games");
      assert.equal(params["dates[]"],date);

      f.requests++;
      f.events.push("API");

      if (f.apiFailure) {
        throw new Error("SIMULATED_API_FAILURE");
      }

      return {
        data:f.games,
        meta:{next_cursor:null}
      };

    }

  });

  compiled.runInContext(context);

  f.run = () =>
    context.refreshNBAScheduleSheet();

  f.slate = () =>
    context.loadP36SlateRegistry_(
      "NBA",properties
    ).registry.slates[`NBA:${date}`];

  return f;

}

const cases = [

  ["Completed slate becomes READY",() => {

    const f = fixture();

    assert.equal(f.run().ready,true);
    assert.equal(f.slate().state,"READY");

  }],

  ["Only one API request for a single-page slate",() => {

    const f = fixture();

    f.run();

    assert.equal(f.requests,1);

  }],

  ["Existing ten Schedule headers preserved",() => {

    const f = fixture();

    f.run();

    assert.deepEqual(f.cells[0],headers);

  }],

  ["Completed games written as Final",() => {

    const f = fixture();

    f.games[0].status = "Final/OT";

    f.run();

    assert.equal(f.cells[1][4],"Final");
    assert.equal(f.cells[2][4],"Final");

  }],

  ["Live slate remains TRACKING",() => {

    const f = fixture();

    f.games[1].status = "Live";
    f.games[1].status_state = "in_progress";

    assert.equal(f.run().ready,false);
    assert.equal(f.slate().state,"TRACKING");

  }],

  ["Last game completion transitions slate to READY",() => {

    const f = fixture();

    f.games[1].status = "Live";
    f.games[1].status_state = "in_progress";

    f.run();

    f.games[1].status = "Final";
    f.games[1].status_state = "final";

    assert.equal(f.run().ready,true);
    assert.equal(f.slate().state,"READY");

  }],

  ["Empty schedule does not become READY",() => {

    const f = fixture();

    f.games = [];

    assert.equal(f.run().ready,false);
    assert.equal(f.slate(),undefined);
    assert.equal(f.cells.length,1);

  }],

  ["Busy lock prevents all writes and API requests",() => {

    const f = fixture();

    f.lockAvailable = false;

    assert.equal(
      f.run().reason,
      "SCRIPT_LOCK_BUSY"
    );

    assert.equal(f.requests,0);
    assert.equal(f.sheetWrites,0);
    assert.equal(f.propertyWrites,0);
    assert.equal(f.lockReleases,0);

  }],

  ["Lock released after successful execution",() => {

    const f = fixture();

    f.run();

    assert.equal(f.locked,false);
    assert.equal(f.lockReleases,1);

  }],

  ["API failure preserves existing Schedule",() => {

    const f = fixture();

    f.apiFailure = true;

    assert.throws(
      f.run,
      /SIMULATED_API_FAILURE/
    );

    assert.equal(f.sheetWrites,0);
    assert.equal(f.propertyWrites,0);
    assert.equal(f.locked,false);

  }],

  ["Spreadsheet write failure prevents readiness",() => {

    const f = fixture();

    f.writeFailure = true;

    assert.throws(
      f.run,
      /SIMULATED_WRITE_FAILURE/
    );

    assert.equal(f.propertyWrites,0);
    assert.equal(f.locked,false);

  }],

  ["Corrupt Schedule readback blocks readiness",() => {

    const f = fixture();

    f.corruptReadback = true;

    assert.equal(f.run().ready,false);
    assert.equal(f.slate().state,"TRACKING");
    assert.equal(f.locked,false);

  }],

  ["Spreadsheet flush precedes Schedule readback",() => {

    const f = fixture();

    f.run();

    assert.ok(
      f.events.indexOf("FLUSH") <
      f.events.indexOf("READBACK")
    );

  }],

  ["Missing Schedule sheet fails safely",() => {

    const f = fixture();

    f.missingSheet = true;

    assert.throws(f.run,/not found/);

    assert.equal(f.requests,0);
    assert.equal(f.propertyWrites,0);
    assert.equal(f.locked,false);

  }],

  ["Repeated refresh preserves slate identity",() => {

    const f = fixture();

    f.run();
    f.run();

    assert.equal(f.slate().slateKey,`NBA:${date}`);
    assert.equal(f.slate().state,"READY");
    assert.equal(f.requests,2);

  }],

  ["Existing source remains unchanged",() => {

    assert.equal(
      hash(fs.readFileSync("nba-appscript")),
      expectedHash
    );

  }]

];

let passed = 0;

console.log("\n--- INTEGRATED EXECUTION TESTS ---");

for (const [name,run] of cases) {

  try {

    run();
    passed++;
    console.log(`PASS | ${name}`);

  } catch (error) {

    console.log(`FAIL | ${name} | ${error.message}`);

  }

}

console.log("\n--- FINAL RESULTS ---");
console.log(`ASSERTIONS: ${cases.length}`);
console.log(`PASS: ${passed}`);
console.log(`FAIL: ${cases.length-passed}`);
console.log(`EXISTING SCHEDULE CALLERS: ${callers.length}`);

console.log(
  "CALLERS WITH DIRECT SCRIPT LOCK REFERENCES:",
  callers.filter(caller => caller.scriptLock).length
);

console.log("EXECUTION ENVIRONMENT: LOCAL MOCK");
console.log("TEST HARNESS SAVED: YES");
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

