import { calculateConsistency } from "./consistency.js";
import { findBestProp } from "./bestProp.js";
import { evaluateProp } from "./evaluateProp.js";


export function calculatePlayerAnalytics({

    gameLogs = [],

    props = []

}) {

    const consistency =
        calculateConsistency(gameLogs);


    if (!props.length) {

        return {

            score: 0,

            stars: 0,

            confidence: "N/A",

            recommendation: "No Props Available",

            edge: null,

            bestProp: null,

            propAnalytics: [],

            consistency,

            modelEdge: null,

            analyticsVersion: 3

        };
    }


    const propAnalytics =
        props
            .map(prop =>
                evaluateProp({

                    prop,

                    gameLogs,

                    consistency

                })
            )
            .filter(Boolean);


    const bestProp =
        findBestProp(propAnalytics);


    if (!bestProp) {

        return {

            score: 0,

            stars: 0,

            confidence: "N/A",

            recommendation: "No Play",

            edge: null,

            bestProp: null,

            propAnalytics,

            consistency,

            modelEdge: null,

            analyticsVersion: 3

        };
    }


    const score =
        bestProp.evaluation?.sportacularScore ??
        null;

    const sportacularEdge =
        bestProp.evaluation?.sportacularEdge ??
        null;

    const confidence =
        bestProp.evaluation?.confidenceTier ??
        null;

    const recommendation =
        bestProp.evaluation?.bestSide ??
        "No Play";


    const stars =
        score === null
            ? 0
            : score >= 90
                ? 5
                : score >= 80
                    ? 4.5
                    : score >= 70
                        ? 4
                        : score >= 60
                            ? 3
                            : score >= 50
                                ? 2
                                : 1;


    const dashboardBestProp = {

        id:
            bestProp.id ??
            null,

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
            bestProp.evaluation?.bestModelProbability ??
            null,

        impliedProbability:
            null,

        edge:
            bestProp.evaluation?.bestPriceEdge ??
            null,

        sportacularEdge,

        ev:
            bestProp.evaluation?.bestEV !== null &&
            bestProp.evaluation?.bestEV !== undefined
                ? bestProp.evaluation.bestEV * 100
                : null,

        score,

        confidence,

        recommendation

    };


    return {

        score,

        stars,

        confidence,

        recommendation,

        edge:
            bestProp.evaluation?.bestPriceEdge ??
            null,

        bestProp:
            dashboardBestProp,

        propAnalytics,

        consistency,

        modelEdge:
            sportacularEdge,

        analyticsVersion: 3

    };
}