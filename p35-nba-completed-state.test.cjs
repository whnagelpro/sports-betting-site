"use strict";

const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const source = fs.readFileSync("nba-appscript", "utf8");

const start = source.indexOf(
  "function runNBADailyAnalyticsPipeline()"
);

const end = source.indexOf(
  "function resetNBADailyAnalyticsPipeline()",
  start
);

assert(
  start >= 0 && end > start,
  "Cannot isolate NBA mother pipeline"
);

const pipeline = source.slice(start, end);

const match = pipeline.match(
  /if\s*\(\s*(!state[\s\S]*?)\s*\)\s*\{\s*state\s*=\s*createNBADailyAnalyticsState_\(\)/
);

assert(match, "Cannot extract initialization condition");

const condition = match[1];

function createsFreshState(state, today) {
  return vm.runInNewContext(
    condition,
    { state, today },
    { timeout: 1000 }
  );
}

const cases = [
  {
    name: "Missing state starts fresh",
    state: null,
    today: "2026-11-12",
    expected: true
  },
  {
    name: "Unfinished same-day run resumes",
    state: {
      runDate: "2026-11-12",
      completed: false
    },
    today: "2026-11-12",
    expected: false
  },
  {
    name: "Unfinished previous-day run resumes",
    state: {
      runDate: "2026-11-11",
      completed: false
    },
    today: "2026-11-12",
    expected: false
  },
  {
    name: "Completed same-day run does not restart",
    state: {
      runDate: "2026-11-12",
      completed: true
    },
    today: "2026-11-12",
    expected: false
  },
  {
    name: "Completed previous-day run starts fresh",
    state: {
      runDate: "2026-11-11",
      completed: true
    },
    today: "2026-11-12",
    expected: true
  }
];

console.log(
  "=== P35 NBA — COMPLETED STATE IDEMPOTENCY ==="
);

let passed = 0;

for (const test of cases) {
  try {
    assert.equal(
      createsFreshState(test.state, test.today),
      test.expected
    );

    passed++;
    console.log(`PASS | ${test.name}`);
  } catch (error) {
    console.log(`FAIL | ${test.name}`);
    console.log(`  ${error.message.split("\n")[0]}`);
  }
}

console.log(`RESULT: ${passed}/${cases.length}`);
console.log(
  `STATUS: ${passed === cases.length ? "PASS" : "FAIL"}`
);

if (passed !== cases.length) {
  process.exitCode = 1;
}
