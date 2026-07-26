export function buildExplanation({

    recommendation,

    expectedValue,

    edge,

    features

}) {

    const reasons = [];

    if (

        expectedValue.expectedValuePercent >= 10

    ) {

        reasons.push(

            "Excellent expected value"

        );

    }

    if (

        edge.edgePercent >= 5

    ) {

        reasons.push(

            "Strong sportsbook edge"

        );

    }

    if (

        features.projectedMinutes >= 35

    ) {

        reasons.push(

            "High projected playing time"

        );

    }

    if (

        features.trendScore >= 80

    ) {

        reasons.push(

            "Player is in strong recent form"

        );

    }

    return {

        rating:

            recommendation.rating,

        confidence:

            recommendation.confidence,

        reasons

    };

}