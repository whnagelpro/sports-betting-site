export function calculateImpliedProbability(
    americanOdds
) {

    if (americanOdds > 0) {

        return (

            100 /

            (americanOdds + 100)

        );

    }

    return (

        Math.abs(americanOdds)

        /

        (

            Math.abs(americanOdds)

            + 100

        )

    );

}