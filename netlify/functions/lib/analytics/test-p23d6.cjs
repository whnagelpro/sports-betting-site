const {
  chromium
} = require("playwright");

const fs = require("fs");
const path = require("path");

const BASE =
  "https://sportacularanalytics.com";

const PROFILE =
  process.env.P23_D6_PROFILE ||
  "/tmp/sportacular-p23d6-live-legend";

const REPORT_PATH = path.join(
  process.cwd(),
  "p23-evidence",
  "p23d6-report.json"
);

const steps = [
  {
    name: "Auth — Portrait",
    path: "/auth.html",
    width: 390,
    height: 844
  },
  {
    name: "Home — Portrait",
    path: "/index.html",
    width: 390,
    height: 844
  },
  {
    name: "NBA Props — Portrait",
    path: "/nba-props.html",
    width: 390,
    height: 844
  },
  {
    name: "NBA Trends — Portrait",
    path: "/nba-trends.html",
    width: 390,
    height: 844
  },
  {
    name: "NBA Props — Landscape",
    path: "/nba-props.html",
    width: 844,
    height: 390
  },
  {
    name: "NBA Trends — Landscape",
    path: "/nba-trends.html",
    width: 844,
    height: 390
  },
  {
    name: "Home — Portrait Return",
    path: "/index.html",
    width: 390,
    height: 844
  }
];

async function readSafeSession(page) {
  return page.evaluate(async () => {
    const started = Date.now();

    while (
      (
        typeof supabaseClient ===
          "undefined" ||
        !supabaseClient?.auth
      ) &&
      Date.now() - started < 10000
    ) {
      await new Promise(
        resolve =>
          setTimeout(resolve, 100)
      );
    }

    if (
      typeof supabaseClient ===
        "undefined" ||
      !supabaseClient?.auth
    ) {
      return {
        clientAvailable: false,
        authenticated: false,
        tier: null
      };
    }

    let result =
      await supabaseClient.auth
        .getSession();

    let session =
      result?.data?.session || null;

    if (!session) {
      result =
        await supabaseClient.auth
          .refreshSession();

      session =
        result?.data?.session || null;
    }

    if (!session?.user) {
      return {
        clientAvailable: true,
        authenticated: false,
        tier: null
      };
    }

    const profile =
      await supabaseClient
        .from("profiles")
        .select("tier")
        .eq(
          "id",
          session.user.id
        )
        .single();

    return {
      clientAvailable: true,
      authenticated: true,
      tier:
        profile?.data?.tier || null
    };
  });
}

function assertion(
  type,
  expected,
  actual,
  passed
) {
  return {
    type,
    expected,
    actual,
    passed
  };
}

