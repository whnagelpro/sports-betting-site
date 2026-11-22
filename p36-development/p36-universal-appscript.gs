// P36 UNIVERSAL GAME COMPLETION ENGINE

// Generated automatically. Do not edit manually.



// ===== game-status-normalizer.cjs =====

function normalizeP36GameStatus_(league, game) {

  const supportedLeagues = ["NBA", "NHL", "MLB", "NFL"];

  if (!supportedLeagues.includes(league)) {
    return "UNKNOWN";
  }

  if (
    !game ||
    typeof game !== "object" ||
    Array.isArray(game)
  ) {
    return "UNKNOWN";
  }

  const normalize = value =>
    typeof value === "string"
      ? value.trim().toLowerCase()
      : "";

  const primary = normalize(game.status_state);

  const secondary = [
    game.status,
    game.game_state,
    game.state,
    game.detailed_state
  ].map(normalize).filter(Boolean);

  const disruptedPattern =
    /postpon|cancel|suspend|abandon|delay/;

  if (
    game.postponed === true ||
    game.cancelled === true ||
    game.canceled === true ||
    game.suspended === true ||
    [primary, ...secondary].some(
      value => disruptedPattern.test(value)
    )
  ) {
    return "DISRUPTED";
  }

  const finalValues = {
    NBA: ["final"],
    NHL: ["final", "off"],
    MLB: ["final", "status_final"],
    NFL: ["final"]
  };

  const isFinal = value =>
    finalValues[league].includes(value) ||
    (league === "NBA" && /^final\/(?:\d+)?ot$/.test(value));

  const isScheduled = value =>
    [
      "scheduled",
      "status_scheduled",
      "fut",
      "pre"
    ].includes(value) ||
    /^\d{4}-\d{2}-\d{2}T/.test(value) ||
    /^\d{1,2}\/\d{1,2}\s*-\s*/.test(value);

  const isInProgress = value =>
    [
      "in_progress",
      "status_in_progress",
      "live",
      "crit",
      "halftime"
    ].includes(value) ||
    /^\d{1,2}:\d{2}\s*-\s*/.test(value);

  if (primary === "final") {

    if (
      secondary.length === 0 ||
      !secondary.every(isFinal)
    ) {
      return "UNKNOWN";
    }

    return "COMPLETED";

  }

  if (primary === "scheduled") {

    if (secondary.some(
      value => isFinal(value) || isInProgress(value)
    )) {
      return "UNKNOWN";
    }

    return "SCHEDULED";

  }

  if (primary === "in_progress") {

    if (secondary.some(
      value => isFinal(value) || isScheduled(value)
    )) {
      return "UNKNOWN";
    }

    return "IN_PROGRESS";

  }

  return "UNKNOWN";

}

// ===== schedule-status-display.cjs =====

function getP36ScheduleStatus_(league, game) {

  const classification =
    normalizeP36GameStatus_(league, game);

  const rawStatus =
    typeof game?.status === "string"
      ? game.status.trim()
      : "";

  switch (classification) {

    case "COMPLETED":
      return "Final";

    case "SCHEDULED":
      return rawStatus || "Scheduled";

    case "IN_PROGRESS":
      return rawStatus || "In Progress";

    case "DISRUPTED":
      return "Disrupted";

    default:
      return "Unknown";

  }

}

// ===== slate-date-engine.cjs =====

function isValidP36Date_(value) {

  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0,10) === value
  );

}

function getP36GameSlateDate_(
  league,
  game,
  formatArizonaDate
) {

  if (
    !["NBA","NHL","MLB","NFL"].includes(league) ||
    !game ||
    typeof game !== "object" ||
    Array.isArray(game) ||
    typeof formatArizonaDate !== "function"
  ) {
    return null;
  }

  // Preserve the official date-only fields
  // supplied by NBA and NHL.

  if (league === "NBA" || league === "NHL") {

    const officialDate =
      league === "NBA"
        ? game.date
        : game.game_date;

    if (isValidP36Date_(officialDate)) {
      return officialDate;
    }

  }

  const candidates = {

    NBA: [
      game.datetime,
      game.date
    ],

    NHL: [
      game.start_time_utc,
      game.game_date
    ],

    MLB: [
      game.date,
      game.game_date
    ],

    NFL: [
      game.date
    ]

  }[league];

  const rawDate = candidates.find(
    value =>
      typeof value === "string" &&
      value.trim() !== ""
  );

  if (!rawDate) {
    return null;
  }

  // Never interpret an ambiguous timestamp
  // using the computer's local timezone.

  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      rawDate
    ) ||
    !isValidP36Date_(rawDate.slice(0,10))
  ) {
    return null;
  }

  const timestamp = new Date(rawDate);

  if (!Number.isFinite(timestamp.getTime())) {
    return null;
  }

  try {

    const slateDate =
      formatArizonaDate(timestamp);

    return isValidP36Date_(slateDate)
      ? slateDate
      : null;

  } catch (error) {

    return null;

  }

}

