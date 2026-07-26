export function evaluatePrediction({

    projection,

    actualStat

}) {

    const error =

        actualStat -

        projection;

    const absoluteError =

        Math.abs(error);

    return {

        projection,

        actualStat,

        error:

            Number(error.toFixed(2)),

        absoluteError:

            Number(absoluteError.toFixed(2))

    };

}