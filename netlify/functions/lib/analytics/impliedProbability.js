export function calculateImpliedProbability({

    odds,

    format = "american"

}) {

    if (

        odds == null ||

        Number.isNaN(Number(odds))

    ) {

        return null;

    }

    const value = Number(odds);

    if (format === "decimal") {

        if (value <= 1) {

            return null;

        }

        return 1 / value;

    }

    if (value > 0) {

        return 100 / (value + 100);

    }

    return (

        Math.abs(value)

        /

        (Math.abs(value) + 100)

    );

}