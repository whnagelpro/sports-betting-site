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
                ).toLowerCase();

            const oddsFormat = "american";

            const odds =

                type === "milestone"

                    ? (
                        prop["Odds"] !== undefined &&
                        prop["Odds"] !== null &&
                        prop["Odds"] !== ""
                            ? Number(prop["Odds"])
                            : null
                    )

                    : (
                        prop["Over Odds"] !== undefined &&
                        prop["Over Odds"] !== null &&
                        prop["Over Odds"] !== ""
                            ? Number(prop["Over Odds"])
                            : null
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
                    String(prop.Type ?? "").toLowerCase() === "milestone"
                        ? (
                            prop["Poisson Milestone"] !== undefined &&
                            prop["Poisson Milestone"] !== null &&
                            prop["Poisson Milestone"] !== ""
                                ? Number(prop["Poisson Milestone"])
                                : null
                        )
                        : (
                            prop["Poisson Over"] !== undefined &&
                            prop["Poisson Over"] !== null &&
                            prop["Poisson Over"] !== ""
                                ? Number(prop["Poisson Over"])
                                : null
                        ),

                probabilitySource:
                    String(prop.Type ?? "").toLowerCase() === "milestone"
                        ? (
                            prop["Poisson Milestone"] !== undefined &&
                            prop["Poisson Milestone"] !== null &&
                            prop["Poisson Milestone"] !== ""
                                ? "poisson_milestone"
                                : null
                        )
                        : (
                            prop["Poisson Over"] !== undefined &&
                            prop["Poisson Over"] !== null &&
                            prop["Poisson Over"] !== ""
                                ? "poisson_over"
                                : null
                        ),

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

        isPitcher,

        positionGroup: isPitcher
            ? "PITCHER"
            : "HITTER",

    };

}