"use strict";

const {
  normalizeP36GameStatus_
} = require("./game-status-normalizer.cjs");

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

module.exports = {
  getP36ScheduleStatus_
};
