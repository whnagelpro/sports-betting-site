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

            team: profile["Team Name"],

            teamAbbreviation: profile["Team Abbreviation"],

            position: profile.Position,

            height: profile.Height,

            weight: profile.Weight,

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
                        seasonStats["Avg Shots on Goal"] ?? 0
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

        props,

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
                profile.Position ?? ""
            )
                .trim()
                .toUpperCase(),

        isPitcher: false

    };

}