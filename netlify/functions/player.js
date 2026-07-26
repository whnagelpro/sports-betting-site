// ======================================================
// Sportacular Analytics
// Universal Player Endpoint
// ======================================================

import { DATA_SOURCES } from "./lib/config.js";

import { loadCSV } from "./lib/csv.js";

import { loadSeasonStats } from "./lib/seasonStats.js";

import { loadPlayerContext } from "./lib/playerContext.js";

import { mapPlayer } from "./lib/mappers/player.js";

import { success, badRequest, serverError, notFound } from "./lib/response.js";

import { loadGameLogs } from "./lib/gameLogs.js";

import { loadTrends } from "./lib/trends.js";

import { loadPlayerProps } from "./lib/playerProps.js";

import { loadGameOdds } from "./lib/gameOdds.js";

export async function handler(event) {

    try {

        const league = (
            event.queryStringParameters?.league || ""
        ).toLowerCase();

        const id = event.queryStringParameters?.id;

        if (!league) {

            return badRequest(
                "Missing league."
            );

        }

        if (!id) {

            return badRequest(
                "Missing player id."
            );

        }

        const source = DATA_SOURCES[league];

        if (!source) {

            return badRequest(
                "Unsupported league."
            );

        }

        // ----------------------------
        // Load CSV data
        // ----------------------------

        console.log("Loading roster...");
const roster = await loadCSV(source.roster);
console.log("✓ roster", roster.length);

console.log("Loading season stats...");
const seasonRows = await loadSeasonStats(source.seasonStats);
console.log("✓ season", seasonRows.length);

console.log("Loading game logs...");
const gameLogRows = await loadGameLogs(source.gameLogs);
console.log("✓ game logs", gameLogRows.length);

console.log("Loading trends...");
const trendRows = await loadTrends(source.trends);
console.log("✓ trends", trendRows.length);

console.log("Loading game odds...");
const gameOddsRows = await loadGameOdds(source.gameOdds);
console.log("✓ game odds", gameOddsRows.length);

console.log("Loading props...");
const playerPropRows = await loadPlayerProps(source.playerProps);
console.log("✓ props", playerPropRows.length);

console.log("Building context...");
const context = loadPlayerContext({
    playerId: id,
    roster,
    seasonRows,
    gameLogRows,
    trendRows,
    gameOddsRows,
    playerPropRows
});
console.log("✓ context built");

        if (!context) {

            return notFound(
                "Player not found."
            );

        }

        // ----------------------------
        // Build player object
        // ----------------------------

        const player = {
  profile: context.profile,
  season: context.seasonStats,
  matchup: context.matchup,
  props: context.props,
  trends: context.trends,
  gameLogs: context.gameLogs,
  quickStats: [],
  analytics: {}
};

        return success(player);

    }

    catch (error) {

        console.error(error);

        return serverError(error);

    }

}