function groupP36GamesBySlate_(
  league,
  games,
  formatArizonaDate
) {

  const reject = reason => ({
    accepted: false,
    reason,
    slates: {}
  });

  if (!["NBA","NHL","MLB","NFL"].includes(league)) {
    return reject("INVALID_LEAGUE");
  }

  if (!Array.isArray(games)) {
    return reject("INVALID_GAME_RESPONSE");
  }

  const gameIds = new Set();
  const slates = {};

  for (const game of games) {

    if (
      !game ||
      typeof game !== "object" ||
      Array.isArray(game)
    ) {
      return reject("INVALID_GAME");
    }

    const id =
      typeof game.id === "string" ||
      Number.isSafeInteger(game.id)
        ? String(game.id).trim()
        : "";

    if (!/^[1-9]\d*$/.test(id)) {
      return reject("INVALID_GAME_ID");
    }

    if (gameIds.has(id)) {
      return reject("DUPLICATE_GAME_ID");
    }

    gameIds.add(id);

    const slateDate =
      getP36GameSlateDate_(
        league,
        game,
        formatArizonaDate
      );

    if (!slateDate) {
      return reject("INVALID_GAME_SLATE_DATE");
    }

    if (!slates[slateDate]) {
      slates[slateDate] = [];
    }

    slates[slateDate].push(game);

  }

  return {
    accepted: true,
    reason:
      games.length === 0
        ? "EMPTY_RESPONSE"
        : "SLATES_GROUPED",
    slates
  };

}

// ===== slate-inventory.cjs =====

function reconcileP36SlateInventory_(
  league,
  slateDate,
  previousInventory,
  observedGameIds
) {

  const result = {
    accepted: false,
    changed: false,
    reason: null,
    inventory: null,
    addedGameIds: [],
    missingGameIds: []
  };

  const reject = reason => {
    result.reason = reason;
    return result;
  };

  const validDate = value =>
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0,10) === value;

  const normalizeId = value =>
    typeof value === "string" ||
    Number.isSafeInteger(value)
      ? String(value).trim()
      : "";

  const validId = value =>
    /^[1-9]\d*$/.test(value);

  const sortIds = ids =>
    [...ids].sort(
      (a,b) =>
        a.length - b.length ||
        a.localeCompare(b)
    );

  if (!["NBA","NHL","MLB","NFL"].includes(league)) {
    return reject("INVALID_LEAGUE");
  }

  if (!validDate(slateDate)) {
    return reject("INVALID_SLATE_DATE");
  }

  if (!Array.isArray(observedGameIds)) {
    return reject("INVALID_OBSERVED_INVENTORY");
  }

  const observedIds =
    observedGameIds.map(normalizeId);

  if (observedIds.some(id => !validId(id))) {
    return reject("INVALID_OBSERVED_GAME_ID");
  }

  if (
    new Set(observedIds).size !== observedIds.length
  ) {
    return reject("DUPLICATE_OBSERVED_GAME_ID");
  }

  const slateKey =
    `${league}:${slateDate}`;

  if (previousInventory === null) {

    if (observedIds.length === 0) {
      return reject("EMPTY_SLATE");
    }

    result.accepted = true;
    result.changed = true;
    result.reason = "INVENTORY_INITIALIZED";

    result.inventory = {
      version: 1,
      league,
      slateDate,
      slateKey,
      expectedGameIds: sortIds(observedIds)
    };

    result.addedGameIds = sortIds(observedIds);

    return result;

  }

  if (
    !previousInventory ||
    typeof previousInventory !== "object" ||
    Array.isArray(previousInventory) ||
    previousInventory.version !== 1 ||
    previousInventory.league !== league ||
    previousInventory.slateDate !== slateDate ||
    previousInventory.slateKey !== slateKey ||
    !Array.isArray(previousInventory.expectedGameIds)
  ) {
    return reject("INVALID_PREVIOUS_INVENTORY");
  }

  const previousIds =
    previousInventory.expectedGameIds;

  if (
    previousIds.length === 0 ||
    previousIds.some(
      id => typeof id !== "string" || !validId(id)
    ) ||
    new Set(previousIds).size !== previousIds.length
  ) {
    return reject("INVALID_PREVIOUS_GAME_IDS");
  }

  const previousSet = new Set(previousIds);
  const observedSet = new Set(observedIds);

  result.missingGameIds = sortIds(
    previousIds.filter(id => !observedSet.has(id))
  );

  result.addedGameIds = sortIds(
    observedIds.filter(id => !previousSet.has(id))
  );

  if (result.missingGameIds.length > 0) {
    return reject("MISSING_EXPECTED_GAMES");
  }

  result.accepted = true;
  result.changed = result.addedGameIds.length > 0;

  result.reason = result.changed
    ? "INVENTORY_EXPANDED"
    : "INVENTORY_UNCHANGED";

  result.inventory = {
    version: 1,
    league,
    slateDate,
    slateKey,
    expectedGameIds: sortIds(observedIds)
  };

  return result;

}

