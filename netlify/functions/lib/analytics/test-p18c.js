// ======================================================
// Sportacular Analytics
// P18-C — Four-League API Response Regression
// ======================================================
//
// Purpose:
// Verify that NBA / NHL / MLB / NFL preserve the frozen
// P15 authoritative Player Props outputs through:
//
// Universal A:AJ
//   -> production league adapter
//   -> calculatePlayerAnalytics
//   -> analytics.propAnalytics
//   -> buildProps
//   -> success()
//   -> JSON API response
//
// This is a regression/freeze test only.
// It does NOT redefine scoring/model semantics.
// It does NOT use live CSV/network data.
// ======================================================

import { buildNBAContext } from "../adapters/nbaAdapter.js";
import { buildNHLContext } from "../adapters/nhlAdapter.js";
import { buildMLBContext } from "../adapters/mlbAdapter.js";
import { buildNFLContext } from "../adapters/nflAdapter.js";

import { calculatePlayerAnalytics } from "./playerAnalytics.js";
import { buildProps } from "../builders/propsBuilder.js";
import { success } from "../response.js";

const results = [];

function test(name, pass, details = {}) {
    const result = {
        name,
        pass: Boolean(pass),
        ...details
    };

    results.push(result);
    console.log(JSON.stringify(result));
}

function same(actual, expected) {
    return Object.is(actual, expected);
}


// ======================================================
// Universal A:AJ fixture
// ======================================================

function buildUniversalProp(
    id,
    {
        market = "P18C Primary Market",
        bestSide = "Over",
        bestEV = 0.18,
        bestModelProbability = 0.61,
        bestPriceEdge = 0.08,
        sportacularScore = 88,
        sportacularEdge = 0.16,
        confidenceTier = "Elite",
        overOdds = -110,
        underOdds = -105
    } = {}
) {
    const isUnder =
        bestSide === "Under";

    return {
        Id: id,

        Type: market,
        "Prop Type": market,

        Vendor: "testbook",

        "Line Value": 10.5,

        "Over Odds": overOdds,
        "Under Odds": underOdds,

        "Model Prob Over":
            isUnder
                ? 1 - bestModelProbability
                : bestModelProbability,

        "Model Prob Under":
            isUnder
                ? bestModelProbability
                : 1 - bestModelProbability,

        "EV Over":
            isUnder
                ? -0.12
                : bestEV,

        "EV Under":
            isUnder
                ? bestEV
                : -0.12,

        "Best Side": bestSide,
        "Best EV": bestEV,
        "Best Model Probability":
            bestModelProbability,
        "Best Price Edge":
            bestPriceEdge,

        "Trend Score": 74,
        "Trend Strength": "Strong",

        "Risk Score": 24,
        "Risk Tier": "Low",

        "Model Confidence": 82,

        "Sportacular Score":
            sportacularScore,

        "Sportacular Edge":
            sportacularEdge,

        "Confidence Tier":
            confidenceTier
    };
}


// ======================================================
// Shared profile fixture
// ======================================================

function baseProfile(id, name) {
    const parts = name.split(" ");

    return {
        Id: id,

        "First Name":
            parts[0],

        "Last Name":
            parts.slice(1).join(" "),

        "Full Name":
            name,

        "Team Name":
            "Test Team",

        "Team Abbreviation":
            "TST",

        Position: "QB",

        // NHL compatibility
        "Position Code": "C",

        "Height in Inches": 72,
        "Weight in Pounds": 200,

        Height: "6-0",
        Weight: 200
    };
}


// ======================================================
// Build universal three-prop fixture
// ======================================================

