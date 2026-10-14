const { chromium } = require("playwright");
const path = require("node:path");

const BASE_URL = "https://sportacularanalytics.com";
const ROOT = path.resolve(__dirname, "../../../../");
const EVIDENCE_DIR = path.join(ROOT, "p21-evidence");

const TIERS = [
  {
    name: "All-Star",
    profileDir: path.join(EVIDENCE_DIR, "p21-allstar-auth-profile")
  },
  {
    name: "Hall-of-Famer",
    profileDir: path.join(EVIDENCE_DIR, "p21-hof-auth-profile")
  },
  {
    name: "Legend",
    profileDir: path.join(EVIDENCE_DIR, "p21-auth-profile")
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

    const consoleErrors = [];
    const pageErrors = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (error) => {
      pageErrors.push(
        error.stack || error.message || String(error)
      );
    });

    const response = await page.goto(
      `${BASE_URL}/nba-props.html`,
      {
        waitUntil: "domcontentloaded",
        timeout: 30000
      }
    );

    await page.waitForTimeout(5000);

    const status = response ? response.status() : null;

    const objectKeysErrors = consoleErrors.filter((message) =>
      /cannot convert undefined or null to object/i.test(message) ||
      /object\.keys/i.test(message)
    );

    const pageObjectKeysErrors = pageErrors.filter((message) =>
      /cannot convert undefined or null to object/i.test(message) ||
      /object\.keys/i.test(message)
    );

    const passed =
      status === 200 &&
      objectKeysErrors.length === 0 &&
      pageObjectKeysErrors.length === 0;

    if (passed) {
      passCount += 1;

      console.log(
        `PASS — ${tier.name} — NBA Player Props — HTTP ${status} — no empty-row Object.keys exception`
      );
    } else {
      failCount += 1;

      console.log(
        `FAIL — ${tier.name} — NBA Player Props — HTTP ${status}`
      );

      console.log(
        "Matching console errors:",
        objectKeysErrors
      );

      console.log(
        "Matching page errors:",
        pageObjectKeysErrors
      );
    }

    if (consoleErrors.length) {
      console.log(
        `${tier.name} all console errors:`,
        consoleErrors
      );
    }

    if (pageErrors.length) {
      console.log(
        `${tier.name} all page errors:`,
        pageErrors
      );
    }
  } catch (error) {
    failCount += 1;

    console.log(
      `FAIL — ${tier.name} — NBA Player Props — automation error`
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
    "P21 D6 — Focused NBA Empty-Row Frontend Verification"
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