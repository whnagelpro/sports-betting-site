// ======================================================
// Sportacular Analytics
// NHL Adapter
// ======================================================


export function buildNHLContext({

    profile,

    seasonStats,

    gameLogs,

    trends,

    matchup,

    props

}) {

    return {

        league: "nhl",

        profile: {

            id: profile.Id,

            firstName: profile["First Name"],

            lastName: profile["Last Name"],

            name: profile["Full Name"],

            team:
                seasonStats["Team"] ??
                "",

            teamAbbreviation: "",

            position:
                profile["Position Code"] ??
                "",

            height:
                profile["Height in Inches"] ??
                "",

            weight:
                profile["Weight in Pounds"] ??
                "",

            bats: "",

            throws: ""

        },


        quickStats: {

            games: Number(
                seasonStats["Games Played"] ?? 0
            ),

            cards: [

                {

                    label: "Goals",

                    value: Number(
                        seasonStats["Avg Goals"] ?? 0
                    ).toFixed(1)

                },

                {

                    label: "Assists",

                    value: Number(
                        seasonStats["Avg Assists"] ?? 0
                    ).toFixed(1)

                },

                {

                    label: "Points",

                    value: Number(
                        seasonStats["Avg Points"] ?? 0
                    ).toFixed(1)

                },

                {

                    label: "Shots on Goal",

                    value: Number(
                        seasonStats["Avg Shots On Goal"] ?? 0
                    ).toFixed(1)

                },

                {

                    label: "Saves",

                    value: Number(
                        seasonStats["Avg Saves"] ?? 0
                    ).toFixed(1)

                }

            ]

        },


        seasonStats,

        gameLogs,

        trends,

        matchup,

        props: (props ?? []).map(prop => {

            const type =
                String(prop.Type ?? "")
                    .trim()
                    .toLowerCase();

            const bestSideRaw =
                String(prop["Best Side"] ?? "")
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


            // ==================================================
            // P15 AUTHORITATIVE SELECTED-SIDE VALUES
            // ==================================================

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


            // ==================================================
            // UNIVERSAL P15 OUTPUTS
            // ==================================================

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
                // Preserve original universal A:AJ row
                // ----------------------------------------------

                raw: prop

            };

        }),

        insights: [],

        analytics: {

            score: null,

            recommendation: "-",

            confidence: "-",

            modelEdge: {

                edgePercent: null

            },

            bestProp: null

        },

        positionGroup:
            String(
                profile["Position Code"] ?? ""
            )
                .trim()
                .toUpperCase(),

        isPitcher: false

    };

}