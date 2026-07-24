// ======================================================
// Sportacular Analytics
// Universal Player Endpoint
// ======================================================

import { DATA_SOURCES } from "./lib/config.js";
import { loadCSV, findPlayer } from "./lib/csv.js";
import { mapPlayer } from "./lib/mappers/player.js";
import {
    success,
    badRequest,
    notFound,
    serverError
} from "./lib/response.js";
import {

    loadSeasonStats,

    findSeasonStats

} from "./lib/seasonStats.js";

export async function handler(event) {

    try {

        const league = (
            event.queryStringParameters?.league || ""
        ).toLowerCase();

        const id =
            event.queryStringParameters?.id;

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

        const roster = await loadCSV(

            source.roster

        );

        const seasonRows = await loadSeasonStats(

            source.seasonStats

        );

        const row = findPlayer(

            roster,

            id

        );

        const seasonStats = findSeasonStats(

            seasonRows,

            id

        );

        if (!row) {

            return notFound(

                "Player not found."

            );

        }

        const player = mapPlayer(

            row,

            league,

            seasonStats

        );

        return success(player);

    }

    catch (error) {

        return serverError(error);

    }

}