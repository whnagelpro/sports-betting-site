export function calculateUsageRate({

    seasonUsage,

    recentUsage,

    starter = true,

    primaryScorer = false

}) {

    let projectedUsage =

        seasonUsage * 0.60 +

        recentUsage * 0.40;

    if (starter) {

        projectedUsage += 1.0;

    }

    if (primaryScorer) {

        projectedUsage += 2.0;

    }

    return {

        projectedUsage:

            Number(projectedUsage.toFixed(1)),

        breakdown: {

            seasonUsage,

            recentUsage,

            starter,

            primaryScorer

        }

    };

}