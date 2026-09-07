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

    const hasProbability =
        probability !== null &&
        probability !== undefined &&
        probability !== "";

    const probabilityValue =
        hasProbability
            ? Number(probability)
            : NaN;

    const hasImpliedProbability =
        impliedProbability !== null &&
        impliedProbability !== undefined &&
        impliedProbability !== "";

    const impliedProbabilityValue =
        hasImpliedProbability
            ? Number(impliedProbability)
            : NaN;

    const hasModelAnalytics =
        Number.isFinite(probabilityValue) &&
        Number.isFinite(impliedProbabilityValue);

    return {

        sportacularScore,

        modelEdge:
            Number.isFinite(edgeValue)
                ? edgeValue
                : null,

        probability:
            Number.isFinite(probabilityValue)
                ? probabilityValue
                : null,

        impliedProbability:
            Number.isFinite(impliedProbabilityValue)
                ? impliedProbabilityValue
                : null,

        confidence:
            hasModelAnalytics
                ? buildConfidence(sportacularScore)
                : "Low",

        recommendation:
            hasModelAnalytics
                ? buildRecommendation(sportacularScore)
                : "Unavailable"

    };

}