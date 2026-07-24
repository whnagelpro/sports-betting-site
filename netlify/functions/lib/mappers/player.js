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

        quickStats: {

    avg: "",

    ops: "",

    hr: "",

    rbi: "",

    runs: "",

    hits: ""

},

        matchup: {},

        props: [],

        trends: [],

        season: seasonStats,

        gameLogs: [],

        summary: {},

        relatedPlayers: []

    };

}