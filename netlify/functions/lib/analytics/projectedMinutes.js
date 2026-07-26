export function calculateProjectedMinutes({

    seasonMinutes,

    recentMinutes,

    starter = true,

    backToBack = false

}) {

    let projectedMinutes =

        seasonMinutes * 0.60 +

        recentMinutes * 0.40;

    if (starter) {

        projectedMinutes += 1.0;

    }

    if (backToBack) {

        projectedMinutes -= 1.5;

    }

    return {

        projectedMinutes:

            Number(projectedMinutes.toFixed(1)),

        breakdown: {

            seasonMinutes,

            recentMinutes,

            starter,

            backToBack

        }

    };

}