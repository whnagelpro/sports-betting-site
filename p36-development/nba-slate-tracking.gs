function trackP36NBASlateLocked_(
  slateDate,
  sheet,
  properties,
  lock
) {

  if (!lock || lock.hasLock() !== true) {
    throw new Error("P36_NBA_SCRIPT_LOCK_REQUIRED");
  }

  if (!isValidP36Date_(slateDate)) {
    throw new Error("P36_NBA_INVALID_SLATE_DATE");
  }

  const stored = loadP36SlateRegistry_(
    "NBA",
    properties
  );

  validateP36RetentionBoundary_(
    stored.registry
  );

  const snapshot =
    fetchP36VerifiedNBASlate_(slateDate);

  if (
    snapshot.snapshotVerified !== true ||
    snapshot.slateDate !== slateDate ||
    snapshot.league !== "NBA"
  ) {

    throw new Error("P36_NBA_UNVERIFIED_SNAPSHOT");

  }

  const games = snapshot.games;

  const observedIds = games.map(
    game => game.id
  );

  const observation =
    observeP36RetainedSlate_(
      stored.registry,
      slateDate,
      observedIds
    );

  if (!observation.accepted) {

    return {
      ready:false,
      reason:observation.reason,
      slateDate
    };

  }

  let registry = observation.registry;

  const slateKey = `NBA:${slateDate}`;

  const slate = registry.slates[slateKey];

  if (
    slate.state === "PROCESSING" ||
    slate.state === "PROCESSED"
  ) {

    return {
      ready:false,
      reason:"SLATE_ALREADY_ASSIGNED",
      slateDate
    };

  }

  // Persist the expected inventory before
  // trusting Schedule completion evidence.

  const inventoryWrite =
    saveP36SlateRegistry_(
      "NBA",
      properties,
      registry,
      stored.raw,
      value => Utilities.newBlob(value)
        .getBytes().length
    );

  const headers = sheet
    .getRange(1,1,1,10)
    .getDisplayValues()[0];

  const expectedHeaders = [
    "Game Id",
    "Game Date",
    "Away Team",
    "Home Team",
    "Status",
    "Season",
    "Postseason",
    "Start Time",
    "Home Team Id",
    "Away Team Id"
  ];

  if (
    JSON.stringify(headers) !==
    JSON.stringify(expectedHeaders)
  ) {

    return {
      ready:false,
      reason:"SCHEDULE_HEADER_MISMATCH",
      slateDate
    };

  }

  const lastRow = sheet.getLastRow();

  const values = lastRow > 1

    ? sheet
        .getRange(2,1,lastRow-1,5)
        .getDisplayValues()

    : [];

  const scheduleRows = [];

  for (const row of values) {

    if (!row.some(value => String(value).trim())) {
      continue;
    }

    const id = String(row[0]).trim();

    if (!/^[1-9]\d*$/.test(id)) {

      return {
        ready:false,
        reason:"INVALID_SCHEDULE_GAME_ID",
        slateDate
      };

    }

    scheduleRows.push({
      gameId:id,
      status:row[4]
    });

  }

  const evaluation =
    evaluateP36SlateCompletion_(
      "NBA",
      slateDate,
      slate.inventory.expectedGameIds,
      games,
      scheduleRows
    );

  if (!evaluation.ready) {
    return evaluation;
  }

  const transition =
    transitionP36Slate_(
      registry,
      slateDate,
      "READY",
      {evaluation}
    );

  if (!transition.accepted) {

    throw new Error(
      transition.reason
    );

  }

  saveP36SlateRegistry_(
    "NBA",
    properties,
    transition.registry,
    inventoryWrite.raw,
    value => Utilities.newBlob(value)
      .getBytes().length
  );

  return evaluation;

}
