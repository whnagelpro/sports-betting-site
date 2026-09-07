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

    const rawProbability =
        prop?.probability;

    if (
        rawProbability === null ||
        rawProbability === undefined ||
        rawProbability === ""
    ) {

        return null;

    }

    const probability =
        Number(rawProbability);

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

    const propModelProbability =
        getPropModelProbability(prop);

    if (propModelProbability !== null) {

        return {
            probability:
                propModelProbability,

            hits: 0,

            sampleSize:
                gameLogs.length,

            source: "prop_model"
        };

    }

    if (
        String(prop?.type ?? "")
            .toLowerCase() === "milestone"
    ) {

        const milestoneProbability =
            getPropModelProbability(prop);

        return {

            probability:
                milestoneProbability,

            hits: 0,

            sampleSize:
                gameLogs.length,

            source:
                milestoneProbability === null
                    ? "unavailable"
                    : "prop_model"

        };

    }

    if (!prop || !gameLogs.length) {

        return {
            probability: null,
            hits: 0,
            sampleSize: 0,
            source: "unavailable"
        };

    }

    const field =

        MARKET_FIELDS[prop.market];

    if (!field) {

        return {
            probability: null,
            hits: 0,

            sampleSize:
                gameLogs.length,

            source: "unavailable"
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