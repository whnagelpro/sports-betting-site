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

        seasonStats,

        gameLogs,

        trends,

        matchup,

        props,

        isPitcher: false

    };

}