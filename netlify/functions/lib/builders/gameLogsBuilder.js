export function buildGameLogs(context) {

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