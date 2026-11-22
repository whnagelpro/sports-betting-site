
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const sourcePath = path.resolve(
  __dirname,
  "../nba-appscript"
);

const original = fs.readFileSync(sourcePath);
const source = original.toString("utf8");

function extract(name) {

  const matches = [
    ...source.matchAll(
      new RegExp(
        "^function\\s+" + name + "\\s*\\(",
        "gm"
      )
    )
  ];

  assert.equal(
    matches.length,
    1,
    "Function must be unique: " + name
  );

  const remaining = source.slice(matches[0].index);

  const closing = /^}[ \t]*$/m.exec(remaining);

  assert.ok(closing, name);

  return remaining.slice(
    0,
    closing.index + closing[0].length
  );

}

const names = [
  "isValidP36Date_",
  "normalizeP36GameStatus_",
  "getP36ScheduleStatus_",
  "evaluateP36SlateCompletion_",
  "fetchP36VerifiedNBASlate_"
];

const logic = names.map(extract).join("\n\n");

const date = "2026-11-15";

let responses = [];
let calls = [];
let passed = 0;
let failed = 0;

const context = vm.createContext({

  fetchApi_(endpoint, params) {

    assert.equal(endpoint, "/nba/v1/games");
    assert.equal(params["dates[]"], date);
    assert.equal(params.per_page, 100);

    calls.push({...params});

    assert.ok(
      responses.length,
      "Unexpected API request"
    );

    const response = responses.shift();

    if (response instanceof Error) {
      throw response;
    }

    return response;

  }

});

new vm.Script(logic).runInContext(context);

function game(id, overrides = {}) {

  return {
    id,
    date,
    status_state:"final",
    status:"Final",
    ...overrides
  };

}

function games(count) {

  return Array.from(
    {length:count},
    (_,i) => game(i+1)
  );

}

function page(data, meta) {
  return {data, meta};
}

function runMock(pages) {

  responses = [...pages];
  calls = [];

  const result =
    context.fetchP36VerifiedNBASlate_(date);

  assert.equal(responses.length, 0);
  assert.equal(result.snapshotVerified, true);
  assert.equal(result.league, "NBA");
  assert.equal(result.slateDate, date);
  assert.equal(result.pages, calls.length);

  return result;

}

function test(label, fn) {

  try {

    fn();
    passed++;
    console.log("PASS | " + label);

  } catch (error) {

    failed++;
    console.log(
      "FAIL | " + label + " | " + error.message
    );

  }

}

const accepted = [

  ["Explicit null cursor",
    games(1), {next_cursor:null}],

  ["Observed five-game response",
    games(5), {per_page:100}],

  ["Observed nine-game response",
    games(9), {per_page:100}],

  ["Empty terminal page",
    [], {per_page:100}],

  ["Partial terminal page with 99 games",
    games(99), {per_page:100}]

];

for (const [label, data, meta] of accepted) {

  test(label, () => {

    const result = runMock([
      page(data, meta)
    ]);

    assert.equal(
      result.games.length,
      data.length
    );

  });

}

const rejected = [

  ["Full page without cursor",
    games(100), {per_page:100},
    /AMBIGUOUS_TERMINAL_PAGE/],

  ["Missing page size",
    games(1), {},
    /UNVERIFIED_TERMINAL_PAGE_SIZE/],

  ["String page size",
    games(1), {per_page:"100"},
    /UNVERIFIED_TERMINAL_PAGE_SIZE/],

  ["Unexpected page size",
    games(1), {per_page:25},
    /UNVERIFIED_TERMINAL_PAGE_SIZE/],

  ["Zero page size",
    games(1), {per_page:0},
    /UNVERIFIED_TERMINAL_PAGE_SIZE/],

  ["Invalid numeric cursor",
    games(1), {next_cursor:0},
    /INVALID_CURSOR/],

  ["Blank cursor",
    games(1), {next_cursor:" "},
    /INVALID_CURSOR/],

  ["Present undefined cursor",
    games(1), {next_cursor:undefined, per_page:100},
    /INVALID_CURSOR/],

  ["Missing metadata",
    games(1), undefined,
    /INVALID_API_RESPONSE/],

  ["Array metadata",
    games(1), [],
    /INVALID_API_RESPONSE/],

  ["Invalid data response",
    {}, {per_page:100},
    /INVALID_API_RESPONSE/],

  ["Incorrect slate date",
    [game(1,{date:"2026-11-14"})],
    {per_page:100},
    /SLATE_DATE_MISMATCH/],

  ["Empty nonterminal page",
    [], {next_cursor:12},
    /EMPTY_PAGINATION_PAGE/]

];

for (const [label, data, meta, error] of rejected) {

  test(label, () => {

    assert.throws(
      () => runMock([page(data, meta)]),
      error
    );

  });

}

