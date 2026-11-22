
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const crypto = require("node:crypto");

const sourcePath = "nba-appscript";

const expectedHash = "6b5cdd039186b7312f872bd8675b888d40b43e095c260f4a81706a9e7267a7ff";

const hash = value => crypto
  .createHash("sha256")
  .update(value)
  .digest("hex");

assert.equal(
  hash(fs.readFileSync(sourcePath)),
  expectedHash
);

const businessLogic = "\n\n// P36 UNIVERSAL GAME COMPLETION ENGINE\n\n// Generated automatically. Do not edit manually.\n\n\n\n// ===== game-status-normalizer.cjs =====\n\nfunction normalizeP36GameStatus_(league, game) {\n\n  const supportedLeagues = [\"NBA\", \"NHL\", \"MLB\", \"NFL\"];\n\n  if (!supportedLeagues.includes(league)) {\n    return \"UNKNOWN\";\n  }\n\n  if (\n    !game ||\n    typeof game !== \"object\" ||\n    Array.isArray(game)\n  ) {\n    return \"UNKNOWN\";\n  }\n\n  const normalize = value =>\n    typeof value === \"string\"\n      ? value.trim().toLowerCase()\n      : \"\";\n\n  const primary = normalize(game.status_state);\n\n  const secondary = [\n    game.status,\n    game.game_state,\n    game.state,\n    game.detailed_state\n  ].map(normalize).filter(Boolean);\n\n  const disruptedPattern =\n    /postpon|cancel|suspend|abandon|delay/;\n\n  if (\n    game.postponed === true ||\n    game.cancelled === true ||\n    game.canceled === true ||\n    game.suspended === true ||\n    [primary, ...secondary].some(\n      value => disruptedPattern.test(value)\n    )\n  ) {\n    return \"DISRUPTED\";\n  }\n\n  const finalValues = {\n    NBA: [\"final\"],\n    NHL: [\"final\", \"off\"],\n    MLB: [\"final\", \"status_final\"],\n    NFL: [\"final\"]\n  };\n\n  const isFinal = value =>\n    finalValues[league].includes(value) ||\n    (league === \"NBA\" && /^final\\/(?:\\d+)?ot$/.test(value));\n\n  const isScheduled = value =>\n    [\n      \"scheduled\",\n      \"status_scheduled\",\n      \"fut\",\n      \"pre\"\n    ].includes(value) ||\n    /^\\d{4}-\\d{2}-\\d{2}T/.test(value) ||\n    /^\\d{1,2}\\/\\d{1,2}\\s*-\\s*/.test(value);\n\n  const isInProgress = value =>\n    [\n      \"in_progress\",\n      \"status_in_progress\",\n      \"live\",\n      \"crit\",\n      \"halftime\"\n    ].includes(value) ||\n    /^\\d{1,2}:\\d{2}\\s*-\\s*/.test(value);\n\n  if (primary === \"final\") {\n\n    if (\n      secondary.length === 0 ||\n      !secondary.every(isFinal)\n    ) {\n      return \"UNKNOWN\";\n    }\n\n    return \"COMPLETED\";\n\n  }\n\n  if (primary === \"scheduled\") {\n\n    if (secondary.some(\n      value => isFinal(value) || isInProgress(value)\n    )) {\n      return \"UNKNOWN\";\n    }\n\n    return \"SCHEDULED\";\n\n  }\n\n  if (primary === \"in_progress\") {\n\n    if (secondary.some(\n      value => isFinal(value) || isScheduled(value)\n    )) {\n      return \"UNKNOWN\";\n    }\n\n    return \"IN_PROGRESS\";\n\n  }\n\n  return \"UNKNOWN\";\n\n}\n\n// ===== schedule-status-display.cjs =====\n\nfunction getP36ScheduleStatus_(league, game) {\n\n  const classification =\n    normalizeP36GameStatus_(league, game);\n\n  const rawStatus =\n    typeof game?.status === \"string\"\n      ? game.status.trim()\n      : \"\";\n\n  switch (classification) {\n\n    case \"COMPLETED\":\n      return \"Final\";\n\n    case \"SCHEDULED\":\n      return rawStatus || \"Scheduled\";\n\n    case \"IN_PROGRESS\":\n      return rawStatus || \"In Progress\";\n\n    case \"DISRUPTED\":\n      return \"Disrupted\";\n\n    default:\n      return \"Unknown\";\n\n  }\n\n}\n\n// ===== slate-date-engine.cjs =====\n\nfunction isValidP36Date_(value) {\n\n  return (\n    typeof value === \"string\" &&\n    /^\\d{4}-\\d{2}-\\d{2}$/.test(value) &&\n    Number.isFinite(Date.parse(value)) &&\n    new Date(value).toISOString().slice(0,10) === value\n  );\n\n}\n\nfunction getP36GameSlateDate_(\n  league,\n  game,\n  formatArizonaDate\n) {\n\n  if (\n    ![\"NBA\",\"NHL\",\"MLB\",\"NFL\"].includes(league) ||\n    !game ||\n    typeof game !== \"object\" ||\n    Array.isArray(game) ||\n    typeof formatArizonaDate !== \"function\"\n  ) {\n    return null;\n  }\n\n  // Preserve the official date-only fields\n  // supplied by NBA and NHL.\n\n  if (league === \"NBA\" || league === \"NHL\") {\n\n    const officialDate =\n      league === \"NBA\"\n        ? game.date\n        : game.game_date;\n\n    if (isValidP36Date_(officialDate)) {\n      return officialDate;\n    }\n\n  }\n\n  const candidates = {\n\n    NBA: [\n      game.datetime,\n      game.date\n    ],\n\n    NHL: [\n      game.start_time_utc,\n      game.game_date\n    ],\n\n    MLB: [\n      game.date,\n      game.game_date\n    ],\n\n    NFL: [\n      game.date\n    ]\n\n  }[league];\n\n  const rawDate = candidates.find(\n    value =>\n      typeof value === \"string\" &&\n      value.trim() !== \"\"\n  );\n\n  if (!rawDate) {\n    return null;\n  }\n\n  // Never interpret an ambiguous timestamp\n  // using the computer's local timezone.\n\n  if (\n    !/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})$/.test(\n      rawDate\n    ) ||\n    !isValidP36Date_(rawDate.slice(0,10))\n  ) {\n    return null;\n  }\n\n  const timestamp = new Date(rawDate);\n\n  if (!Number.isFinite(timestamp.getTime())) {\n    return null;\n  }\n\n  try {\n\n    const slateDate =\n      formatArizonaDate(timestamp);\n\n    return isValidP36Date_(slateDate)\n      ? slateDate\n      : null;\n\n  } catch (error) {\n\n    return null;\n\n  }\n\n}\n\nfunction groupP36GamesBySlate_(\n  league,\n  games,\n  formatArizonaDate\n) {\n\n  const reject = reason => ({\n    accepted: false,\n    reason,\n    slates: {}\n  });\n\n  if (![\"NBA\",\"NHL\",\"MLB\",\"NFL\"].includes(league)) {\n    return reject(\"INVALID_LEAGUE\");\n  }\n\n  if (!Array.isArray(games)) {\n    return reject(\"INVALID_GAME_RESPONSE\");\n  }\n\n  const gameIds = new Set();\n  const slates = {};\n\n  for (const game of games) {\n\n    if (\n      !game ||\n      typeof game !== \"object\" ||\n      Array.isArray(game)\n    ) {\n      return reject(\"INVALID_GAME\");\n    }\n\n    const id =\n      typeof game.id === \"string\" ||\n      Number.isSafeInteger(game.id)\n        ? String(game.id).trim()\n        : \"\";\n\n    if (!/^[1-9]\\d*$/.test(id)) {\n      return reject(\"INVALID_GAME_ID\");\n    }\n\n    if (gameIds.has(id)) {\n      return reject(\"DUPLICATE_GAME_ID\");\n    }\n\n    gameIds.add(id);\n\n    const slateDate =\n      getP36GameSlateDate_(\n        league,\n        game,\n        formatArizonaDate\n      );\n\n    if (!slateDate) {\n      return reject(\"INVALID_GAME_SLATE_DATE\");\n    }\n\n    if (!slates[slateDate]) {\n      slates[slateDate] = [];\n    }\n\n    slates[slateDate].push(game);\n\n  }\n\n  return {\n    accepted: true,\n    reason:\n      games.length === 0\n        ? \"EMPTY_RESPONSE\"\n        : \"SLATES_GROUPED\",\n    slates\n  };\n\n}\n\n// ===== slate-inventory.cjs =====\n\nfunction reconcileP36SlateInventory_(\n  league,\n  slateDate,\n  previousInventory,\n  observedGameIds\n) {\n\n  const result = {\n    accepted: false,\n    changed: false,\n    reason: null,\n    inventory: null,\n    addedGameIds: [],\n    missingGameIds: []\n  };\n\n  const reject = reason => {\n    result.reason = reason;\n    return result;\n  };\n\n  const validDate = value =>\n    typeof value === \"string\" &&\n    /^\\d{4}-\\d{2}-\\d{2}$/.test(value) &&\n    Number.isFinite(Date.parse(value)) &&\n    new Date(value).toISOString().slice(0,10) === value;\n\n  const normalizeId = value =>\n    typeof value === \"string\" ||\n    Number.isSafeInteger(value)\n      ? String(value).trim()\n      : \"\";\n\n  const validId = value =>\n    /^[1-9]\\d*$/.test(value);\n\n  const sortIds = ids =>\n    [...ids].sort(\n      (a,b) =>\n        a.length - b.length ||\n        a.localeCompare(b)\n    );\n\n  if (![\"NBA\",\"NHL\",\"MLB\",\"NFL\"].includes(league)) {\n    return reject(\"INVALID_LEAGUE\");\n  }\n\n  if (!validDate(slateDate)) {\n    return reject(\"INVALID_SLATE_DATE\");\n  }\n\n  if (!Array.isArray(observedGameIds)) {\n    return reject(\"INVALID_OBSERVED_INVENTORY\");\n  }\n\n  const observedIds =\n    observedGameIds.map(normalizeId);\n\n  if (observedIds.some(id => !validId(id))) {\n    return reject(\"INVALID_OBSERVED_GAME_ID\");\n  }\n\n  if (\n    new Set(observedIds).size !== observedIds.length\n  ) {\n    return reject(\"DUPLICATE_OBSERVED_GAME_ID\");\n  }\n\n  const slateKey =\n    `${league}:${slateDate}`;\n\n  if (previousInventory === null) {\n\n    if (observedIds.length === 0) {\n      return reject(\"EMPTY_SLATE\");\n    }\n\n    result.accepted = true;\n    result.changed = true;\n    result.reason = \"INVENTORY_INITIALIZED\";\n\n    result.inventory = {\n      version: 1,\n      league,\n      slateDate,\n      slateKey,\n      expectedGameIds: sortIds(observedIds)\n    };\n\n    result.addedGameIds = sortIds(observedIds);\n\n    return result;\n\n  }\n\n  if (\n    !previousInventory ||\n    typeof previousInventory !== \"object\" ||\n    Array.isArray(previousInventory) ||\n    previousInventory.version !== 1 ||\n    previousInventory.league !== league ||\n    previousInventory.slateDate !== slateDate ||\n    previousInventory.slateKey !== slateKey ||\n    !Array.isArray(previousInventory.expectedGameIds)\n  ) {\n    return reject(\"INVALID_PREVIOUS_INVENTORY\");\n  }\n\n  const previousIds =\n    previousInventory.expectedGameIds;\n\n  if (\n    previousIds.length === 0 ||\n    previousIds.some(\n      id => typeof id !== \"string\" || !validId(id)\n    ) ||\n    new Set(previousIds).size !== previousIds.length\n  ) {\n    return reject(\"INVALID_PREVIOUS_GAME_IDS\");\n  }\n\n  const previousSet = new Set(previousIds);\n  const observedSet = new Set(observedIds);\n\n  result.missingGameIds = sortIds(\n    previousIds.filter(id => !observedSet.has(id))\n  );\n\n  result.addedGameIds = sortIds(\n    observedIds.filter(id => !previousSet.has(id))\n  );\n\n  if (result.missingGameIds.length > 0) {\n    return reject(\"MISSING_EXPECTED_GAMES\");\n  }\n\n  result.accepted = true;\n  result.changed = result.addedGameIds.length > 0;\n\n  result.reason = result.changed\n    ? \"INVENTORY_EXPANDED\"\n    : \"INVENTORY_UNCHANGED\";\n\n  result.inventory = {\n    version: 1,\n    league,\n    slateDate,\n    slateKey,\n    expectedGameIds: sortIds(observedIds)\n  };\n\n  return result;\n\n}\n\n// ===== slate-completion-evaluator.cjs =====\n\nfunction evaluateP36SlateCompletion_(\n  league,\n  slateDate,\n  expectedGameIds,\n  games,\n  scheduleRows\n) {\n\n  const supportedLeagues =\n    [\"NBA\", \"NHL\", \"MLB\", \"NFL\"];\n\n  const result = {\n    league,\n    slateDate,\n    total: 0,\n    completed: 0,\n    scheduled: 0,\n    inProgress: 0,\n    disrupted: 0,\n    unknown: 0,\n    ready: false,\n    reason: null\n  };\n\n  const reject = reason => {\n    result.reason = reason;\n    return result;\n  };\n\n  const validDate = value =>\n    typeof value === \"string\" &&\n    /^\\d{4}-\\d{2}-\\d{2}$/.test(value) &&\n    Number.isFinite(Date.parse(value)) &&\n    new Date(value).toISOString().slice(0, 10) === value;\n\n  const normalizeId = value =>\n    typeof value === \"string\" ||\n    Number.isSafeInteger(value)\n      ? String(value).trim()\n      : \"\";\n\n  const validId = value =>\n    /^[1-9]\\d*$/.test(value);\n\n  if (!supportedLeagues.includes(league)) {\n    return reject(\"INVALID_LEAGUE\");\n  }\n\n  if (!validDate(slateDate)) {\n    return reject(\"INVALID_SLATE_DATE\");\n  }\n\n  if (\n    !Array.isArray(expectedGameIds) ||\n    !Array.isArray(games) ||\n    !Array.isArray(scheduleRows)\n  ) {\n    return reject(\"INVALID_INPUT\");\n  }\n\n  const expectedIds =\n    expectedGameIds.map(normalizeId);\n\n  result.total = expectedIds.length;\n\n  if (expectedIds.some(id => !validId(id))) {\n    return reject(\"INVALID_EXPECTED_GAME_ID\");\n  }\n\n  if (\n    new Set(expectedIds).size !== expectedIds.length\n  ) {\n    return reject(\"DUPLICATE_EXPECTED_GAME_ID\");\n  }\n\n  if (expectedIds.length === 0) {\n\n    if (\n      games.length !== 0 ||\n      scheduleRows.length !== 0\n    ) {\n      return reject(\"UNEXPECTED_GAME_INVENTORY\");\n    }\n\n    return reject(\"EMPTY_SLATE\");\n\n  }\n\n  const expectedSet =\n    new Set(expectedIds);\n\n  const gameMap = new Map();\n\n  for (const game of games) {\n\n    if (\n      !game ||\n      typeof game !== \"object\" ||\n      Array.isArray(game)\n    ) {\n      return reject(\"INVALID_GAME\");\n    }\n\n    const id = normalizeId(game.id);\n\n    if (!validId(id)) {\n      return reject(\"INVALID_GAME_ID\");\n    }\n\n    if (gameMap.has(id)) {\n      return reject(\"DUPLICATE_GAME_ID\");\n    }\n\n    if (!expectedSet.has(id)) {\n      return reject(\"UNEXPECTED_GAME_ID\");\n    }\n\n    gameMap.set(id, game);\n\n  }\n\n  if (gameMap.size !== expectedSet.size) {\n    return reject(\"INCOMPLETE_GAME_INVENTORY\");\n  }\n\n  const scheduleMap = new Map();\n\n  for (const row of scheduleRows) {\n\n    if (\n      !row ||\n      typeof row !== \"object\" ||\n      Array.isArray(row)\n    ) {\n      return reject(\"INVALID_SCHEDULE_ROW\");\n    }\n\n    const id = normalizeId(row.gameId);\n\n    if (!validId(id)) {\n      return reject(\"INVALID_SCHEDULE_GAME_ID\");\n    }\n\n    if (scheduleMap.has(id)) {\n      return reject(\"DUPLICATE_SCHEDULE_GAME_ID\");\n    }\n\n    if (!expectedSet.has(id)) {\n      return reject(\"UNEXPECTED_SCHEDULE_GAME_ID\");\n    }\n\n    scheduleMap.set(id, row.status);\n\n  }\n\n  if (scheduleMap.size !== expectedSet.size) {\n    return reject(\"INCOMPLETE_SCHEDULE_INVENTORY\");\n  }\n\n  let statusMismatch = false;\n\n  for (const id of expectedIds) {\n\n    const classification =\n      normalizeP36GameStatus_(\n        league,\n        gameMap.get(id)\n      );\n\n    const displayedStatus =\n      scheduleMap.get(id);\n\n    const displayedFinal =\n      typeof displayedStatus === \"string\" &&\n      displayedStatus.trim() === \"Final\";\n\n    switch (classification) {\n\n      case \"COMPLETED\":\n        result.completed++;\n        break;\n\n      case \"SCHEDULED\":\n        result.scheduled++;\n        break;\n\n      case \"IN_PROGRESS\":\n        result.inProgress++;\n        break;\n\n      case \"DISRUPTED\":\n        result.disrupted++;\n        break;\n\n      default:\n        result.unknown++;\n        break;\n\n    }\n\n    if (\n      displayedFinal !==\n      (classification === \"COMPLETED\")\n    ) {\n      statusMismatch = true;\n    }\n\n  }\n\n  if (statusMismatch) {\n    return reject(\"SCHEDULE_STATUS_MISMATCH\");\n  }\n\n  if (result.disrupted > 0) {\n    return reject(\"DISRUPTED_GAMES\");\n  }\n\n  if (result.unknown > 0) {\n    return reject(\"UNKNOWN_GAME_STATUSES\");\n  }\n\n  if (result.completed !== result.total) {\n    return reject(\"SLATE_INCOMPLETE\");\n  }\n\n  result.ready = true;\n  result.reason = \"SLATE_COMPLETE\";\n\n  return result;\n\n}\n\n// ===== slate-registry.cjs =====\n\nconst supportedLeagues =\n  [\"NBA\",\"NHL\",\"MLB\",\"NFL\"];\n\nconst validStates =\n  [\"TRACKING\",\"READY\",\"PROCESSING\",\"PROCESSED\"];\n\nfunction createP36SlateRegistry_(league) {\n\n  if (!supportedLeagues.includes(league)) {\n    throw new Error(\"INVALID_LEAGUE\");\n  }\n\n  return {\n    version: 1,\n    league,\n    slates: {}\n  };\n\n}\n\nfunction validateP36SlateRegistry_(registry) {\n\n  if (\n    !registry ||\n    typeof registry !== \"object\" ||\n    Array.isArray(registry) ||\n    registry.version !== 1 ||\n    !supportedLeagues.includes(registry.league) ||\n    !registry.slates ||\n    typeof registry.slates !== \"object\" ||\n    Array.isArray(registry.slates)\n  ) {\n    throw new Error(\"INVALID_REGISTRY\");\n  }\n\n  let processingCount = 0;\n  const runIds = new Set();\n\n  for (const [key,slate] of Object.entries(registry.slates)) {\n\n    if (\n      !slate ||\n      !isValidP36Date_(slate.slateDate) ||\n      key !== `${registry.league}:${slate.slateDate}` ||\n      slate.slateKey !== key ||\n      !validStates.includes(slate.state) ||\n      !slate.inventory\n    ) {\n      throw new Error(\"INVALID_SLATE_RECORD\");\n    }\n\n    const inventoryCheck =\n      reconcileP36SlateInventory_(\n        registry.league,\n        slate.slateDate,\n        slate.inventory,\n        slate.inventory.expectedGameIds\n      );\n\n    if (\n      !inventoryCheck.accepted ||\n      inventoryCheck.changed\n    ) {\n      throw new Error(\"INVALID_SLATE_INVENTORY\");\n    }\n\n    if (\n      slate.state === \"PROCESSING\" ||\n      slate.state === \"PROCESSED\"\n    ) {\n\n      if (\n        typeof slate.runId !== \"string\" ||\n        !slate.runId.trim() ||\n        runIds.has(slate.runId)\n      ) {\n        throw new Error(\"INVALID_SLATE_RUN_ID\");\n      }\n\n      runIds.add(slate.runId);\n\n    } else if (slate.runId !== null) {\n\n      throw new Error(\"UNEXPECTED_SLATE_RUN_ID\");\n\n    }\n\n    if (slate.state === \"PROCESSING\") {\n      processingCount++;\n    }\n\n  }\n\n  if (processingCount > 1) {\n    throw new Error(\"MULTIPLE_PROCESSING_SLATES\");\n  }\n\n  return true;\n\n}\n\nfunction observeP36Slate_(\n  registry,\n  slateDate,\n  observedGameIds\n) {\n\n  validateP36SlateRegistry_(registry);\n\n  const key =\n    `${registry.league}:${slateDate}`;\n\n  const previous =\n    registry.slates[key] || null;\n\n  const reconciliation =\n    reconcileP36SlateInventory_(\n      registry.league,\n      slateDate,\n      previous ? previous.inventory : null,\n      observedGameIds\n    );\n\n  if (!reconciliation.accepted) {\n    return {\n      accepted: false,\n      reason: reconciliation.reason,\n      registry\n    };\n  }\n\n  if (\n    previous &&\n    [\"PROCESSING\",\"PROCESSED\"].includes(previous.state)\n  ) {\n\n    return {\n      accepted: !reconciliation.changed,\n      reason: reconciliation.changed\n        ? \"ASSIGNED_SLATE_INVENTORY_CHANGED\"\n        : \"SLATE_ALREADY_ASSIGNED\",\n      registry\n    };\n\n  }\n\n  const next =\n    JSON.parse(JSON.stringify(registry));\n\n  next.slates[key] = {\n    slateKey: key,\n    slateDate,\n    inventory: reconciliation.inventory,\n    state: \"TRACKING\",\n    runId: null\n  };\n\n  validateP36SlateRegistry_(next);\n\n  return {\n    accepted: true,\n    reason: reconciliation.reason,\n    registry: next\n  };\n\n}\n\nfunction transitionP36Slate_(\n  registry,\n  slateDate,\n  targetState,\n  evidence = {}\n) {\n\n  validateP36SlateRegistry_(registry);\n\n  const reject = reason => ({\n    accepted: false,\n    reason,\n    registry\n  });\n\n  const key =\n    `${registry.league}:${slateDate}`;\n\n  const slate =\n    registry.slates[key];\n\n  if (!slate) {\n    return reject(\"SLATE_NOT_FOUND\");\n  }\n\n  let runId = slate.runId;\n\n  if (targetState === \"READY\") {\n\n    if (slate.state !== \"TRACKING\") {\n      return reject(\"INVALID_TRANSITION\");\n    }\n\n    const evaluation = evidence.evaluation;\n\n    if (\n      !evaluation ||\n      evaluation.league !== registry.league ||\n      evaluation.slateDate !== slateDate ||\n      evaluation.ready !== true ||\n      evaluation.reason !== \"SLATE_COMPLETE\" ||\n      evaluation.total !== slate.inventory.expectedGameIds.length ||\n      evaluation.completed !== evaluation.total ||\n      evaluation.scheduled !== 0 ||\n      evaluation.inProgress !== 0 ||\n      evaluation.disrupted !== 0 ||\n      evaluation.unknown !== 0\n    ) {\n      return reject(\"SLATE_COMPLETION_NOT_VERIFIED\");\n    }\n\n  } else if (targetState === \"PROCESSING\") {\n\n    if (slate.state !== \"READY\") {\n      return reject(\"INVALID_TRANSITION\");\n    }\n\n    if (\n      Object.values(registry.slates).some(\n        item => item.state === \"PROCESSING\"\n      )\n    ) {\n      return reject(\"ANOTHER_SLATE_PROCESSING\");\n    }\n\n    if (\n      typeof evidence.runId !== \"string\" ||\n      !evidence.runId.trim() ||\n      Object.values(registry.slates).some(\n        item => item.runId === evidence.runId\n      )\n    ) {\n      return reject(\"INVALID_RUN_ID\");\n    }\n\n    runId = evidence.runId;\n\n  } else if (targetState === \"PROCESSED\") {\n\n    if (slate.state !== \"PROCESSING\") {\n      return reject(\"INVALID_TRANSITION\");\n    }\n\n    if (\n      evidence.runId !== slate.runId ||\n      evidence.completed !== true ||\n      evidence.stage !== \"COMPLETE\"\n    ) {\n      return reject(\"PIPELINE_COMPLETION_NOT_VERIFIED\");\n    }\n\n  } else {\n\n    return reject(\"INVALID_TARGET_STATE\");\n\n  }\n\n  const next =\n    JSON.parse(JSON.stringify(registry));\n\n  next.slates[key].state = targetState;\n  next.slates[key].runId = runId;\n\n  validateP36SlateRegistry_(next);\n\n  return {\n    accepted: true,\n    reason: `SLATE_${targetState}`,\n    registry: next\n  };\n\n}\n\nfunction getP36PendingSlates_(registry) {\n\n  validateP36SlateRegistry_(registry);\n\n  return Object.values(registry.slates)\n    .filter(slate =>\n      slate.state === \"TRACKING\" ||\n      slate.state === \"READY\"\n    )\n    .map(slate => slate.slateDate)\n    .sort();\n\n}\n\n// ===== slate-storage.cjs =====\n\nfunction getP36RegistryPropertyKey_(league) {\n\n  if (![\"NBA\",\"NHL\",\"MLB\",\"NFL\"].includes(league)) {\n    throw new Error(\"INVALID_LEAGUE\");\n  }\n\n  return `P36_${league}_SLATE_REGISTRY_V1`;\n\n}\n\nfunction validateP36StorageRegistry_(league, registry) {\n\n  validateP36SlateRegistry_(registry);\n\n  if (registry.league !== league) {\n    throw new Error(\"REGISTRY_LEAGUE_MISMATCH\");\n  }\n\n  return true;\n\n}\n\nfunction loadP36SlateRegistry_(league, properties) {\n\n  const key = getP36RegistryPropertyKey_(league);\n\n  const raw = properties.getProperty(key);\n\n  if (raw === null) {\n\n    return {\n      key,\n      exists: false,\n      raw: null,\n      registry: createP36SlateRegistry_(league)\n    };\n\n  }\n\n  if (typeof raw !== \"string\" || !raw.trim()) {\n    throw new Error(\"INVALID_REGISTRY_PROPERTY\");\n  }\n\n  let registry;\n\n  try {\n\n    registry = JSON.parse(raw);\n\n  } catch (error) {\n\n    throw new Error(\"REGISTRY_JSON_CORRUPTED\");\n\n  }\n\n  validateP36StorageRegistry_(league, registry);\n\n  return {\n    key,\n    exists: true,\n    raw,\n    registry\n  };\n\n}\n\nfunction saveP36SlateRegistry_(\n  league,\n  properties,\n  registry,\n  expectedRaw,\n  getByteLength\n) {\n\n  const key = getP36RegistryPropertyKey_(league);\n\n  validateP36StorageRegistry_(league, registry);\n\n  if (\n    expectedRaw !== null &&\n    typeof expectedRaw !== \"string\"\n  ) {\n    throw new Error(\"INVALID_EXPECTED_PROPERTY\");\n  }\n\n  if (typeof getByteLength !== \"function\") {\n    throw new Error(\"INVALID_BYTE_LENGTH_FUNCTION\");\n  }\n\n  const raw = JSON.stringify(registry);\n\n  const bytes = getByteLength(raw);\n\n  if (!Number.isSafeInteger(bytes) || bytes < 1) {\n    throw new Error(\"INVALID_REGISTRY_BYTE_LENGTH\");\n  }\n\n  // Conservative limit below the Script Properties\n  // per-value storage limit.\n\n  if (bytes > 8000) {\n    throw new Error(\"REGISTRY_STORAGE_LIMIT_EXCEEDED\");\n  }\n\n  const currentRaw = properties.getProperty(key);\n\n  if (currentRaw !== expectedRaw) {\n    throw new Error(\"REGISTRY_CONCURRENT_MODIFICATION\");\n  }\n\n  if (currentRaw !== null) {\n    loadP36SlateRegistry_(league, properties);\n  }\n\n  if (currentRaw === raw) {\n\n    return {\n      saved: false,\n      reason: \"REGISTRY_UNCHANGED\",\n      bytes,\n      raw\n    };\n\n  }\n\n  properties.setProperty(key, raw);\n\n  if (properties.getProperty(key) !== raw) {\n    throw new Error(\"REGISTRY_WRITE_VERIFICATION_FAILED\");\n  }\n\n  return {\n    saved: true,\n    reason: \"REGISTRY_SAVED\",\n    bytes,\n    raw\n  };\n\n}\n\nfunction getP36SlateRefreshDates_(registry, today) {\n\n  validateP36SlateRegistry_(registry);\n\n  if (\n    typeof today !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2}$/.test(today) ||\n    !Number.isFinite(Date.parse(today)) ||\n    new Date(today).toISOString().slice(0,10) !== today\n  ) {\n    throw new Error(\"INVALID_TODAY_DATE\");\n  }\n\n  const dates = new Set([today]);\n\n  for (const date of getP36PendingSlates_(registry)) {\n\n    if (date <= today) {\n      dates.add(date);\n    }\n\n  }\n\n  return [...dates].sort();\n\n}\n\n// ===== slate-retention.cjs =====\n\nfunction validateP36RetentionBoundary_(registry) {\n\n  validateP36SlateRegistry_(registry);\n\n  const boundary =\n    registry.retiredThrough ?? null;\n\n  if (\n    boundary !== null &&\n    !isValidP36Date_(boundary)\n  ) {\n    throw new Error(\"INVALID_RETIREMENT_BOUNDARY\");\n  }\n\n  return boundary;\n\n}\n\nfunction compactP36SlateRegistry_(\n  registry,\n  today,\n  retentionDays = 14\n) {\n\n  const previousBoundary =\n    validateP36RetentionBoundary_(registry);\n\n  if (!isValidP36Date_(today)) {\n    throw new Error(\"INVALID_TODAY_DATE\");\n  }\n\n  if (\n    !Number.isSafeInteger(retentionDays) ||\n    retentionDays < 1 ||\n    retentionDays > 365\n  ) {\n    throw new Error(\"INVALID_RETENTION_DAYS\");\n  }\n\n  if (\n    previousBoundary !== null &&\n    previousBoundary >= today\n  ) {\n    throw new Error(\"INVALID_RETIREMENT_CHRONOLOGY\");\n  }\n\n  const cutoff = new Date(`${today}T00:00:00Z`);\n\n  cutoff.setUTCDate(\n    cutoff.getUTCDate() - retentionDays - 1\n  );\n\n  const eligibleThrough =\n    cutoff.toISOString().slice(0,10);\n\n  const boundary =\n    previousBoundary &&\n    previousBoundary > eligibleThrough\n      ? previousBoundary\n      : eligibleThrough;\n\n  const next =\n    JSON.parse(JSON.stringify(registry));\n\n  const removedSlateKeys = [];\n\n  for (const [key,slate] of Object.entries(next.slates)) {\n\n    if (\n      slate.state === \"PROCESSED\" &&\n      slate.slateDate <= boundary\n    ) {\n\n      delete next.slates[key];\n      removedSlateKeys.push(key);\n\n    }\n\n  }\n\n  next.retiredThrough = boundary;\n\n  validateP36RetentionBoundary_(next);\n\n  return {\n    changed:\n      JSON.stringify(next) !== JSON.stringify(registry),\n    registry: next,\n    removedSlateKeys: removedSlateKeys.sort(),\n    retiredThrough: boundary\n  };\n\n}\n\nfunction observeP36RetainedSlate_(\n  registry,\n  slateDate,\n  observedGameIds\n) {\n\n  const boundary =\n    validateP36RetentionBoundary_(registry);\n\n  if (!isValidP36Date_(slateDate)) {\n\n    return {\n      accepted:false,\n      reason:\"INVALID_SLATE_DATE\",\n      registry\n    };\n\n  }\n\n  const key =\n    `${registry.league}:${slateDate}`;\n\n  if (\n    !Object.prototype.hasOwnProperty.call(\n      registry.slates,key\n    ) &&\n    boundary !== null &&\n    slateDate <= boundary\n  ) {\n\n    return {\n      accepted:false,\n      reason:\"HISTORICAL_SLATE_RETIRED\",\n      registry\n    };\n\n  }\n\n  return observeP36Slate_(\n    registry,\n    slateDate,\n    observedGameIds\n  );\n\n}\n\n// ===== pipeline-initialization-gate.cjs =====\n\nfunction evaluateP36PipelineInitialization_(input) {\n\n  const result = {\n    authorized: false,\n    action: \"WAIT\",\n    reason: null,\n    slateKey: null,\n    slateDate: null\n  };\n\n  const reject = (reason,action = \"WAIT\") => ({\n    ...result,\n    reason,\n    action\n  });\n\n  if (\n    !input ||\n    typeof input !== \"object\" ||\n    Array.isArray(input)\n  ) {\n    return reject(\"INVALID_INPUT\",\"BLOCK\");\n  }\n\n  const {\n    registry,\n    slateDate,\n    today,\n    pipelineState,\n    games,\n    scheduleRows,\n    snapshotVerified,\n    scheduleVerified,\n    stateVerified\n  } = input;\n\n  try {\n\n    validateP36SlateRegistry_(registry);\n    validateP36RetentionBoundary_(registry);\n\n  } catch (error) {\n\n    return reject(\"INVALID_REGISTRY\",\"BLOCK\");\n\n  }\n\n  if (\n    !isValidP36Date_(today) ||\n    !isValidP36Date_(slateDate) ||\n    slateDate > today\n  ) {\n    return reject(\"INVALID_SLATE_CHRONOLOGY\",\"BLOCK\");\n  }\n\n  const key = `${registry.league}:${slateDate}`;\n\n  result.slateKey = key;\n  result.slateDate = slateDate;\n\n  const slate = registry.slates[key];\n\n  if (!slate) {\n    return reject(\"SLATE_NOT_FOUND\");\n  }\n\n  if (slate.state === \"PROCESSED\") {\n    return reject(\"SLATE_ALREADY_PROCESSED\",\"STOP\");\n  }\n\n  if (stateVerified !== true) {\n    return reject(\"PIPELINE_STATE_NOT_VERIFIED\",\"BLOCK\");\n  }\n\n  if (\n    !pipelineState ||\n    typeof pipelineState !== \"object\" ||\n    Array.isArray(pipelineState) ||\n    typeof pipelineState.completed !== \"boolean\" ||\n    typeof pipelineState.stage !== \"string\" ||\n    !pipelineState.stage.trim() ||\n    (\n      pipelineState.suspended !== undefined &&\n      typeof pipelineState.suspended !== \"boolean\"\n    ) ||\n    pipelineState.completed !==\n      (pipelineState.stage === \"COMPLETE\")\n  ) {\n    return reject(\"INVALID_PIPELINE_STATE\",\"BLOCK\");\n  }\n\n  if (pipelineState.suspended === true) {\n    return reject(\"PIPELINE_SUSPENDED\",\"BLOCK\");\n  }\n\n  const assignedSlates =\n    Object.values(registry.slates).filter(\n      item => item.state === \"PROCESSING\"\n    );\n\n  if (assignedSlates.length > 0) {\n\n    const assigned = assignedSlates[0];\n\n    if (\n      pipelineState.p36RunId !== assigned.runId ||\n      pipelineState.p36SlateKey !== assigned.slateKey\n    ) {\n      return reject(\"PIPELINE_ASSIGNMENT_MISMATCH\",\"BLOCK\");\n    }\n\n    if (pipelineState.completed) {\n      return reject(\n        \"ASSIGNED_PIPELINE_COMPLETED\",\n        \"RECONCILE\"\n      );\n    }\n\n    return reject(\"PIPELINE_ALREADY_PROCESSING\",\"RESUME\");\n\n  }\n\n  if (!pipelineState.completed) {\n    return reject(\"EXISTING_PIPELINE_UNFINISHED\",\"QUEUE\");\n  }\n\n  if (\n    pipelineState.p36RunId != null ||\n    pipelineState.p36SlateKey != null\n  ) {\n\n    const historical =\n      registry.slates[pipelineState.p36SlateKey];\n\n    if (\n      !historical ||\n      historical.state !== \"PROCESSED\" ||\n      historical.runId !== pipelineState.p36RunId\n    ) {\n      return reject(\n        \"COMPLETED_ASSIGNMENT_NOT_RECONCILED\",\n        \"BLOCK\"\n      );\n    }\n\n  }\n\n  if (slate.state !== \"READY\") {\n    return reject(\"SLATE_NOT_READY\");\n  }\n\n  if (snapshotVerified !== true) {\n    return reject(\"API_SNAPSHOT_NOT_VERIFIED\",\"BLOCK\");\n  }\n\n  if (scheduleVerified !== true) {\n    return reject(\"SCHEDULE_NOT_VERIFIED\",\"BLOCK\");\n  }\n\n  const evaluation =\n    evaluateP36SlateCompletion_(\n      registry.league,\n      slateDate,\n      slate.inventory.expectedGameIds,\n      games,\n      scheduleRows\n    );\n\n  if (!evaluation.ready) {\n    return reject(evaluation.reason,\"WAIT\");\n  }\n\n  return {\n    ...result,\n    authorized: true,\n    action: \"INITIALIZE\",\n    reason: \"PROTECTED_INITIALIZATION_AUTHORIZED\"\n  };\n\n}\n\n// ===== pipeline-initialization-recovery.cjs =====\n\nfunction evaluateP36InitializationRecovery_(input) {\n\n  const result = (action,reason) => ({\n    action,\n    reason,\n    authorized: action === \"SAVE_CHECKPOINT\" ||\n                action === \"COMMIT_ASSIGNMENT\" ||\n                action === \"CLEAR_JOURNAL\"\n  });\n\n  if (!input || typeof input !== \"object\") {\n    return result(\"BLOCK\",\"INVALID_INPUT\");\n  }\n\n  const {\n    league,\n    journal,\n    registry,\n    pipelineState,\n    checkpointVerified,\n    lockHeld\n  } = input;\n\n  if (lockHeld !== true) {\n    return result(\"BLOCK\",\"SCRIPT_LOCK_REQUIRED\");\n  }\n\n  if (![\"NBA\",\"NHL\",\"MLB\",\"NFL\"].includes(league)) {\n    return result(\"BLOCK\",\"INVALID_LEAGUE\");\n  }\n\n  if (journal === null) {\n    return result(\"NO_ACTION\",\"NO_PENDING_INITIALIZATION\");\n  }\n\n  if (\n    !journal ||\n    journal.version !== 1 ||\n    journal.league !== league ||\n    !isValidP36Date_(journal.slateDate) ||\n    journal.slateKey !== `${league}:${journal.slateDate}` ||\n    typeof journal.runId !== \"string\" ||\n    !journal.runId.trim()\n  ) {\n    return result(\"BLOCK\",\"INVALID_JOURNAL\");\n  }\n\n  if (\n    !registry ||\n    registry.league !== league ||\n    !registry.slates\n  ) {\n    return result(\"BLOCK\",\"INVALID_REGISTRY\");\n  }\n\n  if (checkpointVerified !== true) {\n    return result(\"BLOCK\",\"CHECKPOINT_NOT_VERIFIED\");\n  }\n\n  if (\n    !pipelineState ||\n    typeof pipelineState.completed !== \"boolean\" ||\n    typeof pipelineState.stage !== \"string\" ||\n    pipelineState.completed !==\n      (pipelineState.stage === \"COMPLETE\")\n  ) {\n    return result(\"BLOCK\",\"INVALID_CHECKPOINT\");\n  }\n\n  if (pipelineState.suspended === true) {\n    return result(\"BLOCK\",\"PIPELINE_SUSPENDED\");\n  }\n\n  const slate = registry.slates[journal.slateKey];\n\n  if (!slate) {\n    return result(\"BLOCK\",\"JOURNAL_SLATE_NOT_FOUND\");\n  }\n\n  const assigned = Object.values(registry.slates)\n    .filter(item => item.state === \"PROCESSING\");\n\n  if (\n    assigned.some(item =>\n      item.slateKey !== journal.slateKey ||\n      item.runId !== journal.runId\n    )\n  ) {\n    return result(\"BLOCK\",\"CONFLICTING_SLATE_ASSIGNMENT\");\n  }\n\n  const matchingCheckpoint =\n    pipelineState.p36RunId === journal.runId &&\n    pipelineState.p36SlateKey === journal.slateKey;\n\n  const matchingAssignment =\n    slate.state === \"PROCESSING\" &&\n    slate.runId === journal.runId;\n\n  if (matchingCheckpoint && matchingAssignment) {\n    return result(\n      \"CLEAR_JOURNAL\",\n      \"INITIALIZATION_ALREADY_COMMITTED\"\n    );\n  }\n\n  if (slate.state !== \"READY\") {\n    return result(\"BLOCK\",\"UNEXPECTED_SLATE_STATE\");\n  }\n\n  if (matchingCheckpoint) {\n\n    if (pipelineState.completed) {\n      return result(\"BLOCK\",\"UNEXPECTED_COMPLETED_CHECKPOINT\");\n    }\n\n    return result(\n      \"COMMIT_ASSIGNMENT\",\n      \"CHECKPOINT_ALREADY_SAVED\"\n    );\n\n  }\n\n  if (!pipelineState.completed) {\n    return result(\"BLOCK\",\"EXISTING_PIPELINE_UNFINISHED\");\n  }\n\n  return result(\n    \"WAIT\",\n    \"FRESH_INITIALIZATION_AUTHORIZATION_REQUIRED\"\n  );\n\n}\n\n// ===== initialization-journal.cjs =====\n\nfunction getP36JournalKey_(league) {\n\n  if (![\"NBA\",\"NHL\",\"MLB\",\"NFL\"].includes(league)) {\n    throw new Error(\"INVALID_LEAGUE\");\n  }\n\n  return `P36_${league}_INITIALIZATION_JOURNAL_V1`;\n\n}\n\nfunction validateP36Journal_(league,journal) {\n\n  getP36JournalKey_(league);\n\n  if (\n    !journal ||\n    typeof journal !== \"object\" ||\n    Array.isArray(journal) ||\n    journal.version !== 1 ||\n    journal.league !== league ||\n    !isValidP36Date_(journal.slateDate) ||\n    journal.slateKey !== `${league}:${journal.slateDate}` ||\n    typeof journal.runId !== \"string\" ||\n    !journal.runId.trim()\n  ) {\n    throw new Error(\"INVALID_JOURNAL\");\n  }\n\n  return true;\n\n}\n\nfunction loadP36Journal_(league,properties) {\n\n  const key = getP36JournalKey_(league);\n  const raw = properties.getProperty(key);\n\n  if (raw === null) {\n\n    return {\n      key,\n      raw:null,\n      journal:null\n    };\n\n  }\n\n  let journal;\n\n  try {\n\n    journal = JSON.parse(raw);\n\n  } catch (error) {\n\n    throw new Error(\"JOURNAL_JSON_CORRUPTED\");\n\n  }\n\n  validateP36Journal_(league,journal);\n\n  return {key,raw,journal};\n\n}\n\nfunction saveP36Journal_(\n  league,\n  properties,\n  journal,\n  lock\n) {\n\n  if (!lock || lock.hasLock() !== true) {\n    throw new Error(\"SCRIPT_LOCK_REQUIRED\");\n  }\n\n  validateP36Journal_(league,journal);\n\n  const existing =\n    loadP36Journal_(league,properties);\n\n  const raw = JSON.stringify(journal);\n\n  if (existing.raw !== null) {\n\n    if (existing.raw === raw) {\n\n      return {\n        saved:false,\n        reason:\"JOURNAL_UNCHANGED\"\n      };\n\n    }\n\n    throw new Error(\"EXISTING_JOURNAL_CONFLICT\");\n\n  }\n\n  properties.setProperty(existing.key,raw);\n\n  if (properties.getProperty(existing.key) !== raw) {\n\n    throw new Error(\"JOURNAL_WRITE_VERIFICATION_FAILED\");\n\n  }\n\n  return {\n    saved:true,\n    reason:\"JOURNAL_SAVED\"\n  };\n\n}\n\nfunction clearP36Journal_(\n  league,\n  properties,\n  expectedRaw,\n  registry,\n  pipelineState,\n  lock\n) {\n\n  if (!lock || lock.hasLock() !== true) {\n    throw new Error(\"SCRIPT_LOCK_REQUIRED\");\n  }\n\n  const existing =\n    loadP36Journal_(league,properties);\n\n  if (\n    typeof expectedRaw !== \"string\" ||\n    existing.raw !== expectedRaw\n  ) {\n    throw new Error(\"JOURNAL_CONCURRENT_MODIFICATION\");\n  }\n\n  \n\n  validateP36SlateRegistry_(registry);\n\n  const journal = existing.journal;\n\n  const slate =\n    registry.slates[journal.slateKey];\n\n  if (\n    registry.league !== league ||\n    !slate ||\n    slate.state !== \"PROCESSING\" ||\n    slate.runId !== journal.runId ||\n    !pipelineState ||\n    pipelineState.p36RunId !== journal.runId ||\n    pipelineState.p36SlateKey !== journal.slateKey ||\n    typeof pipelineState.completed !== \"boolean\" ||\n    typeof pipelineState.stage !== \"string\" ||\n    !pipelineState.stage.trim() ||\n    pipelineState.completed !==\n      (pipelineState.stage === \"COMPLETE\")\n  ) {\n\n    throw new Error(\"INITIALIZATION_NOT_COMMITTED\");\n\n  }\n\n  properties.deleteProperty(existing.key);\n\n  if (properties.getProperty(existing.key) !== null) {\n\n    throw new Error(\"JOURNAL_DELETE_VERIFICATION_FAILED\");\n\n  }\n\n  return {\n    cleared:true,\n    reason:\"JOURNAL_CLEARED\"\n  };\n\n}\n\n// ===== initialization-coordinator.cjs =====\n\nfunction coordinateP36Initialization_(input,env) {\n\n  const {\n    league,\n    slateDate,\n    today,\n    games,\n    scheduleRows,\n    snapshotVerified,\n    scheduleVerified\n  } = input;\n\n  const {\n    lock,\n    properties,\n    readCheckpoint,\n    validateCheckpoint,\n    createCheckpoint,\n    writeCheckpoint,\n    createRunId,\n    getByteLength\n  } = env;\n\n  const result = (action,reason) => ({\n    action,\n    reason\n  });\n\n  if (!lock.tryLock(5000)) {\n    return result(\"WAIT\",\"SCRIPT_LOCK_UNAVAILABLE\");\n  }\n\n  try {\n\n    let stored = loadP36SlateRegistry_(\n      league,properties\n    );\n\n    let registry = stored.registry;\n\n    validateP36RetentionBoundary_(registry);\n\n    let pending = loadP36Journal_(\n      league,properties\n    );\n\n    let checkpoint = readCheckpoint();\n\n    if (validateCheckpoint(checkpoint) !== true) {\n      throw new Error(\"INVALID_CHECKPOINT\");\n    }\n\n    function commitAssignment() {\n\n      const journal = pending.journal;\n\n      const transition = transitionP36Slate_(\n        registry,\n        journal.slateDate,\n        \"PROCESSING\",\n        {runId:journal.runId}\n      );\n\n      if (!transition.accepted) {\n        throw new Error(transition.reason);\n      }\n\n      saveP36SlateRegistry_(\n        league,\n        properties,\n        transition.registry,\n        stored.raw,\n        getByteLength\n      );\n\n      stored = loadP36SlateRegistry_(\n        league,properties\n      );\n\n      registry = stored.registry;\n\n    }\n\n    function finishInitialization() {\n\n      checkpoint = readCheckpoint();\n\n      if (validateCheckpoint(checkpoint) !== true) {\n        throw new Error(\"INVALID_CHECKPOINT\");\n      }\n\n      registry = loadP36SlateRegistry_(\n        league,properties\n      ).registry;\n\n      clearP36Journal_(\n        league,\n        properties,\n        pending.raw,\n        registry,\n        checkpoint,\n        lock\n      );\n\n      return result(\n        \"INITIALIZED\",\n        \"INITIALIZATION_COMMITTED\"\n      );\n\n    }\n\n    if (pending.journal !== null) {\n\n      const recovery =\n        evaluateP36InitializationRecovery_({\n          league,\n          journal:pending.journal,\n          registry,\n          pipelineState:checkpoint,\n          checkpointVerified:true,\n          lockHeld:lock.hasLock()\n        });\n\n      if (recovery.action === \"BLOCK\") {\n        return recovery;\n      }\n\n      if (recovery.action === \"COMMIT_ASSIGNMENT\") {\n\n        commitAssignment();\n\n        return finishInitialization();\n\n      }\n\n      if (recovery.action === \"CLEAR_JOURNAL\") {\n        return finishInitialization();\n      }\n\n      if (pending.journal.slateDate !== slateDate) {\n\n        return result(\n          \"WAIT\",\n          \"PENDING_INITIALIZATION_REQUIRES_REFRESH\"\n        );\n\n      }\n\n    }\n\n    const decision =\n      evaluateP36PipelineInitialization_({\n        registry,\n        slateDate,\n        today,\n        pipelineState:checkpoint,\n        games,\n        scheduleRows,\n        snapshotVerified,\n        scheduleVerified,\n        stateVerified:true\n      });\n\n    if (!decision.authorized) {\n      return decision;\n    }\n\n    const journal = pending.journal || {\n\n      version:1,\n      league,\n      slateDate,\n      slateKey:decision.slateKey,\n      runId:createRunId()\n\n    };\n\n    const fresh = {\n\n      ...createCheckpoint(),\n\n      p36RunId:journal.runId,\n      p36SlateKey:journal.slateKey\n\n    };\n\n    if (\n      validateCheckpoint(fresh) !== true ||\n      fresh.completed !== false ||\n      fresh.suspended === true ||\n      fresh.stage !== (\n        league === \"NFL\"\n          ? \"TEAM_GAME_LOGS_BY_TEAM\"\n          : \"PLAYER_GAME_LOGS\"\n      )\n    ) {\n\n      throw new Error(\"INVALID_FRESH_CHECKPOINT\");\n\n    }\n\n    const previousRaw = JSON.stringify(checkpoint);\n\n    saveP36Journal_(\n      league,\n      properties,\n      journal,\n      lock\n    );\n\n    pending = loadP36Journal_(\n      league,properties\n    );\n\n    if (\n      JSON.stringify(readCheckpoint()) !==\n      previousRaw\n    ) {\n\n      throw new Error(\n        \"CHECKPOINT_CONCURRENT_MODIFICATION\"\n      );\n\n    }\n\n    writeCheckpoint(fresh);\n\n    checkpoint = readCheckpoint();\n\n    if (\n      validateCheckpoint(checkpoint) !== true ||\n      checkpoint.p36RunId !== journal.runId ||\n      checkpoint.p36SlateKey !== journal.slateKey ||\n      checkpoint.completed !== false ||\n      checkpoint.stage !== fresh.stage ||\n      checkpoint.suspended === true\n    ) {\n\n      throw new Error(\n        \"CHECKPOINT_WRITE_VERIFICATION_FAILED\"\n      );\n\n    }\n\n    commitAssignment();\n\n    return finishInitialization();\n\n  } finally {\n\n    lock.releaseLock();\n\n  }\n\n}\n\n\n\n\nfunction fetchP36VerifiedNBASlate_(slateDate) {\n\n  if (!isValidP36Date_(slateDate)) {\n    throw new Error(\"P36_NBA_INVALID_SLATE_DATE\");\n  }\n\n  const games = [];\n  const gameIds = new Set();\n  const seenCursors = new Set();\n\n  let cursor = null;\n  let pages = 0;\n\n  const maxPages = 20;\n\n  do {\n\n    if (pages >= maxPages) {\n      throw new Error(\"P36_NBA_PAGINATION_LIMIT\");\n    }\n\n    const params = {\n      \"dates[]\": slateDate,\n      per_page: 100\n    };\n\n    if (cursor !== null) {\n      params.cursor = cursor;\n    }\n\n    const response = fetchApi_(\n      \"/nba/v1/games\",\n      params\n    );\n\n    pages++;\n\n    if (\n      !response ||\n      typeof response !== \"object\" ||\n      !Array.isArray(response.data) ||\n      !response.meta ||\n      typeof response.meta !== \"object\" ||\n      Array.isArray(response.meta) ||\n      !Object.prototype.hasOwnProperty.call(\n        response.meta,\n        \"next_cursor\"\n      )\n    ) {\n\n      throw new Error(\"P36_NBA_INVALID_API_RESPONSE\");\n\n    }\n\n    for (const game of response.data) {\n\n      if (\n        !game ||\n        typeof game !== \"object\" ||\n        Array.isArray(game)\n      ) {\n\n        throw new Error(\"P36_NBA_INVALID_GAME\");\n\n      }\n\n      const id = typeof game.id === \"number\"\n        && Number.isSafeInteger(game.id)\n        ? String(game.id)\n        : typeof game.id === \"string\"\n          ? game.id.trim()\n          : \"\";\n\n      if (!/^[1-9]\\d*$/.test(id)) {\n        throw new Error(\"P36_NBA_INVALID_GAME_ID\");\n      }\n\n      if (gameIds.has(id)) {\n        throw new Error(\"P36_NBA_DUPLICATE_GAME_ID\");\n      }\n\n      if (\n        !isValidP36Date_(game.date) ||\n        game.date !== slateDate\n      ) {\n\n        throw new Error(\"P36_NBA_SLATE_DATE_MISMATCH\");\n\n      }\n\n      gameIds.add(id);\n      games.push(game);\n\n    }\n\n    const nextCursor = response.meta.next_cursor;\n\n    if (nextCursor === null) {\n\n      cursor = null;\n\n    } else {\n\n      if (\n        !(\n          (\n            typeof nextCursor === \"number\" &&\n            Number.isSafeInteger(nextCursor) &&\n            nextCursor > 0\n          ) ||\n          (\n            typeof nextCursor === \"string\" &&\n            nextCursor.trim().length > 0\n          )\n        )\n      ) {\n\n        throw new Error(\"P36_NBA_INVALID_CURSOR\");\n\n      }\n\n      const cursorKey = String(nextCursor).trim();\n\n      if (seenCursors.has(cursorKey)) {\n        throw new Error(\"P36_NBA_REPEATED_CURSOR\");\n      }\n\n      if (response.data.length === 0) {\n        throw new Error(\"P36_NBA_EMPTY_PAGINATION_PAGE\");\n      }\n\n      seenCursors.add(cursorKey);\n\n      cursor = nextCursor;\n\n    }\n\n  } while (cursor !== null);\n\n  return {\n    league: \"NBA\",\n    slateDate,\n    games,\n    pages,\n    snapshotVerified: true\n  };\n\n}\n\n\nfunction trackP36NBASlateLocked_(\n  slateDate,\n  sheet,\n  properties,\n  lock,\n  verifiedSnapshot = null\n) {\n\n  if (!lock || lock.hasLock() !== true) {\n    throw new Error(\"P36_NBA_SCRIPT_LOCK_REQUIRED\");\n  }\n\n  if (!isValidP36Date_(slateDate)) {\n    throw new Error(\"P36_NBA_INVALID_SLATE_DATE\");\n  }\n\n  const stored = loadP36SlateRegistry_(\n    \"NBA\",\n    properties\n  );\n\n  validateP36RetentionBoundary_(\n    stored.registry\n  );\n\n  const snapshot =\n    verifiedSnapshot === null\n      ? fetchP36VerifiedNBASlate_(slateDate)\n      : verifiedSnapshot;\n\n  if (\n    !snapshot ||\n    snapshot.snapshotVerified !== true ||\n    snapshot.slateDate !== slateDate ||\n    snapshot.league !== \"NBA\" ||\n    !Array.isArray(snapshot.games)\n  ) {\n\n    throw new Error(\"P36_NBA_UNVERIFIED_SNAPSHOT\");\n\n  }\n\n  const games = snapshot.games;\n\n  const observedIds = games.map(\n    game => game.id\n  );\n\n  const observation =\n    observeP36RetainedSlate_(\n      stored.registry,\n      slateDate,\n      observedIds\n    );\n\n  if (!observation.accepted) {\n\n    return {\n      ready:false,\n      reason:observation.reason,\n      slateDate\n    };\n\n  }\n\n  let registry = observation.registry;\n\n  const slateKey = `NBA:${slateDate}`;\n\n  const slate = registry.slates[slateKey];\n\n  if (\n    slate.state === \"PROCESSING\" ||\n    slate.state === \"PROCESSED\"\n  ) {\n\n    return {\n      ready:false,\n      reason:\"SLATE_ALREADY_ASSIGNED\",\n      slateDate\n    };\n\n  }\n\n  // Persist the expected inventory before\n  // trusting Schedule completion evidence.\n\n  const inventoryWrite =\n    saveP36SlateRegistry_(\n      \"NBA\",\n      properties,\n      registry,\n      stored.raw,\n      value => Utilities.newBlob(value)\n        .getBytes().length\n    );\n\n  const headers = sheet\n    .getRange(1,1,1,10)\n    .getDisplayValues()[0];\n\n  const expectedHeaders = [\n    \"Game Id\",\n    \"Game Date\",\n    \"Away Team\",\n    \"Home Team\",\n    \"Status\",\n    \"Season\",\n    \"Postseason\",\n    \"Start Time\",\n    \"Home Team Id\",\n    \"Away Team Id\"\n  ];\n\n  if (\n    JSON.stringify(headers) !==\n    JSON.stringify(expectedHeaders)\n  ) {\n\n    return {\n      ready:false,\n      reason:\"SCHEDULE_HEADER_MISMATCH\",\n      slateDate\n    };\n\n  }\n\n  const lastRow = sheet.getLastRow();\n\n  const values = lastRow > 1\n\n    ? sheet\n        .getRange(2,1,lastRow-1,5)\n        .getDisplayValues()\n\n    : [];\n\n  const scheduleRows = [];\n\n  for (const row of values) {\n\n    if (!row.some(value => String(value).trim())) {\n      continue;\n    }\n\n    const id = String(row[0]).trim();\n\n    if (!/^[1-9]\\d*$/.test(id)) {\n\n      return {\n        ready:false,\n        reason:\"INVALID_SCHEDULE_GAME_ID\",\n        slateDate\n      };\n\n    }\n\n    scheduleRows.push({\n      gameId:id,\n      status:row[4]\n    });\n\n  }\n\n  const evaluation =\n    evaluateP36SlateCompletion_(\n      \"NBA\",\n      slateDate,\n      slate.inventory.expectedGameIds,\n      games,\n      scheduleRows\n    );\n\n  if (!evaluation.ready) {\n    return evaluation;\n  }\n\n  const transition =\n    transitionP36Slate_(\n      registry,\n      slateDate,\n      \"READY\",\n      {evaluation}\n    );\n\n  if (!transition.accepted) {\n\n    throw new Error(\n      transition.reason\n    );\n\n  }\n\n  saveP36SlateRegistry_(\n    \"NBA\",\n    properties,\n    transition.registry,\n    inventoryWrite.raw,\n    value => Utilities.newBlob(value)\n      .getBytes().length\n  );\n\n  return evaluation;\n\n}\n\n\n\n\n\nfunction readP36NBAScheduleEvidenceLocked_(\n  lock,\n  slateDate,\n  sheet\n) {\n\n  if (!lock || lock.hasLock() !== true) {\n\n    throw new Error(\n      \"P36_NBA_SCRIPT_LOCK_REQUIRED\"\n    );\n\n  }\n\n  if (!isValidP36Date_(slateDate)) {\n\n    throw new Error(\n      \"P36_NBA_INVALID_SLATE_DATE\"\n    );\n\n  }\n\n  const reject = reason => ({\n    verified:false,\n    reason,\n    scheduleRows:[]\n  });\n\n  if (!sheet) {\n    return reject(\"SCHEDULE_SHEET_MISSING\");\n  }\n\n  const expectedHeaders = [\n    \"Game Id\",\n    \"Game Date\",\n    \"Away Team\",\n    \"Home Team\",\n    \"Status\",\n    \"Season\",\n    \"Postseason\",\n    \"Start Time\",\n    \"Home Team Id\",\n    \"Away Team Id\"\n  ];\n\n  const headers = sheet\n    .getRange(1,1,1,10)\n    .getDisplayValues()[0];\n\n  if (\n    JSON.stringify(headers) !==\n    JSON.stringify(expectedHeaders)\n  ) {\n    return reject(\"SCHEDULE_HEADER_MISMATCH\");\n  }\n\n  const lastRow = sheet.getLastRow();\n\n  if (lastRow <= 1) {\n    return reject(\"EMPTY_SCHEDULE\");\n  }\n\n  const range = sheet.getRange(\n    2,1,lastRow-1,5\n  );\n\n  const values = range.getValues();\n  const displayed = range.getDisplayValues();\n\n  const timezone = sheet\n    .getParent()\n    .getSpreadsheetTimeZone();\n\n  const scheduleRows = [];\n  const observedIds = new Set();\n\n  for (let index = 0; index < values.length; index++) {\n\n    const row = values[index];\n    const displayRow = displayed[index];\n\n    if (\n      !displayRow.some(\n        value => String(value).trim()\n      )\n    ) {\n      continue;\n    }\n\n    const id = String(displayRow[0]).trim();\n\n    if (!/^[1-9]\\d*$/.test(id)) {\n      return reject(\"INVALID_SCHEDULE_GAME_ID\");\n    }\n\n    if (observedIds.has(id)) {\n      return reject(\"DUPLICATE_SCHEDULE_GAME_ID\");\n    }\n\n    const rawDate = row[1];\n\n    let date = null;\n\n    if (\n      rawDate instanceof Date &&\n      Number.isFinite(rawDate.getTime())\n    ) {\n\n      date = Utilities.formatDate(\n        rawDate,\n        timezone,\n        \"yyyy-MM-dd\"\n      );\n\n    } else if (\n      typeof rawDate === \"string\" &&\n      isValidP36Date_(rawDate.trim())\n    ) {\n\n      date = rawDate.trim();\n\n    }\n\n    if (date !== slateDate) {\n\n      return reject(\n        \"SCHEDULE_SLATE_DATE_MISMATCH\"\n      );\n\n    }\n\n    observedIds.add(id);\n\n    scheduleRows.push({\n      gameId:id,\n      status:displayRow[4]\n    });\n\n  }\n\n  if (scheduleRows.length === 0) {\n    return reject(\"EMPTY_SCHEDULE\");\n  }\n\n  return {\n    verified:true,\n    reason:\"SCHEDULE_EVIDENCE_VERIFIED\",\n    scheduleRows\n  };\n\n}\n\n\nfunction authorizeP36NBAInitializationLocked_(\n  lock,\n  slateDate\n) {\n\n  if (!lock || lock.hasLock() !== true) {\n\n    throw new Error(\n      \"P36_NBA_SCRIPT_LOCK_REQUIRED\"\n    );\n\n  }\n\n  const reject = (\n    reason,\n    action = \"WAIT\"\n  ) => ({\n    authorized:false,\n    action,\n    reason,\n    slateDate\n  });\n\n  const today = getTodayString_();\n\n  if (\n    !isValidP36Date_(today) ||\n    !isValidP36Date_(slateDate) ||\n    slateDate > today\n  ) {\n\n    return reject(\n      \"INVALID_SLATE_CHRONOLOGY\",\n      \"BLOCK\"\n    );\n\n  }\n\n  const properties =\n    PropertiesService.getScriptProperties();\n\n  const previous =\n    readP36NBACheckpointLocked_(lock);\n\n  if (!previous.exists) {\n\n    return reject(\n      \"CHECKPOINT_MISSING\",\n      \"BLOCK\"\n    );\n\n  }\n\n  if (previous.state.suspended === true) {\n\n    return reject(\n      \"PIPELINE_SUSPENDED\",\n      \"BLOCK\"\n    );\n\n  }\n\n  if (previous.state.completed !== true) {\n\n    return reject(\n      \"EXISTING_PIPELINE_UNFINISHED\",\n      \"QUEUE\"\n    );\n\n  }\n\n  const stored =\n    loadP36SlateRegistry_(\n      \"NBA\",properties\n    );\n\n  validateP36RetentionBoundary_(\n    stored.registry\n  );\n\n  const slateKey = \"NBA:\" + slateDate;\n\n  const existingSlate =\n    stored.registry.slates[slateKey];\n\n  if (\n    existingSlate &&\n    existingSlate.state === \"PROCESSED\"\n  ) {\n\n    return reject(\n      \"SLATE_ALREADY_PROCESSED\",\n      \"STOP\"\n    );\n\n  }\n\n  if (\n    Object.values(stored.registry.slates)\n      .some(item => item.state === \"PROCESSING\")\n  ) {\n\n    return reject(\n      \"EXISTING_ASSIGNMENT_REQUIRES_RECONCILIATION\",\n      \"RECONCILE\"\n    );\n\n  }\n\n  if (previous.state.p36SlateKey) {\n\n    const assigned =\n      stored.registry.slates[\n        previous.state.p36SlateKey\n      ];\n\n    if (\n      !assigned ||\n      assigned.state !== \"PROCESSED\" ||\n      assigned.runId !== previous.state.p36RunId\n    ) {\n\n      return reject(\n        \"COMPLETED_ASSIGNMENT_NOT_RECONCILED\",\n        \"BLOCK\"\n      );\n\n    }\n\n  }\n\n  const ss = SpreadsheetApp.getActiveSpreadsheet();\n\n  const sheetName =\n    slateDate === today\n      ? \"Schedule\"\n      : \"P36 Schedule History\";\n\n  let sheet = ss.getSheetByName(sheetName);\n\n  if (!sheet && slateDate !== today) {\n\n    sheet = ss.insertSheet(sheetName);\n\n    sheet.hideSheet();\n\n  }\n\n  if (!sheet) {\n\n    return reject(\n      \"SCHEDULE_SHEET_MISSING\",\n      \"BLOCK\"\n    );\n\n  }\n\n  const refreshedSchedule =\n    refreshP36NBASlateSheetLocked_(\n      lock,\n      slateDate,\n      sheetName,\n      true\n    );\n\n  if (\n    !refreshedSchedule ||\n    typeof refreshedSchedule !== \"object\" ||\n    !refreshedSchedule.evaluation\n  ) {\n\n    return reject(\n      \"FRESH_SCHEDULE_EVIDENCE_MISSING\",\n      \"BLOCK\"\n    );\n\n  }\n\n  const evaluation =\n    refreshedSchedule.evaluation;\n\n  if (\n    !evaluation ||\n    evaluation.ready !== true ||\n    evaluation.reason !== \"SLATE_COMPLETE\" ||\n    evaluation.slateDate !== slateDate\n  ) {\n\n    return reject(\n      evaluation && evaluation.reason\n        ? evaluation.reason\n        : \"FRESH_COMPLETION_NOT_VERIFIED\"\n    );\n\n  }\n\n  // Reuse the verified API snapshot from this locked\n  // Schedule refresh. Independently verify sheet readback.\n  // Never authorize from a historical READY record.\n\n  const snapshot =\n    refreshedSchedule.snapshot;\n\n  if (\n    !snapshot ||\n    snapshot.snapshotVerified !== true ||\n    snapshot.league !== \"NBA\" ||\n    snapshot.slateDate !== slateDate ||\n    !Array.isArray(snapshot.games)\n  ) {\n\n    return reject(\n      \"API_SNAPSHOT_NOT_VERIFIED\",\n      \"BLOCK\"\n    );\n\n  }\n\n  const evidence =\n    readP36NBAScheduleEvidenceLocked_(\n      lock,\n      slateDate,\n      sheet\n    );\n\n  if (evidence.verified !== true) {\n\n    return reject(evidence.reason);\n\n  }\n\n  const current =\n    readP36NBACheckpointLocked_(lock);\n\n  if (\n    !current.exists ||\n    current.raw !== previous.raw\n  ) {\n\n    return reject(\n      \"CHECKPOINT_CONCURRENT_MODIFICATION\",\n      \"BLOCK\"\n    );\n\n  }\n\n  const refreshed =\n    loadP36SlateRegistry_(\n      \"NBA\",properties\n    );\n\n  const decision =\n    evaluateP36PipelineInitialization_({\n\n      registry:refreshed.registry,\n      slateDate,\n      today:getTodayString_(),\n      pipelineState:current.state,\n      games:snapshot.games,\n      scheduleRows:evidence.scheduleRows,\n      snapshotVerified:true,\n      scheduleVerified:true,\n      stateVerified:true\n\n    });\n\n  if (decision.authorized !== true) {\n\n    return decision;\n\n  }\n\n  return {\n    ...decision,\n    checkpointRaw:current.raw,\n    registryRaw:refreshed.raw\n  };\n\n}\n\n\nfunction refreshP36NBASlateSheetLocked_(\n  lock,\n  today,\n  sheetName,\n  includeVerifiedSnapshot = false\n) {\n\n  if (!lock || lock.hasLock() !== true) {\n    throw new Error(\"P36_NBA_SCRIPT_LOCK_REQUIRED\");\n  }\n\n  const ss = SpreadsheetApp.getActiveSpreadsheet();\n  const sheet = ss.getSheetByName(sheetName);\n\n  if (!sheet) {\n    throw new Error(`Sheet \"${sheetName}\" not found.`);\n  }\n\n  if (!isValidP36Date_(today)) {\n    throw new Error(\"P36_NBA_INVALID_SLATE_DATE\");\n  }\n  Logger.log(`Refreshing NBA schedule for ${today}...`);\n\n  const snapshot = fetchP36VerifiedNBASlate_(today);\n  const games = snapshot.games;\n\n  const headers = [\n    \"Game Id\",\n    \"Game Date\",\n    \"Away Team\",\n    \"Home Team\",\n    \"Status\",\n    \"Season\",\n    \"Postseason\",\n    \"Start Time\",\n    \"Home Team Id\",\n    \"Away Team Id\"\n  ];\n\n  const rows = games.map(game => {\n    return [\n      game.id || \"\",                                           // A Game Id\n      game.date || today,                                      // B Game Date\n      (game.visitor_team && game.visitor_team.full_name) || \"\",// C Away Team\n      (game.home_team && game.home_team.full_name) || \"\",      // D Home Team\n      getP36ScheduleStatus_(\"NBA\", game),                                       // E Status\n      game.season || \"\",                                       // F Season\n      game.postseason || \"\",                                   // G Postseason\n      game.time || game.date || \"\",                            // H Start Time\n      (game.home_team && game.home_team.id) || \"\",            // I Home Team Id\n      (game.visitor_team && game.visitor_team.id) || \"\"       // J Away Team Id\n    ];\n  });\n\n  clearScheduleSheet_(sheet, 10);\n\n  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);\n\n  if (rows.length > 0) {\n    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);\n  }\n\n  SpreadsheetApp.flush();\n\n  const evaluation = trackP36NBASlateLocked_(\n    today,\n    sheet,\n    PropertiesService.getScriptProperties(),\n    lock,\n    snapshot\n  );\n\n  Logger.log(`Wrote ${rows.length} NBA games to \"${sheetName}\"`);\n\n  Logger.log(\n    \"P36 NBA SLATE EVALUATION: \" +\n    JSON.stringify(evaluation)\n  );\n\n  if (includeVerifiedSnapshot === true) {\n\n    return {\n      evaluation,\n      snapshot\n    };\n\n  }\n\n  return evaluation;\n}\n\n";

