// ======================================================
// Sportacular Analytics
// NFL Adapter
// ======================================================

const POSITION_GROUPS = {

    QB: "QB",

    RB: "RB",
    FB: "RB",

    WR: "WR",

    TE: "TE",

    K: "KICKER",
    PK: "KICKER",

    P: "PUNTER",

    DE: "DEFENSE",
    DT: "DEFENSE",
    DL: "DEFENSE",
    NT: "DEFENSE",

    LB: "DEFENSE",
    ILB: "DEFENSE",
    OLB: "DEFENSE",

    CB: "DEFENSE",
    DB: "DEFENSE",

    S: "DEFENSE",
    FS: "DEFENSE",
    SS: "DEFENSE",

    C: "OFFENSIVE_LINE",
    G: "OFFENSIVE_LINE",
    OG: "OFFENSIVE_LINE",
    T: "OFFENSIVE_LINE",
    OT: "OFFENSIVE_LINE",
    OL: "OFFENSIVE_LINE"

};

function getNFLPositionGroup(position) {

    const normalized =
        String(position ?? "")
            .trim()
            .toUpperCase();

    return (
        POSITION_GROUPS[normalized] ??
        "OTHER"
    );

}

export function buildNFLContext({

    profile,

    seasonStats,

    gameLogs,

    trends,

    matchup,

    props

}) {

    const positionGroup =
        getNFLPositionGroup(
            profile.Position
        );

    let quickStatCards = [];

    if (positionGroup === "QB") {

        quickStatCards = [

            {
                label: "Passing Yards",
                value: Number(
                    seasonStats["Passing Yards"] ?? 0
                )
            },

            {
                label: "Passing TDs",
                value: Number(
                    seasonStats["Passing TDs"] ?? 0
                )
            },

            {
                label: "Interceptions",
                value: Number(
                    seasonStats["Interceptions"] ?? 0
                )
            },

            {
                label: "Completions",
                value: Number(
                    seasonStats["Completions"] ?? 0
                )
            },

            {
                label: "Attempts",
                value: Number(
                    seasonStats["Pass Attempts"] ?? 0
                )
            }

        ];

    }

    if (positionGroup === "RB") {

        quickStatCards = [

            {
                label: "Rush Yards",
                value: Number(
                    seasonStats["Rushing Yards"] ?? 0
                )
            },

            {
                label: "Rush TDs",
                value: Number(
                    seasonStats["Rushing TDs"] ?? 0
                )
            },

            {
                label: "Rush Attempts",
                value: Number(
                    seasonStats["Rushing Attempts"] ?? 0
                )
            },

            {
                label: "Receptions",
                value: Number(
                    seasonStats["Receptions"] ?? 0
                )
            },

            {
                label: "Receiving Yards",
                value: Number(
                    seasonStats["Receiving Yards"] ?? 0
                )
            }

        ];

    }

    if (positionGroup === "WR") {

        quickStatCards = [

            {
                label: "Receptions",
                value: Number(
                    seasonStats["Receptions"] ?? 0
                )
            },

            {
                label: "Receiving Yards",
                value: Number(
                    seasonStats["Receiving Yards"] ?? 0
                )
            },

            {
                label: "Receiving TDs",
                value: Number(
                    seasonStats["Receiving TDs"] ?? 0
                )
            },

            {
                label: "Rush Yards",
                value: Number(
                    seasonStats["Rushing Yards"] ?? 0
                )
            },

            {
                label: "Rush TDs",
                value: Number(
                    seasonStats["Rushing TDs"] ?? 0
                )
            }

        ];

    }

    if (positionGroup === "TE") {

        quickStatCards = [

            {
                label: "Receptions",
                value: Number(
                    seasonStats["Receptions"] ?? 0
                )
            },

            {
                label: "Receiving Yards",
                value: Number(
                    seasonStats["Receiving Yards"] ?? 0
                )
            },

            {
                label: "Receiving TDs",
                value: Number(
                    seasonStats["Receiving TDs"] ?? 0
                )
            },

            {
                label: "Rush Yards",
                value: Number(
                    seasonStats["Rushing Yards"] ?? 0
                )
            },

            {
                label: "Rush TDs",
                value: Number(
                    seasonStats["Rushing TDs"] ?? 0
                )
            }

        ];

    }

    return {

        league: "nfl",

        profile: {

            id: profile.Id,

            firstName: profile["First Name"],

            lastName: profile["Last Name"],

            name: profile["Full Name"],

            team: profile["Team Name"],

            teamAbbreviation: profile["Team Abbreviation"],

            position: profile.Position,

            height: profile.Height,

            weight: profile.Weight,

            bats: "",

            throws: ""

        },

        seasonStats,

        quickStats: {

            games: Number(
                seasonStats["Games Played"] ?? 0
            ),

            cards: quickStatCards

        },

        gameLogs,

        trends,

        matchup,

        props,

        positionGroup,

        isPitcher: false

    };

}