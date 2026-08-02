import { calculateConsistency } from "./consistency.js";
import { scoreProp } from "./scoreProp.js";
import { findBestProp } from "./bestProp.js";
import { calculateProjectedProbability } from "./projectedProbability.js";

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

function buildConfidence(score) {

    if (score >= 80) {

        return "High";

    }

    if (score >= 60) {

        return "Medium";

    }

    return "Low";

}

function buildStars(score) {

    if (score >= 90) return 5;

    if (score >= 80) return 4.5;

    if (score >= 70) return 4;

    if (score >= 60) return 3;

    if (score >= 50) return 2;

    return 1;

}

export function calculatePlayerAnalytics({

    gameLogs = [],

    props = []

}) {

    if (!props.length) {

        return null;

    }

    const consistency =

        calculateConsistency(gameLogs);

const propAnalytics = props.map(prop => {

    const projection = calculateProjectedProbability({

        gameLogs,

        prop

    });

    const scoredProp = scoreProp({

        prop,

        model: {

            projectedProbability:

                projection.probability,

            consistencyScore:

                consistency.score

        }

    });

    return {

        ...scoredProp,

        projection

    };

});

    const bestProp =

        findBestProp(propAnalytics);

    const score =

        bestProp?.score ?? 0;

const dashboardBestProp = bestProp
    ? {

        market:
            bestProp.displayName ??
            bestProp.market ??
            "-",

        line:
            bestProp.line ??
            "-",

        sportsbook:
            bestProp.sportsbook ??
            "-",

        ev:
            bestProp.expectedValue?.expectedValuePercent != null
                ? `${bestProp.expectedValue.expectedValuePercent.toFixed(1)}%`
                : "-"

    }
    : null;

return {

    score,

    stars,

    confidence,

    recommendation,

    bestProp: dashboardBestProp,

    propAnalytics,

    consistency

};

}