export function buildProps(context) {

    return context.props.map(prop => ({

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
            prop.probability ?? "-",

        ev:
            prop.ev ?? "-"

    }));

}