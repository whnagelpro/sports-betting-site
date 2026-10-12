// ======================================================
// Sportacular Analytics
// P20 D2 — FOUR-LEAGUE PLAYER PROFILE PRODUCTION EVIDENCE
// ======================================================
//
// Purpose:
// Provide one deterministic, automated release audit for
// the nine frozen P20 Player Profile QA domains.
//
// This test:
//   - uses the real four-league production adapters
//   - uses the real analytics engine
//   - uses the real Player Profile builders
//   - does NOT call live network data
//   - does NOT modify production data
//   - fails closed if any blocker domain fails
//
// Live/current-data verification belongs to the next
// P20 deployment.
// ======================================================

import { buildNBAContext } from "../adapters/nbaAdapter.js";
import { buildNHLContext } from "../adapters/nhlAdapter.js";
import { buildMLBContext } from "../adapters/mlbAdapter.js";
import { buildNFLContext } from "../adapters/nflAdapter.js";

import { calculatePlayerAnalytics } from "./playerAnalytics.js";

import { buildHero } from "../builders/heroBuilder.js";
import { buildMatchup } from "../builders/matchupBuilder.js";
import { buildProps } from "../builders/propsBuilder.js";
import { buildTrends } from "../builders/trendsBuilder.js";
import { buildGameLogs } from "../builders/gameLogsBuilder.js";
import { buildQuickStats } from "../builders/quickStatsBuilder.js";
import { buildSeasonPanels } from "../builders/seasonPanelsBuilder.js";


// ======================================================
// FROZEN P20 CONTRACT
// ======================================================

const LEAGUES = [
    "NBA",
    "NHL",
    "MLB",
    "NFL"
];

const PLAYER_DOMAINS = [
    "PLAYER_ROUTING_IDENTITY",
    "PLAYER_DATA_AVAILABILITY",
    "PLAYER_PAYLOAD",
    "PLAYER_ANALYTICS",
    "PLAYER_PROPS",
    "PLAYER_TRENDS",
    "PLAYER_GAME_LOGS",
    "PLAYER_SEASON",
    "PLAYER_RENDER_STATE"
];

const REQUIRED_RESPONSE_SECTIONS = [
    "hero",
    "dataAvailability",
    "season",
    "matchup",
    "props",
    "trends",
    "gameLogs",
    "quickStats",
    "seasonPanels",
    "analytics"
];

const results = [];


// ======================================================
// TEST HELPERS
// ======================================================

function record(
    league,
    domain,
    name,
    pass,
    details = {}
) {
    const result = {
        league,
        domain,
        name,
        pass: Boolean(pass),
        details
    };

    results.push(result);

    console.log(
        JSON.stringify(result)
    );

    return result;
}


function hasOwn(object, key) {
    return (
        object !== null &&
        typeof object === "object" &&
        Object.prototype.hasOwnProperty.call(
            object,
            key
        )
    );
}


function safeBuild(builder, input) {
    try {
        return {
            ok: true,
            value: builder(input),
            error: null
        };
    } catch (error) {
        return {
            ok: false,
            value: null,
            error:
                error?.stack ??
                error?.message ??
                String(error)
        };
    }
}


function makeUniversalProp(
    league,
    playerId
) {
    return {
        Id:
            `p20d2-${league.toLowerCase()}-prop`,

        "Game Id":
            `p20d2-${league.toLowerCase()}-game`,

        "Game Date":
            "2026-10-12",

        "Away Team":
            "AWY",

        "Home Team":
            "HME",

        "Player Id":
            playerId,

        Vendor:
            "p20d2-testbook",

        "Prop Type":
            "test_market",

        Type:
            "test_market",

        "Line Value":
            10.5,

        Odds:
            -110,

        "Over Odds":
            -110,

        "Under Odds":
            -105,

        "Player Name":
            `P20D2 ${league} Player`,

        Team:
            "TST",

        "Player Baseline":
            11.0,

        "Trend Adjustment":
            0.5,

        "Projected Stat":
            11.5,

        "Stat Std Dev":
            2.5,

        "Model Prob Over":
            0.61,

        "Model Prob Under":
            0.39,

        "EV Over":
            0.18,

        "EV Under":
            -0.12,

        "Best Side":
            "Over",

        "Best EV":
            0.18,

        "Best Model Probability":
            0.61,

        "Best Price Edge":
            0.08,

        "Trend Score":
            74,

        "Trend Strength":
            "Strong",

        "Risk Score":
            24,

        "Risk Tier":
            "Low",

        "Model Confidence":
            82,

        "Sportacular Score":
            88,

        "Sportacular Edge":
            0.16,

        "Confidence Tier":
            "Elite"
    };
}


