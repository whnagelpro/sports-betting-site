function buildMLBPitcherSeasonPanels({
    season,
    games,
    trends
}) {

    const totalOuts =
        Math.round(
            Number(
                season["Avg Pitcher Outs"] || 0
            ) * games
        );

    const innings =
        Math.floor(totalOuts / 3);

    const remainingOuts =
        totalOuts % 3;

    const inningsPitched =
        `${innings}.${remainingOuts}`;

    return [

        {
            title: "Season Production",

            stats: [

                {
                    label: "Games",
                    value: games
                },

                {
                    label: "Innings Pitched",
                    value: inningsPitched
                },

                {
                    label: "Strikeouts",

                    value: Math.round(
                        Number(
                            season["Avg Pitcher Strikeouts"] || 0
                        ) * games
                    )
                },

                {
                    label: "Earned Runs",

                    value: Math.round(
                        Number(
                            season["Avg Pitcher Earned Runs"] || 0
                        ) * games
                    )
                },

                {
                    label: "Hits Allowed",

                    value: Math.round(
                        Number(
                            season["Avg Pitcher Hits Allowed"] || 0
                        ) * games
                    )
                },

                {
                    label: "Walks",

                    value: Math.round(
                        Number(
                            season["Avg Pitcher Walks"] || 0
                        ) * games
                    )
                }

            ]
        },

        {
            title: "Per Game",

            stats: [

                {
                    label: "Strikeouts / Game",

                    value: Number(
                        season["Avg Pitcher Strikeouts"] || 0
                    ).toFixed(2)
                },

                {
                    label: "Outs / Game",

                    value: Number(
                        season["Avg Pitcher Outs"] || 0
                    ).toFixed(2)
                },

                {
                    label: "ER / Game",

                    value: Number(
                        season["Avg Pitcher Earned Runs"] || 0
                    ).toFixed(2)
                },

                {
                    label: "Hits Allowed / Game",

                    value: Number(
                        season["Avg Pitcher Hits Allowed"] || 0
                    ).toFixed(2)
                },

                {
                    label: "Walks / Game",

                    value: Number(
                        season["Avg Pitcher Walks"] || 0
                    ).toFixed(2)
                }

            ]
        },

        {
            title: "Trend Metrics",

            stats: [

                {
                    label: "Consistency",
                    value: trends[0]?.consistency ?? "-"
                },

                {
                    label: "Trend Strength",
                    value: trends[0]?.strength ?? "-"
                },

                {
                    label: "Risk Tier",
                    value: trends[0]?.risk ?? "-"
                }

            ]
        }

    ];

}

function buildNFLQBSeasonPanels({

    season,

    games,

    trends

}) {

    return [

        {

            title: "Passing",

            stats: [

                {

                    label: "Games",

                    value: games

                },

                {

                    label: "Passing Yards",

                    value:
                        season["Passing Yards"] ??
                        "-"

                },

                {

                    label: "Passing TDs",

                    value:
                        season["Passing TDs"] ??
                        "-"

                },

                {

                    label: "Completions",

                    value:
                        season["Completions"] ??
                        "-"

                },

                {

                    label: "Attempts",

                    value:
                        season["Pass Attempts"] ??
                        "-"

                }

            ]

        },

        {

            title: "Rushing",

            stats: [

                {

                    label: "Rush Yards",

                    value:
                        season["Rushing Yards"] ??
                        "-"

                },

                {

                    label: "Rush Attempts",

                    value:
                        season["Rushing Attempts"] ??
                        "-"

                },

                {

                    label: "Rush TDs",

                    value:
                        season["Rushing TDs"] ??
                        "-"

                }

            ]

        },

        {

            title: "Trend Metrics",

            stats: [

                {

                    label: "Consistency",

                    value:
                        trends?.[0]?.consistency ??
                        "-"

                },

                {

                    label: "Trend Strength",

                    value:
                        trends?.[0]?.strength ??
                        "-"

                },

                {

                    label: "Risk Tier",

                    value:
                        trends?.[0]?.risk ??
                        "-"

                }

            ]

        }

    ];

}

export function buildSeasonPanels({
    season,
    games,
    totalHits,
    totalRuns,
    totalRBIs,
    totalHomeRuns,
    totalBases,
    totalWalks,
    totalStrikeouts,
    trends,
    isPitcher,
    league,
    position
}) {

if (
    league === "nfl" &&
    String(position).toUpperCase() === "QB"
) {
    return buildNFLQBSeasonPanels({
        season,
        games,
        trends
    });
}

if (isPitcher) {

    return buildMLBPitcherSeasonPanels({
        season,
        games,
        trends
    });

}

    return [

        {

            title: "Season Production",

            stats: [

                {

                    label: "Games",

                    value: games

                },

                {

                    label: "Hits",

                    value: totalHits

                },

                {

                    label: "Runs",

                    value: totalRuns

                },

                {

                    label: "RBIs",

                    value: totalRBIs

                },

                {

                    label: "Home Runs",

                    value: totalHomeRuns

                },

                {

                    label: "Total Bases",

                    value: totalBases

                },

                {

                    label: "Walks",

                    value: totalWalks

                },

                {

                    label: "Strikeouts",

                    value: totalStrikeouts

                }

            ]

        },

        {

            title: "Per Game",

            stats: [

                {

                    label: "Hits / Game",

                    value: Number(season["Avg Hits"] || 0).toFixed(2)

                },

                {

                    label: "Runs / Game",

                    value: Number(season["Avg Runs"] || 0).toFixed(2)

                },

                {

                    label: "RBIs / Game",

                    value: Number(season["Avg RBIs"] || 0).toFixed(2)

                },

                {

                    label: "HR / Game",

                    value: Number(season["Avg Home Runs"] || 0).toFixed(2)

                },

                {

                    label: "TB / Game",

                    value: Number(season["Avg Total Bases"] || 0).toFixed(2)

                },

                {

                    label: "BB / Game",

                    value: Number(season["Avg Walks"] || 0).toFixed(2)

                },

                {

                    label: "SO / Game",

                    value: Number(season["Avg Strikeouts"] || 0).toFixed(2)

                }

            ]

        },

        {

            title: "Trend Metrics",

            stats: [

                {

                    label: "Consistency",

                    value: trends[0]?.consistency ?? "-"

                },

                {

                    label: "Trend Strength",

                    value: trends[0]?.strength ?? "-"

                },

                {

                    label: "Risk Tier",

                    value: trends[0]?.risk ?? "-"

                }

            ]

        }

    ];

}