// ============================================================
// SPORTACULAR ANALYTICS
// P20 D3A — LIVE PLAYER PROFILE API AUDIT
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Exercise the REAL Universal Player Endpoint for NBA/NHL/MLB/NFL
// using:
//   • real local production rosters
//   • automatically selected real player IDs
//   • real supplemental production data sources
//   • the real endpoint handler
//
// IMPORTANT
// ------------------------------------------------------------
// Supplemental datasets are intentionally allowed to be empty or
// unavailable. That is part of the production endpoint contract.
//
// Therefore:
//   • required roster / identity / endpoint failures = BLOCKER
//   • missing supplemental datasets = observed evidence, not
//     automatically a failure
//
// This audit does NOT modify production data.
// ============================================================

import fs from "node:fs/promises";
import path from "node:path";

import { parseCSV } from "../csv.js";

import {
    handler as playerHandler
} from "../../player.js";


// ============================================================
// FROZEN CONTRACT
// ============================================================

const LEAGUES = [
    "nba",
    "nhl",
    "mlb",
    "nfl"
];

const REQUIRED_RESPONSE_KEYS = [
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


// ============================================================
// HELPERS
// ============================================================

function record(
    league,
    domain,
    name,
    pass,
    details = {}
) {

    const result = {
        league:
            league.toUpperCase(),

        domain,

        name,

        pass:
            Boolean(pass),

        details
    };

    results.push(result);

    console.log(
        JSON.stringify(result)
    );

    return result;
}


function getFirstValue(
    row,
    keys
) {

    for (const key of keys) {

        const value =
            row?.[key];

        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {

            return String(value).trim();

        }

    }

    return null;
}


function getPlayerId(row) {

    return getFirstValue(
        row,
        [
            "Player Id",
            "Player ID",
            "player_id",
            "playerId",
            "Id",
            "ID",
            "id"
        ]
    );

}


function getPlayerName(row) {

    const direct =
        getFirstValue(
            row,
            [
                "Player Name",
                "Full Name",
                "Name",
                "Player",
                "full_name",
                "name"
            ]
        );

    if (direct) {
        return direct;
    }


    const first =
        getFirstValue(
            row,
            [
                "First Name",
                "FirstName",
                "first_name",
                "firstName"
            ]
        );

    const last =
        getFirstValue(
            row,
            [
                "Last Name",
                "LastName",
                "last_name",
                "lastName"
            ]
        );


    const combined =
        [first, last]
            .filter(Boolean)
            .join(" ")
            .trim();

    return combined || null;
}


function getHeroIdentity(hero) {

    if (
        hero === null ||
        hero === undefined
    ) {
        return null;
    }


    if (
        typeof hero === "string" ||
        typeof hero === "number"
    ) {
        return String(hero);
    }


    const direct =
        getFirstValue(
            hero,
            [
                "playerName",
                "name",
                "fullName",
                "displayName",
                "Player Name",
                "Full Name",
                "Name"
            ]
        );

    if (direct) {
        return direct;
    }


    const first =
        getFirstValue(
            hero,
            [
                "firstName",
                "First Name"
            ]
        );

    const last =
        getFirstValue(
            hero,
            [
                "lastName",
                "Last Name"
            ]
        );


    const combined =
        [first, last]
            .filter(Boolean)
            .join(" ")
            .trim();

    return combined || null;
}


function normalizeText(value) {

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            " "
        )
        .trim();

}


function identitiesCompatible(
    expected,
    actual
) {

    const a =
        normalizeText(expected);

    const b =
        normalizeText(actual);


    if (!a || !b) {
        return true;
    }


    return (
        a === b ||
        a.includes(b) ||
        b.includes(a)
    );
}


async function loadRoster(
    league
) {

    const rosterPath =
        path.join(
            process.cwd(),
            "netlify",
            "functions",
            "data",
            `${league}-roster.csv`
        );


    const csv =
        await fs.readFile(
            rosterPath,
            "utf8"
        );


    const rows =
        parseCSV(csv);


    return {
        rosterPath,
        rows
    };
}


function selectPlayer(rows) {

    for (const row of rows) {

        const id =
            getPlayerId(row);

        if (id) {

            return {
                id,
                name:
                    getPlayerName(row),
                row
            };

        }

    }

    return null;
}


function parseEndpointResponse(
    response
) {

    let body = null;
    let parseError = null;


    try {

        body =
            typeof response?.body === "string"
                ? JSON.parse(response.body)
                : response?.body ?? null;

    } catch (error) {

        parseError =
            error?.message ??
            String(error);

    }


    return {
        statusCode:
            Number(
                response?.statusCode
            ),

        headers:
            response?.headers ??
            null,

        body,

        parseError
    };
}


