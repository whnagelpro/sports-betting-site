
/**
 * SPORTACULAR P35 NBA D4B — STEP 9E.15
 *
 * Read-only Google Apps Script persistence adapter.
 *
 * No sheet creation.
 * No sheet writes.
 * No production promotion.
 */

const P35_NBA_STAGING_SHEET_ =
  "NBA Team Game Logs Staging";

const P35_NBA_LEDGER_SHEET_ =
  "NBA Team Game Logs Ledger";

const P35_NBA_LEDGER_HEADERS_ = [
  "Run ID",
  "Team Index",
  "Team ID",
  "Team",
  "Row Count",
  "Fingerprint",
  "Status"
];

function p35NBAReadPersistenceSnapshot_(runId) {
  if (
    typeof runId !== "string" ||
    !/^[a-zA-Z0-9_-]{8,100}$/.test(runId)
  ) {
    throw new Error("P35 NBA: invalid run ID");
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!ss) {
    throw new Error("P35 NBA: spreadsheet unavailable");
  }

  const staging = ss.getSheetByName(
    P35_NBA_STAGING_SHEET_
  );

  const ledgerSheet = ss.getSheetByName(
    P35_NBA_LEDGER_SHEET_
  );

  if (!staging || !ledgerSheet) {
    throw new Error(
      "P35 NBA: required persistence sheet missing"
    );
  }

  const stagingValues =
    staging.getDataRange().getValues();

  const ledgerValues =
    ledgerSheet.getDataRange().getValues();

  if (!stagingValues.length || !ledgerValues.length) {
    throw new Error(
      "P35 NBA: persistence headers missing"
    );
  }

  const expectedStagingHeaders =
    P35_NBA_TEAM_LOG_HEADERS_;

  const stagingHeaders = stagingValues[0];

  if (
    stagingHeaders.length !== expectedStagingHeaders.length ||
    stagingHeaders.some(
      (value, index) =>
        String(value).trim() !==
        expectedStagingHeaders[index]
    )
  ) {
    throw new Error(
      "P35 NBA: staging header mismatch"
    );
  }

  const ledgerHeaders = ledgerValues[0];

  if (
    ledgerHeaders.length !== P35_NBA_LEDGER_HEADERS_.length ||
    ledgerHeaders.some(
      (value, index) =>
        String(value).trim() !==
        P35_NBA_LEDGER_HEADERS_[index]
    )
  ) {
    throw new Error(
      "P35 NBA: ledger header mismatch"
    );
  }

  const ledger = ledgerValues.slice(1).map(row => ({
    runId: String(row[0]).trim(),
    index: Number(row[1]),
    teamId: Number(row[2]),
    team: String(row[3]).trim(),
    rowCount: Number(row[4]),
    fingerprint: String(row[5]).trim(),
    status: String(row[6]).trim()
  }));

  const staleRuns = ledger.filter(
    entry => entry.runId !== runId
  );

  if (staleRuns.length) {
    throw new Error(
      "P35 NBA: ledger contains rows from another run"
    );
  }

  const seen = new Set();

  for (const entry of ledger) {
    if (
      !Number.isInteger(entry.index) ||
      entry.index < 0 ||
      entry.index >= 30 ||
      !Number.isSafeInteger(entry.teamId) ||
      entry.teamId <= 0 ||
      !entry.team
    ) {
      throw new Error(
        "P35 NBA: invalid ledger identity"
      );
    }

    if (seen.has(entry.index)) {
      throw new Error(
        "P35 NBA: duplicate ledger index"
      );
    }

    seen.add(entry.index);
  }

  return {
    runId,
    stagingRows: stagingValues.slice(1),
    ledger,
    productionPromotionApproved: false
  };
}
