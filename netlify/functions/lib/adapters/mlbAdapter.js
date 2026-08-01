// ======================================================
// Sportacular Analytics
// MLB Adapter
// ======================================================

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

            cards: [

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

            ]

        },

        seasonStats,

        gameLogs,

        trends,

        matchup,

        props,

        isPitcher

    };

}