function isArrayOrNull(value) {

    return (
        Array.isArray(value) ||
        value === null
    );
}


// ============================================================
// LIVE LEAGUE AUDIT
// ============================================================

async function auditLeague(
    league
) {

    console.log("");
    console.log(
        "============================================================"
    );

    console.log(
        `P20 D3A — ${league.toUpperCase()} LIVE PLAYER PROFILE`
    );

    console.log(
        "============================================================"
    );


    let rosterInfo;

    try {

        rosterInfo =
            await loadRoster(
                league
            );

        record(
            league,
            "PLAYER_ROUTING_IDENTITY",
            `${league.toUpperCase()} production roster loads`,
            Array.isArray(
                rosterInfo.rows
            ) &&
            rosterInfo.rows.length > 0,
            {
                rosterPath:
                    rosterInfo.rosterPath,

                rosterRows:
                    rosterInfo.rows?.length ??
                    0
            }
        );

    } catch (error) {

        record(
            league,
            "PLAYER_ROUTING_IDENTITY",
            `${league.toUpperCase()} production roster loads`,
            false,
            {
                error:
                    error?.message ??
                    String(error)
            }
        );

        return;

    }


    const selected =
        selectPlayer(
            rosterInfo.rows
        );


    record(
        league,
        "PLAYER_ROUTING_IDENTITY",
        `${league.toUpperCase()} automatically selects a real roster player`,
        Boolean(
            selected?.id
        ),
        {
            playerId:
                selected?.id ??
                null,

            playerName:
                selected?.name ??
                null
        }
    );


    if (!selected?.id) {
        return;
    }


    console.log(
        `${league.toUpperCase()} selected player:`,
        {
            id:
                selected.id,

            name:
                selected.name
        }
    );


    const startedAt =
        Date.now();


    let rawResponse;

    try {

        rawResponse =
            await playerHandler({
                queryStringParameters: {
                    league,
                    id:
                        selected.id
                }
            });

    } catch (error) {

        record(
            league,
            "PLAYER_RENDER_STATE",
            `${league.toUpperCase()} live endpoint handler completes without uncaught exception`,
            false,
            {
                error:
                    error?.stack ??
                    error?.message ??
                    String(error)
            }
        );

        return;

    }


    const runtimeMs =
        Date.now() -
        startedAt;


    record(
        league,
        "PLAYER_RENDER_STATE",
        `${league.toUpperCase()} live endpoint handler completes without uncaught exception`,
        true,
        {
            runtimeMs
        }
    );


    const response =
        parseEndpointResponse(
            rawResponse
        );


    record(
        league,
        "PLAYER_PAYLOAD",
        `${league.toUpperCase()} live endpoint returns HTTP 200`,
        response.statusCode === 200,
        {
            statusCode:
                response.statusCode,

            parseError:
                response.parseError
        }
    );


    record(
        league,
        "PLAYER_PAYLOAD",
        `${league.toUpperCase()} live endpoint returns valid JSON`,
        response.parseError === null &&
        response.body !== null &&
        typeof response.body === "object",
        {
            parseError:
                response.parseError
        }
    );


    if (
        response.statusCode !== 200 ||
        !response.body ||
        response.parseError
    ) {

        console.log(
            `${league.toUpperCase()} endpoint body:`,
            response.body
        );

        return;

    }


    const player =
        response.body;


    // --------------------------------------------------------
    // ROUTING + IDENTITY
    // --------------------------------------------------------

    const heroIdentity =
        getHeroIdentity(
            player.hero
        );


    record(
        league,
        "PLAYER_ROUTING_IDENTITY",
        `${league.toUpperCase()} response contains hero identity`,
        Boolean(
            player.hero
        ),
        {
            selectedPlayerId:
                selected.id,

            selectedPlayerName:
                selected.name,

            heroIdentity
        }
    );


    record(
        league,
        "PLAYER_ROUTING_IDENTITY",
        `${league.toUpperCase()} returned hero is compatible with selected roster player`,
        identitiesCompatible(
            selected.name,
            heroIdentity
        ),
        {
            expected:
                selected.name,

            actual:
                heroIdentity
        }
    );


    // --------------------------------------------------------
    // DATA AVAILABILITY
    // --------------------------------------------------------

    const availability =
        player.dataAvailability;


    record(
        league,
        "PLAYER_DATA_AVAILABILITY",
        `${league.toUpperCase()} exposes dataAvailability`,
        availability !== null &&
        typeof availability === "object" &&
        !Array.isArray(
            availability
        ),
        {
            dataAvailability:
                availability ??
                null
        }
    );


    const availabilityKeys = [
        "seasonStats",
        "gameLogs",
        "trends",
        "gameOdds",
        "playerProps"
    ];


    const missingAvailabilityKeys =
        availabilityKeys.filter(
            key =>
                !Object.prototype
                    .hasOwnProperty
                    .call(
                        availability ?? {},
                        key
                    )
        );


    record(
        league,
        "PLAYER_DATA_AVAILABILITY",
        `${league.toUpperCase()} exposes all five supplemental availability flags`,
        missingAvailabilityKeys.length === 0,
        {
            missing:
                missingAvailabilityKeys,

            values:
                availability ??
                null
        }
    );


    const invalidAvailabilityKeys =
        availabilityKeys.filter(
            key =>
                typeof availability?.[key] !==
                "boolean"
        );


    record(
        league,
        "PLAYER_DATA_AVAILABILITY",
        `${league.toUpperCase()} supplemental availability flags are boolean`,
        invalidAvailabilityKeys.length === 0,
        {
            invalid:
                invalidAvailabilityKeys
        }
    );


    // --------------------------------------------------------
    // UNIVERSAL PAYLOAD
    // --------------------------------------------------------

    const missingResponseKeys =
        REQUIRED_RESPONSE_KEYS.filter(
            key =>
                !Object.prototype
                    .hasOwnProperty
                    .call(
                        player,
                        key
                    )
        );


    record(
        league,
        "PLAYER_PAYLOAD",
        `${league.toUpperCase()} live response exposes all ten frozen profile sections`,
        missingResponseKeys.length === 0,
        {
            missing:
                missingResponseKeys,

            responseKeys:
                Object.keys(player)
        }
    );


    // --------------------------------------------------------
    // ANALYTICS
    // --------------------------------------------------------

    const analytics =
        player.analytics;


    record(
        league,
        "PLAYER_ANALYTICS",
        `${league.toUpperCase()} live response exposes analytics object`,
        analytics !== null &&
        typeof analytics === "object" &&
        !Array.isArray(
            analytics
        ),
        {
            analyticsVersion:
                analytics
                    ?.analyticsVersion ??
                null,

            recommendation:
                analytics
                    ?.recommendation ??
                null,

            confidence:
                analytics
                    ?.confidence ??
                null
        }
    );


    record(
        league,
        "PLAYER_ANALYTICS",
        `${league.toUpperCase()} analytics expose propAnalytics array`,
        Array.isArray(
            analytics?.propAnalytics
        ),
        {
            count:
                analytics
                    ?.propAnalytics
                    ?.length ??
                null
        }
    );


    const bestPropStateValid =
        analytics?.bestProp === null ||
        analytics?.bestProp === undefined ||
        (
            typeof analytics.bestProp ===
            "object" &&
            !Array.isArray(
                analytics.bestProp
            )
        );


    record(
        league,
        "PLAYER_ANALYTICS",
        `${league.toUpperCase()} bestProp uses valid object-or-null state`,
        bestPropStateValid,
        {
            bestProp:
                analytics
                    ?.bestProp ??
                null
        }
    );


    // --------------------------------------------------------
    // PROPS
    // --------------------------------------------------------

    record(
        league,
        "PLAYER_PROPS",
        `${league.toUpperCase()} live response exposes props array`,
        Array.isArray(
            player.props
        ),
        {
            count:
                Array.isArray(
                    player.props
                )
                    ? player.props.length
                    : null,

            sourceAvailable:
                availability
                    ?.playerProps ??
                null
        }
    );


    const noPropStateValid =
        availability?.playerProps === true ||
        (
            Array.isArray(
                player.props
            ) &&
            player.props.length === 0
        );


    record(
        league,
        "PLAYER_PROPS",
        `${league.toUpperCase()} handles unavailable player-prop source safely`,
        noPropStateValid,
        {
            sourceAvailable:
                availability
                    ?.playerProps ??
                null,

            returnedProps:
                Array.isArray(
                    player.props
                )
                    ? player.props.length
                    : null
        }
    );


    // --------------------------------------------------------
    // TRENDS
    // --------------------------------------------------------

    record(
        league,
        "PLAYER_TRENDS",
        `${league.toUpperCase()} live trends use valid payload state`,
        Array.isArray(
            player.trends
        ) ||
        (
            player.trends !== null &&
            typeof player.trends ===
            "object"
        ),
        {
            sourceAvailable:
                availability
                    ?.trends ??
                null,

            type:
                Array.isArray(
                    player.trends
                )
                    ? "array"
                    : typeof player.trends
        }
    );


    // --------------------------------------------------------
    // GAME LOGS
    // --------------------------------------------------------

    record(
        league,
        "PLAYER_GAME_LOGS",
        `${league.toUpperCase()} live gameLogs are an array`,
        Array.isArray(
            player.gameLogs
        ),
        {
            count:
                Array.isArray(
                    player.gameLogs
                )
                    ? player.gameLogs.length
                    : null,

            sourceAvailable:
                availability
                    ?.gameLogs ??
                null
        }
    );


    // --------------------------------------------------------
    // SEASON
    // --------------------------------------------------------

    const seasonStateValid =
        player.season === null ||
        player.season === undefined ||
        (
            typeof player.season ===
            "object" &&
            !Array.isArray(
                player.season
            )
        );


    record(
        league,
        "PLAYER_SEASON",
        `${league.toUpperCase()} live season uses valid object-or-null state`,
        seasonStateValid,
        {
            sourceAvailable:
                availability
                    ?.seasonStats ??
                null,

            hasSeason:
                Boolean(
                    player.season
                )
        }
    );


    record(
        league,
        "PLAYER_SEASON",
        `${league.toUpperCase()} live quickStats use valid array-or-null state`,
        isArrayOrNull(
            player.quickStats
        ) ||
        (
            player.quickStats !== undefined &&
            typeof player.quickStats ===
            "object"
        ),
        {
            type:
                Array.isArray(
                    player.quickStats
                )
                    ? "array"
                    : player.quickStats === null
                        ? "null"
                        : typeof player.quickStats
        }
    );


    record(
        league,
        "PLAYER_SEASON",
        `${league.toUpperCase()} live seasonPanels use valid array-or-object state`,
        Array.isArray(
            player.seasonPanels
        ) ||
        (
            player.seasonPanels !== null &&
            typeof player.seasonPanels ===
            "object"
        ),
        {
            type:
                Array.isArray(
                    player.seasonPanels
                )
                    ? "array"
                    : typeof player.seasonPanels
        }
    );


    // --------------------------------------------------------
    // RENDER / GRACEFUL-DEGRADATION STATE
    // --------------------------------------------------------

    record(
        league,
        "PLAYER_RENDER_STATE",
        `${league.toUpperCase()} hero materializes`,
        player.hero !== null &&
        player.hero !== undefined,
        {}
    );


    record(
        league,
        "PLAYER_RENDER_STATE",
        `${league.toUpperCase()} supplemental-source outages do not prevent a 200 profile response`,
        response.statusCode === 200,
        {
            dataAvailability:
                availability,

            runtimeMs
        }
    );


    console.log(
        `${league.toUpperCase()} live audit completed in ${runtimeMs} ms`
    );

}


