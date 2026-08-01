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

const hero = buildHero(context);

const matchup = buildMatchup(context);

const props = buildProps(context);

const trends = buildTrends(context);

const season = context.seasonStats;

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

function buildGameLogs() {

    return context.gameLogs.map(game => ({

        gameDate: game["Game Date"],

        opponent: game["Opponent"],

        hits: game["Hits"],

        runs: game["Runs"],

        rbis: game["RBIs"],

        homeRuns: game["Home Runs"],

        totalBases: game["Total Bases"],

        strikeouts: game["Strikeouts"],

        walks: game["Walks"],

        pitcherStrikeouts: game["Pitcher Strikeouts"],

        pitcherOuts: game["Pitcher Outs"],

        pitcherEarnedRuns: game["Pitcher Earned Runs"],

        pitcherHitsAllowed: game["Pitcher Hits Allowed"],

        pitcherWalks: game["Pitcher Walks"]

    }));

}

const gameLogs = buildGameLogs();

function buildQuickStats() {

    return [

        {
            label: "Games",
            value: season["Games Played"] ?? "-"
        },

        {
            label: "Hits",
            value: Number(season["Avg Hits"] ?? 0).toFixed(2)
        },

        {
            label: "Runs",
            value: Number(season["Avg Runs"] ?? 0).toFixed(2)
        },

        {
            label: "RBIs",
            value: Number(season["Avg RBIs"] ?? 0).toFixed(2)
        },

        {
            label: "Home Runs",
            value: Number(season["Avg Home Runs"] ?? 0).toFixed(2)
        },

        {
            label: "Strikeouts",
            value: Number(season["Avg Strikeouts"] ?? 0).toFixed(2)
        }

    ];

}

const quickStats = buildQuickStats();

function buildSeasonPanels() {

    return [

        {

            title: "Season Production",

            stats: [

                {
                    label: "Games",
                    value: games
                },

                {
                    label: "Hits",
                    value: totalHits
                },

                {
                    label: "Runs",
                    value: totalRuns
                },

                {
                    label: "RBIs",
                    value: totalRBIs
                },

                {
                    label: "Home Runs",
                    value: totalHomeRuns
                },

                {
                    label: "Total Bases",
                    value: totalBases
                },

                {
                    label: "Walks",
                    value: totalWalks
                },

                {
                    label: "Strikeouts",
                    value: totalStrikeouts
                }

            ]

        },

        {

            title: "Per Game",

            stats: [

                {
                    label: "Hits / Game",
                    value: Number(season["Avg Hits"] || 0).toFixed(2)
                },

                {
                    label: "Runs / Game",
                    value: Number(season["Avg Runs"] || 0).toFixed(2)
                },

                {
                    label: "RBIs / Game",
                    value: Number(season["Avg RBIs"] || 0).toFixed(2)
                },

                {
                    label: "HR / Game",
                    value: Number(season["Avg Home Runs"] || 0).toFixed(2)
                },

                {
                    label: "TB / Game",
                    value: Number(season["Avg Total Bases"] || 0).toFixed(2)
                },

                {
                    label: "BB / Game",
                    value: Number(season["Avg Walks"] || 0).toFixed(2)
                },

                {
                    label: "SO / Game",
                    value: Number(season["Avg Strikeouts"] || 0).toFixed(2)
                }

            ]

        },

        {

            title: "Trend Metrics",

            stats: [

                {
                    label: "Consistency",
                    value: trends[0]?.consistency ?? "-"
                },

                {
                    label: "Trend Strength",
                    value: trends[0]?.strength ?? "-"
                },

                {
                    label: "Risk Tier",
                    value: trends[0]?.risk ?? "-"
                }

            ]

        }

    ];

}

const seasonPanels = buildSeasonPanels();

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

    analytics: null

};

return success(player);

    }

    catch (error) {

        console.error(error);

        return serverError(error);

    }

}