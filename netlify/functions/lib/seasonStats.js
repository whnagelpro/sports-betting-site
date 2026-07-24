// ======================================================
// Season Stats Helper
// ======================================================

import { loadCSV } from "./csv.js";

export async function loadSeasonStats(url) {

    return await loadCSV(url);

}

export function findSeasonStats(rows, playerId) {

    return rows.find(

        row =>

        String(row["Player ID"]) === String(playerId)

    );

}