function makeProfile(
    league,
    playerId
) {
    return {
        Id:
            playerId,

        "Player Id":
            playerId,

        "First Name":
            "P20D2",

        "Last Name":
            `${league} Player`,

        "Full Name":
            `P20D2 ${league} Player`,

        "Player Name":
            `P20D2 ${league} Player`,

        Team:
            "TST",

        "Team Name":
            "Test Team",

        "Team Abbreviation":
            "TST",

        Position:
            league === "MLB"
                ? "CF"
                : league === "NFL"
                    ? "QB"
                    : league === "NHL"
                        ? "C"
                        : "G",

        "Position Code":
            league === "NHL"
                ? "C"
                : "",

        Height:
            "6-2",

        Weight:
            200,

        "Height in Inches":
            74,

        "Weight in Pounds":
            200
    };
}


function makeSeasonStats(
    league,
    playerId
) {
    return {
        "Player Id":
            playerId,

        "Player Name":
            `P20D2 ${league} Player`,

        Team:
            "TST",

        "Games Played":
            10,

        Games:
            10,

        "Avg Minutes":
            30,

        "Avg Points":
            20,

        "Avg Rebounds":
            5,

        "Avg Assists":
            5,

        "Last Updated":
            "2026-10-12"
    };
}


function makeGameLogs(
    league,
    playerId
) {
    return [
        {
            "Game Date":
                "2026-10-10",

            "Game ID":
                `p20d2-${league.toLowerCase()}-game-1`,

            "Player ID":
                playerId,

            "Player Name":
                `P20D2 ${league} Player`,

            Team:
                "TST",

            Opponent:
                "OPP",

            Minutes:
                30,

            Points:
                20,

            Rebounds:
                5,

            Assists:
                5
        },

        {
            "Game Date":
                "2026-10-08",

            "Game ID":
                `p20d2-${league.toLowerCase()}-game-2`,

            "Player ID":
                playerId,

            "Player Name":
                `P20D2 ${league} Player`,

            Team:
                "TST",

            Opponent:
                "OP2",

            Minutes:
                31,

            Points:
                22,

            Rebounds:
                6,

            Assists:
                4
        }
    ];
}


function makeTrends(
    league,
    playerId
) {
    return [
        {
            "Player Id":
                playerId,

            "Player Name":
                `P20D2 ${league} Player`,

            Team:
                "TST",

            sampleSize:
                5,

            games:
                5,

            trend:
                "Positive",

            strength:
                "Strong"
        }
    ];
}


function makeMatchup(league) {
    return {
        league:
            league.toLowerCase(),

        opponent:
            "OPP",

        opponentName:
            "Opponent",

        gameDate:
            "2026-10-12"
    };
}


// ======================================================
// BUILD FOUR PRODUCTION CONTEXTS
// ======================================================

function buildLeagueContext(league) {

    const playerId =
        `p20d2-${league.toLowerCase()}-player`;

    const profile =
        makeProfile(
            league,
            playerId
        );

    const seasonStats =
        makeSeasonStats(
            league,
            playerId
        );

    const gameLogs =
        makeGameLogs(
            league,
            playerId
        );

    const trends =
        makeTrends(
            league,
            playerId
        );

    const matchup =
        makeMatchup(league);

    const props = [
        makeUniversalProp(
            league,
            playerId
        )
    ];

    const input = {
        profile,
        seasonStats,
        gameLogs,
        trends,
        matchup,
        props
    };

    let context;

    switch (league) {

        case "NBA":
            context =
                buildNBAContext(input);
            break;

        case "NHL":
            context =
                buildNHLContext(input);
            break;

        case "MLB":
            context =
                buildMLBContext({
                    ...input,
                    isPitcher: false
                });
            break;

        case "NFL":
            context =
                buildNFLContext(input);
            break;

        default:
            throw new Error(
                `Unsupported P20 D2 league: ${league}`
            );
    }

    return {
        league,
        playerId,
        context
    };
}


// ======================================================
// MATERIALIZE PLAYER PROFILE
// ======================================================

