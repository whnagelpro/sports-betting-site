// ======================================================
// Sportacular Analytics
// Insight Mapper
// ======================================================

export function mapInsights(trends) {

    if (!Array.isArray(trends)) {

        return [];

    }

    return trends

        .filter(
            trend => trend.trendNote
        )

        .sort((a, b) =>

            Number(
                b.trendScore ?? 0
            ) -

            Number(
                a.trendScore ?? 0
            )

        )

        .map(trend => ({

            statType: trend.statType,

            title: trend.statType,

            icon: getTrendIcon(

                trend.trendDirection

            ),

            text: trend.trendNote,

            trendScore: trend.trendScore,

            trendStrength: trend.trendStrength,

            riskTier: trend.riskTier

        }));

}

function getTrendIcon(direction) {

    switch (

        String(direction)

            .toLowerCase()

    ) {

        case "up":

            return "📈";

        case "down":

            return "📉";

        default:

            return "⚾";

    }

}