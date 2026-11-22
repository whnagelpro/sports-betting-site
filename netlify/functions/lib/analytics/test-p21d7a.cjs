const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE_URL = "https://sportacularanalytics.com";
const REPORT_PATH = path.resolve(
  process.cwd(),
  "p21-evidence/p21d7a-report.json"
);

const results = [];

function record(status, area, check, details = {}) {
  const result = {
    status,
    area,
    check,
    ...details
  };

  results.push(result);

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

async function isVisible(locator) {
  return await locator.isVisible().catch(() => false);
}

async function main() {
  console.log("P21 D7A — Password Recovery UI + Request Contract QA");
  console.log(`Target: ${BASE_URL}`);
  console.log("");

  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext();

  const page = await context.newPage();

  const jsExceptions = [];
  const consoleErrors = [];
  const failedRequests = [];
  const unexpectedHttpFailures = [];

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
      failure: request.failure()?.errorText || "unknown"
    });
  });

  page.on("response", response => {
    if (response.status() >= 400) {
      unexpectedHttpFailures.push({
        status: response.status(),
        url: response.url()
      });
    }
  });

  try {
    console.log("==================================================");
    console.log("P21 D7A — Reset Request View");
    console.log("==================================================");

    const resetResponse = await page.goto(
      `${BASE_URL}/auth.html?view=reset`,
      {
        waitUntil: "networkidle",
        timeout: 30000
      }
    );

    if (resetResponse && resetResponse.status() === 200) {
      pass(
        "Reset Request",
        "Reset-password route returned HTTP 200"
      );
    } else {
      fail(
        "Reset Request",
        "Reset-password route did not return HTTP 200",
        {
          note: `HTTP ${resetResponse?.status() ?? "NO_RESPONSE"}`
        }
      );
    }

    const resetRequestView = page.locator("#reset-request-view");
    const resetEmail = page.locator("#reset-email");
    const resetForm = page.locator("#reset-request-form");
    const resetButton = page.locator(
      '#reset-request-form button[type="submit"]'
    );
    const resetMessage = page.locator("#reset-request-message");

    if (await isVisible(resetRequestView)) {
      pass(
        "Reset Request",
        "Reset request view is visible"
      );
    } else {
      fail(
        "Reset Request",
        "Reset request view is not visible"
      );
    }

    if (await isVisible(resetEmail)) {
      pass(
        "Reset Request",
        "Reset email field is visible"
      );
    } else {
      fail(
        "Reset Request",
        "Reset email field is not visible"
      );
    }

    if (await resetForm.count() === 1) {
      pass(
        "Reset Request",
        "Reset request form exists"
      );
    } else {
      fail(
        "Reset Request",
        "Reset request form missing or duplicated"
      );
    }

    if (await isVisible(resetButton)) {
      const buttonText = (
        await resetButton.innerText().catch(() => "")
      ).trim();

      if (/send reset link/i.test(buttonText)) {
        pass(
          "Reset Request",
          "Send Reset Link button is visible"
        );
      } else {
        fail(
          "Reset Request",
          "Reset request submit button has unexpected text",
          {
            note: buttonText || "EMPTY"
          }
        );
      }
    } else {
      fail(
        "Reset Request",
        "Send Reset Link button is not visible"
      );
    }

    if (await resetMessage.count() === 1) {
      pass(
        "Reset Request",
        "Reset request message container exists"
      );
    } else {
      fail(
        "Reset Request",
        "Reset request message container missing or duplicated"
      );
    }

    const resetInputType = await resetEmail
      .getAttribute("type")
      .catch(() => null);

    if (resetInputType === "email") {
      pass(
        "Reset Request",
        "Reset email field uses email input type"
      );
    } else {
      fail(
        "Reset Request",
        "Reset email field does not use email input type",
        {
          note: `type=${resetInputType}`
        }
      );
    }

    const resetRequired = await resetEmail
      .getAttribute("required")
      .catch(() => null);

    if (resetRequired !== null) {
      pass(
        "Reset Request",
        "Reset email field is required"
      );
    } else {
      fail(
        "Reset Request",
        "Reset email field is not required"
      );
    }

    console.log("");
    console.log("==================================================");
    console.log("P21 D7A — Update Password View");
    console.log("==================================================");

    const updateResponse = await page.goto(
      `${BASE_URL}/auth.html?view=update-password`,
      {
        waitUntil: "networkidle",
        timeout: 30000
      }
    );

    if (updateResponse && updateResponse.status() === 200) {
      pass(
        "Update Password",
        "Update-password route returned HTTP 200"
      );
    } else {
      fail(
        "Update Password",
        "Update-password route did not return HTTP 200",
        {
          note: `HTTP ${updateResponse?.status() ?? "NO_RESPONSE"}`
        }
      );
    }

    const updateView = page.locator("#reset-update-view");
    const updateForm = page.locator("#reset-update-form");
    const newPassword = page.locator("#new-password");
    const confirmPassword = page.locator("#confirm-password");
    const updateButton = page.locator(
      '#reset-update-form button[type="submit"]'
    );
    const updateMessage = page.locator("#reset-update-message");

    if (await isVisible(updateView)) {
      pass(
        "Update Password",
        "Create New Password view is visible"
      );
    } else {
      fail(
        "Update Password",
        "Create New Password view is not visible"
      );
    }

    if (await updateForm.count() === 1) {
      pass(
        "Update Password",
        "Password update form exists"
      );
    } else {
      fail(
        "Update Password",
        "Password update form missing or duplicated"
      );
    }

    if (await isVisible(newPassword)) {
      pass(
        "Update Password",
        "New password field is visible"
      );
    } else {
      fail(
        "Update Password",
        "New password field is not visible"
      );
    }

    if (await isVisible(confirmPassword)) {
      pass(
        "Update Password",
        "Confirm password field is visible"
      );
    } else {
      fail(
        "Update Password",
        "Confirm password field is not visible"
      );
    }

    const newPasswordType = await newPassword
      .getAttribute("type")
      .catch(() => null);

    const confirmPasswordType = await confirmPassword
      .getAttribute("type")
      .catch(() => null);

    if (
      newPasswordType === "password" &&
      confirmPasswordType === "password"
    ) {
      pass(
        "Update Password",
        "Both password fields use password input type"
      );
    } else {
      fail(
        "Update Password",
        "Password fields have unexpected input types",
        {
          note:
            `new=${newPasswordType}, confirm=${confirmPasswordType}`
        }
      );
    }

    const newRequired = await newPassword
      .getAttribute("required")
      .catch(() => null);

    const confirmRequired = await confirmPassword
      .getAttribute("required")
      .catch(() => null);

    if (
      newRequired !== null &&
      confirmRequired !== null
    ) {
      pass(
        "Update Password",
        "Both password fields are required"
      );
    } else {
      fail(
        "Update Password",
        "One or more password fields are not required"
      );
    }

    if (await isVisible(updateButton)) {
      const buttonText = (
        await updateButton.innerText().catch(() => "")
      ).trim();

      if (/update password/i.test(buttonText)) {
        pass(
          "Update Password",
          "Update Password button is visible"
        );
      } else {
        fail(
          "Update Password",
          "Password update button has unexpected text",
          {
            note: buttonText || "EMPTY"
          }
        );
      }
    } else {
      fail(
        "Update Password",
        "Update Password button is not visible"
      );
    }

    if (await updateMessage.count() === 1) {
      pass(
        "Update Password",
        "Password update message container exists"
      );
    } else {
      fail(
        "Update Password",
        "Password update message container missing or duplicated"
      );
    }

    console.log("");
    console.log("==================================================");
    console.log("P21 D7A — Client-Side Validation");
    console.log("==================================================");

    await newPassword.fill("D7A-Password-One-123!");
    await confirmPassword.fill("D7A-Password-Two-456!");

    await updateButton.click();

    await page.waitForTimeout(500);

    const mismatchMessage = (
      await updateMessage.textContent().catch(() => "")
    ).trim();

    if (/passwords do not match/i.test(mismatchMessage)) {
      pass(
        "Validation",
        "Mismatched passwords are rejected before update"
      );
    } else {
      fail(
        "Validation",
        "Mismatched-password validation message not observed",
        {
          note: mismatchMessage || "EMPTY"
        }
      );
    }

    console.log("");
    console.log("==================================================");
    console.log("P21 D7A — Browser Health");
    console.log("==================================================");

    if (jsExceptions.length === 0) {
      pass(
        "Browser Health",
        "No uncaught JavaScript exceptions"
      );
    } else {
      fail(
        "Browser Health",
        "Uncaught JavaScript exceptions observed",
        {
          jsExceptions
        }
      );
    }

    const filteredConsoleErrors = consoleErrors.filter(message => {
      return !/failed to load resource.*(?:favicon|404)/i.test(
        message
      );
    });

    if (filteredConsoleErrors.length === 0) {
      pass(
        "Browser Health",
        "No unexpected console errors"
      );
    } else {
      fail(
        "Browser Health",
        "Unexpected console errors observed",
        {
          consoleErrors: filteredConsoleErrors
        }
      );
    }

    if (failedRequests.length === 0) {
      pass(
        "Browser Health",
        "No failed browser network requests"
      );
    } else {
      fail(
        "Browser Health",
        "Failed browser network requests observed",
        {
          failedRequests
        }
      );
    }

    const filteredHttpFailures =
      unexpectedHttpFailures.filter(item => {
        return !/favicon/i.test(item.url);
      });

    if (filteredHttpFailures.length === 0) {
      pass(
        "Browser Health",
        "No unexpected HTTP failures"
      );
    } else {
      fail(
        "Browser Health",
        "Unexpected HTTP failures observed",
        {
          httpFailures: filteredHttpFailures
        }
      );
    }
  } finally {
    await browser.close();
  }

  const passCount = results.filter(
    result => result.status === "PASS"
  ).length;

  const failCount = results.filter(
    result => result.status === "FAIL"
  ).length;

  const report = {
    milestone: "P21 D7A",
    description:
      "Password Recovery UI + Request Contract QA",
    target: BASE_URL,
    generatedAt: new Date().toISOString(),
    summary: {
      pass: passCount,
      fail: failCount
    },
    results
  };

  fs.mkdirSync(path.dirname(REPORT_PATH), {
    recursive: true
  });

  fs.writeFileSync(
    REPORT_PATH,
    JSON.stringify(report, null, 2)
  );

  console.log("");
  console.log("==================================================");
  console.log("P21 D7A SUMMARY");
  console.log("==================================================");
  console.log(`PASS: ${passCount}`);
  console.log(`FAIL: ${failCount}`);
  console.log(`REPORT: ${REPORT_PATH}`);
  console.log(
    `P21 D7A STATUS: ${failCount === 0 ? "PASS" : "FAIL"}`
  );

  if (failCount > 0) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error("P21 D7A fatal error:", error);
  process.exitCode = 1;
});
