"use strict";

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

module.exports = {
  isValidP36Date_,
  getP36GameSlateDate_,
  groupP36GamesBySlate_
};
