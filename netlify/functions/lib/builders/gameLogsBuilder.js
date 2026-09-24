export function buildGameLogs(context) {

    const league = context.league?.toLowerCase() ?? "mlb";

    if (league === "nfl") {

        return context.gameLogs.map((game, index) => {

            if (index === 0) {
                console.log("Object inside map:");
                console.log(game);
            }

            const mapped = {

                gameDate: game.gameDate,

                gameId: game.gameId,

                opponent: game.opponent,

                passingYards: game.passingYards,

                passingTDs: game.passingTDs,

                interceptions: game.interceptions,

                completions: game.completions,

                passAttempts: game.passAttempts,

                rushingYards: game.rushingYards,

                rushingAttempts: game.rushingAttempts,

                rushingTDs: game.rushingTDs,

                receptions: game.receptions,

                receivingYards: game.receivingYards,

                receivingTDs: game.receivingTDs

            };

            console.log("Mapped NFL Game Log:", mapped);

            return mapped;

        });

    }

    if (league === "nba") {

        return context.gameLogs.map((game, index) => {

            if (index === 0) {
                console.log("RAW NBA GAME LOG:");
                console.log(game);

                console.log("RAW NBA GAME LOG KEYS:");
                console.log(Object.keys(game));
            }

            return {

                gameDate: game["Game Date"] ?? game.gameDate,

                gameId: game["Game ID"] ?? game.gameId,

                opponent: game["Opponent"] ?? game.opponent,

                minutes: game["Minutes"] ?? game.minutes,

                points: game["Points"] ?? game.points,

                rebounds: game["Rebounds"] ?? game.rebounds,

                assists: game["Assists"] ?? game.assists,

                threes: game["Threes"] ?? game.threes,

                steals: game["Steals"] ?? game.steals,

                blocks: game["Blocks"] ?? game.blocks,

                turnovers: game["Turnovers"] ?? game.turnovers

            };

        });

    }

    if (league === "nhl") {

        return context.gameLogs.map(game => ({

            gameDate: game.gameDate,

            gameId: game.gameId,

            opponent: game.opponent

        }));

    }

    if (context.isPitcher) {

        return context.gameLogs.map(game => {

            const outs = Number(game.outs ?? 0);

            const innings = Math.floor(outs / 3);

            const remainingOuts = outs % 3;

            return {

                gameDate: game.gameDate,

                opponent: game.opponent,

                inningsPitched: `${innings}.${remainingOuts}`,

                strikeouts: game.strikeouts,

                earnedRuns: game.earnedRuns,

                hitsAllowed: game.hitsAllowed,

                walks: game.walks

            };

        });

    }

    return context.gameLogs.map(game => ({

        gameDate: game.gameDate,

        opponent: game.opponent,

        hits: game.hits,

        runs: game.runs,

        rbis: game.rbis,

        homeRuns: game.homeRuns,

        totalBases: game.totalBases,

        walks: game.walks,

        strikeouts: game.strikeouts

    }));

}