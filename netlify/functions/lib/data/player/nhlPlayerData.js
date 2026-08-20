// ======================================================
// NHL PLAYER DATA
// ======================================================

async function fetchNHLPlayerTrends() {

    const response =
        await fetch(NHL_PLAYER_TRENDS_CSV_URL);

    const csv =
        await response.text();

    return parseCSV(csv);

}

async function fetchNHLPlayerSeasonStats() {

    // Temporary until dedicated Player Season Stats sheet exists

    return fetchNHLPlayerTrends();

}

async function fetchNHLPlayerGameLogs() {

    // Temporary until dedicated Player Game Logs sheet exists

    return [];

}

window.fetchNHLPlayerTrends =
    fetchNHLPlayerTrends;

window.fetchNHLPlayerSeasonStats =
    fetchNHLPlayerSeasonStats;

window.fetchNHLPlayerGameLogs =
    fetchNHLPlayerGameLogs;