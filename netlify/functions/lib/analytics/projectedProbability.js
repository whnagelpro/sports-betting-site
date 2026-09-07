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

function getPropModelProbability(prop) {

    const probability =
        Number(prop?.probability);

    if (
        Number.isFinite(probability) &&
        probability >= 0 &&
        probability <= 1
    ) {

        return probability;

    }

    return null;

}

export function calculateProjectedProbability({

    gameLogs = [],

    prop

}) {

    if (!prop || !gameLogs.length) {

        const fallbackProbability =
            getPropModelProbability(prop);

        return {

            probability:
                fallbackProbability,

            hits: 0,

            sampleSize: 0,

            source:
                fallbackProbability === null
                    ? "unavailable"
                    : "prop_model"

        };

    }

    const field =

        MARKET_FIELDS[prop.market];

    if (!field) {

        const fallbackProbability =
            getPropModelProbability(prop);

        return {

            probability:
                fallbackProbability,

            hits: 0,

            sampleSize:
                gameLogs.length,

            source:
                fallbackProbability === null
                    ? "unavailable"
                    : "prop_model"

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
            gameLogs.length,

        source: "game_logs"

    };

}