// ===== slate-completion-evaluator.cjs =====

function evaluateP36SlateCompletion_(
  league,
  slateDate,
  expectedGameIds,
  games,
  scheduleRows
) {

  const supportedLeagues =
    ["NBA", "NHL", "MLB", "NFL"];

  const result = {
    league,
    slateDate,
    total: 0,
    completed: 0,
    scheduled: 0,
    inProgress: 0,
    disrupted: 0,
    unknown: 0,
    ready: false,
    reason: null
  };

  const reject = reason => {
    result.reason = reason;
    return result;
  };

  const validDate = value =>
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;

  const normalizeId = value =>
    typeof value === "string" ||
    Number.isSafeInteger(value)
      ? String(value).trim()
      : "";

  const validId = value =>
    /^[1-9]\d*$/.test(value);

  if (!supportedLeagues.includes(league)) {
    return reject("INVALID_LEAGUE");
  }

  if (!validDate(slateDate)) {
    return reject("INVALID_SLATE_DATE");
  }

  if (
    !Array.isArray(expectedGameIds) ||
    !Array.isArray(games) ||
    !Array.isArray(scheduleRows)
  ) {
    return reject("INVALID_INPUT");
  }

  const expectedIds =
    expectedGameIds.map(normalizeId);

  result.total = expectedIds.length;

  if (expectedIds.some(id => !validId(id))) {
    return reject("INVALID_EXPECTED_GAME_ID");
  }

  if (
    new Set(expectedIds).size !== expectedIds.length
  ) {
    return reject("DUPLICATE_EXPECTED_GAME_ID");
  }

  if (expectedIds.length === 0) {

    if (
      games.length !== 0 ||
      scheduleRows.length !== 0
    ) {
      return reject("UNEXPECTED_GAME_INVENTORY");
    }

    return reject("EMPTY_SLATE");

  }

  const expectedSet =
    new Set(expectedIds);

  const gameMap = new Map();

  for (const game of games) {

    if (
      !game ||
      typeof game !== "object" ||
      Array.isArray(game)
    ) {
      return reject("INVALID_GAME");
    }

    const id = normalizeId(game.id);

    if (!validId(id)) {
      return reject("INVALID_GAME_ID");
    }

    if (gameMap.has(id)) {
      return reject("DUPLICATE_GAME_ID");
    }

    if (!expectedSet.has(id)) {
      return reject("UNEXPECTED_GAME_ID");
    }

    gameMap.set(id, game);

  }

  if (gameMap.size !== expectedSet.size) {
    return reject("INCOMPLETE_GAME_INVENTORY");
  }

  const scheduleMap = new Map();

  for (const row of scheduleRows) {

    if (
      !row ||
      typeof row !== "object" ||
      Array.isArray(row)
    ) {
      return reject("INVALID_SCHEDULE_ROW");
    }

    const id = normalizeId(row.gameId);

    if (!validId(id)) {
      return reject("INVALID_SCHEDULE_GAME_ID");
    }

    if (scheduleMap.has(id)) {
      return reject("DUPLICATE_SCHEDULE_GAME_ID");
    }

    if (!expectedSet.has(id)) {
      return reject("UNEXPECTED_SCHEDULE_GAME_ID");
    }

    scheduleMap.set(id, row.status);

  }

  if (scheduleMap.size !== expectedSet.size) {
    return reject("INCOMPLETE_SCHEDULE_INVENTORY");
  }

  let statusMismatch = false;

  for (const id of expectedIds) {

    const classification =
      normalizeP36GameStatus_(
        league,
        gameMap.get(id)
      );

    const displayedStatus =
      scheduleMap.get(id);

    const displayedFinal =
      typeof displayedStatus === "string" &&
      displayedStatus.trim() === "Final";

    switch (classification) {

      case "COMPLETED":
        result.completed++;
        break;

      case "SCHEDULED":
        result.scheduled++;
        break;

      case "IN_PROGRESS":
        result.inProgress++;
        break;

      case "DISRUPTED":
        result.disrupted++;
        break;

      default:
        result.unknown++;
        break;

    }

    if (
      displayedFinal !==
      (classification === "COMPLETED")
    ) {
      statusMismatch = true;
    }

  }

  if (statusMismatch) {
    return reject("SCHEDULE_STATUS_MISMATCH");
  }

  if (result.disrupted > 0) {
    return reject("DISRUPTED_GAMES");
  }

  if (result.unknown > 0) {
    return reject("UNKNOWN_GAME_STATUSES");
  }

  if (result.completed !== result.total) {
    return reject("SLATE_INCOMPLETE");
  }

  result.ready = true;
  result.reason = "SLATE_COMPLETE";

  return result;

}

