const fs = require("fs");
const path = require("path");
const { chromium, firefox, webkit } = require("playwright");

const BASE_URL = "https://sportacularanalytics.com";

const ROUTES = [
  ["Homepage", "/index.html"],
  ["Authentication", "/auth.html"],
  ["Pricing", "/pricing.html"],
  ["NBA Game Odds", "/nba-odds.html"],
  ["NBA Player Props", "/nba-props.html"],
  ["NBA Player Trends", "/nba-trends.html"],
  ["NBA Team Trends", "/nba-team-trends.html"],
  ["NBA Player Profiles", "/nba-player-profiles.html"],
  ["NBA Team Profiles", "/nba-team-profiles.html"],
  [
    "NBA Team Profile",
    "/nba-team.html?league=nba&team=Boston%20Celtics"
  ],
  ["Player Profile Shell", "/player.html"],
  ["Checkout Success", "/success.html"],
  ["Terms", "/terms.html"],
];

const VIEWPORTS = [
  ["Phone 390", { width: 390, height: 844 }],
  ["Shared 768", { width: 768, height: 1024 }],
  ["Shared 900", { width: 900, height: 1100 }],
  ["Desktop 1280", { width: 1280, height: 900 }],
];

const ENGINES = [
  ["Chromium", chromium],
  ["Firefox", firefox],
  ["WebKit", webkit],
];

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

(async () => {
  const results = [];

  function record(status, engine, viewport, pageName, check, detail = "") {
    results.push({
      status,
      engine,
      viewport,
      page: pageName,
      check,
      detail,
    });

    if (status !== "PASS") {
      console.log(
        `${status} — ${engine} — ${viewport} — ${pageName} — ${check}` +
        (detail ? ` — ${detail}` : "")
      );
    }
  }

  console.log("--- P23 D1 RESPONSIVE PRODUCTION BASELINE ---");
  console.log(
    `${ENGINES.length} engines × ${VIEWPORTS.length} viewports × ${ROUTES.length} routes = ` +
    `${ENGINES.length * VIEWPORTS.length * ROUTES.length} cases`
  );
  console.log();

  for (const [engineName, engine] of ENGINES) {
    const browser = await engine.launch({ headless: true });

    try {
      for (const [viewportName, viewport] of VIEWPORTS) {
        const context = await browser.newContext({
          viewport,
        });

        try {
          for (const [pageName, route] of ROUTES) {
            const page = await context.newPage();

            try {
              const response = await page.goto(
                BASE_URL + route,
                {
                  waitUntil: "domcontentloaded",
                  timeout: 30000,
                }
              );

              const httpStatus = response?.status() ?? 0;

              record(
                httpStatus === 200 ? "PASS" : "FAIL",
                engineName,
                viewportName,
                pageName,
                "Production navigation returns HTTP 200",
                `HTTP ${httpStatus}`
              );

              const viewportMeta = await page.locator(
                'meta[name="viewport"]'
              ).count();

              record(
                viewportMeta > 0 ? "PASS" : "FAIL",
                engineName,
                viewportName,
                pageName,
                "Viewport meta is present"
              );

              const bodyText = normalizeText(
                await page.locator("body").textContent()
              );

              record(
                bodyText.length >= 20 ? "PASS" : "FAIL",
                engineName,
                viewportName,
                pageName,
                "Document renders meaningful body content",
                `bodyLength=${bodyText.length}`
              );

              const geometry = await page.evaluate(() => {
                const root = document.documentElement;
                const body = document.body;

                const viewportWidth = window.innerWidth;

                const rootScrollWidth = root
                  ? root.scrollWidth
                  : viewportWidth;

                const bodyScrollWidth = body
                  ? body.scrollWidth
                  : viewportWidth;

                const documentWidth = Math.max(
                  rootScrollWidth,
                  bodyScrollWidth
                );

                return {
                  viewportWidth,
                  documentWidth,
                  overflowPixels:
                    documentWidth - viewportWidth,
                };
              });

              const noPageOverflow =
                geometry.overflowPixels <= 1;

              record(
                noPageOverflow ? "PASS" : "FAIL",
                engineName,
                viewportName,
                pageName,
                "No page-level horizontal overflow",
                `viewport=${geometry.viewportWidth}, document=${geometry.documentWidth}, overflow=${geometry.overflowPixels}`
              );

            } catch (error) {
              record(
                "FAIL",
                engineName,
                viewportName,
                pageName,
                "Page case completed without browser exception",
                String(error.message || error).split("\n")[0]
              );
            } finally {
              await page.close();
            }
          }
        } finally {
          await context.close();
        }
      }
    } finally {
      await browser.close();
    }
  }

  const pass = results.filter(r => r.status === "PASS").length;
  const fail = results.filter(r => r.status === "FAIL").length;

  const report = {
    milestone: "P23",
    phase: "D1",
    title: "Responsive Production Baseline",
    productionUrl: BASE_URL,
    generatedAt: new Date().toISOString(),
    matrix: {
      engines: ENGINES.map(([name]) => name),
      viewports: VIEWPORTS.map(([name, dimensions]) => ({
        name,
        width: dimensions.width,
        height: dimensions.height
      })),
      routes: ROUTES.map(([name, route]) => ({
        name,
        route
      }))
    },
    summary: {
      cases: ENGINES.length * VIEWPORTS.length * ROUTES.length,
      assertions: results.length,
      pass,
      fail,
      status: fail === 0 ? "PASS" : "FAIL"
    },
    results
  };

  const evidenceDir = path.join(process.cwd(), "p23-evidence");
  fs.mkdirSync(evidenceDir, { recursive: true });

  const reportPath = path.join(
    evidenceDir,
    "p23d1-report.json"
  );

  fs.writeFileSync(
    reportPath,
    JSON.stringify(report, null, 2) + "\n",
    "utf8"
  );

  console.log();
  console.log(`REPORT: ${reportPath}`);

  console.log();
  console.log("--- P23 D1 SUMMARY ---");
  console.log(`CASES: ${ENGINES.length * VIEWPORTS.length * ROUTES.length}`);
  console.log(`ASSERTIONS: ${results.length}`);
  console.log(`PASS: ${pass}`);
  console.log(`FAIL: ${fail}`);

  if (fail === 0) {
    console.log("P23 D1 STATUS: PASS");
  } else {
    console.log("P23 D1 STATUS: FAIL — responsive defects require review");
    process.exitCode = 1;
  }
})().catch(error => {
  console.error("P23 D1 HARNESS ERROR");
  console.error(error);
  process.exitCode = 1;
});
