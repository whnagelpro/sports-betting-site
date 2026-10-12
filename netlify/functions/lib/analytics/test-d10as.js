import { evaluateProp } from "./evaluateProp.js";
import { findBestProp } from "./bestProp.js";
import { calculatePlayerAnalytics } from "./playerAnalytics.js";

const results = [];

function record(name, pass, details = {}) {
    const result = {
        name,
        pass: Boolean(pass),
        ...details
    };

    results.push(result);
    console.log(JSON.stringify(result));
}

function nearlyEqual(a, b, tolerance = 1e-12) {
    return (
        Number.isFinite(Number(a)) &&
        Number.isFinite(Number(b)) &&
        Math.abs(Number(a) - Number(b)) <= tolerance
    );
}

function makeProp({
    id,
    market,
    bestSide,
    bestEV,
    bestModelProbability,
    bestPriceEdge,
    riskScore,
    riskTier,
    modelConfidence,
    sportacularScore,
    sportacularEdge,
    confidenceTier
}) {
    return {
        id,
        market,
        displayName: market,
        line: 1.5,
        sportsbook: "D10AS Test Book",

        bestSide,
        bestEV,
        bestModelProbability,
        bestPriceEdge,

        riskScore,
        riskTier,
        modelConfidence,

        sportacularScore,
        sportacularEdge,
        confidenceTier
    };
}


// ==========================================================
// CONTROLLED P15-AUTHORITATIVE PROPS
// ==========================================================

const overProp = makeProp({
    id: "d10as-over",
    market: "Hits",
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
});

const underProp = makeProp({
    id: "d10as-under",
    market: "Total Bases",
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
});

// Deliberately enormous underlying numbers.
// Because frozen Best Side is No Play, this row MUST NOT become
// actionable or win best-prop selection.
const noPlayProp = makeProp({
    id: "d10as-no-play",
    market: "Home Runs",
    bestSide: "No Play",
    bestEV: 0.99,
    bestModelProbability: 0.99,
    bestPriceEdge: 0.50,
    riskScore: 10,
    riskTier: "Low",
    modelConfidence: 99,
    sportacularScore: 100,
    sportacularEdge: 0.99,
    confidenceTier: "No Play"
});


// ==========================================================
// 1. EVALUATE PROP — AUTHORITATIVE TRANSPORT
// ==========================================================

const evaluatedOver = evaluateProp({
    prop: overProp,
    gameLogs: [],
    consistency: {}
});

const evaluatedUnder = evaluateProp({
    prop: underProp,
    gameLogs: [],
    consistency: {}
});

const evaluatedNoPlay = evaluateProp({
    prop: noPlayProp,
    gameLogs: [],
    consistency: {}
});


record(
    "D10AS actionable Over preserves frozen Best Side",
    evaluatedOver?.evaluation?.bestSide === "Over",
    {
        expected: "Over",
        actual: evaluatedOver?.evaluation?.bestSide
    }
);

record(
    "D10AS actionable Under preserves frozen Best Side",
    evaluatedUnder?.evaluation?.bestSide === "Under",
    {
        expected: "Under",
        actual: evaluatedUnder?.evaluation?.bestSide
    }
);

record(
    "D10AS frozen No Play preserves final Best Side",
    evaluatedNoPlay?.evaluation?.bestSide === "No Play",
    {
        expected: "No Play",
        actual: evaluatedNoPlay?.evaluation?.bestSide
    }
);

record(
    "D10AS Best EV survives backend evaluation unchanged",
    nearlyEqual(
        evaluatedOver?.evaluation?.bestEV,
        overProp.bestEV
    ),
    {
        expected: overProp.bestEV,
        actual: evaluatedOver?.evaluation?.bestEV
    }
);

record(
    "D10AS Best Model Probability survives backend evaluation unchanged",
    nearlyEqual(
        evaluatedOver?.evaluation?.bestModelProbability,
        overProp.bestModelProbability
    ),
    {
        expected: overProp.bestModelProbability,
        actual: evaluatedOver?.evaluation?.bestModelProbability
    }
);

record(
    "D10AS Best Price Edge survives backend evaluation unchanged",
    nearlyEqual(
        evaluatedOver?.evaluation?.bestPriceEdge,
        overProp.bestPriceEdge
    ),
    {
        expected: overProp.bestPriceEdge,
        actual: evaluatedOver?.evaluation?.bestPriceEdge
    }
);

record(
    "D10AS Risk Score survives backend evaluation unchanged",
    nearlyEqual(
        evaluatedOver?.evaluation?.riskScore,
        overProp.riskScore
    ),
    {
        expected: overProp.riskScore,
        actual: evaluatedOver?.evaluation?.riskScore
    }
);

record(
    "D10AS Risk Tier survives backend evaluation unchanged",
    evaluatedOver?.evaluation?.riskTier === overProp.riskTier,
    {
        expected: overProp.riskTier,
        actual: evaluatedOver?.evaluation?.riskTier
    }
);

