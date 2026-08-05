// ======================================================
// Sportacular Analytics
// Universal Analytics Summary
// ======================================================

function clamp(value, min = 0, max = 100) {

    return Math.max(
        min,
        Math.min(max, value)
    );

}

function buildConfidence(score) {

    if (score >= 80) {

        return "High";

    }

    if (score >= 60) {

        return "Medium";

    }

    return "Low";

}

function buildRecommendation(score) {

    if (score >= 90) {

        return "Elite Play";

    }

    if (score >= 80) {

        return "Excellent Play";

    }

    if (score >= 70) {

        return "Strong Play";

    }

    if (score >= 60) {

        return "Solid Play";

    }

    if (score >= 50) {

        return "Lean";

    }

    return "Pass";

}

export function buildAnalytics({

    score,

    modelEdge,

    probability = null,

    impliedProbability = null

}) {

    const sportacularScore = Math.round(

        clamp(
            Number(score) || 0
        )

    );

    const edgeValue = Number(modelEdge);

    return {

        sportacularScore,

        modelEdge:
            Number.isFinite(edgeValue)
                ? edgeValue
                : null,

        probability:
            Number.isFinite(Number(probability))
                ? Number(probability)
                : null,

        impliedProbability:
            Number.isFinite(Number(impliedProbability))
                ? Number(impliedProbability)
                : null,

        confidence:
            buildConfidence(sportacularScore),

        recommendation:
            buildRecommendation(sportacularScore)

    };

}