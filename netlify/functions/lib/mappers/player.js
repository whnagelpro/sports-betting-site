// ======================================================
// Sportacular Analytics
// Player Mapper
// ======================================================

export function mapPlayer(row, league, seasonStats = {}) {

    return {

        id: row.Id,

        league,

        name: row["Full Name"],

        firstName: row["First Name"],

        lastName: row["Last Name"],

        team: row["Team Name"],

        teamAbbreviation: row["Team Abbreviation"],

        position: row.Position,

        height: row.Height,

        weight: row.Weight,

        jerseyNumber: row["Jersey Number"],

        bats: row.Bats,

        throws: row.Throws,

        status: row.Status,

        analyticsScore: 0,

        age: "",

        headshot: "",

        quickStats: buildQuickStats(

    row,

    seasonStats

),

        matchup: {},

        props: [],

        trends: [],

        season: seasonStats,

        seasonPanels: buildSeasonPanels(

            row,

            seasonStats

        ),

        insights: buildInsights(
            row,
            seasonStats
        ),

        analytics: calculatePlayerAnalytics({

            row,

            seasonStats,

            gameLogs,

            matchup,

            props

        }),

        gameLogs: buildGameLogs(
            row
        ),

        summary: {},

        relatedPlayers: []

    };

}

function buildQuickStats(row, seasonStats) {

    const position = (row.Position || "").toUpperCase();

    // Pitchers
    if (["SP", "RP", "P"].includes(position)) {

        return [

            {
                label: "Games",
                value: seasonStats["Games Played"] || "-"
            },

            {
                label: "Strikeouts",
                value: seasonStats["Avg Pitcher Strikeouts"] || "-"
            },

            {
                label: "Walks",
                value: seasonStats["Avg Pitcher Walks"] || "-"
            },

            {
                label: "ERA",
                value: seasonStats["Avg Pitcher Earned Runs"] || "-"
            },

            {
                label: "Hits Allowed",
                value: seasonStats["Avg Pitcher Hits Allowed"] || "-"
            },

            {
                label: "Consistency",
                value: seasonStats["Consistency Score"] || "-"
            }

        ];

    }

    // Hitters
    return [

        {
            label: "AVG",
            value: seasonStats["Avg Hits"] || "-"
        },

        {
            label: "HR",
            value: seasonStats["Avg Home Runs"] || "-"
        },

        {
            label: "RBI",
            value: seasonStats["Avg RBIs"] || "-"
        },

        {
            label: "Runs",
            value: seasonStats["Avg Runs"] || "-"
        },

        {
            label: "Hits",
            value: seasonStats["Avg Hits"] || "-"
        },

        {
            label: "Consistency",
            value: seasonStats["Consistency Score"] || "-"
        }

    ];

}

function buildSeasonPanels(row, seasonStats) {

    const position = (row.Position || "").toUpperCase();

    if (["SP", "RP", "P"].includes(position)) {

        return [

            {
                title: "Pitching",

                stats: [

                    {
                        label: "Games",
                        value: seasonStats["Games Played"] || "-"
                    },

                    {
                        label: "Strikeouts",
                        value: seasonStats["Avg Pitcher Strikeouts"] || "-"
                    },

                    {
                        label: "Walks",
                        value: seasonStats["Avg Pitcher Walks"] || "-"
                    },

                    {
                        label: "ERA",
                        value: seasonStats["Avg Pitcher Earned Runs"] || "-"
                    }

                ]

            },

            {
                title: "Advanced",

                stats: [

                    {
                        label: "Hits Allowed",
                        value: seasonStats["Avg Pitcher Hits Allowed"] || "-"
                    },

                    {
                        label: "Consistency",
                        value: seasonStats["Consistency Score"] || "-"
                    }

                ]

            }

        ];

    }

    // Temporary hitter placeholder

    return [];

}

function buildInsights(row, seasonStats) {

    const position = (row.Position || "").toUpperCase();

    if (["SP", "RP", "P"].includes(position)) {

        return [

            {
                icon: "🔥",
                title: "Recent Form",
                text: "Pitching consistently over recent appearances."
            },

            {
                icon: "📈",
                title: "Strikeout Trend",
                text: "Generating strong strikeout production recently."
            },

            {
                icon: "⚾",
                title: "Matchup",
                text: "Today's matchup projects favorably."
            }

        ];

    }

    return [

        {
            icon: "🔥",
            title: "Recent Form",
            text: "Swinging the bat well recently."
        },

        {
            icon: "📈",
            title: "Power Trend",
            text: "Power numbers have been trending upward."
        },

        {
            icon: "⚾",
            title: "Matchup",
            text: "Today's matchup favors this hitter."
        }

    ];

}

function buildGameLogs(row) {

    return [

        {
            date: "7/20",
            opponent: "PIT",
            result: "W 5-2",
            innings: "6.0",
            strikeouts: 8,
            walks: 2,
            hits: 4,
            earnedRuns: 1
        },

        {
            date: "7/14",
            opponent: "CHC",
            result: "W 4-1",
            innings: "7.0",
            strikeouts: 9,
            walks: 1,
            hits: 5,
            earnedRuns: 0
        }

    ];

}

function buildAnalytics(row, seasonStats) {

    const position = (row.Position || "").toUpperCase();

    if (["SP","RP","P"].includes(position)) {

        return {

            score: 92,

            confidence: "High",

            recommendation: "Elite Play",

            bestProp: {

                market: "Strikeouts",

                line: "Over 5.5",

                ev: "+8.2%"

            },

            strengths: [

                "Strong recent strikeout production",

                "Consistent innings workload",

                "Favorable projected matchup"

            ],

            weaknesses: [

                "Walk rate can occasionally spike"

            ]

        };

    }

    return {

        score: 90,

        confidence: "High",

        recommendation: "Strong Play",

        bestProp: {

            market: "Hits",

            line: "Over 1.5",

            ev: "+6.4%"

        },

        strengths: [

            "Excellent recent contact",

            "Power trending upward",

            "Positive matchup"

        ],

        weaknesses: [

            "Occasional strikeout volatility"

        ]

    };

}