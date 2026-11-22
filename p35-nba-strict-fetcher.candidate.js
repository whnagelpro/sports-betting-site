/**
 * P35 NBA D4B — strict, isolated NBA stats fetcher.
 *
 * Read-only API fetch.
 * No spreadsheet operations.
 * Does not replace the existing shared fetcher.
 */
function fetchAllNBAStatsForGameIdsStrict_(gameIds) {
  if (
    !Array.isArray(gameIds) ||
    !gameIds.length
  ) {
    throw new Error(
      "Strict NBA stats fetch requires nonempty game IDs."
    );
  }

  const normalizedIds = gameIds.map(id => {
    const value = String(id).trim();

    if (!/^[1-9]\d*$/.test(value)) {
      throw new Error(
        `Invalid NBA Game ID: ${id}`
      );
    }

    return value;
  });

  if (
    new Set(normalizedIds).size !== normalizedIds.length
  ) {
    throw new Error(
      "Duplicate NBA Game IDs supplied to strict fetcher."
    );
  }

  const allRows = [];

  normalizedIds.forEach(gameId => {
    const seenCursors = new Set();
    let cursor = null;
    let pages = 0;
    let gameRows = 0;

    do {
      pages++;

      if (pages > 25) {
        throw new Error(
          `NBA Game ${gameId} exceeded 25 stats pages.`
        );
      }

      const params = {
        "game_ids[]": gameId,
        per_page: 100
      };

      if (cursor !== null) {
        params.cursor = cursor;
      }

      const response = fetchApi_(
        "/nba/v1/stats",
        params
      );

      if (
        !response ||
        typeof response !== "object" ||
        !Array.isArray(response.data)
      ) {
        throw new Error(
          `Malformed NBA stats response for Game ${gameId}.`
        );
      }

      if (
        !response.meta ||
        typeof response.meta !== "object"
      ) {
        throw new Error(
          `Missing NBA pagination metadata for Game ${gameId}.`
        );
      }

      response.data.forEach(stat => {
        if (
          !stat ||
          typeof stat !== "object"
        ) {
          throw new Error(
            `Malformed player-stat record for Game ${gameId}.`
          );
        }

        const rawId =
          stat.game_id !== undefined &&
          stat.game_id !== null
            ? stat.game_id
            : stat.game && stat.game.id;

        const returnedId = String(
          rawId === undefined || rawId === null
            ? ""
            : rawId
        ).trim();

        if (returnedId !== gameId) {
          throw new Error(
            `Unexpected Game ID ${returnedId} in stats for ${gameId}.`
          );
        }

        allRows.push(stat);
        gameRows++;
      });

      const next = response.meta.next_cursor;

      if (
        next === null ||
        next === undefined ||
        next === ""
      ) {
        cursor = null;
      } else {
        const key = String(next);

        if (!key.trim()) {
          throw new Error(
            `Blank NBA pagination cursor for Game ${gameId}.`
          );
        }

        if (seenCursors.has(key)) {
          throw new Error(
            `Repeated NBA pagination cursor for Game ${gameId}.`
          );
        }

        seenCursors.add(key);
        cursor = next;
      }

    } while (cursor !== null);

    if (gameRows === 0) {
      throw new Error(
        `No player stats returned for completed Game ${gameId}.`
      );
    }

    Logger.log(
      `Strict NBA stats fetch: Game ${gameId}, ` +
      `${gameRows} records, ${pages} page(s).`
    );

    Utilities.sleep(150);
  });

  return allRows;
}