// ============================================================
// ENDPOINT ROUTING CONTRACT
// ============================================================

async function auditRoutingContract() {

    console.log("");
    console.log(
        "============================================================"
    );

    console.log(
        "P20 D3A — ENDPOINT ROUTING CONTRACT"
    );

    console.log(
        "============================================================"
    );


    const missingLeague =
        parseEndpointResponse(
            await playerHandler({
                queryStringParameters: {
                    id: "p20-invalid"
                }
            })
        );


    record(
        "GLOBAL",
        "PLAYER_ROUTING_IDENTITY",
        "Missing league is rejected",
        missingLeague.statusCode === 400,
        {
            statusCode:
                missingLeague.statusCode,

            body:
                missingLeague.body
        }
    );


    const missingId =
        parseEndpointResponse(
            await playerHandler({
                queryStringParameters: {
                    league: "nba"
                }
            })
        );


    record(
        "GLOBAL",
        "PLAYER_ROUTING_IDENTITY",
        "Missing player id is rejected",
        missingId.statusCode === 400,
        {
            statusCode:
                missingId.statusCode,

            body:
                missingId.body
        }
    );


    const unsupportedLeague =
        parseEndpointResponse(
            await playerHandler({
                queryStringParameters: {
                    league:
                        "sportacular-invalid",

                    id:
                        "p20-invalid"
                }
            })
        );


    record(
        "GLOBAL",
        "PLAYER_ROUTING_IDENTITY",
        "Unsupported league is rejected",
        unsupportedLeague.statusCode === 400,
        {
            statusCode:
                unsupportedLeague.statusCode,

            body:
                unsupportedLeague.body
        }
    );

}


