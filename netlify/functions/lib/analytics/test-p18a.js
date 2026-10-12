// ======================================================
// Sportacular Analytics
// P18-A — Four-League Adapter Contract Regression
// ======================================================
//
// Purpose:
// Verify that NBA / NHL / MLB / NFL production adapters
// preserve the frozen universal Player Props contract.
//
// This is a regression/freeze test only.
// It does NOT redefine scoring/model semantics.
// ======================================================

import { buildNBAContext } from "../adapters/nbaAdapter.js";
import { buildNHLContext } from "../adapters/nhlAdapter.js";
import { buildMLBContext } from "../adapters/mlbAdapter.js";
import { buildNFLContext } from "../adapters/nflAdapter.js";

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

function buildUniversalProp(id) {
    return {
        Id: id,

        Type: "test_market",
        "Prop Type": "test_market",

        Vendor: "testbook",

        "Line Value": 10.5,
        "Over Odds": -110,
        "Under Odds": -110,

        "Model Prob Over": 0.61,
        "Model Prob Under": 0.39,

        "EV Over": 0.18,
        "EV Under": -0.12,

        "Best Side": "Over",
        "Best EV": 0.18,
        "Best Model Probability": 0.61,
        "Best Price Edge": 0.08,

        "Trend Score": 74,
        "Trend Strength": "Strong",

        "Risk Score": 24,
        "Risk Tier": "Low",

        "Model Confidence": 82,

        "Sportacular Score": 88,
        "Sportacular Edge": 0.16,

        "Confidence Tier": "Elite"
    };
}

function baseProfile(id, name) {
    const parts = name.split(" ");

    return {
        Id: id,
        "First Name": parts[0],
        "Last Name": parts.slice(1).join(" "),
        "Full Name": name,
        "Team Name": "Test Team",
        "Team Abbreviation": "TST",
        Position: "QB",

        // NHL compatibility
        "Position Code": "C",
        "Height in Inches": 72,
        "Weight in Pounds": 200,

        Height: "6-0",
        Weight: 200
    };
}

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
            context: buildNBAContext({
                profile: baseProfile(
                    "p18a-nba",
                    "P18A NBA"
                ),
                seasonStats,
                gameLogs,
                trends,
                matchup,
                props: [
                    buildUniversalProp("p18a-nba-prop")
                ]
            })
        },

        {
            league: "nhl",
            context: buildNHLContext({
                profile: baseProfile(
                    "p18a-nhl",
                    "P18A NHL"
                ),
                seasonStats,
                gameLogs,
                trends,
                matchup,
                props: [
                    buildUniversalProp("p18a-nhl-prop")
                ]
            })
        },

        {
            league: "mlb",
            context: buildMLBContext({
                profile: baseProfile(
                    "p18a-mlb",
                    "P18A MLB"
                ),
                seasonStats,
                gameLogs,
                trends,
                matchup,
                props: [
                    buildUniversalProp("p18a-mlb-prop")
                ],
                isPitcher: false
            })
        },

        {
            league: "nfl",
            context: buildNFLContext({
                profile: baseProfile(
                    "p18a-nfl",
                    "P18A NFL"
                ),
                seasonStats,
                gameLogs,
                trends,
                matchup,
                props: [
                    buildUniversalProp("p18a-nfl-prop")
                ]
            })
        }
    ];
}

const contexts = buildContexts();

const REQUIRED_PROP_KEYS = [
    "id",
    "type",
    "market",
    "displayName",
    "line",
    "odds",
    "oddsFormat",
    "sportsbook",

    "probability",
    "probabilitySource",
    "expectedValue",

    "bestSide",
    "bestEV",
    "bestModelProbability",
    "bestPriceEdge",

    "trendScore",
    "trendStrength",

    "riskScore",
    "riskTier",

    "modelConfidence",

    "sportacularScore",
    "sportacularEdge",

    "confidenceTier",

    "raw"
];

// ======================================================
// 1. All four contexts build successfully
// ======================================================

test(
    "P18-A all four production adapters build contexts",
    contexts.length === 4 &&
        contexts.every(entry => entry.context),
    {
        leagues: contexts.map(entry => entry.league)
    }
);

// ======================================================
// 2. League identity survives adapter
// ======================================================

for (const { league, context } of contexts) {
    test(
        `P18-A ${league.toUpperCase()} preserves league identity`,
        context.league === league,
        {
            expected: league,
            actual: context.league
        }
    );
}

// ======================================================
// 3. Every adapter exposes props array
// ======================================================

for (const { league, context } of contexts) {
    test(
        `P18-A ${league.toUpperCase()} exposes Player Props array`,
        Array.isArray(context.props),
        {
            propCount: Array.isArray(context.props)
                ? context.props.length
                : null
        }
    );
}

// ======================================================
// 4. Every adapter preserves the prop row
// ======================================================

