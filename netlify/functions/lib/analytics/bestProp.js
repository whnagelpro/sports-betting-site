export function findBestProp(propAnalytics) {

    if (
        !Array.isArray(propAnalytics) ||
        propAnalytics.length === 0
    ) {
        return null;
    }


    const actionableProps =
        propAnalytics.filter(prop =>
            prop?.evaluation?.actionable === true &&
            (
                prop?.evaluation?.bestSide === "Over" ||
                prop?.evaluation?.bestSide === "Under"
            )
        );


    if (actionableProps.length === 0) {
        return null;
    }


    return [...actionableProps].sort((a, b) => {

        const scoreA =
            a.evaluation?.sportacularScore ??
            -Infinity;

        const scoreB =
            b.evaluation?.sportacularScore ??
            -Infinity;


        if (scoreA !== scoreB) {
            return scoreB - scoreA;
        }


        const edgeA =
            a.evaluation?.sportacularEdge ??
            -Infinity;

        const edgeB =
            b.evaluation?.sportacularEdge ??
            -Infinity;


        if (edgeA !== edgeB) {
            return edgeB - edgeA;
        }


        const evA =
            a.evaluation?.bestEV ??
            -Infinity;

        const evB =
            b.evaluation?.bestEV ??
            -Infinity;


        return evB - evA;
    })[0];
}