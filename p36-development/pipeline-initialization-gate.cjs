"use strict";

const {
  validateP36SlateRegistry_
} = require("./slate-registry.cjs");

const {
  validateP36RetentionBoundary_
} = require("./slate-retention.cjs");

const {
  isValidP36Date_
} = require("./slate-date-engine.cjs");

const {
  evaluateP36SlateCompletion_
} = require("./slate-completion-evaluator.cjs");

function evaluateP36PipelineInitialization_(input) {

  const result = {
    authorized: false,
    action: "WAIT",
    reason: null,
    slateKey: null,
    slateDate: null
  };

  const reject = (reason,action = "WAIT") => ({
    ...result,
    reason,
    action
  });

  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    return reject("INVALID_INPUT","BLOCK");
  }

  const {
    registry,
    slateDate,
    today,
    pipelineState,
    games,
    scheduleRows,
    snapshotVerified,
    scheduleVerified,
    stateVerified
  } = input;

  try {

    validateP36SlateRegistry_(registry);
    validateP36RetentionBoundary_(registry);

  } catch (error) {

    return reject("INVALID_REGISTRY","BLOCK");

  }

  if (
    !isValidP36Date_(today) ||
    !isValidP36Date_(slateDate) ||
    slateDate > today
  ) {
    return reject("INVALID_SLATE_CHRONOLOGY","BLOCK");
  }

  const key = `${registry.league}:${slateDate}`;

  result.slateKey = key;
  result.slateDate = slateDate;

  const slate = registry.slates[key];

  if (!slate) {
    return reject("SLATE_NOT_FOUND");
  }

  if (slate.state === "PROCESSED") {
    return reject("SLATE_ALREADY_PROCESSED","STOP");
  }

  if (stateVerified !== true) {
    return reject("PIPELINE_STATE_NOT_VERIFIED","BLOCK");
  }

  if (
    !pipelineState ||
    typeof pipelineState !== "object" ||
    Array.isArray(pipelineState) ||
    typeof pipelineState.completed !== "boolean" ||
    typeof pipelineState.stage !== "string" ||
    !pipelineState.stage.trim() ||
    (
      pipelineState.suspended !== undefined &&
      typeof pipelineState.suspended !== "boolean"
    ) ||
    pipelineState.completed !==
      (pipelineState.stage === "COMPLETE")
  ) {
    return reject("INVALID_PIPELINE_STATE","BLOCK");
  }

  if (pipelineState.suspended === true) {
    return reject("PIPELINE_SUSPENDED","BLOCK");
  }

  const assignedSlates =
    Object.values(registry.slates).filter(
      item => item.state === "PROCESSING"
    );

  if (assignedSlates.length > 0) {

    const assigned = assignedSlates[0];

    if (
      pipelineState.p36RunId !== assigned.runId ||
      pipelineState.p36SlateKey !== assigned.slateKey
    ) {
      return reject("PIPELINE_ASSIGNMENT_MISMATCH","BLOCK");
    }

    if (pipelineState.completed) {
      return reject(
        "ASSIGNED_PIPELINE_COMPLETED",
        "RECONCILE"
      );
    }

    return reject("PIPELINE_ALREADY_PROCESSING","RESUME");

  }

  if (!pipelineState.completed) {
    return reject("EXISTING_PIPELINE_UNFINISHED","QUEUE");
  }

  if (
    pipelineState.p36RunId != null ||
    pipelineState.p36SlateKey != null
  ) {

    const historical =
      registry.slates[pipelineState.p36SlateKey];

    if (
      !historical ||
      historical.state !== "PROCESSED" ||
      historical.runId !== pipelineState.p36RunId
    ) {
      return reject(
        "COMPLETED_ASSIGNMENT_NOT_RECONCILED",
        "BLOCK"
      );
    }

  }

  if (slate.state !== "READY") {
    return reject("SLATE_NOT_READY");
  }

  if (snapshotVerified !== true) {
    return reject("API_SNAPSHOT_NOT_VERIFIED","BLOCK");
  }

  if (scheduleVerified !== true) {
    return reject("SCHEDULE_NOT_VERIFIED","BLOCK");
  }

  const evaluation =
    evaluateP36SlateCompletion_(
      registry.league,
      slateDate,
      slate.inventory.expectedGameIds,
      games,
      scheduleRows
    );

  if (!evaluation.ready) {
    return reject(evaluation.reason,"WAIT");
  }

  return {
    ...result,
    authorized: true,
    action: "INITIALIZE",
    reason: "PROTECTED_INITIALIZATION_AUTHORIZED"
  };

}

module.exports = {
  evaluateP36PipelineInitialization_
};
