
/**
 * SPORTACULAR P35 NBA D4B
 * Mocked staging persistence adapter.
 *
 * No Google services.
 * No production writes.
 */

function p35NBAMockStore_() {
  return {
    checkpointIndex: 0,
    stagedRows: [],
    ledger: [],
    fetchCount: 0,
    stageCount: 0
  };
}

function p35NBAMockExecuteTeam_(input) {
  const {
    store,
    runId,
    team,
    rows,
    failAt
  } = input;

  if (!store || !team || !Array.isArray(rows)) {
    throw new Error("P35 NBA: invalid mock execution input");
  }

  const teamIndex = store.checkpointIndex;

  const existing = store.ledger.find(entry =>
    entry.runId === runId &&
    entry.index === teamIndex
  );

  if (existing) {
    const staged = store.stagedRows.filter(row =>
      String(row[2]) === String(team.name)
    );

    const stagedFingerprint =
      staged.length
        ? p35NBAStageFingerprint_(staged)
        : null;

    const decision = p35NBAPlanRecovery_({
      runId,
      checkpointIndex: teamIndex,
      teamIndex,
      ledgerEntry: existing,
      stagedFingerprint,
      expectedFingerprint: existing.fingerprint
    });

    if (decision.action === "COMMIT_CHECKPOINT") {
      store.checkpointIndex = decision.nextIndex;
      existing.status = "CHECKPOINTED";

      return {
        action: "RECOVERED_CHECKPOINT",
        checkpointIndex: store.checkpointIndex
      };
    }

    if (decision.action !== "VERIFY_OR_RESTAGE") {
      throw new Error(
        "P35 NBA: unsupported recovery action " +
        decision.action
      );
    }
  }

  store.fetchCount++;

  if (failAt === "FETCH") {
    throw new Error("SIMULATED_FETCH_FAILURE");
  }

  const fingerprint = p35NBAStageFingerprint_(rows);

  const entry = existing || {
    runId,
    index: teamIndex,
    teamId: Number(team.id),
    team: team.name,
    fingerprint,
    rowCount: rows.length,
    status: "STAGING"
  };

  if (!existing) store.ledger.push(entry);

  if (failAt === "BEFORE_STAGE") {
    throw new Error("SIMULATED_PRE_STAGE_FAILURE");
  }

  store.stagedRows = store.stagedRows.filter(row =>
    String(row[2]) !== String(team.name)
  );

  store.stagedRows.push(
    ...JSON.parse(JSON.stringify(rows))
  );

  store.stageCount++;

  if (failAt === "AFTER_STAGE") {
    throw new Error("SIMULATED_POST_STAGE_FAILURE");
  }

  const staged = store.stagedRows.filter(row =>
    String(row[2]) === String(team.name)
  );

  const result = p35NBAPlanVerifiedCheckpoint_({
    runId,
    state: {
      stage: "TEAM_GAME_LOGS",
      teamRunId: runId,
      teamTeamIndex: teamIndex
    },
    team,
    rows,
    stagedRows: staged,
    ledger: store.ledger.filter(item => item !== entry)
  });

  entry.fingerprint = result.ledgerEntry.fingerprint;
  entry.rowCount = result.ledgerEntry.rowCount;
  entry.status = "STAGED_VERIFIED";

  if (failAt === "AFTER_VERIFY") {
    throw new Error("SIMULATED_POST_VERIFY_FAILURE");
  }

  store.checkpointIndex =
    result.nextState.teamTeamIndex;

  if (failAt === "AFTER_CHECKPOINT") {
    throw new Error("SIMULATED_POST_CHECKPOINT_FAILURE");
  }

  entry.status = "CHECKPOINTED";

  return {
    action: "TEAM_CHECKPOINTED",
    checkpointIndex: store.checkpointIndex
  };
}
