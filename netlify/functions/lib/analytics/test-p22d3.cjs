const fs = require("fs");
const path = require("path");
const Module = require("module");

const ROOT = process.cwd();

const WEBHOOK_PATH = path.join(
  ROOT,
  "netlify/functions/stripe-webhook.js"
);

const REPORT_PATH = path.join(
  ROOT,
  "p22-evidence/p22d3-report.json"
);

const PRICE_CASES = [
  {
    priceId: "price_1TS6EsAxfar5vTD8qRQJ5UDz",
    tier: "Veteran",
    cadence: "price-slot-1"
  },
  {
    priceId: "price_1TS6EwAxfar5vTD8V0ty68wr",
    tier: "Veteran",
    cadence: "price-slot-2"
  },
  {
    priceId: "price_1TS6EsAxfar5vTD8qRKCkKvX",
    tier: "All-Star",
    cadence: "price-slot-1"
  },
  {
    priceId: "price_1TS6EwAxfar5vTD86m3aO4zA",
    tier: "All-Star",
    cadence: "price-slot-2"
  },
  {
    priceId: "price_1TS6EtAxfar5vTD8b98Ya2kI",
    tier: "Hall-of-Famer",
    cadence: "price-slot-1"
  },
  {
    priceId: "price_1TS6EwAxfar5vTD8NfwI73rb",
    tier: "Hall-of-Famer",
    cadence: "price-slot-2"
  },
  {
    priceId: "price_1TS6EuAxfar5vTD8toK8i49L",
    tier: "Legend",
    cadence: "price-slot-1"
  },
  {
    priceId: "price_1TS6EwAxfar5vTD8bhHNulkj",
    tier: "Legend",
    cadence: "price-slot-2"
  }
];

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

function assertCheck(condition, area, check, details = {}) {
  if (condition) {
    pass(area, check, details);
  } else {
    fail(area, check, details);
  }
}

function makeState() {
  return {
    constructedEvents: [],
    retrievedSessions: [],
    retrievedCustomers: [],
    supabaseUpdates: [],
    constructEventError: null,
    checkoutRetrieveError: null,
    customerRetrieveError: null,
    supabaseError: null,
    nextStripeEvent: null,
    fullSession: null,
    customer: null
  };
}

function buildHandler(state) {
  const fakeStripeClient = {
    webhooks: {
      constructEvent(body, signature, secret) {
        state.constructedEvents.push({
          body,
          signature,
          secret
        });

        if (state.constructEventError) {
          throw state.constructEventError;
        }

        return state.nextStripeEvent;
      }
    },

    checkout: {
      sessions: {
        async retrieve(id, options) {
          state.retrievedSessions.push({
            id,
            options
          });

          if (state.checkoutRetrieveError) {
            throw state.checkoutRetrieveError;
          }

          return state.fullSession;
        }
      }
    },

    customers: {
      async retrieve(id) {
        state.retrievedCustomers.push(id);

        if (state.customerRetrieveError) {
          throw state.customerRetrieveError;
        }

        return state.customer;
      }
    }
  };

  function fakeStripeFactory(secretKey) {
    state.stripeSecretKeyReceived = secretKey;
    return fakeStripeClient;
  }

  const fakeSupabaseClient = {
    from(table) {
      return {
        update(values) {
          return {
            ilike(column, value) {
              return {
                async select(selection) {
                  state.supabaseUpdates.push({
                    table,
                    values,
                    column,
                    value,
                    selection
                  });

                  return {
                    data: state.supabaseError
                      ? null
                      : [
                          {
                            id: "qa-profile-id",
                            email: value,
                            tier: values.tier
                          }
                        ],
                    error: state.supabaseError
                  };
                }
              };
            }
          };
        }
      };
    }
  };

  function fakeCreateClient(url, key) {
    state.supabaseUrlReceived = url;
    state.supabaseKeyReceived = key;
    return fakeSupabaseClient;
  }

  const originalLoad = Module._load;

  Module._load = function (
    request,
    parent,
    isMain
  ) {
    if (request === "stripe") {
      return fakeStripeFactory;
    }

    if (request === "@supabase/supabase-js") {
      return {
        createClient: fakeCreateClient
      };
    }

    return originalLoad.call(
      this,
      request,
      parent,
      isMain
    );
  };

  const originalEnv = {
    STRIPE_SECRET_KEY:
      process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET:
      process.env.STRIPE_WEBHOOK_SECRET,
    SUPABASE_URL:
      process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.SUPABASE_SERVICE_ROLE_KEY
  };

  process.env.STRIPE_SECRET_KEY =
    "p22-d3-fake-stripe-key";

  process.env.STRIPE_WEBHOOK_SECRET =
    "p22-d3-fake-webhook-secret";

  process.env.SUPABASE_URL =
    "https://p22-d3.invalid";

  process.env.SUPABASE_SERVICE_ROLE_KEY =
    "p22-d3-fake-service-role";

  let handler;

  try {
    const webhookSource =
      fs.readFileSync(
        WEBHOOK_PATH,
        "utf8"
      );

    const webhookModule =
      new Module(
        WEBHOOK_PATH,
        module
      );

    webhookModule.filename =
      WEBHOOK_PATH;

    webhookModule.paths =
      Module._nodeModulePaths(
        path.dirname(WEBHOOK_PATH)
      );

    webhookModule._compile(
      webhookSource,
      WEBHOOK_PATH
    );

    handler =
      webhookModule.exports.handler;
  } finally {
    Module._load = originalLoad;

    for (
      const [key, value]
      of Object.entries(originalEnv)
    ) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }

  return handler;
}

