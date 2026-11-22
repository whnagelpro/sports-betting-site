
/**
 * SPORTACULAR P35 NBA D4B
 * Post-checkpoint reconciliation.
 *
 * Pure logic. No Google services or production writes.
 *
 * A ledger can be reconciled only when its staged payload
 * independently matches its recorded SHA-256 fingerprint.
 */

function p35NBAReconcileCheckpoint_(input) {
  if (!input || typeof input !== "object") {
    throw new Error("P35 NBA: reconciliation input missing");
  }

  const {
    runId,
    checkpointIndex,
    teamIndex,
    teamId,
    teamName,
    ledgerEntry,
    stagedRows
  } = input;

  if (
    typeof runId !== "string" ||
    !/^[a-zA-Z0-9_-]{8,100}$/.test(runId)
  ) {
    throw new Error("P35 NBA: invalid run ID");
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

  if (
    !Number.isSafeInteger(Number(teamId)) ||
    Number(teamId) <= 0 ||
    typeof teamName !== "string" ||
    !teamName.trim()
  ) {
    throw new Error("P35 NBA: invalid team identity");
  }

  if (!ledgerEntry || typeof ledgerEntry !== "object") {
    throw new Error("P35 NBA: ledger entry missing");
  }

  if (
    ledgerEntry.runId !== runId ||
    ledgerEntry.index !== teamIndex ||
    Number(ledgerEntry.teamId) !== Number(teamId) ||
    ledgerEntry.team !== teamName
  ) {
    throw new Error("P35 NBA: ledger identity mismatch");
  }

  if (
    ledgerEntry.status !== "STAGED_VERIFIED" &&
    ledgerEntry.status !== "CHECKPOINTED"
  ) {
    throw new Error("P35 NBA: ledger is not verified");
  }

  if (
    !Array.isArray(stagedRows) ||
    stagedRows.length === 0 ||
    stagedRows.length !== ledgerEntry.rowCount
  ) {
    throw new Error("P35 NBA: staged row count mismatch");
  }

  for (const row of stagedRows) {
    if (
      !Array.isArray(row) ||
      row.length !== 10 ||
      String(row[2]).trim() !== teamName
    ) {
      throw new Error("P35 NBA: staged team row mismatch");
    }
  }

  const actualFingerprint =
    p35NBAStageFingerprint_(stagedRows);

  if (
    actualFingerprint !== ledgerEntry.fingerprint
  ) {
    throw new Error("P35 NBA: staged fingerprint mismatch");
  }

  if (checkpointIndex === teamIndex + 1) {
    return {
      action: ledgerEntry.status === "CHECKPOINTED"
        ? "ALREADY_RECONCILED"
        : "MARK_LEDGER_CHECKPOINTED",
      nextCheckpointIndex: checkpointIndex,
      nextLedgerEntry: {
        ...ledgerEntry,
        status: "CHECKPOINTED"
      },
      productionPromotionApproved: false
    };
  }

  if (
    checkpointIndex === teamIndex &&
    ledgerEntry.status === "STAGED_VERIFIED"
  ) {
    return {
      action: "COMMIT_VERIFIED_CHECKPOINT",
      nextCheckpointIndex: teamIndex + 1,
      nextLedgerEntry: {
        ...ledgerEntry,
        status: "STAGED_VERIFIED"
      },
      productionPromotionApproved: false
    };
  }

  throw new Error(
    "P35 NBA: checkpoint and ledger cannot be reconciled"
  );
}
