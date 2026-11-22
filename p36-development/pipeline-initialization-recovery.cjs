"use strict";

const {
  isValidP36Date_
} = require("./slate-date-engine.cjs");

function evaluateP36InitializationRecovery_(input) {

  const result = (action,reason) => ({
    action,
    reason,
    authorized: action === "SAVE_CHECKPOINT" ||
                action === "COMMIT_ASSIGNMENT" ||
                action === "CLEAR_JOURNAL"
  });

  if (!input || typeof input !== "object") {
    return result("BLOCK","INVALID_INPUT");
  }

  const {
    league,
    journal,
    registry,
    pipelineState,
    checkpointVerified,
    lockHeld
  } = input;

  if (lockHeld !== true) {
    return result("BLOCK","SCRIPT_LOCK_REQUIRED");
  }

  if (!["NBA","NHL","MLB","NFL"].includes(league)) {
    return result("BLOCK","INVALID_LEAGUE");
  }

  if (journal === null) {
    return result("NO_ACTION","NO_PENDING_INITIALIZATION");
  }

  if (
    !journal ||
    journal.version !== 1 ||
    journal.league !== league ||
    !isValidP36Date_(journal.slateDate) ||
    journal.slateKey !== `${league}:${journal.slateDate}` ||
    typeof journal.runId !== "string" ||
    !journal.runId.trim()
  ) {
    return result("BLOCK","INVALID_JOURNAL");
  }

  if (
    !registry ||
    registry.league !== league ||
    !registry.slates
  ) {
    return result("BLOCK","INVALID_REGISTRY");
  }

  if (checkpointVerified !== true) {
    return result("BLOCK","CHECKPOINT_NOT_VERIFIED");
  }

  if (
    !pipelineState ||
    typeof pipelineState.completed !== "boolean" ||
    typeof pipelineState.stage !== "string" ||
    pipelineState.completed !==
      (pipelineState.stage === "COMPLETE")
  ) {
    return result("BLOCK","INVALID_CHECKPOINT");
  }

  if (pipelineState.suspended === true) {
    return result("BLOCK","PIPELINE_SUSPENDED");
  }

  const slate = registry.slates[journal.slateKey];

  if (!slate) {
    return result("BLOCK","JOURNAL_SLATE_NOT_FOUND");
  }

  const assigned = Object.values(registry.slates)
    .filter(item => item.state === "PROCESSING");

  if (
    assigned.some(item =>
      item.slateKey !== journal.slateKey ||
      item.runId !== journal.runId
    )
  ) {
    return result("BLOCK","CONFLICTING_SLATE_ASSIGNMENT");
  }

  const matchingCheckpoint =
    pipelineState.p36RunId === journal.runId &&
    pipelineState.p36SlateKey === journal.slateKey;

  const matchingAssignment =
    slate.state === "PROCESSING" &&
    slate.runId === journal.runId;

  if (matchingCheckpoint && matchingAssignment) {
    return result(
      "CLEAR_JOURNAL",
      "INITIALIZATION_ALREADY_COMMITTED"
    );
  }

  if (slate.state !== "READY") {
    return result("BLOCK","UNEXPECTED_SLATE_STATE");
  }

  if (matchingCheckpoint) {

    if (pipelineState.completed) {
      return result("BLOCK","UNEXPECTED_COMPLETED_CHECKPOINT");
    }

    return result(
      "COMMIT_ASSIGNMENT",
      "CHECKPOINT_ALREADY_SAVED"
    );

  }

  if (!pipelineState.completed) {
    return result("BLOCK","EXISTING_PIPELINE_UNFINISHED");
  }

  return result(
    "WAIT",
    "FRESH_INITIALIZATION_AUTHORIZATION_REQUIRED"
  );

}

module.exports = {
  evaluateP36InitializationRecovery_
};
