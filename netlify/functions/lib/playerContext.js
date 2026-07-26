import { findPlayerGameLogs } from "./gameLogs.js";

import { findPlayerTrends } from "./trends.js";

import { findPlayerToday } from "./today.js";

import { findPlayerProps } from "./playerProps.js";

import { findPlayerGame } from "./gameOdds.js";

export function loadPlayerContext({

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

    const trends =

    findPlayerTrends(

        trendRows,

        playerId

    );

    const props =

    findPlayerProps(

        playerPropRows,

        playerId

    );

const matchup =

    findPlayerGame(

        gameOddsRows,

        profile["Team Name"]

    );

    const today =

    findPlayerToday({

        player: profile,

        gameOdds: gameOddsRows,

        playerProps: playerPropRows

    });

    return {

        profile,

        seasonStats,

        gameLogs,

        trends,

        matchup,

        props

    };

}