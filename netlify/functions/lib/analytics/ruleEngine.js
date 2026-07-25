export function buildPlayerReasons({

    recentForm,

    consistency,

    matchup

}) {

    const strengths = [];

    const weaknesses = [];

    // Recent Form

    if (recentForm.trend === "Up") {

        strengths.push(
            "Recent performance trending upward"
        );

    }

    // Consistency

    if (consistency.rating === "Elite") {

        strengths.push(
            "Highly consistent performer"
        );

    }

    // Matchup

    if (

        matchup.rating === "Elite" ||

        matchup.rating === "Good"

    ) {

        strengths.push(
            "Favorable matchup"
        );

    }

    if (matchup.rating === "Difficult") {

        weaknesses.push(
            "Today's matchup is challenging"
        );

    }

    return {

        strengths,

        weaknesses

    };

}