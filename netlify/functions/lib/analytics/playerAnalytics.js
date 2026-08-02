import { calculateConsistency } from "./consistency.js";
import { scoreProp } from "./scoreProp.js";
import { findBestProp } from "./bestProp.js";
import { calculateProjectedProbability } from "./projectedProbability.js";
import { buildEdgeResult } from "./edge/buildEdgeResult.js";
import { evaluateProp } from "./evaluateProp.js";

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

const propAnalytics = props.map(prop =>

    evaluateProp({

        prop,

        gameLogs,

        consistency

    })

);

    const bestProp =

        findBestProp(propAnalytics);

    const edge = bestProp?.edge ?? null;

    const score =

        bestProp?.score ?? 0;

    const stars =

        buildStars(score);

    const confidence =

        buildConfidence(score);

    const recommendation =

        buildRecommendation(score);

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

            probability:
                bestProp.edge?.probability ?? null,

            impliedProbability:
                bestProp.edge?.impliedProbability ?? null,

            edge:
                bestProp.edge ?? null,

            ev:
                bestProp.expectedValue?.expectedValuePercent ?? null,

            score:
                bestProp.edge?.score ??
                bestProp.score ??
                null,

            confidence:
                bestProp.edge?.confidence ?? null,

            recommendation:
                bestProp.edge?.recommendation ?? null

        }
        : null;

    return {

        score,

        stars,

        confidence,

        recommendation,

        edge,

        bestProp: dashboardBestProp,

        propAnalytics,

        consistency,

        modelEdge: edge,

        analyticsVersion: 2

    };

}