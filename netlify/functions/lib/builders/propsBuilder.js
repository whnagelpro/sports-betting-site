export function buildProps(context) {

    return context.props.map(prop => ({

        displayName:
            prop["Display Name"] ||
            prop["Prop Type"],

        propType:
            prop["Prop Type"],

        line:
            prop["Line Value"],

        odds:
            prop["Odds"],

        sportsbook:
            prop["Vendor"],

        probability:
            prop["Poisson Over"],

        ev:
            prop["EV Over/Milestone ($1 Bet)"]

    }));

}