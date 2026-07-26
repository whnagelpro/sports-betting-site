import { loadCSV } from "./csv.js";

export async function loadTrends(url) {

    return loadCSV(url);

}

export function findPlayerTrends(

    rows,

    playerId

) {

    if (!Array.isArray(rows)) {

        return [];

    }

    return rows.filter(row =>

        String(

            row["Player ID"]

        ) === String(playerId)

    );

}