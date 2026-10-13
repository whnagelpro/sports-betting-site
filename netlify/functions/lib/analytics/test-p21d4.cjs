"use strict";

/*
 * SPORTACULAR ANALYTICS
 * P21 D4 — LOGOUT + POST-LOGOUT SECURITY QA
 *
 * IMPORTANT:
 * This test intentionally logs the persistent QA browser
 * profile out of Sportacular Analytics.
 *
 * READ-ONLY with respect to application data:
 * - Does not modify tier
 * - Does not modify profile
 * - Does not modify subscription
 * - Does not modify password
 *
 * AUTH STATE IS intentionally changed:
 * Legend authenticated -> signed out.
 */

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "../../../..");

const BASE_URL = "https://sportacularanalytics.com";
const AUTH_URL = `${BASE_URL}/auth.html`;

const PROFILE_DIR = path.join(
  ROOT,
  "p21-evidence",
  "p21-auth-profile"
);

const REPORT_PATH = path.join(
  ROOT,
  "p21-evidence",
  "p21d4-report.json"
);

const LEAGUES = ["nba", "nhl", "mlb", "nfl"];

const assertions = [];

function record(name, status, details = {}) {
  assertions.push({
    name,
    status,
    details
  });

  console.log(`${status}: ${name}`);
}

function check(name, condition, details = {}) {
  record(
    name,
    condition ? "PASS" : "FAIL",
    details
  );
}

function sanitizeUrl(url) {
  try {
    const parsed = new URL(url);

    parsed.search = "";
    parsed.hash = "";

    return parsed.toString();
  } catch {
    return url;
  }
}

async function getAuthState(page) {
  return page.evaluate(async () => {
    if (
      typeof supabaseClient === "undefined" ||
      !supabaseClient?.auth
    ) {
      return {
        clientAvailable: false,
        hasSession: false,
        hasUser: false,
        tier: null,
        profileFound: false,
        error: "Supabase client unavailable"
      };
    }

    const {
      data: sessionData,
      error: sessionError
    } = await supabaseClient.auth.getSession();

    const session =
      sessionData?.session || null;

    if (sessionError || !session?.user) {
      return {
        clientAvailable: true,
        hasSession: false,
        hasUser: false,
        tier: null,
        profileFound: false,
        error:
          sessionError?.message || null
      };
    }

    const user = session.user;

    const {
      data: profile,
      error: profileError
    } =
      await supabaseClient
        .from("profiles")
        .select("tier")
        .eq("id", user.id)
        .single();

    return {
      clientAvailable: true,
      hasSession: true,
      hasUser: true,
      tier:
        profile?.tier || null,
      profileFound:
        Boolean(profile && !profileError),
      error:
        profileError?.message || null
    };
  });
}

