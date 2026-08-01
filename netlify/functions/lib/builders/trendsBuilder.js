export function buildTrends(context) {

    return context.trends.map(trend => ({

        title:

            trend["Stat Type"],

        description:

            trend["Trend Note"],

        score:

            trend["Trend Score"],

        strength:

            trend["Trend Strength"],

        consistency:

            trend["Consistency"],

        risk:

            trend["Risk Tier"]

    }));

}