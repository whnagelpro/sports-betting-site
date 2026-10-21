const fs = require("fs");
const path = require("path");
const https = require("https");

const WEBHOOK_URL =
  "https://sportacularanalytics.com/.netlify/functions/stripe-webhook";

const REPORT_PATH = path.join(
  process.cwd(),
  "p22-evidence/p22d2-report.json"
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

function requestWebhook({ body, signature }) {
  return new Promise((resolve, reject) => {
    const payload = body;

    const url = new URL(WEBHOOK_URL);

    const headers = {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload)
    };

    if (signature !== undefined) {
      headers["stripe-signature"] = signature;
    }

    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: "POST",
        headers
      },
      res => {
        let responseBody = "";

        res.setEncoding("utf8");

        res.on("data", chunk => {
          responseBody += chunk;
        });

        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseBody
          });
        });
      }
    );

    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy(
        new Error("Production webhook request timed out")
      );
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log(
    "P22 D2 — Production Stripe Webhook Security Boundary QA"
  );
  console.log("");

  console.log("========================================");
  console.log("P22 D2 — Unsigned Request");
  console.log("========================================");

  let unsigned;

  try {
    unsigned = await requestWebhook({
      body: "{}"
    });

    pass(
      "Production Reachability",
      "Production Stripe webhook responded"
    );
  } catch (error) {
    fail(
      "Production Reachability",
      "Production Stripe webhook request completed",
      { note: error.message }
    );

    finish();
    return;
  }

  if (unsigned.statusCode === 400) {
    pass(
      "Unsigned Request",
      "Unsigned webhook request returns HTTP 400"
    );
  } else {
    fail(
      "Unsigned Request",
      "Unsigned webhook request should return HTTP 400",
      { note: `Received HTTP ${unsigned.statusCode}` }
    );
  }

  if (
    /no stripe-signature header value was provided/i.test(
      unsigned.body
    )
  ) {
    pass(
      "Unsigned Request",
      "Production rejects missing Stripe signature"
    );
  } else {
    fail(
      "Unsigned Request",
      "Missing-signature rejection message not detected",
      { note: unsigned.body.slice(0, 300) }
    );
  }

  if (
    !/received["']?\s*:\s*true/i.test(unsigned.body)
  ) {
    pass(
      "Unsigned Request",
      "Unsigned payload was not acknowledged as processed"
    );
  } else {
    fail(
      "Unsigned Request",
      "Unsigned payload appears to have been acknowledged"
    );
  }

  console.log("");
  console.log("========================================");
  console.log("P22 D2 — Invalid Signature");
  console.log("========================================");

  let invalid;

  try {
    invalid = await requestWebhook({
      body: '{"type":"checkout.session.completed"}',
      signature: "t=1,v1=invalidsignature"
    });

    pass(
      "Invalid Signature",
      "Production responded to invalidly signed request"
    );
  } catch (error) {
    fail(
      "Invalid Signature",
      "Invalid-signature request completed",
      { note: error.message }
    );

    finish();
    return;
  }

  if (invalid.statusCode === 400) {
    pass(
      "Invalid Signature",
      "Invalid Stripe signature returns HTTP 400"
    );
  } else {
    fail(
      "Invalid Signature",
      "Invalid Stripe signature should return HTTP 400",
      { note: `Received HTTP ${invalid.statusCode}` }
    );
  }

  if (
    /no signatures found matching the expected signature/i.test(
      invalid.body
    )
  ) {
    pass(
      "Invalid Signature",
      "Production verifies signature against expected Stripe secret"
    );
  } else {
    fail(
      "Invalid Signature",
      "Expected invalid-signature verification message not detected",
      { note: invalid.body.slice(0, 300) }
    );
  }

  if (
    !/received["']?\s*:\s*true/i.test(invalid.body)
  ) {
    pass(
      "Invalid Signature",
      "Forged checkout event was not acknowledged as processed"
    );
  } else {
    fail(
      "Invalid Signature",
      "Forged checkout event appears to have been acknowledged"
    );
  }

  console.log("");
  console.log("========================================");
  console.log("P22 D2 — Response Boundary");
  console.log("========================================");

  const unsignedContentType =
    String(unsigned.headers["content-type"] || "");

  const invalidContentType =
    String(invalid.headers["content-type"] || "");

  if (unsignedContentType.length > 0) {
    pass(
      "Response Boundary",
      "Unsigned rejection returns a defined Content-Type"
    );
  } else {
    fail(
      "Response Boundary",
      "Unsigned rejection Content-Type missing"
    );
  }

  if (invalidContentType.length > 0) {
    pass(
      "Response Boundary",
      "Invalid-signature rejection returns a defined Content-Type"
    );
  } else {
    fail(
      "Response Boundary",
      "Invalid-signature rejection Content-Type missing"
    );
  }

  if (
    unsigned.statusCode !== 200 &&
    invalid.statusCode !== 200
  ) {
    pass(
      "Response Boundary",
      "Neither forged request received HTTP 200"
    );
  } else {
    fail(
      "Response Boundary",
      "A forged webhook request unexpectedly received HTTP 200"
    );
  }

  finish();
}

function finish() {
  const passCount = results.filter(
    result => result.status === "PASS"
  ).length;

  const failCount = results.filter(
    result => result.status === "FAIL"
  ).length;

  const report = {
    milestone: "P22 D2",
    description:
      "Production Stripe Webhook Security Boundary QA",
    generatedAt: new Date().toISOString(),
    productionEndpoint: WEBHOOK_URL,
    destructiveActionsPerformed: false,
    secretsUsed: false,
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
    JSON.stringify(report, null, 2)
  );

  console.log("");
  console.log("========================================");
  console.log("P22 D2 SUMMARY");
  console.log("========================================");
  console.log(`PASS: ${passCount}`);
  console.log(`FAIL: ${failCount}`);
  console.log("NOT_EXERCISED: 0");
  console.log(`REPORT: ${REPORT_PATH}`);
  console.log(
    `P22 D2 STATUS: ${failCount === 0 ? "PASS" : "FAIL"}`
  );

  if (failCount > 0) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error("P22 D2 harness failed:", error);
  process.exitCode = 1;
});
