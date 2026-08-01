import { calculateConsistency } from "./consistency.js";
import { scoreProp } from "./scoreProp.js";
import { findBestProp } from "./bestProp.js";

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

    const propAnalytics =

        props.map(prop =>

            scoreProp({

                prop,

                model: {

                    // Temporary placeholder until
                    // the probability model is connected.

                    projectedProbability: 0.55,

                    consistencyScore:

                        consistency.score

                }

            })

        );

    const bestProp =

        findBestProp(propAnalytics);

    const score =

        bestProp?.score ?? 0;

    return {

        score,

        stars:

            buildStars(score),

        confidence:

            buildConfidence(score),

        recommendation:

            buildRecommendation(score),

        bestProp,

        propAnalytics,

        consistency

    };

}