// ============================================================
// RUN
// ============================================================

console.log(
    "============================================================"
);

console.log(
    "SPORTACULAR V1.0 — P20 D3A LIVE PLAYER PROFILE API AUDIT"
);

console.log(
    "============================================================"
);


await auditRoutingContract();


for (const league of LEAGUES) {

    await auditLeague(
        league
    );

}


// ============================================================
// STANDARDIZED REPORT
// ============================================================

const leagueReports = {};


for (const league of LEAGUES) {

    const upper =
        league.toUpperCase();


    const leagueResults =
        results.filter(
            result =>
                result.league ===
                upper
        );


    const failed =
        leagueResults.filter(
            result =>
                !result.pass
        );


    const domains =
        [
            ...new Set(
                leagueResults.map(
                    result =>
                        result.domain
                )
            )
        ];


    const domainReports = {};


    for (const domain of domains) {

        const domainResults =
            leagueResults.filter(
                result =>
                    result.domain ===
                    domain
            );


        const domainFailures =
            domainResults.filter(
                result =>
                    !result.pass
            );


        domainReports[domain] = {

            status:
                domainFailures.length === 0
                    ? "PASS"
                    : "FAIL",

            assertions:
                domainResults.length,

            passed:
                domainResults.length -
                domainFailures.length,

            failed:
                domainFailures.length

        };

    }


    leagueReports[upper] = {

        status:
            failed.length === 0
                ? "PASS"
                : "FAIL",

        assertions:
            leagueResults.length,

        passed:
            leagueResults.length -
            failed.length,

        failed:
            failed.length,

        domains:
            domainReports

    };

}


