// ======================================================
// Sportacular Analytics
// P18-B — Four-League Analytics / Scoring Regression
//
// PURPOSE:
// Freeze the production analytics layer shared by
// NBA / NHL / MLB / NFL.
//
// Production chain under test:
//
// Universal A:AJ
//      ↓
// League Adapter          [P18-A]
//      ↓
// evaluateProp()
//      ↓
// findBestProp()
//      ↓
// calculatePlayerAnalytics()
//      ↓
// Dashboard analytics
//
// This test does NOT change production behavior.
// ======================================================

import { evaluateProp } from "./evaluateProp.js";
import { findBestProp } from "./bestProp.js";
import { calculatePlayerAnalytics } from "./playerAnalytics.js";

const LEAGUES = ["NBA", "NHL", "MLB", "NFL"];

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

function sameNumber(actual, expected, tolerance = 1e-12) {
    return (
        typeof actual === "number" &&
        typeof expected === "number" &&
        Math.abs(actual - expected) <= tolerance
    );
}

function makeProp({
    league,
    suffix,
    market,
    bestSide,
    bestEV,
    probability,
    priceEdge,
    score,
    sportacularEdge,
    confidenceTier,
    riskScore = 24,
    riskTier = "Low",
    modelConfidence = 82
}) {
    return {
        id: `p18b-${league.toLowerCase()}-${suffix}`,

        league: league.toLowerCase(),

        playerId: `p18b-${league.toLowerCase()}-player`,
        playerName: `P18B ${league} Player`,

        market,
        displayName: market,

        line: 1.5,
        sportsbook: "P18B Sportsbook",

        overOdds: -110,
        underOdds: -110,

        bestSide,
        bestEV,
        bestModelProbability: probability,
        bestPriceEdge: priceEdge,

        trendScore: 74,
        trendStrength: "Strong",

        riskScore,
        riskTier,

        modelConfidence,

        sportacularScore: score,
        sportacularEdge,

        confidenceTier
    };
}

function makeLeagueProps(league) {
    return [
        makeProp({
            league,
            suffix: "over",
            market: "P18B Primary Market",
            bestSide: "Over",
            bestEV: 0.18,
            probability: 0.61,
            priceEdge: 0.08,
            score: 88,
            sportacularEdge: 0.16,
            confidenceTier: "Elite"
        }),

        makeProp({
            league,
            suffix: "under",
            market: "P18B Secondary Market",
            bestSide: "Under",
            bestEV: 0.15,
            probability: 0.59,
            priceEdge: 0.06,
            score: 81,
            sportacularEdge: 0.12,
            confidenceTier: "Strong",
            riskScore: 31,
            riskTier: "Medium",
            modelConfidence: 77
        }),

        // Deliberately inflated raw numbers.
        // This row MUST NOT win because final Best Side is No Play.
        makeProp({
            league,
            suffix: "no-play",
            market: "P18B No Play Market",
            bestSide: "No Play",
            bestEV: 0.99,
            probability: 0.99,
            priceEdge: 0.50,
            score: 100,
            sportacularEdge: 0.99,
            confidenceTier: "No Play",
            riskScore: 99,
            riskTier: "High",
            modelConfidence: 99
        })
    ];
}


// ======================================================
// 1. evaluateProp() — authoritative transport regression
// ======================================================

