import { calculateRecentForm } from "./recentForm.js";

export function calculatePlayerAnalytics({

    row,

    seasonStats,

    gameLogs = [],

    matchup = null,

    props = []

}) {

    const recentForm = calculateRecentForm(gameLogs);

    return {

        score: recentForm.score,

        confidence: "Unknown",

        recommendation: "No Recommendation",

        strengths: [],

        weaknesses: [],

        bestProp: {

            market: "-",

            line: "-",

            ev: "-"

        },
        
        recentForm

    };

}