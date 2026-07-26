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

        const roster = await loadCSV(
            source.roster
        );

        const seasonRows =
            await loadSeasonStats(
                source.seasonStats
            );

        const gameLogRows =
            await loadGameLogs(
                source.gameLogs
            );

        const trendRows =
            await loadTrends(
                source.trends
            );

        const gameOddsRows =
            await loadGameOdds(
                source.gameOdds
            );

        const playerPropRows =
            await loadPlayerProps(
                source.playerProps
            );

        // ----------------------------
        // Load player context
        // ----------------------------

        const context = loadPlayerContext({

            playerId: id,

            roster,

            seasonRows,

            gameLogRows,

            trendRows,

            gameOddsRows,

            playerPropRows

        });

        if (!context) {

            return notFound(
                "Player not found."
            );

        }

        // ----------------------------
        // Build player object
        // ----------------------------

        const player = mapPlayer(

            context,

            league

        );

        return success(player);

    }

    catch (error) {

        console.error(error);

        return serverError(error);

    }

}