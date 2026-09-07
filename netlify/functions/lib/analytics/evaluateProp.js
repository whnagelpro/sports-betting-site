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
                edge?.score ?? scoredProp.score ?? 0,

            modelEdge:
                edge?.edgePercent ?? 0,

            confidence:
                edge?.confidence ?? "Unknown",

            recommendation:
                edge?.recommendation ?? "None"

        }

    };

}