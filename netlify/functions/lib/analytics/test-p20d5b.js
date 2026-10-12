// ============================================================
// SPORTACULAR ANALYTICS
// P20 D5B — FOUR-LEAGUE REAL BROWSER COVERAGE
// ============================================================
//
// FINAL P20 browser-coverage evidence gate.
//
// Goals:
//   1. Exercise Player Profiles in NBA/NHL/MLB/NFL.
//   2. Exercise Team Profiles in NBA/NHL/MLB/NFL.
//   3. Auto-discover real production identities.
//   4. Execute the deployed pages in real Chromium.
//   5. Detect uncaught JavaScript exceptions.
//   6. Detect critical production network failures.
//   7. Verify customer-facing identity rendering.
//   8. Preserve legitimate no-data states.
//   9. Fail closed on genuine production defects.
//
// IMPORTANT:
//   - Read-only.
//   - No production files are modified.
//   - No authentication/payment actions.
//   - NBA Team may legitimately have no production rows.
//   - NOT_EXERCISED is not converted into fake PASS.
//
// ============================================================

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const BASE_URL =
    "https://sportacularanalytics.com";

const LEAGUES = [
    "nba",
    "nhl",
    "mlb",
    "nfl"
];

const OUTPUT_DIR =
    path.resolve(
        process.cwd(),
        "p20-evidence"
    );

const PLAYER_PAGE_PATH =
    "/player.html";

const TEAM_ROUTE_MAP = {
    nba: "/nba-team",
    nhl: "/nhl-team",
    mlb: "/mlb-team",
    nfl: "/nfl-team"
};

// ------------------------------------------------------------
// LOCAL PRODUCTION ROSTERS
// ------------------------------------------------------------
//
// D3A already established that these are the real roster
// inputs used by the universal Player endpoint.
//
// D5B uses them only to discover a real production player ID.
// The browser still loads the DEPLOYED production website.
//

const ROSTER_PATHS = {
    nba: path.resolve(
        process.cwd(),
        "netlify/functions/data/nba-roster.csv"
    ),

    nhl: path.resolve(
        process.cwd(),
        "netlify/functions/data/nhl-roster.csv"
    ),

    mlb: path.resolve(
        process.cwd(),
        "netlify/functions/data/mlb-roster.csv"
    ),

    nfl: path.resolve(
        process.cwd(),
        "netlify/functions/data/nfl-roster.csv"
    )
};

// ------------------------------------------------------------
// TEAM SOURCE DISCOVERY
// ------------------------------------------------------------
//
// These source names match the production Team Profile
// architecture already frozen in D1/D3B.
//
// Rather than duplicating Google Sheet URLs here, D5B reads
// the current production script.js and extracts the configured
// Team Profile source URLs.
//

const SCRIPT_JS_PATH =
    path.resolve(
        process.cwd(),
        "script.js"
    );

// ------------------------------------------------------------
// STATE
// ------------------------------------------------------------

const evidence = [];

const discoveryEvidence = [];

const failures = [];

// ------------------------------------------------------------
// LOGGING
// ------------------------------------------------------------

function divider(title) {

    console.log(
        "\n" + "=".repeat(68)
    );

    console.log(title);

    console.log(
        "=".repeat(68)
    );
}

function normalizeLeague(value) {

    return String(value || "")
        .trim()
        .toLowerCase();
}

function safeMessage(error) {

    return (
        error?.message ||
        String(error)
    );
}

function safeFilename(value) {

    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-|-$/g,
            ""
        );
}

function hasValue(value) {

    return (
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ""
    );
}

// ------------------------------------------------------------
// SIMPLE CSV PARSER
// ------------------------------------------------------------
//
// We only need identity discovery here.
// This parser handles quoted CSV cells and escaped quotes.
//

function parseCSVLine(line) {

    const cells = [];

    let current = "";

    let quoted = false;

    for (
        let i = 0;
        i < line.length;
        i += 1
    ) {

        const char =
            line[i];

        const next =
            line[i + 1];

        if (char === '"') {

            if (
                quoted &&
                next === '"'
            ) {

                current += '"';

                i += 1;

                continue;
            }

            quoted = !quoted;

            continue;
        }

        if (
            char === "," &&
            !quoted
        ) {

            cells.push(current);

            current = "";

            continue;
        }

        current += char;
    }

    cells.push(current);

    return cells;
}

