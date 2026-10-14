const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const BASE_URL = "https://sportacularanalytics.com";

const ROOT = path.resolve(__dirname, "../../../../");
const EVIDENCE_DIR = path.join(ROOT, "p21-evidence");
const REPORT_PATH = path.join(EVIDENCE_DIR, "p21d6-report.json");

const TIERS = [
  {
    name: "Rookie",
    profileDir: path.join(EVIDENCE_DIR, "p21-rookie-auth-profile"),
    propsAllowed: false,
    trendsAllowed: false,
    topBetAllowed: false,
    maxRankingsPerGame: 5,
    leaderboardLimit: 3,
    maxProps: 0
  },
  {
    name: "Veteran",
    profileDir: path.join(EVIDENCE_DIR, "p21-veteran-auth-profile"),
    propsAllowed: false,
    trendsAllowed: false,
    topBetAllowed: false,
    maxRankingsPerGame: 5,
    leaderboardLimit: 5,
    maxProps: 0
  },
  {
    name: "All-Star",
    profileDir: path.join(EVIDENCE_DIR, "p21-allstar-auth-profile"),
    propsAllowed: true,
    trendsAllowed: true,
    topBetAllowed: false,
    maxRankingsPerGame: 99,
    leaderboardLimit: 7,
    maxProps: 10
  },
  {
    name: "Hall-of-Famer",
    profileDir: path.join(EVIDENCE_DIR, "p21-hof-auth-profile"),
    propsAllowed: true,
    trendsAllowed: true,
    topBetAllowed: true,
    maxRankingsPerGame: 99,
    leaderboardLimit: 12,
    maxProps: 25
  },
  {
    name: "Legend",
    profileDir: path.join(EVIDENCE_DIR, "p21-auth-profile"),
    propsAllowed: true,
    trendsAllowed: true,
    topBetAllowed: true,
    maxRankingsPerGame: 99,
    leaderboardLimit: 20,
    maxProps: 99999
  }
];

const LEAGUES = [
  {
    key: "nba",
    oddsRoute: "/nba-odds.html",
    propsRoute: "/nba-props.html",
    trendsRoute: "/nba-trends.html",
    oddsContainer: "#nba-bets-container",
    oddsLeaderboard: "#nba-leaderboard",
    propsContainer: "#nba-props-container",
    propsLeaderboard: "#nba-props-leaderboard",
    homeBet: "#home-top-nba-bet"
  },
  {
    key: "nhl",
    oddsRoute: "/nhl-odds.html",
    propsRoute: "/nhl-props.html",
    trendsRoute: "/nhl-trends.html",
    oddsContainer: "#nhl-bets-container",
    oddsLeaderboard: "#nhl-leaderboard",
    propsContainer: "#nhl-props-container",
    propsLeaderboard: "#nhl-props-leaderboard",
    homeBet: "#home-top-nhl-bet"
  },
  {
    key: "mlb",
    oddsRoute: "/mlb-odds.html",
    propsRoute: "/mlb-props.html",
    trendsRoute: "/mlb-trends.html",
    oddsContainer: "#mlb-bets-container",
    oddsLeaderboard: "#mlb-leaderboard",
    propsContainer: "#mlb-props-container",
    propsLeaderboard: "#mlb-props-leaderboard",
    homeBet: "#home-top-mlb-bet"
  },
  {
    key: "nfl",
    oddsRoute: "/nfl-odds.html",
    propsRoute: "/nfl-props.html",
    trendsRoute: "/nfl-trends.html",
    oddsContainer: "#nfl-bets-container",
    oddsLeaderboard: "#nfl-leaderboard",
    propsContainer: "#nfl-props-container",
    propsLeaderboard: "#nfl-props-leaderboard",
    homeBet: "#home-top-nfl-bet"
  }
];

const report = {
  phase: "P21 D6",
  description: "Five-tier production frontend gating QA",
  baseUrl: BASE_URL,
  generatedAt: new Date().toISOString(),
  assertions: [],
  notExercised: [],
  browserHealth: [],
  summary: {}
};

let passCount = 0;
let failCount = 0;
let notExercisedCount = 0;

function pass(tier, area, message, details = {}) {
  passCount++;
  report.assertions.push({
    status: "PASS",
    tier,
    area,
    message,
    ...details
  });
  console.log(`PASS — ${tier} — ${area} — ${message}`);
}

function fail(tier, area, message, details = {}) {
  failCount++;
  report.assertions.push({
    status: "FAIL",
    tier,
    area,
    message,
    ...details
  });
  console.log(`FAIL — ${tier} — ${area} — ${message}`);
}

