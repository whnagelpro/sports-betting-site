export function calculateMatchup(matchup = {}) {

    const {

        opponentRank = 15,

        home = true,

        parkFactor = 100

    } = matchup;

    let score = 50;

    // Easier opponent = higher score
    score += (30 - opponentRank);

    // Home bonus
    if (home) {

        score += 5;

    }

    // Ballpark adjustment
    score += (parkFactor - 100) * 0.2;

    score = Math.max(0, Math.min(100, Math.round(score)));

    let rating = "Average";

    if (score >= 85) rating = "Elite";
    else if (score >= 70) rating = "Good";
    else if (score >= 55) rating = "Favorable";
    else if (score >= 40) rating = "Neutral";
    else rating = "Difficult";

    return {

        score,

        rating,

        opponentRank,

        home,

        parkFactor

    };

}