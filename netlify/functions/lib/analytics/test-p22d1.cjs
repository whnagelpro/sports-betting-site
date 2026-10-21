const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const WEBHOOK_PATH = path.join(
  ROOT,
  "netlify/functions/stripe-webhook.js"
);

const PRICING_PATH = path.join(
  ROOT,
  "pricing.html"
);

const REPORT_PATH = path.join(
  ROOT,
  "p22-evidence/p22d1-report.json"
);

const results = [];

function record(status, area, check, details = {}) {
  results.push({
    status,
    area,
    check,
    ...details
  });

  console.log(
    `${status} — ${area} — ${check}` +
      (details.note ? ` — ${details.note}` : "")
  );
}

function pass(area, check, details = {}) {
  record("PASS", area, check, details);
}

function fail(area, check, details = {}) {
  record("FAIL", area, check, details);
}

function notExercised(area, check, details = {}) {
  record("NOT_EXERCISED", area, check, details);
}

function countMatches(text, regex) {
  return [...text.matchAll(regex)].length;
}

function extractPriceMap(source) {
  const blockMatch = source.match(
    /const\s+PRICE_TO_TIER\s*=\s*\{([\s\S]*?)\};/
  );

  if (!blockMatch) return [];

  const mappings = [];

  const regex =
    /(price_[A-Za-z0-9]+)\s*:\s*["']([^"']+)["']/g;

  let match;

  while ((match = regex.exec(blockMatch[1])) !== null) {
    mappings.push({
      priceId: match[1],
      tier: match[2]
    });
  }

  return mappings;
}

function extractPricingLinks(source) {
  const links = [];

  const regex =
    /<a[\s\S]*?data-plan=["']([^"']+)["'][\s\S]*?data-monthly-url=["']([^"']+)["'][\s\S]*?data-annual-url=["']([^"']+)["'][\s\S]*?>/g;

  let match;

  while ((match = regex.exec(source)) !== null) {
    links.push({
      plan: match[1],
      monthlyUrl: match[2],
      annualUrl: match[3]
    });
  }

  return links;
}

