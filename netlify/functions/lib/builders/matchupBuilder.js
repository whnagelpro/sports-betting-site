function buildMatchup(context) {

    return context.matchup
        ? {

            awayTeam: context.matchup["Away Team"],

            homeTeam: context.matchup["Home Team"],

            gameDate: context.matchup["Game Date"],

            opponentPitcher: context.matchup["Opponent Pitcher"],

            opponentThrows: context.matchup["Opponent Throws"],

            lineupSpot: context.matchup["Projected Lineup Spot"]

        }
        : null;

}