/**
 * P35 NBA D4B — Cross-endpoint completeness validator.
 *
 * Pure function:
 * - No API requests
 * - No spreadsheet operations
 * - No property access
 * - No production writes
 *
 * Agreement between endpoints does not prove
 * independent completeness.
 */

function validateNBACrossEndpointCompleteness_(
  boxScoreGames,
  statsRows
) {
  const errors = [];

  function id(value) {
    const result = String(
      value === null || value === undefined ? "" : value
    ).trim();

    return /^[1-9]\d*$/.test(result) ? result : "";
  }

  function number(value) {
    return typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 0
      ? value
      : null;
  }

  function addError(message) {
    errors.push(message);
  }

  if (!Array.isArray(boxScoreGames) || !boxScoreGames.length) {
    throw new Error("Box-score games must be a nonempty array.");
  }

  if (!Array.isArray(statsRows)) {
    throw new Error("Stats rows must be an array.");
  }

  const expected = new Map();
  const officialScores = new Map();
  const seenGames = new Set();

  for (const game of boxScoreGames) {
    const gameId = id(game && game.id);

    if (!gameId || seenGames.has(gameId)) {
      addError("Invalid or duplicate box-score game ID.");
      continue;
    }

    seenGames.add(gameId);

    for (const side of ["home", "visitor"]) {
      const team = side === "home"
        ? game.home_team
        : game.visitor_team;

      const teamId = id(team && team.id);
      const players = team && team.players;
      const score = number(
        side === "home"
          ? game.home_team_score
          : game.visitor_team_score
      );

      if (!teamId || !Array.isArray(players) || score === null) {
        addError("Malformed box-score team for game " + gameId);
        continue;
      }

      const teamKey = gameId + ":" + teamId;

      if (officialScores.has(teamKey)) {
        addError("Duplicate team in game " + gameId);
        continue;
      }

      officialScores.set(teamKey, score);

      if (!players.length) {
        addError("Empty box-score player array for " + teamKey);
      }

      for (const row of players) {
        const playerId = id(row && row.player && row.player.id);

        if (!playerId) {
          addError("Missing box-score player ID for " + teamKey);
          continue;
        }

        const key = teamKey + ":" + playerId;

        if (expected.has(key)) {
          addError("Duplicate box-score player " + key);
          continue;
        }

        const values = {};

        for (const field of ["pts", "reb", "ast", "turnover"]) {
          values[field] = number(row[field]);

          if (values[field] === null) {
            addError("Invalid box-score " + field + " for " + key);
          }
        }

        expected.set(key, values);
      }
    }
  }

  const actual = new Map();

  for (const row of statsRows) {
    const gameId = id(
      row && (
        row.game_id != null
          ? row.game_id
          : row.game && row.game.id
      )
    );

    const teamId = id(
      row && (
        row.team_id != null
          ? row.team_id
          : row.team && row.team.id
      )
    );

    const playerId = id(
      row && (
        row.player_id != null
          ? row.player_id
          : row.player && row.player.id
      )
    );

    if (!gameId || !teamId || !playerId) {
      addError("Invalid stats identity.");
      continue;
    }

    const key = gameId + ":" + teamId + ":" + playerId;

    if (actual.has(key)) {
      addError("Duplicate stats player " + key);
      continue;
    }

    const values = {};

    for (const field of ["pts", "reb", "ast", "turnover"]) {
      values[field] = number(row[field]);

      if (values[field] === null) {
        addError("Invalid stats " + field + " for " + key);
      }
    }

    actual.set(key, values);
  }

  for (const [key, boxValues] of expected) {
    if (!actual.has(key)) {
      addError("Missing stats player " + key);
      continue;
    }

    const statValues = actual.get(key);

    for (const field of ["pts", "reb", "ast", "turnover"]) {
      if (boxValues[field] !== statValues[field]) {
        addError("Mismatch " + field + " for " + key);
      }
    }
  }

  for (const key of actual.keys()) {
    if (!expected.has(key)) {
      addError("Unexpected stats player " + key);
    }
  }

  for (const [teamKey, score] of officialScores) {
    let points = 0;

    for (const [key, values] of expected) {
      if (key.startsWith(teamKey + ":")) {
        points += values.pts === null ? 0 : values.pts;
      }
    }

    if (points !== score) {
      addError("Box-score points mismatch for " + teamKey);
    }
  }

  return {
    passed: errors.length === 0,
    gameCount: seenGames.size,
    boxScorePlayerCount: expected.size,
    statsPlayerCount: actual.size,
    errorCount: errors.length,
    errors
  };
}