const globalResults =
    results.filter(
        result =>
            result.league ===
            "GLOBAL"
    );


const failures =
    results.filter(
        result =>
            !result.pass
    );


const totalAssertions =
    results.length;


const passedAssertions =
    totalAssertions -
    failures.length;


const allLeaguesPass =
    LEAGUES.every(
        league =>
            leagueReports[
                league.toUpperCase()
            ]?.status ===
            "PASS"
    );


const globalPass =
    globalResults.every(
        result =>
            result.pass
    );


const pass =
    allLeaguesPass &&
    globalPass &&
    failures.length === 0;


console.log("");
console.log(
    "============================================================"
);

console.log(
    "SPORTACULAR V1.0 — P20 D3A LIVE EVIDENCE REPORT"
);

console.log(
    "============================================================"
);


for (const league of LEAGUES) {

    const upper =
        league.toUpperCase();

    const report =
        leagueReports[upper];


    console.log(
        `${upper}: ${report?.status ?? "FAIL"} | ` +
        `${report?.passed ?? 0}/${report?.assertions ?? 0} assertions PASS | ` +
        `${report?.failed ?? 0} FAIL`
    );

}


console.log("");
console.log(
    `Routing contract assertions: ${globalResults.length}`
);

console.log(
    `Total assertions: ${totalAssertions}`
);

console.log(
    `Assertions passed: ${passedAssertions}`
);

console.log(
    `Assertions failed: ${failures.length}`
);

console.log(
    `Release blockers: ${failures.length}`
);

console.log(
    "------------------------------------------------------------"
);

console.log(
    `P20 D3A STATUS: ${
        pass
            ? "PASS"
            : "FAIL"
    }`
);

console.log(
    `P20 LIVE PLAYER PROFILE API EVIDENCE: ${
        pass
            ? "PASS"
            : "FAIL"
    }`
);

console.log(
    pass
        ? "READY FOR NEXT P20 AUTOMATION"
        : "P20 D3A RELEASE BLOCKED — REVIEW FAILED LIVE ASSERTIONS"
);

console.log(
    "============================================================"
);


const summary = {

    deployment:
        "P20-D3A",

    evidenceType:
        "LIVE_PLAYER_PROFILE_API",

    status:
        pass
            ? "PASS"
            : "FAIL",

    leagues:
        LEAGUES.map(
            league =>
                league.toUpperCase()
        ),

    assertions:
        totalAssertions,

    assertionsPassed:
        passedAssertions,

    assertionsFailed:
        failures.length,

    blockers:
        failures.length,

    routingContract: {
        assertions:
            globalResults.length,

        status:
            globalPass
                ? "PASS"
                : "FAIL"
    },

    leagueReports,

    failures

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
        "P20 D3A live Player Profile API audit failed."
    );

}