function notExercised(tier, area, message, details = {}) {
  notExercisedCount++;
  report.notExercised.push({
    status: "NOT_EXERCISED",
    tier,
    area,
    message,
    ...details
  });
  console.log(`NOT_EXERCISED — ${tier} — ${area} — ${message}`);
}

async function gotoAndSettle(page, route) {
  const response = await page.goto(`${BASE_URL}${route}`, {
    waitUntil: "domcontentloaded",
    timeout: 45000
  });

  await page.waitForTimeout(3000);

  return response;
}

async function getCurrentTier(page) {
  return await page.evaluate(async () => {
    if (
      typeof supabaseClient === "undefined" ||
      !supabaseClient?.auth
    ) {
      return {
        ok: false,
        reason: "Supabase client unavailable"
      };
    }

    /*
     * Match the already-proven P21 D5 authentication pattern:
     * refresh the persisted session first, then fall back to
     * getSession() if refresh does not produce a session.
     *
     * No access token is returned to Node or written to evidence.
     */
    const {
      data: refreshedData,
      error: refreshError
    } = await supabaseClient.auth.refreshSession();

    let session = refreshedData?.session || null;

    if (refreshError || !session?.user) {
      const {
        data: sessionData,
        error: sessionError
      } = await supabaseClient.auth.getSession();

      if (sessionError) {
        return {
          ok: false,
          reason: sessionError.message || "Session lookup failed"
        };
      }

      session = sessionData?.session || null;
    }

    if (!session?.user?.id) {
      return {
        ok: false,
        reason: "No authenticated session after refresh/getSession"
      };
    }

    const {
      data: profile,
      error: profileError
    } = await supabaseClient
      .from("profiles")
      .select("id,email,tier")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profileError) {
      return {
        ok: false,
        reason:
          profileError.message ||
          "Profile query failed"
      };
    }

    if (!profile) {
      return {
        ok: false,
        reason: "Profile missing"
      };
    }

    return {
      ok: true,
      tier: profile.tier || null,
      emailPresent: Boolean(profile.email)
    };
  });
}

async function testIdentity(page, tier) {
  const response = await gotoAndSettle(page, "/auth.html");

  if (response && response.status() === 200) {
    pass(tier.name, "Identity", "Auth page returned HTTP 200");
  } else {
    fail(
      tier.name,
      "Identity",
      `Auth page did not return HTTP 200`,
      { status: response ? response.status() : null }
    );
    return false;
  }

  const identity = await getCurrentTier(page);

  if (!identity.ok) {
    fail(
      tier.name,
      "Identity",
      "Persistent authenticated session unavailable",
      { reason: identity.reason }
    );
    return false;
  }

  pass(tier.name, "Identity", "Persistent authenticated session exists");

  if (identity.tier === tier.name) {
    pass(
      tier.name,
      "Identity",
      `Profile tier exactly ${tier.name}`
    );
  } else {
    fail(
      tier.name,
      "Identity",
      `Expected ${tier.name} profile but received ${identity.tier}`,
      { actualTier: identity.tier }
    );
    return false;
  }

  if (identity.emailPresent) {
    pass(tier.name, "Identity", "Authenticated profile has email identity");
  } else {
    fail(tier.name, "Identity", "Authenticated profile email missing");
  }

  return true;
}

