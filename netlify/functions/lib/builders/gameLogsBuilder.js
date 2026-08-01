export function buildGameLogs(context) {

    return context.gameLogs.map(game => ({

        gameDate: game["Game Date"],

        opponent: game["Opponent"],

        hits: game["Hits"],

        runs: game["Runs"],

        rbis: game["RBIs"],

        homeRuns: game["Home Runs"],

        totalBases: game["Total Bases"],

        strikeouts: game["Strikeouts"],

        walks: game["Walks"],

        pitcherStrikeouts: game["Pitcher Strikeouts"],

        pitcherOuts: game["Pitcher Outs"],

        pitcherEarnedRuns: game["Pitcher Earned Runs"],

        pitcherHitsAllowed: game["Pitcher Hits Allowed"],

        pitcherWalks: game["Pitcher Walks"]

    }));

}