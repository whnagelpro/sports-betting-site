"use strict";

const {
  evaluateP36PipelineInitialization_
} = require("./pipeline-initialization-gate.cjs");

const {
  evaluateP36InitializationRecovery_
} = require("./pipeline-initialization-recovery.cjs");

const {
  loadP36SlateRegistry_,
  saveP36SlateRegistry_
} = require("./slate-storage.cjs");

const {
  transitionP36Slate_
} = require("./slate-registry.cjs");

const {
  validateP36RetentionBoundary_
} = require("./slate-retention.cjs");

const {
  loadP36Journal_,
  saveP36Journal_,
  clearP36Journal_
} = require("./initialization-journal.cjs");

function coordinateP36Initialization_(input,env) {

  const {
    league,
    slateDate,
    today,
    games,
    scheduleRows,
    snapshotVerified,
    scheduleVerified
  } = input;

  const {
    lock,
    properties,
    readCheckpoint,
    validateCheckpoint,
    createCheckpoint,
    writeCheckpoint,
    createRunId,
    getByteLength
  } = env;

  const result = (action,reason) => ({
    action,
    reason
  });

  if (!lock.tryLock(5000)) {
    return result("WAIT","SCRIPT_LOCK_UNAVAILABLE");
  }

  try {

    let stored = loadP36SlateRegistry_(
      league,properties
    );

    let registry = stored.registry;

    validateP36RetentionBoundary_(registry);

    let pending = loadP36Journal_(
      league,properties
    );

    let checkpoint = readCheckpoint();

    if (validateCheckpoint(checkpoint) !== true) {
      throw new Error("INVALID_CHECKPOINT");
    }

    function commitAssignment() {

      const journal = pending.journal;

      const transition = transitionP36Slate_(
        registry,
        journal.slateDate,
        "PROCESSING",
        {runId:journal.runId}
      );

      if (!transition.accepted) {
        throw new Error(transition.reason);
      }

      saveP36SlateRegistry_(
        league,
        properties,
        transition.registry,
        stored.raw,
        getByteLength
      );

      stored = loadP36SlateRegistry_(
        league,properties
      );

      registry = stored.registry;

    }

    function finishInitialization() {

      checkpoint = readCheckpoint();

      if (validateCheckpoint(checkpoint) !== true) {
        throw new Error("INVALID_CHECKPOINT");
      }

      registry = loadP36SlateRegistry_(
        league,properties
      ).registry;

      clearP36Journal_(
        league,
        properties,
        pending.raw,
        registry,
        checkpoint,
        lock
      );

      return result(
        "INITIALIZED",
        "INITIALIZATION_COMMITTED"
      );

    }

    if (pending.journal !== null) {

      const recovery =
        evaluateP36InitializationRecovery_({
          league,
          journal:pending.journal,
          registry,
          pipelineState:checkpoint,
          checkpointVerified:true,
          lockHeld:lock.hasLock()
        });

      if (recovery.action === "BLOCK") {
        return recovery;
      }

      if (recovery.action === "COMMIT_ASSIGNMENT") {

        commitAssignment();

        return finishInitialization();

      }

      if (recovery.action === "CLEAR_JOURNAL") {
        return finishInitialization();
      }

      if (pending.journal.slateDate !== slateDate) {

        return result(
          "WAIT",
          "PENDING_INITIALIZATION_REQUIRES_REFRESH"
        );

      }

    }

    const decision =
      evaluateP36PipelineInitialization_({
        registry,
        slateDate,
        today,
        pipelineState:checkpoint,
        games,
        scheduleRows,
        snapshotVerified,
        scheduleVerified,
        stateVerified:true
      });

    if (!decision.authorized) {
      return decision;
    }

    const journal = pending.journal || {

      version:1,
      league,
      slateDate,
      slateKey:decision.slateKey,
      runId:createRunId()

    };

    const fresh = {

      ...createCheckpoint(),

      p36RunId:journal.runId,
      p36SlateKey:journal.slateKey

    };

    if (
      validateCheckpoint(fresh) !== true ||
      fresh.completed !== false ||
      fresh.suspended === true ||
      fresh.stage !== (
        league === "NFL"
          ? "TEAM_GAME_LOGS_BY_TEAM"
          : "PLAYER_GAME_LOGS"
      )
    ) {

      throw new Error("INVALID_FRESH_CHECKPOINT");

    }

    const previousRaw = JSON.stringify(checkpoint);

    saveP36Journal_(
      league,
      properties,
      journal,
      lock
    );

    pending = loadP36Journal_(
      league,properties
    );

    if (
      JSON.stringify(readCheckpoint()) !==
      previousRaw
    ) {

      throw new Error(
        "CHECKPOINT_CONCURRENT_MODIFICATION"
      );

    }

    writeCheckpoint(fresh);

    checkpoint = readCheckpoint();

    if (
      validateCheckpoint(checkpoint) !== true ||
      checkpoint.p36RunId !== journal.runId ||
      checkpoint.p36SlateKey !== journal.slateKey ||
      checkpoint.completed !== false ||
      checkpoint.stage !== fresh.stage ||
      checkpoint.suspended === true
    ) {

      throw new Error(
        "CHECKPOINT_WRITE_VERIFICATION_FAILED"
      );

    }

    commitAssignment();

    return finishInitialization();

  } finally {

    lock.releaseLock();

  }

}

module.exports = {
  coordinateP36Initialization_
};
