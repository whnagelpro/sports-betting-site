// ======================================================
// Player Context Builder
// ======================================================

import {
    buildMLBContext,
    buildNBAContext,
    buildNHLContext,
    buildNFLContext
} from "./adapters/index.js";

const { findPlayerGameLogs } = require("./gameLogs");
const { findPlayerTrends } = require("./trends");
const { findPlayerToday } = require("./today");
const { findPlayerProps } = require("./playerProps");
const { findPlayerGame } = require("./gameOdds");

function loadPlayerContext({

    league,
    
    playerId,

    roster,

    seasonRows,

    gameLogRows,

    trendRows,

    gameOddsRows,

    playerPropRows

}) {

    const profile = roster.find(player =>

        String(player.Id) === String(playerId)

    );

    if (!profile) {

        return null;

    }

    const seasonStats = seasonRows.find(player =>

        String(player["Player ID"]) === String(playerId)

    ) || {};

    const gameLogs = findPlayerGameLogs(

        gameLogRows,

        playerId

    );

    const trends = findPlayerTrends(

        trendRows,

        playerId

    );

    const props = findPlayerProps(

        playerPropRows,

        playerId

    );

    const matchup = findPlayerGame(

        gameOddsRows,

        profile["Team Name"]

    );

    // Keep this call because we'll likely use it later,
    // even though today's return value isn't currently used.
    findPlayerToday({

        player: profile,

        gameOdds: gameOddsRows,

        playerProps: playerPropRows

    });

const isPitcher = [

    "P",
    "SP",
    "RP",
    "CL"

].includes(profile.Position);

const context = {

    profile,

    seasonStats,

    gameLogs,

    trends,

    matchup,

    props,

    isPitcher

};

switch (league) {

    case "mlb":

        return buildMLBContext(context);

    case "nba":

        return buildNBAContext(context);

    case "nhl":

        return buildNHLContext(context);

    case "nfl":

        return buildNFLContext(context);

    default:

        throw new Error(

            `Unsupported league: ${league}`

        );

}

}

module.exports = {

    loadPlayerContext

};