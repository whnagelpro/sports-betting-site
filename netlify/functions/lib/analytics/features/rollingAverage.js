export function calculateRollingAverage(
    values = [],
    window = 5
) {

    if (!values.length) {

        return 0;

    }

    const recentValues =

        values.slice(-window);

    const total =

        recentValues.reduce(

            (sum, value) => sum + value,

            0

        );

    return Number(

        (total / recentValues.length)

            .toFixed(2)

    );

}