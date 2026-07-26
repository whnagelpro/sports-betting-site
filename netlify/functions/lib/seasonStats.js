// ======================================================
// Season Stats Helper
// ======================================================

const { loadCSV } = require("./csv");

async function loadSeasonStats(url) {

    return await loadCSV(url);

}

function findSeasonStats(rows, playerId) {

    return rows.find(

        row =>

            String(row["Player ID"]) === String(playerId)

    );

}

module.exports = {

    loadSeasonStats,

    findSeasonStats

};