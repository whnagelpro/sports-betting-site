"use strict";

const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const source = fs.readFileSync("nba-appscript", "utf8");

const start = source.indexOf(
  "function resetNBADailyAnalyticsPipeline()"
);

const end = source.indexOf(
  "function logNBADailyAnalyticsPipelineState()",
  start
);

assert(start >= 0 && end > start, "Cannot isolate reset function");

const resetSource = source.slice(start, end);

function executeReset(initialState, lockAvailable = true) {
  let state = initialState
    ? structuredClone(initialState)
    : null;

  let clearCount = 0;
  let triggerCleanupCount = 0;
  let lockAcquired = false;
  let lockReleased = false;

  const lock = {
    tryLock() {
      if (!lockAvailable) return false;
      lockAcquired = true;
      return true;
    },
    releaseLock() {
      lockReleased = true;
    }
  };

  const context = {
    Logger: {
      log() {}
    },

    LockService: {
      getScriptLock() {
        return lock;
      }
    },

    getNBADailyAnalyticsState_() {
      return state;
    },

    clearNBADailyAnalyticsState_() {
      clearCount++;
      state = null;
    },

    clearNBADailyAnalyticsContinuationTriggers_() {
      triggerCleanupCount++;
    }
  };

  vm.runInNewContext(resetSource, context, {
    timeout: 1000
  });

  context.resetNBADailyAnalyticsPipeline();

  return {
    state,
    clearCount,
    triggerCleanupCount,
    lockAcquired,
    lockReleased
  };
}

const tests = [
  [
    "Unfinished run survives midnight reset",
    () => {
      const original = {
        runDate: "2026-11-11",
        stage: "TEAM_GAME_LOGS",
        teamTeamIndex: 17,
        completed: false
      };

      const result = executeReset(original);

      assert.deepEqual(result.state, original);
      assert.equal(result.clearCount, 0);
      assert.equal(result.triggerCleanupCount, 0);
    }
  ],
  [
    "Completed run can be cleared safely",
    () => {
      const result = executeReset({
        runDate: "2026-11-11",
        stage: "COMPLETE",
        completed: true
      });

      assert.equal(result.state, null);
      assert.equal(result.clearCount, 1);
      assert.equal(result.triggerCleanupCount, 1);
    }
  ],
  [
    "Reset does not modify state when lock unavailable",
    () => {
      const original = {
        runDate: "2026-11-11",
        stage: "TEAM_GAME_LOGS",
        completed: false
      };

      const result = executeReset(original, false);

      assert.deepEqual(result.state, original);
      assert.equal(result.clearCount, 0);
      assert.equal(result.triggerCleanupCount, 0);
      assert.equal(result.lockAcquired, false);
    }
  ],
  [
    "Reset releases acquired lock",
    () => {
      const result = executeReset({
        completed: true,
        stage: "COMPLETE"
      });

      assert.equal(result.lockAcquired, true);
      assert.equal(result.lockReleased, true);
    }
  ]
];

console.log(
  "=== P35 NBA — RESET BEHAVIOR REGRESSION ==="
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
