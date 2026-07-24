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

        gameLogs: [],

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