function buildUniversalProps(league) {
    return [
        buildUniversalProp(
            `p18c-${league}-over`,
            {
                market:
                    "P18C Primary Market",

                bestSide:
                    "Over",

                bestEV:
                    0.18,

                bestModelProbability:
                    0.61,

                bestPriceEdge:
                    0.08,

                sportacularScore:
                    88,

                sportacularEdge:
                    0.16,

                confidenceTier:
                    "Elite",

                overOdds:
                    -110
            }
        ),

        buildUniversalProp(
            `p18c-${league}-under`,
            {
                market:
                    "P18C Secondary Market",

                bestSide:
                    "Under",

                bestEV:
                    0.14,

                bestModelProbability:
                    0.58,

                bestPriceEdge:
                    0.06,

                sportacularScore:
                    81,

                sportacularEdge:
                    0.12,

                confidenceTier:
                    "Strong",

                underOdds:
                    -105
            }
        ),

        buildUniversalProp(
            `p18c-${league}-no-play`,
            {
                market:
                    "P18C No Play Market",

                bestSide:
                    "No Play",

                bestEV:
                    0.99,

                bestModelProbability:
                    0.99,

                bestPriceEdge:
                    0.50,

                sportacularScore:
                    100,

                sportacularEdge:
                    0.99,

                confidenceTier:
                    "No Play"
            }
        )
    ];
}


// ======================================================
// Build production adapter contexts
// ======================================================

function buildContexts() {
    const seasonStats = {
        "Games Played": 10,
        Team: "TST"
    };

    const gameLogs = [];
    const trends = [];
    const matchup = {};

    return [
        {
            league: "nba",

            context:
                buildNBAContext({
                    profile:
                        baseProfile(
                            "p18c-nba",
                            "P18C NBA"
                        ),

                    seasonStats,
                    gameLogs,
                    trends,
                    matchup,

                    props:
                        buildUniversalProps(
                            "nba"
                        )
                })
        },

        {
            league: "nhl",

            context:
                buildNHLContext({
                    profile:
                        baseProfile(
                            "p18c-nhl",
                            "P18C NHL"
                        ),

                    seasonStats,
                    gameLogs,
                    trends,
                    matchup,

                    props:
                        buildUniversalProps(
                            "nhl"
                        )
                })
        },

        {
            league: "mlb",

            context:
                buildMLBContext({
                    profile:
                        baseProfile(
                            "p18c-mlb",
                            "P18C MLB"
                        ),

                    seasonStats,
                    gameLogs,
                    trends,
                    matchup,

                    props:
                        buildUniversalProps(
                            "mlb"
                        ),

                    isPitcher: false
                })
        },

        {
            league: "nfl",

            context:
                buildNFLContext({
                    profile:
                        baseProfile(
                            "p18c-nfl",
                            "P18C NFL"
                        ),

                    seasonStats,
                    gameLogs,
                    trends,
                    matchup,

                    props:
                        buildUniversalProps(
                            "nfl"
                        )
                })
        }
    ];
}


// ======================================================
// Materialize the production response boundary
// ======================================================

function buildApiResponse(context) {

    const analytics =
        calculatePlayerAnalytics({
            seasonStats:
                context.seasonStats,

            gameLogs:
                context.gameLogs,

            matchup:
                context.matchup,

            props:
                context.props
        });


    // Mirrors production player.js:
    //
    // buildProps({
    //     ...context,
    //     props:
    //         analytics?.propAnalytics ?? []
    // })

    const props =
        buildProps({
            ...context,

            props:
                analytics?.propAnalytics ?? []
        });


    // Only the fields relevant to the P18-C contract
    // are needed here. success() is the exact production
    // response helper used by player.js.

    const player = {
        props,
        analytics
    };


    const response =
        success(player);


    return {
        analytics,
        props,
        response,
        body:
            JSON.parse(
                response.body
            )
    };
}


const contexts =
    buildContexts();

const responses =
    contexts.map(
        ({ league, context }) => ({
            league,
            context,
            ...buildApiResponse(context)
        })
    );


// ======================================================
// 1. All four API responses materialize
// ======================================================

test(
    "P18-C all four league API responses materialize",
    responses.length === 4 &&
        responses.every(
            entry =>
                entry.response &&
                entry.body
        ),
    {
        leagues:
            responses.map(
                entry =>
                    entry.league
            )
    }
);


// ======================================================
// 2. Production response helper returns HTTP 200
// ======================================================

