// ======================================================
// Sportacular Analytics
// Universal Model Edge Result
// ======================================================

import { calculateEdge } from "../edge.js";

function clamp(value, min = 0, max = 100) {

    return Math.max(
        min,
        Math.min(max, value)
    );

}

function calculateEdgeScore(edgePercent) {

    if (edgePercent > 10) {

        return 100;

    }

    if (edgePercent >= 6) {

        return 80;

    }

    if (edgePercent >= 3) {

        return 60;

    }

    if (edgePercent > 0) {

        return 40;

    }

    return 20;

}

function calculateConfidence({

    consistency,

    sampleSize

}) {

    const consistencyScore = clamp(

        Number(consistency) || 0

    );

    const games = Math.max(

        0,

        Number(sampleSize) || 0

    );

    if (

        consistencyScore >= 80 &&

        games >= 10

    ) {

        return "High";

    }

    if (

        consistencyScore >= 60 &&

        games >= 5

    ) {

        return "Medium";

    }

    return "Low";

}

function calculateRecommendation(score) {

    if (score >= 90) {

        return "Elite Play";

    }

    if (score >= 75) {

        return "Strong Play";

    }

    if (score >= 60) {

        return "Lean";

    }

    return "Pass";

}

export function buildEdgeResult({

    probability,

    impliedProbability,

    consistency = 50,

    sampleSize = 0

}) {

    const modelProbability =

        Number(probability);

    const sportsbookProbability =

        Number(impliedProbability);

    if (

        !Number.isFinite(modelProbability) ||

        !Number.isFinite(sportsbookProbability)

    ) {

        return {

            probability: null,

            impliedProbability: null,

            edge: null,

            edgePercent: null,

            score: 0,

            confidence: "Low",

            recommendation: "Unavailable"

        };

    }

    const normalizedProbability = clamp(

        modelProbability,

        0,

        1

    );

    const normalizedImpliedProbability = clamp(

        sportsbookProbability,

        0,

        1

    );

    const edgeResult = calculateEdge({

        projectedProbability:
            normalizedProbability,

        impliedProbability:
            normalizedImpliedProbability

    });

    const score = calculateEdgeScore(

        edgeResult.edgePercent

    );

    const confidence = calculateConfidence({

        consistency,

        sampleSize

    });

    return {

        probability:
            normalizedProbability,

        impliedProbability:
            normalizedImpliedProbability,

        edge:
            edgeResult.edge,

        edgePercent:
            edgeResult.edgePercent,

        score,

        confidence,

        recommendation:
            calculateRecommendation(score)

    };

}