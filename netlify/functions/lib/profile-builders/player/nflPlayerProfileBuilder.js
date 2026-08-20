// ======================================================
// NFL PLAYER PROFILE BUILDER
// ======================================================

async function buildNFLPlayerProfile(playerName) {

    const seasonStats =
        await fetchNFLPlayerSeasonStats();

    const trends =
        await fetchNFLPlayerTrends();

    const gameLogs =
        await fetchNFLPlayerGameLogs();

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

window.buildNFLPlayerProfile =
    buildNFLPlayerProfile;