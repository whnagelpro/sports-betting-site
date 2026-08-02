// ======================================================
// Sportacular Analytics
// Game Log Mapper
// ======================================================

function mapGameLogs(gameLogs, position) {

    if (!Array.isArray(gameLogs)) {

        return [];

    }

    const isPitcher = ["SP", "RP", "P"].includes(
        (position || "").toUpperCase()
    );

    return gameLogs.map(log => {

        if (isPitcher) {

            return {

                gameDate: log["Game Date"],

                gameId: log["Game ID"],

                opponent: log["Opponent"],

                strikeouts: Number(
                    log["Pitcher Strikeouts"] || 0
                ),

                outs: Number(
                    log["Pitcher Outs"] || 0
                ),

                earnedRuns: Number(
                    log["Pitcher Earned Runs"] || 0
                ),

                hitsAllowed: Number(
                    log["Pitcher Hits Allowed"] || 0
                ),

                walks: Number(
                    log["Pitcher Walks"] || 0
                ),

                raw: log

            };

        }

        return {

            gameDate: log["Game Date"],

            gameId: log["Game ID"],

            opponent: log["Opponent"],

            hits: Number(
                log["Hits"] || 0
            ),

            runs: Number(
                log["Runs"] || 0
            ),

            rbis: Number(
                log["RBIs"] || 0
            ),

            homeRuns: Number(
                log["Home Runs"] || 0
            ),

            totalBases: Number(
                log["Total Bases"] || 0
            ),

            strikeouts: Number(
                log["Strikeouts"] || 0
            ),

            walks: Number(
                log["Walks"] || 0
            ),

            stolenBases: Number(
                log["Stolen Bases"] || 0
            ),

            hitsRunsRBIs: Number(
                log["Hits + Runs + RBIs"] || 0
            ),

            raw: log

        };

    });

}

module.exports = {

    mapGameLogs

};