async function invoke(handler, body = "{}") {
  return handler({
    body,
    headers: {
      "stripe-signature":
        "p22-d3-valid-mocked-signature"
    }
  });
}

function parseBody(response) {
  try {
    return JSON.parse(response.body);
  } catch {
    return null;
  }
}

async function testAllPriceMappings() {
  console.log("");
  console.log("========================================");
  console.log("P22 D3 — 8 Price → Tier Executions");
  console.log("========================================");

  for (const testCase of PRICE_CASES) {
    const state = makeState();

    state.nextStripeEvent = {
      type: "checkout.session.completed",
      data: {
        object: {
          id:
            `cs_p22d3_${testCase.tier}_${testCase.cadence}`
        }
      }
    };

    state.fullSession = {
      customer_details: {
        email: "p22d3@example.invalid"
      },
      customer_email: null,
      customer: null,
      line_items: {
        data: [
          {
            price: {
              id: testCase.priceId
            }
          }
        ]
      }
    };

    const handler = buildHandler(state);
    const response = await invoke(handler);
    const body = parseBody(response);

    const label =
      `${testCase.tier} ${testCase.cadence}`;

    assertCheck(
      response.statusCode === 200,
      "Price Mapping",
      `${label} returns HTTP 200`
    );

    assertCheck(
      state.retrievedSessions.length === 1,
      "Price Mapping",
      `${label} retrieves completed Checkout Session`
    );

    assertCheck(
      state.supabaseUpdates.length === 1,
      "Price Mapping",
      `${label} performs exactly one profile update`
    );

    assertCheck(
      state.supabaseUpdates[0]?.values?.tier ===
        testCase.tier,
      "Price Mapping",
      `${label} writes ${testCase.tier}`
    );

    assertCheck(
      state.supabaseUpdates[0]?.column ===
        "email" &&
        state.supabaseUpdates[0]?.value ===
          "p22d3@example.invalid",
      "Price Mapping",
      `${label} targets profile by checkout email`
    );

    assertCheck(
      body?.received === true,
      "Price Mapping",
      `${label} acknowledges successful processing`
    );
  }
}

async function testEmailFallbacks() {
  console.log("");
  console.log("========================================");
  console.log("P22 D3 — Checkout Email Resolution");
  console.log("========================================");

  const cases = [
    {
      name: "customer_details.email",
      session: {
        customer_details: {
          email:
            "details@example.invalid"
        },
        customer_email:
          "fallback@example.invalid",
        customer: {
          email:
            "customer@example.invalid"
        }
      },
      expected:
        "details@example.invalid"
    },
    {
      name: "customer_email fallback",
      session: {
        customer_details: {},
        customer_email:
          "fallback@example.invalid",
        customer: {
          email:
            "customer@example.invalid"
        }
      },
      expected:
        "fallback@example.invalid"
    },
    {
      name: "expanded customer.email fallback",
      session: {
        customer_details: {},
        customer_email: null,
        customer: {
          email:
            "customer@example.invalid"
        }
      },
      expected:
        "customer@example.invalid"
    }
  ];

  for (const item of cases) {
    const state = makeState();

    state.nextStripeEvent = {
      type:
        "checkout.session.completed",
      data: {
        object: {
          id: "cs_email_resolution"
        }
      }
    };

    state.fullSession = {
      ...item.session,
      line_items: {
        data: [
          {
            price: {
              id:
                PRICE_CASES[0].priceId
            }
          }
        ]
      }
    };

    const handler = buildHandler(state);
    const response = await invoke(handler);

    assertCheck(
      response.statusCode === 200,
      "Email Resolution",
      `${item.name} returns HTTP 200`
    );

    assertCheck(
      state.supabaseUpdates.length === 1 &&
        state.supabaseUpdates[0].value ===
          item.expected,
      "Email Resolution",
      `${item.name} selects expected email`
    );
  }
}

