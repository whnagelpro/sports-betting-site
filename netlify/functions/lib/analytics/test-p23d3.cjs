const fs = require("fs");
const path = require("path");
const {
  chromium,
  firefox,
  webkit
} = require("playwright");

const BASE =
  "https://sportacularanalytics.com";

const REPORT_PATH = path.resolve(
  process.cwd(),
  "p23-evidence/p23d3-report.json"
);

const browsers = [
  ["Chromium", chromium],
  ["Firefox", firefox],
  ["WebKit", webkit]
];

const viewports = [
  ["Mobile 390x844", { width: 390, height: 844 }],
  ["Tablet 768x1024", { width: 768, height: 1024 }],
  ["Desktop 1280x900", { width: 1280, height: 900 }]
];

const results = [];
let assertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function recordAssertion(
  caseResult,
  name,
  actual,
  expected = true
) {
  assertions++;

  const pass = actual === expected;

  if (pass) {
    passedAssertions++;
  } else {
    failedAssertions++;
  }

  caseResult.assertions.push({
    name,
    expected,
    actual,
    pass
  });

  return pass;
}

function noHorizontalOverflow() {
  return (
    document.documentElement.scrollWidth <=
    document.documentElement.clientWidth + 1
  );
}

async function runCase({
  browserName,
  browserType,
  viewportName,
  viewport,
  surface,
  execute
}) {
  const browser = await browserType.launch({
    headless: true
  });

  const context = await browser.newContext({
    viewport
  });

  const page = await context.newPage();

  const caseResult = {
    browser: browserName,
    viewport: viewportName,
    surface,
    assertions: [],
    pass: false
  };

  try {
    await execute(
      page,
      caseResult
    );

    caseResult.pass =
      caseResult.assertions.length > 0 &&
      caseResult.assertions.every(
        assertion => assertion.pass
      );
  } catch (error) {
    recordAssertion(
      caseResult,
      "Case completed without exception",
      false,
      true
    );

    caseResult.error =
      error && error.stack
        ? error.stack
        : String(error);
  } finally {
    results.push(caseResult);

    console.log(
      `${browserName} / ${viewportName} / ${surface}: ${
        caseResult.pass ? "PASS" : "FAIL"
      }`
    );

    const failures =
      caseResult.assertions.filter(
        assertion => !assertion.pass
      );

    for (const failure of failures) {
      console.log(
        `  FAIL: ${failure.name} | expected=${JSON.stringify(
          failure.expected
        )} actual=${JSON.stringify(
          failure.actual
        )}`
      );
    }

    if (caseResult.error) {
      console.log(
        `  ERROR: ${caseResult.error}`
      );
    }

    await context.close();
    await browser.close();
  }
}

async function testPricingToggle(
  page,
  caseResult
) {
  const response = await page.goto(
    `${BASE}/pricing.html`,
    {
      waitUntil: "networkidle",
      timeout: 60000
    }
  );

  recordAssertion(
    caseResult,
    "Pricing page HTTP OK",
    !!response &&
      response.status() >= 200 &&
      response.status() < 400
  );

  const toggle =
    page.locator("#billing-toggle");

  const slider =
    page.locator(".billing-slider");

  recordAssertion(
    caseResult,
    "Billing toggle exists",
    (await toggle.count()) === 1
  );

  recordAssertion(
    caseResult,
    "Visible billing slider exists",
    (await slider.count()) === 1
  );

  const initial =
    await page.evaluate(() => ({
      checked:
        document.querySelector(
          "#billing-toggle"
        )?.checked ?? null,

      monthlyVisible:
        [...document.querySelectorAll(
          ".monthly-price"
        )].filter(el =>
          getComputedStyle(el).display !==
          "none"
        ).length,

      annualVisible:
        [...document.querySelectorAll(
          ".annual-price"
        )].filter(el =>
          getComputedStyle(el).display !==
          "none"
        ).length,

      noOverflow:
        document.documentElement
          .scrollWidth <=
        document.documentElement
          .clientWidth + 1
    }));

  recordAssertion(
    caseResult,
    "Pricing defaults to monthly",
    initial.checked,
    false
  );

  recordAssertion(
    caseResult,
    "Five monthly prices visible initially",
    initial.monthlyVisible,
    5
  );

  recordAssertion(
    caseResult,
    "No annual prices visible initially",
    initial.annualVisible,
    0
  );

  recordAssertion(
    caseResult,
    "Pricing page has no horizontal overflow initially",
    initial.noOverflow
  );

  await slider.click();

  await page.waitForTimeout(150);

  const annual =
    await page.evaluate(() => ({
      checked:
        document.querySelector(
          "#billing-toggle"
        )?.checked ?? null,

      monthlyVisible:
        [...document.querySelectorAll(
          ".monthly-price"
        )].filter(el =>
          getComputedStyle(el).display !==
          "none"
        ).length,

      annualVisible:
        [...document.querySelectorAll(
          ".annual-price"
        )].filter(el =>
          getComputedStyle(el).display !==
          "none"
        ).length
    }));

  recordAssertion(
    caseResult,
    "Billing toggle switches to annual",
    annual.checked,
    true
  );

  recordAssertion(
    caseResult,
    "Monthly prices hidden in annual mode",
    annual.monthlyVisible,
    0
  );

  recordAssertion(
    caseResult,
    "Five annual prices visible",
    annual.annualVisible,
    5
  );

  await slider.click();

  await page.waitForTimeout(150);

  recordAssertion(
    caseResult,
    "Billing toggle returns to monthly",
    await toggle.isChecked(),
    false
  );
}

