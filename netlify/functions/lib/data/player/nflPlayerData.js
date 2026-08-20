// ======================================================
// NFL PLAYER DATA
// ======================================================

async function fetchNFLPlayerTrends() {

    const response =
        await fetch(NFL_PLAYER_TRENDS_CSV_URL);

    const csv =
        await response.text();

    return parseCSV(csv);

}

async function fetchNFLPlayerSeasonStats() {

    // Temporary until dedicated Player Season Stats sheet exists

    return fetchNFLPlayerTrends();

}

async function fetchNFLPlayerGameLogs() {

    // Temporary until dedicated Player Game Logs sheet exists

    return [];

}

window.fetchNFLPlayerTrends =
    fetchNFLPlayerTrends;

window.fetchNFLPlayerSeasonStats =
    fetchNFLPlayerSeasonStats;

window.fetchNFLPlayerGameLogs =
    fetchNFLPlayerGameLogs;