function parseCSV(text) {

    const normalized =
        String(text || "")
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n");

    const lines =
        normalized
            .split("\n")
            .filter(
                line =>
                    line.trim() !== ""
            );

    if (
        lines.length < 2
    ) {

        return [];
    }

    const headers =
        parseCSVLine(
            lines[0]
        ).map(
            value =>
                value.trim()
        );

    return lines
        .slice(1)
        .map(line => {

            const values =
                parseCSVLine(line);

            const row = {};

            headers.forEach(
                (header, index) => {

                    row[header] =
                        values[index] ??
                        "";
                }
            );

            return row;
        });
}

// ------------------------------------------------------------
// FETCH
// ------------------------------------------------------------

async function fetchText(url) {

    const started =
        Date.now();

    const response =
        await fetch(
            url,
            {
                redirect: "follow",
                headers: {
                    "user-agent":
                        "Sportacular-P20-D5B-QA/1.0"
                }
            }
        );

    const text =
        await response.text();

    return {
        url,
        ok:
            response.ok,
        status:
            response.status,
        contentType:
            response.headers.get(
                "content-type"
            ),
        text,
        bytes:
            text.length,
        runtimeMs:
            Date.now() -
            started
    };
}

async function fetchJSON(url) {

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
        // Preserve null.
    }

    return {
        ...result,
        json
    };
}

// ------------------------------------------------------------
// PLAYER ROSTER DISCOVERY
// ------------------------------------------------------------

function getPlayerIdFromRow(row) {

    const candidates = [
        "Player ID",
        "Player Id",
        "player_id",
        "playerId",
        "ID",
        "Id",
        "id"
    ];

    for (
        const key of candidates
    ) {

        if (
            hasValue(row?.[key])
        ) {

            return String(
                row[key]
            ).trim();
        }
    }

    return null;
}

function getPlayerNameFromRow(row) {

    const candidates = [
        "Player Name",
        "Name",
        "player_name",
        "full_name",
        "Full Name"
    ];

    for (
        const key of candidates
    ) {

        if (
            hasValue(row?.[key])
        ) {

            return String(
                row[key]
            ).trim();
        }
    }

    return null;
}

function readRosterRows(league) {

    const filePath =
        ROSTER_PATHS[league];

    if (
        !fs.existsSync(filePath)
    ) {

        throw new Error(
            `Roster not found: ${filePath}`
        );
    }

    const text =
        fs.readFileSync(
            filePath,
            "utf8"
        );

    return parseCSV(text);
}

// ------------------------------------------------------------
// PLAYER DISCOVERY
// ------------------------------------------------------------
//
// We do not assume the first roster row is valid on production.
//
// Try real roster IDs against the deployed universal Player API.
// Stop after the first valid HTTP 200 identity.
//
// Limit prevents unnecessary production requests.
//

async function discoverPlayer(
    league
) {

    divider(
        `P20 D5B — ${league.toUpperCase()} PLAYER DISCOVERY`
    );

    const rows =
        readRosterRows(
            league
        );

    console.log(
        `Roster rows: ${rows.length}`
    );

    const candidates =
        rows
            .map(row => ({
                id:
                    getPlayerIdFromRow(
                        row
                    ),
                rosterName:
                    getPlayerNameFromRow(
                        row
                    )
            }))
            .filter(
                item =>
                    hasValue(item.id)
            )
            .slice(0, 40);

    for (
        const candidate of candidates
    ) {

        const apiURL =
            `${BASE_URL}/.netlify/functions/player` +
            `?league=${encodeURIComponent(
                league
            )}` +
            `&id=${encodeURIComponent(
                candidate.id
            )}`;

        try {

            const response =
                await fetchJSON(
                    apiURL
                );

            const name =
                response.json
                    ?.hero
                    ?.name ??
                null;

            if (
                response.status === 200 &&
                response.json &&
                hasValue(name)
            ) {

                const result = {
                    league:
                        league.toUpperCase(),
                    type:
                        "PLAYER",
                    status:
                        "PASS",
                    id:
                        candidate.id,
                    rosterName:
                        candidate.rosterName,
                    resolvedName:
                        name,
                    apiURL,
                    runtimeMs:
                        response.runtimeMs
                };

                discoveryEvidence.push(
                    result
                );

                console.log(
                    `Selected player: ${name} (${candidate.id})`
                );

                return {
                    id:
                        candidate.id,
                    name,
                    apiURL
                };
            }

        }

        catch {
            // Continue to next real roster candidate.
        }
    }

    const result = {
        league:
            league.toUpperCase(),
        type:
            "PLAYER",
        status:
            "FAIL",
        reason:
            "No valid deployed Player Profile identity resolved from production roster candidates."
    };

    discoveryEvidence.push(
        result
    );

    failures.push(
        result
    );

    return null;
}

// ------------------------------------------------------------
// TEAM PROFILE CONFIG EXTRACTION
// ------------------------------------------------------------

