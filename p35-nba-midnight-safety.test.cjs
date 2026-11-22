"use strict";

const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const source = fs.readFileSync(
  "nba-appscript",
  "utf8"
);

function extractFunction(name, nextName) {
  const start = source.indexOf(
    `function ${name}()`
  );

  const end = source.indexOf(
    `function ${nextName}()`,
    start + 1
  );

  assert(
    start >= 0 && end > start,
    `Cannot isolate ${name}`
  );

  return source.slice(start, end);
}

const run = extractFunction(
  "runNBADailyAnalyticsPipeline",
  "resetNBADailyAnalyticsPipeline"
);

const reset = extractFunction(
  "resetNBADailyAnalyticsPipeline",
  "logNBADailyAnalyticsPipelineState"
);

const conditionMatch = run.match(
  /if\s*\(\s*(!state[\s\S]*?)\s*\)\s*\{\s*state\s*=\s*createNBADailyAnalyticsState_\(\)/
);

assert(
  conditionMatch,
  "Cannot extract pipeline initialization condition"
);

const initializationCondition =
  conditionMatch[1];

function shouldCreateFresh(state, today) {
  return vm.runInNewContext(
    initializationCondition,
    { state, today },
    { timeout: 1000 }
  );
}

const tests = [
  [
    "No state starts a fresh run",
    () => assert.equal(
      shouldCreateFresh(null, "2026-11-12"),
      true
    )
  ],
  [
    "Completed run starts a fresh run",
    () => assert.equal(
      shouldCreateFresh({
        runDate: "2026-11-11",
        completed: true
      }, "2026-11-12"),
      true
    )
  ],
  [
    "Unfinished same-day run resumes",
    () => assert.equal(
      shouldCreateFresh({
        runDate: "2026-11-12",
        completed: false
      }, "2026-11-12"),
      false
    )
  ],
  [
    "Unfinished previous-day run resumes",
    () => assert.equal(
      shouldCreateFresh({
        runDate: "2026-11-11",
        completed: false,
        stage: "TEAM_GAME_LOGS",
        teamTeamIndex: 17
      }, "2026-11-12"),
      false
    )
  ],
  [
    "Reset acquires script lock",
    () => assert.match(
      reset,
      /LockService\.getScriptLock\s*\(/
    )
  ],
  [
    "Reset reads existing pipeline state",
    () => assert.match(
      reset,
      /getNBADailyAnalyticsState_\s*\(/
    )
  ],
  [
    "Reset checks completion status",
    () => assert.match(
      reset,
      /(?:state|savedState)\.completed/
    )
  ],
  [
    "Reset retains continuation cleanup",
    () => assert.match(
      reset,
      /clearNBADailyAnalyticsContinuationTriggers_\s*\(/
    )
  ]
];

console.log(
  "=== P35 NBA — MIDNIGHT SAFETY REGRESSION HARNESS ==="
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
