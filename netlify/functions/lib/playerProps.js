// ======================================================
// Player Props Helper
// ======================================================

const { loadCSV } = require("./csv");

async function loadPlayerProps(url) {

    return await loadCSV(url);

}

function findPlayerProps(rows, playerId) {

    if (!Array.isArray(rows)) {

        return [];

    }

    return rows.filter(row =>

        String(row["Player Id"]) === String(playerId)

    );

}

module.exports = {

    loadPlayerProps,

    findPlayerProps

};