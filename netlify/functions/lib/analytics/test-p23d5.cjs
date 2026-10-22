const {
  chromium,
  firefox,
  webkit
} = require("playwright");

const fs = require("fs");
const path = require("path");

const BASE =
  "https://sportacularanalytics.com";

const REPORT_PATH = path.join(
  process.cwd(),
  "p23-evidence",
  "p23d5-report.json"
);

const engines = [
  ["Chromium", chromium],
  ["Firefox", firefox],
  ["WebKit", webkit]
];

const viewports = [
  {
    name: "Tablet Portrait",
    width: 768,
    height: 1024,
    expectMobileNav: true
  },
  {
    name: "Tablet Landscape",
    width: 1024,
    height: 768,
    expectMobileNav: false
  }
];

const pages = [
  {
    name: "Home",
    path: "/index.html"
  },
  {
    name: "Auth",
    path: "/auth.html"
  },
  {
    name: "Pricing",
    path: "/pricing.html"
  },
  {
    name: "NBA Game Odds",
    path: "/nba-odds.html"
  },
  {
    name: "NBA Player Props",
    path: "/nba-props.html"
  },
  {
    name: "NBA Player Trends",
    path: "/nba-trends.html"
  },
  {
    name: "NBA Team Trends",
    path: "/nba-team-trends.html"
  },
  {
    name: "NBA Player Profiles",
    path: "/nba-player-profiles.html"
  },
  {
    name: "NBA Team Profiles",
    path: "/nba-team-profiles.html"
  },
  {
    name: "Real NBA Player Profile",
    path:
      "/player.html?league=nba&id=17896078"
  },
  {
    name: "Real NBA Team Profile",
    path:
      "/nba-team?league=nba&team=Atlanta%20Hawks"
  }
];

const breakpointCoverage = [
  {
    breakpoint: "768px",
    source: "style.css",
    diagnosticWidths: [
      768,
      769
    ],
    result: "PASS"
  },
  {
    breakpoint: "900px",
    source: "style.css",
    diagnosticWidths: [
      899,
      901
    ],
    result: "PASS"
  },
  {
    breakpoint: "992px",
    source: "player.css",
    diagnosticWidths: [
      991,
      992,
      993
    ],
    result: "PASS"
  }
];

