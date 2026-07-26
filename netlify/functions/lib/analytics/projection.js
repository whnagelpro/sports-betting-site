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

    const seasonComponent =

    seasonAverage * 0.40;

const recentComponent =

    recentAverage * 0.25;

const matchupComponent =

    seasonAverage *

    matchupAdjustment *

    0.20;

    const trendBonus =

    recentAverage > seasonAverage

        ? 0.5

        : 0;
    
    const consistencyBonus =

    confidence === "High"

        ? 0.3

        : 0;
    
const projectedStat =

    seasonComponent +

    recentComponent +

    matchupComponent +

    trendBonus +

    consistencyBonus;

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

    breakdown: {

        seasonComponent:

            Number(seasonComponent.toFixed(2)),

        recentComponent:

            Number(recentComponent.toFixed(2)),

        matchupComponent:

            Number(matchupComponent.toFixed(2)),

        trendBonus,

        consistencyBonus

    }

};

}