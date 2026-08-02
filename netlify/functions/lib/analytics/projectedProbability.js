const MARKET_FIELDS = {

    hits: "hits",

    runs: "runs",

    rbis: "rbis",

    home_runs: "homeRuns",

    total_bases: "totalBases",

    hits_runs_rbis: "hitsRunsRBIs",

    walks: "walks",

    strikeouts: "strikeouts",

    pitcher_outs: "outs",

    pitcher_strikeouts: "strikeouts",

    pitcher_hits_allowed: "hitsAllowed",

    pitcher_walks: "walks",

    pitcher_earned_runs: "earnedRuns"

};

export function calculateProjectedProbability({

    gameLogs = [],

    prop

}) {

    if (!prop || !gameLogs.length) {

        return {

            probability: 0,

            hits: 0,

            sampleSize: 0

        };

    }

    const field =

        MARKET_FIELDS[prop.market];

    if (!field) {

        return {

            probability: 0,

            hits: 0,

            sampleSize: gameLogs.length

        };

    }

    const line = Number(prop.line);

    let clears = 0;

    for (const game of gameLogs) {

        const value = Number(game[field] ?? 0);

        if (value > line) {

            clears++;

        }

    }

    return {

        probability:

            clears / gameLogs.length,

        hits: clears,

        sampleSize:

            gameLogs.length

    };

}