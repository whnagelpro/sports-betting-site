import { calculateImpliedProbability } from "./impliedProbability.js";
import { calculateExpectedValue } from "./expectedValue.js";
import { calculateEdge } from "./edge.js";
import { buildAnalytics } from "./buildAnalytics.js";

function clamp(value, min = 0, max = 100) {

    return Math.max(min, Math.min(max, value));

}

export function scoreProp({

    prop,

    model

}) {

    const {

        projectedProbability,

        consistencyScore = 50

    } = model;

    if (!prop) {

        return null;

    }

    const odds = Number(prop.odds);

    const impliedProbability =

        calculateImpliedProbability({

            odds,

            format:

                prop.oddsFormat ??

                "american"

        });

    const edge = calculateEdge({

        projectedProbability,

        impliedProbability

    });

    const expectedValue =

        calculateExpectedValue({

            projectedProbability,

            odds,

            format:

                prop.oddsFormat ??

                "american"

        });

    // Normalize metrics to 0–100

    const evScore = clamp(

        expectedValue.expectedValuePercent * 5

    );

    const edgeScore = clamp(

        edge.edgePercent * 10

    );

    const overallScore = Math.round(

        evScore * 0.50 +

        edgeScore * 0.30 +

        consistencyScore * 0.20

    );

    const analytics = buildAnalytics({

        score: overallScore,

        modelEdge: edge.edgePercent,

        probability: projectedProbability,

        impliedProbability

    });

    return {

        ...prop,

        impliedProbability,

        expectedValue,

        edge,

        score: overallScore,               // temporary alias

        sportacularScore: overallScore,

        analytics: {

            ...analytics,

            sportacularScore: overallScore

        }

    };

}