async function testOdds(page, tier, league) {
  const response = await gotoAndSettle(page, league.oddsRoute);
  const label = `${league.key.toUpperCase()} Game Odds`;

  if (response && response.status() === 200) {
    pass(tier.name, label, "Page returned HTTP 200");
  } else {
    fail(
      tier.name,
      label,
      "Page did not return HTTP 200",
      { status: response ? response.status() : null }
    );
    return;
  }

  const containerExists =
    (await page.locator(league.oddsContainer).count()) > 0;

  if (containerExists) {
    pass(tier.name, label, "Game Odds container exists");
  } else {
    fail(tier.name, label, "Game Odds container missing");
    return;
  }

  const lockedPageText = await page
    .locator(league.oddsContainer)
    .innerText()
    .catch(() => "");

  if (/game odds locked|upgrade.*game odds/i.test(lockedPageText)) {
    fail(
      tier.name,
      label,
      "Game Odds incorrectly locked for a valid tier"
    );
  } else {
    pass(
      tier.name,
      label,
      "Game Odds not tier-locked"
    );
  }

  const rankCounts = await page
    .locator(`${league.oddsContainer} .bet-card`)
    .evaluateAll(cards =>
      cards.map(card => card.querySelectorAll(".rank-item").length)
    )
    .catch(() => []);

  if (!rankCounts.length) {
    notExercised(
      tier.name,
      label,
      "No rendered bet cards available to exercise per-game ranking cap"
    );
  } else {
    const maxObserved = Math.max(...rankCounts);

    if (maxObserved <= tier.maxRankingsPerGame) {
      pass(
        tier.name,
        label,
        `Per-game rendered rankings do not exceed tier cap ${tier.maxRankingsPerGame}`,
        { maxObserved }
      );
    } else {
      fail(
        tier.name,
        label,
        `Rendered rankings exceeded tier cap ${tier.maxRankingsPerGame}`,
        { maxObserved }
      );
    }
  }

  const leaderboardExists =
    (await page.locator(league.oddsLeaderboard).count()) > 0;

  if (!leaderboardExists) {
    fail(tier.name, label, "Odds leaderboard container missing");
    return;
  }

  const leaderboardCount = await page
    .locator(`${league.oddsLeaderboard} .leaderboard-item`)
    .count();

  if (leaderboardCount === 0) {
    notExercised(
      tier.name,
      label,
      "No leaderboard items available to exercise leaderboard cap"
    );
  } else if (leaderboardCount <= tier.leaderboardLimit) {
    pass(
      tier.name,
      label,
      `Leaderboard count does not exceed tier cap ${tier.leaderboardLimit}`,
      { leaderboardCount }
    );
  } else {
    fail(
      tier.name,
      label,
      `Leaderboard count exceeded tier cap ${tier.leaderboardLimit}`,
      { leaderboardCount }
    );
  }
}

async function testProps(page, tier, league) {
  const response = await gotoAndSettle(page, league.propsRoute);
  const label = `${league.key.toUpperCase()} Player Props`;

  if (response && response.status() === 200) {
    pass(tier.name, label, "Page returned HTTP 200");
  } else {
    fail(
      tier.name,
      label,
      "Page did not return HTTP 200",
      { status: response ? response.status() : null }
    );
    return;
  }

  const containerExists =
    (await page.locator(league.propsContainer).count()) > 0;

  if (!containerExists) {
    fail(tier.name, label, "Player Props container missing");
    return;
  }

  pass(tier.name, label, "Player Props container exists");

  const container = page.locator(league.propsContainer);
  const text = await container.innerText().catch(() => "");
  const lockedBoxCount =
    await container.locator(".props-locked-box").count();

  if (!tier.propsAllowed) {
    if (
      lockedBoxCount > 0 &&
      /player props locked/i.test(text) &&
      /all-star/i.test(text)
    ) {
      pass(
        tier.name,
        label,
        "Unauthorized tier receives Player Props upgrade state"
      );
    } else {
      fail(
        tier.name,
        label,
        "Unauthorized tier did not receive expected Player Props locked state",
        { text: text.slice(0, 500) }
      );
    }

    const protectedCards =
      await container.locator(".prop-card").count();

    if (protectedCards === 0) {
      pass(
        tier.name,
        label,
        "No protected Player Props cards rendered"
      );
    } else {
      fail(
        tier.name,
        label,
        "Protected Player Props cards rendered for unauthorized tier",
        { protectedCards }
      );
    }

    return;
  }

  if (lockedBoxCount > 0 && /player props locked/i.test(text)) {
    fail(
      tier.name,
      label,
      "Authorized tier incorrectly received Player Props locked state"
    );
    return;
  }

  pass(
    tier.name,
    label,
    "Authorized tier not blocked by Player Props upgrade state"
  );

  const propCards = await container.locator(".prop-card").count();

  if (propCards === 0) {
    notExercised(
      tier.name,
      label,
      "No current prop cards available to exercise visible-prop cap"
    );
  } else if (propCards <= tier.maxProps) {
    pass(
      tier.name,
      label,
      `Visible props do not exceed tier cap ${tier.maxProps}`,
      { propCards }
    );
  } else {
    fail(
      tier.name,
      label,
      `Visible props exceeded tier cap ${tier.maxProps}`,
      { propCards }
    );
  }

  const leaderboardExists =
    (await page.locator(league.propsLeaderboard).count()) > 0;

  if (!leaderboardExists) {
    fail(tier.name, label, "Props leaderboard container missing");
    return;
  }

  const leaderboardCount = await page
    .locator(`${league.propsLeaderboard} .leaderboard-item`)
    .count();

  const expectedCap = Math.min(tier.leaderboardLimit, 10);

  if (leaderboardCount === 0) {
    notExercised(
      tier.name,
      label,
      "No props leaderboard rows available to exercise leaderboard cap"
    );
  } else if (leaderboardCount <= expectedCap) {
    pass(
      tier.name,
      label,
      `Props leaderboard does not exceed cap ${expectedCap}`,
      { leaderboardCount }
    );
  } else {
    fail(
      tier.name,
      label,
      `Props leaderboard exceeded cap ${expectedCap}`,
      { leaderboardCount }
    );
  }
}

