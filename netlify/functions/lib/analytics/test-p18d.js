/*
    P18-D1 — PLAYER PAGE FRONTEND CONTRACT REGRESSION

    Purpose:
    Freeze the frontend-facing Player Props contract after P18-C.

    This test intentionally does NOT import player-page.js because
    player-page.js is a browser script and the project does not use
    a DOM test dependency.

    D1 freezes the contract consumed by:
      - renderAnalyticsDashboard()
      - renderProps()
      - All Available Props cards

    Production player-page.js is NOT modified by this test.
*/

const results = [];

function record(name, pass, details = {}) {
    const result = {
        name,
        pass: Boolean(pass),
        ...details
    };

    results.push(result);

    console.log(
        JSON.stringify(result)
    );
}

function expectEqual(name, actual, expected) {
    record(
        name,
        Object.is(actual, expected),
        {
            expected,
            actual
        }
    );
}


// ------------------------------------------------------
// Frozen player-page.js utility behavior
// ------------------------------------------------------

function formatEdgePercent(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "-";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "-";
    }

    if (Math.abs(number) <= 1) {
        return `${(number * 100).toFixed(1)}%`;
    }

    if (Math.abs(number) <= 100) {
        return `${number.toFixed(1)}%`;
    }

    return "-";
}


function formatProbability(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "-";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "-";
    }

    if (number >= 0 && number <= 1) {
        return `${(number * 100).toFixed(1)}%`;
    }

    if (number > 1 && number <= 100) {
        return `${number.toFixed(1)}%`;
    }

    return "-";
}


function formatDashboardStars(value) {

    const numericStars =
        Number(value);

    if (!Number.isFinite(numericStars)) {
        return "☆☆☆☆☆";
    }

    const boundedStars =
        Math.max(
            0,
            Math.min(5, numericStars)
        );

    const fullStars =
        Math.floor(boundedStars);

    const hasHalfStar =
        boundedStars - fullStars >= 0.5;

    return (
        "★".repeat(fullStars) +
        (hasHalfStar ? "½" : "") +
        "☆".repeat(
            Math.max(
                0,
                5 - fullStars - (hasHalfStar ? 1 : 0)
            )
        )
    );
}


function getTrendSampleSize({
    trend = null,
    gameLogs = []
} = {}) {

    const rawSampleSize =
        trend?.sampleSize ??
        trend?.games ??
        trend?.gamesPlayed ??
        gameLogs?.length ??
        null;

    if (
        rawSampleSize === null ||
        rawSampleSize === undefined ||
        rawSampleSize === "" ||
        !Number.isFinite(Number(rawSampleSize))
    ) {
        return null;
    }

    return Math.max(
        0,
        Math.round(Number(rawSampleSize))
    );
}


// ------------------------------------------------------
// Frozen frontend selection behavior
// ------------------------------------------------------

function isActionableProp(prop) {

    const recommendation =
        String(
            prop?.analytics?.recommendation ??
            prop?.recommendation ??
            ""
        )
            .trim()
            .toLowerCase();

    return (
        recommendation === "over" ||
        recommendation === "under"
    );
}


function resolveAuthoritativeTopProp(player) {

    const actionableProps =
        (player?.props || []).filter(
            isActionableProp
        );

    const authoritativeBestProp =
        player?.analytics?.bestProp ??
        null;

    const matchedBestProp =
        authoritativeBestProp?.id != null
            ? (
                actionableProps.find(
                    prop =>
                        prop?.id != null &&
                        String(prop.id) ===
                        String(authoritativeBestProp.id)
                ) ??
                null
            )
            : null;

    const legacyScoreMatchedProp =
        !matchedBestProp &&
        authoritativeBestProp?.id == null &&
        authoritativeBestProp?.score != null
            ? (
                actionableProps.find(
                    prop =>
                        prop?.sportacularScore != null &&
                        Number(prop.sportacularScore) ===
                        Number(authoritativeBestProp.score)
                ) ??
                null
            )
            : null;

    return (
        matchedBestProp ??
        legacyScoreMatchedProp ??
        null
    );
}


