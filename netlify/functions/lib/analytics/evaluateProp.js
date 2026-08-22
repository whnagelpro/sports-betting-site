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

    const scoredProp =

        scoreProp({

            prop,

            model: {

                projectedProbability:

                    projection.probability,

                consistencyScore:

                    consistency.score

            }

        });

    console.log("✓ scoreProp");

    const edge = buildEdgeResult({

        probability:
            projection.probability,

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