// ======================================================
// Game Logs Helper
// ======================================================

import { loadCSV } from "./csv.js";

// ------------------------------------------------------
// Load Game Logs
// ------------------------------------------------------

async function loadGameLogs(url) {
    return await loadCSV(url);
}

// ------------------------------------------------------
// Find Player Game Logs
// ------------------------------------------------------

function findPlayerGameLogs(rows, playerId) {
    if (!rows) {
        return [];
    }

    return rows
        .filter(row =>
            String(row["Player ID"]) === String(playerId)
        )
        .sort((a, b) =>
            new Date(b["Game Date"]) -
            new Date(a["Game Date"])
        );
}

// ------------------------------------------------------
// ES Module Exports
// ------------------------------------------------------

export {
    loadGameLogs,
    findPlayerGameLogs
};