// ------------------------------------------------------
// Frozen frontend display contract
// ------------------------------------------------------

function buildPropDisplay(prop) {

    const analytics =
        prop?.analytics ?? {};

    const recommendation =
        String(
            analytics.recommendation ??
            prop?.recommendation ??
            prop?.bestSide ??
            "No Play"
        )
            .trim();

    const normalizedRecommendation =
        recommendation.toLowerCase();

    const isActionable =
        normalizedRecommendation === "over" ||
        normalizedRecommendation === "under";

    const probabilityValue =
        prop?.bestModelProbability ??
        analytics.probability ??
        prop?.probability ??
        null;

    const modelEdgeValue =
        prop?.sportacularEdge ??
        analytics.modelEdge ??
        prop?.modelEdge ??
        null;

    const confidence =
        isActionable
            ? (
                prop?.confidenceTier ??
                analytics.confidence ??
                prop?.confidence ??
                "-"
            )
            : "-";

    const scoreValue =
        prop?.sportacularScore ??
        analytics.sportacularScore ??
        analytics.score ??
        prop?.score ??
        null;

    const numericScore =
        scoreValue !== null &&
        scoreValue !== undefined &&
        scoreValue !== "" &&
        Number.isFinite(Number(scoreValue))
            ? Number(scoreValue)
            : null;

    return {
        recommendation,

        odds:
            isActionable &&
            prop?.odds !== null &&
            prop?.odds !== undefined &&
            prop?.odds !== ""
                ? prop.odds
                : "-",

        probability:
            isActionable
                ? formatProbability(
                    probabilityValue
                )
                : "-",

        modelEdge:
            isActionable
                ? formatEdgePercent(
                    modelEdgeValue
                )
                : "-",

        confidence,

        score:
            isActionable &&
            numericScore !== null
                ? numericScore.toFixed(2)
                : "-"
    };
}


// ------------------------------------------------------
// Four-league fixture
// ------------------------------------------------------

const leagues = [
    "NBA",
    "NHL",
    "MLB",
    "NFL"
];


function makePlayer(league) {

    const prefix =
        league.toLowerCase();

    const over = {
        id: `p18d-${prefix}-over`,
        displayName: "P18D Primary Market",
        line: 25.5,
        odds: -110,
        sportsbook: "fanduel",

        bestModelProbability: 0.61,
        sportacularEdge: 0.16,
        sportacularScore: 88,
        confidenceTier: "Elite",

        recommendation: "Over",

        analytics: {
            probability: 0.61,
            modelEdge: 0.16,
            sportacularScore: 88,
            confidence: "Elite",
            recommendation: "Over"
        }
    };


    const under = {
        id: `p18d-${prefix}-under`,
        displayName: "P18D Secondary Market",
        line: 7.5,
        odds: -105,
        sportsbook: "draftkings",

        bestModelProbability: 0.57,
        sportacularEdge: 0.12,
        sportacularScore: 81,
        confidenceTier: "Strong",

        recommendation: "Under",

        analytics: {
            probability: 0.57,
            modelEdge: 0.12,
            sportacularScore: 81,
            confidence: "Strong",
            recommendation: "Under"
        }
    };


    const noPlay = {
        id: `p18d-${prefix}-no-play`,
        displayName: "P18D No Play Market",
        line: 4.5,

        /*
            Deliberately extreme values.

            The frontend MUST suppress them because this
            row is No Play.
        */
        odds: 999,
        bestModelProbability: 0.99,
        sportacularEdge: 0.99,
        sportacularScore: 100,
        confidenceTier: "Elite",

        recommendation: "No Play",

        analytics: {
            probability: null,
            modelEdge: null,
            sportacularScore: null,
            confidence: null,
            recommendation: "No Play"
        }
    };


    return {
        league,

        props: [
            over,
            under,
            noPlay
        ],

        analytics: {
            score: 88,
            stars: 4.5,
            confidence: "Elite",
            recommendation: "Over",
            edge: 0.08,
            modelEdge: 0.16,

            bestProp: {
                id: over.id,
                market: over.displayName,
                line: over.line,
                sportsbook: over.sportsbook,
                probability: 0.61,
                edge: 0.08,
                sportacularEdge: 0.16,
                ev: 18,
                score: 88,
                confidence: "Elite",
                recommendation: "Over"
            }
        },

        trends: [
            {
                sampleSize: 5
            }
        ],

        gameLogs: new Array(5).fill({})
    };
}


