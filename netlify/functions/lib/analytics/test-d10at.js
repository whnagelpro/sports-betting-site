// ======================================================
// Sportacular Analytics
// D10AT
// PLAYER PROPS BUILDER / API RESPONSE PARITY AUDIT
// ======================================================

import { buildProps } from "../builders/propsBuilder.js";

let passed = 0;
let failed = 0;
const results = [];

function test(name, condition, details = {}) {

    const result = {
        name,
        pass: Boolean(condition),
        ...details
    };

    console.log(JSON.stringify(result));

    results.push(result);

    if (condition) {
        passed++;
    } else {
        failed++;
    }
}


// ======================================================
// Frozen P15-style evaluated fixtures
// ======================================================

const evaluatedProps = [

    {
        id: "d10at-over",
        displayName: "Hits",
        market: "Hits",
        line: "Over 1.5",
        odds: -110,
        sportsbook: "FanDuel",

        evaluation: {
            actionable: true,
            bestSide: "Over",
            bestEV: 0.18,
            bestModelProbability: 0.61,
            bestPriceEdge: 0.08,
            riskScore: 24,
            riskTier: "Low",
            modelConfidence: 82,
            sportacularScore: 88,
            sportacularEdge: 0.16,
            confidenceTier: "Elite"
        }
    },

    {
        id: "d10at-under",
        displayName: "Total Bases",
        market: "Total Bases",
        line: "Under 1.5",
        odds: -105,
        sportsbook: "BetMGM",

        evaluation: {
            actionable: true,
            bestSide: "Under",
            bestEV: 0.14,
            bestModelProbability: 0.59,
            bestPriceEdge: 0.06,
            riskScore: 31,
            riskTier: "Medium",
            modelConfidence: 76,
            sportacularScore: 81,
            sportacularEdge: 0.12,
            confidenceTier: "Strong"
        }
    },

    {
        id: "d10at-no-play",
        displayName: "Home Runs",
        market: "Home Runs",
        line: "Over 0.5",
        odds: 500,
        sportsbook: "FanDuel",

        evaluation: {
            actionable: false,
            bestSide: "No Play",

            // Deliberately inflated authoritative/raw values.
            // The frontend compatibility layer MUST suppress these.
            bestEV: 0.99,
            bestModelProbability: 0.99,
            bestPriceEdge: 0.50,
            riskScore: 99,
            riskTier: "High",
            modelConfidence: 99,
            sportacularScore: 100,
            sportacularEdge: 0.99,
            confidenceTier: "No Play"
        }
    }

];


// ======================================================
// Execute production props builder
// ======================================================

const builtProps = buildProps({
    props: evaluatedProps
});

const over =
    builtProps.find(
        prop => prop.id === "d10at-over"
    );

const under =
    builtProps.find(
        prop => prop.id === "d10at-under"
    );

const noPlay =
    builtProps.find(
        prop => prop.id === "d10at-no-play"
    );


// ======================================================
// Shape / identity
// ======================================================

test(
    "D10AT propsBuilder preserves all evaluated prop rows",
    builtProps.length === 3,
    {
        expected: 3,
        actual: builtProps.length
    }
);

test(
    "D10AT actionable prop preserves frontend id",
    over?.id === "d10at-over",
    {
        expected: "d10at-over",
        actual: over?.id
    }
);

test(
    "D10AT actionable prop preserves display market",
    over?.displayName === "Hits" &&
    over?.propType === "Hits",
    {
        displayName: over?.displayName,
        propType: over?.propType
    }
);


// ======================================================
// Frozen Best Side parity
// ======================================================

test(
    "D10AT Over survives propsBuilder as recommendation",
    over?.recommendation === "Over",
    {
        expected: "Over",
        actual: over?.recommendation
    }
);

test(
    "D10AT Under survives propsBuilder as recommendation",
    under?.recommendation === "Under",
    {
        expected: "Under",
        actual: under?.recommendation
    }
);

test(
    "D10AT No Play survives propsBuilder as recommendation",
    noPlay?.recommendation === "No Play",
    {
        expected: "No Play",
        actual: noPlay?.recommendation
    }
);


// ======================================================
// Actionable payload parity
// ======================================================

test(
    "D10AT actionable sportsbook odds survive propsBuilder",
    over?.odds === -110,
    {
        expected: -110,
        actual: over?.odds
    }
);

test(
    "D10AT Best Model Probability reaches frontend unchanged",
    over?.probability === 0.61,
    {
        expected: 0.61,
        actual: over?.probability
    }
);

test(
    "D10AT Best Price Edge reaches frontend unchanged",
    over?.modelEdge === 0.08,
    {
        expected: 0.08,
        actual: over?.modelEdge
    }
);

test(
    "D10AT Sportacular Score reaches frontend unchanged",
    over?.sportacularScore === 88,
    {
        expected: 88,
        actual: over?.sportacularScore
    }
);

test(
    "D10AT Confidence Tier reaches frontend unchanged",
    over?.confidence === "Elite",
    {
        expected: "Elite",
        actual: over?.confidence
    }
);