(async () => {
  console.log(
    "=== P23 D6 MOBILE AUTHENTICATION + SESSION PERSISTENCE QA ==="
  );

  console.log(
    "Production | Chromium | Existing disposable authenticated profile"
  );

  if (!fs.existsSync(PROFILE)) {
    throw new Error(
      "Disposable authenticated profile not found: " +
      PROFILE
    );
  }

  const results = [];

  let assertions = 0;
  let passedAssertions = 0;
  let failedAssertions = 0;
  let notExercised = 0;

  const context =
    await chromium.launchPersistentContext(
      PROFILE,
      {
        headless: true,
        viewport: {
          width: 390,
          height: 844
        },
        hasTouch: true
      }
    );

  const page =
    context.pages()[0] ||
    await context.newPage();

  /*
   * These seven cases validate that the same
   * authenticated production session survives
   * navigation plus portrait/landscape changes.
   */
  for (const step of steps) {
    await page.setViewportSize({
      width: step.width,
      height: step.height
    });

    await page.goto(
      BASE + step.path,
      {
        waitUntil:
          "domcontentloaded",
        timeout: 30000
      }
    );

    /*
     * Allow authenticated UI/data state to settle.
     * NBA Trends may continue rendering asynchronously,
     * but session/layout assertions do not depend on
     * the final number of rendered trend cards.
     */
    await page.waitForTimeout(1200);

    const session =
      await readSafeSession(page);

    const layout =
      await page.evaluate(() => {
        const doc =
          document.documentElement;

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

          bodyLength:
            bodyText.length
        };
      });

    const caseAssertions = [
      assertion(
        "supabase-client",
        true,
        session.clientAvailable,
        session.clientAvailable === true
      ),

      assertion(
        "authenticated-session",
        true,
        session.authenticated,
        session.authenticated === true
      ),

      assertion(
        "profile-tier",
        "Legend",
        session.tier,
        session.tier === "Legend"
      ),

      assertion(
        "horizontal-overflow",
        false,
        layout.horizontalOverflow,
        layout.horizontalOverflow === false
      ),

      assertion(
        "meaningful-page-content",
        "bodyLength > 100",
        layout.bodyLength,
        layout.bodyLength > 100
      )
    ];

    const casePassed =
      caseAssertions.every(
        item => item.passed
      );

    for (
      const item
      of caseAssertions
    ) {
      assertions++;

      if (item.passed) {
        passedAssertions++;
      } else {
        failedAssertions++;
      }
    }

    results.push({
      case: step.name,
      path: step.path,
      viewport:
        `${step.width}x${step.height}`,
      authenticated:
        session.authenticated,
      tier: session.tier,
      clientWidth:
        layout.clientWidth,
      scrollWidth:
        layout.scrollWidth,
      status:
        casePassed
          ? "PASS"
          : "FAIL",
      assertions:
        caseAssertions,
      notExercised: []
    });

    console.log(
      `${casePassed ? "PASS" : "FAIL"} | ` +
      `${step.name} | ` +
      `${step.width}x${step.height} | ` +
      `auth=${session.authenticated} | ` +
      `tier=${session.tier || "NONE"} | ` +
      `overflow=${layout.horizontalOverflow} | ` +
      `body=${layout.bodyLength}`
    );
  }

  /*
   * Explicit reload case.
   */
  console.log(
    "\n--- Explicit reload persistence ---"
  );

  await page.reload({
    waitUntil:
      "domcontentloaded",
    timeout: 30000
  });

  await page.waitForTimeout(1200);

  const reloadSession =
    await readSafeSession(page);

  const reloadAssertions = [
    assertion(
      "supabase-client-after-reload",
      true,
      reloadSession.clientAvailable,
      reloadSession.clientAvailable === true
    ),

    assertion(
      "authenticated-after-reload",
      true,
      reloadSession.authenticated,
      reloadSession.authenticated === true
    ),

    assertion(
      "profile-tier-after-reload",
      "Legend",
      reloadSession.tier,
      reloadSession.tier === "Legend"
    )
  ];

  const reloadPassed =
    reloadAssertions.every(
      item => item.passed
    );

  for (
    const item
    of reloadAssertions
  ) {
    assertions++;

    if (item.passed) {
      passedAssertions++;
    } else {
      failedAssertions++;
    }
  }

  results.push({
    case:
      "Explicit Reload Persistence",
    path: "/index.html",
    viewport: "390x844",
    authenticated:
      reloadSession.authenticated,
    tier:
      reloadSession.tier,
    status:
      reloadPassed
        ? "PASS"
        : "FAIL",
    assertions:
      reloadAssertions,
    notExercised: []
  });

  console.log(
    `${reloadPassed ? "PASS" : "FAIL"} | ` +
    `Reload | ` +
    `auth=${reloadSession.authenticated} | ` +
    `tier=${reloadSession.tier || "NONE"}`
  );

  await context.close();

  /*
   * Reopen the same disposable browser profile.
   * This validates persistence across browser
   * context close/reopen without exposing any
   * credentials or token values.
   */
  console.log(
    "\n--- Browser close/reopen persistence ---"
  );

  const reopenContext =
    await chromium.launchPersistentContext(
      PROFILE,
      {
        headless: true,
        viewport: {
          width: 390,
          height: 844
        },
        hasTouch: true
      }
    );

  const reopenPage =
    reopenContext.pages()[0] ||
    await reopenContext.newPage();

  await reopenPage.goto(
    BASE + "/auth.html",
    {
      waitUntil:
        "domcontentloaded",
      timeout: 30000
    }
  );

  await reopenPage.waitForTimeout(1200);

  const reopenSession =
    await readSafeSession(
      reopenPage
    );

  const reopenAssertions = [
    assertion(
      "supabase-client-after-reopen",
      true,
      reopenSession.clientAvailable,
      reopenSession.clientAvailable === true
    ),

    assertion(
      "authenticated-after-reopen",
      true,
      reopenSession.authenticated,
      reopenSession.authenticated === true
    ),

    assertion(
      "profile-tier-after-reopen",
      "Legend",
      reopenSession.tier,
      reopenSession.tier === "Legend"
    )
  ];

  const reopenPassed =
    reopenAssertions.every(
      item => item.passed
    );

  for (
    const item
    of reopenAssertions
  ) {
    assertions++;

    if (item.passed) {
      passedAssertions++;
    } else {
      failedAssertions++;
    }
  }

  results.push({
    case:
      "Browser Close/Reopen Persistence",
    path: "/auth.html",
    viewport: "390x844",
    authenticated:
      reopenSession.authenticated,
    tier:
      reopenSession.tier,
    status:
      reopenPassed
        ? "PASS"
        : "FAIL",
    assertions:
      reopenAssertions,
    notExercised: []
  });

  console.log(
    `${reopenPassed ? "PASS" : "FAIL"} | ` +
    `Reopen | ` +
    `auth=${reopenSession.authenticated} | ` +
    `tier=${reopenSession.tier || "NONE"}`
  );

  await reopenContext.close();

  const casePass =
    results.filter(
      result =>
        result.status === "PASS"
    ).length;

  const caseFail =
    results.filter(
      result =>
        result.status === "FAIL"
    ).length;

  const status =
    caseFail === 0 &&
    failedAssertions === 0
      ? "PASS"
      : "FAIL";

  const report = {
    milestone: "P23 D6",
    title:
      "Mobile Authentication + Session Persistence QA",
    environment:
      "production",
    baseUrl: BASE,
    browser:
      "Chromium",
    authenticatedTier:
      "Legend",
    profileSource:
      "Disposable local authenticated browser profile; credentials and session tokens are not stored in this report.",
    scope: [
      "Authenticated mobile navigation persistence",
      "Portrait-to-landscape session persistence",
      "Landscape-to-portrait session persistence",
      "Explicit page reload persistence",
      "Browser close/reopen persistence",
      "Authenticated responsive overflow regression"
    ],
    productionFix: {
      commit:
        "82d695d",
      deploy:
        "6adba36e5c60c9ab59d639b2",
      description:
        "Authenticated tablet navigation overflow fix for 769px through 850px."
    },
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
    "\n=== RESULT ==="
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