// ------------------------------------------------------
// Formatting regression
// ------------------------------------------------------

expectEqual(
    "P18-D1 decimal Sportacular Edge formats exactly once",
    formatEdgePercent(0.16),
    "16.0%"
);

expectEqual(
    "P18-D1 legacy percentage-scale Edge remains percentage",
    formatEdgePercent(16),
    "16.0%"
);

expectEqual(
    "P18-D1 missing Edge remains unavailable",
    formatEdgePercent(null),
    "-"
);

expectEqual(
    "P18-D1 decimal probability formats exactly once",
    formatProbability(0.61),
    "61.0%"
);

expectEqual(
    "P18-D1 percentage-scale probability remains percentage",
    formatProbability(61),
    "61.0%"
);

expectEqual(
    "P18-D1 missing probability remains unavailable",
    formatProbability(null),
    "-"
);

expectEqual(
    "P18-D1 frozen 4.5 stars render correctly",
    formatDashboardStars(4.5),
    "★★★★½"
);

expectEqual(
    "P18-D1 missing stars remain empty",
    formatDashboardStars(null),
    "☆☆☆☆☆"
);


// ------------------------------------------------------
// Four-league frontend contract regression
// ------------------------------------------------------

for (const league of leagues) {

    const player =
        makePlayer(league);

    const topProp =
        resolveAuthoritativeTopProp(
            player
        );

    expectEqual(
        `P18-D1 ${league} frontend selects backend-authoritative Best Prop`,
        topProp?.id ?? null,
        `p18d-${league.toLowerCase()}-over`
    );


    const topDisplay =
        buildPropDisplay(topProp);

    expectEqual(
        `P18-D1 ${league} Top Prop recommendation survives`,
        topDisplay.recommendation,
        "Over"
    );

    expectEqual(
        `P18-D1 ${league} Top Prop probability formats once`,
        topDisplay.probability,
        "61.0%"
    );

    expectEqual(
        `P18-D1 ${league} Top Prop Sportacular Edge formats once`,
        topDisplay.modelEdge,
        "16.0%"
    );

    expectEqual(
        `P18-D1 ${league} Top Prop confidence survives`,
        topDisplay.confidence,
        "Elite"
    );

    expectEqual(
        `P18-D1 ${league} Top Prop Score survives`,
        topDisplay.score,
        "88.00"
    );


    const underDisplay =
        buildPropDisplay(
            player.props[1]
        );

    expectEqual(
        `P18-D1 ${league} Under remains actionable`,
        underDisplay.recommendation,
        "Under"
    );

    expectEqual(
        `P18-D1 ${league} Under probability remains visible`,
        underDisplay.probability,
        "57.0%"
    );

    expectEqual(
        `P18-D1 ${league} Under Score remains visible`,
        underDisplay.score,
        "81.00"
    );


    const noPlayDisplay =
        buildPropDisplay(
            player.props[2]
        );

    expectEqual(
        `P18-D1 ${league} No Play recommendation survives`,
        noPlayDisplay.recommendation,
        "No Play"
    );

    expectEqual(
        `P18-D1 ${league} No Play suppresses odds`,
        noPlayDisplay.odds,
        "-"
    );

    expectEqual(
        `P18-D1 ${league} No Play suppresses probability`,
        noPlayDisplay.probability,
        "-"
    );

    expectEqual(
        `P18-D1 ${league} No Play suppresses Model Edge`,
        noPlayDisplay.modelEdge,
        "-"
    );

    expectEqual(
        `P18-D1 ${league} No Play suppresses confidence`,
        noPlayDisplay.confidence,
        "-"
    );

    expectEqual(
        `P18-D1 ${league} No Play suppresses Score`,
        noPlayDisplay.score,
        "-"
    );


    expectEqual(
        `P18-D1 ${league} established sample size remains 5`,
        getTrendSampleSize({
            trend: player.trends[0],
            gameLogs: player.gameLogs
        }),
        5
    );
}


