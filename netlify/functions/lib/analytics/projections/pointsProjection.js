export function calculatePointsProjection({

    seasonAverage,

    recentAverage,

    matchupModifier = 1.0,

    homeAwayModifier = 1.0,

    minutesModifier = 1.0

}) {

    const baseline =

        (

            seasonAverage * 0.45 +

            recentAverage * 0.35

        );

    const projectedPoints =

        baseline *

        matchupModifier *

        homeAwayModifier *

        minutesModifier;

    return {

        projectedPoints:

            Number(

                projectedPoints.toFixed(1)

            ),

        breakdown: {

            seasonWeight: 45,

            recentWeight: 35,

            matchupModifier,

            homeAwayModifier,

            minutesModifier

        }

    };

}