// ======================================================
// Sportacular Analytics
// MLB Adapter
// ======================================================

function buildMLBHitterQuickStats(seasonStats = {}) {

    return [

        {
            label: "Hits",
            value: Number(
                seasonStats["Avg Hits"] ?? 0
            ).toFixed(2)
        },

        {
            label: "Runs",
            value: Number(
                seasonStats["Avg Runs"] ?? 0
            ).toFixed(2)
        },

        {
            label: "RBIs",
            value: Number(
                seasonStats["Avg RBIs"] ?? 0
            ).toFixed(2)
        },

        {
            label: "Home Runs",
            value: Number(
                seasonStats["Avg Home Runs"] ?? 0
            ).toFixed(2)
        },

        {
            label: "Strikeouts",
            value: Number(
                seasonStats["Avg Strikeouts"] ?? 0
            ).toFixed(2)
        }

    ];

}

function formatPitcherOutsAsIP(outsValue) {

    const averageOuts =
        Number(outsValue ?? 0);

    if (!Number.isFinite(averageOuts) || averageOuts <= 0) {
        return "0.0";
    }

    /*
     * Avg Pitcher Outs can be fractional because it is
     * an average across appearances.
     *
     * Convert the average number of outs into decimal
     * innings for a per-game display.
     *
     * Example:
     * 16.2 average outs / 3 = 5.4 innings per game.
     */

    return (averageOuts / 3).toFixed(1);
}

function buildMLBPitcherQuickStats(seasonStats = {}) {

    return [

        {
            label: "IP / Game",
            value: formatPitcherOutsAsIP(
                seasonStats["Avg Pitcher Outs"]
            )
        },

        {
            label: "SO / Game",
            value: Number(
                seasonStats["Avg Pitcher Strikeouts"] ?? 0
            ).toFixed(2)
        },

        {
            label: "ER / Game",
            value: Number(
                seasonStats["Avg Pitcher Earned Runs"] ?? 0
            ).toFixed(2)
        },

        {
            label: "H / Game",
            value: Number(
                seasonStats["Avg Pitcher Hits Allowed"] ?? 0
            ).toFixed(2)
        },

        {
            label: "BB / Game",
            value: Number(
                seasonStats["Avg Pitcher Walks"] ?? 0
            ).toFixed(2)
        }

    ];

}

export function buildMLBContext({

    profile,

    seasonStats,

    gameLogs,

    trends,

    matchup,

    props,

    isPitcher

}) {

const games = Number(
    seasonStats["Games Played"] ?? 0
);

    return {

        league: "mlb",

        profile: {

            id: profile.Id,

            firstName: profile["First Name"],

            lastName: profile["Last Name"],

            name: profile["Full Name"],

            team: profile["Team Name"],

            teamAbbreviation: profile["Team Abbreviation"],

            position: profile.Position,

            height: profile.Height,

            weight: profile.Weight

        },

        quickStats: {

            games,

            cards: isPitcher
                ? buildMLBPitcherQuickStats(
                    seasonStats
                )
                : buildMLBHitterQuickStats(
                    seasonStats
                )

        },

        seasonStats,

        gameLogs,

        trends,

        matchup: matchup && Object.keys(matchup).length
            ? {

                title: `${matchup["Away Team"]} @ ${matchup["Home Team"]}`,

                subtitle: matchup["Game Date"],

                details: [

                    {

                        label: "Opponent Pitcher",

                        value:
                            matchup["Opponent Pitcher"] ?? "-"

                    },

                    {

                        label: "Throws",

                        value:
                            matchup["Opponent Throws"] ?? "-"

                    },

                    {

                        label: "Lineup Spot",

                        value:
                            matchup["Projected Lineup Spot"] ?? "-"

                    }

                ]

            }
            : null,

        props: (props ?? []).map(prop => {

            const type =
                String(
                    prop.Type ?? ""
                )
                    .trim()
                    .toLowerCase();

            const bestSideRaw =
                String(
                    prop["Best Side"] ?? ""
                )
                    .trim();

            const bestSide =
                bestSideRaw || null;

            const normalizedBestSide =
                bestSideRaw.toLowerCase();

            const hasValue = value =>
                value !== undefined &&
                value !== null &&
                value !== "";

            const toNullableNumber = value => {

                if (!hasValue(value)) {
                    return null;
                }

                const number =
                    Number(value);

                return Number.isFinite(number)
                    ? number
                    : null;
            };


            // --------------------------------------------------
            // P15 authoritative betting-side values
            // --------------------------------------------------

            let odds = null;
            let probability = null;
            let expectedValue = null;

            if (normalizedBestSide === "over") {

                odds =
                    toNullableNumber(
                        prop["Over Odds"]
                    );

                probability =
                    toNullableNumber(
                        prop["Model Prob Over"]
                    );

                expectedValue =
                    toNullableNumber(
                        prop["EV Over"]
                    );

            } else if (normalizedBestSide === "under") {

                odds =
                    toNullableNumber(
                        prop["Under Odds"]
                    );

                probability =
                    toNullableNumber(
                        prop["Model Prob Under"]
                    );

                expectedValue =
                    toNullableNumber(
                        prop["EV Under"]
                    );

            }


            // --------------------------------------------------
            // Universal P15 outputs
            // --------------------------------------------------

            const bestEV =
                toNullableNumber(
                    prop["Best EV"]
                );

            const bestModelProbability =
                toNullableNumber(
                    prop["Best Model Probability"]
                );

            const bestPriceEdge =
                toNullableNumber(
                    prop["Best Price Edge"]
                );

            const trendScore =
                toNullableNumber(
                    prop["Trend Score"]
                );

            const riskScore =
                toNullableNumber(
                    prop["Risk Score"]
                );

            const modelConfidence =
                toNullableNumber(
                    prop["Model Confidence"]
                );

            const sportacularScore =
                toNullableNumber(
                    prop["Sportacular Score"]
                );

            const sportacularEdge =
                toNullableNumber(
                    prop["Sportacular Edge"]
                );


            return {

                id:
                    prop.Id ?? null,

                type,

                market:
                    String(
                        prop["Prop Type"] ?? ""
                    )
                        .trim()
                        .toLowerCase(),

                displayName:
                    String(
                        prop["Prop Type"] ?? ""
                    )
                        .replaceAll("_", " "),

                line:
                    toNullableNumber(
                        prop["Line Value"]
                    ),

                odds,

                oddsFormat:
                    "american",

                sportsbook:
                    prop.Vendor ?? "",


                // ----------------------------------------------
                // Compatibility fields used by current backend
                // ----------------------------------------------

                probability,

                probabilitySource:
                    probability === null
                        ? null
                        : normalizedBestSide === "under"
                            ? "model_prob_under"
                            : "model_prob_over",

                expectedValue,


                // ----------------------------------------------
                // Universal Player Props contract
                // ----------------------------------------------

                bestSide,

                bestEV,

                bestModelProbability,

                bestPriceEdge,

                trendScore,

                trendStrength:
                    prop["Trend Strength"] || null,

                riskScore,

                riskTier:
                    prop["Risk Tier"] || null,

                modelConfidence,

                sportacularScore,

                sportacularEdge,

                confidenceTier:
                    prop["Confidence Tier"] || null,


                // ----------------------------------------------
                // Preserve original A:AJ row
                // ----------------------------------------------

                raw: prop

            };

        }),

        isPitcher,

        positionGroup: isPitcher
            ? "PITCHER"
            : "HITTER",

    };

}