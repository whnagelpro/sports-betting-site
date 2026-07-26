export function analyzeSlate({

    players,

    analyzePlayer

}) {

    const results = [];

    for (const player of players) {

        const analysis =

            analyzePlayer(player);

        if (analysis) {

            results.push(analysis);

        }

    }

    return results;

}