record(
    "D10AS Model Confidence survives backend evaluation unchanged",
    nearlyEqual(
        evaluatedOver?.evaluation?.modelConfidence,
        overProp.modelConfidence
    ),
    {
        expected: overProp.modelConfidence,
        actual: evaluatedOver?.evaluation?.modelConfidence
    }
);

record(
    "D10AS Sportacular Score survives backend evaluation unchanged",
    nearlyEqual(
        evaluatedOver?.evaluation?.sportacularScore,
        overProp.sportacularScore
    ),
    {
        expected: overProp.sportacularScore,
        actual: evaluatedOver?.evaluation?.sportacularScore
    }
);

record(
    "D10AS Sportacular Edge survives backend evaluation unchanged",
    nearlyEqual(
        evaluatedOver?.evaluation?.sportacularEdge,
        overProp.sportacularEdge
    ),
    {
        expected: overProp.sportacularEdge,
        actual: evaluatedOver?.evaluation?.sportacularEdge
    }
);

record(
    "D10AS Confidence Tier survives backend evaluation unchanged",
    evaluatedOver?.evaluation?.confidenceTier ===
        overProp.confidenceTier,
    {
        expected: overProp.confidenceTier,
        actual: evaluatedOver?.evaluation?.confidenceTier
    }
);


// ==========================================================
// 2. ACTIONABILITY SEMANTICS
// ==========================================================

record(
    "D10AS Over remains actionable",
    evaluatedOver?.evaluation?.actionable === true,
    {
        actionable: evaluatedOver?.evaluation?.actionable
    }
);

record(
    "D10AS Under remains actionable",
    evaluatedUnder?.evaluation?.actionable === true,
    {
        actionable: evaluatedUnder?.evaluation?.actionable
    }
);

record(
    "D10AS No Play remains non-actionable",
    evaluatedNoPlay?.evaluation?.actionable === false,
    {
        actionable: evaluatedNoPlay?.evaluation?.actionable
    }
);

record(
    "D10AS No Play compatibility probability is suppressed",
    evaluatedNoPlay?.probability === null,
    {
        probability: evaluatedNoPlay?.probability,
        authoritativeProbability:
            evaluatedNoPlay?.evaluation?.bestModelProbability
    }
);

record(
    "D10AS No Play compatibility edge is suppressed",
    evaluatedNoPlay?.edge?.edge === null,
    {
        compatibilityEdge: evaluatedNoPlay?.edge?.edge,
        authoritativePriceEdge:
            evaluatedNoPlay?.evaluation?.bestPriceEdge
    }
);

record(
    "D10AS No Play compatibility score is suppressed",
    evaluatedNoPlay?.edge?.score === null,
    {
        compatibilityScore: evaluatedNoPlay?.edge?.score,
        authoritativeScore:
            evaluatedNoPlay?.evaluation?.sportacularScore
    }
);


// ==========================================================
// 3. BEST PROP SELECTION
// ==========================================================

const selectedBestProp = findBestProp([
    evaluatedUnder,
    evaluatedNoPlay,
    evaluatedOver
]);

record(
    "D10AS No Play cannot win best-prop selection despite inflated raw values",
    selectedBestProp?.id === overProp.id,
    {
        expectedId: overProp.id,
        actualId: selectedBestProp?.id ?? null
    }
);


// Score tie -> Sportacular Edge should decide.

const edgeTieA = evaluateProp({
    prop: makeProp({
        id: "d10as-edge-a",
        market: "Runs",
        bestSide: "Over",
        bestEV: 0.20,
        bestModelProbability: 0.60,
        bestPriceEdge: 0.07,
        riskScore: 20,
        riskTier: "Low",
        modelConfidence: 80,
        sportacularScore: 80,
        sportacularEdge: 0.10,
        confidenceTier: "Strong"
    })
});

const edgeTieB = evaluateProp({
    prop: makeProp({
        id: "d10as-edge-b",
        market: "RBIs",
        bestSide: "Under",
        bestEV: 0.15,
        bestModelProbability: 0.58,
        bestPriceEdge: 0.06,
        riskScore: 25,
        riskTier: "Low",
        modelConfidence: 78,
        sportacularScore: 80,
        sportacularEdge: 0.14,
        confidenceTier: "Strong"
    })
});

const edgeTieWinner =
    findBestProp([edgeTieA, edgeTieB]);

record(
    "D10AS Sportacular Edge breaks equal Sportacular Score tie",
    edgeTieWinner?.id === "d10as-edge-b",
    {
        expectedId: "d10as-edge-b",
        actualId: edgeTieWinner?.id ?? null
    }
);


// Score + Sportacular Edge tie -> Best EV should decide.

const evTieA = evaluateProp({
    prop: makeProp({
        id: "d10as-ev-a",
        market: "Strikeouts",
        bestSide: "Over",
        bestEV: 0.11,
        bestModelProbability: 0.57,
        bestPriceEdge: 0.05,
        riskScore: 30,
        riskTier: "Medium",
        modelConfidence: 75,
        sportacularScore: 77,
        sportacularEdge: 0.09,
        confidenceTier: "Strong"
    })
});

