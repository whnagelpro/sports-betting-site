export function calculateRecommendation({

    expectedValue,

    edge,

    probability,

    consistency,

    matchup

}) {

    if (

        !expectedValue ||

        !edge ||

        !probability

    ) {

        return {

            rating: "Pass",

            confidence: "Unknown",

            reason: "Missing analytics"

        };

    }

    const ev =

        expectedValue.expectedValuePercent;

    const edgePercent =

        edge.edgePercent;

    const overProbability =

        probability.overProbability;

    let rating = "Pass";

    if (

        ev >= 10 &&

        edgePercent >= 5 &&

        overProbability >= 60

    ) {

        rating = "Elite Play";

    }

    else if (

        ev >= 7 &&

        edgePercent >= 4 &&

        overProbability >= 57

    ) {

        rating = "Strong Play";

    }

    else if (

        ev >= 3 &&

        edgePercent >= 2

    ) {

        rating = "Lean Play";

    }

    let confidence = "Low";

    if (

        consistency?.rating === "Elite" &&

        matchup?.rating === "Excellent"

    ) {

        confidence = "High";

    }

    else if (

        consistency?.rating === "Good"

    ) {

        confidence = "Medium";

    }

    return {

        rating,

        confidence,

        reason:

            `${edgePercent}% edge with ${ev}% EV`

    };

}