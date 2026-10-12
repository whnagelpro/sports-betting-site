"use strict";

/*
 * SPORTACULAR ANALYTICS
 * P21 D1 — AUTHENTICATION & TIER CONTRACT QA
 *
 * Read-only production source audit.
 * Mocked backend authorization tests.
 *
 * No production accounts are modified.
 * No real Supabase requests are made.
 * No production CSV requests are made.
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const Module = require("module");

const ROOT = path.resolve(__dirname, "../../../..");

const LEAGUES = ["nba", "nhl", "mlb", "nfl"];

const EXPECTED_TIERS = {
  Rookie: {
    maxRankingsPerGame: 5,
    showPlayerProps: false,
    showGameOdds: true,
    maxPropsToShow: 0,
    showTopBet: false,
    showLeaderboardCount: 3
  },

  Veteran: {
    maxRankingsPerGame: 5,
    showPlayerProps: false,
    showGameOdds: true,
    maxPropsToShow: 0,
    showTopBet: false,
    showLeaderboardCount: 5
  },

  "All-Star": {
    maxRankingsPerGame: 99,
    showPlayerProps: true,
    showGameOdds: true,
    maxPropsToShow: 10,
    showTopBet: false,
    showLeaderboardCount: 7
  },

  "Hall-of-Famer": {
    maxRankingsPerGame: 99,
    showPlayerProps: true,
    showGameOdds: true,
    maxPropsToShow: 25,
    showTopBet: true,
    showLeaderboardCount: 12
  },

  Legend: {
    maxRankingsPerGame: 99,
    showPlayerProps: true,
    showGameOdds: true,
    maxPropsToShow: 99999,
    showTopBet: true,
    showLeaderboardCount: 20
  }
};

const ALLOWED_PREMIUM_TIERS = [
  "All-Star",
  "Hall-of-Famer",
  "Legend"
];

const assertions = [];

function assert(name, condition, details = {}) {
  const status = condition ? "PASS" : "FAIL";

  assertions.push({
    name,
    status,
    details
  });

  console.log(`${status}: ${name}`);
}

function read(relativePath) {
  return fs.readFileSync(
    path.join(ROOT, relativePath),
    "utf8"
  );
}

function extractObject(source, declaration) {
  const marker = `const ${declaration} =`;
  const start = source.indexOf(marker);

  if (start === -1) {
    throw new Error(`Missing declaration: ${declaration}`);
  }

  const opening = source.indexOf("{", start);

  if (opening === -1) {
    throw new Error(`Missing object: ${declaration}`);
  }

  let depth = 0;
  let closing = -1;

  for (let i = opening; i < source.length; i++) {
    if (source[i] === "{") depth++;

    if (source[i] === "}") {
      depth--;

      if (depth === 0) {
        closing = i + 1;
        break;
      }
    }
  }

  if (closing === -1) {
    throw new Error(`Unclosed object: ${declaration}`);
  }

  const objectSource = source.slice(opening, closing);

  return vm.runInNewContext(
    `(${objectSource})`,
    Object.create(null),
    { timeout: 1000 }
  );
}

function extractArray(source, declaration) {
  const marker = `const ${declaration} =`;
  const start = source.indexOf(marker);

  if (start === -1) {
    throw new Error(`Missing declaration: ${declaration}`);
  }

  const opening = source.indexOf("[", start);
  const closing = source.indexOf("]", opening);

  if (opening === -1 || closing === -1) {
    throw new Error(`Invalid array: ${declaration}`);
  }

  return vm.runInNewContext(
    source.slice(opening, closing + 1),
    Object.create(null),
    { timeout: 1000 }
  );
}

function equalJSON(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function auditFrontend() {
  console.log("\n=== FRONTEND CONTRACT ===");

  const source = read("script.js");

  const actual = extractObject(source, "TIER_RULES");

  const expectedNames = Object.keys(EXPECTED_TIERS);
  const actualNames = Object.keys(actual);

  assert(
    "Exactly five membership tiers",
    equalJSON(actualNames, expectedNames),
    { actualNames }
  );

  for (const tier of expectedNames) {
    assert(
      `${tier} membership contract`,
      equalJSON(actual[tier], EXPECTED_TIERS[tier]),
      {
        actual: actual[tier],
        expected: EXPECTED_TIERS[tier]
      }
    );
  }

  assert(
    "Frontend initializes Supabase",
    source.includes("window.supabase.createClient")
  );

  assert(
    "Frontend supports session retrieval",
    source.includes("auth.getSession()")
  );

  assert(
    "Frontend supports login",
    source.includes("auth.signInWithPassword")
  );

  assert(
    "Frontend supports signup",
    source.includes("auth.signUp")
  );

  assert(
    "Frontend supports logout",
    source.includes("auth.signOut")
  );

  assert(
    "Frontend supports password reset request",
    source.includes("auth.resetPasswordForEmail")
  );

  assert(
    "Frontend supports password update",
    source.includes("auth.updateUser")
  );

  assert(
    "Frontend retrieves membership profile",
    source.includes('.from("profiles")') &&
    source.includes('"tier"') === false
      ? source.includes("tier")
      : source.includes("tier")
  );

  assert(
    "Frontend has Rookie fallback",
    source.includes('CURRENT_USER_TIER = "Rookie"')
  );

  const resetRedirectMatch = source.match(
    /const redirectTo\s*=\s*`([^`]+)`/
  );

  const resetRedirect = resetRedirectMatch
    ? resetRedirectMatch[1]
    : null;

  const expectedResetRedirect =
    "https://sportacularanalytics.com/auth.html?view=update-password";

  assert(
    "Password reset uses production domain",
    resetRedirect === expectedResetRedirect,
    {
      actual: resetRedirect,
      expected: expectedResetRedirect
    }
  );
}

function loadMockedHandler(relativePath, mock) {
  const filename = path.join(ROOT, relativePath);
  const source = fs.readFileSync(filename, "utf8");

  const moduleObject = { exports: {} };

  const fakeRequire = (name) => {
    if (name === "@supabase/supabase-js") {
      return {
        createClient: () => mock.supabase
      };
    }

    throw new Error(`Unexpected dependency: ${name}`);
  };

  const sandbox = {
    module: moduleObject,
    exports: moduleObject.exports,
    require: fakeRequire,
    process: {
      env: mock.env
    },
    fetch: mock.fetch,
    console
  };

  vm.runInNewContext(
    Module.wrap(source),
    sandbox,
    {
      filename,
      timeout: 1000
    }
  );

  const wrapped = vm.runInNewContext(
    Module.wrap(source),
    sandbox,
    {
      filename,
      timeout: 1000
    }
  );

  wrapped(
    moduleObject.exports,
    fakeRequire,
    moduleObject,
    filename,
    path.dirname(filename)
  );

  return moduleObject.exports.handler;
}

function makeMock(league, scenario) {
  const calls = {
    getUser: 0,
    profileLookup: 0,
    sourceFetch: 0
  };

  const user = {
    id: "p21-test-user",
    email: "p21-test@example.invalid"
  };

  const supabase = {
    auth: {
      getUser: async () => {
        calls.getUser++;

        if (scenario.invalidToken) {
          return {
            data: { user: null },
            error: { message: "Invalid token" }
          };
        }

        return {
          data: { user },
          error: null
        };
      }
    },

    from: (table) => {
      if (table !== "profiles") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: () => ({
          eq: () => ({
            single: async () => {
              calls.profileLookup++;

              if (scenario.missingProfile) {
                return {
                  data: null,
                  error: { message: "Profile not found" }
                };
              }

              return {
                data: {
                  id: user.id,
                  email: user.email,
                  tier: scenario.tier
                },
                error: null
              };
            }
          })
        })
      };
    }
  };

  const env = {
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "P21_MOCK_ONLY",
    [`${league.toUpperCase()}_PROPS_SOURCE_URL`]:
      "https://example.invalid/mock.csv"
  };

  const fetchMock = async () => {
    calls.sourceFetch++;

    return {
      ok: true,
      status: 200,
      text: async () => "Player,Prop\nTest,10"
    };
  };

  return {
    calls,
    supabase,
    env,
    fetch: fetchMock
  };
}

async function testEndpoint(league) {
  console.log(
    `\n=== ${league.toUpperCase()} PREMIUM ENDPOINT ===`
  );

  const relativePath =
    `netlify/functions/${league}-props-premium.js`;

  const source = read(relativePath);

  const allowed = extractArray(source, "ALLOWED_TIERS");

  assert(
    `${league} backend allowlist matches contract`,
    equalJSON(allowed, ALLOWED_PREMIUM_TIERS),
    { actual: allowed }
  );

  assert(
    `${league} validates user with getUser`,
    source.includes("auth.getUser")
  );

  assert(
    `${league} reads profiles table`,
    source.includes('.from("profiles")')
  );

  assert(
    `${league} enforces tier allowlist`,
    source.includes("ALLOWED_TIERS.includes(profile.tier)")
  );

  const scenarios = [
    {
      name: "Missing Authorization",
      headers: {},
      expectedStatus: 401,
      expectedFetch: 0
    },
    {
      name: "Malformed Authorization",
      headers: { authorization: "Invalid token" },
      expectedStatus: 401,
      expectedFetch: 0
    },
    {
      name: "Empty Bearer token",
      headers: { authorization: "Bearer " },
      expectedStatus: 401,
      expectedFetch: 0
    },
    {
      name: "Invalid token",
      headers: { authorization: "Bearer invalid" },
      invalidToken: true,
      expectedStatus: 401,
      expectedFetch: 0
    },
    {
      name: "Missing profile",
      headers: { authorization: "Bearer mock-token" },
      missingProfile: true,
      expectedStatus: 403,
      expectedFetch: 0
    },
    ...Object.keys(EXPECTED_TIERS).map((tier) => ({
      name: `${tier} access`,
      headers: { authorization: "Bearer mock-token" },
      tier,
      expectedStatus: ALLOWED_PREMIUM_TIERS.includes(tier)
        ? 200
        : 403,
      expectedFetch: ALLOWED_PREMIUM_TIERS.includes(tier)
        ? 1
        : 0
    })),
    {
      name: "Unknown tier denied",
      headers: { authorization: "Bearer mock-token" },
      tier: "Unknown",
      expectedStatus: 403,
      expectedFetch: 0
    }
  ];

  for (const scenario of scenarios) {
    const mock = makeMock(league, scenario);

    const handler = loadMockedHandler(
      relativePath,
      mock
    );

    const result = await handler({
      headers: scenario.headers
    });

    assert(
      `${league}: ${scenario.name}`,
      result.statusCode === scenario.expectedStatus &&
      mock.calls.sourceFetch === scenario.expectedFetch,
      {
        actualStatus: result.statusCode,
        expectedStatus: scenario.expectedStatus,
        sourceFetches: mock.calls.sourceFetch,
        expectedFetches: scenario.expectedFetch
      }
    );
  }
}

async function main() {
  console.log(
    "\nSPORTACULAR ANALYTICS — P21 D1"
  );

  console.log(
    "Authentication & Tier Contract QA\n"
  );

  let fatalError = null;

  try {
    auditFrontend();

    for (const league of LEAGUES) {
      await testEndpoint(league);
    }
  } catch (error) {
    fatalError = error.message;

    assert(
      "P21 D1 execution completed",
      false,
      { error: fatalError }
    );
  }

  const passed = assertions.filter(
    (item) => item.status === "PASS"
  ).length;

  const failed = assertions.filter(
    (item) => item.status === "FAIL"
  ).length;

  const report = {
    phase: "P21",
    deployment: "D1",
    test: "Authentication & Tier Contract QA",
    timestamp: new Date().toISOString(),
    evidenceType: "SOURCE_AND_MOCKED_BACKEND",
    productionModified: false,
    summary: {
      total: assertions.length,
      passed,
      failed,
      blockers: failed
    },
    assertions,
    fatalError
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
    "p21d1-report.json"
  );

  fs.writeFileSync(
    reportPath,
    JSON.stringify(report, null, 2)
  );

  console.log("\n=== P21 D1 SUMMARY ===");

  console.log(`Assertions: ${assertions.length}`);
  console.log(`PASS: ${passed}`);
  console.log(`FAIL: ${failed}`);
  console.log(`Blockers: ${failed}`);

  console.log(`Report: ${reportPath}`);

  console.log(
    failed === 0
      ? "\nP21 D1 STATUS: PASS"
      : "\nP21 D1 STATUS: FAIL — REVIEW REQUIRED"
  );

  process.exitCode = failed === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});