export function buildProps(context) {

    return context.props.map(prop => {

        const evaluation =
            prop.evaluation ?? {};

        const actionable =
            evaluation.actionable === true;

        return {

            id:
                prop.id ??
                null,

            displayName:
                prop.displayName ??
                prop.market ??
                "-",

            propType:
                prop.market ??
                "",

            line:
                prop.line ??
                "-",

            odds:
                actionable
                    ? prop.odds ?? "-"
                    : "-",

            sportsbook:
                prop.sportsbook ??
                "-",

            probability:
                actionable
                    ? evaluation.bestModelProbability ?? null
                    : null,

            impliedProbability:
                null,

            modelEdge:
                actionable
                    ? evaluation.bestPriceEdge ?? null
                    : null,

            sportacularScore:
                actionable
                    ? evaluation.sportacularScore ?? null
                    : null,

            confidence:
                actionable
                    ? evaluation.confidenceTier ?? null
                    : null,

            recommendation:
                evaluation.bestSide ??
                "No Play",

            ev:
                actionable &&
                evaluation.bestEV !== null &&
                evaluation.bestEV !== undefined
                    ? evaluation.bestEV * 100
                    : null,

            analytics: {

                sportacularScore:
                    actionable
                        ? evaluation.sportacularScore ?? null
                        : null,

                modelEdge:
                    actionable
                        ? evaluation.bestPriceEdge ?? null
                        : null,

                probability:
                    actionable
                        ? evaluation.bestModelProbability ?? null
                        : null,

                impliedProbability:
                    null,

                confidence:
                    actionable
                        ? evaluation.confidenceTier ?? null
                        : null,

                recommendation:
                    evaluation.bestSide ??
                    "No Play"

            }

        };

    });

}