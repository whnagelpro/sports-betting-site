import { calculateRecentForm } from "./recentForm.js";
import { calculateConsistency } from "./consistency.js";
import { calculateMatchup } from "./matchup.js";
import { buildPlayerReasons } from "./ruleEngine.js";
import { calculateProjection } from "./projection.js";

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

    const projection = calculateProjection({

    seasonAverage:
        seasonStats.average,

    recentAverage:
        recentForm.last5Average,

    matchupScore:
        matchupAnalysis.score

});

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

    consistency,

    projection,

};

}