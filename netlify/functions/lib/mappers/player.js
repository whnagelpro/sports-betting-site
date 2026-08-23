import { calculatePlayerAnalytics } from "../analytics/playerAnalytics.js";
import { mapGameLogs } from "./gameLogs.js";
import { mapTrends } from "./trends.js";
import { mapInsights } from "./insights.js";

// ======================================================
// Sportacular Analytics
// Player Mapper
// ======================================================

export function mapPlayer(context, league) {

    const {

        profile,

        seasonStats,

        gameLogs,

        trends,

        matchup,

        props

    } = context;

    const playerProfile = buildProfile(profile);

    const season = buildSeason(

        profile,

        seasonStats

    );

    const mappedGameLogs = mapGameLogs(

    gameLogs,

    profile.position

);

const mappedTrends =
    mapTrends(
        trends
    );

const mappedInsights =
    mapInsights(
        mappedTrends
    );

const trendsData = buildTrends(

    profile,

    mappedGameLogs,

    mappedTrends,

    mappedInsights

);

    const analytics = calculatePlayerAnalytics({

        row: profile,

        seasonStats,

        gameLogs: mappedGameLogs,

        matchup,

        props

    });

    return {

        ...playerProfile,

        league,

        quickStats: season.quickStats,

        season: season.raw,

        seasonPanels: season.panels,

        matchup,

        props,

        trends: trendsData.items,

        gameLogs: trendsData.gameLogs,

        insights: trendsData.insights,

        analytics,

        summary: {},

        relatedPlayers: []

    };

}

function buildProfile(row) {

    return {

        id: row.Id,

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

        analyticsScore: null,

        age: null,

        headshot: null

    };

}

function buildSeason(row, seasonStats) {

    return {

        raw: seasonStats,

        quickStats: buildQuickStats(row, seasonStats),

        panels: buildSeasonPanels(row, seasonStats)

    };

}

function buildTrends(
    row,
    gameLogs,
    mappedTrends,
    mappedInsights
) {

    return {

        items: mappedTrends,

        gameLogs,

        insights: mappedInsights

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