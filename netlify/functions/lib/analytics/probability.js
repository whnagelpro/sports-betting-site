function normalCDF(z) {
    return 0.5 * (
        1 +
        Math.tanh(
            Math.sqrt(2 / Math.PI) *
            (
                z +
                0.044715 * Math.pow(z, 3)
            )
        )
    );
}

function calculateProbability({

    projection,

    sportsbookLine,

    standardDeviation

}) {

    if (

        projection == null ||

        sportsbookLine == null ||

        standardDeviation == null ||

        standardDeviation === 0

    ) {

        return {

            zScore: null,

            overProbability: null,

            underProbability: null

        };

    }

    const zScore =

        (sportsbookLine - projection) /

        standardDeviation;

    const underProbability =

        normalCDF(zScore);

    const overProbability =

        1 - underProbability;

    return {

        zScore:

            Number(zScore.toFixed(2)),

        overProbability:

            Number((overProbability * 100).toFixed(1)),

        underProbability:

            Number((underProbability * 100).toFixed(1))

    };

}

module.exports = {

    calculateProbability

};