// ===== slate-registry.cjs =====

const supportedLeagues =
  ["NBA","NHL","MLB","NFL"];

const validStates =
  ["TRACKING","READY","PROCESSING","PROCESSED"];

function createP36SlateRegistry_(league) {

  if (!supportedLeagues.includes(league)) {
    throw new Error("INVALID_LEAGUE");
  }

  return {
    version: 1,
    league,
    slates: {}
  };

}

function validateP36SlateRegistry_(registry) {

  if (
    !registry ||
    typeof registry !== "object" ||
    Array.isArray(registry) ||
    registry.version !== 1 ||
    !supportedLeagues.includes(registry.league) ||
    !registry.slates ||
    typeof registry.slates !== "object" ||
    Array.isArray(registry.slates)
  ) {
    throw new Error("INVALID_REGISTRY");
  }

  let processingCount = 0;
  const runIds = new Set();

  for (const [key,slate] of Object.entries(registry.slates)) {

    if (
      !slate ||
      !isValidP36Date_(slate.slateDate) ||
      key !== `${registry.league}:${slate.slateDate}` ||
      slate.slateKey !== key ||
      !validStates.includes(slate.state) ||
      !slate.inventory
    ) {
      throw new Error("INVALID_SLATE_RECORD");
    }

    const inventoryCheck =
      reconcileP36SlateInventory_(
        registry.league,
        slate.slateDate,
        slate.inventory,
        slate.inventory.expectedGameIds
      );

    if (
      !inventoryCheck.accepted ||
      inventoryCheck.changed
    ) {
      throw new Error("INVALID_SLATE_INVENTORY");
    }

    if (
      slate.state === "PROCESSING" ||
      slate.state === "PROCESSED"
    ) {

      if (
        typeof slate.runId !== "string" ||
        !slate.runId.trim() ||
        runIds.has(slate.runId)
      ) {
        throw new Error("INVALID_SLATE_RUN_ID");
      }

      runIds.add(slate.runId);

    } else if (slate.runId !== null) {

      throw new Error("UNEXPECTED_SLATE_RUN_ID");

    }

    if (slate.state === "PROCESSING") {
      processingCount++;
    }

  }

  if (processingCount > 1) {
    throw new Error("MULTIPLE_PROCESSING_SLATES");
  }

  return true;

}

function observeP36Slate_(
  registry,
  slateDate,
  observedGameIds
) {

  validateP36SlateRegistry_(registry);

  const key =
    `${registry.league}:${slateDate}`;

  const previous =
    registry.slates[key] || null;

  const reconciliation =
    reconcileP36SlateInventory_(
      registry.league,
      slateDate,
      previous ? previous.inventory : null,
      observedGameIds
    );

  if (!reconciliation.accepted) {
    return {
      accepted: false,
      reason: reconciliation.reason,
      registry
    };
  }

  if (
    previous &&
    ["PROCESSING","PROCESSED"].includes(previous.state)
  ) {

    return {
      accepted: !reconciliation.changed,
      reason: reconciliation.changed
        ? "ASSIGNED_SLATE_INVENTORY_CHANGED"
        : "SLATE_ALREADY_ASSIGNED",
      registry
    };

  }

  const next =
    JSON.parse(JSON.stringify(registry));

  next.slates[key] = {
    slateKey: key,
    slateDate,
    inventory: reconciliation.inventory,
    state: "TRACKING",
    runId: null
  };

  validateP36SlateRegistry_(next);

  return {
    accepted: true,
    reason: reconciliation.reason,
    registry: next
  };

}

