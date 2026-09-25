// ======================================================
// Player Context Builder
// ======================================================

import {
    buildMLBContext,
    buildNBAContext,
    buildNHLContext,
    buildNFLContext
} from "./adapters/index.js";

import { findPlayerGameLogs } from "./gameLogs.js";
import { mapGameLogs } from "./mappers/gameLogs.js";
import { findPlayerTrends } from "./trends.js";
import { findPlayerToday } from "./today.js";
import { findPlayerProps } from "./playerProps.js";
import { findPlayerGame } from "./gameOdds.js";

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

    const seasonStats =
        seasonRows.find(player =>
            String(player["Player ID"]) === String(playerId)
        ) || {};

    if (league === "nfl") {

        console.log("========== RAW NFL GAME LOG SOURCE ==========");

        console.log(
            "NFL total source rows:",
            gameLogRows?.length ?? 0
        );

        console.log(
            "NFL requested player ID:",
            playerId
        );

        console.log(
            "NFL roster player:",
            {
                id: profile.Id,
                name: profile["Full Name"],
                position: profile.Position
            }
        );

        console.log(
            "NFL first source row:",
            gameLogRows?.[0] ?? null
        );

        console.log(
            "NFL first source row keys:",
            gameLogRows?.[0]
                ? Object.keys(gameLogRows[0])
                : []
        );

        console.log(
            "NFL first 10 source Player IDs:",
            (gameLogRows ?? [])
                .slice(0, 10)
                .map(row => row["Player ID"])
        );

        console.log("=============================================");
    }

    const rawGameLogs = findPlayerGameLogs(
        gameLogRows,
        playerId
    );

    const gameLogs = mapGameLogs(
        rawGameLogs,
        profile.Position
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

    // Keep this call because we'll likely use it later.
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

export {
    loadPlayerContext
};