async function testGameOddsControls(
  page,
  caseResult
) {
  const response = await page.goto(
    `${BASE}/nba-odds.html`,
    {
      waitUntil: "networkidle",
      timeout: 60000
    }
  );

  recordAssertion(
    caseResult,
    "NBA Game Odds HTTP OK",
    !!response &&
      response.status() >= 200 &&
      response.status() < 400
  );

  await page.waitForTimeout(1500);

  const game =
    page.locator("#nba-game-filter");

  const sportsbook =
    page.locator(
      "#nba-sportsbook-filter"
    );

  const reset =
    page.locator(
      "#nba-odds-reset-filters"
    );

  recordAssertion(
    caseResult,
    "Game filter exists",
    (await game.count()) === 1
  );

  recordAssertion(
    caseResult,
    "Sportsbook filter exists",
    (await sportsbook.count()) === 1
  );

  recordAssertion(
    caseResult,
    "Reset control exists",
    (await reset.count()) === 1
  );

  const gameValues =
    await game
      .locator("option")
      .evaluateAll(options =>
        options
          .map(option => option.value)
          .filter(Boolean)
      );

  const sportsbookValues =
    await sportsbook
      .locator("option")
      .evaluateAll(options =>
        options
          .map(option => option.value)
          .filter(Boolean)
      );

  recordAssertion(
    caseResult,
    "At least one real game filter value exists",
    gameValues.length > 0
  );

  recordAssertion(
    caseResult,
    "At least one real sportsbook value exists",
    sportsbookValues.length > 0
  );

  if (gameValues.length > 0) {
    await game.selectOption(
      gameValues[0]
    );

    recordAssertion(
      caseResult,
      "Real game selection applies",
      await game.inputValue(),
      gameValues[0]
    );
  }

  if (sportsbookValues.length > 0) {
    await sportsbook.selectOption(
      sportsbookValues[0]
    );

    recordAssertion(
      caseResult,
      "Real sportsbook selection applies",
      await sportsbook.inputValue(),
      sportsbookValues[0]
    );
  }

  await reset.click();

  recordAssertion(
    caseResult,
    "Game filter resets to All",
    await game.inputValue(),
    "All"
  );

  recordAssertion(
    caseResult,
    "Sportsbook filter resets to All",
    await sportsbook.inputValue(),
    "All"
  );

  await page.waitForFunction(() => {
    const text =
      document.body.innerText
        .replace(/\s+/g, " ")
        .trim();

    return /Tier:\s*Rookie/i.test(text);
  }, {
    timeout: 15000
  });

  const body =
    (await page.locator("body").innerText())
      .replace(/\s+/g, " ")
      .trim();

  recordAssertion(
    caseResult,
    "Logged-out/default Game Odds remains Rookie tier",
    /Tier:\s*Rookie/i.test(body)
  );

  recordAssertion(
    caseResult,
    "Game Odds has no horizontal overflow",
    await page.evaluate(
      noHorizontalOverflow
    )
  );
}

