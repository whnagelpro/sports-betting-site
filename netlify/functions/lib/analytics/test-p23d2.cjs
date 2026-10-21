const fs = require("fs");
const path = require("path");
const { chromium, firefox, webkit } = require("playwright");

const BASE_URL = "https://sportacularanalytics.com";

const ENGINES = [
  ["Chromium", chromium],
  ["Firefox", firefox],
  ["WebKit", webkit]
];

const ROUTES = [
  ["Homepage", "/index.html"],
  ["Authentication", "/auth.html"],
  ["Pricing", "/pricing.html"],
  ["NBA Game Odds", "/nba-odds.html"],
  ["NBA Player Props", "/nba-props.html"]
];

const VIEWPORT = {
  width: 390,
  height: 844
};

const results = [];

function record(status, engine, page, assertion, detail = "") {
  results.push({
    status,
    engine,
    page,
    assertion,
    detail
  });

  if (status === "FAIL") {
    console.log(
      `FAIL — ${engine} — ${page} — ${assertion}` +
      (detail ? ` — ${detail}` : "")
    );
  }
}

(async () => {
  console.log("--- P23 D2 MOBILE NAVIGATION PRODUCTION QA ---");
  console.log(
    `${ENGINES.length} engines × ${ROUTES.length} routes = ` +
    `${ENGINES.length * ROUTES.length} cases`
  );
  console.log();

  for (const [engineName, engine] of ENGINES) {
    const browser = await engine.launch({ headless: true });

    try {
      for (const [pageName, route] of ROUTES) {
        const context = await browser.newContext({
          viewport: VIEWPORT
        });

        const page = await context.newPage();

        try {
          const response = await page.goto(
            `${BASE_URL}${route}`,
            {
              waitUntil: "domcontentloaded",
              timeout: 30000
            }
          );

          record(
            response?.status() === 200 ? "PASS" : "FAIL",
            engineName,
            pageName,
            "Production page returns HTTP 200",
            `HTTP=${response?.status()}`
          );

          const toggle = page.locator("#mobile-menu-toggle");
          const nav = page.locator("#site-nav");

          record(
            (await toggle.count()) === 1 ? "PASS" : "FAIL",
            engineName,
            pageName,
            "Mobile menu toggle exists"
          );

          record(
            (await toggle.isVisible()) ? "PASS" : "FAIL",
            engineName,
            pageName,
            "Mobile menu toggle is visible at 390px"
          );

          const initialExpanded =
            await toggle.getAttribute("aria-expanded");

          record(
            initialExpanded === "false" ? "PASS" : "FAIL",
            engineName,
            pageName,
            "Mobile menu initially reports aria-expanded=false",
            `aria-expanded=${initialExpanded}`
          );

          record(
            !(await nav.isVisible()) ? "PASS" : "FAIL",
            engineName,
            pageName,
            "Site navigation is initially hidden"
          );

          await toggle.click();

          const openedExpanded =
            await toggle.getAttribute("aria-expanded");

          record(
            openedExpanded === "true" ? "PASS" : "FAIL",
            engineName,
            pageName,
            "Opening menu sets aria-expanded=true",
            `aria-expanded=${openedExpanded}`
          );

          record(
            await nav.isVisible() ? "PASS" : "FAIL",
            engineName,
            pageName,
            "Site navigation becomes visible after toggle"
          );

          record(
            await nav.evaluate(el =>
              el.classList.contains("mobile-open")
            ) ? "PASS" : "FAIL",
            engineName,
            pageName,
            "Opening menu applies mobile-open state"
          );

          const firstDropdown =
            page.locator("#site-nav .dropdown").first();

          const firstDropdownLink =
            firstDropdown.locator(":scope > a");

          const firstDropdownMenu =
            firstDropdown.locator(":scope > .dropdown-menu");

          record(
            (await firstDropdown.count()) === 1
              ? "PASS"
              : "FAIL",
            engineName,
            pageName,
            "First navigation dropdown exists"
          );

          record(
            !(await firstDropdownMenu.isVisible())
              ? "PASS"
              : "FAIL",
            engineName,
            pageName,
            "Dropdown menu is initially closed"
          );

          await firstDropdownLink.click();

          record(
            await firstDropdown.evaluate(el =>
              el.classList.contains("open")
            ) ? "PASS" : "FAIL",
            engineName,
            pageName,
            "Dropdown click applies open state"
          );

          record(
            await firstDropdownMenu.isVisible()
              ? "PASS"
              : "FAIL",
            engineName,
            pageName,
            "Dropdown menu becomes visible"
          );

          await firstDropdownLink.click();

          record(
            !(await firstDropdown.evaluate(el =>
              el.classList.contains("open")
            )) ? "PASS" : "FAIL",
            engineName,
            pageName,
            "Second dropdown click removes open state"
          );

          record(
            !(await firstDropdownMenu.isVisible())
              ? "PASS"
              : "FAIL",
            engineName,
            pageName,
            "Dropdown menu becomes hidden again"
          );

          await toggle.click();

          const closedExpanded =
            await toggle.getAttribute("aria-expanded");

          record(
            closedExpanded === "false" ? "PASS" : "FAIL",
            engineName,
            pageName,
            "Closing menu restores aria-expanded=false",
            `aria-expanded=${closedExpanded}`
          );

          record(
            !(await nav.isVisible()) ? "PASS" : "FAIL",
            engineName,
            pageName,
            "Site navigation becomes hidden after closing"
          );

          record(
            !(await nav.evaluate(el =>
              el.classList.contains("mobile-open")
            )) ? "PASS" : "FAIL",
            engineName,
            pageName,
            "Closing menu removes mobile-open state"
          );

        } catch (error) {
          record(
            "FAIL",
            engineName,
            pageName,
            "Navigation case completed without browser exception",
            String(error.message || error).split("\n")[0]
          );
        } finally {
          await page.close();
          await context.close();
        }
      }
    } finally {
      await browser.close();
    }
  }

  const pass =
    results.filter(r => r.status === "PASS").length;

  const fail =
    results.filter(r => r.status === "FAIL").length;

  const report = {
    milestone: "P23",
    phase: "D2",
    title: "Mobile Navigation Production QA",
    productionUrl: BASE_URL,
    generatedAt: new Date().toISOString(),
    matrix: {
      engines: ENGINES.map(([name]) => name),
      viewport: {
        width: VIEWPORT.width,
        height: VIEWPORT.height
      },
      routes: ROUTES.map(([name, route]) => ({
        name,
        route
      }))
    },
    summary: {
      cases: ENGINES.length * ROUTES.length,
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
    "p23d2-report.json"
  );

  fs.writeFileSync(
    reportPath,
    JSON.stringify(report, null, 2) + "\n",
    "utf8"
  );

  console.log();
  console.log(`REPORT: ${reportPath}`);

  console.log();
  console.log("--- P23 D2 SUMMARY ---");
  console.log(
    `CASES: ${ENGINES.length * ROUTES.length}`
  );
  console.log(`ASSERTIONS: ${results.length}`);
  console.log(`PASS: ${pass}`);
  console.log(`FAIL: ${fail}`);

  if (fail === 0) {
    console.log("P23 D2 STATUS: PASS");
  } else {
    console.log(
      "P23 D2 STATUS: FAIL — mobile navigation defects require review"
    );
    process.exitCode = 1;
  }
})().catch(error => {
  console.error("P23 D2 HARNESS ERROR");
  console.error(error);
  process.exitCode = 1;
});