const today = "2026-11-16";
const historicalDate = "2026-11-15";

function fixture() {

  const f = {

    locked:true,
    fetchCalls:0,
    checkpointReads:0,
    checkpointWrites:0,
    registryWrites:0,
    flushCalls:0,
    apiFailure:false,
    checkpointMutation:false,
    invalidSnapshot:false,
    removeReadbackRow:false,
    wrongReadbackDate:false,
    wrongReadbackStatus:false,

    games:[
      {id:1,status:"Final",status_state:"final"},
      {id:2,status:"Final",status_state:"final"}
    ]

  };

  const checkpoint = {

    runDate:today,
    stage:"COMPLETE",
    completed:true

  };

  let checkpointRaw = JSON.stringify(checkpoint);

  const storage = new Map();

  const properties = {

    getProperty:key =>
      storage.has(key)
        ? storage.get(key)
        : null,

    setProperty:(key,value) => {

      f.registryWrites++;

      storage.set(key,String(value));

    }

  };

  const lock = {

    hasLock:() => f.locked

  };

  const sheets = new Map();

  function makeSheet(name) {

    let cells = [];

    const sheet = {

      name,

      hidden:false,

      getParent:() => spreadsheet,

      hideSheet:() => {
        sheet.hidden = true;
      },

      getLastRow:() => cells.length,

      getMaxRows:() => 1000,

      getRange:(row,column,numRows,numColumns) => {

        function read() {

          return Array.from(
            {length:numRows},

            (_,r) => Array.from(
              {length:numColumns},

              (_,c) =>
                cells[row+r-1]?.[column+c-1] ?? ""
            )
          );

        }

        return {

          setValues:values => {

            values.forEach((valuesRow,r) => {

              const index = row+r-1;

              cells[index] ||= [];

              valuesRow.forEach((value,c) => {

                cells[index][column+c-1] = value;

              });

            });

          },

          getValues:read,

          getDisplayValues:() =>
            read().map(valuesRow =>
              valuesRow.map(value => String(value))
            )

        };

      },

      clear:() => {
        cells = [];
      },

      alterReadback:() => {

        if (f.removeReadbackRow) {
          cells.pop();
        }

        if (f.wrongReadbackDate && cells[1]) {
          cells[1][1] = "2026-11-14";
        }

        if (f.wrongReadbackStatus && cells[1]) {
          cells[1][4] = "In Progress";
        }

      }

    };

    sheets.set(name,sheet);

    return sheet;

  }

  const spreadsheet = {

    getSheetByName:name =>
      sheets.get(name) || null,

    insertSheet:makeSheet,

    getSpreadsheetTimeZone:() =>
      "America/Phoenix"

  };

  makeSheet("Schedule");

  const context = vm.createContext({

    Date,

    Logger:{
      log:() => {}
    },

    getTodayString_:() => today,

    PropertiesService:{

      getScriptProperties:() => properties

    },

    SpreadsheetApp:{

      getActiveSpreadsheet:() => spreadsheet,

      flush:() => {

        f.flushCalls++;

        for (const sheet of sheets.values()) {

          sheet.alterReadback();

        }

      }

    },

    Utilities:{

      newBlob:value => ({

        getBytes:() =>
          Array.from(Buffer.from(value,"utf8"))

      })

    },

    clearScheduleSheet_:sheet => {
      sheet.clear();
    },

    readP36NBACheckpointLocked_:receivedLock => {

      assert.equal(receivedLock.hasLock(),true);

      f.checkpointReads++;

      if (
        f.checkpointMutation &&
        f.checkpointReads > 1
      ) {

        checkpointRaw = JSON.stringify({
          ...JSON.parse(checkpointRaw),
          lastError:"Concurrent mutation"
        });

      }

      return {

        exists:true,

        raw:checkpointRaw,

        state:JSON.parse(checkpointRaw)

      };

    }

  });

  vm.runInContext(businessLogic,context);

  // Replace only the external API snapshot boundary.
  // The writer, tracker and authorization gate remain real.

  context.fetchP36VerifiedNBASlate_ = date => {

    f.fetchCalls++;

    if (f.apiFailure) {
      throw new Error("MOCK_API_FAILURE");
    }

    return {

      league:"NBA",

      slateDate:date,

      snapshotVerified:!f.invalidSnapshot,

      games:f.games.map(game => ({
        ...game,
        date
      }))

    };

  };

  f.context = context;
  f.properties = properties;
  f.lock = lock;
  f.sheets = sheets;

  f.authorize = (date = today) =>

    context.authorizeP36NBAInitializationLocked_(
      lock,date
    );

  f.refresh = (
    includeSnapshot = false,
    date = today
  ) =>

    context.refreshP36NBASlateSheetLocked_(
      lock,date,"Schedule",includeSnapshot
    );

  f.registry = () =>

    context.loadP36SlateRegistry_(
      "NBA",properties
    ).registry;

  f.makeCheckpointUnfinished = () => {

    checkpointRaw = JSON.stringify({

      ...checkpoint,

      completed:false,

      stage:"PLAYER_GAME_LOGS"

    });

  };

  return f;

}

