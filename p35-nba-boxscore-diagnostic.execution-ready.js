/*
P35 NBA D4B — CONTROLLED BOX-SCORE DIAGNOSTIC

STATUS: PREPARED — NOT AUTHORIZED FOR EXECUTION

PURPOSE:
Inspect the structure of one historical NBA box-score
API response.

EXPECTED API REQUEST:
GET /nba/v1/box_scores
date=2026-11-01

SAFETY:
- No spreadsheet writes
- No trigger modifications
- No deployment operations
- No raw player-record logging
- No API key logging
- No independent team totals presumed

IMPORTANT:
This file must not be executed or added to an Apps
Script project until the execution environment and
authorization are explicitly reviewed.

PRODUCTION NBA PIPELINE: NO-GO
*/

/**
 * P35 NBA D4B — ISOLATED BOX-SCORE CONTRACT DIAGNOSTIC
 *
 * Read-only API diagnostic.
 *
 * IMPORTANT:
 * - Not intended for production deployment.
 * - Makes one authenticated GET request when executed.
 * - Does not modify spreadsheets.
 * - Does not display player records or credentials.
 * - Does not persist API responses.
 */
function testP35NBABoxScoreResponseContract_() {
  const date = "2026-11-01";

  const response = fetchApi_(
    "/nba/v1/box_scores",
    { date: date }
  );

  if (
    !response ||
    typeof response !== "object" ||
    !Array.isArray(response.data)
  ) {
    throw new Error(
      "Invalid NBA box-score response structure."
    );
  }

  const data = response.data;

  const describe = function(value) {
    if (Array.isArray(value)) return "array";
    if (value === null) return "null";
    return typeof value;
  };

  const describeFields = function(value) {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      return [];
    }

    return Object.keys(value)
      .sort()
      .map(function(key) {
        return {
          field: key,
          type: describe(value[key])
        };
      });
  };

  const potentialTeamTotals = [];

  const inspect = function(value, path, depth) {
    if (
      !value ||
      typeof value !== "object" ||
      depth > 3
    ) {
      return;
    }

    if (Array.isArray(value)) {
      if (value.length > 0) {
        inspect(
          value[0],
          path + "[0]",
          depth + 1
        );
      }
      return;
    }

    Object.keys(value).forEach(function(key) {
      const fieldPath = path
        ? path + "." + key
        : key;

      if (
        /team.*(?:total|stat)|(?:total|stat).*team|reb|ast|turnover|fg3m/i
          .test(key)
      ) {
        potentialTeamTotals.push({
          path: fieldPath,
          type: describe(value[key])
        });
      }

      inspect(
        value[key],
        fieldPath,
        depth + 1
      );
    });
  };

  if (data.length > 0) {
    inspect(data[0], "data[0]", 0);
  }

  const result = {
    diagnostic: "P35 NBA D4B — Box-Score Contract",
    date: date,
    responseCount: data.length,
    topLevelFields: describeFields(response),
    firstRecordFields:
      data.length > 0
        ? describeFields(data[0])
        : [],
    potentialTeamTotals: potentialTeamTotals,
    independentTotalsVerified: false,
    spreadsheetWrites: 0
  };

  Logger.log(
    JSON.stringify(result, null, 2)
  );

  return result;
}