async function testUnknownPrice() {
  console.log("");
  console.log("========================================");
  console.log("P22 D3 — Unknown Price Safe Skip");
  console.log("========================================");

  const state = makeState();

  state.nextStripeEvent = {
    type:
      "checkout.session.completed",
    data: {
      object: {
        id: "cs_unknown_price"
      }
    }
  };

  state.fullSession = {
    customer_details: {
      email: "unknown@example.invalid"
    },
    line_items: {
      data: [
        {
          price: {
            id: "price_NOT_IN_CONTRACT"
          }
        }
      ]
    }
  };

  const handler = buildHandler(state);
  const response = await invoke(handler);
  const body = parseBody(response);

  assertCheck(
    response.statusCode === 200,
    "Safe Skip",
    "Unknown Price ID returns HTTP 200"
  );

  assertCheck(
    body?.received === true &&
      body?.skipped === true,
    "Safe Skip",
    "Unknown Price ID is explicitly marked skipped"
  );

  assertCheck(
    state.supabaseUpdates.length === 0,
    "Safe Skip",
    "Unknown Price ID performs no profile mutation"
  );
}

async function testMissingEmail() {
  console.log("");
  console.log("========================================");
  console.log("P22 D3 — Missing Email Safe Skip");
  console.log("========================================");

  const state = makeState();

  state.nextStripeEvent = {
    type:
      "checkout.session.completed",
    data: {
      object: {
        id: "cs_missing_email"
      }
    }
  };

  state.fullSession = {
    customer_details: {},
    customer_email: null,
    customer: {},
    line_items: {
      data: [
        {
          price: {
            id: PRICE_CASES[0].priceId
          }
        }
      ]
    }
  };

  const handler = buildHandler(state);
  const response = await invoke(handler);
  const body = parseBody(response);

  assertCheck(
    response.statusCode === 200,
    "Safe Skip",
    "Missing checkout email returns HTTP 200"
  );

  assertCheck(
    body?.received === true &&
      body?.skipped === true,
    "Safe Skip",
    "Missing checkout email is explicitly marked skipped"
  );

  assertCheck(
    state.supabaseUpdates.length === 0,
    "Safe Skip",
    "Missing checkout email performs no profile mutation"
  );
}

async function testCancellation() {
  console.log("");
  console.log("========================================");
  console.log("P22 D3 — Subscription Cancellation");
  console.log("========================================");

  const state = makeState();

  state.nextStripeEvent = {
    type:
      "customer.subscription.deleted",
    data: {
      object: {
        id: "sub_p22d3",
        customer: "cus_p22d3"
      }
    }
  };

  state.customer = {
    id: "cus_p22d3",
    email:
      "canceled@example.invalid"
  };

  const handler = buildHandler(state);
  const response = await invoke(handler);
  const body = parseBody(response);

  assertCheck(
    response.statusCode === 200,
    "Cancellation",
    "Subscription deletion returns HTTP 200"
  );

  assertCheck(
    state.retrievedCustomers.length === 1 &&
      state.retrievedCustomers[0] ===
        "cus_p22d3",
    "Cancellation",
    "Cancellation retrieves the Stripe customer"
  );

  assertCheck(
    state.supabaseUpdates.length === 1,
    "Cancellation",
    "Cancellation performs exactly one profile update"
  );

  assertCheck(
    state.supabaseUpdates[0]?.values?.tier ===
      "Rookie",
    "Cancellation",
    "Cancellation writes Rookie tier"
  );

  assertCheck(
    state.supabaseUpdates[0]?.value ===
      "canceled@example.invalid",
    "Cancellation",
    "Cancellation targets profile by Stripe customer email"
  );

  assertCheck(
    body?.received === true,
    "Cancellation",
    "Cancellation is acknowledged"
  );
}

