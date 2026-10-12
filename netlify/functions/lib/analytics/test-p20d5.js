// ============================================================
// SPORTACULAR ANALYTICS
// P20 D5 — REAL BROWSER EXECUTION REGRESSION
// ============================================================
//
// Read-only production browser audit.
//
// Tests:
// 1. Real Chromium page execution
// 2. JavaScript runtime errors
// 3. Critical network failures
// 4. Player Profile API integration
// 5. Player and Team identity rendering
// 6. Four-league browser coverage registration
//
// No production files are modified.
// No authentication or payment actions are performed.
//
// ============================================================

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const BASE_URL = "https://sportacularanalytics.com";

const OUTPUT_DIR = path.resolve(
    process.cwd(),
    "p20-evidence"
);

const ROUTES = [
    {
        type: "PLAYER",
        league: "NFL",
        label: "NFL Caleb Williams",
        url:
            `${BASE_URL}/player.html?league=nfl&id=277867`,
        expectedName: "Caleb Williams"
    },
    {
        type: "TEAM",
        league: "NHL",
        label: "NHL Montréal Canadiens",
        url:
            `${BASE_URL}/nhl-team?league=nhl&team=` +
            encodeURIComponent("Montréal Canadiens"),
        expectedName: "Montréal Canadiens"
    }
];

const LEAGUES = [
    "NBA",
    "NHL",
    "MLB",
    "NFL"
];

const results = [];

function log(title) {
    console.log("\n" + "=".repeat(60));
    console.log(title);
    console.log("=".repeat(60));
}

function check(
    checks,
    name,
    condition,
    details = {}
) {
    const result = {
        name,
        status: condition ? "PASS" : "FAIL",
        details
    };

    checks.push(result);

    console.log(
        `${result.status}: ${name}`
    );

    if (!condition) {
        console.log(
            JSON.stringify(details, null, 2)
        );
    }

    return condition;
}

