const { chromium, firefox, webkit } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = "https://sportacularanalytics.com";

const REPORT_PATH = path.join(
  process.cwd(),
  "p23-evidence",
  "p23d4-report.json"
);

const engines = [
  ["Chromium", chromium],
  ["Firefox", firefox],
  ["WebKit", webkit]
];

const viewport = {
  width: 390,
  height: 844
};

const pages = [
  {
    name: "Auth",
    path: "/auth.html",
    selectors: [
      "#login-email",
      "#login-password",
      "#login-form button"
    ]
  },
  {
    name: "Pricing",
    path: "/pricing.html",
    selectors: [
      ".billing-switch",
      ".billing-slider",
      ".pricing-btn"
    ]
  },
  {
    name: "NBA Game Odds",
    path: "/nba-odds.html",
    selectors: [
      "#nba-game-filter",
      "#nba-sportsbook-filter",
      "#nba-odds-reset-filters"
    ]
  },
  {
    name: "NBA Player Props",
    path: "/nba-props.html",
    selectors: [
      "#nba-props-game-filter",
      "#nba-prop-type-filter",
      "#nba-player-filter",
      "#nba-props-sort-filter",
      "#nba-props-sportsbook-filter",
      "#nba-props-reset-filters"
    ]
  },
  {
    name: "NBA Player Trends",
    path: "/nba-trends.html",
    selectors: [
      "select",
      ".filter-reset-btn"
    ]
  },
  {
    name: "NBA Team Trends",
    path: "/nba-team-trends.html",
    selectors: [
      "select",
      ".filter-reset-btn"
    ]
  },
  {
    name: "NBA Team Profiles",
    path: "/nba-team-profiles.html",
    selectors: [
      ".team-directory a"
    ]
  }
];

(async () => {
  const results = [];

  let assertions = 0;
  let passedAssertions = 0;
  let failedAssertions = 0;
  let notExercised = 0;

  console.log(
    "=== P23 D4 MOBILE TOUCH TARGET + SMALL-SCREEN QA ==="
  );
  console.log(
    "Production | 390x844 | Target: 44x44 CSS px"
  );

  for (const [browserName, engine] of engines) {
    const browser = await engine.launch({
      headless: true
    });

    const context = await browser.newContext({
      viewport,
      isMobile: true,
      hasTouch: true
    });

    const page = await context.newPage();

    console.log(`\n=== ${browserName} ===`);

    for (const spec of pages) {
      const caseResult = {
        browser: browserName,
        viewport: "390x844",
        page: spec.name,
        path: spec.path,
        status: "PASS",
        assertions: [],
        notExercised: []
      };

      await page.goto(BASE + spec.path, {
        waitUntil: "domcontentloaded",
        timeout: 30000
      });

      await page.waitForTimeout(1200);

      for (const selector of spec.selectors) {
        const loc = page.locator(selector);
        const count = await loc.count();

        if (!count) {
          notExercised++;

          caseResult.notExercised.push({
            selector,
            reason: "Selector not present"
          });

          console.log(
            `NOT_EXERCISED | ${spec.name} | ${selector}`
          );

          continue;
        }

        const limit = Math.min(count, 5);

        for (let i = 0; i < limit; i++) {
          const data = await loc.nth(i).evaluate(node => {
            const r = node.getBoundingClientRect();
            const cs = getComputedStyle(node);

            return {
              width: Number(r.width.toFixed(2)),
              height: Number(r.height.toFixed(2)),
              display: cs.display,
              visibility: cs.visibility
            };
          });

          const visible =
            data.display !== "none" &&
            data.visibility !== "hidden" &&
            data.width > 0 &&
            data.height > 0;

          /*
           * .billing-slider is visual only.
           * .billing-switch is the actual interactive target.
           */
          const requires44 =
            selector !== ".billing-slider";

          const passed =
            visible &&
            (!requires44 ||
              (data.width >= 44 &&
               data.height >= 44));

          assertions++;

          if (passed) {
            passedAssertions++;
          } else {
            failedAssertions++;
            caseResult.status = "FAIL";
          }

          caseResult.assertions.push({
            type: "touch-target",
            selector,
            index: i,
            width: data.width,
            height: data.height,
            requires44,
            passed
          });

          if (!passed) {
            console.log(
              `FAIL | ${spec.name} | ` +
              `${selector}[${i}] | ` +
              `${data.width}x${data.height}`
            );
          }
        }
      }

      const layout = await page.evaluate(() => {
        const doc = document.documentElement;

        const overflow =
          doc.scrollWidth >
          doc.clientWidth + 1;

        const d4RulePresent =
          [...document.styleSheets].some(sheet => {
            let rules;

            try {
              rules = sheet.cssRules;
            } catch {
              return false;
            }

            function search(list) {
              for (const rule of list) {
                if (
                  rule.type === CSSRule.STYLE_RULE &&
                  rule.selectorText &&
                  rule.selectorText.includes(
                    ".league-controls select"
                  ) &&
                  rule.style.height === "44px"
                ) {
                  return true;
                }

                if (
                  rule.cssRules &&
                  search(rule.cssRules)
                ) {
                  return true;
                }
              }

              return false;
            }

            return search(rules);
          });

        return {
          overflow,
          d4RulePresent
        };
      });

      const noOverflow = !layout.overflow;

      assertions++;

      if (noOverflow) {
        passedAssertions++;
      } else {
        failedAssertions++;
        caseResult.status = "FAIL";
      }

      caseResult.assertions.push({
        type: "horizontal-overflow",
        passed: noOverflow
      });

      assertions++;

      if (layout.d4RulePresent) {
        passedAssertions++;
      } else {
        failedAssertions++;
        caseResult.status = "FAIL";
      }

      caseResult.assertions.push({
        type: "d4-css-rule-present",
        passed: layout.d4RulePresent
      });

      console.log(
        `${caseResult.status} | ${spec.name}`
      );

      results.push(caseResult);
    }

    await browser.close();
  }

  const casePass =
    results.filter(r => r.status === "PASS").length;

  const caseFail =
    results.filter(r => r.status === "FAIL").length;

  const status =
    caseFail === 0 &&
    failedAssertions === 0
      ? "PASS"
      : "FAIL";

  const report = {
    milestone: "P23 D4",
    title:
      "Mobile Touch Target + Small-Screen Usability QA",
    environment: "production",
    baseUrl: BASE,
    viewport: "390x844",
    targetCssPixels: "44x44",
    browsers: engines.map(([name]) => name),
    pages: pages.map(p => ({
      name: p.name,
      path: p.path
    })),
    cases: results.length,
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
    { recursive: true }
  );

  fs.writeFileSync(
    REPORT_PATH,
    JSON.stringify(report, null, 2) + "\n"
  );

  console.log("\n=== P23 D4 FINAL RESULT ===");
  console.log(`CASES: ${results.length}`);
  console.log(`CASE PASS: ${casePass}`);
  console.log(`CASE FAIL: ${caseFail}`);
  console.log(`ASSERTIONS: ${assertions}`);
  console.log(
    `ASSERTION PASS: ${passedAssertions}`
  );
  console.log(
    `ASSERTION FAIL: ${failedAssertions}`
  );
  console.log(
    `NOT_EXERCISED: ${notExercised}`
  );
  console.log(`STATUS: ${status}`);
  console.log(`REPORT: ${REPORT_PATH}`);

  if (status !== "PASS") {
    process.exitCode = 1;
  }
})().catch(err => {
  console.error(err);
  process.exit(1);
});
