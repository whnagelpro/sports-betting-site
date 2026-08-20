// ======================================================
// NBA PLAYER PROFILE BUILDER
// ======================================================

async function buildNBAPlayerProfile(playerName) {

    const seasonStats =
        await fetchNBAPlayerSeasonStats();

    const trends =
        await fetchNBAPlayerTrends();

    const gameLogs =
        await fetchNBAPlayerGameLogs();

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

window.buildNBAPlayerProfile =
    buildNBAPlayerProfile;