async function testTrends(page, tier, league) {
  const response = await gotoAndSettle(page, league.trendsRoute);
  const label = `${league.key.toUpperCase()} Player Trends`;

  if (response && response.status() === 200) {
    pass(tier.name, label, "Page returned HTTP 200");
  } else {
    fail(
      tier.name,
      label,
      "Page did not return HTTP 200",
      { status: response ? response.status() : null }
    );
    return;
  }

  const bodyText = await page.locator("body").innerText().catch(() => "");

  const hasLockedState =
    /player trends locked/i.test(bodyText) ||
    (
      /upgrade/i.test(bodyText) &&
      /player trends/i.test(bodyText)
    );

  if (!tier.trendsAllowed) {
    if (hasLockedState) {
      pass(
        tier.name,
        label,
        "Unauthorized tier receives Player Trends locked state"
      );
    } else {
      fail(
        tier.name,
        label,
        "Unauthorized tier did not receive expected Player Trends locked state"
      );
    }
  } else {
    if (hasLockedState) {
      fail(
        tier.name,
        label,
        "Authorized tier incorrectly receives Player Trends locked state"
      );
    } else {
      pass(
        tier.name,
        label,
        "Authorized tier not blocked by Player Trends gating"
      );
    }
  }
}

async function testHomepageTopBets(page, tier) {
  const response = await gotoAndSettle(page, "/");
  const label = "Homepage Top Bet";

  if (response && response.status() === 200) {
    pass(tier.name, label, "Homepage returned HTTP 200");
  } else {
    fail(
      tier.name,
      label,
      "Homepage did not return HTTP 200",
      { status: response ? response.status() : null }
    );
    return;
  }

  for (const league of LEAGUES) {
    const leagueLabel =
      `${league.key.toUpperCase()} Homepage Top Bet`;

    const locator = page.locator(league.homeBet);

    if ((await locator.count()) === 0) {
      fail(
        tier.name,
        leagueLabel,
        "Homepage Top Bet container missing"
      );
      continue;
    }

    const text = (await locator.innerText().catch(() => "")).trim();

    const exposesTopBet =
      /featured high-ev play/i.test(text) ||
      /\btop bet:/i.test(text);

    if (!tier.topBetAllowed) {
      if (!exposesTopBet) {
        pass(
          tier.name,
          leagueLabel,
          "Restricted tier does not expose Top Bet content"
        );
      } else {
        fail(
          tier.name,
          leagueLabel,
          "Restricted tier exposed Top Bet content",
          { text: text.slice(0, 500) }
        );
      }
      continue;
    }

    if (exposesTopBet) {
      pass(
        tier.name,
        leagueLabel,
        "Top Bet content visible for authorized tier"
      );
    } else {
      notExercised(
        tier.name,
        leagueLabel,
        "No current Top Bet data rendered; authorization path could not be visually exercised",
        { text: text.slice(0, 300) }
      );
    }
  }
}

