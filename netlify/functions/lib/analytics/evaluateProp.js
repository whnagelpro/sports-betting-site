import { calculateProjectedProbability } from "./projectedProbability.js";
import { scoreProp } from "./scoreProp.js";
import { buildEdgeResult } from "./edge/buildEdgeResult.js";

export function evaluateProp({

    prop,

    gameLogs,

    consistency

}) {

    console.log("evaluateProp START");

    const projection =
        calculateProjectedProbability({

            gameLogs,

            prop

        });

    console.log("✓ projection");

    const isBettingModelEligible =
        projection.source === "prop_model" &&
        projection.probability !== null &&
        projection.probability !== undefined &&
        projection.probability !== "";

    const bettingProbability =
        isBettingModelEligible
            ? projection.probability
            : null;

    const scoredProp =

        scoreProp({

            prop,

            model: {

                projectedProbability:

                    bettingProbability,

                consistencyScore:

                    consistency.score

            }

        });

    console.log("✓ scoreProp");

    const edge = buildEdgeResult({

        probability:
            bettingProbability,

        impliedProbability:
            scoredProp.impliedProbability,

        consistency:
            consistency.score,

        sampleSize:
            gameLogs.length

    });

    console.log("✓ buildEdgeResult");

    return {

        ...scoredProp,

        projection,

        edge,

        evaluation: {

            sportacularScore:
                isBettingModelEligible
                    ? (edge?.score ?? scoredProp.score ?? null)
                    : null,

            modelEdge:
                isBettingModelEligible
                    ? (edge?.edgePercent ?? null)
                    : null,

            confidence:
                isBettingModelEligible
                    ? (edge?.confidence ?? "Unknown")
                    : "Low",

            recommendation:
                isBettingModelEligible
                    ? (edge?.recommendation ?? "None")
                    : "Unavailable"

        }

    };

}