// ======================================================
// Today's Matchup Helper
// ======================================================

const { loadCSV } = require("./csv");

// ------------------------------------------------------
// Load today's game odds
// ------------------------------------------------------

async function loadTodayGameOdds(url) {

    return await loadCSV(url);

}

// ------------------------------------------------------
// Load today's player props
// ------------------------------------------------------

async function loadTodayPlayerProps(url) {

    return await loadCSV(url);

}

// ------------------------------------------------------
// Build today's player context
// ------------------------------------------------------

function findPlayerToday({

    player,

    gameOdds,

    playerProps

}) {

    const props = playerProps.filter(prop =>

        String(prop["Player ID"]) ===

        String(player.Id)

    );

    const matchup = gameOdds.find(game =>

        game["Home Team"] === player["Team Name"] ||

        game["Away Team"] === player["Team Name"]

    ) || {};

    return {

        matchup,

        props

    };

}

// ------------------------------------------------------
// Exports
// ------------------------------------------------------

module.exports = {

    loadTodayGameOdds,

    loadTodayPlayerProps,

    findPlayerToday

};