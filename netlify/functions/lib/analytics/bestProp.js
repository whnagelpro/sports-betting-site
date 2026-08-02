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

            (prop.score ?? 0) >

            (bestProp.score ?? 0)

        ) {

            bestProp = prop;

        }

    }

    return bestProp;

}