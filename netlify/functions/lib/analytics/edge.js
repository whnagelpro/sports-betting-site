export function calculateEdge({

    projectedProbability,

    impliedProbability

}) {

    if (

        projectedProbability == null ||

        impliedProbability == null

    ) {

        return {

            edge: 0,

            edgePercent: 0,

            rating: "None"

        };

    }

    const edge =

        projectedProbability -

        impliedProbability;

    const edgePercent =

        Number(

            (edge * 100)

            .toFixed(2)

        );

    let rating = "No Edge";

    if (edgePercent >= 10) {

        rating = "Elite";

    }
    else if (edgePercent >= 5) {

        rating = "Strong";

    }
    else if (edgePercent >= 2) {

        rating = "Good";

    }

    return {

        edge,

        edgePercent,

        rating

    };

}