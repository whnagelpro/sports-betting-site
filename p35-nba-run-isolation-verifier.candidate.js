
/**
 * SPORTACULAR P35 NBA D4B
 * Run-isolated staging consistency verifier.
 *
 * Pure logic.
 * No Google services.
 * No writes.
 * No production promotion.
 */

function p35NBAVerifyRunStaging_(input) {
  if (!input || typeof input !== "object") {
    throw new Error("P35 NBA: verification input missing");
  }

  const { runId, teams, stagingRows, ledger } = input;

  if (
    typeof runId !== "string" ||
    !/^[a-zA-Z0-9_-]{8,100}$/.test(runId)
  ) {
    throw new Error("P35 NBA: invalid run ID");
  }

  if (
    !Array.isArray(teams) ||
    teams.length !== 30
  ) {
    throw new Error("P35 NBA: exactly 30 teams required");
  }

  if (
    !Array.isArray(stagingRows) ||
    !Array.isArray(ledger)
  ) {
    throw new Error("P35 NBA: staging or ledger missing");
  }

  const teamByName = new Map();
  const teamIds = new Set();

  teams.forEach(team => {
    if (
      !team ||
      !Number.isSafeInteger(Number(team.id)) ||
      Number(team.id) <= 0 ||
      typeof team.name !== "string" ||
      !team.name.trim()
    ) {
      throw new Error("P35 NBA: invalid team queue");
    }

    const name = team.name.trim();

    if (
      teamByName.has(name) ||
      teamIds.has(Number(team.id))
    ) {
      throw new Error("P35 NBA: duplicate team identity");
    }

    teamByName.set(name, Number(team.id));
    teamIds.add(Number(team.id));
  });

  const rowsByTeam = new Map();
  const seenGameTeam = new Set();

  stagingRows.forEach((row, index) => {
    if (!Array.isArray(row) || row.length !== 10) {
      throw new Error(
        "P35 NBA: invalid staged row width " + index
      );
    }

    const gameId = String(row[1]).trim();
    const teamName = String(row[2]).trim();

    if (!gameId || !teamByName.has(teamName)) {
      throw new Error(
        "P35 NBA: unknown staged team or game"
      );
    }

    const key = gameId + "|" + teamName;

    if (seenGameTeam.has(key)) {
      throw new Error(
        "P35 NBA: duplicate staged game/team"
      );
    }

    seenGameTeam.add(key);

    if (!rowsByTeam.has(teamName)) {
      rowsByTeam.set(teamName, []);
    }

    rowsByTeam.get(teamName).push(row);
  });

  const ledgerTeams = new Set();
  const ledgerIndexes = new Set();

  ledger.forEach(entry => {
    if (
      !entry ||
      entry.runId !== runId ||
      !Number.isInteger(entry.index) ||
      entry.index < 0 ||
      entry.index >= 30 ||
      entry.status !== "STAGED_VERIFIED" &&
      entry.status !== "CHECKPOINTED"
    ) {
      throw new Error(
        "P35 NBA: invalid or stale ledger entry"
      );
    }

    const team = teams[entry.index];

    if (
      !team ||
      entry.team !== team.name ||
      Number(entry.teamId) !== Number(team.id)
    ) {
      throw new Error(
        "P35 NBA: ledger team/index mismatch"
      );
    }

    if (
      ledgerTeams.has(entry.team) ||
      ledgerIndexes.has(entry.index)
    ) {
      throw new Error(
        "P35 NBA: duplicate ledger identity"
      );
    }

    ledgerTeams.add(entry.team);
    ledgerIndexes.add(entry.index);

    const rows = rowsByTeam.get(entry.team) || [];

    if (
      rows.length === 0 ||
      rows.length !== entry.rowCount
    ) {
      throw new Error(
        "P35 NBA: staged row count mismatch"
      );
    }

    const actual =
      p35NBAStageFingerprint_(rows);

    if (actual !== entry.fingerprint) {
      throw new Error(
        "P35 NBA: staged fingerprint mismatch"
      );
    }
  });

  for (const teamName of rowsByTeam.keys()) {
    if (!ledgerTeams.has(teamName)) {
      throw new Error(
        "P35 NBA: staged team has no ledger"
      );
    }
  }

  return {
    passed: true,
    runId,
    verifiedTeams: ledgerTeams.size,
    verifiedRows: stagingRows.length,
    productionPromotionApproved: false
  };
}
