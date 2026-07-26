// ======================================================
// Trends Helper
// ======================================================

const { loadCSV } = require("./csv");

async function loadTrends(url) {

    return await loadCSV(url);

}

function findPlayerTrends(rows, playerId) {

    if (!Array.isArray(rows)) {

        return [];

    }

    return rows.filter(row =>

        String(row["Player ID"]) === String(playerId)

    );

}

module.exports = {

    loadTrends,

    findPlayerTrends

};