for (const entry of responses) {

    test(
        `P18-C ${entry.league.toUpperCase()} API response returns HTTP 200`,

        same(
            entry.response.statusCode,
            200
        ),

        {
            expected: 200,
            actual:
                entry.response.statusCode
        }
    );
}


// ======================================================
// 3. Production response remains JSON
// ======================================================

for (const entry of responses) {

    test(
        `P18-C ${entry.league.toUpperCase()} API response remains JSON`,

        entry.response.headers?.[
            "Content-Type"
        ] === "application/json",

        {
            contentType:
                entry.response.headers?.[
                    "Content-Type"
                ] ?? null
        }
    );
}


// ======================================================
// 4. All three prop rows reach API payload
// ======================================================

for (const entry of responses) {

    test(
        `P18-C ${entry.league.toUpperCase()} API exposes all Player Props rows`,

        Array.isArray(
            entry.body.props
        ) &&
        entry.body.props.length === 3,

        {
            expected: 3,
            actual:
                entry.body.props?.length ??
                null
        }
    );
}


// ======================================================
// Helpers
// ======================================================

function findProp(
    entry,
    suffix
) {
    return entry.body.props.find(
        prop =>
            prop.id ===
            `p18c-${entry.league}-${suffix}`
    );
}


// ======================================================
// 5. Over survives full API boundary
// ======================================================

for (const entry of responses) {

    const prop =
        findProp(
            entry,
            "over"
        );

    test(
        `P18-C ${entry.league.toUpperCase()} Over survives API as recommendation`,

        prop?.recommendation ===
            "Over",

        {
            expected: "Over",
            actual:
                prop?.recommendation ??
                null
        }
    );
}


// ======================================================
// 6. Under survives full API boundary
// ======================================================

for (const entry of responses) {

    const prop =
        findProp(
            entry,
            "under"
        );

    test(
        `P18-C ${entry.league.toUpperCase()} Under survives API as recommendation`,

        prop?.recommendation ===
            "Under",

        {
            expected: "Under",
            actual:
                prop?.recommendation ??
                null
        }
    );
}


// ======================================================
// 7. No Play survives full API boundary
// ======================================================

for (const entry of responses) {

    const prop =
        findProp(
            entry,
            "no-play"
        );

    test(
        `P18-C ${entry.league.toUpperCase()} No Play survives API as recommendation`,

        prop?.recommendation ===
            "No Play",

        {
            expected:
                "No Play",

            actual:
                prop?.recommendation ??
                null
        }
    );
}


// ======================================================
// 8. Authoritative actionable fields reach API
// ======================================================

for (const entry of responses) {

    const prop =
        findProp(
            entry,
            "over"
        );

    const expected = {
        probability: 0.61,
        modelEdge: 0.08,
        sportacularScore: 88,
        confidence: "Elite",
        ev: 18,
        odds: -110
    };

    for (
        const [field, value]
        of Object.entries(expected)
    ) {

        test(
            `P18-C ${entry.league.toUpperCase()} API preserves ${field}`,

            same(
                prop?.[field],
                value
            ),

            {
                expected: value,
                actual:
                    prop?.[field] ??
                    null
            }
        );
    }
}


// ======================================================
// 9. Nested analytics payload remains identical
// ======================================================