function transitionP36Slate_(
  registry,
  slateDate,
  targetState,
  evidence = {}
) {

  validateP36SlateRegistry_(registry);

  const reject = reason => ({
    accepted: false,
    reason,
    registry
  });

  const key =
    `${registry.league}:${slateDate}`;

  const slate =
    registry.slates[key];

  if (!slate) {
    return reject("SLATE_NOT_FOUND");
  }

  let runId = slate.runId;

  if (targetState === "READY") {

    if (slate.state !== "TRACKING") {
      return reject("INVALID_TRANSITION");
    }

    const evaluation = evidence.evaluation;

    if (
      !evaluation ||
      evaluation.league !== registry.league ||
      evaluation.slateDate !== slateDate ||
      evaluation.ready !== true ||
      evaluation.reason !== "SLATE_COMPLETE" ||
      evaluation.total !== slate.inventory.expectedGameIds.length ||
      evaluation.completed !== evaluation.total ||
      evaluation.scheduled !== 0 ||
      evaluation.inProgress !== 0 ||
      evaluation.disrupted !== 0 ||
      evaluation.unknown !== 0
    ) {
      return reject("SLATE_COMPLETION_NOT_VERIFIED");
    }

  } else if (targetState === "PROCESSING") {

    if (slate.state !== "READY") {
      return reject("INVALID_TRANSITION");
    }

    if (
      Object.values(registry.slates).some(
        item => item.state === "PROCESSING"
      )
    ) {
      return reject("ANOTHER_SLATE_PROCESSING");
    }

    if (
      typeof evidence.runId !== "string" ||
      !evidence.runId.trim() ||
      Object.values(registry.slates).some(
        item => item.runId === evidence.runId
      )
    ) {
      return reject("INVALID_RUN_ID");
    }

    runId = evidence.runId;

  } else if (targetState === "PROCESSED") {

    if (slate.state !== "PROCESSING") {
      return reject("INVALID_TRANSITION");
    }

    if (
      evidence.runId !== slate.runId ||
      evidence.completed !== true ||
      evidence.stage !== "COMPLETE"
    ) {
      return reject("PIPELINE_COMPLETION_NOT_VERIFIED");
    }

  } else {

    return reject("INVALID_TARGET_STATE");

  }

  const next =
    JSON.parse(JSON.stringify(registry));

  next.slates[key].state = targetState;
  next.slates[key].runId = runId;

  validateP36SlateRegistry_(next);

  return {
    accepted: true,
    reason: `SLATE_${targetState}`,
    registry: next
  };

}

function getP36PendingSlates_(registry) {

  validateP36SlateRegistry_(registry);

  return Object.values(registry.slates)
    .filter(slate =>
      slate.state === "TRACKING" ||
      slate.state === "READY"
    )
    .map(slate => slate.slateDate)
    .sort();

}

// ===== slate-storage.cjs =====

function getP36RegistryPropertyKey_(league) {

  if (!["NBA","NHL","MLB","NFL"].includes(league)) {
    throw new Error("INVALID_LEAGUE");
  }

  return `P36_${league}_SLATE_REGISTRY_V1`;

}

function validateP36StorageRegistry_(league, registry) {

  validateP36SlateRegistry_(registry);

  if (registry.league !== league) {
    throw new Error("REGISTRY_LEAGUE_MISMATCH");
  }

  return true;

}

function loadP36SlateRegistry_(league, properties) {

  const key = getP36RegistryPropertyKey_(league);

  const raw = properties.getProperty(key);

  if (raw === null) {

    return {
      key,
      exists: false,
      raw: null,
      registry: createP36SlateRegistry_(league)
    };

  }

  if (typeof raw !== "string" || !raw.trim()) {
    throw new Error("INVALID_REGISTRY_PROPERTY");
  }

  let registry;

  try {

    registry = JSON.parse(raw);

  } catch (error) {

    throw new Error("REGISTRY_JSON_CORRUPTED");

  }

  validateP36StorageRegistry_(league, registry);

  return {
    key,
    exists: true,
    raw,
    registry
  };

}

