// ======================================================
// Season Stats Helper
// ======================================================

import { loadCSV } from "./csv.js";

// ------------------------------------------------------
// Load Season Stats
// ------------------------------------------------------

async function loadSeasonStats(url) {
    return await loadCSV(url);
}

// ------------------------------------------------------
// Find Season Stats
// ------------------------------------------------------

function findSeasonStats(rows, playerId) {
    return rows.find(
        row =>
            String(row["Player ID"]) === String(playerId)
    );
}

// ------------------------------------------------------
// ES Module Exports
// ------------------------------------------------------

export {
    loadSeasonStats,
    findSeasonStats
};