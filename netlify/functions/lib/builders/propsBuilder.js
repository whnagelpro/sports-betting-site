export function buildProps(context) {

    return context.props.map(prop => ({

        id:
            prop.id ??
            null,

        displayName:
            prop.displayName ??
            prop.market ??
            "-",

        propType:
            prop.market ?? "",

        line:
            prop.line ?? "-",

        odds:
            prop.odds ?? "-",

        sportsbook:
            prop.sportsbook ?? "-",

        probability:
            prop.edge?.probability ??
            prop.probability ??
            "-",

        impliedProbability:
            prop.edge?.impliedProbability ??
            null,

        modelEdge:
            prop.edge?.edgePercent ??
            null,

        sportacularScore:
            prop.edge?.score ??
            prop.score ??
            null,

        confidence:
            prop.edge?.confidence ??
            null,

        recommendation:
            prop.edge?.recommendation ??
            null,

        ev:
            prop.expectedValue?.expectedValuePercent ??
            prop.ev ??
            "-"

    }));

}