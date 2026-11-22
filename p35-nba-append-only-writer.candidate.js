
/**
 * SPORTACULAR P35 NBA D4B — STEP 9E.18
 * Append-only staging writer candidate.
 *
 * Caller must hold the NBA pipeline script lock.
 * Caller must establish a clean run-owned staging baseline.
 * No checkpoint updates.
 * No finalization.
 */

function p35NBAAppendTeamRows_(input) {
  if (!input || typeof input !== "object") {
    throw new Error("P35 NBA: writer input missing");
  }

  const {
    runId,
    teamIndex,
    team,
    rows,
    stagingSheet,
    ledger,
    lockHeld
  } = input;

  if (lockHeld !== true) {
    throw new Error("P35 NBA: pipeline lock required");
  }

  if (
    typeof runId !== "string" ||
    !/^[a-zA-Z0-9_-]{8,100}$/.test(runId)
  ) {
    throw new Error("P35 NBA: invalid run ID");
  }

  if (
    !Number.isInteger(teamIndex) ||
    teamIndex < 0 ||
    teamIndex >= 30
  ) {
    throw new Error("P35 NBA: invalid team index");
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
    !stagingSheet ||
    !Array.isArray(ledger) ||
    !Array.isArray(rows) ||
    rows.length === 0
  ) {
    throw new Error("P35 NBA: writer dependencies missing");
  }

  for (const entry of ledger) {
    if (entry.runId !== runId) {
      throw new Error("P35 NBA: stale ledger run");
    }

    if (
      entry.index === teamIndex ||
      entry.team === team.name
    ) {
      throw new Error("P35 NBA: duplicate ledger identity");
    }
  }

  p35ValidateNBATeamRows_(team.name, rows);

  const existing =
    stagingSheet.getDataRange().getValues();

  const headers = existing[0] || [];

  if (
    headers.length !== P35_NBA_TEAM_LOG_HEADERS_.length ||
    headers.some(
      (header, index) =>
        String(header).trim() !==
        P35_NBA_TEAM_LOG_HEADERS_[index]
    )
  ) {
    throw new Error("P35 NBA: staging headers mismatch");
  }

  const existingRows = existing.slice(1);

  const seen = new Set();

  for (const row of existingRows) {
    if (!Array.isArray(row) || row.length !== 10) {
      throw new Error("P35 NBA: invalid existing row");
    }

    const key =
      String(row[1]).trim() + "|" +
      String(row[2]).trim();

    if (seen.has(key)) {
      throw new Error("P35 NBA: duplicate existing key");
    }

    seen.add(key);
  }

  for (const row of rows) {
    const key =
      String(row[1]).trim() + "|" +
      String(row[2]).trim();

    if (seen.has(key)) {
      throw new Error("P35 NBA: duplicate staged key");
    }

    seen.add(key);
  }

  const startRow = existingRows.length + 2;

  stagingSheet
    .getRange(startRow, 1, rows.length, 10)
    .setValues(rows);

  SpreadsheetApp.flush();

  const readBack =
    stagingSheet
      .getRange(startRow, 1, rows.length, 10)
      .getValues();

  const expectedFingerprint =
    p35NBAStageFingerprint_(rows);

  const actualFingerprint =
    p35NBAStageFingerprint_(readBack);

  if (expectedFingerprint !== actualFingerprint) {
    throw new Error(
      "P35 NBA: staging read-back fingerprint mismatch"
    );
  }

  return {
    runId,
    teamIndex,
    teamId: Number(team.id),
    team: team.name,
    rowCount: rows.length,
    fingerprint: actualFingerprint,
    startRow,
    status: "STAGED_VERIFIED",
    checkpointAdvanced: false,
    productionPromotionApproved: false
  };
}