function readProductionScript() {

    if (
        !fs.existsSync(
            SCRIPT_JS_PATH
        )
    ) {

        throw new Error(
            `script.js not found at ${SCRIPT_JS_PATH}`
        );
    }

    return fs.readFileSync(
        SCRIPT_JS_PATH,
        "utf8"
    );
}

function extractConstantURL(
    source,
    constantName
) {

    const escaped =
        constantName.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

    const patterns = [
        new RegExp(
            `const\\s+${escaped}\\s*=\\s*["'\`]([^"'\`]+)["'\`]`,
            "m"
        ),
        new RegExp(
            `let\\s+${escaped}\\s*=\\s*["'\`]([^"'\`]+)["'\`]`,
            "m"
        ),
        new RegExp(
            `var\\s+${escaped}\\s*=\\s*["'\`]([^"'\`]+)["'\`]`,
            "m"
        )
    ];

    for (
        const pattern of patterns
    ) {

        const match =
            source.match(
                pattern
            );

        if (
            match?.[1]
        ) {

            return match[1];
        }
    }

    return null;
}

function extractTeamConfigBlock(
    source,
    league
) {

    const configIndex =
        source.indexOf(
            "TEAM_PROFILE_CONFIG"
        );

    if (
        configIndex === -1
    ) {

        return null;
    }

    const sourceAfterConfig =
        source.slice(
            configIndex
        );

    const leaguePattern =
        new RegExp(
            `${league}\\s*:\\s*\\{([\\s\\S]*?)\\n\\s*\\}`,
            "i"
        );

    const match =
        sourceAfterConfig.match(
            leaguePattern
        );

    return match?.[1] ??
        null;
}

function extractConfigReference(
    block,
    propertyName
) {

    if (!block) {
        return null;
    }

    const pattern =
        new RegExp(
            `${propertyName}\\s*:\\s*([A-Za-z0-9_$]+)`,
            "m"
        );

    return (
        block.match(pattern)
            ?.[1] ??
        null
    );
}

function resolveTeamSourceURL(
    source,
    league,
    propertyName
) {

    const block =
        extractTeamConfigBlock(
            source,
            league
        );

    const reference =
        extractConfigReference(
            block,
            propertyName
        );

    if (!reference) {
        return null;
    }

    const directURL =
        extractConstantURL(
            source,
            reference
        );

    if (directURL) {
        return directURL;
    }

    return null;
}

// ------------------------------------------------------------
// TEAM DISCOVERY
// ------------------------------------------------------------

function getTeamFromRow(row) {

    const candidates = [
        "Team",
        "TEAM",
        "team",
        "Team Name",
        "team_name"
    ];

    for (
        const key of candidates
    ) {

        if (
            hasValue(row?.[key])
        ) {

            return String(
                row[key]
            ).trim();
        }
    }

    return null;
}