for (const entry of responses) {

    const prop =
        findProp(
            entry,
            "over"
        );

    test(
        `P18-C ${entry.league.toUpperCase()} nested probability matches top-level`,

        same(
            prop?.analytics?.probability,
            prop?.probability
        ),

        {
            topLevel:
                prop?.probability ?? null,

            nested:
                prop?.analytics
                    ?.probability ?? null
        }
    );


    test(
        `P18-C ${entry.league.toUpperCase()} nested Price Edge matches top-level`,

        same(
            prop?.analytics?.modelEdge,
            prop?.modelEdge
        ),

        {
            topLevel:
                prop?.modelEdge ?? null,

            nested:
                prop?.analytics
                    ?.modelEdge ?? null
        }
    );


    test(
        `P18-C ${entry.league.toUpperCase()} nested Sportacular Score matches top-level`,

        same(
            prop?.analytics
                ?.sportacularScore,

            prop?.sportacularScore
        ),

        {
            topLevel:
                prop?.sportacularScore ??
                null,

            nested:
                prop?.analytics
                    ?.sportacularScore ??
                null
        }
    );


    test(
        `P18-C ${entry.league.toUpperCase()} nested confidence matches top-level`,

        same(
            prop?.analytics?.confidence,
            prop?.confidence
        ),

        {
            topLevel:
                prop?.confidence ?? null,

            nested:
                prop?.analytics
                    ?.confidence ?? null
        }
    );


    test(
        `P18-C ${entry.league.toUpperCase()} nested recommendation matches top-level`,

        same(
            prop?.analytics
                ?.recommendation,

            prop?.recommendation
        ),

        {
            topLevel:
                prop?.recommendation ??
                null,

            nested:
                prop?.analytics
                    ?.recommendation ??
                null
        }
    );
}


// ======================================================
// 10. No Play display fields remain suppressed
// ======================================================

for (const entry of responses) {

    const prop =
        findProp(
            entry,
            "no-play"
        );

    const suppressed = {
        odds: "-",
        probability: null,
        modelEdge: null,
        sportacularScore: null,
        confidence: null,
        ev: null
    };

    for (
        const [field, expected]
        of Object.entries(suppressed)
    ) {

        test(
            `P18-C ${entry.league.toUpperCase()} No Play suppresses ${field}`,

            same(
                prop?.[field],
                expected
            ),

            {
                expected,
                actual:
                    prop?.[field] ??
                    null
            }
        );
    }
}


// ======================================================
// 11. Nested No Play fields remain suppressed
// ======================================================

for (const entry of responses) {

    const prop =
        findProp(
            entry,
            "no-play"
        );

    test(
        `P18-C ${entry.league.toUpperCase()} nested No Play probability remains suppressed`,

        prop?.analytics
            ?.probability === null,

        {
            actual:
                prop?.analytics
                    ?.probability ??
                null
        }
    );


    test(
        `P18-C ${entry.league.toUpperCase()} nested No Play Price Edge remains suppressed`,

        prop?.analytics
            ?.modelEdge === null,

        {
            actual:
                prop?.analytics
                    ?.modelEdge ??
                null
        }
    );


    test(
        `P18-C ${entry.league.toUpperCase()} nested No Play Score remains suppressed`,

        prop?.analytics
            ?.sportacularScore === null,

        {
            actual:
                prop?.analytics
                    ?.sportacularScore ??
                null
        }
    );


    test(
        `P18-C ${entry.league.toUpperCase()} nested No Play confidence remains suppressed`,

        prop?.analytics
            ?.confidence === null,

        {
            actual:
                prop?.analytics
                    ?.confidence ??
                null
        }
    );


    test(
        `P18-C ${entry.league.toUpperCase()} nested No Play recommendation remains No Play`,

        prop?.analytics
            ?.recommendation ===
            "No Play",

        {
            expected:
                "No Play",

            actual:
                prop?.analytics
                    ?.recommendation ??
                null
        }
    );
}


// ======================================================
// 12. Dashboard Best Prop survives API serialization
// ======================================================

