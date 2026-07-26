import { loadCSV } from "./csv.js";

export async function loadGameLogs(url) {

    return loadCSV(url);

}

export function findPlayerGameLogs(

    rows,

    playerId

) {

    if (!rows) {

        return [];

    }

    return rows

    .filter(row =>

        String(

            row["Player ID"]

        ) === String(playerId)

    )

    .sort((a, b) =>

        new Date(b["Game Date"]) -

        new Date(a["Game Date"])

    );

}