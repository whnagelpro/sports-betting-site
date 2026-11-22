/*
 * P35 NBA D4B — Team Game Logs worker
 *
 * Returns validated 10-column rows for one team.
 *
 * No spreadsheet writes.
 * No staging writes.
 * No production writes.
 *
 * Game discovery and stat retrieval use existing NBA helpers.
 */
function refreshNBATeamGameLogsForTeam_(
  targetTeamId,
  startDate,
  endDate
) {
  const teamId = Number(targetTeamId);

  if (
    !Number.isSafeInteger(teamId) ||
    teamId <= 0
  ) {
    throw new Error(
      `NBA Team Game Logs worker requires a valid team ID: ${targetTeamId}`
    );
  }

  const games = getNBACompletedGamesForTeam_(
    teamId,
    startDate,
    endDate
  );

  if (!Array.isArray(games) || !games.length) {
    throw new Error(
      `NBA Team Game Logs worker found no completed games for team ${teamId}.`
    );
  }

  const expectedGames = new Map();

  games.forEach(game => {
    const gameId = String(
      game && game.id != null ? game.id : ""
    ).trim();

    if (!gameId || expectedGames.has(gameId)) {
      throw new Error(
        `NBA Team Game Logs worker found missing/duplicate Game ID: ${gameId}`
      );
    }

    const home = game.home_team || {};
    const away = game.visitor_team || {};

    const homeId = Number(home.id);
    const awayId = Number(away.id);

    if (
      !Number.isSafeInteger(homeId) ||
      !Number.isSafeInteger(awayId) ||
      homeId <= 0 ||
      awayId <= 0 ||
      homeId === awayId ||
      (homeId !== teamId && awayId !== teamId)
    ) {
      throw new Error(
        `NBA Team Game Logs worker found invalid team identities in Game ${gameId}.`
      );
    }

    const homeName = normalizeNBATeamName_(
      String(home.full_name || "").trim()
    );

    const awayName = normalizeNBATeamName_(
      String(away.full_name || "").trim()
    );

    if (
      !homeName ||
      !awayName ||
      homeName === awayName
    ) {
      throw new Error(
        `NBA Team Game Logs worker found invalid team names in Game ${gameId}.`
      );
    }

    const date = getNBAGameAZDate_(game);

    if (
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      throw new Error(
        `NBA Team Game Logs worker found invalid date in Game ${gameId}.`
      );
    }

    expectedGames.set(gameId, {
      date,
      homeId,
      awayId,
      homeName,
      awayName,
      game
    });
  });

  const gameIds = Array.from(expectedGames.keys());

  const statRows = fetchAllNBAStatsForGameIdsStrict_(gameIds);

  if (!Array.isArray(statRows) || !statRows.length) {
    throw new Error(
      `NBA Team Game Logs worker received no player statistics.`
    );
  }

  const aggregates = new Map();
  const seenPlayers = new Set();

  const requireStat = (value, field, gameId) => {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      typeof value === "boolean"
    ) {
      throw new Error(
        `Missing ${field} in Game ${gameId}.`
      );
    }

    const number = Number(value);

    if (
      !Number.isFinite(number) ||
      number < 0 ||
      !Number.isInteger(number)
    ) {
      throw new Error(
        `Invalid ${field} in Game ${gameId}: ${value}`
      );
    }

    return number;
  };

  statRows.forEach(stat => {
    if (!stat || typeof stat !== "object") {
      throw new Error(
        "NBA Team Game Logs worker received a malformed stat record."
      );
    }

    const gameId = String(
      stat.game_id != null
        ? stat.game_id
        : stat.game && stat.game.id != null
          ? stat.game.id
          : ""
    ).trim();

    if (!expectedGames.has(gameId)) {
      throw new Error(
        `Unexpected game-stat record for Game ${gameId || "(missing)"}.`
      );
    }

    const info = expectedGames.get(gameId);

    const statTeamId = Number(
      stat.team_id != null
        ? stat.team_id
        : stat.team && stat.team.id
    );

    if (
      statTeamId !== info.homeId &&
      statTeamId !== info.awayId
    ) {
      throw new Error(
        `Unexpected team identity in Game ${gameId}.`
      );
    }

    const rawMinutes = stat.min;

    if (
      rawMinutes !== null &&
      rawMinutes !== undefined &&
      rawMinutes !== ""
    ) {
      const minutesText = String(rawMinutes).trim();

      if (
        !/^\d+(?::[0-5]?\d)?(?:\.\d+)?$/.test(minutesText)
      ) {
        throw new Error(
          `Invalid minutes in Game ${gameId}: ${minutesText}`
        );
      }
    }

    const minutes = parseNBAMinutes_(rawMinutes);

    if (!Number.isFinite(minutes) || minutes < 0) {
      throw new Error(
        `Invalid parsed minutes in Game ${gameId}.`
      );
    }

    if (minutes <= 0) {
      return;
    }

    const playerId = String(
      stat.player_id != null
        ? stat.player_id
        : stat.player && stat.player.id != null
          ? stat.player.id
          : ""
    ).trim();

    if (!playerId) {
      throw new Error(
        `Played row missing Player ID in Game ${gameId}.`
      );
    }

    const playerKey = `${gameId}|${playerId}`;

    if (seenPlayers.has(playerKey)) {
      throw new Error(
        `Duplicate player-stat row: ${playerKey}`
      );
    }

    seenPlayers.add(playerKey);

    const turnoverRaw =
      stat.turnover !== null &&
      stat.turnover !== undefined &&
      stat.turnover !== ""
        ? stat.turnover
        : stat.turnovers;

    const values = {
      points: requireStat(stat.pts, "Points", gameId),
      rebounds: requireStat(stat.reb, "Rebounds", gameId),
      assists: requireStat(stat.ast, "Assists", gameId),
      threes: requireStat(stat.fg3m, "Threes", gameId),
      turnovers: requireStat(
        turnoverRaw,
        "Turnovers",
        gameId
      )
    };

    const key = `${gameId}|${statTeamId}`;

    if (!aggregates.has(key)) {
      aggregates.set(key, {
        points: 0,
        rebounds: 0,
        assists: 0,
        threes: 0,
        turnovers: 0,
        playerCount: 0
      });
    }

    const total = aggregates.get(key);

    total.points += values.points;
    total.rebounds += values.rebounds;
    total.assists += values.assists;
    total.threes += values.threes;
    total.turnovers += values.turnovers;
    total.playerCount++;
  });

  const rows = [];
  const generatedKeys = new Set();

  expectedGames.forEach((info, gameId) => {
    const isHome = info.homeId === teamId;

    const targetName = isHome
      ? info.homeName
      : info.awayName;

    const opponentName = isHome
      ? info.awayName
      : info.homeName;

    const target = aggregates.get(
      `${gameId}|${teamId}`
    );

    const opponentId = isHome
      ? info.awayId
      : info.homeId;

    const opponent = aggregates.get(
      `${gameId}|${opponentId}`
    );

    if (
      !target ||
      !opponent ||
      target.playerCount <= 0 ||
      opponent.playerCount <= 0
    ) {
      throw new Error(
        `Incomplete team statistics for Game ${gameId}.`
      );
    }

    /*
     * Compare against official scores when supplied.
     * A score mismatch is a hard failure.
     */
    const homeScore = info.game.home_team_score;
    const awayScore = info.game.visitor_team_score;

    const officialHome = requireStat(
      homeScore,
      "Home Score",
      gameId
    );

    const officialAway = requireStat(
      awayScore,
      "Away Score",
      gameId
    );

    const actualHome = isHome
      ? target.points
      : opponent.points;

    const actualAway = isHome
      ? opponent.points
      : target.points;

    if (
      actualHome !== officialHome ||
      actualAway !== officialAway
    ) {
      throw new Error(
        `Aggregated points do not match official scores in Game ${gameId}.`
      );
    }

    const key = `${gameId}|${targetName}`;

    if (generatedKeys.has(key)) {
      throw new Error(
        `Duplicate Team Game Log key: ${key}`
      );
    }

    generatedKeys.add(key);

    const row = [
      info.date,
      gameId,
      targetName,
      opponentName,
      target.points,
      opponent.points,
      target.rebounds,
      target.assists,
      target.threes,
      target.turnovers
    ];

    if (row.length !== 10) {
      throw new Error(
        `Invalid Team Game Log column count in Game ${gameId}.`
      );
    }

    rows.push(row);
  });

  if (rows.length !== expectedGames.size) {
    throw new Error(
      `Team Game Log coverage mismatch: expected ${expectedGames.size}, got ${rows.length}.`
    );
  }

  rows.sort((a, b) =>
    String(a[0]).localeCompare(String(b[0])) ||
    String(a[1]).localeCompare(String(b[1]))
  );

  Logger.log(
    `NBA Team Game Logs worker validated: ` +
    `teamId=${teamId}, ` +
    `games=${expectedGames.size}, ` +
    `rows=${rows.length}`
  );

  return rows;
}
