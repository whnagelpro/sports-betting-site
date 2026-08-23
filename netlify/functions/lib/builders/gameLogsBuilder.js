export function buildGameLogs(context) {

    const league = context.league?.toLowerCase() ?? "mlb";

    if (league === "nfl") {

        console.log("Raw NFL Game Log:", context.gameLogs[0]);

        return context.gameLogs.map(game => ({

            gameDate: game.gameDate,

            opponent: game.opponent,

            passingYards: Number(game.passingYards ?? 0),

            passingTDs: Number(game.passingTDs ?? 0),

            interceptions: Number(game.interceptions ?? 0),

            completions: Number(game.completions ?? 0),

            passAttempts: Number(game.passAttempts ?? 0),

            rushingYards: Number(game.rushingYards ?? 0),

            rushingAttempts: Number(game.rushingAttempts ?? 0),

            rushingTDs: Number(game.rushingTDs ?? 0),

            receptions: Number(game.receptions ?? 0),

            receivingYards: Number(game.receivingYards ?? 0),

            receivingTDs: Number(game.receivingTDs ?? 0)

        }));

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