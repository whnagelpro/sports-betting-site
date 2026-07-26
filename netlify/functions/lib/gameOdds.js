import { loadCSV } from "./csv.js";

export async function loadGameOdds(url) {

    return loadCSV(url);

}

export function findPlayerGame(

    rows,

    team

) {

    if (!Array.isArray(rows)) {

        return {};

    }

    return rows.find(game =>

        game["Home Team"] === team ||

        game["Away Team"] === team

    ) || {};

}