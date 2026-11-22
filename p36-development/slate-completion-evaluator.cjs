"use strict";

const {
  normalizeP36GameStatus_
} = require("./game-status-normalizer.cjs");

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

module.exports = {
  evaluateP36SlateCompletion_
};
