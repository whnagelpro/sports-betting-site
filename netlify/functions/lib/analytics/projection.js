export function calculateProjection({

    seasonAverage = 0,

    recentAverage = 0,

    matchupScore = 50

}) {

    const recentWeight = 0.40;

    const seasonWeight = 0.40;

    const matchupWeight = 0.20;

    const matchupAdjustment =
        (matchupScore - 50) / 50;

    const projectedStat =

        seasonAverage * seasonWeight +

        recentAverage * recentWeight +

        seasonAverage * matchupAdjustment * matchupWeight;

    let confidence = "Medium";

if (Math.abs(recentAverage - seasonAverage) < 0.5) {

    confidence = "High";

}
else if (Math.abs(recentAverage - seasonAverage) > 2) {

    confidence = "Low";

}

    return {

        projectedStat:
            Number(projectedStat.toFixed(1)),

        seasonAverage,

        recentAverage,

        matchupScore,

        confidence,

    };

}