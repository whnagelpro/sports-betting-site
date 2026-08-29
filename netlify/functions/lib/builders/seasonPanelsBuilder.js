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

function buildNFLRBSeasonPanels({
    season,
    games,
    trends
}) {

    return [

        {
            title: "Season Snapshot",
            stats: [

                {
                    label: "Games",
                    value: games
                },

                {
                    label: "Rush Yds",
                    value: season["Rush Yards"] ?? "-"
                },

                {
                    label: "Rush TD",
                    value: season["Rush TD"] ?? "-"
                },

                {
                    label: "Yards/Carry",
                    value: season["Yards Per Carry"] ?? "-"
                }

            ]
        },

        {
            title: "Receiving",

            stats: [

                {
                    label: "Receptions",
                    value: season["Receptions"] ?? "-"
                },

                {
                    label: "Rec Yds",
                    value: season["Receiving Yards"] ?? "-"
                },

                {
                    label: "Rec TD",
                    value: season["Receiving TD"] ?? "-"
                },

                {
                    label: "Targets",
                    value: season["Targets"] ?? "-"
                }

            ]
        },

        {
            title: "Trend Metrics",

            stats: [

                {
                    label: "Last 5 Avg",
                    value:
                        trends?.[0]?.value ??
                        "-"
                },

                {
                    label: "Hit Rate",
                    value:
                        trends?.[0]?.hitRate ??
                        "-"
                },

                {
                    label: "Current Streak",
                    value:
                        trends?.[0]?.streak ??
                        "-"
                }

            ]
        }

    ];

}

function buildNFLReceiverSeasonPanels({
    season,
    games,
    trends
}) {

    return [

        {
            title: "Season Snapshot",

            stats: [

                {
                    label: "Games",
                    value: games
                },

                {
                    label: "Receptions",
                    value: season["Receptions"] ?? "-"
                },

                {
                    label: "Receiving Yards",
                    value: season["Receiving Yards"] ?? "-"
                },

                {
                    label: "Receiving TD",
                    value: season["Receiving TD"] ?? "-"
                }

            ]
        },

        {

            title: "Usage",

            stats: [

                {
                    label: "Targets",
                    value: season["Targets"] ?? "-"
                },

                {
                    label: "Yards / Catch",
                    value: season["Yards Per Reception"] ?? "-"
                },

                {
                    label: "Longest Catch",
                    value: season["Long Reception"] ?? "-"
                },

                {
                    label: "Catch Rate",
                    value: season["Catch Rate"] ?? "-"
                }

            ]

        },

        {

            title: "Trend Metrics",

            stats: [

                {
                    label: "Last 5 Avg",
                    value:
                        trends?.[0]?.value ??
                        "-"
                },

                {
                    label: "Hit Rate",
                    value:
                        trends?.[0]?.hitRate ??
                        "-"
                },

                {
                    label: "Current Streak",
                    value:
                        trends?.[0]?.streak ??
                        "-"
                }

            ]

        }

    ];

}

export function buildSeasonPanels(context) {

    const season = context.seasonStats || {};

    const games = Number(
        season["Games Played"] ??
        season.games ??
        0
    );

    const trends = context.trends || [];

    const isPitcher = context.isPitcher;

    const league = context.league;

    const position =
        context.profile?.Position ??
        context.profile?.position ??
        "";

    const totalHits =
        Math.round(
            Number(season["Avg Hits"] || 0) * games
        );

    const totalRuns =
        Math.round(
            Number(season["Avg Runs"] || 0) * games
        );

    const totalRBIs =
        Math.round(
            Number(season["Avg RBIs"] || 0) * games
        );

    const totalHomeRuns =
        Math.round(
            Number(season["Avg Home Runs"] || 0) * games
        );

    const totalBases =
        Math.round(
            Number(season["Avg Total Bases"] || 0) * games
        );

    const totalWalks =
        Math.round(
            Number(season["Avg Walks"] || 0) * games
        );

    const totalStrikeouts =
        Math.round(
            Number(season["Avg Strikeouts"] || 0) * games
        );

    if (
        league === "nfl" &&
        ["QB", "QUARTERBACK"].includes(
            String(position).toUpperCase()
        )
    ) {
    return buildNFLQBSeasonPanels({
        season,
        games,
        trends
    });

    if (
    league === "nfl" &&
    ["RB","RUNNING BACK"].includes(
        String(position).toUpperCase()
    )
) {
    return buildNFLRBSeasonPanels({
        season,
        games,
        trends
    });

    if (
        league === "nfl" &&
        [
            "WR",
            "WIDE RECEIVER",
            "TE",
            "TIGHT END"
        ].includes(
            String(position).toUpperCase()
        )
    ) {
        return buildNFLReceiverSeasonPanels({
            season,
            games,
            trends
        });
    }
}
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