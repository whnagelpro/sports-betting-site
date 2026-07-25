export function calculateConsistency(gameLogs = [], statField = "strikeouts") {

    const values = gameLogs
        .map(game => Number(game[statField]) || 0)
        .filter(value => value >= 0);

    if (!values.length) {

        return {

            average: 0,

            standardDeviation: 0,

            score: 0,

            rating: "Unknown"

        };

    }

    const average =
        values.reduce((sum, value) => sum + value, 0) / values.length;

    const variance =
        values.reduce(

            (sum, value) =>

                sum + Math.pow(value - average, 2),

            0

        ) / values.length;

    const standardDeviation =
        Math.sqrt(variance);

    let score =
        Math.max(0, 100 - standardDeviation * 15);

    score =
        Math.round(score);

    let rating = "Volatile";

    if (score >= 90) rating = "Elite";
    else if (score >= 80) rating = "Excellent";
    else if (score >= 70) rating = "Good";
    else if (score >= 60) rating = "Average";

    return {

        average,

        standardDeviation,

        score,

        rating

    };

}