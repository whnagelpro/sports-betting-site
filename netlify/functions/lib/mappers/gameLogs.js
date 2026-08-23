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

        if (
            log["Passing Yards"] !== undefined ||
            log["Rushing Yards"] !== undefined ||
            log["Receiving Yards"] !== undefined
        ) {

            return {

                gameDate: log["Game Date"],

                gameId: log["Game ID"],

                opponent: log["Opponent"],

                passingYards: Number(log["Passing Yards"] || 0),

                passingTDs: Number(log["Passing TDs"] || 0),

                interceptions: Number(log["Interceptions"] || 0),

                completions: Number(log["Completions"] || 0),

                passAttempts: Number(log["Pass Attempts"] || 0),

                rushingYards: Number(log["Rushing Yards"] || 0),

                rushingAttempts: Number(log["Rushing Attempts"] || 0),

                rushingTDs: Number(log["Rushing TDs"] || 0),

                receptions: Number(log["Receptions"] || 0),

                receivingYards: Number(log["Receiving Yards"] || 0),

                receivingTDs: Number(log["Receiving TDs"] || 0),

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

export {
    mapGameLogs
};