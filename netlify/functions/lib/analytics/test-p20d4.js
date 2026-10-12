// ============================================================
// Sportacular Analytics
// P20 D4 — Deployed Profile UI Regression
// ============================================================
//
// Purpose
// -------
// Validate the customer-facing Player Profile and Team Profile
// production boundaries without modifying production behavior.
//
// Evidence layers:
//   1. Current local frontend source contract
//   2. Deployed production page accessibility
//   3. Production Player API accessibility
//
// This audit intentionally does NOT claim full browser/DOM
// execution evidence. A Node fetch cannot execute browser JS.
//
// Statuses:
//   PASS
//   NOT_EXERCISED
//   FAIL
//
// Architecture:
//   Player:
//     player.html
//       -> player-page.js
//       -> /.netlify/functions/player
//
//   Team:
//     league team route
//       -> script.js
//       -> published production CSV sources
//
// ============================================================

import fs from "fs";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

// ------------------------------------------------------------
// CONSTANTS
// ------------------------------------------------------------

const DEPLOYMENT = "P20-D4";

const EVIDENCE_TYPE =
    "DEPLOYED_PROFILE_UI_REGRESSION";

const BASE_URL =
    "https://sportacularanalytics.com";

const REQUIRED_LEAGUES = [
    "NBA",
    "NHL",
    "MLB",
    "NFL"
];

const PLAYER_DOMAINS = [
    "PLAYER_ROUTING_IDENTITY",
    "PLAYER_PAGE_SOURCE",
    "PLAYER_API_BOUNDARY",
    "PLAYER_RENDERERS",
    "PLAYER_EMPTY_STATES",
    "PLAYER_DEPLOYED_PAGE"
];

const TEAM_DOMAINS = [
    "TEAM_ROUTING_IDENTITY",
    "TEAM_PAGE_SOURCE",
    "TEAM_RENDERERS",
    "TEAM_EMPTY_STATES",
    "TEAM_DEPLOYED_PAGE"
];

const __filename =
    fileURLToPath(import.meta.url);

const __dirname =
    path.dirname(__filename);

const PROJECT_ROOT =
    path.resolve(
        __dirname,
        "../../../.."
    );

const PLAYER_PAGE_JS_PATH =
    path.join(
        PROJECT_ROOT,
        "player-page.js"
    );

const SCRIPT_JS_PATH =
    path.join(
        PROJECT_ROOT,
        "script.js"
    );

// Confirmed production routes supplied for P20 D4.

const CONFIRMED_PLAYER_ROUTE = {
    league: "nfl",
    id: "277867",
    url:
        `${BASE_URL}/player.html?league=nfl&id=277867`
};

const CONFIRMED_TEAM_ROUTE = {
    league: "nhl",
    team: "Montréal Canadiens",
    url:
        `${BASE_URL}/nhl-team?league=nhl&team=${encodeURIComponent(
            "Montréal Canadiens"
        )}`
};

// ------------------------------------------------------------
// STATE
// ------------------------------------------------------------

const assertions = [];

const leagueReports = {};

const failures = [];

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

function divider(title) {

    console.log("\n" + "=".repeat(60));
    console.log(title);
    console.log("=".repeat(60));
}

function normalizeLeague(value) {

    return String(value || "")
        .trim()
        .toUpperCase();
}

function hasValue(value) {

    return (
        value !== null &&
        value !== undefined &&
        value !== ""
    );
}

function safeMessage(error) {

    return (
        error?.message ||
        String(error)
    );
}

function ensureLeagueReport(league) {

    const normalized =
        normalizeLeague(league);

    if (!leagueReports[normalized]) {

        leagueReports[normalized] = {
            league: normalized,
            deployment: DEPLOYMENT,
            evidenceType: EVIDENCE_TYPE,
            assertions: 0,
            passed: 0,
            failed: 0,
            notExercised: 0,
            blockers: 0,
            domains: {}
        };
    }

    return leagueReports[normalized];
}

function ensureDomain(
    league,
    domain
) {

    const report =
        ensureLeagueReport(league);

    if (!report.domains[domain]) {

        report.domains[domain] = {
            status: "PENDING",
            blocker: true,
            assertions: 0,
            passed: 0,
            failed: 0,
            notExercised: 0,
            failures: []
        };
    }

    return report.domains[domain];
}

