// ======================================================
// Sportacular Analytics
// NBA Adapter
// ======================================================

export function buildNBAContext({

    profile,

    seasonStats,

    gameLogs,

    trends,

    matchup,

    props

}) {

    return {

        league: "nba",

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

                    label: "Points",

                    value: Number(
                        seasonStats["Avg Points"] ?? 0
                    ).toFixed(1)

                },

                {

                    label: "Rebounds",

                    value: Number(
                        seasonStats["Avg Rebounds"] ?? 0
                    ).toFixed(1)

                },

                {

                    label: "Assists",

                    value: Number(
                        seasonStats["Avg Assists"] ?? 0
                    ).toFixed(1)

                },

                {

                    label: "Threes",

                    value: Number(
                        seasonStats["Avg Threes"] ?? 0
                    ).toFixed(1)

                },

                {

                    label: "PRA",

                    value: Number(
                        seasonStats["Avg PRA"] ?? 0
                    ).toFixed(1)

                }

            ]

        },

        seasonStats,

        gameLogs,

        trends,

        matchup,

        props,

        isPitcher: false

    };

}