async function testCancellationMissingEmail() {
  console.log("");
  console.log("========================================");
  console.log("P22 D3 — Cancellation Missing Email");
  console.log("========================================");

  const state = makeState();

  state.nextStripeEvent = {
    type:
      "customer.subscription.deleted",
    data: {
      object: {
        customer:
          "cus_no_email"
      }
    }
  };

  state.customer = {
    id: "cus_no_email",
    email: null
  };

  const handler = buildHandler(state);
  const response = await invoke(handler);

  assertCheck(
    response.statusCode === 200,
    "Cancellation",
    "Cancellation without customer email returns HTTP 200"
  );

  assertCheck(
    state.supabaseUpdates.length === 0,
    "Cancellation",
    "Cancellation without customer email performs no profile mutation"
  );
}

async function testIrrelevantEvent() {
  console.log("");
  console.log("========================================");
  console.log("P22 D3 — Irrelevant Stripe Event");
  console.log("========================================");

  const state = makeState();

  state.nextStripeEvent = {
    type:
      "invoice.payment_succeeded",
    data: {
      object: {}
    }
  };

  const handler = buildHandler(state);
  const response = await invoke(handler);
  const body = parseBody(response);

  assertCheck(
    response.statusCode === 200,
    "Event Isolation",
    "Unhandled Stripe event returns HTTP 200"
  );

  assertCheck(
    state.retrievedSessions.length === 0,
    "Event Isolation",
    "Unhandled event does not retrieve Checkout Session"
  );

  assertCheck(
    state.retrievedCustomers.length === 0,
    "Event Isolation",
    "Unhandled event does not retrieve customer"
  );

  assertCheck(
    state.supabaseUpdates.length === 0,
    "Event Isolation",
    "Unhandled event performs no profile mutation"
  );

  assertCheck(
    body?.received === true,
    "Event Isolation",
    "Unhandled event is safely acknowledged"
  );
}

async function testSupabaseCheckoutFailure() {
  console.log("");
  console.log("========================================");
  console.log("P22 D3 — Checkout Database Failure");
  console.log("========================================");

  const state = makeState();

  state.nextStripeEvent = {
    type:
      "checkout.session.completed",
    data: {
      object: {
        id: "cs_db_failure"
      }
    }
  };

  state.fullSession = {
    customer_details: {
      email:
        "db-failure@example.invalid"
    },
    line_items: {
      data: [
        {
          price: {
            id: PRICE_CASES[0].priceId
          }
        }
      ]
    }
  };

  state.supabaseError =
    new Error("P22 D3 simulated Supabase failure");

  const handler = buildHandler(state);
  const response = await invoke(handler);
  const body = parseBody(response);

  assertCheck(
    response.statusCode === 500,
    "Failure Handling",
    "Checkout Supabase failure returns HTTP 500"
  );

  assertCheck(
    body?.error ===
      "Webhook handler failed",
    "Failure Handling",
    "Checkout Supabase failure returns controlled error body"
  );

  assertCheck(
    /simulated Supabase failure/i.test(
      body?.details || ""
    ),
    "Failure Handling",
    "Checkout Supabase failure preserves diagnostic detail"
  );
}

async function testStripeRetrieveFailure() {
  console.log("");
  console.log("========================================");
  console.log("P22 D3 — Stripe Retrieval Failure");
  console.log("========================================");

  const state = makeState();

  state.nextStripeEvent = {
    type:
      "checkout.session.completed",
    data: {
      object: {
        id:
          "cs_stripe_retrieve_failure"
      }
    }
  };

  state.checkoutRetrieveError =
    new Error(
      "P22 D3 simulated Stripe retrieval failure"
    );

  const handler = buildHandler(state);
  const response = await invoke(handler);
  const body = parseBody(response);

  assertCheck(
    response.statusCode === 500,
    "Failure Handling",
    "Stripe Checkout retrieval failure returns HTTP 500"
  );

  assertCheck(
    state.supabaseUpdates.length === 0,
    "Failure Handling",
    "Stripe retrieval failure performs no profile mutation"
  );

  assertCheck(
    /simulated Stripe retrieval failure/i.test(
      body?.details || ""
    ),
    "Failure Handling",
    "Stripe retrieval failure preserves diagnostic detail"
  );
}

