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
                    .toLowerCase();

            const oddsFormat =
                type === "milestone"
                    ? "decimal"
                    : "american";

            const odds =
                oddsFormat === "decimal"
                    ? Number(prop["Decimal Odds"] ?? 0)
                    : Number(prop["Over Odds"] ?? 0);

            const probabilityValue =
                type === "milestone"
                    ? prop["Poisson Milestone"]
                    : prop["Poisson Over"];

            const probability =
                probabilityValue !== undefined &&
                probabilityValue !== null &&
                probabilityValue !== ""
                    ? Number(probabilityValue)
                    : null;

            return {

                id: prop.Id,

                type,

                market:
                    String(
                        prop["Prop Type"] ?? ""
                    ).toLowerCase(),

                displayName:
                    String(
                        prop["Prop Type"] ?? ""
                    ).replaceAll("_", " "),

                line:
                    Number(
                        prop["Line Value"] ?? 0
                    ),

                odds,

                oddsFormat,

                sportsbook:
                    prop.Vendor ?? "",

                probability,

                probabilitySource:
                    probability === null
                        ? null
                        : type === "milestone"
                            ? "poisson_milestone"
                            : "poisson_over",

                expectedValue:
                    prop["EV Over/Milestone ($1 Bet)"] !== undefined &&
                    prop["EV Over/Milestone ($1 Bet)"] !== null &&
                    prop["EV Over/Milestone ($1 Bet)"] !== ""
                        ? Number(
                            prop["EV Over/Milestone ($1 Bet)"]
                        )
                        : null,

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