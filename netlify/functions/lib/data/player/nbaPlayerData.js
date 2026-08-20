// ======================================================
// NBA PLAYER DATA
// ======================================================

async function fetchNBAPlayerTrends() {

    const response =
        await fetch(NBA_PLAYER_TRENDS_CSV_URL);

    const csv =
        await response.text();

    return parseCSV(csv);

}

async function fetchNBAPlayerSeasonStats() {

    // Temporary until dedicated Player Season Stats sheet exists

    return fetchNBAPlayerTrends();

}

async function fetchNBAPlayerGameLogs() {

    // Temporary until dedicated Player Game Logs sheet exists

    return [];

}

window.fetchNBAPlayerTrends =
    fetchNBAPlayerTrends;

window.fetchNBAPlayerSeasonStats =
    fetchNBAPlayerSeasonStats;

window.fetchNBAPlayerGameLogs =
    fetchNBAPlayerGameLogs;