function saveP36SlateRegistry_(
  league,
  properties,
  registry,
  expectedRaw,
  getByteLength
) {

  const key = getP36RegistryPropertyKey_(league);

  validateP36StorageRegistry_(league, registry);

  if (
    expectedRaw !== null &&
    typeof expectedRaw !== "string"
  ) {
    throw new Error("INVALID_EXPECTED_PROPERTY");
  }

  if (typeof getByteLength !== "function") {
    throw new Error("INVALID_BYTE_LENGTH_FUNCTION");
  }

  const raw = JSON.stringify(registry);

  const bytes = getByteLength(raw);

  if (!Number.isSafeInteger(bytes) || bytes < 1) {
    throw new Error("INVALID_REGISTRY_BYTE_LENGTH");
  }

  // Conservative limit below the Script Properties
  // per-value storage limit.

  if (bytes > 8000) {
    throw new Error("REGISTRY_STORAGE_LIMIT_EXCEEDED");
  }

  const currentRaw = properties.getProperty(key);

  if (currentRaw !== expectedRaw) {
    throw new Error("REGISTRY_CONCURRENT_MODIFICATION");
  }

  if (currentRaw !== null) {
    loadP36SlateRegistry_(league, properties);
  }

  if (currentRaw === raw) {

    return {
      saved: false,
      reason: "REGISTRY_UNCHANGED",
      bytes,
      raw
    };

  }

  properties.setProperty(key, raw);

  if (properties.getProperty(key) !== raw) {
    throw new Error("REGISTRY_WRITE_VERIFICATION_FAILED");
  }

  return {
    saved: true,
    reason: "REGISTRY_SAVED",
    bytes,
    raw
  };

}

function getP36SlateRefreshDates_(registry, today) {

  validateP36SlateRegistry_(registry);

  if (
    typeof today !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(today) ||
    !Number.isFinite(Date.parse(today)) ||
    new Date(today).toISOString().slice(0,10) !== today
  ) {
    throw new Error("INVALID_TODAY_DATE");
  }

  const dates = new Set([today]);

  for (const date of getP36PendingSlates_(registry)) {

    if (date <= today) {
      dates.add(date);
    }

  }

  return [...dates].sort();

}

// ===== slate-retention.cjs =====

function validateP36RetentionBoundary_(registry) {

  validateP36SlateRegistry_(registry);

  const boundary =
    registry.retiredThrough ?? null;

  if (
    boundary !== null &&
    !isValidP36Date_(boundary)
  ) {
    throw new Error("INVALID_RETIREMENT_BOUNDARY");
  }

  return boundary;

}

function compactP36SlateRegistry_(
  registry,
  today,
  retentionDays = 14
) {

  const previousBoundary =
    validateP36RetentionBoundary_(registry);

  if (!isValidP36Date_(today)) {
    throw new Error("INVALID_TODAY_DATE");
  }

  if (
    !Number.isSafeInteger(retentionDays) ||
    retentionDays < 1 ||
    retentionDays > 365
  ) {
    throw new Error("INVALID_RETENTION_DAYS");
  }

  if (
    previousBoundary !== null &&
    previousBoundary >= today
  ) {
    throw new Error("INVALID_RETIREMENT_CHRONOLOGY");
  }

  const cutoff = new Date(`${today}T00:00:00Z`);

  cutoff.setUTCDate(
    cutoff.getUTCDate() - retentionDays - 1
  );

  const eligibleThrough =
    cutoff.toISOString().slice(0,10);

  const boundary =
    previousBoundary &&
    previousBoundary > eligibleThrough
      ? previousBoundary
      : eligibleThrough;

  const next =
    JSON.parse(JSON.stringify(registry));

  const removedSlateKeys = [];

  for (const [key,slate] of Object.entries(next.slates)) {

    if (
      slate.state === "PROCESSED" &&
      slate.slateDate <= boundary
    ) {

      delete next.slates[key];
      removedSlateKeys.push(key);

    }

  }

  next.retiredThrough = boundary;

  validateP36RetentionBoundary_(next);

  return {
    changed:
      JSON.stringify(next) !== JSON.stringify(registry),
    registry: next,
    removedSlateKeys: removedSlateKeys.sort(),
    retiredThrough: boundary
  };

}

