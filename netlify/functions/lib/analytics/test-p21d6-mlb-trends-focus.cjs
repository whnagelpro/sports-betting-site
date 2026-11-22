const { chromium } = require("playwright");
const path = require("node:path");

const BASE_URL = "https://sportacularanalytics.com";
const ROOT = path.resolve(__dirname, "../../../../");
const EVIDENCE_DIR = path.join(ROOT, "p21-evidence");

const TIERS = [
  {
    name: "Rookie",
    profileDir: path.join(
      EVIDENCE_DIR,
      "p21-rookie-auth-profile"
    )
  },
  {
    name: "Veteran",
    profileDir: path.join(
      EVIDENCE_DIR,
      "p21-veteran-auth-profile"
    )
  }
];

let passCount = 0;
let failCount = 0;

async function runTier(tier) {
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
      `${BASE_URL}/mlb-trends.html`,
      {
        waitUntil: "domcontentloaded",
        timeout: 30000
      }
    );

    await page.waitForTimeout(3000);

    const status = response ? response.status() : null;

    const bodyText = await page
      .locator("body")
      .innerText()
      .catch(() => "");

    const hasLockedState =
      /MLB Player Trends Locked/i.test(bodyText) ||
      (
        /upgrade/i.test(bodyText) &&
        /MLB Player Trends/i.test(bodyText)
      );

    if (status === 200 && hasLockedState) {
      passCount += 1;

      console.log(
        `PASS — ${tier.name} — MLB Player Trends — HTTP ${status} — locked state detected`
      );
    } else {
      failCount += 1;

      console.log(
        `FAIL — ${tier.name} — MLB Player Trends — HTTP ${status} — locked state not detected`
      );

      console.log(
        "Relevant page text:",
        bodyText.slice(0, 1500)
      );
    }
  } catch (error) {
    failCount += 1;

    console.log(
      `FAIL — ${tier.name} — MLB Player Trends — automation error`
    );

    console.log(
      error.stack || error.message || String(error)
    );
  } finally {
    await context.close();
  }
}

(async () => {
  console.log("");
  console.log(
    "P21 D6 — Focused MLB Restricted Trends Verification"
  );
  console.log(`Target: ${BASE_URL}`);
  console.log("");

  for (const tier of TIERS) {
    await runTier(tier);
  }

  console.log("");
  console.log("Focused verification summary");
  console.log(`PASS: ${passCount}`);
  console.log(`FAIL: ${failCount}`);
  console.log("");

  process.exitCode =
    failCount === 0 ? 0 : 1;
})();