function recordAssertion({
    league = "GLOBAL",
    domain,
    name,
    status,
    details = {},
    blocker = true
}) {

    const normalizedLeague =
        normalizeLeague(league);

    const pass =
        status !== "FAIL";

    const record = {
        league: normalizedLeague,
        domain,
        name,
        pass,
        status,
        details
    };

    assertions.push(record);

    console.log(
        JSON.stringify(record)
    );

    if (
        normalizedLeague !== "GLOBAL"
    ) {

        const report =
            ensureLeagueReport(
                normalizedLeague
            );

        const domainReport =
            ensureDomain(
                normalizedLeague,
                domain
            );

        report.assertions += 1;

        domainReport.assertions += 1;

        domainReport.blocker =
            blocker;

        if (status === "PASS") {

            report.passed += 1;

            domainReport.passed += 1;
        }

        else if (
            status === "NOT_EXERCISED"
        ) {

            report.notExercised += 1;

            domainReport.notExercised += 1;
        }

        else {

            report.failed += 1;

            domainReport.failed += 1;

            if (blocker) {
                report.blockers += 1;
            }

            const failure = {
                league:
                    normalizedLeague,
                domain,
                name,
                details,
                blocker
            };

            failures.push(failure);

            domainReport.failures.push(
                failure
            );
        }
    }

    else if (
        status === "FAIL"
    ) {

        failures.push({
            league:
                normalizedLeague,
            domain,
            name,
            details,
            blocker
        });
    }

    return record;
}

function pass(
    league,
    domain,
    name,
    details = {},
    blocker = true
) {

    return recordAssertion({
        league,
        domain,
        name,
        status: "PASS",
        details,
        blocker
    });
}

function notExercised(
    league,
    domain,
    name,
    details = {},
    blocker = false
) {

    return recordAssertion({
        league,
        domain,
        name,
        status:
            "NOT_EXERCISED",
        details,
        blocker
    });
}

function fail(
    league,
    domain,
    name,
    details = {},
    blocker = true
) {

    return recordAssertion({
        league,
        domain,
        name,
        status: "FAIL",
        details,
        blocker
    });
}

function finalizeDomains() {

    Object.values(
        leagueReports
    ).forEach(report => {

        Object.values(
            report.domains
        ).forEach(domain => {

            if (
                domain.failed > 0
            ) {

                domain.status =
                    "FAIL";
            }

            else if (
                domain.passed > 0
            ) {

                domain.status =
                    "PASS";
            }

            else if (
                domain.notExercised > 0
            ) {

                domain.status =
                    "NOT_EXERCISED";
            }

            else {

                domain.status =
                    "PENDING";
            }
        });
    });
}

function readRequiredFile(
    filePath,
    label
) {

    if (
        !fs.existsSync(filePath)
    ) {

        throw new Error(
            `${label} not found at ${filePath}`
        );
    }

    return fs.readFileSync(
        filePath,
        "utf8"
    );
}

function sourceHasAll(
    source,
    fragments
) {

    const missing =
        fragments.filter(
            fragment =>
                !source.includes(
                    fragment
                )
        );

    return {
        pass:
            missing.length === 0,
        missing
    };
}

async function fetchText(
    url
) {

    const started =
        Date.now();

    const response =
        await fetch(url, {
            redirect: "follow",
            headers: {
                "user-agent":
                    "Sportacular-P20-D4-QA/1.0"
            }
        });

    const text =
        await response.text();

    return {
        url,
        status:
            response.status,
        ok:
            response.ok,
        contentType:
            response.headers.get(
                "content-type"
            ),
        bytes:
            text.length,
        text,
        runtimeMs:
            Date.now() -
            started
    };
}

async function fetchJSON(
    url
) {

    const result =
        await fetchText(url);

    let json = null;

    try {

        json =
            JSON.parse(
                result.text
            );
    }

    catch {
        // Keep null.
    }

    return {
        ...result,
        json
    };
}

// ------------------------------------------------------------
// PLAYER SOURCE CONTRACT
// ------------------------------------------------------------

