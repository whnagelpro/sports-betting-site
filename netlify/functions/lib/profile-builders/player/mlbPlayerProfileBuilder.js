// ======================================================
// MLB PLAYER PROFILE BUILDER
// ======================================================

async function buildMLBPlayerProfile(playerName) {

    const seasonStats = await fetchMLBPlayerSeasonStats();

    const trends = await fetchMLBPlayerTrends();

    const gameLogs = await fetchMLBPlayerGameLogs();

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

window.buildMLBPlayerProfile =
    buildMLBPlayerProfile;