// ======================================================
// NHL PLAYER PROFILE BUILDER
// ======================================================

async function buildNHLPlayerProfile(playerName) {

    const seasonStats =
        await fetchNHLPlayerSeasonStats();

    const trends =
        await fetchNHLPlayerTrends();

    const gameLogs =
        await fetchNHLPlayerGameLogs();

    const playerSeason =
        seasonStats.find(
            p => p["Player"] === playerName
        );

    const playerTrends =
        trends.filter(
            t => t["Player"] === playerName
        );

    const playerGames =
        gameLogs.filter(
            g => g["Player"] === playerName
        );

    return {

        player: playerSeason,

        seasonStats: playerSeason,

        trends: playerTrends,

        gameLogs: playerGames,

        summary: playerSeason

    };

}

window.buildNHLPlayerProfile =
    buildNHLPlayerProfile;