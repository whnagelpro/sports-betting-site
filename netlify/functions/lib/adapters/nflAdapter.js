// ======================================================
// Sportacular Analytics
// NFL Adapter
// ======================================================

const POSITION_GROUPS = {

    // Quarterbacks
    QB: "QB",
    QUARTERBACK: "QB",

    // Running Backs
    RB: "RB",
    FB: "RB",
    "RUNNING BACK": "RB",
    FULLBACK: "RB",

    // Wide Receivers
    WR: "WR",
    "WIDE RECEIVER": "WR",

    // Tight Ends
    TE: "TE",
    "TIGHT END": "TE",

    // Kickers
    K: "KICKER",
    PK: "KICKER",
    KICKER: "KICKER",

    // Punters
    P: "PUNTER",
    PUNTER: "PUNTER",

    // Defensive Line
    DE: "DEFENSE",
    DT: "DEFENSE",
    DL: "DEFENSE",
    NT: "DEFENSE",
    "DEFENSIVE END": "DEFENSE",
    "DEFENSIVE TACKLE": "DEFENSE",
    "NOSE TACKLE": "DEFENSE",

    // Linebackers
    LB: "DEFENSE",
    ILB: "DEFENSE",
    OLB: "DEFENSE",
    LINEBACKER: "DEFENSE",
    "INSIDE LINEBACKER": "DEFENSE",
    "OUTSIDE LINEBACKER": "DEFENSE",

    // Defensive Backs
    CB: "DEFENSE",
    DB: "DEFENSE",
    S: "DEFENSE",
    FS: "DEFENSE",
    SS: "DEFENSE",
    "CORNERBACK": "DEFENSE",
    SAFETY: "DEFENSE",
    "FREE SAFETY": "DEFENSE",
    "STRONG SAFETY": "DEFENSE",

    // Offensive Line
    C: "OFFENSIVE_LINE",
    G: "OFFENSIVE_LINE",
    OG: "OFFENSIVE_LINE",
    T: "OFFENSIVE_LINE",
    OT: "OFFENSIVE_LINE",
    OL: "OFFENSIVE_LINE",
    CENTER: "OFFENSIVE_LINE",
    GUARD: "OFFENSIVE_LINE",
    "OFFENSIVE GUARD": "OFFENSIVE_LINE",
    TACKLE: "OFFENSIVE_LINE",
    "OFFENSIVE TACKLE": "OFFENSIVE_LINE",
    "OFFENSIVE LINEMAN": "OFFENSIVE_LINE"

};

function getNFLPositionGroup(position) {

    const normalized =
        String(position ?? "")
            .trim()
            .toUpperCase();

    console.log("Normalized Position:", normalized);

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

    console.log("Raw position:", profile.Position);
    console.log("Profile:", profile);
    console.log("Position group:", positionGroup);

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

    console.log("Quick Stat Cards:", quickStatCards);

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