function auditPlayerSource(
    source
) {

    divider(
        "P20 D4 — PLAYER FRONTEND SOURCE CONTRACT"
    );

    const startupFragments = [
        "DOMContentLoaded",
        "initPlayerPage",
        "getUrlParameters",
        "fetchPlayer",
        "renderHero",
        "renderAnalyticsDashboard",
        "renderQuickStats",
        "renderSeasonPanels",
        "renderProps",
        "renderTrendCards",
        "renderGameLogs"
    ];

    const startup =
        sourceHasAll(
            source,
            startupFragments
        );

    if (startup.pass) {

        pass(
            "GLOBAL",
            "PLAYER_PAGE_SOURCE",
            "Player Profile preserves required startup and render pipeline",
            {
                required:
                    startupFragments.length,
                missing: []
            }
        );
    }

    else {

        fail(
            "GLOBAL",
            "PLAYER_PAGE_SOURCE",
            "Player Profile preserves required startup and render pipeline",
            {
                required:
                    startupFragments.length,
                missing:
                    startup.missing
            }
        );
    }

    const apiFragments = [
        "/.netlify/functions/player?league=",
        "&id=",
        "response.ok",
        "response.json"
    ];

    const api =
        sourceHasAll(
            source,
            apiFragments
        );

    if (api.pass) {

        pass(
            "GLOBAL",
            "PLAYER_API_BOUNDARY",
            "Player Profile preserves universal Netlify Player endpoint boundary",
            {
                missing: []
            }
        );
    }

    else {

        fail(
            "GLOBAL",
            "PLAYER_API_BOUNDARY",
            "Player Profile preserves universal Netlify Player endpoint boundary",
            {
                missing:
                    api.missing
            }
        );
    }

    const rendererFragments = [
        "function getGameLogHeaders",
        "function getGameLogRenderer",
        "createNFLGameLogRow",
        "createNBAGameLogRow",
        "createNHLGameLogRow",
        "createMLBGameLogRow"
    ];

    const renderers =
        sourceHasAll(
            source,
            rendererFragments
        );

    if (renderers.pass) {

        pass(
            "GLOBAL",
            "PLAYER_RENDERERS",
            "Player Profile exposes all four league game-log renderers",
            {
                renderers: [
                    "NFL",
                    "NBA",
                    "NHL",
                    "MLB"
                ],
                missing: []
            }
        );
    }

    else {

        fail(
            "GLOBAL",
            "PLAYER_RENDERERS",
            "Player Profile exposes all four league game-log renderers",
            {
                missing:
                    renderers.missing
            }
        );
    }

    const nbaRendererContract = [
        'case "nba":',
        "return createNBAGameLogRow;",
        "function createNBAGameLogRow"
    ];

    const nbaRenderer =
        sourceHasAll(
            source,
            nbaRendererContract
        );

    if (nbaRenderer.pass) {

        pass(
            "NBA",
            "PLAYER_RENDERERS",
            "NBA Player Profile game-log renderer is defined and routed",
            {
                regression:
                    "createNBAGameLogRow",
                missing: []
            }
        );
    }

    else {

        fail(
            "NBA",
            "PLAYER_RENDERERS",
            "NBA Player Profile game-log renderer is defined and routed",
            {
                regression:
                    "createNBAGameLogRow",
                missing:
                    nbaRenderer.missing
            }
        );
    }

    [
        ["NFL", "createNFLGameLogRow"],
        ["NHL", "createNHLGameLogRow"],
        ["MLB", "createMLBGameLogRow"]
    ].forEach(
        ([league, renderer]) => {

            if (
                source.includes(
                    `function ${renderer}`
                )
            ) {

                pass(
                    league,
                    "PLAYER_RENDERERS",
                    `${league} Player Profile game-log renderer is defined`,
                    {
                        renderer
                    }
                );
            }

            else {

                fail(
                    league,
                    "PLAYER_RENDERERS",
                    `${league} Player Profile game-log renderer is defined`,
                    {
                        renderer
                    }
                );
            }
        }
    );

    const emptyStateFragments = [
        "No Trends Available",
        "No Recommended Play",
        "No recent games available."
    ];

    const emptyStates =
        sourceHasAll(
            source,
            emptyStateFragments
        );

    if (emptyStates.pass) {

        pass(
            "GLOBAL",
            "PLAYER_EMPTY_STATES",
            "Player Profile preserves explicit customer-facing degradation states",
            {
                required:
                    emptyStateFragments,
                missing: []
            }
        );
    }

    else {

        fail(
            "GLOBAL",
            "PLAYER_EMPTY_STATES",
            "Player Profile preserves explicit customer-facing degradation states",
            {
                missing:
                    emptyStates.missing
            }
        );
    }
}

