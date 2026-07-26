export function calculateNBAPointsProjection({

    features

}) {

    const {

        playerRate,

        projectedMinutes,

        contextMultiplier

    } = features;

    const baseProjection =

        playerRate *

        projectedMinutes;

    const finalProjection =

        baseProjection *

        contextMultiplier;

    return {

        market: "Points",

        baseProjection:

            Number(baseProjection.toFixed(1)),

        finalProjection:

            Number(finalProjection.toFixed(1))

    };

}