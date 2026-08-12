// ======================================================
// Trends Helper
// ======================================================

import { loadCSV } from "./csv.js";

// ------------------------------------------------------
// Load Trends
// ------------------------------------------------------

async function loadTrends(url) {
    return await loadCSV(url);
}

// ------------------------------------------------------
// Find Player Trends
// ------------------------------------------------------

function findPlayerTrends(rows, playerId) {
    if (!Array.isArray(rows)) {
        return [];
    }

    return rows.filter(row =>
        String(row["Player ID"]) === String(playerId)
    );
}

// ------------------------------------------------------
// ES Module Exports
// ------------------------------------------------------

export {
    loadTrends,
    findPlayerTrends
};