function observeP36RetainedSlate_(
  registry,
  slateDate,
  observedGameIds
) {

  const boundary =
    validateP36RetentionBoundary_(registry);

  if (!isValidP36Date_(slateDate)) {

    return {
      accepted:false,
      reason:"INVALID_SLATE_DATE",
      registry
    };

  }

  const key =
    `${registry.league}:${slateDate}`;

  if (
    !Object.prototype.hasOwnProperty.call(
      registry.slates,key
    ) &&
    boundary !== null &&
    slateDate <= boundary
  ) {

    return {
      accepted:false,
      reason:"HISTORICAL_SLATE_RETIRED",
      registry
    };

  }

  return observeP36Slate_(
    registry,
    slateDate,
    observedGameIds
  );

}

// ===== pipeline-initialization-gate.cjs =====

function evaluateP36PipelineInitialization_(input) {

  const result = {
    authorized: false,
    action: "WAIT",
    reason: null,
    slateKey: null,
    slateDate: null
  };

  const reject = (reason,action = "WAIT") => ({
    ...result,
    reason,
    action
  });

  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    return reject("INVALID_INPUT","BLOCK");
  }

  const {
    registry,
    slateDate,
    today,
    pipelineState,
    games,
    scheduleRows,
    snapshotVerified,
    scheduleVerified,
    stateVerified
  } = input;

  try {

    validateP36SlateRegistry_(registry);
    validateP36RetentionBoundary_(registry);

  } catch (error) {

    return reject("INVALID_REGISTRY","BLOCK");

  }

  if (
    !isValidP36Date_(today) ||
    !isValidP36Date_(slateDate) ||
    slateDate > today
  ) {
    return reject("INVALID_SLATE_CHRONOLOGY","BLOCK");
  }

  const key = `${registry.league}:${slateDate}`;

  result.slateKey = key;
  result.slateDate = slateDate;

  const slate = registry.slates[key];

  if (!slate) {
    return reject("SLATE_NOT_FOUND");
  }

  if (slate.state === "PROCESSED") {
    return reject("SLATE_ALREADY_PROCESSED","STOP");
  }

  if (stateVerified !== true) {
    return reject("PIPELINE_STATE_NOT_VERIFIED","BLOCK");
  }

  if (
    !pipelineState ||
    typeof pipelineState !== "object" ||
    Array.isArray(pipelineState) ||
    typeof pipelineState.completed !== "boolean" ||
    typeof pipelineState.stage !== "string" ||
    !pipelineState.stage.trim() ||
    (
      pipelineState.suspended !== undefined &&
      typeof pipelineState.suspended !== "boolean"
    ) ||
    pipelineState.completed !==
      (pipelineState.stage === "COMPLETE")
  ) {
    return reject("INVALID_PIPELINE_STATE","BLOCK");
  }

  if (pipelineState.suspended === true) {
    return reject("PIPELINE_SUSPENDED","BLOCK");
  }

  const assignedSlates =
    Object.values(registry.slates).filter(
      item => item.state === "PROCESSING"
    );

  if (assignedSlates.length > 0) {

    const assigned = assignedSlates[0];

    if (
      pipelineState.p36RunId !== assigned.runId ||
      pipelineState.p36SlateKey !== assigned.slateKey
    ) {
      return reject("PIPELINE_ASSIGNMENT_MISMATCH","BLOCK");
    }

    if (pipelineState.completed) {
      return reject(
        "ASSIGNED_PIPELINE_COMPLETED",
        "RECONCILE"
      );
    }

    return reject("PIPELINE_ALREADY_PROCESSING","RESUME");

  }

  if (!pipelineState.completed) {
    return reject("EXISTING_PIPELINE_UNFINISHED","QUEUE");
  }

  if (
    pipelineState.p36RunId != null ||
    pipelineState.p36SlateKey != null
  ) {

    const historical =
      registry.slates[pipelineState.p36SlateKey];

    if (
      !historical ||
      historical.state !== "PROCESSED" ||
      historical.runId !== pipelineState.p36RunId
    ) {
      return reject(
        "COMPLETED_ASSIGNMENT_NOT_RECONCILED",
        "BLOCK"
      );
    }

  }

  if (slate.state !== "READY") {
    return reject("SLATE_NOT_READY");
  }

  if (snapshotVerified !== true) {
    return reject("API_SNAPSHOT_NOT_VERIFIED","BLOCK");
  }

  if (scheduleVerified !== true) {
    return reject("SCHEDULE_NOT_VERIFIED","BLOCK");
  }

  const evaluation =
    evaluateP36SlateCompletion_(
      registry.league,
      slateDate,
      slate.inventory.expectedGameIds,
      games,
      scheduleRows
    );

  if (!evaluation.ready) {
    return reject(evaluation.reason,"WAIT");
  }

  return {
    ...result,
    authorized: true,
    action: "INITIALIZE",
    reason: "PROTECTED_INITIALIZATION_AUTHORIZED"
  };

}

