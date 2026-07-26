import { calculateRecentForm } from "./recentForm.js";
import { calculateConsistency } from "./consistency.js";
import { calculateMatchup } from "./matchup.js";
import { buildPlayerReasons } from "./ruleEngine.js";
import { calculateProjection } from "./projection.js";
import { calculateProbability } from "./probability.js";
import { calculateImpliedProbability } from "./impliedProbability.js";
import { calculateEdge } from "./edge.js";
import { calculateExpectedValue } from "./expectedValue.js";
import { findBestProp } from "./bestProp.js";
import { calculateRecommendation } from "./recommendation.js";

export function calculatePlayerAnalytics({

    row,

    seasonStats,

    gameLogs = [],

    matchup = null,

    props = []

}) {

    const recentForm = calculateRecentForm(gameLogs);

    const consistency = calculateConsistency(gameLogs);

    const matchupAnalysis = calculateMatchup(matchup);

    // No sportsbook props available
    if (props.length === 0) {

        return null;

    }

    const propAnalytics = [];

    for (const prop of props) {

        const sportsbookLine = prop.line;

        const americanOdds = prop.odds;

        const projection = calculateProjection({

            seasonAverage:
                seasonStats.seasonAverage,

            recentAverage:
                recentForm.last5Average,

            matchupScore:
                matchupAnalysis.score

        });

        const probability = calculateProbability({

            projection:
                projection.projectedStat,

            sportsbookLine,

            standardDeviation:
                seasonStats.standardDeviation

        });

        const impliedProbability =
            calculateImpliedProbability(
                americanOdds
            );

        const edge = calculateEdge({

            projectedProbability:
                probability.overProbability / 100,

            impliedProbability

        });

        const expectedValue =
            calculateExpectedValue({

                projectedProbability:
                    probability.overProbability / 100,

                americanOdds

            });

        const recommendation =
    calculateRecommendation({

        expectedValue,

        edge,

        probability,

        consistency,

        matchup: matchupAnalysis

    });

        propAnalytics.push({

    ...prop,

    projection,

    probability,

    impliedProbability,

    edge,

    expectedValue,

    recommendation

});

    }

    const bestProp = findBestProp(propAnalytics);

    const {

        strengths,

        weaknesses

    } = buildPlayerReasons({

        recentForm,

        consistency,

        matchup: matchupAnalysis

    });

    const analyticsScore = Math.round(

        recentForm.score * 0.35 +

        consistency.score * 0.35 +

        matchupAnalysis.score * 0.30

    );

    return {

        seasonStats,

        score: analyticsScore,

        matchup: matchupAnalysis,

        confidence: "Unknown",

        recommendation: "No Recommendation",

        bestProp,

        allProps: propAnalytics,

        strengths,

        weaknesses,

        recentForm,

        consistency

    };

}