test(
    "D10AT frozen $1 EV converts exactly once to frontend percent",
    over?.ev === 18,
    {
        expected: 18,
        actual: over?.ev
    }
);


// ======================================================
// Nested analytics parity
// ======================================================

test(
    "D10AT nested analytics preserves Sportacular Score",
    over?.analytics?.sportacularScore === 88,
    {
        expected: 88,
        actual: over?.analytics?.sportacularScore
    }
);

test(
    "D10AT nested analytics preserves Best Price Edge",
    over?.analytics?.modelEdge === 0.08,
    {
        expected: 0.08,
        actual: over?.analytics?.modelEdge
    }
);

test(
    "D10AT nested analytics preserves Best Model Probability",
    over?.analytics?.probability === 0.61,
    {
        expected: 0.61,
        actual: over?.analytics?.probability
    }
);

test(
    "D10AT nested analytics preserves Confidence Tier",
    over?.analytics?.confidence === "Elite",
    {
        expected: "Elite",
        actual: over?.analytics?.confidence
    }
);

test(
    "D10AT nested analytics preserves Best Side",
    over?.analytics?.recommendation === "Over",
    {
        expected: "Over",
        actual: over?.analytics?.recommendation
    }
);


// ======================================================
// No Play suppression
// ======================================================

test(
    "D10AT No Play sportsbook odds are suppressed",
    noPlay?.odds === "-",
    {
        expected: "-",
        actual: noPlay?.odds
    }
);

test(
    "D10AT No Play probability is suppressed",
    noPlay?.probability === null,
    {
        expected: null,
        actual: noPlay?.probability
    }
);

test(
    "D10AT No Play Price Edge is suppressed",
    noPlay?.modelEdge === null,
    {
        expected: null,
        actual: noPlay?.modelEdge
    }
);

test(
    "D10AT No Play Sportacular Score is suppressed",
    noPlay?.sportacularScore === null,
    {
        expected: null,
        actual: noPlay?.sportacularScore
    }
);

test(
    "D10AT No Play confidence is suppressed",
    noPlay?.confidence === null,
    {
        expected: null,
        actual: noPlay?.confidence
    }
);

test(
    "D10AT No Play EV is suppressed",
    noPlay?.ev === null,
    {
        expected: null,
        actual: noPlay?.ev
    }
);


// ======================================================
// Nested No Play suppression
// ======================================================

test(
    "D10AT nested No Play Sportacular Score is suppressed",
    noPlay?.analytics?.sportacularScore === null,
    {
        expected: null,
        actual: noPlay?.analytics?.sportacularScore
    }
);

test(
    "D10AT nested No Play Price Edge is suppressed",
    noPlay?.analytics?.modelEdge === null,
    {
        expected: null,
        actual: noPlay?.analytics?.modelEdge
    }
);

test(
    "D10AT nested No Play probability is suppressed",
    noPlay?.analytics?.probability === null,
    {
        expected: null,
        actual: noPlay?.analytics?.probability
    }
);

test(
    "D10AT nested No Play confidence is suppressed",
    noPlay?.analytics?.confidence === null,
    {
        expected: null,
        actual: noPlay?.analytics?.confidence
    }
);

test(
    "D10AT nested No Play recommendation remains No Play",
    noPlay?.analytics?.recommendation === "No Play",
    {
        expected: "No Play",
        actual: noPlay?.analytics?.recommendation
    }
);


// ======================================================
// Cross-object parity
// ======================================================

test(
    "D10AT top-level and nested probability remain identical",
    over?.probability ===
        over?.analytics?.probability,
    {
        topLevel: over?.probability,
        nested: over?.analytics?.probability
    }
);

test(
    "D10AT top-level and nested Price Edge remain identical",
    over?.modelEdge ===
        over?.analytics?.modelEdge,
    {
        topLevel: over?.modelEdge,
        nested: over?.analytics?.modelEdge
    }
);

test(
    "D10AT top-level and nested Sportacular Score remain identical",
    over?.sportacularScore ===
        over?.analytics?.sportacularScore,
    {
        topLevel: over?.sportacularScore,
        nested: over?.analytics?.sportacularScore
    }
);

test(
    "D10AT top-level and nested confidence remain identical",
    over?.confidence ===
        over?.analytics?.confidence,
    {
        topLevel: over?.confidence,
        nested: over?.analytics?.confidence
    }
);

test(
    "D10AT top-level and nested recommendation remain identical",
    over?.recommendation ===
        over?.analytics?.recommendation,
    {
        topLevel: over?.recommendation,
        nested: over?.analytics?.recommendation
    }
);


// ======================================================
// Summary
// ======================================================

const summary = {

    test:
        "D10AT PLAYER PROPS BUILDER / API RESPONSE PARITY AUDIT",

    tests:
        results.length,

    passed,

    failed,

    pass:
        failed === 0,

    authoritativeChain: [
        "MLB universal A:AJ",
        "mlbAdapter",
        "evaluateProp",
        "calculatePlayerAnalytics",
        "analytics.propAnalytics",
        "buildProps",
        "player endpoint response"
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
        "D10AT player props builder / API response parity audit failed."
    );

}