"use strict";

/*
 * SPORTACULAR ANALYTICS
 * P21 D5D — AUTHENTICATED HALL-OF-FAMER PRODUCTION QA
 *
 * Uses the isolated persistent Hall-of-Famer Playwright profile.
 *
 * READ ONLY:
 * - Does not change password
 * - Does not change tier
 * - Does not change subscription
 * - Does not modify profile
 * - Does not log out
 *
 * Proves:
 * 1. Real production Hall-of-Famer session persists.
 * 2. Real profiles.tier resolves to Hall-of-Famer.
 * 3. Production UI recognizes Hall-of-Famer.
 * 4. NBA/NHL/MLB/NFL premium Player Props endpoints
 *    authorize the authenticated Hall-of-Famer account.
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
  "p21-hof-auth-profile"
);

const REPORT_PATH = path.join(
  ROOT,
  "p21-evidence",
  "p21d5d-report.json"
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
    "\nSPORTACULAR ANALYTICS — P21 D5D"
  );

  console.log(
    "Authenticated Hall-of-Famer Production QA\n"
  );

  fs.mkdirSync(
    path.dirname(REPORT_PATH),
    { recursive: true }
  );

  check(
    "Persistent Hall-of-Famer QA browser profile exists",
    fs.existsSync(PROFILE_DIR),
    {
      profilePath: PROFILE_DIR
    }
  );

  if (!fs.existsSync(PROFILE_DIR)) {
    throw new Error(
      "Hall-of-Famer QA browser profile does not exist."
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
      "=== AUTHENTICATED HALL-OF-FAMER SESSION ==="
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
      "Hall-of-Famer authenticated session persists",
      authState.hasSession === true,
      {
        error: authState.error
      }
    );

    check(
      "Hall-of-Famer authenticated user exists",
      authState.hasUser === true
    );

    check(
      "Hall-of-Famer session contains access token",
      authState.hasAccessToken === true
    );

    check(
      "Hall-of-Famer profile exists",
      authState.profileFound === true,
      {
        error: authState.error
      }
    );

    check(
      "Authenticated profile tier is Hall-of-Famer",
      authState.tier === "Hall-of-Famer",
      {
        tier: authState.tier
      }
    );

    check(
      "Hall-of-Famer account has email identity",
      authState.emailPresent === true
    );

    const bodyText =
      await page.locator("body").innerText();

    check(
      "Production UI visibly recognizes Hall-of-Famer",
      /\bHall-of-Famer\b/i.test(bodyText)
    );

    console.log(
      "\n=== REAL HALL-OF-FAMER PREMIUM AUTHORIZATION ==="
    );

    /*
     * The real access token remains inside the browser
     * context and is never printed or written to disk.
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
             * A protected source may legitimately contain
             * only its CSV header if there are no current
             * props. That still proves protected-source
             * delivery.
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
        `${upper}: Hall-of-Famer authenticated request returns HTTP 200`,
        result.status === 200,
        {
          status: result.status,
          error: result.error,
          apiError: result.apiError
        }
      );

      check(
        `${upper}: Hall-of-Famer premium response is not authorization-error JSON`,
        !result.apiError,
        {
          apiError: result.apiError
        }
      );

      check(
        `${upper}: Hall-of-Famer premium response contains body`,
        result.bodyLength > 0,
        {
          bodyLength:
            result.bodyLength
        }
      );

      check(
        `${upper}: Hall-of-Famer premium response has Player Props CSV structure`,
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
      deployment: "D5D",
      test:
        "Authenticated Hall-of-Famer Production QA",
      timestamp:
        new Date().toISOString(),
      productionUrl:
        BASE_URL,
      evidenceType:
        "LIVE_AUTHENTICATED_PLAYWRIGHT_HALL_OF_FAMER",
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
        "Hall-of-Famer visual Player Props maxPropsToShow=25 behavior",
        "Hall-of-Famer Top Bet visible-state behavior",
        "Hall-of-Famer Game Odds visual access"
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
      "\n=== P21 D5D SUMMARY ==="
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
        ? "\nP21 D5D STATUS: PASS"
        : "\nP21 D5D STATUS: FAIL — REVIEW REQUIRED"
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
    "\nP21 D5D fatal error:",
    error.message
  );

  process.exitCode = 1;
});