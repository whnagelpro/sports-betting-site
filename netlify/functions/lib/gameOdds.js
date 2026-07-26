// ======================================================
// Game Odds Helper
// ======================================================

const { loadCSV } = require("./csv");

async function loadGameOdds(url) {

    return await loadCSV(url);

}

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

module.exports = {

    loadGameOdds,

    findPlayerGame

};