const cases = [

  ["Completed slate authorizes with one snapshot",() => {

    const f = fixture();

    const result = f.authorize();

    assert.equal(result.authorized,true);
    assert.equal(result.action,"INITIALIZE");
    assert.equal(f.fetchCalls,1);

  }],

  ["Default writer return remains compatible",() => {

    const f = fixture();

    const result = f.refresh();

    assert.equal(result.ready,true);
    assert.equal(result.reason,"SLATE_COMPLETE");
    assert.equal(result.snapshot,undefined);
    assert.equal(f.fetchCalls,1);

  }],

  ["Optional writer return includes verified snapshot",() => {

    const f = fixture();

    const result = f.refresh(true);

    assert.equal(result.evaluation.ready,true);
    assert.equal(result.snapshot.snapshotVerified,true);
    assert.equal(result.snapshot.games.length,2);
    assert.equal(f.fetchCalls,1);

  }],

  ["Tracker records the correct READY inventory",() => {

    const f = fixture();

    f.authorize();

    const slate = f.registry().slates["NBA:"+today];

    assert.equal(slate.state,"READY");

    assert.equal(
      slate.inventory.expectedGameIds.join(","),
      "1,2"
    );

  }],

  ["One unfinished game prevents authorization",() => {

    const f = fixture();

    f.games[1].status = "Q4";
    f.games[1].status_state = "in_progress";

    const result = f.authorize();

    assert.equal(result.authorized,false);
    assert.equal(f.fetchCalls,1);

  }],

  ["Postponed game prevents authorization",() => {

    const f = fixture();

    f.games[1].status = "Postponed";
    f.games[1].status_state = "scheduled";

    assert.equal(f.authorize().authorized,false);
    assert.equal(f.fetchCalls,1);

  }],

  ["Empty slate prevents authorization",() => {

    const f = fixture();

    f.games = [];

    assert.equal(f.authorize().authorized,false);
    assert.equal(f.fetchCalls,1);

  }],

  ["API failure prevents authorization",() => {

    const f = fixture();

    f.apiFailure = true;

    assert.throws(
      f.authorize,
      /MOCK_API_FAILURE/
    );

    assert.equal(f.fetchCalls,1);

  }],

  ["Unverified snapshot fails closed",() => {

    const f = fixture();

    f.invalidSnapshot = true;

    let authorized = false;

    try {

      authorized =
        f.authorize().authorized === true;

    } catch (error) {

      assert.match(
        String(error),
        /SNAPSHOT|snapshot/i
      );

    }

    assert.equal(authorized,false);
    assert.equal(f.fetchCalls,1);

  }],

  ["Missing Schedule readback game blocks authorization",() => {

    const f = fixture();

    f.removeReadbackRow = true;

    assert.equal(f.authorize().authorized,false);
    assert.equal(f.fetchCalls,1);

  }],

  ["Wrong Schedule readback date blocks authorization",() => {

    const f = fixture();

    f.wrongReadbackDate = true;

    const result = f.authorize();

    assert.equal(result.authorized,false);

    assert.equal(
      result.reason,
      "SCHEDULE_SLATE_DATE_MISMATCH"
    );

  }],

  ["Wrong Schedule status blocks authorization",() => {

    const f = fixture();

    f.wrongReadbackStatus = true;

    assert.equal(f.authorize().authorized,false);

  }],

  ["Unfinished checkpoint prevents unnecessary API request",() => {

    const f = fixture();

    f.makeCheckpointUnfinished();

    const result = f.authorize();

    assert.equal(result.authorized,false);
    assert.equal(result.action,"QUEUE");
    assert.equal(f.fetchCalls,0);

  }],

  ["Concurrent checkpoint modification blocks authorization",() => {

    const f = fixture();

    f.checkpointMutation = true;

    const result = f.authorize();

    assert.equal(result.authorized,false);

    assert.equal(
      result.reason,
      "CHECKPOINT_CONCURRENT_MODIFICATION"
    );

  }],

  ["Missing lock prevents API request",() => {

    const f = fixture();

    f.locked = false;

    assert.throws(
      f.authorize,
      /SCRIPT_LOCK_REQUIRED/
    );

    assert.equal(f.fetchCalls,0);

  }],

  ["Historical slate uses hidden Schedule workspace",() => {

    const f = fixture();

    const result = f.authorize(historicalDate);

    assert.equal(result.authorized,true);
    assert.equal(f.fetchCalls,1);

    const sheet = f.sheets.get(
      "P36 Schedule History"
    );

    assert.equal(sheet.hidden,true);

    assert.equal(
      f.sheets.get("Schedule").getLastRow(),
      0
    );

  }],

  ["Previously READY slate requires fresh completion",() => {

    const f = fixture();

    assert.equal(f.authorize().authorized,true);

    f.games[1].status = "Q4";
    f.games[1].status_state = "in_progress";

    assert.equal(f.authorize().authorized,false);

    assert.equal(f.fetchCalls,2);

  }],

  ["Previously observed missing game prevents authorization",() => {

    const f = fixture();

    assert.equal(f.authorize().authorized,true);

    f.games.pop();

    assert.equal(f.authorize().authorized,false);
    assert.equal(f.fetchCalls,2);

  }],

  ["Expanded inventory is verified before authorization",() => {

    const f = fixture();

    assert.equal(f.authorize().authorized,true);

    f.games.push({

      id:3,

      status:"Final",

      status_state:"final"

    });

    assert.equal(f.authorize().authorized,true);

    const slate = f.registry().slates["NBA:"+today];

    assert.equal(
      slate.inventory.expectedGameIds.length,
      3
    );

    assert.equal(f.fetchCalls,2);

  }],

  ["Fresh authorization preserves pipeline checkpoint",() => {

    const f = fixture();

    f.authorize();

    assert.equal(f.checkpointWrites,0);

  }]

];

let passed = 0;

for (const [name,test] of cases) {

  try {

    test();

    passed++;

    console.log("PASS | "+name);

  } catch (error) {

    console.log("FAIL | "+name);

    console.log(String(error.stack || error));

  }

}

assert.equal(
  hash(fs.readFileSync(sourcePath)),
  expectedHash
);

console.log("\nASSERTIONS:",cases.length);
console.log("PASS:",passed);
console.log("FAIL:",cases.length-passed);
console.log("EXECUTION ENVIRONMENT: LOCAL MOCK");

console.log(
  "STATUS:",
  passed === cases.length ? "PASS" : "FAIL"
);

if (passed !== cases.length) {

  process.exitCode = 1;

}
