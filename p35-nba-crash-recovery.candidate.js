
/**
 * SPORTACULAR P35 NBA D4B
 * Crash-recovery decision engine.
 *
 * Pure logic only.
 * No Google services.
 * No spreadsheet writes.
 */

function p35NBAPlanRecovery_(input) {
  if (!input || typeof input !== "object") {
    throw new Error("P35 NBA: recovery input missing");
  }

  const {
    runId,
    checkpointIndex,
    teamIndex,
    ledgerEntry,
    stagedFingerprint,
    expectedFingerprint
  } = input;

  if (
    typeof runId !== "string" ||
    !/^[a-zA-Z0-9_-]{8,100}$/.test(runId)
  ) {
    throw new Error("P35 NBA: invalid recovery run ID");
  }

  if (
    !Number.isInteger(checkpointIndex) ||
    checkpointIndex < 0 ||
    checkpointIndex > 30
  ) {
    throw new Error("P35 NBA: invalid checkpoint");
  }

  if (
    !Number.isInteger(teamIndex) ||
    teamIndex < 0 ||
    teamIndex >= 30
  ) {
    throw new Error("P35 NBA: invalid team index");
  }

  if (teamIndex < checkpointIndex) {
    return {
      action: "ALREADY_CHECKPOINTED",
      advance: false,
      productionPromotionApproved: false
    };
  }

  if (teamIndex > checkpointIndex) {
    throw new Error(
      "P35 NBA: out-of-order team recovery"
    );
  }

  if (!ledgerEntry) {
    return {
      action: "STAGE_TEAM",
      advance: false,
      productionPromotionApproved: false
    };
  }

  if (ledgerEntry.runId !== runId) {
    throw new Error("P35 NBA: stale ledger run");
  }

  if (ledgerEntry.index !== teamIndex) {
    throw new Error("P35 NBA: ledger index mismatch");
  }

  const status = ledgerEntry.status;

  if (status === "PENDING") {
    return {
      action: "STAGE_TEAM",
      advance: false,
      productionPromotionApproved: false
    };
  }

  if (status === "STAGING") {
    return {
      action: "VERIFY_OR_RESTAGE",
      advance: false,
      productionPromotionApproved: false
    };
  }

  if (status === "STAGED_VERIFIED") {
    if (
      typeof stagedFingerprint !== "string" ||
      typeof expectedFingerprint !== "string" ||
      !/^[a-f0-9]{64}$/.test(stagedFingerprint) ||
      !/^[a-f0-9]{64}$/.test(expectedFingerprint)
    ) {
      throw new Error(
        "P35 NBA: verified staging fingerprints missing"
      );
    }

    if (
      stagedFingerprint !== expectedFingerprint ||
      ledgerEntry.fingerprint !== stagedFingerprint
    ) {
      throw new Error(
        "P35 NBA: verified staging fingerprint mismatch"
      );
    }

    return {
      action: "COMMIT_CHECKPOINT",
      advance: true,
      nextIndex: checkpointIndex + 1,
      productionPromotionApproved: false
    };
  }

  if (status === "CHECKPOINTED") {
    throw new Error(
      "P35 NBA: ledger ahead of durable checkpoint"
    );
  }

  throw new Error(
    "P35 NBA: unknown recovery status " + status
  );
}