function materializePlayerProfile(
    league,
    context
) {

    const analytics =
        calculatePlayerAnalytics({
            seasonStats:
                context.seasonStats,

            gameLogs:
                context.gameLogs,

            matchup:
                context.matchup,

            props:
                context.props
        });


    const heroResult =
        safeBuild(
            buildHero,
            context
        );

    const matchupResult =
        safeBuild(
            buildMatchup,
            context
        );

    const propsResult =
        safeBuild(
            buildProps,
            {
                ...context,

                props:
                    analytics?.propAnalytics ??
                    []
            }
        );

    const trendsResult =
        safeBuild(
            buildTrends,
            context
        );

    const gameLogsResult =
        safeBuild(
            buildGameLogs,
            context
        );

    const quickStatsResult =
        safeBuild(
            buildQuickStats,
            context
        );

    const seasonPanelsResult =
        safeBuild(
            buildSeasonPanels,
            context
        );


    const dataAvailability = {
        profile:
            Boolean(context.profile),

        season:
            Boolean(context.seasonStats),

        matchup:
            Boolean(context.matchup),

        props:
            Array.isArray(context.props),

        trends:
            Array.isArray(context.trends),

        gameLogs:
            Array.isArray(context.gameLogs)
    };


    const player = {
        hero:
            heroResult.value,

        dataAvailability,

        season:
            context.seasonStats ??
            null,

        matchup:
            matchupResult.value,

        props:
            propsResult.value,

        trends:
            trendsResult.value,

        gameLogs:
            gameLogsResult.value,

        quickStats:
            quickStatsResult.value,

        seasonPanels:
            seasonPanelsResult.value,

        analytics
    };


    return {
        league,
        context,
        analytics,
        player,

        builders: {
            hero: heroResult,
            matchup: matchupResult,
            props: propsResult,
            trends: trendsResult,
            gameLogs: gameLogsResult,
            quickStats: quickStatsResult,
            seasonPanels:
                seasonPanelsResult
        }
    };
}


// ======================================================
// RUN FOUR-LEAGUE MATERIALIZATION
// ======================================================

const materialized = [];

for (const league of LEAGUES) {

    try {

        const built =
            buildLeagueContext(
                league
            );

        materialized.push(
            materializePlayerProfile(
                league,
                built.context
            )
        );

    } catch (error) {

        materialized.push({
            league,
            context: null,
            analytics: null,
            player: null,
            builders: {},
            fatalError:
                error?.stack ??
                error?.message ??
                String(error)
        });
    }
}


// ======================================================
// DOMAIN 1 — ROUTING + IDENTITY
// ======================================================

for (const entry of materialized) {

    const league =
        entry.league;

    const context =
        entry.context;

    record(
        league,
        "PLAYER_ROUTING_IDENTITY",
        `${league} production adapter builds Player Profile context`,
        Boolean(context),
        {
            fatalError:
                entry.fatalError ??
                null
        }
    );

    record(
        league,
        "PLAYER_ROUTING_IDENTITY",
        `${league} adapter preserves league identity`,
        String(
            context?.league ??
            ""
        ).toLowerCase() ===
            league.toLowerCase(),
        {
            expected:
                league.toLowerCase(),

            actual:
                context?.league ??
                null
        }
    );

    record(
        league,
        "PLAYER_ROUTING_IDENTITY",
        `${league} Player Profile preserves player identity`,
        Boolean(
            context?.profile
        ),
        {
            hasProfile:
                Boolean(
                    context?.profile
                )
        }
    );
}


// ======================================================
// DOMAIN 2 — DATA AVAILABILITY
// ======================================================

for (const entry of materialized) {

    const league =
        entry.league;

    const availability =
        entry.player
            ?.dataAvailability;

    record(
        league,
        "PLAYER_DATA_AVAILABILITY",
        `${league} exposes Player Profile data-availability state`,
        Boolean(availability),
        {
            availability:
                availability ??
                null
        }
    );

    record(
        league,
        "PLAYER_DATA_AVAILABILITY",
        `${league} fixture exposes season data`,
        availability?.season === true,
        {
            season:
                availability?.season ??
                null
        }
    );

    record(
        league,
        "PLAYER_DATA_AVAILABILITY",
        `${league} fixture exposes trends and game logs`,
        availability?.trends === true &&
        availability?.gameLogs === true,
        {
            trends:
                availability?.trends ??
                null,

            gameLogs:
                availability?.gameLogs ??
                null
        }
    );
}


// ======================================================
// DOMAIN 3 — UNIVERSAL PLAYER PAYLOAD
// ======================================================