async function testLoggedOutProps(
  page,
  caseResult
) {
  const response = await page.goto(
    `${BASE}/nba-props.html`,
    {
      waitUntil: "networkidle",
      timeout: 60000
    }
  );

  recordAssertion(
    caseResult,
    "NBA Player Props HTTP OK",
    !!response &&
      response.status() >= 200 &&
      response.status() < 400
  );

  await page.waitForTimeout(1000);

  await page.waitForFunction(() => {
    const text =
      document.body.innerText
        .replace(/\s+/g, " ")
        .trim();

    return (
      /Login Required/i.test(text) &&
      /Tier:\s*Not Logged In/i.test(text)
    );
  }, {
    timeout: 15000
  });

  const body =
    (await page.locator("body").innerText())
      .replace(/\s+/g, " ")
      .trim();

  recordAssertion(
    caseResult,
    "Player Props shows Login Required",
    /Login Required/i.test(body)
  );

  recordAssertion(
    caseResult,
    "Player Props reports Not Logged In tier",
    /Tier:\s*Not Logged In/i.test(body)
  );

  const selectors = [
    "#nba-props-game-filter",
    "#nba-prop-type-filter",
    "#nba-player-filter",
    "#nba-props-sort-filter",
    "#nba-props-sportsbook-filter"
  ];

  for (const selector of selectors) {
    const locator =
      page.locator(selector);

    recordAssertion(
      caseResult,
      `${selector} exists`,
      (await locator.count()) === 1
    );

    if (
      (await locator.count()) === 1
    ) {
      recordAssertion(
        caseResult,
        `${selector} disabled while logged out`,
        await locator.isDisabled()
      );
    }
  }

  recordAssertion(
    caseResult,
    "Props reset control remains visible",
    await page
      .locator(
        "#nba-props-reset-filters"
      )
      .isVisible()
      .catch(() => false)
  );

  const loginHref =
    await page
      .locator(
        'a[href*="auth"]'
      )
      .filter({
        hasText: /log in/i
      })
      .first()
      .getAttribute("href")
      .catch(() => null);

  recordAssertion(
    caseResult,
    "Player Props exposes login CTA",
    !!loginHref
  );

  recordAssertion(
    caseResult,
    "Player Props has no horizontal overflow",
    await page.evaluate(
      noHorizontalOverflow
    )
  );
}

async function testLockedTrend(
  page,
  caseResult,
  route,
  expectedText
) {
  const response = await page.goto(
    `${BASE}${route}`,
    {
      waitUntil: "networkidle",
      timeout: 60000
    }
  );

  recordAssertion(
    caseResult,
    `${route} HTTP OK`,
    !!response &&
      response.status() >= 200 &&
      response.status() < 400
  );

  await page.waitForTimeout(1000);

  const body =
    await page.locator("body").innerText();

  recordAssertion(
    caseResult,
    `${route} shows expected tier requirement`,
    body.includes(expectedText)
  );

  recordAssertion(
    caseResult,
    `${route} exposes View Plans CTA`,
    /View Plans/i.test(body)
  );

  recordAssertion(
    caseResult,
    `${route} has no horizontal overflow`,
    await page.evaluate(
      noHorizontalOverflow
    )
  );
}

