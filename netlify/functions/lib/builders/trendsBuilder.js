export function buildTrends(context) {

    return context.trends.map(trend => ({

        title:

            trend["Stat Type"],

        description:

            trend["Trend Note"],

        score:

            trend["Trend Score"],

        modelEdge:
    
            Number(trend["Trend Score"]) || 0,

        confidence:
    
            trend["Consistency"] || "Unknown",

        recommendation:
    
            trend["Trend Strength"] || "Neutral",

        strength:

            trend["Trend Strength"],

        consistency:

            trend["Consistency"],

        risk:

            trend["Risk Tier"]

    }));

}