async function discoverTeam(
    league,
    source
) {

    divider(
        `P20 D5B — ${league.toUpperCase()} TEAM DISCOVERY`
    );

    const sourceNames = [
        "teamTrends",
        "seasonStats",
        "teamGameLogs",
        "schedule"
    ];

    const sourceResults = [];

    for (
        const propertyName of sourceNames
    ) {

        const url =
            resolveTeamSourceURL(
                source,
                league,
                propertyName
            );

        if (!url) {

            sourceResults.push({
                propertyName,
                url: null,
                status:
                    "CONFIG_NOT_RESOLVED",
                rows: []
            });

            continue;
        }

        try {

            const response =
                await fetchText(
                    url
                );

            const rows =
                response.ok
                    ? parseCSV(
                        response.text
                    )
                    : [];

            sourceResults.push({
                propertyName,
                url,
                status:
                    response.status,
                rows
            });

            console.log(
                `${propertyName}: HTTP ${response.status} | rows ${rows.length}`
            );

        }

        catch (error) {

            sourceResults.push({
                propertyName,
                url,
                status:
                    "FETCH_ERROR",
                error:
                    safeMessage(error),
                rows: []
            });
        }
    }

    // Prefer the same active data families used by the Team
    // Profile init flow rather than schedule-only identities.

    const preferredSources = [
        "teamTrends",
        "seasonStats",
        "teamGameLogs"
    ];

    for (
        const propertyName of
        preferredSources
    ) {

        const result =
            sourceResults.find(
                item =>
                    item.propertyName ===
                    propertyName
            );

        const teams =
            (result?.rows || [])
                .map(
                    getTeamFromRow
                )
                .filter(
                    hasValue
                );

        if (
            teams.length > 0
        ) {

            const team =
                teams[0];

            const evidenceRecord = {
                league:
                    league.toUpperCase(),
                type:
                    "TEAM",
                status:
                    "PASS",
                team,
                source:
                    propertyName,
                sourceURL:
                    result.url
            };

            discoveryEvidence.push(
                evidenceRecord
            );

            console.log(
                `Selected team: ${team}`
            );

            return {
                team,
                source:
                    propertyName
            };
        }
    }

    // No team rows is a legitimate state if the configured
    // production sources are reachable but currently empty.
    //
    // This is especially important for NBA based on D3B.

    const resolvedSources =
        sourceResults.filter(
            item =>
                item.url
        );

    const reachableSources =
        resolvedSources.filter(
            item =>
                typeof item.status ===
                    "number" &&
                item.status >= 200 &&
                item.status < 400
        );

    const allReachableRowsEmpty =
        reachableSources.length > 0 &&
        reachableSources.every(
            item =>
                item.rows.length === 0
        );

    if (
        allReachableRowsEmpty
    ) {

        const result = {
            league:
                league.toUpperCase(),
            type:
                "TEAM",
            status:
                "NO_DATA_STATE",
            reason:
                "Configured production Team Profile sources are reachable but contain no team data rows.",
            sources:
                reachableSources.map(
                    item => ({
                        propertyName:
                            item.propertyName,
                        status:
                            item.status,
                        rows:
                            item.rows.length
                    })
                )
        };

        discoveryEvidence.push(
            result
        );

        console.log(
            "Accepted production no-data state."
        );

        return {
            team: null,
            noData: true,
            sourceResults
        };
    }

    const result = {
        league:
            league.toUpperCase(),
        type:
            "TEAM",
        status:
            "FAIL",
        reason:
            "Unable to discover a real team and unable to prove a valid reachable no-data state.",
        sourceResults:
            sourceResults.map(
                item => ({
                    propertyName:
                        item.propertyName,
                    url:
                        item.url,
                    status:
                        item.status,
                    rows:
                        item.rows.length,
                    error:
                        item.error ??
                        null
                })
            )
    };

    discoveryEvidence.push(
        result
    );

    failures.push(
        result
    );

    return null;
}

// ------------------------------------------------------------
// BROWSER AUDIT
// ------------------------------------------------------------

