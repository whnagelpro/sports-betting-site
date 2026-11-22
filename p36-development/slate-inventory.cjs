"use strict";

function reconcileP36SlateInventory_(
  league,
  slateDate,
  previousInventory,
  observedGameIds
) {

  const result = {
    accepted: false,
    changed: false,
    reason: null,
    inventory: null,
    addedGameIds: [],
    missingGameIds: []
  };

  const reject = reason => {
    result.reason = reason;
    return result;
  };

  const validDate = value =>
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0,10) === value;

  const normalizeId = value =>
    typeof value === "string" ||
    Number.isSafeInteger(value)
      ? String(value).trim()
      : "";

  const validId = value =>
    /^[1-9]\d*$/.test(value);

  const sortIds = ids =>
    [...ids].sort(
      (a,b) =>
        a.length - b.length ||
        a.localeCompare(b)
    );

  if (!["NBA","NHL","MLB","NFL"].includes(league)) {
    return reject("INVALID_LEAGUE");
  }

  if (!validDate(slateDate)) {
    return reject("INVALID_SLATE_DATE");
  }

  if (!Array.isArray(observedGameIds)) {
    return reject("INVALID_OBSERVED_INVENTORY");
  }

  const observedIds =
    observedGameIds.map(normalizeId);

  if (observedIds.some(id => !validId(id))) {
    return reject("INVALID_OBSERVED_GAME_ID");
  }

  if (
    new Set(observedIds).size !== observedIds.length
  ) {
    return reject("DUPLICATE_OBSERVED_GAME_ID");
  }

  const slateKey =
    `${league}:${slateDate}`;

  if (previousInventory === null) {

    if (observedIds.length === 0) {
      return reject("EMPTY_SLATE");
    }

    result.accepted = true;
    result.changed = true;
    result.reason = "INVENTORY_INITIALIZED";

    result.inventory = {
      version: 1,
      league,
      slateDate,
      slateKey,
      expectedGameIds: sortIds(observedIds)
    };

    result.addedGameIds = sortIds(observedIds);

    return result;

  }

  if (
    !previousInventory ||
    typeof previousInventory !== "object" ||
    Array.isArray(previousInventory) ||
    previousInventory.version !== 1 ||
    previousInventory.league !== league ||
    previousInventory.slateDate !== slateDate ||
    previousInventory.slateKey !== slateKey ||
    !Array.isArray(previousInventory.expectedGameIds)
  ) {
    return reject("INVALID_PREVIOUS_INVENTORY");
  }

  const previousIds =
    previousInventory.expectedGameIds;

  if (
    previousIds.length === 0 ||
    previousIds.some(
      id => typeof id !== "string" || !validId(id)
    ) ||
    new Set(previousIds).size !== previousIds.length
  ) {
    return reject("INVALID_PREVIOUS_GAME_IDS");
  }

  const previousSet = new Set(previousIds);
  const observedSet = new Set(observedIds);

  result.missingGameIds = sortIds(
    previousIds.filter(id => !observedSet.has(id))
  );

  result.addedGameIds = sortIds(
    observedIds.filter(id => !previousSet.has(id))
  );

  if (result.missingGameIds.length > 0) {
    return reject("MISSING_EXPECTED_GAMES");
  }

  result.accepted = true;
  result.changed = result.addedGameIds.length > 0;

  result.reason = result.changed
    ? "INVENTORY_EXPANDED"
    : "INVENTORY_UNCHANGED";

  result.inventory = {
    version: 1,
    league,
    slateDate,
    slateKey,
    expectedGameIds: sortIds(observedIds)
  };

  return result;

}

module.exports = {
  reconcileP36SlateInventory_
};
