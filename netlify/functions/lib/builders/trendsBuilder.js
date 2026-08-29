export function buildTrends(context) {

    let trends = context.trends || [];

    console.log("========== BUILD TRENDS ==========");
    console.log("Player:", context.profile?.name);
    console.log("Position:", context.profile?.position);
    console.log(
        "Incoming:",
        trends.map(t => t["Stat Type"])
    );

    if (context.league === "nfl") {

        const position =
            String(context.profile?.position || "")
                .trim()
                .toUpperCase();

        let allowedStats = [];

        if (position === "QB") {

            allowedStats = [
                "Passing Yards",
                "Passing TDs",
                "Interceptions",
                "Completions",
                "Pass Attempts",
                "Rushing Yards",
                "Rushing Attempts",
                "Rushing TDs"
            ];

        } else if (position === "RB") {

            allowedStats = [
                "Rushing Yards",
                "Rushing Attempts",
                "Rushing TDs",
                "Receptions",
                "Receiving Yards",
                "Receiving TDs"
            ];

        } else if (
            position === "WR" ||
            position === "TE"
        ) {

            allowedStats = [
                "Receptions",
                "Receiving Yards",
                "Receiving TDs"
            ];

        }

        if (allowedStats.length) {

            trends = trends.filter(trend =>
                allowedStats.includes(trend["Stat Type"])
            );

        }

        console.log(
            "Filtered:",
            trends.map(t => t["Stat Type"])
        );

    }

    return trends.map(trend => {

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