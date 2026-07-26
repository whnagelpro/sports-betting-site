// ======================================================
// Game Logs Helper
// ======================================================

const { loadCSV } = require("./csv");

async function loadGameLogs(url) {

    return await loadCSV(url);

}

function findPlayerGameLogs(rows, playerId) {

    if (!rows) {

        return [];

    }

    return rows
        .filter(row =>
            String(row["Player ID"]) === String(playerId)
        )
        .sort((a, b) =>
            new Date(b["Game Date"]) -
            new Date(a["Game Date"])
        );

}

module.exports = {

    loadGameLogs,

    findPlayerGameLogs

};