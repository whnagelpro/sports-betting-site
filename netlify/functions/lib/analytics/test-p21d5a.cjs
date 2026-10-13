"use strict";

/*
 * SPORTACULAR ANALYTICS
 * P21 D5A — AUTHENTICATED ROOKIE PRODUCTION QA
 *
 * Uses the isolated persistent Rookie Playwright profile.
 *
 * READ ONLY:
 * - Does not change password
 * - Does not change tier
 * - Does not change subscription
 * - Does not modify profile
 * - Does not log out
 *
 * Proves:
 * 1. Real production Rookie session persists.
 * 2. Real profiles.tier resolves to Rookie.
 * 3. Production UI recognizes Rookie.
 * 4. NBA/NHL/MLB/NFL premium Player Props endpoints
 *    reject the authenticated Rookie account with HTTP 403.
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
  "p21-rookie-auth-profile"
);

const REPORT_PATH = path.join(
  ROOT,
  "p21-evidence",
  "p21d5a-report.json"
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
    "\nSPORTACULAR ANALYTICS — P21 D5A"
  );

  console.log(
    "Authenticated Rookie Production QA\n"
  );

  fs.mkdirSync(
    path.dirname(REPORT_PATH),
    { recursive: true }
  );

  check(
    "Persistent Rookie QA browser profile exists",
    fs.existsSync(PROFILE_DIR),
    {
      profilePath: PROFILE_DIR
    }
  );

  if (!fs.existsSync(PROFILE_DIR)) {
    throw new Error(
      "Rookie QA browser profile does not exist."
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
      "=== AUTHENTICATED ROOKIE SESSION ==="
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

    /*
     * Read the real Supabase session and profile from
     * inside the deployed production page.
     *
     * The access token is never returned to Node.
     */
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
      "Rookie authenticated session persists",
      authState.hasSession === true,
      {
        error: authState.error
      }
    );

    check(
      "Rookie authenticated user exists",
      authState.hasUser === true
    );

    check(
      "Rookie session contains access token",
      authState.hasAccessToken === true
    );

    check(
      "Rookie profile exists",
      authState.profileFound === true,
      {
        error: authState.error
      }
    );

    check(
      "Authenticated profile tier is Rookie",
      authState.tier === "Rookie",
      {
        tier: authState.tier
      }
    );

    check(
      "Rookie account has email identity",
      authState.emailPresent === true
    );

    const bodyText =
      await page.locator("body").innerText();

    check(
      "Production UI visibly recognizes Rookie",
      /\bRookie\b/i.test(bodyText)
    );

    console.log(
      "\n=== REAL ROOKIE PREMIUM AUTHORIZATION ==="
    );

    /*
     * Use the real production session token entirely
     * inside the browser context.
     *
     * We expect 403 — authenticated, but insufficient tier.
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
                  returnedProtectedCsv: false
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
                returnedProtectedCsv: false
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
             * retry once only if the token is rejected
             * as unauthenticated (401).
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

            let parsed = null;

            try {
              parsed = JSON.parse(body);
            } catch {
              parsed = null;
            }

            const trimmed =
              body.trim();

            const returnedProtectedCsv =
              trimmed.startsWith("Game Id,") ||
              trimmed.startsWith("Game Date,") ||
              trimmed.startsWith("Player,");

            results.push({
              league,
              status: response.status,
              contentType:
                response.headers.get(
                  "content-type"
                ) || "",
              error: null,
              apiError:
                parsed?.error || null,
              message:
                parsed?.message || null,
              returnedProtectedCsv
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
        `${upper}: Rookie authenticated request returns HTTP 403`,
        result.status === 403,
        {
          status: result.status,
          apiError: result.apiError,
          error: result.error
        }
      );

      check(
        `${upper}: Rookie receives upgrade-required response`,
        result.apiError === "Upgrade required",
        {
          status: result.status,
          apiError: result.apiError
        }
      );

      check(
        `${upper}: Rookie receives JSON denial response`,
        result.contentType
          .toLowerCase()
          .includes("json"),
        {
          contentType:
            result.contentType
        }
      );

      check(
        `${upper}: Rookie receives no protected CSV`,
        result.returnedProtectedCsv === false
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
     * Four 403 responses are expected because this
     * is an authenticated-but-insufficient-tier test.
     */
    const expected403s =
      httpFailures.filter(
        (item) =>
          item.status === 403 &&
          item.url.includes(
            "/.netlify/functions/"
          )
      );

    const unexpectedHttpFailures =
      httpFailures.filter(
        (item) =>
          !(
            item.status === 403 &&
            item.url.includes(
              "/.netlify/functions/"
            )
          )
      );

    check(
      "Four expected premium HTTP 403 responses observed",
      expected403s.length === 4,
      {
        count:
          expected403s.length
      }
    );

    check(
      "No unexpected HTTP failures",
      unexpectedHttpFailures.length === 0,
      {
        unexpected:
          unexpectedHttpFailures
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
      deployment: "D5A",
      test:
        "Authenticated Rookie Production QA",
      timestamp:
        new Date().toISOString(),
      productionUrl:
        BASE_URL,
      evidenceType:
        "LIVE_AUTHENTICATED_PLAYWRIGHT_ROOKIE",
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
        expected403s,
        unexpectedHttpFailures
      },

      notExercised: [
        "Veteran authenticated production account",
        "All-Star authenticated production account",
        "Hall-of-Famer authenticated production account",
        "Rookie visual Player Props locked-state page",
        "Rookie Game Odds visual access"
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
      "\n=== P21 D5A SUMMARY ==="
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
      `Expected premium 403s: ${expected403s.length}`
    );

    console.log(
      `Console errors observed: ${consoleErrors.length}`
    );

    console.log(
      `Report: ${REPORT_PATH}`
    );

    console.log(
      failed === 0
        ? "\nP21 D5A STATUS: PASS"
        : "\nP21 D5A STATUS: FAIL — REVIEW REQUIRED"
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
    "\nP21 D5A fatal error:",
    error.message
  );

  process.exitCode = 1;
});