for (const { league, context } of contexts) {
    test(
        `P18-A ${league.toUpperCase()} preserves test prop row`,
        context.props?.length === 1,
        {
            expected: 1,
            actual: context.props?.length ?? null
        }
    );
}

// ======================================================
// 5. Frozen normalized contract keys
// ======================================================

for (const { league, context } of contexts) {
    const prop = context.props?.[0] ?? {};

    const missing =
        REQUIRED_PROP_KEYS.filter(
            key =>
                !Object.prototype.hasOwnProperty.call(
                    prop,
                    key
                )
        );

    test(
        `P18-A ${league.toUpperCase()} exposes frozen normalized prop contract`,
        missing.length === 0,
        {
            requiredKeys: REQUIRED_PROP_KEYS.length,
            missingKeys: missing
        }
    );
}

// ======================================================
// 6. P15 Best Side survives unchanged
// ======================================================

for (const { league, context } of contexts) {
    const prop = context.props[0];

    test(
        `P18-A ${league.toUpperCase()} preserves Best Side`,
        same(prop.bestSide, "Over"),
        {
            expected: "Over",
            actual: prop.bestSide
        }
    );
}

// ======================================================
// 7. Selected-side odds
// ======================================================

for (const { league, context } of contexts) {
    const prop = context.props[0];

    test(
        `P18-A ${league.toUpperCase()} selects authoritative Over odds`,
        same(prop.odds, -110),
        {
            expected: -110,
            actual: prop.odds
        }
    );
}

// ======================================================
// 8. Selected-side model probability
// ======================================================

for (const { league, context } of contexts) {
    const prop = context.props[0];

    test(
        `P18-A ${league.toUpperCase()} selects authoritative model probability`,
        same(prop.probability, 0.61),
        {
            expected: 0.61,
            actual: prop.probability
        }
    );
}

// ======================================================
// 9. Selected-side EV
// ======================================================

for (const { league, context } of contexts) {
    const prop = context.props[0];

    test(
        `P18-A ${league.toUpperCase()} selects authoritative EV`,
        same(prop.expectedValue, 0.18),
        {
            expected: 0.18,
            actual: prop.expectedValue
        }
    );
}

// ======================================================
// 10. Universal scoring fields
// ======================================================

const EXPECTED_FIELDS = {
    bestEV: 0.18,
    bestModelProbability: 0.61,
    bestPriceEdge: 0.08,

    trendScore: 74,
    trendStrength: "Strong",

    riskScore: 24,
    riskTier: "Low",

    modelConfidence: 82,

    sportacularScore: 88,
    sportacularEdge: 0.16,

    confidenceTier: "Elite"
};

for (const { league, context } of contexts) {
    const prop = context.props[0];

    for (
        const [field, expected]
        of Object.entries(EXPECTED_FIELDS)
    ) {
        test(
            `P18-A ${league.toUpperCase()} preserves ${field}`,
            same(prop[field], expected),
            {
                expected,
                actual: prop[field]
            }
        );
    }
}

// ======================================================
// 11. Original universal row remains available
// ======================================================

for (const { league, context } of contexts) {
    const prop = context.props[0];

    test(
        `P18-A ${league.toUpperCase()} preserves raw universal row`,
        prop.raw &&
            prop.raw["Best Side"] === "Over" &&
            same(
                prop.raw["Sportacular Score"],
                88
            ) &&
            same(
                prop.raw["Sportacular Edge"],
                0.16
            ),
        {
            bestSide:
                prop.raw?.["Best Side"] ?? null,

            sportacularScore:
                prop.raw?.["Sportacular Score"] ?? null,

            sportacularEdge:
                prop.raw?.["Sportacular Edge"] ?? null
        }
    );
}

// ======================================================
// 12. Cross-league normalized contract parity
// ======================================================

const normalizedKeySets =
    contexts.map(({ league, context }) => ({
        league,
        keys: Object.keys(
            context.props[0]
        ).sort()
    }));

const referenceKeys =
    normalizedKeySets[0].keys;

const parityViolations =
    normalizedKeySets
        .filter(entry =>
            JSON.stringify(entry.keys) !==
            JSON.stringify(referenceKeys)
        )
        .map(entry => ({
            league: entry.league,
            keys: entry.keys
        }));

test(
    "P18-A all four adapters expose identical normalized prop keys",
    parityViolations.length === 0,
    {
        referenceLeague:
            normalizedKeySets[0].league,

        normalizedKeyCount:
            referenceKeys.length,

        violations:
            parityViolations
    }
);

// ======================================================
// FINAL SUMMARY
// ======================================================

const passed =
    results.filter(result => result.pass).length;

const failed =
    results.length - passed;

const summary = {
    test:
        "P18-A FOUR-LEAGUE ADAPTER CONTRACT REGRESSION",

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
        "League adapter",
        "Normalized prop contract",
        "P15 authoritative outputs"
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
        "P18-A four-league adapter contract regression failed."
    );
}