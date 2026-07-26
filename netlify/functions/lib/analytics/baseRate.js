export function calculateBaseRate({

    seasonAverage,

    recentAverage

}) {

    const baseRate =

        seasonAverage * 0.60 +

        recentAverage * 0.40;

    return {

        baseRate:

            Number(baseRate.toFixed(1)),

        breakdown: {

            seasonAverage,

            recentAverage,

            seasonWeight: 60,

            recentWeight: 40

        }

    };

}