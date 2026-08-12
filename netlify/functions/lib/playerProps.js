// ======================================================
// Player Props Helper
// ======================================================

import { loadCSV } from "./csv.js";

// ------------------------------------------------------
// Load Player Props
// ------------------------------------------------------

async function loadPlayerProps(url) {
    return await loadCSV(url);
}

// ------------------------------------------------------
// Find Player Props
// ------------------------------------------------------

function findPlayerProps(rows, playerId) {
    if (!Array.isArray(rows)) {
        return [];
    }

    return rows.filter(row =>
        String(row["Player Id"]) === String(playerId)
    );
}

// ------------------------------------------------------
// ES Module Exports
// ------------------------------------------------------

export {
    loadPlayerProps,
    findPlayerProps
};