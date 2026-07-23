// ======================================================
// Sportacular Analytics
// Player Endpoint
// ======================================================

import { DATA_SOURCES } from "./lib/config.js";

import {

    loadCSV,

    findPlayer

} from "./lib/csv.js";

import {

    mapPlayer

} from "./lib/mappers/player.js";

import {

    success,

    badRequest,

    notFound,

    serverError

} from "./lib/response.js";

/**
 * Netlify Function
 */
export async function handler(event) {

    try {

        //-------------------------------------------------
        // Read query parameters
        //-------------------------------------------------

        const league = (
            event.queryStringParameters?.league || ""
        ).toLowerCase();

        const id =
            event.queryStringParameters?.id;

        //-------------------------------------------------
        // Validate request
        //-------------------------------------------------

        if (!league) {

            return badRequest(
                "Missing league parameter."
            );

        }

        if (!id) {

            return badRequest(
                "Missing player id."
            );

        }

        if (!DATA_SOURCES[league]) {

            return badRequest(
                "Unsupported league."
            );

        }

        //-------------------------------------------------
        // Load roster
        //-------------------------------------------------

        const roster = await loadCSV(

            DATA_SOURCES[league].roster

        );

        //-------------------------------------------------
        // Find player
        //-------------------------------------------------

        const row = findPlayer(

            roster,

            id

        );

        if (!row) {

            return notFound(

                "Player not found."

            );

        }

        //-------------------------------------------------
        // Map player
        //-------------------------------------------------

        const player = mapPlayer(

            row,

            league

        );

        //-------------------------------------------------
        // Return player
        //-------------------------------------------------

        return success(player);

    }

    catch (error) {

        return serverError(error);

    }

}