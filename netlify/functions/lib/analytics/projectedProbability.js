const MARKET_FIELDS = {

    Hits: "Hits",

    Runs: "Runs",

    RBIs: "RBIs",

    "Home Runs": "Home Runs",

    "Total Bases": "Total Bases",

    Walks: "Walks",

    Strikeouts: "Strikeouts"

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