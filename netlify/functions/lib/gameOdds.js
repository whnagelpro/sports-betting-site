// ======================================================
// Game Odds Helper
// ======================================================

import { loadCSV } from "./csv.js";

// ------------------------------------------------------
// Load Game Odds
// ------------------------------------------------------

async function loadGameOdds(url) {
    return await loadCSV(url);
}

// ------------------------------------------------------
// Find Player Game
// ------------------------------------------------------

function findPlayerGame(rows, team) {
    if (!Array.isArray(rows)) {
        return {};
    }

    return (
        rows.find(game =>
            game["Home Team"] === team ||
            game["Away Team"] === team
        ) || {}
    );
}

// ------------------------------------------------------
// ES Module Exports
// ------------------------------------------------------

export {
    loadGameOdds,
    findPlayerGame
};