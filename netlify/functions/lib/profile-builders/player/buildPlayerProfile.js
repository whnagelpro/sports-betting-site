// ======================================================
// SHARED PLAYER PROFILE BUILDER
// ======================================================

export async function buildPlayerProfile({

    playerName,

    fetchSeasonStats,

    fetchTrends,

    fetchGameLogs

}) {

    const seasonStats =
        await fetchSeasonStats();

    const trends =
        await fetchTrends();

    const gameLogs =
        await fetchGameLogs();

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