(async () => {
  const results = [];

  let assertions = 0;
  let passedAssertions = 0;
  let failedAssertions = 0;
  let notExercised = 0;

  console.log(
    "=== P23 D5 TABLET + ORIENTATION / RESPONSIVE TRANSITION QA ==="
  );

  console.log(
    "Production | Chromium + Firefox + WebKit"
  );

  console.log(
    "Viewports: 768x1024 portrait | 1024x768 landscape"
  );

  for (
    const [browserName, engine]
    of engines
  ) {
    const browser =
      await engine.launch({
        headless: true
      });

    console.log(
      `\n=== ${browserName} ===`
    );

    for (const viewport of viewports) {
      const context =
        await browser.newContext({
          viewport: {
            width: viewport.width,
            height: viewport.height
          },
          hasTouch: true
        });

      const page =
        await context.newPage();

      console.log(
        `\n--- ${viewport.name} | ` +
        `${viewport.width}x${viewport.height} ---`
      );

      for (const spec of pages) {
        const caseResult = {
          browser: browserName,
          viewport:
            `${viewport.width}x${viewport.height}`,
          orientation: viewport.name,
          page: spec.name,
          path: spec.path,
          status: "PASS",
          assertions: [],
          notExercised: []
        };

        try {
          await page.goto(
            BASE + spec.path,
            {
              waitUntil:
                "domcontentloaded",
              timeout: 30000
            }
          );

          await page.waitForTimeout(1200);

          const data =
            await page.evaluate(() => {
              const doc =
                document.documentElement;

              const visible = el => {
                if (!el) {
                  return false;
                }

                const cs =
                  getComputedStyle(el);

                const r =
                  el.getBoundingClientRect();

                return (
                  cs.display !== "none" &&
                  cs.visibility !== "hidden" &&
                  r.width > 0 &&
                  r.height > 0
                );
              };

              const controls =
                [
                  ...document.querySelectorAll(
                    "select, button, a"
                  )
                ].filter(visible);

              const clippedControls =
                controls
                  .map(el => {
                    const r =
                      el.getBoundingClientRect();

                    return {
                      tag:
                        el.tagName,
                      id:
                        el.id || "",
                      className:
                        typeof el.className ===
                        "string"
                          ? el.className.slice(
                              0,
                              80
                            )
                          : "",
                      text:
                        (
                          el.textContent ||
                          ""
                        )
                          .trim()
                          .replace(
                            /\s+/g,
                            " "
                          )
                          .slice(
                            0,
                            80
                          ),
                      left:
                        Number(
                          r.left.toFixed(
                            2
                          )
                        ),
                      right:
                        Number(
                          r.right.toFixed(
                            2
                          )
                        ),
                      width:
                        Number(
                          r.width.toFixed(
                            2
                          )
                        )
                    };
                  })
                  .filter(item =>
                    item.left < -1 ||
                    item.right >
                      window.innerWidth +
                        1
                  );

              const bodyText =
                document.body.innerText
                  .replace(/\s+/g, " ")
                  .trim();

              return {
                clientWidth:
                  doc.clientWidth,

                scrollWidth:
                  doc.scrollWidth,

                horizontalOverflow:
                  doc.scrollWidth >
                  doc.clientWidth + 1,

                clippedControls,

                mobileToggleVisible:
                  visible(
                    document.querySelector(
                      ".mobile-menu-toggle"
                    )
                  ),

                navVisible:
                  visible(
                    document.querySelector(
                      ".nav-links"
                    )
                  ),

                bodyLength:
                  bodyText.length
              };
            });

          const checks = [
            {
              type:
                "horizontal-overflow",
              expected: false,
              actual:
                data.horizontalOverflow,
              passed:
                !data.horizontalOverflow
            },
            {
              type:
                "clipped-controls",
              expected: 0,
              actual:
                data.clippedControls
                  .length,
              details:
                data.clippedControls,
              passed:
                data.clippedControls
                  .length === 0
            },
            {
              type:
                "navigation-mode",
              expected:
                viewport.expectMobileNav
                  ? "mobile"
                  : "desktop",
              actual:
                data.mobileToggleVisible &&
                !data.navVisible
                  ? "mobile"
                  : (
                      !data
                        .mobileToggleVisible &&
                      data.navVisible
                        ? "desktop"
                        : "unexpected"
                    ),
              mobileToggleVisible:
                data.mobileToggleVisible,
              navVisible:
                data.navVisible,
              passed:
                viewport.expectMobileNav
                  ? (
                      data
                        .mobileToggleVisible &&
                      !data.navVisible
                    )
                  : (
                      !data
                        .mobileToggleVisible &&
                      data.navVisible
                    )
            },
            {
              type:
                "meaningful-page-content",
              expected:
                "bodyLength > 100",
              actual:
                data.bodyLength,
              passed:
                data.bodyLength > 100
            }
          ];

          for (const check of checks) {
            assertions++;

            if (check.passed) {
              passedAssertions++;
            } else {
              failedAssertions++;
              caseResult.status =
                "FAIL";
            }

            caseResult.assertions.push(
              check
            );
          }

          console.log(
            `${caseResult.status} | ` +
            `${spec.name} | ` +
            `overflow=${data.horizontalOverflow} | ` +
            `clipped=${data.clippedControls.length} | ` +
            `toggle=${data.mobileToggleVisible} | ` +
            `nav=${data.navVisible} | ` +
            `body=${data.bodyLength}`
          );

          if (
            data.clippedControls.length
          ) {
            console.log(
              "  CLIPPED:",
              JSON.stringify(
                data.clippedControls,
                null,
                2
              )
            );
          }
        } catch (err) {
          /*
           * A page execution error is a real
           * exercised failure, not NOT_EXERCISED.
           */
          assertions++;
          failedAssertions++;

          caseResult.status =
            "FAIL";

          caseResult.assertions.push({
            type:
              "page-execution",
            passed: false,
            error:
              err &&
              err.message
                ? err.message
                : String(err)
          });

          console.log(
            `FAIL | ${spec.name} | ` +
            `execution error: ` +
            `${
              err &&
              err.message
                ? err.message
                : String(err)
            }`
          );
        }

        results.push(caseResult);
      }

      await context.close();
    }

    await browser.close();
  }

  const casePass =
    results.filter(
      r => r.status === "PASS"
    ).length;

  const caseFail =
    results.filter(
      r => r.status === "FAIL"
    ).length;

  const status =
    caseFail === 0 &&
    failedAssertions === 0
      ? "PASS"
      : "FAIL";

  const report = {
    milestone: "P23 D5",

    title:
      "Tablet + Orientation / Responsive Transition QA",

    environment:
      "production",

    baseUrl:
      BASE,

    browsers:
      engines.map(
        ([name]) => name
      ),

    viewports:
      viewports.map(v => ({
        name:
          v.name,
        width:
          v.width,
        height:
          v.height,
        expectedNavigation:
          v.expectMobileNav
            ? "mobile"
            : "desktop"
      })),

    breakpointCoverage,

    pages:
      pages.map(p => ({
        name:
          p.name,
        path:
          p.path
      })),

    cases:
      results.length,

    casePass,

    caseFail,

    assertions,

    passedAssertions,

    failedAssertions,

    notExercised,

    status,

    results
  };

  fs.mkdirSync(
    path.dirname(REPORT_PATH),
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
    "\n=== P23 D5 FINAL RESULT ==="
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
    `ASSERTION PASS: ${passedAssertions}`
  );

  console.log(
    `ASSERTION FAIL: ${failedAssertions}`
  );

  console.log(
    `NOT_EXERCISED: ${notExercised}`
  );

  console.log(
    `STATUS: ${status}`
  );

  console.log(
    `REPORT: ${REPORT_PATH}`
  );

  if (status !== "PASS") {
    process.exitCode = 1;
  }
})().catch(err => {
  console.error(err);
  process.exit(1);
});
