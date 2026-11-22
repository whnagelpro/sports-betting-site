function fetchP36VerifiedNBASlate_(slateDate) {

  if (!isValidP36Date_(slateDate)) {
    throw new Error("P36_NBA_INVALID_SLATE_DATE");
  }

  const games = [];
  const gameIds = new Set();
  const seenCursors = new Set();

  let cursor = null;
  let pages = 0;

  const maxPages = 20;

  do {

    if (pages >= maxPages) {
      throw new Error("P36_NBA_PAGINATION_LIMIT");
    }

    const params = {
      "dates[]": slateDate,
      per_page: 100
    };

    if (cursor !== null) {
      params.cursor = cursor;
    }

    const response = fetchApi_(
      "/nba/v1/games",
      params
    );

    pages++;

    if (
      !response ||
      typeof response !== "object" ||
      !Array.isArray(response.data) ||
      !response.meta ||
      typeof response.meta !== "object" ||
      Array.isArray(response.meta) ||
      !Object.prototype.hasOwnProperty.call(
        response.meta,
        "next_cursor"
      )
    ) {

      throw new Error("P36_NBA_INVALID_API_RESPONSE");

    }

    for (const game of response.data) {

      if (
        !game ||
        typeof game !== "object" ||
        Array.isArray(game)
      ) {

        throw new Error("P36_NBA_INVALID_GAME");

      }

      const id = typeof game.id === "number"
        && Number.isSafeInteger(game.id)
        ? String(game.id)
        : typeof game.id === "string"
          ? game.id.trim()
          : "";

      if (!/^[1-9]\d*$/.test(id)) {
        throw new Error("P36_NBA_INVALID_GAME_ID");
      }

      if (gameIds.has(id)) {
        throw new Error("P36_NBA_DUPLICATE_GAME_ID");
      }

      if (
        !isValidP36Date_(game.date) ||
        game.date !== slateDate
      ) {

        throw new Error("P36_NBA_SLATE_DATE_MISMATCH");

      }

      gameIds.add(id);
      games.push(game);

    }

    const nextCursor = response.meta.next_cursor;

    if (nextCursor === null) {

      cursor = null;

    } else {

      if (
        !(
          (
            typeof nextCursor === "number" &&
            Number.isSafeInteger(nextCursor) &&
            nextCursor > 0
          ) ||
          (
            typeof nextCursor === "string" &&
            nextCursor.trim().length > 0
          )
        )
      ) {

        throw new Error("P36_NBA_INVALID_CURSOR");

      }

      const cursorKey = String(nextCursor).trim();

      if (seenCursors.has(cursorKey)) {
        throw new Error("P36_NBA_REPEATED_CURSOR");
      }

      if (response.data.length === 0) {
        throw new Error("P36_NBA_EMPTY_PAGINATION_PAGE");
      }

      seenCursors.add(cursorKey);

      cursor = nextCursor;

    }

  } while (cursor !== null);

  return {
    league: "NBA",
    slateDate,
    games,
    pages,
    snapshotVerified: true
  };

}
