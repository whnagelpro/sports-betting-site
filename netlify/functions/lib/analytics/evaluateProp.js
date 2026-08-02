import { calculateProjectedProbability } from "./projectedProbability.js";
import { scoreProp } from "./scoreProp.js";

export function evaluateProp({

    prop,

    gameLogs,

    consistency

}) {

    const projection =

        calculateProjectedProbability({

            gameLogs,

            prop

        });

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

    return {

        ...scoredProp,

        projection,

        edge

    };

}