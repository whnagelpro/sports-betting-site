export function buildTrends(context) {

    return context.trends.map(trend => {

        const analytics =
            trend.analytics ?? {};

        return {

            title:
                trend["Stat Type"],

            description:
                trend["Trend Note"],

            score:
                analytics.sportacularScore ??
                trend["Trend Score"],

            modelEdge:
                analytics.modelEdge ??
                (Number(trend["Trend Score"]) || 0),

            confidence:
                analytics.confidence ??
                trend["Consistency"] ??
                "Unknown",

            recommendation:
                analytics.recommendation ??
                trend["Trend Strength"] ??
                "Neutral",

            strength:
                trend["Trend Strength"] ??
                "N/A",

            consistency:
                trend["Consistency"],

            risk:
                trend["Risk Tier"]

        };

    });

}