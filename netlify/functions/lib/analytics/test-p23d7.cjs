const fs = require("fs");
const path = require("path");
const {
  chromium,
  firefox,
  webkit
} = require("playwright");

const BASE_URL =
  "https://sportacularanalytics.com";

const REPORT_PATH =
  path.join(
    process.cwd(),
    "p23-evidence",
    "p23d7-report.json"
  );

const VIEWPORT = {
  width: 390,
  height: 844
};

const ENGINES = [
  ["Chromium", chromium],
  ["Firefox", firefox],
  ["WebKit", webkit]
];

const SURFACES = [
  ["Home", "/index.html"],
  ["NBA Game Odds", "/nba-odds.html"],
  ["NBA Player Trends", "/nba-trends.html"],
  ["Auth", "/auth.html"],
  ["Pricing", "/pricing.html"],
  ["NBA Player Props", "/nba-props.html"],
  ["NBA Team Trends", "/nba-team-trends.html"],
  [
    "NBA Player Directory",
    "/nba-player-profiles.html"
  ],
  [
    "NBA Team Directory",
    "/nba-team-profiles.html"
  ]
];

function cleanError(error) {
  return String(
    error?.message ||
    error ||
    "Unknown error"
  );
}

(async () => {
  console.log(
    "=== P23 D7 — CROSS-BROWSER RUNTIME HEALTH QA ==="
  );

  console.log(
    `Target: ${BASE_URL}`
  );

  console.log(
    `Viewport: ${VIEWPORT.width}x${VIEWPORT.height}`
  );

  const results = [];

  let assertions = 0;
  let assertionPass = 0;
  let assertionFail = 0;

  for (
    const [engineName, engine]
    of ENGINES
  ) {
    const browser =
      await engine.launch({
        headless: true
      });

    for (
      const [surfaceName, route]
      of SURFACES
    ) {
      const context =
        await browser.newContext({
          viewport: VIEWPORT,
          hasTouch: true
        });

      const page =
        await context.newPage();

      const pageErrors = [];
      const consoleErrors = [];
      const failedRequests = [];
      const httpFailures = [];
      const premiumRequests = [];

      page.on(
        "pageerror",
        error => {
          pageErrors.push(
            cleanError(error)
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
            url: request.url(),
            error:
              request.failure()
                ?.errorText ||
              "unknown"
          });
        }
      );

      page.on(
        "request",
        request => {
          if (
            request.url().includes(
              "/.netlify/functions/nba-props-premium"
            )
          ) {
            premiumRequests.push(
              request.url()
            );
          }
        }
      );

      page.on(
        "response",
        response => {
          if (
            response.status() >= 400
          ) {
            httpFailures.push({
              status:
                response.status(),
              url:
                response.url()
            });
          }
        }
      );

      let mainHTTP = null;
      let navigationError = null;

      try {
        const response =
          await page.goto(
            BASE_URL + route,
            {
              waitUntil:
                "domcontentloaded",
              timeout: 30000
            }
          );

        mainHTTP =
          response?.status() ??
          null;

        await page.waitForTimeout(
          5000
        );
      } catch (error) {
        navigationError =
          cleanError(error);

        pageErrors.push(
          `NAVIGATION: ${navigationError}`
        );
      }

      let propsState = null;

      if (
        route ===
        "/nba-props.html"
      ) {
        propsState =
          await page.evaluate(
            () => {
              const bodyText =
                document.body
                  ?.innerText ||
                "";

              return {
                loginRequired:
                  /login required/i
                    .test(bodyText),

                notLoggedIn:
                  /not logged in/i
                    .test(bodyText),

                disabledControls:
                  [
                    ...document
                      .querySelectorAll(
                        "select:disabled, button:disabled"
                      )
                  ].length,

                overflow:
                  document
                    .documentElement
                    .scrollWidth >
                  window.innerWidth
              };
            }
          );
      }

      const checks = [
        [
          "Main HTTP 200",
          mainHTTP === 200
        ],
        [
          "No page errors",
          pageErrors.length === 0
        ],
        [
          "No console errors",
          consoleErrors.length === 0
        ],
        [
          "No failed requests",
          failedRequests.length === 0
        ],
        [
          "No unexpected HTTP failures",
          httpFailures.length === 0
        ]
      ];

      if (
        route ===
        "/nba-props.html"
      ) {
        checks.push(
          [
            "Logged-out Props shows Login Required",
            propsState
              ?.loginRequired === true
          ],
          [
            "Logged-out Props shows Not Logged In",
            propsState
              ?.notLoggedIn === true
          ],
          [
            "Logged-out Props controls disabled",
            propsState
              ?.disabledControls >= 5
          ],
          [
            "Logged-out Props makes no premium request",
            premiumRequests.length === 0
          ],
          [
            "Logged-out Props has no horizontal overflow",
            propsState
              ?.overflow === false
          ]
        );
      }

      let passed = 0;

      for (
        const [, ok]
        of checks
      ) {
        assertions++;

        if (ok) {
          assertionPass++;
          passed++;
        } else {
          assertionFail++;
        }
      }

      const caseStatus =
        passed === checks.length
          ? "PASS"
          : "FAIL";

      console.log(
        `${caseStatus} | ` +
        `${engineName} | ` +
        `${surfaceName} | ` +
        `${passed}/${checks.length}`
      );

      results.push({
        engine: engineName,
        surface: surfaceName,
        route,
        viewport: VIEWPORT,
        mainHTTP,
        navigationError,
        checks:
          checks.map(
            ([name, pass]) => ({
              name,
              pass
            })
          ),
        pageErrors,
        consoleErrors,
        failedRequests,
        httpFailures,
        premiumRequests,
        propsState,
        status: caseStatus
      });

      await context.close();
    }

    await browser.close();
  }

  const casePass =
    results.filter(
      result =>
        result.status === "PASS"
    ).length;

  const caseFail =
    results.length -
    casePass;

  const report = {
    milestone: "P23",
    deployment: "D7",
    title:
      "Cross-Browser Runtime Health QA",
    target: BASE_URL,
    viewport: VIEWPORT,
    engines:
      ENGINES.map(
        ([name]) => name
      ),
    surfaces:
      SURFACES.map(
        ([name, route]) => ({
          name,
          route
        })
      ),
    summary: {
      cases: results.length,
      casePass,
      caseFail,
      assertions,
      assertionPass,
      assertionFail,
      notExercised: 0,
      status:
        caseFail === 0 &&
        assertionFail === 0
          ? "PASS"
          : "FAIL"
    },
    results
  };

  fs.mkdirSync(
    path.dirname(
      REPORT_PATH
    ),
    {
      recursive: true
    }
  );

  fs.writeFileSync(
    REPORT_PATH,
    JSON.stringify(
      report,
      null,
      2
    ) + "\n"
  );

  console.log(
    "\n=== RESULT ==="
  );

  console.log(
    `CASES: ${results.length}`
  );

  console.log(
    `CASE PASS: ${casePass}`
  );

  console.log(
    `CASE FAIL: ${caseFail}`
  );

  console.log(
    `ASSERTIONS: ${assertions}`
  );

  console.log(
    `ASSERTION PASS: ${assertionPass}`
  );

  console.log(
    `ASSERTION FAIL: ${assertionFail}`
  );

  console.log(
    "NOT_EXERCISED: 0"
  );

  console.log(
    `STATUS: ${report.summary.status}`
  );

  console.log(
    `REPORT: ${REPORT_PATH}`
  );

  if (
    report.summary.status !==
    "PASS"
  ) {
    process.exitCode = 1;
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
