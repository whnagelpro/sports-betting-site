
/**
 * SPORTACULAR P35 NBA D4B — STEP 9E.19
 *
 * Non-destructive partial-append recovery planner.
 *
 * Pure decision logic.
 * No spreadsheet access.
 * No writes.
 * No checkpoint advancement.
 */

function p35NBAPlanPartialAppendRecovery_(input) {
  if (!input || typeof input !== "object") {
    throw new Error("P35 NBA: recovery input missing");
  }

  const {
    runId,
    team,
    expectedRows,
    stagedRows,
    ledger
  } = input;

  if (
    typeof runId !== "string" ||
    !/^[a-zA-Z0-9_-]{8,100}$/.test(runId)
  ) {
    throw new Error("P35 NBA: invalid run ID");
  }

  if (
    !team ||
    typeof team.name !== "string" ||
    !team.name.trim() ||
    !Number.isSafeInteger(Number(team.id)) ||
    Number(team.id) <= 0
  ) {
    throw new Error("P35 NBA: invalid team");
  }

  if (
    !Array.isArray(expectedRows) ||
    expectedRows.length === 0 ||
    !Array.isArray(stagedRows) ||
    !Array.isArray(ledger)
  ) {
    throw new Error("P35 NBA: invalid recovery rows or ledger");
  }

  const teamName = team.name.trim();

  const expectedKeys = new Set();

  for (const row of expectedRows) {
    if (
      !Array.isArray(row) ||
      row.length !== 10 ||
      String(row[2]).trim() !== teamName
    ) {
      throw new Error("P35 NBA: invalid expected team row");
    }

    const key =
      String(row[1]).trim() + "|" + teamName;

    if (!String(row[1]).trim() || expectedKeys.has(key)) {
      throw new Error("P35 NBA: duplicate expected key");
    }

    expectedKeys.add(key);
  }

  for (const entry of ledger) {
    if (entry.runId !== runId) {
      throw new Error("P35 NBA: stale ledger run");
    }
  }

  const matchingRows = stagedRows.filter(row =>
    Array.isArray(row) &&
    String(row[2]).trim() === teamName
  );

  const expectedFingerprint =
    p35NBAStageFingerprint_(expectedRows);

  const verifiedEntry = ledger.find(entry =>
    entry.team === teamName &&
    (
      entry.status === "STAGED_VERIFIED" ||
      entry.status === "CHECKPOINTED"
    )
  );

  if (matchingRows.length === 0) {
    if (verifiedEntry) {
      throw new Error(
        "P35 NBA: verified ledger exists without staged rows"
      );
    }

    return {
      action: "APPEND_NEW",
      expectedFingerprint,
      existingRows: 0,
      checkpointAdvanced: false,
      productionPromotionApproved: false
    };
  }

  const seen = new Set();

  for (const row of matchingRows) {
    if (row.length !== 10) {
      return {
        action: "STOP_REQUIRES_REPAIR",
        reason: "INVALID_ROW_WIDTH",
        checkpointAdvanced: false,
        productionPromotionApproved: false
      };
    }

    const key =
      String(row[1]).trim() + "|" + teamName;

    if (seen.has(key)) {
      return {
        action: "STOP_REQUIRES_REPAIR",
        reason: "DUPLICATE_GAME_TEAM",
        checkpointAdvanced: false,
        productionPromotionApproved: false
      };
    }

    seen.add(key);
  }

  if (matchingRows.length !== expectedRows.length) {
    return {
      action: "STOP_REQUIRES_REPAIR",
      reason: "PARTIAL_APPEND",
      checkpointAdvanced: false,
      productionPromotionApproved: false
    };
  }

  const actualFingerprint =
    p35NBAStageFingerprint_(matchingRows);

  if (actualFingerprint !== expectedFingerprint) {
    return {
      action: "STOP_REQUIRES_REPAIR",
      reason: "FINGERPRINT_MISMATCH",
      checkpointAdvanced: false,
      productionPromotionApproved: false
    };
  }

  if (
    verifiedEntry &&
    verifiedEntry.fingerprint !== actualFingerprint
  ) {
    return {
      action: "STOP_REQUIRES_REPAIR",
      reason: "LEDGER_FINGERPRINT_MISMATCH",
      checkpointAdvanced: false,
      productionPromotionApproved: false
    };
  }

  return {
    action: "ALREADY_STAGED",
    expectedFingerprint,
    existingRows: matchingRows.length,
    checkpointAdvanced: false,
    productionPromotionApproved: false
  };
}