async function auditBrowserRoute(
    browser,
    route
) {

    divider(
        `P20 D5B — BROWSER — ${route.league.toUpperCase()} ${route.type}`
    );

    console.log(
        route.url
    );

    const context =
        await browser.newContext({
            viewport: {
                width: 1440,
                height: 900
            },
            serviceWorkers:
                "block"
        });

    const page =
        await context.newPage();

    const javascriptErrors = [];

    const consoleErrors = [];

    const failedRequests = [];

    const httpFailures = [];

    const playerApiResponses = [];

    page.on(
        "pageerror",
        error => {

            javascriptErrors.push(
                safeMessage(error)
            );
        }
    );

    page.on(
        "console",
        message => {

            if (
                message.type() ===
                "error"
            ) {

                consoleErrors.push(
                    message.text()
                );
            }
        }
    );

    page.on(
        "requestfailed",
        request => {

            failedRequests.push({
                url:
                    request.url(),
                resourceType:
                    request.resourceType(),
                error:
                    request.failure()
                        ?.errorText ??
                    "Unknown request failure"
            });
        }
    );

    page.on(
        "response",
        response => {

            const url =
                response.url();

            const resourceType =
                response
                    .request()
                    .resourceType();

            if (
                url.includes(
                    "/.netlify/functions/player?"
                )
            ) {

                playerApiResponses.push({
                    url,
                    status:
                        response.status()
                });
            }

            if (
                response.status() >= 400
            ) {

                httpFailures.push({
                    url,
                    status:
                        response.status(),
                    resourceType
                });
            }
        }
    );

    const checks = [];

    function assert(
        name,
        condition,
        details = {}
    ) {

        const item = {
            name,
            status:
                condition
                    ? "PASS"
                    : "FAIL",
            details
        };

        checks.push(
            item
        );

        console.log(
            `${item.status}: ${name}`
        );

        if (!condition) {

            console.log(
                JSON.stringify(
                    details,
                    null,
                    2
                )
            );
        }

        return condition;
    }

    let navigationStatus =
        null;

    let navigationError =
        null;

    let snapshot =
        null;

    try {

        const response =
            await page.goto(
                route.url,
                {
                    waitUntil:
                        "domcontentloaded",
                    timeout:
                        45000
                }
            );

        navigationStatus =
            response?.status() ??
            null;

        await page.waitForTimeout(
            8000
        );

        snapshot =
            await page.evaluate(
                () => {

                    const byId =
                        id =>
                            document
                                .getElementById(
                                    id
                                );

                    const text =
                        element =>
                            element
                                ?.textContent
                                ?.trim() ??
                            "";

                    const visible =
                        element => {

                            if (!element) {
                                return false;
                            }

                            const style =
                                window
                                    .getComputedStyle(
                                        element
                                    );

                            return (
                                !element.hidden &&
                                style.display !==
                                    "none" &&
                                style.visibility !==
                                    "hidden"
                            );
                        };

                    const bodyText =
                        document.body
                            ?.innerText ??
                        "";

                    return {
                        title:
                            document.title,

                        url:
                            window.location.href,

                        readyState:
                            document.readyState,

                        bodyLength:
                            bodyText.length,

                        bodyText:
                            bodyText.slice(
                                0,
                                25000
                            ),

                        playerName:
                            text(
                                byId(
                                    "player-name"
                                )
                            ),

                        playerTeam:
                            text(
                                byId(
                                    "player-team"
                                )
                            ),

                        playerPosition:
                            text(
                                byId(
                                    "player-position"
                                )
                            ),

                        teamName:
                            text(
                                byId(
                                    "team-name"
                                )
                            ),

                        playerNameExists:
                            Boolean(
                                byId(
                                    "player-name"
                                )
                            ),

                        teamNameExists:
                            Boolean(
                                byId(
                                    "team-name"
                                )
                            ),

                        playerNameVisible:
                            visible(
                                byId(
                                    "player-name"
                                )
                            ),

                        teamNameVisible:
                            visible(
                                byId(
                                    "team-name"
                                )
                            ),

                        trendGridExists:
                            Boolean(
                                byId(
                                    "trend-grid"
                                )
                            ),

                        gameLogSectionExists:
                            Boolean(
                                byId(
                                    "game-log-section"
                                )
                            ),

                        analyticsSectionExists:
                            Boolean(
                                byId(
                                    "analytics-dashboard-section"
                                )
                            ),

                        seasonSectionExists:
                            Boolean(
                                byId(
                                    "season-stats-section"
                                )
                            ),

                        teamSeasonStatsExists:
                            Boolean(
                                byId(
                                    "team-season-stats"
                                )
                            ),

                        teamTrendsExists:
                            Boolean(
                                byId(
                                    "team-trends"
                                )
                            )
                    };
                }
            );

        assert(
            "Production navigation returned HTTP 200",
            navigationStatus === 200,
            {
                navigationStatus
            }
        );

        assert(
            "Page rendered nonempty body",
            snapshot.bodyLength > 100,
            {
                bodyLength:
                    snapshot.bodyLength
            }
        );

        assert(
            "No uncaught JavaScript exceptions",
            javascriptErrors.length === 0,
            {
                javascriptErrors
            }
        );

        if (
            route.type === "PLAYER"
        ) {

            assert(
                "Player identity rendered correctly",
                snapshot.playerName ===
                    route.expectedName,
                {
                    expected:
                        route.expectedName,
                    actual:
                        snapshot.playerName
                }
            );

            assert(
                "Player identity is visible",
                snapshot.playerNameVisible,
                {
                    playerNameVisible:
                        snapshot.playerNameVisible
                }
            );

            assert(
                "Required Player Profile DOM containers exist",
                (
                    snapshot.playerNameExists &&
                    snapshot.trendGridExists &&
                    snapshot.gameLogSectionExists &&
                    snapshot.analyticsSectionExists &&
                    snapshot.seasonSectionExists
                ),
                {
                    playerNameExists:
                        snapshot.playerNameExists,

                    trendGridExists:
                        snapshot.trendGridExists,

                    gameLogSectionExists:
                        snapshot.gameLogSectionExists,

                    analyticsSectionExists:
                        snapshot.analyticsSectionExists,

                    seasonSectionExists:
                        snapshot.seasonSectionExists
                }
            );

            assert(
                "Production Player API returned HTTP 200",
                playerApiResponses.some(
                    item =>
                        item.status === 200
                ),
                {
                    playerApiResponses
                }
            );
        }

        else {

            assert(
                "Team identity rendered correctly",
                snapshot.teamName ===
                    route.expectedName,
                {
                    expected:
                        route.expectedName,
                    actual:
                        snapshot.teamName
                }
            );

            assert(
                "Team identity is visible",
                snapshot.teamNameVisible,
                {
                    teamNameVisible:
                        snapshot.teamNameVisible
                }
            );
        }

        const critical =
            item => {

                const url =
                    item.url ||
                    "";

                const type =
                    item.resourceType ||
                    "";

                return (
                    url.includes(
                        "/.netlify/functions/player?"
                    ) ||
                    (
                        url.startsWith(
                            BASE_URL
                        ) &&
                        (
                            type ===
                                "script" ||
                            type ===
                                "document"
                        )
                    )
                );
            };

        const criticalFailures = [
            ...failedRequests.filter(
                critical
            ),
            ...httpFailures.filter(
                critical
            )
        ];

        assert(
            "No critical production network failures",
            criticalFailures.length === 0,
            {
                criticalFailures
            }
        );

    }

    catch (error) {

        navigationError =
            safeMessage(error);

        assert(
            "Browser execution completed",
            false,
            {
                navigationError
            }
        );
    }

    const failedChecks =
        checks.filter(
            item =>
                item.status ===
                    "FAIL"
        );

    const status =
        failedChecks.length === 0 &&
        checks.length > 0
            ? "PASS"
            : "FAIL";

    const result = {
        league:
            route.league
                .toUpperCase(),

        profileType:
            route.type,

        expectedName:
            route.expectedName,

        url:
            route.url,

        status,

        navigationStatus,

        navigationError,

        checks,

        javascriptErrors,

        consoleErrors,

        failedRequests,

        httpFailures,

        playerApiResponses,

        snapshot
    };

    if (
        status === "FAIL"
    ) {

        const screenshotPath =
            path.join(
                OUTPUT_DIR,
                `p20d5b-${safeFilename(
                    `${route.league}-${route.type}-${route.expectedName}`
                )}-failure.png`
            );

        try {

            await page.screenshot({
                path:
                    screenshotPath,
                fullPage:
                    true,
                timeout:
                    15000
            });

            result.screenshot =
                screenshotPath;

            console.log(
                "Failure screenshot:",
                screenshotPath
            );
        }

        catch (error) {

            result.screenshotError =
                safeMessage(error);
        }
    }

    console.log(
        `Console errors: ${consoleErrors.length}`
    );

    console.log(
        `Failed requests: ${failedRequests.length}`
    );

    console.log(
        `HTTP failures: ${httpFailures.length}`
    );

    console.log(
        `${route.league.toUpperCase()} ${route.type}: ${status}`
    );

    await context.close();

    evidence.push(
        result
    );

    if (
        status === "FAIL"
    ) {

        failures.push({
            league:
                route.league
                    .toUpperCase(),

            type:
                route.type,

            reason:
                "Browser regression failed.",

            failedChecks
        });
    }

    return result;
}

