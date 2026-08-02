const MARKET_FIELDS = {

    hits: "Hits",

    runs: "Runs",

    rbis: "RBIs",

    home_runs: "Home Runs",

    total_bases: "Total Bases",

    walks: "Walks",

    strikeouts: "Strikeouts",

    pitcher_outs: "Outs",

    pitcher_strikeouts: "Strikeouts",

    pitcher_hits_allowed: "Hits Allowed",

    pitcher_walks: "Walks",

    pitcher_earned_runs: "Earned Runs"

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