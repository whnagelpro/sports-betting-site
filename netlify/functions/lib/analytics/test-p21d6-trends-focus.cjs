const { chromium } = require("playwright");
const path = require("node:path");

const BASE_URL = "https://sportacularanalytics.com";
const ROOT = path.resolve(__dirname, "../../../../");
const EVIDENCE_DIR = path.join(ROOT, "p21-evidence");

const TESTS = [
  {
    tier: "Rookie",
    profileDir: path.join(EVIDENCE_DIR, "p21-rookie-auth-profile")
  },
  {
    tier: "Veteran",
    profileDir: path.join(EVIDENCE_DIR, "p21-veteran-auth-profile")
  }
];

const LEAGUES = [
  {
    name: "NHL",
    route: "/nhl-trends.html",
    expectedText: "NHL Player Trends Locked"
  },
  {
    name: "NFL",
    route: "/nfl-trends.html",
    expectedText: "NFL Player Trends Locked"
  }
];

let passCount = 0;
let failCount = 0;

async function runCheck(tier, league) {
  const context = await chromium.launchPersistentContext(
    tier.profileDir,
    {
      headless: true
    }
  );

  try {
    const pages = context.pages();
    const page = pages[0] || await context.newPage();

    const response = await page.goto(
      `${BASE_URL}${league.route}`,
      {
        waitUntil: "domcontentloaded",
        timeout: 30000
      }
    );

    await page.waitForTimeout(3000);

    const status = response ? response.status() : null;
    const bodyText = await page.locator("body").innerText();

    const hasLockedState =
      bodyText
        .toLowerCase()
        .includes(league.expectedText.toLowerCase());

    const passed =
      status === 200 &&
      hasLockedState;

    if (passed) {
      passCount += 1;
      console.log(
        `PASS — ${tier.tier} — ${league.name} Player Trends — HTTP ${status} — locked state detected`
      );
    } else {
      failCount += 1;
      console.log(
        `FAIL — ${tier.tier} — ${league.name} Player Trends — HTTP ${status} — locked state detected: ${hasLockedState}`
      );

      console.log("Visible body text:");
      console.log(bodyText);
    }
  } catch (error) {
    failCount += 1;

    console.log(
      `FAIL — ${tier.tier} — ${league.name} Player Trends — automation error`
    );

    console.log(error.stack || error.message || String(error));
  } finally {
    await context.close();
  }
}

(async () => {
  console.log("");
  console.log("P21 D6 — Focused NHL/NFL Restricted Trends Verification");
  console.log(`Target: ${BASE_URL}`);
  console.log("");

  for (const tier of TESTS) {
    for (const league of LEAGUES) {
      await runCheck(tier, league);
    }
  }

  console.log("");
  console.log("Focused verification summary");
  console.log(`PASS: ${passCount}`);
  console.log(`FAIL: ${failCount}`);
  console.log("");

  process.exitCode = failCount === 0 ? 0 : 1;
})();