async function testPlayerProfileFlow(
  page,
  caseResult
) {
  const response = await page.goto(
    `${BASE}/nba-player-profiles.html`,
    {
      waitUntil: "networkidle",
      timeout: 60000
    }
  );

  recordAssertion(
    caseResult,
    "NBA Player Profiles directory HTTP OK",
    !!response &&
      response.status() >= 200 &&
      response.status() < 400
  );

  const team =
    page.locator(
      "#nba-player-profile-team"
    );

  const player =
    page.locator(
      "#nba-player-profile-player"
    );

  const button =
    page.locator(
      "#nba-player-profile-button"
    );

  await team.waitFor({
    state: "visible",
    timeout: 30000
  });

  recordAssertion(
    caseResult,
    "Player selector initially disabled",
    await player.isDisabled()
  );

  recordAssertion(
    caseResult,
    "View Player Profile initially disabled",
    await button.isDisabled()
  );

  const teamValues =
    await team
      .locator("option")
      .evaluateAll(options =>
        options
          .map(option => option.value)
          .filter(Boolean)
      );

  recordAssertion(
    caseResult,
    "At least one real NBA team available",
    teamValues.length > 0
  );

  if (!teamValues.length) {
    return;
  }

  await team.selectOption(
    teamValues[0]
  );

  await page.waitForFunction(() => {
    const select =
      document.querySelector(
        "#nba-player-profile-player"
      );

    return (
      select &&
      !select.disabled &&
      [...select.options].some(
        option => option.value
      )
    );
  }, {
    timeout: 30000
  });

  const playerValues =
    await player
      .locator("option")
      .evaluateAll(options =>
        options
          .map(option => option.value)
          .filter(Boolean)
      );

  recordAssertion(
    caseResult,
    "At least one real NBA player available",
    playerValues.length > 0
  );

  if (!playerValues.length) {
    return;
  }

  const realPlayerId =
    playerValues[0];

  await player.selectOption(
    realPlayerId
  );

  recordAssertion(
    caseResult,
    "View Player Profile becomes enabled",
    !(await button.isDisabled())
  );

  await Promise.all([
    page.waitForURL(url => {
      const parsed =
        new globalThis.URL(
          url.toString()
        );

      return (
        parsed.pathname.endsWith(
          "/player.html"
        ) &&
        parsed.searchParams.get(
          "league"
        ) === "nba" &&
        parsed.searchParams.get(
          "id"
        ) === realPlayerId
      );
    }, {
      timeout: 30000
    }),
    button.click()
  ]);

  await page.waitForLoadState(
    "networkidle",
    {
      timeout: 60000
    }
  ).catch(() => {});

  const parsed =
    new globalThis.URL(
      page.url()
    );

  recordAssertion(
    caseResult,
    "Player Profile URL contract correct",
    parsed.pathname.endsWith(
      "/player.html"
    ) &&
      parsed.searchParams.get(
        "league"
      ) === "nba" &&
      parsed.searchParams.get(
        "id"
      ) === realPlayerId
  );

  const body =
    await page.locator("body").innerText();

  recordAssertion(
    caseResult,
    "Real Player Profile renders substantive content",
    body.trim().length > 300
  );

  recordAssertion(
    caseResult,
    "Real Player Profile has no horizontal overflow",
    await page.evaluate(
      noHorizontalOverflow
    )
  );
}

async function testAuthView(
  page,
  caseResult,
  config
) {
  const response = await page.goto(
    `${BASE}${config.path}`,
    {
      waitUntil: "networkidle",
      timeout: 60000
    }
  );

  recordAssertion(
    caseResult,
    `${config.name} Auth HTTP OK`,
    !!response &&
      response.status() >= 200 &&
      response.status() < 400
  );

  await page.waitForSelector(
    config.visible,
    {
      state: "visible",
      timeout: 15000
    }
  );

  const state =
    await page.evaluate(
      ({ visible, controls }) => {
        const active =
          document.querySelector(
            visible
          );

        const authViews = [
          "#login-view",
          "#signup-view",
          "#reset-request-view",
          "#reset-update-view"
        ];

        const otherViewsHidden =
          authViews
            .filter(
              selector =>
                selector !== visible
            )
            .every(selector => {
              const el =
                document.querySelector(
                  selector
                );

              if (!el) {
                return true;
              }

              const style =
                getComputedStyle(el);

              return (
                style.display ===
                  "none" ||
                el.getBoundingClientRect()
                  .height === 0
              );
            });

        const controlState =
          controls.map(selector => {
            const el =
              document.querySelector(
                selector
              );

            if (!el) {
              return {
                selector,
                exists: false,
                usable: false
              };
            }

            const rect =
              el.getBoundingClientRect();

            const style =
              getComputedStyle(el);

            const isInput =
              el.tagName === "INPUT";

            return {
              selector,
              exists: true,
              usable:
                style.display !==
                  "none" &&
                style.visibility !==
                  "hidden" &&
                rect.width >= 40 &&
                rect.height >= 40 &&
                rect.left >= -1 &&
                rect.right <=
                  document
                    .documentElement
                    .clientWidth + 1 &&
                (
                  !isInput ||
                  (
                    parseFloat(
                      style.paddingTop
                    ) > 0 &&
                    parseFloat(
                      style.paddingBottom
                    ) > 0 &&
                    rect.height >= 40
                  )
                ),
              height: rect.height
            };
          });

        return {
          activeVisible:
            !!active &&
            getComputedStyle(active)
              .display !== "none",

          otherViewsHidden,

          controls:
            controlState,

          noOverflow:
            document.documentElement
              .scrollWidth <=
            document.documentElement
              .clientWidth + 1
        };
      },
      {
        visible:
          config.visible,
        controls:
          config.controls
      }
    );

  recordAssertion(
    caseResult,
    "Correct Auth view visible",
    state.activeVisible
  );

  recordAssertion(
    caseResult,
    "Other Auth views hidden",
    state.otherViewsHidden
  );

  for (
    const control of
    state.controls
  ) {
    recordAssertion(
      caseResult,
      `${control.selector} exists and is usable`,
      control.exists &&
        control.usable
    );
  }

  recordAssertion(
    caseResult,
    "Auth page has no horizontal overflow",
    state.noOverflow
  );
}

