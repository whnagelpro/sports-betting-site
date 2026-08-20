// ======================================================
// MLB PLAYER DATA
// ======================================================

async function fetchMLBPlayerTrends() {

    const response =
        await fetch(MLB_PLAYER_TRENDS_CSV_URL);

    const csv =
        await response.text();

    return parseCSV(csv);

}

async function fetchMLBPlayerSeasonStats() {

    // Temporary until dedicated Player Season Stats sheet exists

    return fetchMLBPlayerTrends();

}

async function fetchMLBPlayerGameLogs() {

    // Temporary until dedicated Player Game Logs sheet exists

    return [];

}

window.fetchMLBPlayerTrends =
    fetchMLBPlayerTrends;

window.fetchMLBPlayerSeasonStats =
    fetchMLBPlayerSeasonStats;

window.fetchMLBPlayerGameLogs =
    fetchMLBPlayerGameLogs;