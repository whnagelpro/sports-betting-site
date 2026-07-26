import { loadCSV } from "./csv.js";

export async function loadPlayerProps(url) {

    return loadCSV(url);

}

export function findPlayerProps(

    rows,

    playerId

) {

    if (!Array.isArray(rows)) {

        return [];

    }

    return rows.filter(row =>

        String(

            row["Player Id"]

        ) === String(playerId)

    );

}