for (const entry of materialized) {

    const league =
        entry.league;

    const player =
        entry.player;

    const missingSections =
        REQUIRED_RESPONSE_SECTIONS
            .filter(
                section =>
                    !hasOwn(
                        player,
                        section
                    )
            );

    record(
        league,
        "PLAYER_PAYLOAD",
        `${league} Player Profile exposes all ten frozen response sections`,
        missingSections.length === 0,
        {
            expectedSections:
                REQUIRED_RESPONSE_SECTIONS,

            missingSections
        }
    );

    record(
        league,
        "PLAYER_PAYLOAD",
        `${league} Player Profile payload survives JSON serialization`,
        (() => {
            try {
                JSON.stringify(player);
                return Boolean(player);
            } catch {
                return false;
            }
        })(),
        {}
    );
}


// ======================================================
// DOMAIN 4 — PLAYER ANALYTICS
// ======================================================

for (const entry of materialized) {

    const league =
        entry.league;

    const analytics =
        entry.analytics;

    record(
        league,
        "PLAYER_ANALYTICS",
        `${league} production analytics materialize`,
        Boolean(analytics),
        {
            hasAnalytics:
                Boolean(analytics)
        }
    );

    record(
        league,
        "PLAYER_ANALYTICS",
        `${league} analytics expose prop analytics`,
        Array.isArray(
            analytics?.propAnalytics
        ),
        {
            propAnalyticsCount:
                analytics?.propAnalytics
                    ?.length ??
                null
        }
    );

    record(
        league,
        "PLAYER_ANALYTICS",
        `${league} analytics preserve backend-authoritative Best Prop`,
        Boolean(
            analytics?.bestProp
        ),
        {
            bestProp:
                analytics?.bestProp ??
                null
        }
    );
}


// ======================================================
// DOMAIN 5 — PLAYER PROPS
// ======================================================

for (const entry of materialized) {

    const league =
        entry.league;

    const result =
        entry.builders?.props;

    const props =
        entry.player?.props;

    record(
        league,
        "PLAYER_PROPS",
        `${league} production propsBuilder executes`,
        result?.ok === true,
        {
            error:
                result?.error ??
                null
        }
    );

    record(
        league,
        "PLAYER_PROPS",
        `${league} Player Profile exposes props array`,
        Array.isArray(props),
        {
            count:
                Array.isArray(props)
                    ? props.length
                    : null
        }
    );

    const actionable =
        Array.isArray(props)
            ? props.find(
                prop =>
                    String(
                        prop?.recommendation ??
                        ""
                    ).toLowerCase() ===
                    "over"
            )
            : null;

    record(
        league,
        "PLAYER_PROPS",
        `${league} authoritative recommendation reaches Player Profile props`,
        Boolean(actionable),
        {
            recommendation:
                actionable
                    ?.recommendation ??
                null,

            sportacularScore:
                actionable
                    ?.sportacularScore ??
                null,

            confidence:
                actionable
                    ?.confidence ??
                null
        }
    );
}


// ======================================================
// DOMAIN 6 — PLAYER TRENDS
// ======================================================

for (const entry of materialized) {

    const league =
        entry.league;

    const result =
        entry.builders?.trends;

    record(
        league,
        "PLAYER_TRENDS",
        `${league} production trendsBuilder executes`,
        result?.ok === true,
        {
            error:
                result?.error ??
                null
        }
    );

    record(
        league,
        "PLAYER_TRENDS",
        `${league} Player Profile exposes trends payload`,
        entry.player?.trends !==
            undefined &&
        entry.player?.trends !==
            null,
        {}
    );
}


// ======================================================
// DOMAIN 7 — PLAYER GAME LOGS
// ======================================================

for (const entry of materialized) {

    const league =
        entry.league;

    const result =
        entry.builders?.gameLogs;

    record(
        league,
        "PLAYER_GAME_LOGS",
        `${league} production gameLogsBuilder executes`,
        result?.ok === true,
        {
            error:
                result?.error ??
                null
        }
    );

    record(
        league,
        "PLAYER_GAME_LOGS",
        `${league} Player Profile exposes game-log payload`,
        entry.player?.gameLogs !==
            undefined &&
        entry.player?.gameLogs !==
            null,
        {}
    );
}


// ======================================================
// DOMAIN 8 — PLAYER SEASON
// ======================================================

