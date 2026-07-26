export function calculateSeasonStats(gameLogs = []) {

    if (!gameLogs.length) {

        const values = gameLogs.map(log => log.stat);

        const total = values.reduce(

            (sum, value) => sum + value,

            0

        );

        const seasonAverage = total / values.length;

        const minimum = Math.min(...values);

        const maximum = Math.max(...values);

        const range = maximum - minimum;

        const sortedValues = [...values].sort(

    (a, b) => a - b

);

const middle = Math.floor(

    sortedValues.length / 2

);

const median =

    sortedValues.length % 2 === 0

        ? (

            sortedValues[middle - 1] +

            sortedValues[middle]

        ) / 2

        : sortedValues[middle];

        const variance =

    values.reduce(

        (sum, value) =>

            sum +

            Math.pow(

                value - seasonAverage,

                2

            ),

        0

    ) / values.length;

const standardDeviation =

    Math.sqrt(variance);

        const gamesPlayed = values.length;

const floor =

    Number(

        Math.max(

            minimum,

            seasonAverage - standardDeviation

        ).toFixed(1)

    );

const ceiling =

    Number(

        Math.min(

            maximum,

            seasonAverage + standardDeviation

        ).toFixed(1)

    );

return {

    gamesPlayed,

    total,

    seasonAverage:

        Number(seasonAverage.toFixed(1)),

    minimum,

    maximum,

    median:

        Number(median.toFixed(1)),

    standardDeviation:

        Number(standardDeviation.toFixed(2)),

    floor,

    ceiling

};

    }

}