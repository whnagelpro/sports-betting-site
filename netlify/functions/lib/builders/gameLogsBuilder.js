export function buildGameLogs(context) {

    if (context.isPitcher) {

        return context.gameLogs.map(game => {

            const outs =
                Number(game["Pitcher Outs"] ?? 0);

            const innings =
                Math.floor(outs / 3);

            const remainingOuts =
                outs % 3;

            return {

                gameDate: game["Game Date"],

                opponent: game["Opponent"],

                inningsPitched: `${innings}.${remainingOuts}`,

                strikeouts: game["Pitcher Strikeouts"],

                earnedRuns: game["Pitcher Earned Runs"],

                hitsAllowed: game["Pitcher Hits Allowed"],

                walks: game["Pitcher Walks"]

            };

        });

    }

    return context.gameLogs.map(game => ({

        gameDate: game["Game Date"],

        opponent: game["Opponent"],

        hits: game["Hits"],

        runs: game["Runs"],

        rbis: game["RBIs"],

        homeRuns: game["Home Runs"],

        totalBases: game["Total Bases"],

        walks: game["Walks"],

        strikeouts: game["Strikeouts"]

    }));

}