// ------------------------------------------------------
// Backend-authoritative selection guard
// ------------------------------------------------------

for (const league of leagues) {

    const player =
        makePlayer(league);

    player.analytics.bestProp = null;

    expectEqual(
        `P18-D1 ${league} frontend does not invent Top Prop without backend Best Prop`,
        resolveAuthoritativeTopProp(player),
        null
    );
}


// ------------------------------------------------------
// No Play cannot become Top Prop
// ------------------------------------------------------

for (const league of leagues) {

    const player =
        makePlayer(league);

    player.analytics.bestProp = {
        id:
            `p18d-${league.toLowerCase()}-no-play`,
        score: 100,
        recommendation: "No Play"
    };

    expectEqual(
        `P18-D1 ${league} No Play cannot become displayed Top Prop`,
        resolveAuthoritativeTopProp(player),
        null
    );
}


// ------------------------------------------------------
// Legacy score fallback
// ------------------------------------------------------

for (const league of leagues) {

    const player =
        makePlayer(league);

    player.analytics.bestProp = {
        id: null,
        score: 81
    };

    expectEqual(
        `P18-D1 ${league} legacy Score fallback remains supported`,
        resolveAuthoritativeTopProp(player)?.id ??
            null,
        `p18d-${league.toLowerCase()}-under`
    );
}


// ------------------------------------------------------
// Sample-size confidence boundary
// ------------------------------------------------------

expectEqual(
    "P18-D1 trend sampleSize has priority",
    getTrendSampleSize({
        trend: {
            sampleSize: 2,
            games: 8,
            gamesPlayed: 9
        },
        gameLogs: new Array(10).fill({})
    }),
    2
);

expectEqual(
    "P18-D1 trend games fallback remains supported",
    getTrendSampleSize({
        trend: {
            games: 4
        },
        gameLogs: new Array(10).fill({})
    }),
    4
);

expectEqual(
    "P18-D1 gameLogs fallback remains supported",
    getTrendSampleSize({
        trend: {},
        gameLogs: new Array(3).fill({})
    }),
    3
);


// ------------------------------------------------------
// Summary
// ------------------------------------------------------

const passed =
    results.filter(
        result => result.pass
    ).length;

const failed =
    results.length - passed;

const summary = {
    test:
        "P18-D1 FOUR-LEAGUE PLAYER PAGE FRONTEND CONTRACT REGRESSION",

    tests:
        results.length,

    passed,

    failed,

    pass:
        failed === 0,

    leagues,

    frozenFrontendContract: [
        "Backend-authoritative Best Prop",
        "Actionable Over / Under only",
        "No Play display suppression",
        "Sportacular Score",
        "Sportacular Edge",
        "Model Probability",
        "Confidence",
        "Frontend percentage formatting",
        "Legacy Score fallback",
        "Sample-size boundary"
    ],

    results
};

console.log(
    JSON.stringify(
        summary,
        null,
        2
    )
);

if (!summary.pass) {
    throw new Error(
        "P18-D1 four-league Player Page frontend contract regression failed."
    );
}