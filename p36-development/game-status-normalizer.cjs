"use strict";

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

module.exports = { normalizeP36GameStatus_ };
