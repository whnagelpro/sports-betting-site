export function calculateExpectedValue({

    projectedProbability,

    americanOdds

}) {

    let decimalOdds;

    if (americanOdds > 0) {

        decimalOdds =

            1 +

            (

                americanOdds /

                100

            );

    }

    else {

        decimalOdds =

            1 +

            (

                100 /

                Math.abs(americanOdds)

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

                )

                .toFixed(2)

            )

    };

}