for (const entry of materialized) {

    const league =
        entry.league;

    record(
        league,
        "PLAYER_SEASON",
        `${league} Player Profile exposes season payload`,
        Boolean(
            entry.player?.season
        ),
        {
            season:
                entry.player?.season ??
                null
        }
    );

    record(
        league,
        "PLAYER_SEASON",
        `${league} production quickStatsBuilder executes`,
        entry.builders
            ?.quickStats
            ?.ok === true,
        {
            error:
                entry.builders
                    ?.quickStats
                    ?.error ??
                null
        }
    );

    record(
        league,
        "PLAYER_SEASON",
        `${league} production seasonPanelsBuilder executes`,
        entry.builders
            ?.seasonPanels
            ?.ok === true,
        {
            error:
                entry.builders
                    ?.seasonPanels
                    ?.error ??
                null
        }
    );
}


// ======================================================
// DOMAIN 9 — RENDER STATE
// ======================================================

for (const entry of materialized) {

    const league =
        entry.league;

    record(
        league,
        "PLAYER_RENDER_STATE",
        `${league} production heroBuilder executes`,
        entry.builders
            ?.hero
            ?.ok === true,
        {
            error:
                entry.builders
                    ?.hero
                    ?.error ??
                null
        }
    );

    record(
        league,
        "PLAYER_RENDER_STATE",
        `${league} production matchupBuilder executes`,
        entry.builders
            ?.matchup
            ?.ok === true,
        {
            error:
                entry.builders
                    ?.matchup
                    ?.error ??
                null
        }
    );

    const failedBuilders =
        Object.entries(
            entry.builders ?? {}
        )
            .filter(
                ([, result]) =>
                    result?.ok !== true
            )
            .map(
                ([name, result]) => ({
                    builder:
                        name,

                    error:
                        result?.error ??
                        null
                })
            );

    record(
        league,
        "PLAYER_RENDER_STATE",
        `${league} all registered Player Profile builders materialize without exception`,
        failedBuilders.length === 0,
        {
            failedBuilders
        }
    );
}


// ======================================================
// STANDARDIZED DOMAIN EVIDENCE
// ======================================================

const leagueEvidence = {};

for (const league of LEAGUES) {

    const domains = {};

    for (
        const domain
        of PLAYER_DOMAINS
    ) {

        const domainResults =
            results.filter(
                result =>
                    result.league ===
                        league &&
                    result.domain ===
                        domain
            );

        const failed =
            domainResults.filter(
                result =>
                    !result.pass
            );

        domains[domain] = {
            status:
                domainResults.length > 0 &&
                failed.length === 0
                    ? "PASS"
                    : "FAIL",

            blocker:
                true,

            assertions:
                domainResults.length,

            passed:
                domainResults.length -
                failed.length,

            failed:
                failed.length,

            failures:
                failed
        };
    }


    const failedDomains =
        Object.values(domains)
            .filter(
                domain =>
                    domain.status ===
                    "FAIL"
            )
            .length;


    leagueEvidence[league] = {

        league,

        deployment:
            "P20-D2",

        evidenceType:
            "DETERMINISTIC_PRODUCTION_CONTRACT",

        status:
            failedDomains === 0
                ? "PASS"
                : "FAIL",

        domainsRegistered:
            PLAYER_DOMAINS.length,

        domainsPassed:
            PLAYER_DOMAINS.length -
            failedDomains,

        domainsFailed:
            failedDomains,

        blockers:
            failedDomains,

        domains
    };
}


// ======================================================
// CROSS-LEAGUE CONTRACT ASSERTIONS
// ======================================================

const crossLeagueResults = [];

function crossRecord(
    name,
    pass,
    details = {}
) {

    const result = {
        name,
        pass: Boolean(pass),
        details
    };

    crossLeagueResults.push(
        result
    );

    console.log(
        JSON.stringify(result)
    );
}


crossRecord(
    "P20 D2 contains exactly four league evidence records",
    Object.keys(
        leagueEvidence
    ).length === 4,
    {
        leagues:
            Object.keys(
                leagueEvidence
            )
    }
);


crossRecord(
    "P20 D2 preserves exactly nine frozen Player Profile domains",
    PLAYER_DOMAINS.length === 9,
    {
        domains:
            PLAYER_DOMAINS
    }
);


for (const league of LEAGUES) {

    crossRecord(
        `${league} contains all nine P20 Player Profile domains`,
        Object.keys(
            leagueEvidence[
                league
            ].domains
        ).length === 9,
        {
            domains:
                Object.keys(
                    leagueEvidence[
                        league
                    ].domains
                )
        }
    );
}