for (const terminal of [

  {next_cursor:null},
  {per_page:100}

]) {

  test(
    "Numeric continuation with " +
    JSON.stringify(terminal),
    () => {

      const result = runMock([
        page([game(1)], {next_cursor:12}),
        page([game(2)], terminal)
      ]);

      assert.equal(result.games.length, 2);
      assert.equal(calls[1].cursor, 12);

    }
  );

}

test("String continuation cursor", () => {

  const result = runMock([
    page([game(1)], {next_cursor:"abc"}),
    page([game(2)], {per_page:100})
  ]);

  assert.equal(result.games.length, 2);
  assert.equal(calls[1].cursor, "abc");

});

test("Repeated continuation cursor rejected", () => {

  assert.throws(() => runMock([
    page([game(1)], {next_cursor:12}),
    page([game(2)], {next_cursor:12})
  ]), /REPEATED_CURSOR/);

});

test("Duplicate game IDs rejected", () => {

  assert.throws(() => runMock([
    page([game(1)], {next_cursor:12}),
    page([game(1)], {per_page:100})
  ]), /DUPLICATE_GAME_ID/);

});

test("Pagination limit preserved", () => {

  assert.throws(() => runMock(
    Array.from(
      {length:20},
      (_,i) => page(
        [game(i+1)],
        {next_cursor:i+1}
      )
    )
  ), /PAGINATION_LIMIT/);

});

function evaluate(data, expectedIds = data.map(g => g.id)) {

  const snapshot = runMock([
    page(data, {per_page:100})
  ]);

  const rows = snapshot.games.map(item => ({
    gameId:item.id,
    status:context.getP36ScheduleStatus_("NBA",item)
  }));

  return context.evaluateP36SlateCompletion_(
    "NBA",
    date,
    expectedIds,
    snapshot.games,
    rows
  );

}

test("Observed production mixed-status slate remains incomplete", () => {

  const data = [
    ...games(4),

    game(5,{
      status_state:"in_progress",
      status:"3rd Qtr"
    }),

    game(6,{
      status_state:"in_progress",
      status:"3rd Qtr"
    }),

    game(7,{
      status_state:"in_progress",
      status:"2nd Qtr"
    }),

    game(8,{
      status_state:"scheduled",
      status:"2026-11-16T01:00:00Z"
    }),

    game(9,{
      status_state:"scheduled",
      status:"2026-11-16T02:00:00Z"
    })

  ];

  const result = evaluate(data);

  assert.equal(result.total, 9);
  assert.equal(result.completed, 4);
  assert.equal(result.inProgress, 3);
  assert.equal(result.scheduled, 2);
  assert.equal(result.unknown, 0);
  assert.equal(result.ready, false);
  assert.equal(result.reason, "SLATE_INCOMPLETE");

});

test("Completed five-game slate becomes ready", () => {

  const result = evaluate(games(5));

  assert.equal(result.completed, 5);
  assert.equal(result.ready, true);
  assert.equal(result.reason, "SLATE_COMPLETE");

});

test("Empty verified snapshot cannot authorize initialization", () => {

  const result = evaluate([]);

  assert.equal(result.ready, false);
  assert.equal(result.reason, "EMPTY_SLATE");

});

test("Missing expected game prevents readiness", () => {

  const result = evaluate(
    games(4),
    [1,2,3,4,5]
  );

  assert.equal(result.ready, false);
  assert.equal(
    result.reason,
    "INCOMPLETE_GAME_INVENTORY"
  );

});

test("Contradictory final status prevents readiness", () => {

  const result = evaluate([

    game(1),

    game(2,{
      status_state:"final",
      status:"3rd Qtr"
    })

  ]);

  assert.equal(result.ready, false);
  assert.equal(result.unknown, 1);

});

test("API outage cannot produce verified snapshot", () => {

  assert.throws(
    () => runMock([new Error("SIMULATED_API_OUTAGE")]),
    /SIMULATED_API_OUTAGE/
  );

});

test("Invalid game ID rejected", () => {

  assert.throws(() => runMock([
    page([game(0)], {per_page:100})
  ]), /INVALID_GAME_ID/);

});

test("NBA source remains unchanged", () => {

  assert.ok(
    fs.readFileSync(sourcePath).equals(original)
  );

});

console.log("\n--- FINAL REGRESSION RESULTS ---");
console.log("ACTUAL FUNCTIONS EXTRACTED:", names.length);
console.log("ASSERTIONS:", passed + failed);
console.log("PASS:", passed);
console.log("FAIL:", failed);

console.log(
  "STATUS:",
  failed === 0 && passed === 32
    ? "PASS"
    : "FAIL"
);

if (failed !== 0 || passed !== 32) {
  process.exitCode = 1;
}
