"use strict";

const {
  isValidP36Date_
} = require("./slate-date-engine.cjs");

const {
  reconcileP36SlateInventory_
} = require("./slate-inventory.cjs");

const supportedLeagues =
  ["NBA","NHL","MLB","NFL"];

const validStates =
  ["TRACKING","READY","PROCESSING","PROCESSED"];

function createP36SlateRegistry_(league) {

  if (!supportedLeagues.includes(league)) {
    throw new Error("INVALID_LEAGUE");
  }

  return {
    version: 1,
    league,
    slates: {}
  };

}

function validateP36SlateRegistry_(registry) {

  if (
    !registry ||
    typeof registry !== "object" ||
    Array.isArray(registry) ||
    registry.version !== 1 ||
    !supportedLeagues.includes(registry.league) ||
    !registry.slates ||
    typeof registry.slates !== "object" ||
    Array.isArray(registry.slates)
  ) {
    throw new Error("INVALID_REGISTRY");
  }

  let processingCount = 0;
  const runIds = new Set();

  for (const [key,slate] of Object.entries(registry.slates)) {

    if (
      !slate ||
      !isValidP36Date_(slate.slateDate) ||
      key !== `${registry.league}:${slate.slateDate}` ||
      slate.slateKey !== key ||
      !validStates.includes(slate.state) ||
      !slate.inventory
    ) {
      throw new Error("INVALID_SLATE_RECORD");
    }

    const inventoryCheck =
      reconcileP36SlateInventory_(
        registry.league,
        slate.slateDate,
        slate.inventory,
        slate.inventory.expectedGameIds
      );

    if (
      !inventoryCheck.accepted ||
      inventoryCheck.changed
    ) {
      throw new Error("INVALID_SLATE_INVENTORY");
    }

    if (
      slate.state === "PROCESSING" ||
      slate.state === "PROCESSED"
    ) {

      if (
        typeof slate.runId !== "string" ||
        !slate.runId.trim() ||
        runIds.has(slate.runId)
      ) {
        throw new Error("INVALID_SLATE_RUN_ID");
      }

      runIds.add(slate.runId);

    } else if (slate.runId !== null) {

      throw new Error("UNEXPECTED_SLATE_RUN_ID");

    }

    if (slate.state === "PROCESSING") {
      processingCount++;
    }

  }

  if (processingCount > 1) {
    throw new Error("MULTIPLE_PROCESSING_SLATES");
  }

  return true;

}

function observeP36Slate_(
  registry,
  slateDate,
  observedGameIds
) {

  validateP36SlateRegistry_(registry);

  const key =
    `${registry.league}:${slateDate}`;

  const previous =
    registry.slates[key] || null;

  const reconciliation =
    reconcileP36SlateInventory_(
      registry.league,
      slateDate,
      previous ? previous.inventory : null,
      observedGameIds
    );

  if (!reconciliation.accepted) {
    return {
      accepted: false,
      reason: reconciliation.reason,
      registry
    };
  }

  if (
    previous &&
    ["PROCESSING","PROCESSED"].includes(previous.state)
  ) {

    return {
      accepted: !reconciliation.changed,
      reason: reconciliation.changed
        ? "ASSIGNED_SLATE_INVENTORY_CHANGED"
        : "SLATE_ALREADY_ASSIGNED",
      registry
    };

  }

  const next =
    JSON.parse(JSON.stringify(registry));

  next.slates[key] = {
    slateKey: key,
    slateDate,
    inventory: reconciliation.inventory,
    state: "TRACKING",
    runId: null
  };

  validateP36SlateRegistry_(next);

  return {
    accepted: true,
    reason: reconciliation.reason,
    registry: next
  };

}

function transitionP36Slate_(
  registry,
  slateDate,
  targetState,
  evidence = {}
) {

  validateP36SlateRegistry_(registry);

  const reject = reason => ({
    accepted: false,
    reason,
    registry
  });

  const key =
    `${registry.league}:${slateDate}`;

  const slate =
    registry.slates[key];

  if (!slate) {
    return reject("SLATE_NOT_FOUND");
  }

  let runId = slate.runId;

  if (targetState === "READY") {

    if (slate.state !== "TRACKING") {
      return reject("INVALID_TRANSITION");
    }

    const evaluation = evidence.evaluation;

    if (
      !evaluation ||
      evaluation.league !== registry.league ||
      evaluation.slateDate !== slateDate ||
      evaluation.ready !== true ||
      evaluation.reason !== "SLATE_COMPLETE" ||
      evaluation.total !== slate.inventory.expectedGameIds.length ||
      evaluation.completed !== evaluation.total ||
      evaluation.scheduled !== 0 ||
      evaluation.inProgress !== 0 ||
      evaluation.disrupted !== 0 ||
      evaluation.unknown !== 0
    ) {
      return reject("SLATE_COMPLETION_NOT_VERIFIED");
    }

  } else if (targetState === "PROCESSING") {

    if (slate.state !== "READY") {
      return reject("INVALID_TRANSITION");
    }

    if (
      Object.values(registry.slates).some(
        item => item.state === "PROCESSING"
      )
    ) {
      return reject("ANOTHER_SLATE_PROCESSING");
    }

    if (
      typeof evidence.runId !== "string" ||
      !evidence.runId.trim() ||
      Object.values(registry.slates).some(
        item => item.runId === evidence.runId
      )
    ) {
      return reject("INVALID_RUN_ID");
    }

    runId = evidence.runId;

  } else if (targetState === "PROCESSED") {

    if (slate.state !== "PROCESSING") {
      return reject("INVALID_TRANSITION");
    }

    if (
      evidence.runId !== slate.runId ||
      evidence.completed !== true ||
      evidence.stage !== "COMPLETE"
    ) {
      return reject("PIPELINE_COMPLETION_NOT_VERIFIED");
    }

  } else {

    return reject("INVALID_TARGET_STATE");

  }

  const next =
    JSON.parse(JSON.stringify(registry));

  next.slates[key].state = targetState;
  next.slates[key].runId = runId;

  validateP36SlateRegistry_(next);

  return {
    accepted: true,
    reason: `SLATE_${targetState}`,
    registry: next
  };

}

function getP36PendingSlates_(registry) {

  validateP36SlateRegistry_(registry);

  return Object.values(registry.slates)
    .filter(slate =>
      slate.state === "TRACKING" ||
      slate.state === "READY"
    )
    .map(slate => slate.slateDate)
    .sort();

}

module.exports = {
  createP36SlateRegistry_,
  validateP36SlateRegistry_,
  observeP36Slate_,
  transitionP36Slate_,
  getP36PendingSlates_
};
