import { calculateRecentForm } from "./recentForm.js";
import { calculateConsistency } from "./consistency.js";
import { calculateMatchup } from "./matchup.js";

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

    const strengths = [];

    const weaknesses = [];

    if (recentForm.trend === "Up") {

    strengths.push(
        "Recent performance trending upward"
    );

}

    const analyticsScore = Math.round(

    recentForm.score * 0.35 +

    consistency.score * 0.35 +

    matchupAnalysis.score * 0.30

    );

    return {

    score: analyticsScore,

    matchup: matchupAnalysis,

    confidence: "Unknown",

    recommendation: "No Recommendation",

    bestProp: {

        market: "-",

        line: "-",

        ev: "-"

    },

    strengths,

    weaknesses,

    recentForm,

    consistency

};

}