async function runTier(tier) {
  console.log("\n==================================================");
  console.log(`P21 D6 — ${tier.name}`);
  console.log("==================================================");

  if (!fs.existsSync(tier.profileDir)) {
    fail(
      tier.name,
      "Profile",
      "Persistent browser profile directory missing",
      { profileDir: tier.profileDir }
    );
    return;
  }

  pass(
    tier.name,
    "Profile",
    "Persistent browser profile directory exists"
  );

  const context = await chromium.launchPersistentContext(
    tier.profileDir,
    {
      headless: true,
      viewport: {
        width: 1440,
        height: 1100
      }
    }
  );

  const page = context.pages()[0] || await context.newPage();

  const jsExceptions = [];
  const consoleErrors = [];
  const failedRequests = [];
  const unexpectedHttpFailures = [];
  const expectedProtectedFailures = [];

  page.on("pageerror", error => {
    jsExceptions.push(error.message || String(error));
  });

  page.on("console", message => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("requestfailed", request => {
    failedRequests.push({
      url: request.url(),
      error: request.failure()?.errorText || "unknown"
    });
  });

  page.on("response", response => {
    const status = response.status();
    if (status < 400) return;

    const url = response.url();

    const isExpectedProtected403 =
      !tier.propsAllowed &&
      status === 403 &&
      /\/\.netlify\/functions\/(nba|nhl|mlb|nfl)-props-premium/i.test(url);

    if (isExpectedProtected403) {
      expectedProtectedFailures.push({
        status,
        url
      });
      return;
    }

    unexpectedHttpFailures.push({
      status,
      url
    });
  });

  try {
    const identityOK = await testIdentity(page, tier);

    if (!identityOK) {
      fail(
        tier.name,
        "Tier Run",
        "Tier-specific UI checks skipped because authenticated identity was not valid"
      );
    } else {
      for (const league of LEAGUES) {
        await testOdds(page, tier, league);
      }

      for (const league of LEAGUES) {
        await testProps(page, tier, league);
      }

      for (const league of LEAGUES) {
        await testTrends(page, tier, league);
      }

      await testHomepageTopBets(page, tier);
    }
  } catch (error) {
    fail(
      tier.name,
      "Tier Run",
      "Unexpected automation exception",
      {
        error: error.stack || error.message || String(error)
      }
    );
  }

  if (jsExceptions.length === 0) {
    pass(
      tier.name,
      "Browser Health",
      "No uncaught JavaScript exceptions"
    );
  } else {
    fail(
      tier.name,
      "Browser Health",
      "Uncaught JavaScript exceptions observed",
      { jsExceptions }
    );
  }

    const filteredConsoleErrors = consoleErrors.filter(message => {
    if (!tier.propsAllowed) {
        const isExpectedProtected403Console =
        /403|failed to load resource/i.test(message);

        const isExpectedPremiumPropsDenial =
        /^(NBA|NHL|MLB|NFL) props render error:\s*Error:\s*(NBA|NHL|MLB|NFL) premium props require All-Star or higher$/i.test(
            message.trim()
        );

        if (
        isExpectedProtected403Console ||
        isExpectedPremiumPropsDenial
        ) {
        return false;
        }
    }

    return true;
    });

  if (filteredConsoleErrors.length === 0) {
    pass(
      tier.name,
      "Browser Health",
      "No unexpected console errors"
    );
  } else {
    fail(
      tier.name,
      "Browser Health",
      "Unexpected console errors observed",
      { consoleErrors: filteredConsoleErrors }
    );
  }

  if (failedRequests.length === 0) {
    pass(
      tier.name,
      "Browser Health",
      "No failed browser network requests"
    );
  } else {
    fail(
      tier.name,
      "Browser Health",
      "Failed browser network requests observed",
      { failedRequests }
    );
  }

  if (unexpectedHttpFailures.length === 0) {
    pass(
      tier.name,
      "Browser Health",
      "No unexpected HTTP failures"
    );
  } else {
    fail(
      tier.name,
      "Browser Health",
      "Unexpected HTTP failures observed",
      { unexpectedHttpFailures }
    );
  }

  if (!tier.propsAllowed) {
    if (expectedProtectedFailures.length >= 4) {
      pass(
        tier.name,
        "Browser Health",
        "Expected protected Player Props 403 responses observed",
        {
          count: expectedProtectedFailures.length
        }
      );
    } else {
      fail(
        tier.name,
        "Browser Health",
        "Expected four-league protected Player Props 403 coverage was incomplete",
        {
          count: expectedProtectedFailures.length
        }
      );
    }
  }

  report.browserHealth.push({
    tier: tier.name,
    jsExceptions,
    consoleErrors,
    failedRequests,
    unexpectedHttpFailures,
    expectedProtectedFailures
  });

  await context.close();
}

(async () => {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

  console.log("P21 D6 — Five-Tier Production Frontend Gating QA");
  console.log(`Target: ${BASE_URL}`);
  console.log("");

  for (const tier of TIERS) {
    await runTier(tier);
  }

  report.summary = {
    pass: passCount,
    fail: failCount,
    notExercised: notExercisedCount,
    blockers: failCount,
    status: failCount === 0 ? "PASS" : "FAIL"
  };

  fs.writeFileSync(
    REPORT_PATH,
    JSON.stringify(report, null, 2),
    "utf8"
  );

  console.log("\n==================================================");
  console.log("P21 D6 SUMMARY");
  console.log("==================================================");
  console.log(`PASS: ${passCount}`);
  console.log(`FAIL: ${failCount}`);
  console.log(`NOT_EXERCISED: ${notExercisedCount}`);
  console.log(`BLOCKERS: ${failCount}`);
  console.log(`REPORT: ${REPORT_PATH}`);
  console.log(
    `P21 D6 STATUS: ${failCount === 0 ? "PASS" : "FAIL"}`
  );

  if (failCount > 0) {
    process.exitCode = 1;
  }
})().catch(error => {
  console.error("\nP21 D6 FATAL ERROR");
  console.error(error);
  process.exitCode = 1;
});