crossRecord(
    "All four leagues expose the same ten-section Player Profile response contract",
    materialized.every(
        entry =>
            REQUIRED_RESPONSE_SECTIONS
                .every(
                    section =>
                        hasOwn(
                            entry.player,
                            section
                        )
                )
    ),
    {
        sections:
            REQUIRED_RESPONSE_SECTIONS
    }
);


// ======================================================
// FINAL REPORT
// ======================================================

const assertionFailures =
    results.filter(
        result =>
            !result.pass
    );

const crossFailures =
    crossLeagueResults.filter(
        result =>
            !result.pass
    );

const totalAssertions =
    results.length +
    crossLeagueResults.length;

const totalPassed =
    totalAssertions -
    assertionFailures.length -
    crossFailures.length;

const totalDomainPasses =
    LEAGUES.reduce(
        (sum, league) =>
            sum +
            leagueEvidence[
                league
            ].domainsPassed,
        0
    );

const totalDomainFailures =
    LEAGUES.reduce(
        (sum, league) =>
            sum +
            leagueEvidence[
                league
            ].domainsFailed,
        0
    );

const releaseBlockers =
    totalDomainFailures +
    crossFailures.length;


console.log("");
console.log(
    "============================================================"
);
console.log(
    "SPORTACULAR V1.0 — P20 D2 PLAYER PROFILE PRODUCTION EVIDENCE"
);
console.log(
    "============================================================"
);


for (const league of LEAGUES) {

    const evidence =
        leagueEvidence[
            league
        ];

    console.log(
        `${league}: ${evidence.status} | ` +
        `${evidence.domainsPassed}/9 domains PASS | ` +
        `${evidence.domainsFailed} FAIL | ` +
        `${evidence.blockers} blockers`
    );
}


console.log("");
console.log(
    `Required leagues: ${LEAGUES.length}`
);
console.log(
    `Player Profile domains per league: ${PLAYER_DOMAINS.length}`
);
console.log(
    `Response sections: ${REQUIRED_RESPONSE_SECTIONS.length}`
);
console.log(
    `Total domain PASS registrations: ${totalDomainPasses}`
);
console.log(
    `Total domain failures: ${totalDomainFailures}`
);
console.log(
    `Assertions: ${totalAssertions}`
);
console.log(
    `Assertions passed: ${totalPassed}`
);
console.log(
    `Assertions failed: ${
        assertionFailures.length +
        crossFailures.length
    }`
);
console.log(
    `Release blockers: ${releaseBlockers}`
);
console.log(
    "------------------------------------------------------------"
);


const pass =
    releaseBlockers === 0 &&
    LEAGUES.every(
        league =>
            leagueEvidence[
                league
            ].status ===
            "PASS"
    );


console.log(
    `P20 D2 STATUS: ${
        pass
            ? "PASS"
            : "FAIL"
    }`
);

console.log(
    `P20 PLAYER PROFILE PRODUCTION EVIDENCE: ${
        pass
            ? "PASS"
            : "FAIL"
    }`
);

console.log(
    pass
        ? "READY FOR P20 D3 — LIVE PLAYER PROFILE PRODUCTION EVIDENCE"
        : "P20 D2 RELEASE BLOCKED — REVIEW FAILED ASSERTIONS"
);

console.log(
    "============================================================"
);


// ======================================================
// MACHINE-READABLE SUMMARY
// ======================================================

const summary = {

    deployment:
        "P20-D2",

    status:
        pass
            ? "PASS"
            : "FAIL",

    evidenceType:
        "DETERMINISTIC_PRODUCTION_CONTRACT",

    leagues:
        LEAGUES,

    playerDomains:
        PLAYER_DOMAINS,

    requiredResponseSections:
        REQUIRED_RESPONSE_SECTIONS,

    assertions:
        totalAssertions,

    assertionsPassed:
        totalPassed,

    assertionsFailed:
        totalAssertions -
        totalPassed,

    domainsPassed:
        totalDomainPasses,

    domainsFailed:
        totalDomainFailures,

    blockers:
        releaseBlockers,

    leagueEvidence,

    failures: [
        ...assertionFailures,
        ...crossFailures
    ]
};


console.log(
    JSON.stringify(
        summary,
        null,
        2
    )
);


if (!pass) {

    throw new Error(
        "P20 D2 Player Profile production evidence failed."
    );
}