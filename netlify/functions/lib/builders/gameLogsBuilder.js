export function buildGameLogs(context) {

    const league = context.league?.toLowerCase() ?? "mlb";

    if (league === "nfl") {

        console.log("Raw NFL Game Log:", context.gameLogs[0]);

        return context.gameLogs.map(game => {

            const mapped = {

                gameDate: game["Game Date"],

                opponent: game["Opponent"],

                passingYards: Number(game["Passing Yards"] ?? 0),

                passingTDs: Number(game["Passing TDs"] ?? 0),

                interceptions: Number(game["Interceptions"] ?? 0),

                completions: Number(game["Completions"] ?? 0),

                passAttempts: Number(game["Pass Attempts"] ?? 0),

                rushingYards: Number(game["Rushing Yards"] ?? 0),

                rushingAttempts: Number(game["Rushing Attempts"] ?? 0),

                rushingTDs: Number(game["Rushing TDs"] ?? 0),

                receptions: Number(game["Receptions"] ?? 0),

                receivingYards: Number(game["Receiving Yards"] ?? 0),

                receivingTDs: Number(game["Receiving TDs"] ?? 0)

            };

            console.log("Mapped NFL Game Log:", mapped);

            return mapped;

        });

    }

    if (context.isPitcher) {

        return context.gameLogs.map(game => {

            const outs = Number(game.outs ?? 0);

            const innings = Math.floor(outs / 3);

            const remainingOuts = outs % 3;

            return {

                gameDate: game.gameDate,

                opponent: game.opponent,

                inningsPitched: `${innings}.${remainingOuts}`,

                strikeouts: game.strikeouts,

                earnedRuns: game.earnedRuns,

                hitsAllowed: game.hitsAllowed,

                walks: game.walks

            };

        });

    }

    return context.gameLogs.map(game => ({

        gameDate: game.gameDate,

        opponent: game.opponent,

        hits: game.hits,

        runs: game.runs,

        rbis: game.rbis,

        homeRuns: game.homeRuns,

        totalBases: game.totalBases,

        walks: game.walks,

        strikeouts: game.strikeouts

    }));

}