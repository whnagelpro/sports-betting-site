// ======================================================
// Sportacular Analytics
// Universal Player Prop Evaluation
//
// P16:
// P15 spreadsheet outputs are authoritative for betting
// probability, EV, edge, score, risk, and confidence.
// The backend must transport those values rather than
// independently rescoring the prop.
// ======================================================


function toNullableNumber(value) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : null;
}


function normalizeBestSide(value) {

    const side =
        String(value ?? "")
            .trim()
            .toLowerCase();

    if (side === "over") {
        return "Over";
    }

    if (side === "under") {
        return "Under";
    }

    if (
        side === "no play" ||
        side === "no_play" ||
        side === "nopay"
    ) {
        return "No Play";
    }

    return null;
}


export function evaluateProp({

    prop,

    gameLogs = [],

    consistency = {}

}) {

    console.log("evaluateProp START — P15 authoritative mode");


    if (!prop) {
        return null;
    }


    const bestSide =
        normalizeBestSide(
            prop.bestSide
        );


    // --------------------------------------------------
    // P15 authoritative values
    // --------------------------------------------------

    const probability =
        toNullableNumber(
            prop.bestModelProbability ??
            prop.probability
        );

    const expectedValue =
        toNullableNumber(
            prop.bestEV ??
            prop.expectedValue
        );

    const priceEdge =
        toNullableNumber(
            prop.bestPriceEdge
        );

    const sportacularScore =
        toNullableNumber(
            prop.sportacularScore
        );

    const sportacularEdge =
        toNullableNumber(
            prop.sportacularEdge
        );

    const riskScore =
        toNullableNumber(
            prop.riskScore
        );

    const modelConfidence =
        toNullableNumber(
            prop.modelConfidence
        );


    const isActionable =
        bestSide === "Over" ||
        bestSide === "Under";


    // --------------------------------------------------
    // Compatibility object
    //
    // Keep the existing downstream object shape while
    // sourcing its betting values from P15.
    // --------------------------------------------------

    const edge = {

        probability:
            isActionable
                ? probability
                : null,

        impliedProbability:
            null,

        edge:
            isActionable
                ? priceEdge
                : null,

        edgePercent:
            isActionable &&
            sportacularEdge !== null
                ? sportacularEdge
                : null,

        score:
            isActionable
                ? sportacularScore
                : null,

        confidence:
            prop.confidenceTier ??
            null,

        recommendation:
            bestSide ??
            "No Play"

    };


    const expectedValueCompatibility =
        expectedValue === null
            ? null
            : {

                // Existing builders expect this property.
                expectedValuePercent:
                    expectedValue * 100,

                // Preserve the original $1-bet EV too.
                expectedValue

            };


    const evaluation = {

        sportacularScore,

        sportacularEdge,

        bestSide,

        bestEV:
            expectedValue,

        bestModelProbability:
            probability,

        bestPriceEdge:
            priceEdge,

        riskScore,

        riskTier:
            prop.riskTier ??
            null,

        modelConfidence,

        confidenceTier:
            prop.confidenceTier ??
            null,

        recommendation:
            bestSide ??
            "No Play",

        actionable:
            isActionable

    };


    console.log(
        "✓ P15 authoritative prop evaluation",
        {
            market: prop.market,
            bestSide,
            sportacularScore,
            sportacularEdge,
            confidenceTier:
                prop.confidenceTier ?? null
        }
    );


    return {

        ...prop,

        bestSide,

        probability:
            isActionable
                ? probability
                : null,

        expectedValue:
            expectedValueCompatibility,

        sportacularScore,

        sportacularEdge,

        score:
            sportacularScore,

        edge,

        evaluation,

        analytics: {

            sportacularScore,

            sportacularEdge,

            modelEdge:
                isActionable
                    ? priceEdge
                    : null,

            probability:
                isActionable
                    ? probability
                    : null,

            impliedProbability:
                null,

            confidence:
                prop.confidenceTier ??
                null,

            recommendation:
                bestSide ??
                "No Play",

            riskScore,

            riskTier:
                prop.riskTier ??
                null,

            modelConfidence

        }

    };

}