// ------------------------------------------------------------
// NO-DATA TEAM EVIDENCE
// ------------------------------------------------------------
//
// If a league has no real production team rows, do NOT invent
// a team URL.
//
// D3B already established that a reachable, empty source state
// is legitimate.
//
// D5B records that state explicitly rather than pretending the
// browser exercised a nonexistent team.
//

function registerTeamNoData(
    league,
    discovery
) {

    const result = {
        league:
            league.toUpperCase(),

        profileType:
            "TEAM",

        status:
            "NO_DATA_STATE",

        url:
            null,

        expectedName:
            null,

        reason:
            "No real production team identity is currently available. Production sources are reachable and empty.",

        sourceResults:
            discovery
                ?.sourceResults
                ?.map(
                    item => ({
                        propertyName:
                            item.propertyName,
                        url:
                            item.url,
                        status:
                            item.status,
                        rows:
                            item.rows
                                ?.length ??
                            0
                    })
                ) ??
            []
    };

    evidence.push(
        result
    );

    console.log(
        `${league.toUpperCase()} TEAM: NO_DATA_STATE`
    );

    return result;
}

// ------------------------------------------------------------
// MAIN
// ------------------------------------------------------------

async function main() {

    fs.mkdirSync(
        OUTPUT_DIR,
        {
            recursive: true
        }
    );

    divider(
        "SPORTACULAR V1.0 — P20 D5B FOUR-LEAGUE BROWSER COVERAGE"
    );

    console.log(
        "Production:",
        BASE_URL
    );

    console.log(
        "Team frontend:",
        SCRIPT_JS_PATH
    );

    const teamSource =
        readProductionScript();

    // --------------------------------------------------------
    // DISCOVER IDENTITIES FIRST
    // --------------------------------------------------------

    const playerIdentities = {};

    const teamIdentities = {};

    for (
        const league of LEAGUES
    ) {

        playerIdentities[league] =
            await discoverPlayer(
                league
            );

        teamIdentities[league] =
            await discoverTeam(
                league,
                teamSource
            );
    }

    // --------------------------------------------------------
    // FAIL BEFORE BROWSER IF PLAYER DISCOVERY FAILED
    // --------------------------------------------------------

    const missingPlayers =
        LEAGUES.filter(
            league =>
                !playerIdentities[
                    league
                ]
        );

    if (
        missingPlayers.length > 0
    ) {

        divider(
            "P20 D5B — PLAYER DISCOVERY BLOCKER"
        );

        console.log(
            "Unable to discover deployed Player Profile identities for:",
            missingPlayers
                .map(
                    item =>
                        item.toUpperCase()
                )
                .join(", ")
        );
    }

    // --------------------------------------------------------
    // REAL CHROMIUM
    // --------------------------------------------------------

    const browser =
        await chromium.launch({
            headless: true
        });

    try {

        for (
            const league of LEAGUES
        ) {

            const playerIdentity =
                playerIdentities[
                    league
                ];

            if (
                playerIdentity
            ) {

                const url =
                    `${BASE_URL}${PLAYER_PAGE_PATH}` +
                    `?league=${encodeURIComponent(
                        league
                    )}` +
                    `&id=${encodeURIComponent(
                        playerIdentity.id
                    )}`;

                await auditBrowserRoute(
                    browser,
                    {
                        league,
                        type:
                            "PLAYER",
                        url,
                        expectedName:
                            playerIdentity.name
                    }
                );
            }

            const teamIdentity =
                teamIdentities[
                    league
                ];

            if (
                teamIdentity?.team
            ) {

                const teamPath =
                    TEAM_ROUTE_MAP[
                        league
                    ];

                const url =
                    `${BASE_URL}${teamPath}` +
                    `?league=${encodeURIComponent(
                        league
                    )}` +
                    `&team=${encodeURIComponent(
                        teamIdentity.team
                    )}`;

                await auditBrowserRoute(
                    browser,
                    {
                        league,
                        type:
                            "TEAM",
                        url,
                        expectedName:
                            teamIdentity.team
                    }
                );
            }

            else if (
                teamIdentity?.noData
            ) {

                registerTeamNoData(
                    league,
                    teamIdentity
                );
            }
        }

    }

    finally {

        await browser.close();
    }

    // --------------------------------------------------------
    // COVERAGE MATRIX
    // --------------------------------------------------------

    divider(
        "P20 D5B — COVERAGE MATRIX"
    );

    const coverage = [];

    for (
        const league of LEAGUES
    ) {

        for (
            const profileType of [
                "PLAYER",
                "TEAM"
            ]
        ) {

            const record =
                evidence.find(
                    item =>
                        item.league ===
                            league
                                .toUpperCase() &&
                        item.profileType ===
                            profileType
                );

            const status =
                record?.status ??
                "NOT_EXERCISED";

            coverage.push({
                league:
                    league.toUpperCase(),
                profileType,
                status
            });

            console.log(
                `${league.toUpperCase()} ${profileType}: ${status}`
            );
        }
    }

    // --------------------------------------------------------
    // FINAL COUNTS
    // --------------------------------------------------------

    const passCount =
        coverage.filter(
            item =>
                item.status ===
                    "PASS"
        ).length;

    const noDataCount =
        coverage.filter(
            item =>
                item.status ===
                    "NO_DATA_STATE"
        ).length;

    const notExercisedCount =
        coverage.filter(
            item =>
                item.status ===
                    "NOT_EXERCISED"
        ).length;

    const failCount =
        coverage.filter(
            item =>
                item.status ===
                    "FAIL"
        ).length;

    const activeBrowserResults =
        evidence.filter(
            item =>
                item.status ===
                    "PASS" ||
                item.status ===
                    "FAIL"
        );

    const jsExceptionCount =
        activeBrowserResults.reduce(
            (
                total,
                item
            ) =>
                total +
                (
                    item
                        .javascriptErrors
                        ?.length ??
                    0
                ),
            0
        );

    const consoleErrorCount =
        activeBrowserResults.reduce(
            (
                total,
                item
            ) =>
                total +
                (
                    item
                        .consoleErrors
                        ?.length ??
                    0
                ),
            0
        );

    const failedRequestCount =
        activeBrowserResults.reduce(
            (
                total,
                item
            ) =>
                total +
                (
                    item
                        .failedRequests
                        ?.length ??
                    0
                ),
            0
        );

    const httpFailureCount =
        activeBrowserResults.reduce(
            (
                total,
                item
            ) =>
                total +
                (
                    item
                        .httpFailures
                        ?.length ??
                    0
                ),
            0
        );

    // --------------------------------------------------------
    // FREEZE LOGIC
    // --------------------------------------------------------
    //
    // PASS:
    //   Browser exercised successfully.
    //
    // NO_DATA_STATE:
    //   Accepted only because no real team identity exists
    //   and configured production sources were proven
    //   reachable and empty.
    //
    // NOT_EXERCISED:
    //   Coverage incomplete.
    //
    // FAIL:
    //   Genuine blocker.
    //

    const completeCoverage =
        (
            passCount +
            noDataCount
        ) === 8 &&
        notExercisedCount === 0;

    const noBrowserFailures =
        failCount === 0;

    const noDiscoveryFailures =
        failures.filter(
            item =>
                item.status ===
                    "FAIL" ||
                item.reason
        ).length === 0;

    const freezeReady =
        completeCoverage &&
        noBrowserFailures &&
        noDiscoveryFailures;

    const status =
        failCount > 0 ||
        failures.length > 0
            ? "FAIL"
            : completeCoverage
                ? "PASS"
                : "PENDING";

    const freezeStatus =
        freezeReady
            ? "READY_TO_FREEZE"
            : status === "FAIL"
                ? "BLOCKED"
                : "PENDING";

    // --------------------------------------------------------
    // REPORT
    // --------------------------------------------------------

    const report = {
        deployment:
            "P20-D5B",

        evidenceType:
            "FOUR_LEAGUE_REAL_BROWSER_COVERAGE",

        architecture: {
            player:
                "LOCAL_PRODUCTION_ROSTER_TO_DEPLOYED_PLAYER_API_TO_DEPLOYED_PLAYER_PAGE",

            team:
                "SCRIPT_JS_TEAM_PROFILE_CONFIG_TO_PRODUCTION_CSV_TO_DEPLOYED_TEAM_PAGE",

            browser:
                "PLAYWRIGHT_CHROMIUM"
        },

        baseURL:
            BASE_URL,

        status,

        freezeStatus,

        coverage,

        counts: {
            requiredProfileBoundaries:
                8,

            passed:
                passCount,

            acceptedNoData:
                noDataCount,

            notExercised:
                notExercisedCount,

            failed:
                failCount,

            javascriptExceptions:
                jsExceptionCount,

            consoleErrors:
                consoleErrorCount,

            failedRequests:
                failedRequestCount,

            httpFailures:
                httpFailureCount,

            blockers:
                failures.length
        },

        discoveryEvidence,

        evidence,

        failures,

        generatedAt:
            new Date()
                .toISOString()
    };

    const reportPath =
        path.join(
            OUTPUT_DIR,
            "p20d5b-report.json"
        );

    fs.writeFileSync(
        reportPath,
        JSON.stringify(
            report,
            null,
            2
        )
    );

    divider(
        "SPORTACULAR V1.0 — P20 D5B FINAL REPORT"
    );

    console.log(
        `Required profile boundaries: 8`
    );

    console.log(
        `Browser PASS: ${passCount}`
    );

    console.log(
        `Accepted NO_DATA_STATE: ${noDataCount}`
    );

    console.log(
        `NOT_EXERCISED: ${notExercisedCount}`
    );

    console.log(
        `FAIL: ${failCount}`
    );

    console.log(
        `JavaScript exceptions: ${jsExceptionCount}`
    );

    console.log(
        `Console errors: ${consoleErrorCount}`
    );

    console.log(
        `Failed requests: ${failedRequestCount}`
    );

    console.log(
        `HTTP failures: ${httpFailureCount}`
    );

    console.log(
        `Release blockers: ${failures.length}`
    );

    console.log(
        "-".repeat(68)
    );

    console.log(
        `P20 D5B STATUS: ${status}`
    );

    console.log(
        `P20 FREEZE STATUS: ${freezeStatus}`
    );

    if (
        freezeReady
    ) {

        console.log(
            "P20 FOUR-LEAGUE BROWSER COVERAGE: COMPLETE"
        );

        console.log(
            "READY FOR P20 FINAL FREEZE DECISION"
        );
    }

    else if (
        status === "FAIL"
    ) {

        console.log(
            "P20 FOUR-LEAGUE BROWSER COVERAGE: BLOCKED"
        );
    }

    else {

        console.log(
            "P20 FOUR-LEAGUE BROWSER COVERAGE: INCOMPLETE"
        );
    }

    console.log(
        `Report: ${reportPath}`
    );

    console.log(
        "=".repeat(68)
    );

    if (
        status === "FAIL"
    ) {

        process.exitCode = 1;
    }
}

main().catch(error => {

    console.error(
        "\nP20 D5B FATAL ERROR:"
    );

    console.error(
        safeMessage(error)
    );

    process.exitCode = 1;
});