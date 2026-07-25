export function calculateRecentForm(gameLogs = []) {

    const last5 = gameLogs.slice(0, 5);

    const last10 = gameLogs.slice(0, 10);

    function average(list, field) {

        if (!list.length) return 0;

        const total = list.reduce(

            (sum, game) => sum + (Number(game[field]) || 0),

            0

        );

        return total / list.length;

    }

    const last5Average = average(last5, "strikeouts");

    const last10Average = average(last10, "strikeouts");

    let trend = "Neutral";

    if (last5Average > last10Average) {

        trend = "Up";

    }

    else if (last5Average < last10Average) {

        trend = "Down";

    }

    const score = Math.min(

        100,

        Math.round(last5Average * 10)

    );

    return {

        last5Average,

        last10Average,

        trend,

        score

    };

}