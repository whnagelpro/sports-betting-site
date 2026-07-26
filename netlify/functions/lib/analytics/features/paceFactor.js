export function calculatePaceFactor({

    teamPace,

    opponentPace,

    leagueAveragePace = 100

}) {

    const expectedPace =

        (teamPace + opponentPace) / 2;

    const paceModifier =

        expectedPace / leagueAveragePace;

    return {

        expectedPace:

            Number(expectedPace.toFixed(1)),

        paceModifier:

            Number(paceModifier.toFixed(3)),

        breakdown: {

            teamPace,

            opponentPace,

            leagueAveragePace

        }

    };

}