const evTieB = evaluateProp({
    prop: makeProp({
        id: "d10as-ev-b",
        market: "Walks",
        bestSide: "Under",
        bestEV: 0.17,
        bestModelProbability: 0.59,
        bestPriceEdge: 0.06,
        riskScore: 28,
        riskTier: "Medium",
        modelConfidence: 77,
        sportacularScore: 77,
        sportacularEdge: 0.09,
        confidenceTier: "Strong"
    })
});

const evTieWinner =
    findBestProp([evTieA, evTieB]);

record(
    "D10AS Best EV breaks equal Score and Sportacular Edge tie",
    evTieWinner?.id === "d10as-ev-b",
    {
        expectedId: "d10as-ev-b",
        actualId: evTieWinner?.id ?? null
    }
);


// ==========================================================
// 4. FULL PLAYER ANALYTICS / DASHBOARD HANDOFF
// ==========================================================

const playerAnalytics =
    calculatePlayerAnalytics({
        gameLogs: [],
        props: [
            underProp,
            noPlayProp,
            overProp
        ]
    });

record(
    "D10AS calculatePlayerAnalytics selects authoritative best prop",
    playerAnalytics?.bestProp?.id === overProp.id,
    {
        expectedId: overProp.id,
        actualId: playerAnalytics?.bestProp?.id ?? null
    }
);

record(
    "D10AS dashboard Score comes from frozen Sportacular Score",
    nearlyEqual(
        playerAnalytics?.score,
        overProp.sportacularScore
    ),
    {
        expected: overProp.sportacularScore,
        actual: playerAnalytics?.score
    }
);

record(
    "D10AS dashboard recommendation comes from frozen Best Side",
    playerAnalytics?.recommendation === overProp.bestSide,
    {
        expected: overProp.bestSide,
        actual: playerAnalytics?.recommendation
    }
);

record(
    "D10AS dashboard confidence comes from frozen Confidence Tier",
    playerAnalytics?.confidence === overProp.confidenceTier,
    {
        expected: overProp.confidenceTier,
        actual: playerAnalytics?.confidence
    }
);

record(
    "D10AS dashboard probability comes from frozen Best Model Probability",
    nearlyEqual(
        playerAnalytics?.bestProp?.probability,
        overProp.bestModelProbability
    ),
    {
        expected: overProp.bestModelProbability,
        actual: playerAnalytics?.bestProp?.probability
    }
);

record(
    "D10AS dashboard Price Edge comes from frozen Best Price Edge",
    nearlyEqual(
        playerAnalytics?.bestProp?.edge,
        overProp.bestPriceEdge
    ),
    {
        expected: overProp.bestPriceEdge,
        actual: playerAnalytics?.bestProp?.edge
    }
);

record(
    "D10AS dashboard EV transports frozen $1 EV as display percent",
    nearlyEqual(
        playerAnalytics?.bestProp?.ev,
        overProp.bestEV * 100
    ),
    {
        expected: overProp.bestEV * 100,
        actual: playerAnalytics?.bestProp?.ev
    }
);

record(
    "D10AS dashboard Sportacular Edge comes from frozen contract",
    nearlyEqual(
        playerAnalytics?.bestProp?.sportacularEdge,
        overProp.sportacularEdge
    ),
    {
        expected: overProp.sportacularEdge,
        actual: playerAnalytics?.bestProp?.sportacularEdge
    }
);


// ==========================================================
// 5. ALL-NO-PLAY PLAYER
// ==========================================================

const noPlayOnlyAnalytics =
    calculatePlayerAnalytics({
        gameLogs: [],
        props: [noPlayProp]
    });

record(
    "D10AS all-No-Play player exposes no dashboard Best Prop",
    noPlayOnlyAnalytics?.bestProp === null,
    {
        bestProp: noPlayOnlyAnalytics?.bestProp ?? null
    }
);

record(
    "D10AS all-No-Play player recommendation remains No Play",
    noPlayOnlyAnalytics?.recommendation === "No Play",
    {
        expected: "No Play",
        actual: noPlayOnlyAnalytics?.recommendation
    }
);


// ==========================================================
// FINAL REPORT
// ==========================================================

const failed =
    results.filter(result => !result.pass);

const report = {
    test:
        "D10AS MLB BACKEND EVALUATION / BEST-PROP SELECTION PARITY AUDIT",

    tests:
        results.length,

    passed:
        results.length - failed.length,

    failed:
        failed.length,

    pass:
        failed.length === 0,

    authoritativeChain: [
        "MLB universal A:AJ",
        "mlbAdapter",
        "evaluateProp",
        "findBestProp",
        "calculatePlayerAnalytics",
        "dashboard bestProp"
    ],

    results
};

console.log(
    JSON.stringify(report, null, 2)
);

if (failed.length) {
    throw new Error(
        "D10AS MLB backend evaluation / best-prop selection parity audit failed."
    );
}