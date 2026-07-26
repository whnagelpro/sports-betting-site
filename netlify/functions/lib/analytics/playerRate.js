export function calculatePlayerRate({

    seasonAverage,

    averageMinutes

}) {

    if (!averageMinutes || averageMinutes <= 0) {

        return {

            rate: 0,

            unit: "perMinute"

        };

    }

    const rate = seasonAverage / averageMinutes;

    return {

        rate: Number(rate.toFixed(3)),

        unit: "perMinute"

    };

}