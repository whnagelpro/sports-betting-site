function normalCDF(z) {

    return 0.5 * (

        1 +

        Math.tanh(

            Math.sqrt(2 / Math.PI) *

            (

                z +

                0.044715 *

                Math.pow(z, 3)

            )

        )

    );

}

export function calculateProbability({

    projection,

    sportsbookLine,

    standardDeviation

}) {

    if (

        projection == null ||

        sportsbookLine == null ||

        standardDeviation == null

    ) {

return {

    zScore:

        Number(zScore.toFixed(2)),

    overProbability:

        Number(

            (overProbability * 100)

            .toFixed(1)

        ),

    underProbability:

        Number(

            (underProbability * 100)

            .toFixed(1)

        )

};

    }

}

const zScore =

    (sportsbookLine - projection)

    /

    standardDeviation;

const underProbability =

    normalCDF(zScore);

const overProbability =

    1 - underProbability;