async function testTeamProfileFlow(
  page,
  caseResult
) {
  const response = await page.goto(
    `${BASE}/nba-team-profiles.html`,
    {
      waitUntil: "networkidle",
      timeout: 60000
    }
  );

  recordAssertion(
    caseResult,
    "NBA Team Profiles directory HTTP OK",
    !!response &&
      response.status() >= 200 &&
      response.status() < 400
  );

  const links =
    page.locator(
      '.team-directory a[href*="/nba-team?league=nba&team="]'
    );

  const linkCount =
    await links.count();

  recordAssertion(
    caseResult,
    "All 30 NBA team links discovered",
    linkCount,
    30
  );

  recordAssertion(
    caseResult,
    "Team directory has no horizontal overflow",
    await page.evaluate(
      noHorizontalOverflow
    )
  );

  if (!linkCount) {
    return;
  }

  const first =
    links.first();

  const href =
    (await first.getAttribute(
      "href"
    )) || "";

  const expected =
    new globalThis.URL(
      href,
      BASE
    );

  const realTeam =
    expected.searchParams.get(
      "team"
    ) || "";

  recordAssertion(
    caseResult,
    "Discovered real NBA team",
    !!realTeam
  );

  const navigationResponse =
    page.waitForResponse(response => {
      try {
        const parsed =
          new globalThis.URL(
            response.url()
          );

        return (
          response
            .request()
            .isNavigationRequest() &&
          parsed.pathname ===
            "/nba-team" &&
          parsed.searchParams.get(
            "league"
          ) === "nba" &&
          parsed.searchParams.get(
            "team"
          ) === realTeam
        );
      } catch {
        return false;
      }
    }, {
      timeout: 30000
    }).catch(() => null);

  await Promise.all([
    page.waitForURL(url => {
      const parsed =
        new globalThis.URL(
          url.toString()
        );

      return (
        parsed.pathname ===
          "/nba-team" &&
        parsed.searchParams.get(
          "league"
        ) === "nba" &&
        parsed.searchParams.get(
          "team"
        ) === realTeam
      );
    }, {
      timeout: 30000
    }),

    first.click()
  ]);

  const profileResponse =
    await navigationResponse;

  recordAssertion(
    caseResult,
    "Team Profile navigation HTTP OK",
    !!profileResponse &&
      profileResponse.status() >=
        200 &&
      profileResponse.status() <
        400
  );

  await page.waitForLoadState(
    "networkidle",
    {
      timeout: 60000
    }
  ).catch(() => {});

  await page.waitForTimeout(1000);

  const parsedFinal =
    new globalThis.URL(
      page.url()
    );

  recordAssertion(
    caseResult,
    "Team Profile URL contract correct",
    parsedFinal.pathname ===
      "/nba-team" &&
      parsedFinal.searchParams.get(
        "league"
      ) === "nba" &&
      parsedFinal.searchParams.get(
        "team"
      ) === realTeam
  );

  const body =
    (
      await page
        .locator("body")
        .innerText()
    )
      .replace(/\s+/g, " ")
      .trim();

  recordAssertion(
    caseResult,
    "Real team state rendered",
    body.includes(realTeam) &&
      !/No Team Selected/i.test(
        body
      ) &&
      !/Please choose a team/i.test(
        body
      )
  );

  recordAssertion(
    caseResult,
    "Team Profile renders substantive content",
    body.length > 300
  );

  recordAssertion(
    caseResult,
    "Team Profile has no horizontal overflow",
    await page.evaluate(
      noHorizontalOverflow
    )
  );
}