function safeFilename(value) {
    return String(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

async function inspectRoute(browser, route) {

    log(`P20 D5 — ${route.label}`);

    const context = await browser.newContext({
        viewport: {
            width: 1440,
            height: 900
        },
        serviceWorkers: "block"
    });

    const page = await context.newPage();

    const checks = [];
    const javascriptErrors = [];
    const consoleErrors = [];
    const failedRequests = [];
    const httpFailures = [];
    const playerApiResponses = [];

    page.on("pageerror", error => {
        javascriptErrors.push(
            error.message
        );
    });

    page.on("console", message => {
        if (message.type() === "error") {
            consoleErrors.push(
                message.text()
            );
        }
    });

    page.on("requestfailed", request => {
        failedRequests.push({
            url: request.url(),
            resourceType: request.resourceType(),
            error:
                request.failure()?.errorText ??
                "Unknown request failure"
        });
    });

    page.on("response", response => {

        const url = response.url();

        if (
            url.includes(
                "/.netlify/functions/player?"
            )
        ) {
            playerApiResponses.push({
                url,
                status: response.status()
            });
        }

        if (response.status() >= 400) {
            httpFailures.push({
                url,
                status: response.status(),
                resourceType:
                    response.request().resourceType()
            });
        }
    });

    let navigationStatus = null;
    let navigationError = null;
    let snapshot = null;

    try {

        const response = await page.goto(
            route.url,
            {
                waitUntil: "domcontentloaded",
                timeout: 45000
            }
        );

        navigationStatus =
            response?.status() ?? null;

        // Give the production page time to load its
        // supplemental API and CSV resources.
        //
        // This is not treated as proof of completion.
        // DOM and API assertions below determine that.

        await page.waitForTimeout(8000);

        snapshot = await page.evaluate(() => {

            const text = element =>
                element?.textContent?.trim() ?? "";

            const byId = id =>
                document.getElementById(id);

            const visible = element => {

                if (!element) return false;

                const style =
                    window.getComputedStyle(element);

                return (
                    !element.hidden &&
                    style.display !== "none" &&
                    style.visibility !== "hidden"
                );
            };

            const bodyText =
                document.body?.innerText ?? "";

            return {
                title: document.title,
                url: window.location.href,
                bodyLength: bodyText.length,
                bodyText: bodyText.slice(0, 20000),

                playerName:
                    text(byId("player-name")),

                teamName:
                    text(byId("team-name")),

                playerPosition:
                    text(byId("player-position")),

                playerTeam:
                    text(byId("player-team")),

                profileTitle:
                    text(byId("profileTitle")),

                playerNameExists:
                    Boolean(byId("player-name")),

                teamNameExists:
                    Boolean(byId("team-name")),

                trendGridExists:
                    Boolean(byId("trend-grid")),

                gameLogSectionExists:
                    Boolean(byId("game-log-section")),

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

                playerNameVisible:
                    visible(byId("player-name")),

                teamNameVisible:
                    visible(byId("team-name")),

                readyState:
                    document.readyState
            };
        });

        check(
            checks,
            "Production navigation returned HTTP 200",
            navigationStatus === 200,
            {
                navigationStatus
            }
        );

        check(
            checks,
            "Page rendered nonempty body",
            snapshot.bodyLength > 100,
            {
                bodyLength:
                    snapshot.bodyLength
            }
        );

        check(
            checks,
            "No uncaught JavaScript exceptions",
            javascriptErrors.length === 0,
            {
                javascriptErrors
            }
        );

        if (route.type === "PLAYER") {

            check(
                checks,
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

            check(
                checks,
                "Player name element is visible",
                snapshot.playerNameVisible,
                {
                    playerNameVisible:
                        snapshot.playerNameVisible
                }
            );

            check(
                checks,
                "Player Profile required DOM containers exist",
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

            check(
                checks,
                "Production Player API returned HTTP 200",
                playerApiResponses.some(
                    response =>
                        response.status === 200
                ),
                {
                    playerApiResponses
                }
            );

        } else {

            check(
                checks,
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

            check(
                checks,
                "Team name element is visible",
                snapshot.teamNameVisible,
                {
                    teamNameVisible:
                        snapshot.teamNameVisible
                }
            );
        }

        // Critical requests are production JavaScript,
        // the universal Player API, and the main HTML page.
        //
        // Noncritical third-party assets are reported
        // separately to avoid false production blockers.

        const criticalRequest = item => {

            const url =
                item.url || "";

            const type =
                item.resourceType || "";

            return (
                url.includes(
                    "/.netlify/functions/player?"
                ) ||
                (
                    url.startsWith(BASE_URL) &&
                    (
                        type === "script" ||
                        type === "document"
                    )
                )
            );
        };

        const criticalNetworkFailures = [
            ...failedRequests.filter(
                criticalRequest
            ),
            ...httpFailures.filter(
                criticalRequest
            )
        ];

        check(
            checks,
            "No critical production network failures",
            criticalNetworkFailures.length === 0,
            {
                criticalNetworkFailures
            }
        );

        // Console errors are collected as diagnostics.
        // Uncaught exceptions are the primary blocker.
        //
        // Console messages may include noncritical
        // third-party asset errors.

        console.log(
            "Console errors:",
            consoleErrors.length
        );

        console.log(
            "Failed requests:",
            failedRequests.length
        );

        console.log(
            "HTTP failures:",
            httpFailures.length
        );

    } catch (error) {

        navigationError =
            error?.message ??
            String(error);

        check(
            checks,
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
                item.status === "FAIL"
        );

    const status =
        failedChecks.length === 0 &&
        checks.length > 0
            ? "PASS"
            : "FAIL";

    const result = {
        deployment: "P20-D5",
        evidenceType:
            "REAL_BROWSER_EXECUTION",
        league: route.league,
        profileType: route.type,
        label: route.label,
        url: route.url,
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

    if (status === "FAIL") {

        const screenshotPath = path.join(
            OUTPUT_DIR,
            `${safeFilename(route.label)}-failure.png`
        );

        try {

            await page.screenshot({
                path: screenshotPath,
                fullPage: true,
                timeout: 15000
            });

            result.screenshot =
                screenshotPath;

            console.log(
                "Failure screenshot:",
                screenshotPath
            );

        } catch (error) {

            result.screenshotError =
                error?.message ??
                String(error);
        }
    }

    await context.close();

    results.push(result);

    console.log(
        `${route.label}: ${status}`
    );

    return result;
}

async function main() {

    fs.mkdirSync(
        OUTPUT_DIR,
        { recursive: true }
    );

    log(
        "SPORTACULAR V1.0 — P20 D5 REAL BROWSER REGRESSION"
    );

    const browser = await chromium.launch({
        headless: true
    });

    try {

        for (const route of ROUTES) {

            await inspectRoute(
                browser,
                route
            );
        }

    } finally {

        await browser.close();
    }

    const coverage = [];

    for (const league of LEAGUES) {

        for (
            const type of [
                "PLAYER",
                "TEAM"
            ]
        ) {

            const result =
                results.find(
                    item =>
                        item.league === league &&
                        item.profileType === type
                );

            coverage.push({
                league,
                profileType: type,
                status:
                    result?.status ??
                    "NOT_EXERCISED"
            });
        }
    }

    const passed =
        results.filter(
            item =>
                item.status === "PASS"
        ).length;

    const failed =
        results.filter(
            item =>
                item.status === "FAIL"
        ).length;

    const notExercised =
        coverage.filter(
            item =>
                item.status ===
                "NOT_EXERCISED"
        ).length;

    const browserStatus =
        failed > 0
            ? "FAIL"
            : "PASS";

    const freezeStatus =
        failed > 0
            ? "BLOCKED"
            : notExercised > 0
                ? "PENDING"
                : "READY_FOR_FINAL_REVIEW";

    const report = {
        deployment: "P20-D5",
        evidenceType:
            "REAL_BROWSER_EXECUTION",
        browser:
            "PLAYWRIGHT_CHROMIUM",
        status: browserStatus,
        freezeStatus,
        testedRoutes:
            results.length,
        passedRoutes:
            passed,
        failedRoutes:
            failed,
        notExercisedRoutes:
            notExercised,
        coverage,
        results,
        generatedAt:
            new Date().toISOString()
    };

    const reportPath = path.join(
        OUTPUT_DIR,
        "p20d5-report.json"
    );

    fs.writeFileSync(
        reportPath,
        JSON.stringify(
            report,
            null,
            2
        )
    );

    log(
        "P20 D5 — MASTER BROWSER REPORT"
    );

    console.log(
        `Tested routes: ${results.length}`
    );

    console.log(
        `Passed routes: ${passed}`
    );

    console.log(
        `Failed routes: ${failed}`
    );

    console.log(
        `NOT_EXERCISED routes: ${notExercised}`
    );

    console.log(
        `P20 D5 STATUS: ${browserStatus}`
    );

    console.log(
        `P20 FREEZE STATUS: ${freezeStatus}`
    );

    console.log(
        `Report: ${reportPath}`
    );

    console.log(
        "=".repeat(60)
    );

    if (failed > 0) {

        process.exitCode = 1;
    }
}

main().catch(error => {

    console.error(
        "P20 D5 FATAL ERROR:",
        error
    );

    process.exitCode = 1;
});