"use strict";

/*
 * SPORTACULAR ANALYTICS
 * P21 D5C — AUTHENTICATED ALL-STAR PRODUCTION QA
 *
 * Uses the isolated persistent All-Star Playwright profile.
 *
 * READ ONLY:
 * - Does not change password
 * - Does not change tier
 * - Does not change subscription
 * - Does not modify profile
 * - Does not log out
 *
 * Proves:
 * 1. Real production All-Star session persists.
 * 2. Real profiles.tier resolves to All-Star.
 * 3. Production UI recognizes All-Star.
 * 4. NBA/NHL/MLB/NFL premium Player Props endpoints
 *    authorize the authenticated All-Star account.
 * 5. Successful premium responses are CSV and not
 *    authorization/error JSON.
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
  "p21-allstar-auth-profile"
);

const REPORT_PATH = path.join(
  ROOT,
  "p21-evidence",
  "p21d5c-report.json"
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

async function main() {
  console.log(
    "\nSPORTACULAR ANALYTICS — P21 D5C"
  );

  console.log(
    "Authenticated All-Star Production QA\n"
  );

  fs.mkdirSync(
    path.dirname(REPORT_PATH),
    { recursive: true }
  );

  check(
    "Persistent All-Star QA browser profile exists",
    fs.existsSync(PROFILE_DIR),
    {
      profilePath: PROFILE_DIR
    }
  );

  if (!fs.existsSync(PROFILE_DIR)) {
    throw new Error(
      "All-Star QA browser profile does not exist."
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
      "=== AUTHENTICATED ALL-STAR SESSION ==="
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

    const authState =
      await page.evaluate(async () => {
        if (
          typeof supabaseClient === "undefined" ||
          !supabaseClient?.auth
        ) {
          return {
            clientAvailable: false,
            hasSession: false,
            hasUser: false,
            hasAccessToken: false,
            profileFound: false,
            tier: null,
            emailPresent: false,
            error: "Supabase client unavailable"
          };
        }

        const {
          data: sessionData,
          error: sessionError
        } =
          await supabaseClient.auth.getSession();

        const session =
          sessionData?.session || null;

        if (sessionError || !session?.user) {
          return {
            clientAvailable: true,
            hasSession: false,
            hasUser: false,
            hasAccessToken: false,
            profileFound: false,
            tier: null,
            emailPresent: false,
            error:
              sessionError?.message ||
              "No active session"
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
          hasUser: Boolean(user.id),
          hasAccessToken:
            Boolean(session.access_token),
          profileFound:
            Boolean(profile && !profileError),
          tier:
            profile?.tier || null,
          emailPresent:
            Boolean(user.email),
          error:
            profileError?.message || null
        };
      });

    check(
      "Production Supabase client available",
      authState.clientAvailable === true
    );

    check(
      "All-Star authenticated session persists",
      authState.hasSession === true,
      {
        error: authState.error
      }
    );

    check(
      "All-Star authenticated user exists",
      authState.hasUser === true
    );

    check(
      "All-Star session contains access token",
      authState.hasAccessToken === true
    );

    check(
      "All-Star profile exists",
      authState.profileFound === true,
      {
        error: authState.error
      }
    );

    check(
      "Authenticated profile tier is All-Star",
      authState.tier === "All-Star",
      {
        tier: authState.tier
      }
    );

    check(
      "All-Star account has email identity",
      authState.emailPresent === true
    );

    const bodyText =
      await page.locator("body").innerText();

    check(
      "Production UI visibly recognizes All-Star",
      /\bAll-Star\b/i.test(bodyText)
    );

    console.log(
      "\n=== REAL ALL-STAR PREMIUM AUTHORIZATION ==="
    );

    /*
     * The access token remains inside the browser.
     * It is never printed or written to the report.
     */
    const premiumResults =
      await page.evaluate(
        async (leagues) => {
          const {
            data: refreshedData,
            error: refreshError
          } =
            await supabaseClient.auth.refreshSession();

          let session =
            refreshedData?.session || null;

          if (refreshError || !session) {
            const {
              data: sessionData,
              error: sessionError
            } =
              await supabaseClient.auth.getSession();

            if (sessionError) {
              return leagues.map(
                (league) => ({
                  league,
                  status: null,
                  contentType: "",
                  error: sessionError.message,
                  apiError: null,
                  bodyLength: 0,
                  looksLikeCsv: false
                })
              );
            }

            session =
              sessionData?.session || null;
          }

          const token =
            session?.access_token || "";

          if (!token) {
            return leagues.map(
              (league) => ({
                league,
                status: null,
                contentType: "",
                error: "No access token available",
                apiError: null,
                bodyLength: 0,
                looksLikeCsv: false
              })
            );
          }

          const results = [];

          for (const league of leagues) {
            const url =
              `/.netlify/functions/${league}-props-premium`;

            let response =
              await fetch(url, {
                headers: {
                  Authorization:
                    `Bearer ${token}`
                },
                cache: "no-store"
              });

            /*
             * Mirror production behavior:
             * refresh and retry once if authentication
             * unexpectedly returns 401.
             */
            if (response.status === 401) {
              const {
                data: retryData,
                error: retryError
              } =
                await supabaseClient.auth.refreshSession();

              const retryToken =
                retryData?.session?.access_token || "";

              if (!retryError && retryToken) {
                response =
                  await fetch(url, {
                    headers: {
                      Authorization:
                        `Bearer ${retryToken}`
                    },
                    cache: "no-store"
                  });
              }
            }

            const body =
              await response.text();

            const contentType =
              response.headers.get(
                "content-type"
              ) || "";

            let parsed = null;

            try {
              parsed = JSON.parse(body);
            } catch {
              parsed = null;
            }

            /*
             * Successful protected sources may contain
             * only the CSV header when there are no
             * current props. That is still valid CSV.
             *
             * We therefore validate CSV structurally
             * rather than requiring live player rows.
             */
            const firstLine =
              body
                .split(/\r?\n/)
                .find(
                  (line) =>
                    line.trim().length > 0
                ) || "";

            const normalizedHeader =
              firstLine
                .replace(/^\uFEFF/, "")
                .trim();

            const headerColumns =
              normalizedHeader
                .split(",")
                .map(
                  (value) =>
                    value
                      .replace(/^"|"$/g, "")
                      .trim()
                );

            const looksLikeCsv =
              headerColumns.includes("Game Id") &&
              headerColumns.includes("Player Id") &&
              headerColumns.includes("Vendor") &&
              headerColumns.includes("Prop Type");

            results.push({
              league,
              status: response.status,
              contentType,
              error: null,
              apiError:
                parsed?.error || null,
              bodyLength:
                body.length,
              looksLikeCsv
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
        `${upper}: All-Star authenticated request returns HTTP 200`,
        result.status === 200,
        {
          status: result.status,
          error: result.error,
          apiError: result.apiError
        }
      );

      check(
        `${upper}: All-Star premium response is not authorization-error JSON`,
        !result.apiError,
        {
          apiError: result.apiError
        }
      );

      check(
        `${upper}: All-Star premium response contains body`,
        result.bodyLength > 0,
        {
          bodyLength:
            result.bodyLength
        }
      );

      check(
        `${upper}: All-Star premium response has Player Props CSV structure`,
        result.looksLikeCsv === true,
        {
          contentType:
            result.contentType,
          bodyLength:
            result.bodyLength
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
      "No console errors",
      consoleErrors.length === 0,
      {
        count:
          consoleErrors.length,
        errors:
          consoleErrors
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

    check(
      "No HTTP failures",
      httpFailures.length === 0,
      {
        count:
          httpFailures.length,
        failures:
          httpFailures
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
      deployment: "D5C",
      test:
        "Authenticated All-Star Production QA",
      timestamp:
        new Date().toISOString(),
      productionUrl:
        BASE_URL,
      evidenceType:
        "LIVE_AUTHENTICATED_PLAYWRIGHT_ALL_STAR",
      productionModified:
        false,

      accountEvidence: {
        sessionPresent:
          authState.hasSession,
        userPresent:
          authState.hasUser,
        emailIdentityPresent:
          authState.emailPresent,
        profileFound:
          authState.profileFound,
        tier:
          authState.tier
      },

      premiumAuthorization:
        premiumResults,

      browserHealth: {
        javascriptExceptions:
          browserErrors,
        consoleErrors,
        failedRequests,
        httpFailures
      },

      notExercised: [
        "Hall-of-Famer authenticated production account",
        "All-Star visual Player Props maxPropsToShow=10 behavior",
        "All-Star Top Bet hidden-state behavior",
        "All-Star Game Odds visual access"
      ],

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
      "\n=== P21 D5C SUMMARY ==="
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
      `Console errors observed: ${consoleErrors.length}`
    );

    console.log(
      `HTTP failures observed: ${httpFailures.length}`
    );

    console.log(
      `Report: ${REPORT_PATH}`
    );

    console.log(
      failed === 0
        ? "\nP21 D5C STATUS: PASS"
        : "\nP21 D5C STATUS: FAIL — REVIEW REQUIRED"
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
    "\nP21 D5C fatal error:",
    error.message
  );

  process.exitCode = 1;
});