(async () => {
  console.log(
    "=== P23 D3 RESPONSIVE INTERACTIVE CONTROLS / TOUCH UI ==="
  );

  for (
    const [
      browserName,
      browserType
    ] of browsers
  ) {
    for (
      const [
        viewportName,
        viewport
      ] of viewports
    ) {
      await runCase({
        browserName,
        browserType,
        viewportName,
        viewport,
        surface:
          "Pricing Toggle",
        execute:
          testPricingToggle
      });

      await runCase({
        browserName,
        browserType,
        viewportName,
        viewport,
        surface:
          "NBA Game Odds Controls",
        execute:
          testGameOddsControls
      });

      await runCase({
        browserName,
        browserType,
        viewportName,
        viewport,
        surface:
          "NBA Player Props Logged Out",
        execute:
          testLoggedOutProps
      });

      await runCase({
        browserName,
        browserType,
        viewportName,
        viewport,
        surface:
          "NBA Player Trends Logged Out",
        execute:
          (
            page,
            caseResult
          ) =>
            testLockedTrend(
              page,
              caseResult,
              "/nba-trends.html",
              "All-Star"
            )
      });

      await runCase({
        browserName,
        browserType,
        viewportName,
        viewport,
        surface:
          "NBA Team Trends Rookie",
        execute:
          (
            page,
            caseResult
          ) =>
            testLockedTrend(
              page,
              caseResult,
              "/nba-team-trends.html",
              "Veteran"
            )
      });

      await runCase({
        browserName,
        browserType,
        viewportName,
        viewport,
        surface:
          "Real NBA Player Profile",
        execute:
          testPlayerProfileFlow
      });

      const authViews = [
        {
          name: "Login",
          path:
            "/auth.html?view=login",
          visible:
            "#login-view",
          controls: [
            "#login-email",
            "#login-password",
            "#login-form button[type='submit']"
          ]
        },
        {
          name: "Signup",
          path:
            "/auth.html?view=signup",
          visible:
            "#signup-view",
          controls: [
            "#signup-email",
            "#signup-password",
            "#signup-form button[type='submit']"
          ]
        },
        {
          name:
            "Reset Request",
          path:
            "/auth.html?view=reset",
          visible:
            "#reset-request-view",
          controls: [
            "#reset-email",
            "#reset-request-form button[type='submit']"
          ]
        }
      ];

      for (
        const authView of
        authViews
      ) {
        await runCase({
          browserName,
          browserType,
          viewportName,
          viewport,
          surface:
            `Auth ${authView.name}`,
          execute:
            (
              page,
              caseResult
            ) =>
              testAuthView(
                page,
                caseResult,
                authView
              )
        });
      }

      await runCase({
        browserName,
        browserType,
        viewportName,
        viewport,
        surface:
          "Real NBA Team Profile",
        execute:
          testTeamProfileFlow
      });
    }
  }

  const casePass =
    results.filter(
      result => result.pass
    ).length;

  const caseFail =
    results.length -
    casePass;

  const report = {
    milestone:
      "P23 D3",
    title:
      "Responsive Interactive Controls / Touch UI",
    target:
      BASE,
    generatedAt:
      new Date().toISOString(),
    browsers:
      browsers.map(
        ([name]) => name
      ),
    viewports:
      viewports.map(
        ([name, viewport]) => ({
          name,
          ...viewport
        })
      ),
    cases:
      results.length,
    casePass,
    caseFail,
    assertions,
    passedAssertions,
    failedAssertions,
    status:
      caseFail === 0 &&
      failedAssertions === 0
        ? "PASS"
        : "FAIL",
    notes: [
      "Read-only production QA; no checkout, subscription, logout, password-reset submission, or account mutation performed.",
      "Logged-out Player Props and Player Trends are expected to remain gated according to the frozen P21 tier contract.",
      "Team Profile route contract uses extensionless /nba-team?league=nba&team=<team> production URLs.",
      "P23 D3 production fixes validated separately: mobile tooltip close behavior and Auth form-control cross-browser styling."
    ],
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
    "\n=== P23 D3 FINAL RESULT ==="
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
    `STATUS: ${report.status}`
  );
  console.log(
    `REPORT: ${REPORT_PATH}`
  );

  if (
    report.status !== "PASS"
  ) {
    process.exitCode = 1;
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
