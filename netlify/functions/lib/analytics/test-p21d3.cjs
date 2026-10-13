"use strict";

/*
 * SPORTACULAR ANALYTICS
 * P21 D3 — AUTHENTICATED LEGEND PRODUCTION QA
 *
 * Uses the persistent Playwright browser profile created manually
 * by the site owner.
 *
 * READ ONLY:
 * - Does not sign up
 * - Does not change password
 * - Does not change tier
 * - Does not modify profile
 * - Does not log out
 *
 * Tests:
 * 1. Production session persists
 * 2. Production frontend recognizes Legend
 * 3. Supabase session contains an access token
 * 4. All four deployed premium endpoints accept the real Legend token
 * 5. Successful premium responses do not look like auth errors
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
  "p21d3-report.json"
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

function bodyLooksUnauthorized(body) {
  const text = String(body || "").toLowerCase();

  return (
    text.includes("missing or invalid authorization") ||
    text.includes("missing access token") ||
    text.includes("unauthorized user") ||
    text.includes("upgrade required") ||
    text.includes("profile not found")
  );
}

async function main() {
  console.log(
    "\nSPORTACULAR ANALYTICS — P21 D3"
  );

  console.log(
    "Authenticated Legend Production QA\n"
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
      "P21 authenticated Playwright profile does not exist."
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
      "=== AUTHENTICATED BROWSER SESSION ==="
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
          navigationResponse?.status() || null,
        finalUrl: sanitizeUrl(page.url())
      }
    );

    await page.waitForTimeout(2500);

    /*
     * Query the production Supabase client from inside
     * the real deployed browser page.
     *
     * No token is printed or written to the report.
     */
    const authState = await page.evaluate(
      async () => {
        if (
          typeof supabaseClient === "undefined" ||
          !supabaseClient?.auth
        ) {
          return {
            clientAvailable: false,
            hasSession: false,
            hasUser: false,
            hasAccessToken: false,
            tier: null,
            emailPresent: false,
            profileFound: false,
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

        if (sessionError || !session) {
          return {
            clientAvailable: true,
            hasSession: false,
            hasUser: false,
            hasAccessToken: false,
            tier: null,
            emailPresent: false,
            profileFound: false,
            error:
              sessionError?.message ||
              "No active session"
          };
        }

        const user = session.user || null;

        let tier = null;
        let profileFound = false;
        let profileError = null;

        if (user?.id) {
          const {
            data: profile,
            error
          } =
            await supabaseClient
              .from("profiles")
              .select("tier")
              .eq("id", user.id)
              .single();

          if (!error && profile) {
            profileFound = true;
            tier = profile.tier || null;
          } else {
            profileError =
              error?.message || null;
          }
        }

        return {
          clientAvailable: true,
          hasSession: Boolean(session),
          hasUser: Boolean(user?.id),
          hasAccessToken:
            Boolean(session.access_token),
          tier,
          emailPresent:
            Boolean(user?.email),
          profileFound,
          error: profileError
        };
      }
    );

    check(
      "Production Supabase client available",
      authState.clientAvailable === true
    );

    check(
      "Authenticated session persists in QA browser",
      authState.hasSession === true,
      {
        error: authState.error
      }
    );

    check(
      "Authenticated Supabase user exists",
      authState.hasUser === true
    );

    check(
      "Authenticated session contains access token",
      authState.hasAccessToken === true
    );

    check(
      "Authenticated profile exists",
      authState.profileFound === true,
      {
        error: authState.error
      }
    );

    check(
      "Authenticated profile tier is Legend",
      authState.tier === "Legend",
      {
        tier: authState.tier
      }
    );

    check(
      "Authenticated account has email identity",
      authState.emailPresent === true
    );

    /*
     * Verify that the actual production UI recognizes
     * the authenticated state and Legend tier.
     *
     * We intentionally inspect visible text instead of
     * depending on one fragile element ID.
     */
    const visibleBodyText =
      await page.locator("body").innerText();

    check(
      "Production UI visibly recognizes Legend",
      /\bLegend\b/i.test(visibleBodyText)
    );

    console.log(
      "\n=== REAL LEGEND PREMIUM AUTHORIZATION ==="
    );

    /*
     * Requests are made from inside the browser using
     * the same production Supabase session.
     *
     * The token never leaves browser evaluation and is
     * never returned to Node, printed, or written to disk.
     */
    const premiumResults =
      await page.evaluate(
        async (leagues) => {
          const {
            data: initialData,
            error: initialError
          } =
            await supabaseClient.auth.refreshSession();

          let session =
            initialData?.session || null;

          if (initialError || !session) {
            const {
              data: fallbackData,
              error: fallbackError
            } =
              await supabaseClient.auth.getSession();

            if (fallbackError) {
              return leagues.map(
                (league) => ({
                  league,
                  status: null,
                  ok: false,
                  contentType: "",
                  bodyPrefix: "",
                  error:
                    fallbackError.message
                })
              );
            }

            session =
              fallbackData?.session || null;
          }

          const token =
            session?.access_token || "";

          if (!token) {
            return leagues.map(
              (league) => ({
                league,
                status: null,
                ok: false,
                contentType: "",
                bodyPrefix: "",
                error:
                  "No access token available"
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
             * one refresh-and-retry on 401.
             */
            if (response.status === 401) {
              const {
                data: retryData,
                error: retryError
              } =
                await supabaseClient.auth.refreshSession();

              const retryToken =
                retryData?.session
                  ?.access_token || "";

              if (
                !retryError &&
                retryToken
              ) {
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

            results.push({
              league,
              status: response.status,
              ok: response.ok,
              contentType:
                response.headers.get(
                  "content-type"
                ) || "",
              /*
               * Do not write protected CSV content
               * into our evidence report.
               *
               * Only retain enough text to recognize
               * an authentication error.
               */
              bodyPrefix:
                response.ok
                  ? ""
                  : body.slice(0, 300),
              error: null
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
        `${upper}: Legend authenticated request returns HTTP 200`,
        result.status === 200,
        {
          status: result.status,
          contentType: result.contentType,
          error: result.error
        }
      );

      check(
        `${upper}: Legend request accepted by premium authorization`,
        result.ok === true &&
          !bodyLooksUnauthorized(
            result.bodyPrefix
          ),
        {
          status: result.status,
          error: result.error
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
        count: browserErrors.length,
        errors: browserErrors
      }
    );

    /*
     * Console errors and HTTP failures can include
     * unrelated third-party/browser noise, so record
     * them as evidence but only fail on uncaught JS
     * exceptions or failed network requests.
     */

    check(
      "No failed browser network requests",
      failedRequests.length === 0,
      {
        count: failedRequests.length,
        failures: failedRequests
      }
    );

    console.log(
      `Console errors observed: ${consoleErrors.length}`
    );

    console.log(
      `HTTP >=400 responses observed: ${httpFailures.length}`
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
      deployment: "D3",
      test:
        "Authenticated Legend Production QA",
      timestamp:
        new Date().toISOString(),
      productionUrl: BASE_URL,
      evidenceType:
        "LIVE_AUTHENTICATED_PLAYWRIGHT",
      productionModified: false,

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
        premiumResults.map(
          (result) => ({
            league:
              result.league,
            status:
              result.status,
            ok:
              result.ok,
            contentType:
              result.contentType,
            error:
              result.error
          })
        ),

      browserHealth: {
        javascriptExceptions:
          browserErrors,
        consoleErrors,
        failedRequests,
        httpFailures
      },

      notExercised: [
        "Rookie authenticated production account",
        "Veteran authenticated production account",
        "All-Star authenticated production account",
        "Hall-of-Famer authenticated production account",
        "Real password recovery email delivery",
        "Supabase redirect allowlist",
        "Logout/post-logout regression"
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
      "\n=== P21 D3 SUMMARY ==="
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
      `Report: ${REPORT_PATH}`
    );

    console.log(
      failed === 0
        ? "\nP21 D3 STATUS: PASS"
        : "\nP21 D3 STATUS: FAIL — REVIEW REQUIRED"
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
    "\nP21 D3 fatal error:",
    error.message
  );

  process.exitCode = 1;
});