export function calculateExpectedValue({

    projectedProbability,

    odds,

    format = "american"

}) {

    if (

        projectedProbability == null ||

        odds == null

    ) {

        return {

            expectedValue: null,

            expectedValuePercent: null

        };

    }

    const value = Number(odds);

    let decimalOdds;

    if (format === "decimal") {

        decimalOdds = value;

    }

    else if (value > 0) {

        decimalOdds =

            1 +

            (

                value /

                100

            );

    }

    else {

        decimalOdds =

            1 +

            (

                100 /

                Math.abs(value)

            );

    }

    const expectedValue =

        (

            projectedProbability *

            (decimalOdds - 1)

        )

        -

        (

            1 -

            projectedProbability

        );

    return {

        expectedValue,

        expectedValuePercent:

            Number(

                (

                    expectedValue *

                    100

                ).toFixed(2)

            )

    };

}