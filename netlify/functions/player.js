// ======================================================
// Sportacular Analytics
// Universal Player Endpoint
// ======================================================

import { DATA_SOURCES } from "./lib/config.js";

import { loadCSV } from "./lib/csv.js";

import { loadSeasonStats } from "./lib/seasonStats.js";

import { loadPlayerContext } from "./lib/playerContext.js";

import { success, badRequest, serverError, notFound } from "./lib/response.js";

import { loadGameLogs } from "./lib/gameLogs.js";

import { loadTrends } from "./lib/trends.js";

import { loadPlayerProps } from "./lib/playerProps.js";

import { loadGameOdds } from "./lib/gameOdds.js";

import { buildHero } from "./lib/builders/heroBuilder.js";

import { buildMatchup } from "./lib/builders/matchupBuilder.js";

import { buildProps } from "./lib/builders/propsBuilder.js";

import { buildTrends } from "./lib/builders/trendsBuilder.js";

import { buildGameLogs } from "./lib/builders/gameLogsBuilder.js";

import { buildQuickStats } from "./lib/builders/quickStatsBuilder.js";

import { buildSeasonPanels } from "./lib/builders/seasonPanelsBuilder.js";

import { calculatePlayerAnalytics } from "./lib/analytics/playerAnalytics.js";

export async function handler(event) {

    try {

        const league = (
            event.queryStringParameters?.league || ""
        ).toLowerCase();

        const id = event.queryStringParameters?.id;

        if (!league) {

            return badRequest(
                "Missing league."
            );

        }

        if (!id) {

            return badRequest(
                "Missing player id."
            );

        }

        const source = DATA_SOURCES[league];

        if (!source) {

            return badRequest(
                "Unsupported league."
            );

        }

        // ----------------------------
        // Load CSV data
        // ----------------------------

const [

    roster,

    seasonRows,

    gameLogRows,

    trendRows,

    gameOddsRows,

    playerPropRows

] = await Promise.all([

    loadCSV(source.roster),

    loadSeasonStats(source.seasonStats),

    loadGameLogs(source.gameLogs),

    loadTrends(source.trends),

    loadGameOdds(source.gameOdds),

    loadPlayerProps(source.playerProps)

]);

console.log("Building context...");
const context = loadPlayerContext({
    league,
    playerId: id,
    roster,
    seasonRows,
    gameLogRows,
    trendRows,
    gameOddsRows,
    playerPropRows
});
console.log("✓ context built");

        if (!context) {

            return notFound(
                "Player not found."
            );

        }

        // ----------------------------
        // Build player object
        // ----------------------------

console.log("Building hero...");
const hero = buildHero(context);
console.log("✓ hero");

console.log("Building matchup...");
const matchup = buildMatchup(context);
console.log("✓ matchup");

console.log("Building trends...");
const trends = buildTrends(context);
console.log("✓ trends");

console.log("Building game logs...");
const gameLogs = buildGameLogs(context);
console.log("✓ game logs");

const season = context.seasonStats;

const quickStats = buildQuickStats(context);

const games = Number(season["Games Played"] ?? 0);

const totalHits =
    Math.round(Number(season["Avg Hits"] ?? 0) * games);

const totalRuns =
    Math.round(Number(season["Avg Runs"] ?? 0) * games);

const totalRBIs =
    Math.round(Number(season["Avg RBIs"] ?? 0) * games);

const totalHomeRuns =
    Math.round(Number(season["Avg Home Runs"] ?? 0) * games);

const totalBases =
    Math.round(Number(season["Avg Total Bases"] ?? 0) * games);

const totalWalks =
    Math.round(Number(season["Avg Walks"] ?? 0) * games);

const totalStrikeouts =
    Math.round(Number(season["Avg Strikeouts"] ?? 0) * games);

const seasonPanels = buildSeasonPanels({

    season,

    games,

    totalHits,

    totalRuns,

    totalRBIs,

    totalHomeRuns,

    totalBases,

    totalWalks,

    totalStrikeouts,

    trends,

    isPitcher: context.isPitcher

});

console.log("Building analytics...");

const analytics = calculatePlayerAnalytics({
    seasonStats: season,
    gameLogs: context.gameLogs,
    matchup: context.matchup,
    props: context.props
});

console.log("✓ analytics");

// Build props from the evaluated analytics WITHOUT modifying context
console.log("Building props...");

const props = buildProps({
    ...context,
    props: analytics.propAnalytics
});

console.log("✓ props");

const player = {

    hero,

    season,

    matchup,

    props,

    trends,

    gameLogs,

    quickStats,

    seasonPanels,

    insights: [],

    analytics

};

console.log("Returning player response...");

return success(player);

    }

    catch (error) {

        console.error(error);

        return serverError(error);

    }

}