async function main() {
  console.log(
    "\nSPORTACULAR ANALYTICS — P21 D4"
  );

  console.log(
    "Logout + Post-Logout Security QA\n"
  );

  fs.mkdirSync(
    path.dirname(REPORT_PATH),
    { recursive: true }
  );

  check(
    "Persistent QA browser profile exists",
    fs.existsSync(PROFILE_DIR),
    {
      profilePath: PROFILE_DIR
    }
  );

  if (!fs.existsSync(PROFILE_DIR)) {
    throw new Error(
      "P21 authenticated QA profile does not exist."
    );
  }

  const browserErrors = [];
  const consoleErrors = [];
  const failedRequests = [];
  const httpFailures = [];

  let context = null;

  try {
    context =
      await chromium.launchPersistentContext(
        PROFILE_DIR,
        {
          headless: true
        }
      );

    const pages = context.pages();

    const page =
      pages.length > 0
        ? pages[0]
        : await context.newPage();

    page.on("pageerror", (error) => {
      browserErrors.push(error.message);
    });

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    page.on("requestfailed", (request) => {
      failedRequests.push({
        url: sanitizeUrl(request.url()),
        failure:
          request.failure()?.errorText || "Unknown"
      });
    });

    page.on("response", (response) => {
      if (response.status() >= 400) {
        httpFailures.push({
          url: sanitizeUrl(response.url()),
          status: response.status()
        });
      }
    });

    console.log(
      "=== PRE-LOGOUT AUTHENTICATED STATE ==="
    );

    const navigationResponse =
      await page.goto(AUTH_URL, {
        waitUntil: "domcontentloaded",
        timeout: 30000
      });

    check(
      "Production auth page navigation HTTP 200",
      navigationResponse &&
        navigationResponse.status() === 200,
      {
        status:
          navigationResponse?.status() || null
      }
    );

    await page.waitForTimeout(2000);

    const before =
      await getAuthState(page);

    check(
      "Pre-logout session exists",
      before.hasSession === true,
      {
        error: before.error
      }
    );

    check(
      "Pre-logout authenticated user exists",
      before.hasUser === true
    );

    check(
      "Pre-logout profile exists",
      before.profileFound === true,
      {
        error: before.error
      }
    );

    check(
      "Pre-logout tier is Legend",
      before.tier === "Legend",
      {
        tier: before.tier
      }
    );

    /*
     * Do not perform logout if our prerequisite
     * authenticated Legend state is missing.
     *
     * This prevents a stale profile from producing
     * misleading post-logout evidence.
     */
    if (
      !before.hasSession ||
      !before.hasUser ||
      before.tier !== "Legend"
    ) {
      throw new Error(
        "D4 prerequisite failed: QA profile is not authenticated as Legend."
      );
    }

    console.log(
      "\n=== REAL PRODUCTION LOGOUT ==="
    );

    const logoutButton =
      page.locator("#logout-btn");

    check(
      "Production logout button exists",
      (await logoutButton.count()) === 1
    );

    check(
      "Production logout button is visible",
      await logoutButton.isVisible()
    );

    await logoutButton.click();

    /*
     * The production handler awaits signOut(),
     * updateSessionStatus(), and updateNavAuthState().
     */
    await page.waitForTimeout(2500);

    const after =
      await getAuthState(page);

    check(
      "Session removed after logout",
      after.hasSession === false,
      {
        error: after.error
      }
    );

    check(
      "Authenticated user removed after logout",
      after.hasUser === false
    );

    /*
     * Verify the production page itself reflects
     * the logged-out state.
     */
    const bodyText =
      await page.locator("body").innerText();

    check(
      "Production UI shows logged-out state",
      /Not currently logged in/i.test(bodyText)
    );

    /*
     * Verify persistence: reload the actual production
     * page and make sure the session does not return.
     */
    console.log(
      "\n=== POST-LOGOUT PERSISTENCE ==="
    );

    await page.reload({
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    const afterReload =
      await getAuthState(page);

    check(
      "Logout persists after page reload",
      afterReload.hasSession === false
    );

    check(
      "User remains logged out after reload",
      afterReload.hasUser === false
    );

    /*
     * Now test the deployed premium endpoints from
     * the logged-out browser.
     *
     * No Authorization header is supplied because
     * there should no longer be a legitimate session.
     */
    console.log(
      "\n=== POST-LOGOUT PREMIUM SECURITY ==="
    );

    const premiumResults =
      await page.evaluate(
        async (leagues) => {
          const results = [];

          for (const league of leagues) {
            const url =
              `/.netlify/functions/${league}-props-premium`;

            const response =
              await fetch(url, {
                cache: "no-store"
              });

            const body =
              await response.text();

            let parsed = null;

            try {
              parsed = JSON.parse(body);
            } catch {
              parsed = null;
            }

            results.push({
              league,
              status: response.status,
              contentType:
                response.headers.get(
                  "content-type"
                ) || "",
              hasError:
                Boolean(parsed?.error),
              error:
                parsed?.error || null
            });
          }

          return results;
        },
        LEAGUES
      );

    for (const result of premiumResults) {
      const upper =
        result.league.toUpperCase();

      check(
        `${upper}: premium endpoint rejects logged-out browser`,
        result.status === 401,
        {
          status: result.status,
          error: result.error
        }
      );

      check(
        `${upper}: logged-out response is JSON auth error`,
        result.contentType
          .toLowerCase()
          .includes("json") &&
          result.hasError === true,
        {
          contentType:
            result.contentType,
          error:
            result.error
        }
      );
    }

    console.log(
      "\n=== BROWSER HEALTH ==="
    );

    check(
      "No uncaught JavaScript exceptions",
      browserErrors.length === 0,
      {
        count:
          browserErrors.length,
        errors:
          browserErrors
      }
    );

    check(
      "No failed browser network requests",
      failedRequests.length === 0,
      {
        count:
          failedRequests.length,
        failures:
          failedRequests
      }
    );

    /*
     * HTTP 401s are EXPECTED in this test because
     * we deliberately call protected endpoints after
     * logout. Record them but do not classify them
     * as browser-health failures.
     */
    const expected401s =
      httpFailures.filter(
        (item) =>
          item.status === 401 &&
          item.url.includes(
            "/.netlify/functions/"
          )
      );

    const unexpectedHttpFailures =
      httpFailures.filter(
        (item) =>
          !(
            item.status === 401 &&
            item.url.includes(
              "/.netlify/functions/"
            )
          )
      );

    check(
      "No unexpected HTTP failures",
      unexpectedHttpFailures.length === 0,
      {
        unexpected:
          unexpectedHttpFailures,
        expected401Count:
          expected401s.length
      }
    );

    const passed =
      assertions.filter(
        (item) =>
          item.status === "PASS"
      ).length;

    const failed =
      assertions.filter(
        (item) =>
          item.status === "FAIL"
      ).length;

    const report = {
      phase: "P21",
      deployment: "D4",
      test:
        "Logout + Post-Logout Security QA",
      timestamp:
        new Date().toISOString(),
      productionUrl:
        BASE_URL,
      evidenceType:
        "LIVE_AUTHENTICATED_PLAYWRIGHT_LOGOUT",
      productionModified:
        false,

      preLogout: {
        sessionPresent:
          before.hasSession,
        userPresent:
          before.hasUser,
        profileFound:
          before.profileFound,
        tier:
          before.tier
      },

      postLogout: {
        sessionPresent:
          after.hasSession,
        userPresent:
          after.hasUser
      },

      postReload: {
        sessionPresent:
          afterReload.hasSession,
        userPresent:
          afterReload.hasUser
      },

      premiumAuthorization:
        premiumResults,

      browserHealth: {
        javascriptExceptions:
          browserErrors,
        consoleErrors,
        failedRequests,
        expected401s,
        unexpectedHttpFailures
      },

      note:
        "This test intentionally signed the persistent P21 QA browser profile out.",

      summary: {
        assertions:
          assertions.length,
        passed,
        failed,
        blockers:
          failed
      },

      assertions
    };

    fs.writeFileSync(
      REPORT_PATH,
      JSON.stringify(
        report,
        null,
        2
      )
    );

    console.log(
      "\n=== P21 D4 SUMMARY ==="
    );

    console.log(
      `Assertions: ${assertions.length}`
    );

    console.log(
      `PASS: ${passed}`
    );

    console.log(
      `FAIL: ${failed}`
    );

    console.log(
      `Blockers: ${failed}`
    );

    console.log(
      `Expected protected-endpoint 401s: ${expected401s.length}`
    );

    console.log(
      `Console errors observed: ${consoleErrors.length}`
    );

    console.log(
      `Report: ${REPORT_PATH}`
    );

    console.log(
      failed === 0
        ? "\nP21 D4 STATUS: PASS"
        : "\nP21 D4 STATUS: FAIL — REVIEW REQUIRED"
    );

    process.exitCode =
      failed === 0 ? 0 : 1;
  } finally {
    if (context) {
      await context.close();
    }
  }
}

main().catch((error) => {
  console.error(
    "\nP21 D4 fatal error:",
    error.message
  );

  process.exitCode = 1;
});