for (const league of LEAGUES) {

    const props = makeLeagueProps(league);

    const over = evaluateProp({
        prop: props[0],
        gameLogs: [],
        consistency: {}
    });

    const under = evaluateProp({
        prop: props[1],
        gameLogs: [],
        consistency: {}
    });

    const noPlay = evaluateProp({
        prop: props[2],
        gameLogs: [],
        consistency: {}
    });

    record(
        `P18-B ${league} evaluateProp preserves Over`,
        over?.evaluation?.bestSide === "Over",
        {
            expected: "Over",
            actual: over?.evaluation?.bestSide
        }
    );

    record(
        `P18-B ${league} evaluateProp preserves Under`,
        under?.evaluation?.bestSide === "Under",
        {
            expected: "Under",
            actual: under?.evaluation?.bestSide
        }
    );

    record(
        `P18-B ${league} evaluateProp preserves No Play`,
        noPlay?.evaluation?.bestSide === "No Play",
        {
            expected: "No Play",
            actual: noPlay?.evaluation?.bestSide
        }
    );

    record(
        `P18-B ${league} preserves authoritative Best EV`,
        sameNumber(over?.evaluation?.bestEV, 0.18),
        {
            expected: 0.18,
            actual: over?.evaluation?.bestEV
        }
    );

    record(
        `P18-B ${league} preserves authoritative model probability`,
        sameNumber(
            over?.evaluation?.bestModelProbability,
            0.61
        ),
        {
            expected: 0.61,
            actual: over?.evaluation?.bestModelProbability
        }
    );

    record(
        `P18-B ${league} preserves authoritative Price Edge`,
        sameNumber(over?.evaluation?.bestPriceEdge, 0.08),
        {
            expected: 0.08,
            actual: over?.evaluation?.bestPriceEdge
        }
    );

    record(
        `P18-B ${league} preserves authoritative Risk Score`,
        sameNumber(over?.evaluation?.riskScore, 24),
        {
            expected: 24,
            actual: over?.evaluation?.riskScore
        }
    );

    record(
        `P18-B ${league} preserves authoritative Risk Tier`,
        over?.evaluation?.riskTier === "Low",
        {
            expected: "Low",
            actual: over?.evaluation?.riskTier
        }
    );

    record(
        `P18-B ${league} preserves authoritative Model Confidence`,
        sameNumber(over?.evaluation?.modelConfidence, 82),
        {
            expected: 82,
            actual: over?.evaluation?.modelConfidence
        }
    );

    record(
        `P18-B ${league} preserves authoritative Sportacular Score`,
        sameNumber(over?.evaluation?.sportacularScore, 88),
        {
            expected: 88,
            actual: over?.evaluation?.sportacularScore
        }
    );

    record(
        `P18-B ${league} preserves authoritative Sportacular Edge`,
        sameNumber(over?.evaluation?.sportacularEdge, 0.16),
        {
            expected: 0.16,
            actual: over?.evaluation?.sportacularEdge
        }
    );

    record(
        `P18-B ${league} preserves authoritative Confidence Tier`,
        over?.evaluation?.confidenceTier === "Elite",
        {
            expected: "Elite",
            actual: over?.evaluation?.confidenceTier
        }
    );

    record(
        `P18-B ${league} Over remains actionable`,
        over?.evaluation?.actionable === true,
        {
            actionable: over?.evaluation?.actionable
        }
    );

    record(
        `P18-B ${league} Under remains actionable`,
        under?.evaluation?.actionable === true,
        {
            actionable: under?.evaluation?.actionable
        }
    );

    record(
        `P18-B ${league} No Play remains non-actionable`,
        noPlay?.evaluation?.actionable === false,
        {
            actionable: noPlay?.evaluation?.actionable
        }
    );

    record(
        `P18-B ${league} No Play compatibility probability suppressed`,
        noPlay?.probability === null,
        {
            compatibilityProbability: noPlay?.probability,
            authoritativeProbability:
                noPlay?.evaluation?.bestModelProbability
        }
    );

    record(
        `P18-B ${league} No Play compatibility edge suppressed`,
        noPlay?.edge?.edge === null,
        {
            compatibilityEdge: noPlay?.edge?.edge,
            authoritativePriceEdge:
                noPlay?.evaluation?.bestPriceEdge
        }
    );
}


// ======================================================
// 2. findBestProp() — selection regression
// ======================================================

for (const league of LEAGUES) {

    const evaluated =
        makeLeagueProps(league)
            .map(prop =>
                evaluateProp({
                    prop,
                    gameLogs: [],
                    consistency: {}
                })
            );

    const best = findBestProp(evaluated);

    record(
        `P18-B ${league} No Play cannot win best-prop selection`,
        best?.id === `p18b-${league.toLowerCase()}-over`,
        {
            expectedId:
                `p18b-${league.toLowerCase()}-over`,
            actualId:
                best?.id ?? null
        }
    );
}


// ======================================================
// 3. Explicit ranking hierarchy regression
//
// Score → Sportacular Edge → Best EV
// ======================================================

for (const league of LEAGUES) {

    const edgeA =
        evaluateProp({
            prop: makeProp({
                league,
                suffix: "edge-a",
                market: "P18B Edge A",
                bestSide: "Over",
                bestEV: 0.20,
                probability: 0.60,
                priceEdge: 0.07,
                score: 80,
                sportacularEdge: 0.10,
                confidenceTier: "Strong"
            })
        });

    const edgeB =
        evaluateProp({
            prop: makeProp({
                league,
                suffix: "edge-b",
                market: "P18B Edge B",
                bestSide: "Under",
                bestEV: 0.15,
                probability: 0.60,
                priceEdge: 0.07,
                score: 80,
                sportacularEdge: 0.14,
                confidenceTier: "Strong"
            })
        });

    const edgeWinner =
        findBestProp([edgeA, edgeB]);

    record(
        `P18-B ${league} Sportacular Edge breaks equal Score tie`,
        edgeWinner?.id ===
            `p18b-${league.toLowerCase()}-edge-b`,
        {
            expectedId:
                `p18b-${league.toLowerCase()}-edge-b`,
            actualId:
                edgeWinner?.id ?? null
        }
    );


    const evA =
        evaluateProp({
            prop: makeProp({
                league,
                suffix: "ev-a",
                market: "P18B EV A",
                bestSide: "Over",
                bestEV: 0.11,
                probability: 0.60,
                priceEdge: 0.07,
                score: 77,
                sportacularEdge: 0.09,
                confidenceTier: "Strong"
            })
        });

    const evB =
        evaluateProp({
            prop: makeProp({
                league,
                suffix: "ev-b",
                market: "P18B EV B",
                bestSide: "Under",
                bestEV: 0.16,
                probability: 0.60,
                priceEdge: 0.07,
                score: 77,
                sportacularEdge: 0.09,
                confidenceTier: "Strong"
            })
        });

    const evWinner =
        findBestProp([evA, evB]);

    record(
        `P18-B ${league} Best EV breaks equal Score and Edge tie`,
        evWinner?.id ===
            `p18b-${league.toLowerCase()}-ev-b`,
        {
            expectedId:
                `p18b-${league.toLowerCase()}-ev-b`,
            actualId:
                evWinner?.id ?? null
        }
    );
}


