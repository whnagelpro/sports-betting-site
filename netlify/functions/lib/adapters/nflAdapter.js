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

    let allowedTrendStats = [];

    if (positionGroup === "QB") {

        allowedTrendStats = [
            "Passing Yards",
            "Passing TDs",
            "Interceptions",
            "Completions",
            "Pass Attempts",
            "Rushing Yards",
            "Rushing Attempts",
            "Rushing TDs"
        ];

    } else if (positionGroup === "RB") {

        allowedTrendStats = [
            "Rushing Yards",
            "Rushing Attempts",
            "Rushing TDs",
            "Receptions",
            "Receiving Yards",
            "Receiving TDs"
        ];

    } else if (
        positionGroup === "WR" ||
        positionGroup === "TE"
    ) {

        allowedTrendStats = [
            "Receptions",
            "Receiving Yards",
            "Receiving TDs"
        ];

    }

    const filteredTrends =
        allowedTrendStats.length
            ? (trends || []).filter(trend =>
                allowedTrendStats.includes(
                    trend["Stat Type"]
                )
            )
            : trends || [];

    console.log(
        "Filtered NFL Raw Trends:",
        filteredTrends.map(
            trend => trend["Stat Type"]
        )
    );

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

        trends: filteredTrends,

        matchup,

        props: (props ?? []).map(prop => {

            const type =
                String(prop.Type ?? "")
                    .trim()
                    .toLowerCase();

            const bestSideRaw =
                String(prop["Best Side"] ?? "")
                    .trim();

            const bestSide =
                bestSideRaw || null;

            const normalizedBestSide =
                bestSideRaw.toLowerCase();


            const hasValue = value =>
                value !== undefined &&
                value !== null &&
                value !== "";


            const toNullableNumber = value => {

                if (!hasValue(value)) {
                    return null;
                }

                const number = Number(value);

                return Number.isFinite(number)
                    ? number
                    : null;
            };


            let odds = null;
            let probability = null;
            let expectedValue = null;


            if (normalizedBestSide === "over") {

                odds =
                    toNullableNumber(
                        prop["Over Odds"]
                    );

                probability =
                    toNullableNumber(
                        prop["Model Prob Over"]
                    );

                expectedValue =
                    toNullableNumber(
                        prop["EV Over"]
                    );

            } else if (normalizedBestSide === "under") {

                odds =
                    toNullableNumber(
                        prop["Under Odds"]
                    );

                probability =
                    toNullableNumber(
                        prop["Model Prob Under"]
                    );

                expectedValue =
                    toNullableNumber(
                        prop["EV Under"]
                    );
            }


            const bestEV =
                toNullableNumber(
                    prop["Best EV"]
                );

            const bestModelProbability =
                toNullableNumber(
                    prop["Best Model Probability"]
                );

            const bestPriceEdge =
                toNullableNumber(
                    prop["Best Price Edge"]
                );

            const trendScore =
                toNullableNumber(
                    prop["Trend Score"]
                );

            const riskScore =
                toNullableNumber(
                    prop["Risk Score"]
                );

            const modelConfidence =
                toNullableNumber(
                    prop["Model Confidence"]
                );

            const sportacularScore =
                toNullableNumber(
                    prop["Sportacular Score"]
                );

            const sportacularEdge =
                toNullableNumber(
                    prop["Sportacular Edge"]
                );


            return {

                id:
                    prop.Id ?? null,

                type,

                market:
                    String(
                        prop["Prop Type"] ?? ""
                    )
                        .trim()
                        .toLowerCase(),

                displayName:
                    String(
                        prop["Prop Type"] ?? ""
                    )
                        .replaceAll("_", " "),

                line:
                    toNullableNumber(
                        prop["Line Value"]
                    ),

                odds,

                oddsFormat: "american",

                sportsbook:
                    prop.Vendor ?? "",

                probability,

                probabilitySource:
                    probability === null
                        ? null
                        : normalizedBestSide === "under"
                            ? "model_prob_under"
                            : "model_prob_over",

                expectedValue,

                bestSide,

                bestEV,

                bestModelProbability,

                bestPriceEdge,

                trendScore,

                trendStrength:
                    prop["Trend Strength"] || null,

                riskScore,

                riskTier:
                    prop["Risk Tier"] || null,

                modelConfidence,

                sportacularScore,

                sportacularEdge,

                confidenceTier:
                    prop["Confidence Tier"] || null,

                raw: prop
            };

        }),

        positionGroup,

        isPitcher: false

    };

}