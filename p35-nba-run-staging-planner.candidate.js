
/**
 * SPORTACULAR P35 NBA D4B
 * Run-specific staging and checkpoint planner.
 *
 * Pure JavaScript.
 * No Google services.
 * No spreadsheet writes.
 * No production promotion.
 */

function p35NBAStageFingerprint_(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("P35 NBA: fingerprint requires rows");
  }

  rows.forEach((row, index) => {
    if (!Array.isArray(row) || row.length !== 10) {
      throw new Error(
        "P35 NBA: invalid fingerprint row " + index
      );
    }
  });

  const canonical = JSON.stringify(rows);

  if (
    typeof Utilities !== "undefined" &&
    Utilities.computeDigest
  ) {
    const bytes = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      canonical,
      Utilities.Charset.UTF_8
    );

    return bytes.map(byte =>
      ("0" + (byte & 255).toString(16)).slice(-2)
    ).join("");
  }

  if (typeof require === "function") {
    return require("crypto")
      .createHash("sha256")
      .update(canonical)
      .digest("hex");
  }

  throw new Error("P35 NBA: SHA-256 unavailable");
}

function p35NBAPlanVerifiedCheckpoint_(input) {
  if (!input || typeof input !== "object") {
    throw new Error("P35 NBA: checkpoint input missing");
  }

  const {
    runId,
    state,
    team,
    rows,
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
    !state ||
    state.stage !== "TEAM_GAME_LOGS" ||
    state.teamRunId !== runId
  ) {
    throw new Error("P35 NBA: stale or mismatched run");
  }

  if (
    !Number.isInteger(state.teamTeamIndex) ||
    state.teamTeamIndex < 0 ||
    state.teamTeamIndex >= 30
  ) {
    throw new Error("P35 NBA: invalid checkpoint index");
  }

  if (
    !team ||
    !Number.isSafeInteger(Number(team.id)) ||
    Number(team.id) <= 0 ||
    typeof team.name !== "string" ||
    !team.name.trim()
  ) {
    throw new Error("P35 NBA: invalid team");
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("P35 NBA: incoming rows missing");
  }

  if (
    !Array.isArray(stagedRows) ||
    stagedRows.length !== rows.length
  ) {
    throw new Error("P35 NBA: staged row count mismatch");
  }

  const incomingFingerprint =
    p35NBAStageFingerprint_(rows);

  const stagedFingerprint =
    p35NBAStageFingerprint_(stagedRows);

  if (incomingFingerprint !== stagedFingerprint) {
    throw new Error("P35 NBA: staged fingerprint mismatch");
  }

  if (!Array.isArray(ledger)) {
    throw new Error("P35 NBA: ledger missing");
  }

  if (ledger.some(entry =>
    entry &&
    entry.runId === runId &&
    (
      Number(entry.teamId) === Number(team.id) ||
      entry.index === state.teamTeamIndex
    )
  )) {
    throw new Error("P35 NBA: duplicate team checkpoint");
  }

  const entry = {
    runId,
    index: state.teamTeamIndex,
    teamId: Number(team.id),
    team: team.name.trim(),
    rowCount: stagedRows.length,
    fingerprint: stagedFingerprint,
    status: "STAGED_VERIFIED"
  };

  return {
    approved: true,
    productionPromotionApproved: false,
    ledgerEntry: entry,
    nextState: {
      ...state,
      teamTeamIndex: state.teamTeamIndex + 1,
      lastSuccessfulStep:
        "TEAM_GAME_LOGS:" + team.name.trim(),
      lastError: null
    }
  };
}