// ======================================================
// 4. calculatePlayerAnalytics() regression
// ======================================================

for (const league of LEAGUES) {

    const analytics =
        calculatePlayerAnalytics({
            gameLogs: [],
            props: makeLeagueProps(league)
        });

    const expectedId =
        `p18b-${league.toLowerCase()}-over`;

    record(
        `P18-B ${league} analytics selects authoritative Best Prop`,
        analytics?.bestProp?.id === expectedId,
        {
            expectedId,
            actualId:
                analytics?.bestProp?.id ?? null
        }
    );

    record(
        `P18-B ${league} dashboard Score uses Sportacular Score`,
        sameNumber(analytics?.score, 88),
        {
            expected: 88,
            actual: analytics?.score
        }
    );

    record(
        `P18-B ${league} dashboard recommendation uses Best Side`,
        analytics?.recommendation === "Over",
        {
            expected: "Over",
            actual: analytics?.recommendation
        }
    );

    record(
        `P18-B ${league} dashboard confidence uses Confidence Tier`,
        analytics?.confidence === "Elite",
        {
            expected: "Elite",
            actual: analytics?.confidence
        }
    );

    record(
        `P18-B ${league} dashboard probability uses Best Model Probability`,
        sameNumber(
            analytics?.bestProp?.probability,
            0.61
        ),
        {
            expected: 0.61,
            actual:
                analytics?.bestProp?.probability
        }
    );

    record(
        `P18-B ${league} dashboard edge uses Best Price Edge`,
        sameNumber(
            analytics?.bestProp?.edge,
            0.08
        ),
        {
            expected: 0.08,
            actual:
                analytics?.bestProp?.edge
        }
    );

    record(
        `P18-B ${league} dashboard EV converts exactly once`,
        sameNumber(
            analytics?.bestProp?.ev,
            18
        ),
        {
            expected: 18,
            actual:
                analytics?.bestProp?.ev
        }
    );

    record(
        `P18-B ${league} dashboard modelEdge uses Sportacular Edge`,
        sameNumber(
            analytics?.modelEdge,
            0.16
        ),
        {
            expected: 0.16,
            actual:
                analytics?.modelEdge
        }
    );

    record(
        `P18-B ${league} dashboard stars derive from frozen score`,
        sameNumber(
            analytics?.stars,
            4.5
        ),
        {
            expected: 4.5,
            actual:
                analytics?.stars
        }
    );

    record(
        `P18-B ${league} preserves all evaluated prop rows`,
        analytics?.propAnalytics?.length === 3,
        {
            expected: 3,
            actual:
                analytics?.propAnalytics?.length ?? null
        }
    );
}


// ======================================================
// 5. All-No-Play regression
// ======================================================

for (const league of LEAGUES) {

    const noPlayOnly =
        makeProp({
            league,
            suffix: "only-no-play",
            market: "P18B Only No Play",
            bestSide: "No Play",
            bestEV: 0.99,
            probability: 0.99,
            priceEdge: 0.50,
            score: 100,
            sportacularEdge: 0.99,
            confidenceTier: "No Play"
        });

    const analytics =
        calculatePlayerAnalytics({
            gameLogs: [],
            props: [noPlayOnly]
        });

    record(
        `P18-B ${league} all-No-Play player exposes no Best Prop`,
        analytics?.bestProp === null,
        {
            bestProp:
                analytics?.bestProp ?? null
        }
    );

    record(
        `P18-B ${league} all-No-Play recommendation remains No Play`,
        analytics?.recommendation === "No Play",
        {
            expected: "No Play",
            actual:
                analytics?.recommendation
        }
    );
}


// ======================================================
// FINAL SUMMARY
// ======================================================

const passed =
    results.filter(result => result.pass).length;

const failed =
    results.length - passed;

const summary = {

    test:
        "P18-B FOUR-LEAGUE ANALYTICS / SCORING REGRESSION",

    tests:
        results.length,

    passed,

    failed,

    pass:
        failed === 0,

    leagues:
        LEAGUES,

    frozenChain: [
        "Normalized prop contract",
        "evaluateProp",
        "findBestProp",
        "calculatePlayerAnalytics",
        "dashboard analytics"
    ],

    rankingContract: [
        "Actionable Over/Under only",
        "Sportacular Score",
        "Sportacular Edge",
        "Best EV"
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
        `P18-B failed ${failed} regression test(s).`
    );
}