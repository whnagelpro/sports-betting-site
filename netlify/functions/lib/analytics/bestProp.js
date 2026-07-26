export function findBestProp(propAnalytics) {

    if (

        !propAnalytics ||

        propAnalytics.length === 0

    ) {

        return null;

    }

    let bestProp = propAnalytics[0];

    for (const prop of propAnalytics) {

        if (

            prop.expectedValue.expectedValue >

            bestProp.expectedValue.expectedValue

        ) {

            bestProp = prop;

        }

    }

    return bestProp;

}