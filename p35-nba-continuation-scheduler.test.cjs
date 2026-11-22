"use strict";

const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const source = fs.readFileSync("nba-appscript", "utf8");

const start = source.indexOf(
  "function scheduleNBADailyAnalyticsRetry_()"
);

const end = source.indexOf(
  "function clearNBADailyAnalyticsContinuationTriggers_()",
  start
);

assert(
  start >= 0 && end > start,
  "Cannot isolate continuation scheduler"
);

const schedulerSource = source.slice(start, end);

function simulateScheduler(options = {}) {
  const continuationHandler =
    "continueNBADailyAnalyticsPipeline";

  const triggers = [
    {
      id: "permanent-run",
      handler: "runNBADailyAnalyticsPipeline"
    },
    {
      id: "permanent-reset",
      handler: "resetNBADailyAnalyticsPipeline"
    },
    {
      id: "existing-continuation",
      handler: continuationHandler
    }
  ];

  let nextId = 1;

  const ScriptApp = {
    getProjectTriggers() {
      return [...triggers].map(trigger => ({
        ...trigger,
        getHandlerFunction() {
          return this.handler;
        },
        getUniqueId() {
          return this.id;
        }
      }));
    },

    deleteTrigger(trigger) {
      const index = triggers.findIndex(
        item => item.id === trigger.id
      );

      if (index >= 0) {
        triggers.splice(index, 1);
      }
    },

    newTrigger(handler) {
      return {
        timeBased() {
          return this;
        },

        after() {
          return this;
        },

        create() {
          if (options.failCreation) {
            throw new Error(
              "SIMULATED_TRIGGER_CREATION_FAILURE"
            );
          }

          const trigger = {
            id: `new-continuation-${nextId++}`,
            handler
          };

          triggers.push(trigger);

          return {
            ...trigger,
            getHandlerFunction() {
              return this.handler;
            },
            getUniqueId() {
              return this.id;
            }
          };
        }
      };
    }
  };

  const context = {
    ScriptApp,
    NBA_DAILY_ANALYTICS_PIPELINE: {
      retryFunction: continuationHandler,
      retryDelayMs: 60000
    },
    Logger: {
      log() {}
    }
  };

  vm.runInNewContext(
    schedulerSource,
    context,
    { timeout: 1000 }
  );

  let error = null;

  try {
    context.scheduleNBADailyAnalyticsRetry_();
  } catch (caught) {
    error = caught;
  }

  return {
    triggers,
    error
  };
}

const tests = [
  [
    "Successful scheduling leaves one continuation",
    () => {
      const result = simulateScheduler();

      const continuations = result.triggers.filter(
        trigger =>
          trigger.handler ===
          "continueNBADailyAnalyticsPipeline"
      );

      assert.equal(result.error, null);
      assert.equal(continuations.length, 1);
    }
  ],
  [
    "Creation failure preserves existing continuation",
    () => {
      const result = simulateScheduler({
        failCreation: true
      });

      assert(result.error);

      assert(
        result.triggers.some(
          trigger =>
            trigger.id === "existing-continuation"
        )
      );
    }
  ],
  [
    "Successful scheduling replaces old continuation",
    () => {
      const result = simulateScheduler();

      assert(
        !result.triggers.some(
          trigger =>
            trigger.id === "existing-continuation"
        )
      );

      assert(
        result.triggers.some(
          trigger =>
            trigger.id.startsWith("new-continuation-")
        )
      );
    }
  ],
  [
    "Permanent triggers survive scheduling",
    () => {
      const result = simulateScheduler();

      assert(
        result.triggers.some(
          trigger => trigger.id === "permanent-run"
        )
      );

      assert(
        result.triggers.some(
          trigger => trigger.id === "permanent-reset"
        )
      );
    }
  ]
];

console.log(
  "=== P35 NBA — CONTINUATION SCHEDULER REGRESSION ==="
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
