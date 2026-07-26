export function buildFeatureVector({

    seasonStats,

    recentForm,

    consistency,

    playerRate,

    projectedMinutes,

    gameContext

}) {

    return {

        seasonAverage:
            seasonStats.average,

        recentAverage:
            recentForm.last10Average,

        trendScore:
            recentForm.score,

        consistencyScore:
            consistency.score,

        playerRate:
            playerRate.rate,

        projectedMinutes:
            projectedMinutes.projectedMinutes,

        contextMultiplier:
            gameContext.contextMultiplier

    };

}