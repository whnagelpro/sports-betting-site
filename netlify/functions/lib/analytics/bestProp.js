export function findBestProp(propAnalytics) {

    if (

        !propAnalytics ||

        propAnalytics.length === 0

    ) {

        return null;

    }

    return [...propAnalytics].sort((a, b) => {

        const scoreA =
            a.evaluation?.sportacularScore ??
            a.edge?.score ??
            a.score ??
            0;

        const scoreB =
            b.evaluation?.sportacularScore ??
            b.edge?.score ??
            b.score ??
            0;

        if (scoreA !== scoreB) {

            return scoreB - scoreA;

        }

        const edgeA = a.edge?.edgePercent ?? 0;
        const edgeB = b.edge?.edgePercent ?? 0;

        if (edgeA !== edgeB) {

            return edgeB - edgeA;

        }

        const evA = a.expectedValue?.expectedValuePercent ?? 0;
        const evB = b.expectedValue?.expectedValuePercent ?? 0;

        return evB - evA;

    })[0];

}