async function testSignatureFailure() {
  console.log("");
  console.log("========================================");
  console.log("P22 D3 — Signature Verification Failure");
  console.log("========================================");

  const state = makeState();

  state.constructEventError =
    new Error(
      "P22 D3 simulated invalid signature"
    );

  const handler = buildHandler(state);
  const response = await invoke(handler);

  assertCheck(
    response.statusCode === 400,
    "Signature",
    "Signature verification failure returns HTTP 400"
  );

  assertCheck(
    /Webhook Error: P22 D3 simulated invalid signature/.test(
      response.body
    ),
    "Signature",
    "Signature failure returns controlled webhook error"
  );

  assertCheck(
    state.retrievedSessions.length === 0 &&
      state.retrievedCustomers.length === 0 &&
      state.supabaseUpdates.length === 0,
    "Signature",
    "Signature failure stops all lifecycle processing"
  );
}

async function testDependencyConfiguration() {
  console.log("");
  console.log("========================================");
  console.log("P22 D3 — Dependency Configuration");
  console.log("========================================");

  const state = makeState();

  state.nextStripeEvent = {
    type: "invoice.created",
    data: {
      object: {}
    }
  };

  const handler = buildHandler(state);

  const originalWebhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET;

  try {
    process.env.STRIPE_WEBHOOK_SECRET =
      "p22-d3-fake-webhook-secret";

    await invoke(handler);
  } finally {
    if (originalWebhookSecret === undefined) {
      delete process.env.STRIPE_WEBHOOK_SECRET;
    } else {
      process.env.STRIPE_WEBHOOK_SECRET =
        originalWebhookSecret;
    }
  }

  assertCheck(
    state.stripeSecretKeyReceived ===
      "p22-d3-fake-stripe-key",
    "Configuration",
    "Webhook initializes Stripe from STRIPE_SECRET_KEY"
  );

  assertCheck(
    state.supabaseUrlReceived ===
      "https://p22-d3.invalid",
    "Configuration",
    "Webhook initializes Supabase from SUPABASE_URL"
  );

  assertCheck(
    state.supabaseKeyReceived ===
      "p22-d3-fake-service-role",
    "Configuration",
    "Webhook initializes Supabase from service-role environment variable"
  );

  assertCheck(
    state.constructedEvents[0]?.secret ===
      "p22-d3-fake-webhook-secret",
    "Configuration",
    "Webhook verification receives STRIPE_WEBHOOK_SECRET"
  );
}

function finish() {
  const passCount = results.filter(
    result => result.status === "PASS"
  ).length;

  const failCount = results.filter(
    result => result.status === "FAIL"
  ).length;

  const report = {
    milestone: "P22 D3",
    description:
      "Executable Stripe Webhook Lifecycle QA with isolated dependency mocks",
    generatedAt:
      new Date().toISOString(),
    productionNetworkCallsPerformed:
      false,
    stripeTransactionsPerformed:
      false,
    productionSupabaseMutationsPerformed:
      false,
    realSecretsUsed:
      false,
    summary: {
      pass: passCount,
      fail: failCount,
      notExercised: 0
    },
    results
  };

  fs.mkdirSync(
    path.dirname(REPORT_PATH),
    { recursive: true }
  );

  fs.writeFileSync(
    REPORT_PATH,
    JSON.stringify(
      report,
      null,
      2
    )
  );

  console.log("");
  console.log("========================================");
  console.log("P22 D3 SUMMARY");
  console.log("========================================");
  console.log(`PASS: ${passCount}`);
  console.log(`FAIL: ${failCount}`);
  console.log("NOT_EXERCISED: 0");
  console.log(`REPORT: ${REPORT_PATH}`);
  console.log(
    `P22 D3 STATUS: ${
      failCount === 0
        ? "PASS"
        : "FAIL"
    }`
  );

  if (failCount > 0) {
    process.exitCode = 1;
  }
}

async function main() {
  console.log(
    "P22 D3 — Executable Stripe Webhook Lifecycle QA"
  );

  if (!fs.existsSync(WEBHOOK_PATH)) {
    fail(
      "Files",
      "Stripe webhook source exists",
      { note: WEBHOOK_PATH }
    );
    finish();
    return;
  }

  pass(
    "Files",
    "Stripe webhook source exists"
  );

  await testDependencyConfiguration();
  await testAllPriceMappings();
  await testEmailFallbacks();
  await testUnknownPrice();
  await testMissingEmail();
  await testCancellation();
  await testCancellationMissingEmail();
  await testIrrelevantEvent();
  await testSupabaseCheckoutFailure();
  await testStripeRetrieveFailure();
  await testSignatureFailure();

  finish();
}

main().catch(error => {
  fail(
    "Harness",
    "P22 D3 completed without harness exception",
    {
      note:
        error?.stack ||
        error?.message ||
        String(error)
    }
  );

  finish();
});
