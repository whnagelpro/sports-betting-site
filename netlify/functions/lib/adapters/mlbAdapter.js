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

function buildMLBPitcherQuickStats(seasonStats = {}) {

    return [

        {
            label: "IP",
            value: Number(
                seasonStats["Avg Pitcher Outs"] ?? 0
            ).toFixed(1)
        },

        {
            label: "Strikeouts",
            value: Number(
                seasonStats["Avg Pitcher Strikeouts"] ?? 0
            ).toFixed(2)
        },

        {
            label: "ER",
            value: Number(
                seasonStats["Avg Pitcher Earned Runs"] ?? 0
            ).toFixed(2)
        },

        {
            label: "Hits Allowed",
            value: Number(
                seasonStats["Avg Pitcher Hits Allowed"] ?? 0
            ).toFixed(2)
        },

        {
            label: "Walks",
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

            cards: context.isPitcher
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
                ).toLowerCase();

            const oddsFormat =

                type === "milestone"

                    ? "decimal"

                    : "american";

            const odds =

                oddsFormat === "decimal"

                    ? Number(
                        prop["Decimal Odds"] ?? 0
                    )

                    : Number(
                        prop["Over Odds"] ?? 0
                    );

            return {

                id:
                    prop.Id,

                type,

                market:
                    String(
                        prop["Prop Type"] ?? ""
                    ).toLowerCase(),

                displayName:
                    String(
                        prop["Prop Type"] ?? ""
                    )
                        .replaceAll("_", " "),

                line:
                    Number(
                        prop["Line Value"] ?? 0
                    ),

                odds,

                oddsFormat,

                sportsbook:
                    prop.Vendor ?? "",

                probability:
                    Number(
                        prop["Poisson Over"] ?? 0
                    ),

                expectedValue:
                    Number(
                        prop["EV Over/Milestone ($1 Bet)"] ?? 0
                    ),

                raw: prop

            };

        }),

        isPitcher

    };

}