function main() {
  console.log(
    "P22 D1 — Static Stripe + Subscription Contract QA"
  );
  console.log("");

  if (!fs.existsSync(WEBHOOK_PATH)) {
    fail(
      "Files",
      "Stripe webhook source exists",
      { note: WEBHOOK_PATH }
    );
  } else {
    pass(
      "Files",
      "Stripe webhook source exists"
    );
  }

  if (!fs.existsSync(PRICING_PATH)) {
    fail(
      "Files",
      "Pricing page source exists",
      { note: PRICING_PATH }
    );
  } else {
    pass(
      "Files",
      "Pricing page source exists"
    );
  }

  if (
    !fs.existsSync(WEBHOOK_PATH) ||
    !fs.existsSync(PRICING_PATH)
  ) {
    finish();
    return;
  }

  const webhook = fs.readFileSync(
    WEBHOOK_PATH,
    "utf8"
  );

  const pricing = fs.readFileSync(
    PRICING_PATH,
    "utf8"
  );

  console.log("");
  console.log("========================================");
  console.log("P22 D1 — Secret Handling");
  console.log("========================================");

  const requiredEnvVars = [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY"
  ];

  for (const envName of requiredEnvVars) {
    if (
      webhook.includes(`process.env.${envName}`)
    ) {
      pass(
        "Secret Handling",
        `${envName} is read from environment`
      );
    } else {
      fail(
        "Secret Handling",
        `${envName} environment reference missing`
      );
    }
  }

  const hardcodedSecretPatterns = [
    /\bsk_(?:live|test)_[A-Za-z0-9]+/g,
    /\bwhsec_[A-Za-z0-9]+/g,
    /\bservice_role\b[^"'`\n]*["'`][A-Za-z0-9._-]{20,}/gi
  ];

  const hardcodedSecrets = [];

  for (const regex of hardcodedSecretPatterns) {
    const matches = webhook.match(regex) || [];
    hardcodedSecrets.push(...matches);
  }

  if (hardcodedSecrets.length === 0) {
    pass(
      "Secret Handling",
      "No obvious Stripe/Supabase secret values hard-coded"
    );
  } else {
    fail(
      "Secret Handling",
      "Potential hard-coded secret values detected",
      {
        note:
          "Secret-like values detected; values intentionally omitted from report"
      }
    );
  }

  console.log("");
  console.log("========================================");
  console.log("P22 D1 — Webhook Signature Contract");
  console.log("========================================");

  if (
    /event\.headers\[\s*["']stripe-signature["']\s*\]/.test(
      webhook
    )
  ) {
    pass(
      "Webhook Security",
      "Stripe-Signature header is read"
    );
  } else {
    fail(
      "Webhook Security",
      "Stripe-Signature header is not read"
    );
  }

  if (
    /stripe\.webhooks\.constructEvent\s*\(/.test(
      webhook
    )
  ) {
    pass(
      "Webhook Security",
      "Stripe constructEvent signature verification is used"
    );
  } else {
    fail(
      "Webhook Security",
      "Stripe constructEvent signature verification missing"
    );
  }

  if (
    /STRIPE_WEBHOOK_SECRET/.test(webhook)
  ) {
    pass(
      "Webhook Security",
      "Webhook verification uses configured webhook secret"
    );
  } else {
    fail(
      "Webhook Security",
      "Webhook secret reference missing"
    );
  }

  if (
    /Webhook signature verification failed/.test(
      webhook
    ) &&
    /statusCode\s*:\s*400/.test(webhook)
  ) {
    pass(
      "Webhook Security",
      "Invalid webhook signatures return HTTP 400"
    );
  } else {
    fail(
      "Webhook Security",
      "Invalid-signature HTTP 400 behavior not detected"
    );
  }

  console.log("");
  console.log("========================================");
  console.log("P22 D1 — Price → Tier Contract");
  console.log("========================================");

  const mappings = extractPriceMap(webhook);

  if (mappings.length === 8) {
    pass(
      "Price Mapping",
      "Exactly 8 Stripe Price IDs are mapped"
    );
  } else {
    fail(
      "Price Mapping",
      "Expected exactly 8 Stripe Price IDs",
      {
        note: `Found ${mappings.length}`
      }
    );
  }

  const expectedTiers = [
    "Veteran",
    "All-Star",
    "Hall-of-Famer",
    "Legend"
  ];

  for (const tier of expectedTiers) {
    const count = mappings.filter(
      item => item.tier === tier
    ).length;

    if (count === 2) {
      pass(
        "Price Mapping",
        `${tier} has exactly 2 mapped Price IDs`
      );
    } else {
      fail(
        "Price Mapping",
        `${tier} should have exactly 2 mapped Price IDs`,
        {
          note: `Found ${count}`
        }
      );
    }
  }

  const uniquePriceIds = new Set(
    mappings.map(item => item.priceId)
  );

  if (uniquePriceIds.size === mappings.length) {
    pass(
      "Price Mapping",
      "All mapped Stripe Price IDs are unique"
    );
  } else {
    fail(
      "Price Mapping",
      "Duplicate Stripe Price ID mapping detected"
    );
  }

  const unexpectedTiers = mappings
    .map(item => item.tier)
    .filter(tier => !expectedTiers.includes(tier));

  if (unexpectedTiers.length === 0) {
    pass(
      "Price Mapping",
      "Price map contains only supported paid tiers"
    );
  } else {
    fail(
      "Price Mapping",
      "Unexpected tier names found in Price map",
      {
        note: [...new Set(unexpectedTiers)].join(", ")
      }
    );
  }

  console.log("");
  console.log("========================================");
  console.log("P22 D1 — Checkout Completion");
  console.log("========================================");

  if (
    /stripeEvent\.type\s*===\s*["']checkout\.session\.completed["']/.test(
      webhook
    )
  ) {
    pass(
      "Checkout",
      "checkout.session.completed is handled"
    );
  } else {
    fail(
      "Checkout",
      "checkout.session.completed handler missing"
    );
  }

  if (
    /stripe\.checkout\.sessions\.retrieve\s*\(/.test(
      webhook
    )
  ) {
    pass(
      "Checkout",
      "Completed Checkout Session is retrieved from Stripe"
    );
  } else {
    fail(
      "Checkout",
      "Checkout Session retrieval missing"
    );
  }

  if (
    /expand\s*:\s*\[\s*["']line_items["']\s*,\s*["']customer["']\s*\]/.test(
      webhook
    )
  ) {
    pass(
      "Checkout",
      "Checkout retrieval expands line items and customer"
    );
  } else {
    fail(
      "Checkout",
      "Expected Checkout expansions not detected"
    );
  }

  if (
    /PRICE_TO_TIER\s*\[\s*priceId\s*\]/.test(
      webhook
    )
  ) {
    pass(
      "Checkout",
      "Checkout Price ID is resolved through PRICE_TO_TIER"
    );
  } else {
    fail(
      "Checkout",
      "Checkout Price ID tier lookup missing"
    );
  }

  if (
    /\.from\(\s*["']profiles["']\s*\)[\s\S]*?\.update\(\s*\{\s*tier\s*\}\s*\)[\s\S]*?\.ilike\(\s*["']email["']\s*,\s*email\s*\)/.test(
      webhook
    )
  ) {
    pass(
      "Checkout",
      "Checkout updates matching Supabase profile tier by email"
    );
  } else {
    fail(
      "Checkout",
      "Supabase checkout tier update contract not detected"
    );
  }

  if (
    /if\s*\(\s*!email\s*\|\|\s*!tier\s*\)/.test(
      webhook
    ) &&
    /skipped\s*:\s*true/.test(webhook)
  ) {
    pass(
      "Checkout",
      "Missing email or unmapped Price ID is safely skipped"
    );
  } else {
    fail(
      "Checkout",
      "Missing-email/unmapped-price safe skip not detected"
    );
  }

  console.log("");
  console.log("========================================");
  console.log("P22 D1 — Cancellation Contract");
  console.log("========================================");

  if (
    /stripeEvent\.type\s*===\s*["']customer\.subscription\.deleted["']/.test(
      webhook
    )
  ) {
    pass(
      "Cancellation",
      "customer.subscription.deleted is handled"
    );
  } else {
    fail(
      "Cancellation",
      "customer.subscription.deleted handler missing"
    );
  }

  if (
    /stripe\.customers\.retrieve\s*\(\s*subscription\.customer\s*\)/.test(
      webhook
    )
  ) {
    pass(
      "Cancellation",
      "Canceled subscription customer is retrieved"
    );
  } else {
    fail(
      "Cancellation",
      "Canceled subscription customer retrieval missing"
    );
  }

  if (
    /\.update\(\s*\{\s*tier\s*:\s*["']Rookie["']\s*\}\s*\)[\s\S]*?\.ilike\(\s*["']email["']\s*,\s*email\s*\)/.test(
      webhook
    )
  ) {
    pass(
      "Cancellation",
      "Deleted subscription reverts matching profile to Rookie"
    );
  } else {
    fail(
      "Cancellation",
      "Rookie cancellation reversion contract not detected"
    );
  }

  console.log("");
  console.log("========================================");
  console.log("P22 D1 — Pricing Page Contract");
  console.log("========================================");

  const pricingLinks = extractPricingLinks(
    pricing
  );

  if (pricingLinks.length === 4) {
    pass(
      "Pricing",
      "Exactly 4 paid-tier pricing buttons have Stripe links"
    );
  } else {
    fail(
      "Pricing",
      "Expected exactly 4 paid-tier Stripe pricing buttons",
      {
        note: `Found ${pricingLinks.length}`
      }
    );
  }

  for (const tier of expectedTiers) {
    const plan = pricingLinks.find(
      item => item.plan === tier
    );

    if (plan) {
      pass(
        "Pricing",
        `${tier} pricing button exists`
      );

      if (
        /^https:\/\/buy\.stripe\.com\//.test(
          plan.monthlyUrl
        )
      ) {
        pass(
          "Pricing",
          `${tier} monthly link uses Stripe Payment Links`
        );
      } else {
        fail(
          "Pricing",
          `${tier} monthly Stripe link invalid`
        );
      }

      if (
        /^https:\/\/buy\.stripe\.com\//.test(
          plan.annualUrl
        )
      ) {
        pass(
          "Pricing",
          `${tier} annual link uses Stripe Payment Links`
        );
      } else {
        fail(
          "Pricing",
          `${tier} annual Stripe link invalid`
        );
      }

      if (plan.monthlyUrl !== plan.annualUrl) {
        pass(
          "Pricing",
          `${tier} monthly and annual links are distinct`
        );
      } else {
        fail(
          "Pricing",
          `${tier} monthly and annual links are identical`
        );
      }
    } else {
      fail(
        "Pricing",
        `${tier} pricing button missing`
      );
    }
  }

  const allPaymentUrls = pricingLinks.flatMap(
    item => [
      item.monthlyUrl,
      item.annualUrl
    ]
  );

  if (
    allPaymentUrls.length === 8 &&
    new Set(allPaymentUrls).size === 8
  ) {
    pass(
      "Pricing",
      "All 8 paid Payment Links are unique"
    );
  } else {
    fail(
      "Pricing",
      "Expected 8 unique paid Payment Links",
      {
        note:
          `Found ${allPaymentUrls.length} links / ` +
          `${new Set(allPaymentUrls).size} unique`
      }
    );
  }

  if (
    /localStorage\.setItem\(\s*["']selectedPlan["']\s*,\s*plan\s*\)/.test(
      pricing
    )
  ) {
    pass(
      "Pricing",
      "Selected paid plan is stored before checkout redirect"
    );
  } else {
    fail(
      "Pricing",
      "selectedPlan persistence not detected"
    );
  }

  if (
    /billingToggle[\s\S]*?checked/.test(
      pricing
    ) &&
    /data-annual-url/.test(pricing) &&
    /data-monthly-url/.test(pricing)
  ) {
    pass(
      "Pricing",
      "Billing toggle selects monthly versus annual checkout URL"
    );
  } else {
    fail(
      "Pricing",
      "Monthly/annual checkout selection contract not detected"
    );
  }

  if (
    /window\.location\.href\s*=\s*targetUrl/.test(
      pricing
    )
  ) {
    pass(
      "Pricing",
      "Pricing button redirects browser to selected Stripe URL"
    );
  } else {
    fail(
      "Pricing",
      "Stripe checkout redirect assignment missing"
    );
  }

  console.log("");
  console.log("========================================");
  console.log("P22 D1 — Lifecycle Coverage Inventory");
  console.log("========================================");

  const handledEventMatches = [
    ...webhook.matchAll(
      /stripeEvent\.type\s*===\s*["']([^"']+)["']/g
    )
  ];

  const handledEvents = [
    ...new Set(
      handledEventMatches.map(match => match[1])
    )
  ];

  if (
    handledEvents.includes(
      "checkout.session.completed"
    )
  ) {
    pass(
      "Lifecycle",
      "Initial checkout event coverage present"
    );
  } else {
    fail(
      "Lifecycle",
      "Initial checkout event coverage missing"
    );
  }

  if (
    handledEvents.includes(
      "customer.subscription.deleted"
    )
  ) {
    pass(
      "Lifecycle",
      "Subscription deletion event coverage present"
    );
  } else {
    fail(
      "Lifecycle",
      "Subscription deletion event coverage missing"
    );
  }

  if (
    handledEvents.includes(
      "customer.subscription.updated"
    )
  ) {
    pass(
      "Lifecycle",
      "Subscription update event coverage present"
    );
  } else {
    notExercised(
      "Lifecycle",
      "Subscription update/change event is not currently implemented",
      {
        note:
          "Inventory finding only; no production mutation performed"
      }
    );
  }

  const knownLifecycleEvents = [
    "checkout.session.completed",
    "customer.subscription.deleted",
    "customer.subscription.updated"
  ];

  const unknownHandledEvents =
    handledEvents.filter(
      eventName =>
        !knownLifecycleEvents.includes(eventName)
    );

  if (unknownHandledEvents.length === 0) {
    pass(
      "Lifecycle",
      "No unexpected Stripe lifecycle event handlers detected"
    );
  } else {
    pass(
      "Lifecycle",
      "Additional Stripe lifecycle handlers detected",
      {
        note: unknownHandledEvents.join(", ")
      }
    );
  }

  finish();
}

function finish() {
  const passCount = results.filter(
    item => item.status === "PASS"
  ).length;

  const failCount = results.filter(
    item => item.status === "FAIL"
  ).length;

  const notExercisedCount = results.filter(
    item => item.status === "NOT_EXERCISED"
  ).length;

  const report = {
    milestone: "P22 D1",
    description:
      "Static Stripe + Subscription Contract QA",
    generatedAt: new Date().toISOString(),
    destructiveActionsPerformed: false,
    summary: {
      pass: passCount,
      fail: failCount,
      notExercised: notExercisedCount
    },
    results
  };

  fs.mkdirSync(
    path.dirname(REPORT_PATH),
    { recursive: true }
  );

  fs.writeFileSync(
    REPORT_PATH,
    JSON.stringify(report, null, 2)
  );

  console.log("");
  console.log("========================================");
  console.log("P22 D1 SUMMARY");
  console.log("========================================");
  console.log(`PASS: ${passCount}`);
  console.log(`FAIL: ${failCount}`);
  console.log(
    `NOT_EXERCISED: ${notExercisedCount}`
  );
  console.log(`REPORT: ${REPORT_PATH}`);
  console.log(
    `P22 D1 STATUS: ${
      failCount === 0 ? "PASS" : "FAIL"
    }`
  );

  if (failCount > 0) {
    process.exitCode = 1;
  }
}

main();