for (const entry of responses) {

    const analytics =
        entry.body.analytics;

    test(
        `P18-C ${entry.league.toUpperCase()} API dashboard selects authoritative Best Prop`,

        analytics?.bestProp?.id ===
            `p18c-${entry.league}-over`,

        {
            expectedId:
                `p18c-${entry.league}-over`,

            actualId:
                analytics?.bestProp?.id ??
                null
        }
    );


    test(
        `P18-C ${entry.league.toUpperCase()} API dashboard Score remains frozen`,

        same(
            analytics?.score,
            88
        ),

        {
            expected: 88,
            actual:
                analytics?.score ??
                null
        }
    );


    test(
        `P18-C ${entry.league.toUpperCase()} API dashboard recommendation remains frozen`,

        analytics?.recommendation ===
            "Over",

        {
            expected:
                "Over",

            actual:
                analytics
                    ?.recommendation ??
                null
        }
    );


    test(
        `P18-C ${entry.league.toUpperCase()} API dashboard confidence remains frozen`,

        analytics?.confidence ===
            "Elite",

        {
            expected:
                "Elite",

            actual:
                analytics?.confidence ??
                null
        }
    );


    test(
        `P18-C ${entry.league.toUpperCase()} API dashboard probability remains frozen`,

        same(
            analytics?.bestProp?.probability,
            0.61
        ),

        {
            expected: 0.61,
            actual:
                analytics?.bestProp?.probability ??
                null
        }
    );


    test(
        `P18-C ${entry.league.toUpperCase()} API dashboard Price Edge remains frozen`,

        same(
            analytics?.edge,
            0.08
        ),

        {
            expected: 0.08,
            actual:
                analytics?.edge ??
                null
        }
    );


    test(
        `P18-C ${entry.league.toUpperCase()} API dashboard EV converts exactly once`,

        same(
            analytics?.bestProp?.ev,
            18
        ),

        {
            expected: 18,
            actual:
                analytics?.bestProp?.ev ??
                null
        }
    );


    test(
        `P18-C ${entry.league.toUpperCase()} API dashboard Sportacular Edge remains frozen`,

        same(
            analytics?.modelEdge,
            0.16
        ),

        {
            expected: 0.16,
            actual:
                analytics?.modelEdge ??
                null
        }
    );
}


// ======================================================
// 13. Cross-league API prop contract parity
// ======================================================

const apiKeySets =
    responses.map(entry => ({
        league:
            entry.league,

        keys:
            Object.keys(
                findProp(
                    entry,
                    "over"
                ) ?? {}
            ).sort()
    }));

const referenceKeys =
    apiKeySets[0]?.keys ?? [];

const parityViolations =
    apiKeySets
        .filter(
            entry =>
                JSON.stringify(
                    entry.keys
                ) !==
                JSON.stringify(
                    referenceKeys
                )
        )
        .map(entry => ({
            league:
                entry.league,

            keys:
                entry.keys
        }));

test(
    "P18-C all four leagues expose identical API Player Props keys",

    parityViolations.length === 0,

    {
        referenceLeague:
            apiKeySets[0]?.league ??
            null,

        apiPropKeyCount:
            referenceKeys.length,

        violations:
            parityViolations
    }
);


// ======================================================
// 14. Response survives JSON round trip
// ======================================================

for (const entry of responses) {

    test(
        `P18-C ${entry.league.toUpperCase()} API payload survives JSON serialization`,

        entry.body &&
        Array.isArray(
            entry.body.props
        ) &&
        entry.body.analytics &&
        entry.body.props.length === 3,

        {
            propCount:
                entry.body.props?.length ??
                null,

            hasAnalytics:
                Boolean(
                    entry.body.analytics
                )
        }
    );
}


// ======================================================
// FINAL SUMMARY
// ======================================================

const passed =
    results.filter(
        result =>
            result.pass
    ).length;

const failed =
    results.length -
    passed;

const summary = {

    test:
        "P18-C FOUR-LEAGUE PLAYER API RESPONSE REGRESSION",

    tests:
        results.length,

    passed,

    failed,

    pass:
        failed === 0,

    leagues: [
        "NBA",
        "NHL",
        "MLB",
        "NFL"
    ],

    frozenChain: [
        "Universal Player Props A:AJ",
        "Production league adapter",
        "calculatePlayerAnalytics",
        "analytics.propAnalytics",
        "buildProps",
        "success",
        "player API JSON response"
    ],

    assertions: [
        "Over / Under / No Play semantics",
        "Actionable scoring payload",
        "No Play suppression",
        "Nested analytics parity",
        "Dashboard Best Prop",
        "Single EV conversion",
        "Cross-league API contract parity",
        "JSON serialization"
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

if (failed > 0) {
    throw new Error(
        "P18-C four-league Player API response regression failed."
    );
}