// ===== pipeline-initialization-recovery.cjs =====

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

// ===== initialization-journal.cjs =====

function getP36JournalKey_(league) {

  if (!["NBA","NHL","MLB","NFL"].includes(league)) {
    throw new Error("INVALID_LEAGUE");
  }

  return `P36_${league}_INITIALIZATION_JOURNAL_V1`;

}

function validateP36Journal_(league,journal) {

  getP36JournalKey_(league);

  if (
    !journal ||
    typeof journal !== "object" ||
    Array.isArray(journal) ||
    journal.version !== 1 ||
    journal.league !== league ||
    !isValidP36Date_(journal.slateDate) ||
    journal.slateKey !== `${league}:${journal.slateDate}` ||
    typeof journal.runId !== "string" ||
    !journal.runId.trim()
  ) {
    throw new Error("INVALID_JOURNAL");
  }

  return true;

}

function loadP36Journal_(league,properties) {

  const key = getP36JournalKey_(league);
  const raw = properties.getProperty(key);

  if (raw === null) {

    return {
      key,
      raw:null,
      journal:null
    };

  }

  let journal;

  try {

    journal = JSON.parse(raw);

  } catch (error) {

    throw new Error("JOURNAL_JSON_CORRUPTED");

  }

  validateP36Journal_(league,journal);

  return {key,raw,journal};

}

function saveP36Journal_(
  league,
  properties,
  journal,
  lock
) {

  if (!lock || lock.hasLock() !== true) {
    throw new Error("SCRIPT_LOCK_REQUIRED");
  }

  validateP36Journal_(league,journal);

  const existing =
    loadP36Journal_(league,properties);

  const raw = JSON.stringify(journal);

  if (existing.raw !== null) {

    if (existing.raw === raw) {

      return {
        saved:false,
        reason:"JOURNAL_UNCHANGED"
      };

    }

    throw new Error("EXISTING_JOURNAL_CONFLICT");

  }

  properties.setProperty(existing.key,raw);

  if (properties.getProperty(existing.key) !== raw) {

    throw new Error("JOURNAL_WRITE_VERIFICATION_FAILED");

  }

  return {
    saved:true,
    reason:"JOURNAL_SAVED"
  };

}

function clearP36Journal_(
  league,
  properties,
  expectedRaw,
  registry,
  pipelineState,
  lock
) {

  if (!lock || lock.hasLock() !== true) {
    throw new Error("SCRIPT_LOCK_REQUIRED");
  }

  const existing =
    loadP36Journal_(league,properties);

  if (
    typeof expectedRaw !== "string" ||
    existing.raw !== expectedRaw
  ) {
    throw new Error("JOURNAL_CONCURRENT_MODIFICATION");
  }

  

  validateP36SlateRegistry_(registry);

  const journal = existing.journal;

  const slate =
    registry.slates[journal.slateKey];

  if (
    registry.league !== league ||
    !slate ||
    slate.state !== "PROCESSING" ||
    slate.runId !== journal.runId ||
    !pipelineState ||
    pipelineState.p36RunId !== journal.runId ||
    pipelineState.p36SlateKey !== journal.slateKey ||
    typeof pipelineState.completed !== "boolean" ||
    typeof pipelineState.stage !== "string" ||
    !pipelineState.stage.trim() ||
    pipelineState.completed !==
      (pipelineState.stage === "COMPLETE")
  ) {

    throw new Error("INITIALIZATION_NOT_COMMITTED");

  }

  properties.deleteProperty(existing.key);

  if (properties.getProperty(existing.key) !== null) {

    throw new Error("JOURNAL_DELETE_VERIFICATION_FAILED");

  }

  return {
    cleared:true,
    reason:"JOURNAL_CLEARED"
  };

}

// ===== initialization-coordinator.cjs =====

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
