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

const lockMatch = pipeline.match(
  /const lock\s*=\s*LockService\.getScriptLock\(\);[\s\S]*?if\s*\(!lock\.tryLock\(5000\)\)\s*\{([\s\S]*?)\n\s*\}/
);

assert(
  lockMatch,
  "Cannot extract NBA pipeline lock-contention branch"
);

const branch = lockMatch[1];

const tests = [
  [
    "Lock contention exits without stage processing",
    () => {
      assert.match(
        branch,
        /\breturn\s*;/
      );
    }
  ],
  [
    "Lock contention does not clear continuation triggers",
    () => {
      assert.doesNotMatch(
        branch,
        /clearNBADailyAnalyticsContinuationTriggers_/
      );
    }
  ],
  [
    "Lock contention does not schedule another retry",
    () => {
      assert.doesNotMatch(
        branch,
        /scheduleNBADailyAnalyticsRetry_/
      );
    }
  ],
  [
    "Lock contention does not modify staging",
    () => {
      assert.doesNotMatch(
        branch,
        /SpreadsheetApp|clearContent|deleteRows|appendRow/
      );
    }
  ]
];

console.log(
  "=== P35 NBA — LOCK CONTENTION BASELINE ==="
);

let passed = 0;

for (const [name, test] of tests) {
  try {
    test();
    passed++;
    console.log(`PASS | ${name}`);
  } catch (error) {
    console.log(`FAIL | ${name}`);
    console.log(`  ${error.message.split("\n")[0]}`);
  }
}

console.log(`RESULT: ${passed}/${tests.length}`);
console.log(
  `STATUS: ${passed === tests.length ? "PASS" : "FAIL"}`
);

if (passed !== tests.length) {
  process.exitCode = 1;
}