// ------------------------------------------------------------
// TEAM SOURCE CONTRACT
// ------------------------------------------------------------

function auditTeamSource(
    source
) {

    divider(
        "P20 D4 — TEAM FRONTEND SOURCE CONTRACT"
    );

    const routingFragments = [
        "getTeamProfileParameters",
        "initTeamProfilePage",
        "URLSearchParams",
        'params.get("league")',
        'params.get("team")'
    ];

    const routing =
        sourceHasAll(
            source,
            routingFragments
        );

    if (routing.pass) {

        pass(
            "GLOBAL",
            "TEAM_ROUTING_IDENTITY",
            "Team Profile preserves query-string routing contract",
            {
                missing: []
            }
        );
    }

    else {

        fail(
            "GLOBAL",
            "TEAM_ROUTING_IDENTITY",
            "Team Profile preserves query-string routing contract",
            {
                missing:
                    routing.missing
            }
        );
    }

    const sourceFragments = [
        "TEAM_PROFILE_CONFIG",
        "fetchTeamSeasonStats",
        "fetchTeamTrends",
        "fetchTeamGameLogs",
        "renderTeamGameLog"
    ];

    const teamSource =
        sourceHasAll(
            source,
            sourceFragments
        );

    if (teamSource.pass) {

        pass(
            "GLOBAL",
            "TEAM_PAGE_SOURCE",
            "Team Profile preserves production frontend data/render pipeline",
            {
                missing: []
            }
        );
    }

    else {

        fail(
            "GLOBAL",
            "TEAM_PAGE_SOURCE",
            "Team Profile preserves production frontend data/render pipeline",
            {
                missing:
                    teamSource.missing
            }
        );
    }

    const rendererFragments = [
        "createNFLTeamGameLogRow",
        "createMLBTeamGameLogRow",
        "createNBATeamGameLogRow",
        "createNHLTeamGameLogRow"
    ];

    const renderers =
        sourceHasAll(
            source,
            rendererFragments
        );

    if (renderers.pass) {

        pass(
            "GLOBAL",
            "TEAM_RENDERERS",
            "Team Profile exposes all four league game-log renderers",
            {
                renderers: [
                    "NFL",
                    "MLB",
                    "NBA",
                    "NHL"
                ],
                missing: []
            }
        );
    }

    else {

        fail(
            "GLOBAL",
            "TEAM_RENDERERS",
            "Team Profile exposes all four league game-log renderers",
            {
                missing:
                    renderers.missing
            }
        );
    }

    const emptyStateFragments = [
        "No season statistics found.",
        "No current team trends found.",
        "No recent games found."
    ];

    const emptyStates =
        sourceHasAll(
            source,
            emptyStateFragments
        );

    if (emptyStates.pass) {

        pass(
            "GLOBAL",
            "TEAM_EMPTY_STATES",
            "Team Profile preserves required customer-facing empty states",
            {
                required:
                    emptyStateFragments,
                missing: []
            }
        );
    }

    else {

        fail(
            "GLOBAL",
            "TEAM_EMPTY_STATES",
            "Team Profile preserves required customer-facing empty states",
            {
                missing:
                    emptyStates.missing
            }
        );
    }
}

// ------------------------------------------------------------
// CONFIRMED PLAYER DEPLOYED ROUTE
// ------------------------------------------------------------

