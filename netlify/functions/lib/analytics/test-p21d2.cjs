"use strict";

/*
 * SPORTACULAR ANALYTICS
 * P21 D2 — LIVE PRODUCTION AUTHENTICATION QA
 *
 * Tests deployed website and premium endpoint
 * authentication boundaries.
 *
 * No real credentials.
 * No account modifications.
 * No subscription modifications.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../../../..");

const BASE_URL = "https://sportacularanalytics.com";

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
  record(name, condition ? "PASS" : "FAIL", details);
}

async function request(url, options = {}) {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    15000
  );

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      redirect: "follow",
      cache: "no-store"
    });

    const body = await response.text();

    return {
      status: response.status,
      url: response.url,
      contentType:
        response.headers.get("content-type") || "",
      body
    };
  } finally {
    clearTimeout(timeout);
  }
}

function safeErrorBody(result) {
  try {
    const parsed = JSON.parse(result.body);

    return {
      error: parsed.error || null,
      message: parsed.message || null
    };
  } catch {
    return null;
  }
}

async function runRequestTest(name, url, options, validate) {
  try {
    const result = await request(url, options);

    check(
      name,
      validate(result),
      {
        status: result.status,
        finalUrl: result.url,
        contentType: result.contentType,
        error: safeErrorBody(result)
      }
    );
  } catch (error) {
    record(name, "FAIL", {
      error: error.message
    });
  }
}

async function testProductionPages() {
  console.log("\n=== PRODUCTION WEBSITE ===");

  await runRequestTest(
    "Production homepage accessible",
    `${BASE_URL}/`,
    {},
    (result) =>
      result.status === 200 &&
      result.body.includes("Sportacular")
  );

  await runRequestTest(
    "Production authentication page accessible",
    `${BASE_URL}/auth.html`,
    {},
    (result) =>
      result.status === 200 &&
      result.body.includes("login-form")
  );

  await runRequestTest(
    "Production signup route accessible",
    `${BASE_URL}/auth.html?view=signup`,
    {},
    (result) =>
      result.status === 200 &&
      result.body.includes("signup-form")
  );

  await runRequestTest(
    "Production password-reset route accessible",
    `${BASE_URL}/auth.html?view=reset`,
    {},
    (result) =>
      result.status === 200 &&
      result.body.includes("reset-request-form")
  );

  await runRequestTest(
    "Production password-update route accessible",
    `${BASE_URL}/auth.html?view=update-password`,
    {},
    (result) =>
      result.status === 200 &&
      result.body.includes("reset-update-form")
  );
}

async function testDeployedScript() {
  console.log("\n=== DEPLOYED AUTHENTICATION SCRIPT ===");

  await runRequestTest(
    "Deployed script uses production password-reset domain",
    `${BASE_URL}/script.js`,
    {},
    (result) => {
      if (result.status !== 200) return false;

      const expected =
        "https://sportacularanalytics.com/auth.html?view=update-password";

      const obsolete =
        "https://sports-betting-guide-app.netlify.app/auth.html?view=update-password";

      return (
        result.body.includes(expected) &&
        !result.body.includes(obsolete)
      );
    }
  );
}

function unauthorizedResponseIsSafe(result) {
  if (result.status !== 401) {
    return false;
  }

  if (!result.contentType.toLowerCase().includes("json")) {
    return false;
  }

  const parsed = safeErrorBody(result);

  if (!parsed || !parsed.error) {
    return false;
  }

  const body = result.body.trim();

  if (
    body.startsWith("Player,") ||
    body.startsWith("Game Id,") ||
    body.startsWith("Game Date,")
  ) {
    return false;
  }

  return true;
}

async function testPremiumEndpoint(league) {
  const upper = league.toUpperCase();

  console.log(
    `\n=== ${upper} LIVE PREMIUM SECURITY ===`
  );

  const endpoint =
    `${BASE_URL}/.netlify/functions/${league}-props-premium`;

  const scenarios = [
    {
      name: "Missing Authorization",
      options: {}
    },
    {
      name: "Malformed Authorization",
      options: {
        headers: {
          Authorization: "InvalidAuthorization"
        }
      }
    },
    {
      name: "Empty Bearer token",
      options: {
        headers: {
          Authorization: "Bearer "
        }
      }
    },
    {
      name: "Invalid Bearer token",
      options: {
        headers: {
          Authorization:
            "Bearer P21_INVALID_TEST_TOKEN_NOT_REAL"
        }
      }
    }
  ];

  for (const scenario of scenarios) {
    await runRequestTest(
      `${upper}: ${scenario.name} rejected safely`,
      endpoint,
      scenario.options,
      unauthorizedResponseIsSafe
    );
  }
}

async function main() {
  console.log(
    "\nSPORTACULAR ANALYTICS — P21 D2"
  );

  console.log(
    "Live Production Authentication & Security QA"
  );

  console.log(`Production: ${BASE_URL}\n`);

  await testProductionPages();

  await testDeployedScript();

  for (const league of LEAGUES) {
    await testPremiumEndpoint(league);
  }

  const passed = assertions.filter(
    (item) => item.status === "PASS"
  ).length;

  const failed = assertions.filter(
    (item) => item.status === "FAIL"
  ).length;

  const report = {
    phase: "P21",
    deployment: "D2",
    test: "Live Production Authentication & Security QA",
    timestamp: new Date().toISOString(),
    productionUrl: BASE_URL,
    evidenceType: "LIVE_DEPLOYED_HTTP",
    productionModified: false,
    scope: {
      authenticatedUserFlows: "NOT_EXERCISED",
      realMembershipTiers: "NOT_EXERCISED",
      supabaseRedirectAllowlist: "NOT_EXERCISED",
      passwordRecoveryEmailFlow: "NOT_EXERCISED"
    },
    summary: {
      total: assertions.length,
      passed,
      failed,
      blockers: failed
    },
    assertions
  };

  const evidenceDir = path.join(
    ROOT,
    "p21-evidence"
  );

  fs.mkdirSync(evidenceDir, {
    recursive: true
  });

  const reportPath = path.join(
    evidenceDir,
    "p21d2-report.json"
  );

  fs.writeFileSync(
    reportPath,
    JSON.stringify(report, null, 2)
  );

  console.log("\n=== P21 D2 SUMMARY ===");

  console.log(`Assertions: ${assertions.length}`);
  console.log(`PASS: ${passed}`);
  console.log(`FAIL: ${failed}`);
  console.log(`Blockers: ${failed}`);

  console.log(`Report: ${reportPath}`);

  console.log(
    failed === 0
      ? "\nP21 D2 STATUS: PASS"
      : "\nP21 D2 STATUS: FAIL — REVIEW REQUIRED"
  );

  process.exitCode = failed === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error("P21 D2 fatal error:", error);
  process.exitCode = 1;
});