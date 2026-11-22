"use strict";

const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const source = fs.readFileSync("nba-appscript", "utf8");

function extractFunctionStart(name) {
  const marker = `function ${name}() {`;
  const start = source.indexOf(marker);

  assert(start >= 0, `Missing function: ${name}`);

  return start;
}

const continuationStart =
  extractFunctionStart("continueNBADailyAnalyticsPipeline");

const continuationEnd = source.indexOf(
  "// ============================================================",
  continuationStart
);

assert(
  continuationEnd > continuationStart,
  "Cannot isolate continuation entry point"
);

const continuationSource = source.slice(
  continuationStart,
  continuationEnd
);

const pipelineStart =
  extractFunctionStart("runNBADailyAnalyticsPipeline");

const pipelineEnd = source.indexOf(
  "function resetNBADailyAnalyticsPipeline()",
  pipelineStart
);

assert(
  pipelineEnd > pipelineStart,
  "Cannot isolate mother pipeline"
);

const pipelineSource = source.slice(
  pipelineStart,
  pipelineEnd
);

function simulateLockContention(initialContinuationCount) {
  let cleanupCalls = 0;
  let retryCalls = 0;
  let stageCalls = 0;
  let lockAttempts = 0;

  let continuationCount = initialContinuationCount;

  const context = {
    Logger: {
      log() {}
    },

    LockService: {
      getScriptLock() {
        return {
          tryLock() {
            lockAttempts++;
            return false;
          },

          releaseLock() {}
        };
      }
    },

    clearNBADailyAnalyticsContinuationTriggers_() {
      cleanupCalls++;
      continuationCount = 0;
    },

    scheduleNBADailyAnalyticsRetry_() {
      retryCalls++;
      continuationCount++;
    },

    getNBADailyAnalyticsDateKey_() {
      return "2026-11-12";
    },

    getNBADailyAnalyticsState_() {
      return {
        runDate: "2026-11-12",
        stage: "PLAYER_GAME_LOGS",
        completed: false,
        playerTeamIndex: 12
      };
    },

    getNBADailyPlayerGameLogTeams_() {
      stageCalls++;
      throw new Error("STAGE_EXECUTED");
    }
  };

  vm.createContext(context);

  /*
   * The complete pipeline is parsed but execution exits
   * at the failed-lock branch before any stage runs.
   */
  vm.runInContext(
    pipelineSource,
    context,
    { timeout: 1000 }
  );

  vm.runInContext(
    continuationSource,
    context,
    { timeout: 1000 }
  );

  context.continueNBADailyAnalyticsPipeline();

  return {
    cleanupCalls,
    retryCalls,
    stageCalls,
    lockAttempts,
    continuationCount
  };
}

const tests = [
  [
    "Failed lock prevents stage execution",
    () => {
      const result = simulateLockContention(1);

      assert.equal(result.lockAttempts, 1);
      assert.equal(result.stageCalls, 0);
    }
  ],
  [
    "Failed lock does not clear continuation triggers",
    () => {
      const result = simulateLockContention(1);

      assert.equal(result.cleanupCalls, 0);
    }
  ],
  [
    "Failed lock preserves existing future continuation",
    () => {
      const result = simulateLockContention(1);

      assert.equal(result.continuationCount, 1);
    }
  ],
  [
    "Missing continuation is recovered after lock contention",
    () => {
      const result = simulateLockContention(0);

      assert(
        result.continuationCount >= 1,
        "No future continuation remains after lock contention"
      );
    }
  ]
];

console.log(
  "=== P35 NBA — LOCK RECOVERY RUNTIME REGRESSION ==="
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