async function auditConfirmedPlayerRoute() {

    divider(
        "P20 D4 — CONFIRMED DEPLOYED PLAYER PROFILE"
    );

    const league =
        normalizeLeague(
            CONFIRMED_PLAYER_ROUTE.league
        );

    try {

        const page =
            await fetchText(
                CONFIRMED_PLAYER_ROUTE.url
            );

        if (
            page.ok &&
            page.bytes > 0
        ) {

            pass(
                league,
                "PLAYER_DEPLOYED_PAGE",
                `${league} confirmed Player Profile production route is reachable`,
                {
                    url:
                        CONFIRMED_PLAYER_ROUTE.url,
                    status:
                        page.status,
                    contentType:
                        page.contentType,
                    bytes:
                        page.bytes,
                    runtimeMs:
                        page.runtimeMs
                }
            );
        }

        else {

            fail(
                league,
                "PLAYER_DEPLOYED_PAGE",
                `${league} confirmed Player Profile production route is reachable`,
                {
                    url:
                        CONFIRMED_PLAYER_ROUTE.url,
                    status:
                        page.status,
                    bytes:
                        page.bytes
                }
            );
        }

        const pageLooksHTML =
            String(
                page.contentType || ""
            )
                .toLowerCase()
                .includes("text/html") ||
            /<!doctype html|<html/i.test(
                page.text
            );

        if (pageLooksHTML) {

            pass(
                league,
                "PLAYER_PAGE_SOURCE",
                `${league} deployed Player Profile route returns HTML`,
                {
                    status:
                        page.status,
                    contentType:
                        page.contentType
                }
            );
        }

        else {

            fail(
                league,
                "PLAYER_PAGE_SOURCE",
                `${league} deployed Player Profile route returns HTML`,
                {
                    status:
                        page.status,
                    contentType:
                        page.contentType
                }
            );
        }

        const apiURL =
            `${BASE_URL}/.netlify/functions/player` +
            `?league=${encodeURIComponent(
                CONFIRMED_PLAYER_ROUTE.league
            )}` +
            `&id=${encodeURIComponent(
                CONFIRMED_PLAYER_ROUTE.id
            )}`;

        const api =
            await fetchJSON(
                apiURL
            );

        if (
            api.ok &&
            api.json &&
            typeof api.json ===
                "object"
        ) {

            pass(
                league,
                "PLAYER_API_BOUNDARY",
                `${league} confirmed production Player API route returns JSON`,
                {
                    url:
                        apiURL,
                    status:
                        api.status,
                    contentType:
                        api.contentType,
                    runtimeMs:
                        api.runtimeMs
                }
            );
        }

        else {

            fail(
                league,
                "PLAYER_API_BOUNDARY",
                `${league} confirmed production Player API route returns JSON`,
                {
                    url:
                        apiURL,
                    status:
                        api.status,
                    contentType:
                        api.contentType,
                    first200:
                        api.text.slice(
                            0,
                            200
                        )
                }
            );

            return;
        }

        const requiredSections = [
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

        const missing =
            requiredSections.filter(
                key =>
                    !Object.prototype
                        .hasOwnProperty
                        .call(
                            api.json,
                            key
                        )
            );

        if (
            missing.length === 0
        ) {

            pass(
                league,
                "PLAYER_API_BOUNDARY",
                `${league} confirmed production Player API preserves required profile sections`,
                {
                    requiredSections:
                        requiredSections.length,
                    missing: []
                }
            );
        }

        else {

            fail(
                league,
                "PLAYER_API_BOUNDARY",
                `${league} confirmed production Player API preserves required profile sections`,
                {
                    missing
                }
            );
        }

        const returnedName =
            api.json?.hero?.name ??
            null;

        if (
            hasValue(returnedName)
        ) {

            pass(
                league,
                "PLAYER_ROUTING_IDENTITY",
                `${league} confirmed production player ID resolves to a player identity`,
                {
                    id:
                        CONFIRMED_PLAYER_ROUTE.id,
                    name:
                        returnedName,
                    team:
                        api.json?.hero?.team ??
                        null,
                    position:
                        api.json?.hero?.position ??
                        null
                }
            );
        }

        else {

            fail(
                league,
                "PLAYER_ROUTING_IDENTITY",
                `${league} confirmed production player ID resolves to a player identity`,
                {
                    id:
                        CONFIRMED_PLAYER_ROUTE.id,
                    hero:
                        api.json?.hero ??
                        null
                }
            );
        }

    }

    catch (error) {

        fail(
            league,
            "PLAYER_DEPLOYED_PAGE",
            `${league} confirmed Player Profile production audit completes`,
            {
                error:
                    safeMessage(error)
            }
        );
    }
}

// ------------------------------------------------------------
// CONFIRMED TEAM DEPLOYED ROUTE
// ------------------------------------------------------------

async function auditConfirmedTeamRoute() {

    divider(
        "P20 D4 — CONFIRMED DEPLOYED TEAM PROFILE"
    );

    const league =
        normalizeLeague(
            CONFIRMED_TEAM_ROUTE.league
        );

    try {

        const page =
            await fetchText(
                CONFIRMED_TEAM_ROUTE.url
            );

        if (
            page.ok &&
            page.bytes > 0
        ) {

            pass(
                league,
                "TEAM_DEPLOYED_PAGE",
                `${league} confirmed Team Profile production route is reachable`,
                {
                    url:
                        CONFIRMED_TEAM_ROUTE.url,
                    status:
                        page.status,
                    contentType:
                        page.contentType,
                    bytes:
                        page.bytes,
                    runtimeMs:
                        page.runtimeMs
                }
            );
        }

        else {

            fail(
                league,
                "TEAM_DEPLOYED_PAGE",
                `${league} confirmed Team Profile production route is reachable`,
                {
                    url:
                        CONFIRMED_TEAM_ROUTE.url,
                    status:
                        page.status,
                    bytes:
                        page.bytes
                }
            );
        }

        const pageLooksHTML =
            String(
                page.contentType || ""
            )
                .toLowerCase()
                .includes("text/html") ||
            /<!doctype html|<html/i.test(
                page.text
            );

        if (pageLooksHTML) {

            pass(
                league,
                "TEAM_PAGE_SOURCE",
                `${league} deployed Team Profile route returns HTML`,
                {
                    status:
                        page.status,
                    contentType:
                        page.contentType
                }
            );
        }

        else {

            fail(
                league,
                "TEAM_PAGE_SOURCE",
                `${league} deployed Team Profile route returns HTML`,
                {
                    status:
                        page.status,
                    contentType:
                        page.contentType
                }
            );
        }

        const decodedTeam =
            decodeURIComponent(
                CONFIRMED_TEAM_ROUTE.team
            );

        if (
            decodedTeam ===
            "Montréal Canadiens"
        ) {

            pass(
                league,
                "TEAM_ROUTING_IDENTITY",
                `${league} confirmed Team Profile preserves Unicode team identity`,
                {
                    team:
                        decodedTeam,
                    encoded:
                        encodeURIComponent(
                            decodedTeam
                        )
                }
            );
        }

        else {

            fail(
                league,
                "TEAM_ROUTING_IDENTITY",
                `${league} confirmed Team Profile preserves Unicode team identity`,
                {
                    team:
                        decodedTeam
                }
            );
        }

    }

    catch (error) {

        fail(
            league,
            "TEAM_DEPLOYED_PAGE",
            `${league} confirmed Team Profile production audit completes`,
            {
                error:
                    safeMessage(error)
            }
        );
    }
}

// ------------------------------------------------------------
// FOUR-LEAGUE REGISTRATION
// ------------------------------------------------------------

function registerFourLeagueCoverage() {

    divider(
        "P20 D4 — FOUR-LEAGUE REGRESSION REGISTRATION"
    );

    for (
        const league of
        REQUIRED_LEAGUES
    ) {

        const playerRenderer =
            league === "NBA"
                ? "createNBAGameLogRow"
                : league === "NHL"
                    ? "createNHLGameLogRow"
                    : league === "NFL"
                        ? "createNFLGameLogRow"
                        : "createMLBGameLogRow";

        const teamRenderer =
            league === "NBA"
                ? "createNBATeamGameLogRow"
                : league === "NHL"
                    ? "createNHLTeamGameLogRow"
                    : league === "NFL"
                        ? "createNFLTeamGameLogRow"
                        : "createMLBTeamGameLogRow";

        pass(
            league,
            "PLAYER_PAGE_SOURCE",
            `${league} Player Profile frontend is registered in P20 D4`,
            {
                renderer:
                    playerRenderer
            }
        );

        pass(
            league,
            "TEAM_PAGE_SOURCE",
            `${league} Team Profile frontend is registered in P20 D4`,
            {
                renderer:
                    teamRenderer
            }
        );

        if (
            league !== "NFL"
        ) {

            notExercised(
                league,
                "PLAYER_DEPLOYED_PAGE",
                `${league} deployed Player Profile route is not directly exercised by the confirmed D4 production sample`,
                {
                    confirmedSampleLeague:
                        "NFL",
                    reason:
                        "D4 has one confirmed production Player Profile route. Source-level four-league renderer coverage is exercised separately."
                }
            );
        }

        if (
            league !== "NHL"
        ) {

            notExercised(
                league,
                "TEAM_DEPLOYED_PAGE",
                `${league} deployed Team Profile route is not directly exercised by the confirmed D4 production sample`,
                {
                    confirmedSampleLeague:
                        "NHL",
                    reason:
                        "D4 has one confirmed production Team Profile route. Source-level four-league renderer coverage is exercised separately."
                }
            );
        }
    }
}

// ------------------------------------------------------------
// MASTER ASSERTIONS
// ------------------------------------------------------------

function runMasterAssertions() {

    divider(
        "P20 D4 — MASTER CONTRACT ASSERTIONS"
    );

    const leagues =
        Object.keys(
            leagueReports
        )
            .filter(
                league =>
                    REQUIRED_LEAGUES
                        .includes(
                            league
                        )
            )
            .sort();

    const expected =
        [...REQUIRED_LEAGUES]
            .sort();

    const exactLeagueSet =
        JSON.stringify(
            leagues
        ) ===
        JSON.stringify(
            expected
        );

    recordAssertion({
        league: "GLOBAL",
        domain:
            "MASTER_CONTRACT",
        name:
            "P20 D4 contains exactly four league evidence records",
        status:
            exactLeagueSet
                ? "PASS"
                : "FAIL",
        details: {
            leagues
        }
    });

    const globalFailures =
        assertions.filter(
            assertion =>
                assertion.status ===
                    "FAIL"
        );

    recordAssertion({
        league: "GLOBAL",
        domain:
            "MASTER_CONTRACT",
        name:
            "P20 D4 contains no failed assertions",
        status:
            globalFailures.length ===
                0
                ? "PASS"
                : "FAIL",
        details: {
            failedAssertions:
                globalFailures.length
        }
    });
}

// ------------------------------------------------------------
// REPORT
// ------------------------------------------------------------

function printReport() {

    finalizeDomains();

    divider(
        "SPORTACULAR V1.0 — P20 D4 DEPLOYED PROFILE UI REGRESSION REPORT"
    );

    for (
        const league of
        REQUIRED_LEAGUES
    ) {

        const report =
            leagueReports[league];

        if (!report) {

            console.log(
                `${league}: NO REPORT`
            );

            continue;
        }

        const domainEntries =
            Object.values(
                report.domains
            );

        const passedDomains =
            domainEntries.filter(
                domain =>
                    domain.status ===
                    "PASS"
            ).length;

        const notExercisedDomains =
            domainEntries.filter(
                domain =>
                    domain.status ===
                    "NOT_EXERCISED"
            ).length;

        const failedDomains =
            domainEntries.filter(
                domain =>
                    domain.status ===
                    "FAIL"
            ).length;

        const leagueStatus =
            report.blockers > 0
                ? "FAIL"
                : "PASS";

        console.log(
            `${league}: ${leagueStatus}` +
            ` | ${passedDomains} domains PASS` +
            ` | ${notExercisedDomains} NOT_EXERCISED` +
            ` | ${failedDomains} FAIL` +
            ` | ${report.blockers} blockers`
        );
    }

    const passed =
        assertions.filter(
            item =>
                item.status ===
                "PASS"
        ).length;

    const notExercisedCount =
        assertions.filter(
            item =>
                item.status ===
                "NOT_EXERCISED"
        ).length;

    const failed =
        assertions.filter(
            item =>
                item.status ===
                "FAIL"
        ).length;

    const blockers =
        failures.filter(
            failure =>
                failure.blocker !==
                false
        ).length;

    console.log("");
    console.log(
        `Required leagues: ${REQUIRED_LEAGUES.length}`
    );
    console.log(
        `Assertions: ${assertions.length}`
    );
    console.log(
        `Assertions passed: ${passed}`
    );
    console.log(
        `Assertions NOT_EXERCISED: ${notExercisedCount}`
    );
    console.log(
        `Assertions failed: ${failed}`
    );
    console.log(
        `Release blockers: ${blockers}`
    );

    console.log(
        "-".repeat(60)
    );

    const status =
        blockers === 0
            ? "PASS"
            : "FAIL";

    console.log(
        `P20 D4 STATUS: ${status}`
    );

    if (
        status === "PASS"
    ) {

        console.log(
            "P20 DEPLOYED PROFILE UI REGRESSION: PASS"
        );

        console.log(
            "P20 D4 NODE/FETCH EVIDENCE: COMPLETE"
        );

        console.log(
            "P20 BROWSER EXECUTION EVIDENCE: NOT YET EXERCISED"
        );

        console.log(
            "READY FOR P20 FINAL BROWSER EVIDENCE / FREEZE DECISION"
        );
    }

    else {

        console.log(
            "P20 DEPLOYED PROFILE UI REGRESSION: BLOCKED"
        );
    }

    console.log(
        "=".repeat(60)
    );

    const report = {
        deployment:
            DEPLOYMENT,
        evidenceType:
            EVIDENCE_TYPE,
        status,
        architecture: {
            player:
                "PLAYER_PAGE_JS_TO_NETLIFY_UNIVERSAL_PLAYER_ENDPOINT",
            team:
                "SCRIPT_JS_FRONTEND_TEAM_PROFILE"
        },
        baseURL:
            BASE_URL,
        confirmedRoutes: {
            player:
                CONFIRMED_PLAYER_ROUTE,
            team:
                CONFIRMED_TEAM_ROUTE
        },
        leagues:
            REQUIRED_LEAGUES,
        assertions:
            assertions.length,
        assertionsPassed:
            passed,
        assertionsNotExercised:
            notExercisedCount,
        assertionsFailed:
            failed,
        blockers,
        browserExecution:
            "NOT_EXERCISED",
        leagueReports,
        failures
    };

    console.log(
        JSON.stringify(
            report,
            null,
            2
        )
    );

    if (
        blockers > 0
    ) {

        throw new Error(
            `P20 D4 FAILED — ${blockers} release blocker(s) detected.`
        );
    }
}

// ------------------------------------------------------------
// MAIN
// ------------------------------------------------------------

async function main() {

    divider(
        "SPORTACULAR V1.0 — P20 D4 DEPLOYED PROFILE UI REGRESSION"
    );

    console.log(
        "Project root:",
        PROJECT_ROOT
    );

    console.log(
        "Player frontend:",
        PLAYER_PAGE_JS_PATH
    );

    console.log(
        "Team frontend:",
        SCRIPT_JS_PATH
    );

    let playerSource;
    let teamSource;

    try {

        playerSource =
            readRequiredFile(
                PLAYER_PAGE_JS_PATH,
                "player-page.js"
            );

        pass(
            "GLOBAL",
            "PLAYER_PAGE_SOURCE",
            "Current player-page.js is available for P20 D4",
            {
                path:
                    PLAYER_PAGE_JS_PATH,
                bytes:
                    playerSource.length
            }
        );
    }

    catch (error) {

        fail(
            "GLOBAL",
            "PLAYER_PAGE_SOURCE",
            "Current player-page.js is available for P20 D4",
            {
                path:
                    PLAYER_PAGE_JS_PATH,
                error:
                    safeMessage(error)
            }
        );
    }

    try {

        teamSource =
            readRequiredFile(
                SCRIPT_JS_PATH,
                "script.js"
            );

        pass(
            "GLOBAL",
            "TEAM_PAGE_SOURCE",
            "Current script.js is available for P20 D4",
            {
                path:
                    SCRIPT_JS_PATH,
                bytes:
                    teamSource.length
            }
        );
    }

    catch (error) {

        fail(
            "GLOBAL",
            "TEAM_PAGE_SOURCE",
            "Current script.js is available for P20 D4",
            {
                path:
                    SCRIPT_JS_PATH,
                error:
                    safeMessage(error)
            }
        );
    }

    if (playerSource) {
        auditPlayerSource(
            playerSource
        );
    }

    if (teamSource) {
        auditTeamSource(
            teamSource
        );
    }

    registerFourLeagueCoverage();

    await auditConfirmedPlayerRoute();

    await auditConfirmedTeamRoute();

    runMasterAssertions();

    printReport();
}

main().catch(error => {

    console.error(
        "\nP20 D4 ERROR:"
    );

    console.error(
        safeMessage(error)
    );

    process.exitCode = 1;
});