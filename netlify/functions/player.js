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

async function safeTimedLoad(
    label,
    loader,
    fallback = []
) {

    const start = Date.now();

    console.log(`Loading ${label}...`);

    try {

        const result =
            await loader();

        console.log(
            `✓ ${label} loaded in ${Date.now() - start} ms`
        );

        return result;

    } catch (error) {

        console.warn(
            `⚠ ${label} unavailable after ${Date.now() - start} ms:`,
            error?.message || String(error)
        );

        return fallback;

    }

}

export async function handler(event) {

    let stage = "starting player endpoint";

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

        stage = "loading required roster";

        console.log("Loading roster...");

        const rosterStart =
            Date.now();

        const roster =
            await loadCSV(source.roster);

        console.log(
            `✓ roster loaded in ${Date.now() - rosterStart} ms`
        );


        stage = "loading supplemental CSV datasets";

        const [

            seasonRows,

            gameLogRows,

            trendRows,

            gameOddsRows,

            playerPropRows

        ] = await Promise.all([

            safeTimedLoad(
                "season stats",
                () => loadSeasonStats(source.seasonStats)
            ),

            safeTimedLoad(
                "game logs",
                () => loadGameLogs(source.gameLogs)
            ),

            safeTimedLoad(
                "trends",
                () => loadTrends(source.trends)
            ),

            safeTimedLoad(
                "game odds",
                () => loadGameOdds(source.gameOdds)
            ),

            safeTimedLoad(
                "player props",
                () => loadPlayerProps(source.playerProps)
            )

        ]);

        const dataAvailability = {

            seasonStats:
                Array.isArray(seasonRows) &&
                seasonRows.length > 0,

            gameLogs:
                Array.isArray(gameLogRows) &&
                gameLogRows.length > 0,

            trends:
                Array.isArray(trendRows) &&
                trendRows.length > 0,

            gameOdds:
                Array.isArray(gameOddsRows) &&
                gameOddsRows.length > 0,

            playerProps:
                Array.isArray(playerPropRows) &&
                playerPropRows.length > 0

        };

        console.log(
            "Player data availability:",
            dataAvailability
        );


        // ----------------------------
        // Build player context
        // ----------------------------

        stage = "building player context";

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

        stage = "building hero";

        console.log("Building hero...");

        const hero = buildHero(context);

        console.log("✓ hero");


        stage = "building matchup";

        console.log("Building matchup...");

        const matchup = buildMatchup(context);

        console.log("✓ matchup");


        stage = "building trends";

        console.log("Building trends...");

        const trends = buildTrends(context);

        console.log("✓ trends");


        stage = "building game logs";

        console.log("Building game logs...");

        const gameLogs = buildGameLogs(context);

        console.log("Built Game Logs:");

        console.log(gameLogs[0]);


        const season = context.seasonStats;


        stage = "building quick stats";

        const quickStats = buildQuickStats(context);


        stage = "building season panels";

        const seasonPanels = buildSeasonPanels(context);


        stage = "calculating player analytics";

        console.log("Building analytics...");

        const analytics = calculatePlayerAnalytics({
            seasonStats: season,
            gameLogs: context.gameLogs,
            matchup: context.matchup,
            props: context.props
        });


        console.log("Analytics object:");

        console.log(analytics);


        console.log("Context props:");

        console.log(context.props);


        console.log("✓ analytics");


        // Build props from the evaluated analytics WITHOUT modifying context

        stage = "building props";

        console.log("Building props...");

        const props = buildProps({
            ...context,
            props: analytics?.propAnalytics ?? []
        });

        console.log("✓ props");


        const player = {

            hero,

            dataAvailability,

            isPitcher: context.isPitcher,

            positionGroup:
                context.positionGroup ??
                (context.isPitcher ? "PITCHER" : "HITTER"),

            season,

            matchup,

            props,

            trends,

            gameLogs,

            quickStats,

            seasonPanels,

            insights: [],

            analytics: analytics ?? {
                score: 0,
                sportacularScore: 0,
                stars: 0,
                confidence: "N/A",
                recommendation: "No Props Available",
                edge: null,
                bestProp: null,
                propAnalytics: [],
                consistency: 0,
                modelEdge: null,
                analyticsVersion: 2
            }

        };


        stage = "returning player response";

        console.log("Returning player response...");

        return success(player);

    }

    catch (error) {

        console.error(
            `PLAYER ENDPOINT FAILED DURING: ${stage}`
        );

        console.error(error);

        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                error: "Unable to load player.",
                stage,
                message: error?.message || String(error)
            })
        };

    }

}