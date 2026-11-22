"use strict";

const {
  isValidP36Date_
} = require("./slate-date-engine.cjs");

const {
  validateP36SlateRegistry_,
  observeP36Slate_
} = require("./slate-registry.cjs");

function validateP36RetentionBoundary_(registry) {

  validateP36SlateRegistry_(registry);

  const boundary =
    registry.retiredThrough ?? null;

  if (
    boundary !== null &&
    !isValidP36Date_(boundary)
  ) {
    throw new Error("INVALID_RETIREMENT_BOUNDARY");
  }

  return boundary;

}

function compactP36SlateRegistry_(
  registry,
  today,
  retentionDays = 14
) {

  const previousBoundary =
    validateP36RetentionBoundary_(registry);

  if (!isValidP36Date_(today)) {
    throw new Error("INVALID_TODAY_DATE");
  }

  if (
    !Number.isSafeInteger(retentionDays) ||
    retentionDays < 1 ||
    retentionDays > 365
  ) {
    throw new Error("INVALID_RETENTION_DAYS");
  }

  if (
    previousBoundary !== null &&
    previousBoundary >= today
  ) {
    throw new Error("INVALID_RETIREMENT_CHRONOLOGY");
  }

  const cutoff = new Date(`${today}T00:00:00Z`);

  cutoff.setUTCDate(
    cutoff.getUTCDate() - retentionDays - 1
  );

  const eligibleThrough =
    cutoff.toISOString().slice(0,10);

  const boundary =
    previousBoundary &&
    previousBoundary > eligibleThrough
      ? previousBoundary
      : eligibleThrough;

  const next =
    JSON.parse(JSON.stringify(registry));

  const removedSlateKeys = [];

  for (const [key,slate] of Object.entries(next.slates)) {

    if (
      slate.state === "PROCESSED" &&
      slate.slateDate <= boundary
    ) {

      delete next.slates[key];
      removedSlateKeys.push(key);

    }

  }

  next.retiredThrough = boundary;

  validateP36RetentionBoundary_(next);

  return {
    changed:
      JSON.stringify(next) !== JSON.stringify(registry),
    registry: next,
    removedSlateKeys: removedSlateKeys.sort(),
    retiredThrough: boundary
  };

}

function observeP36RetainedSlate_(
  registry,
  slateDate,
  observedGameIds
) {

  const boundary =
    validateP36RetentionBoundary_(registry);

  if (!isValidP36Date_(slateDate)) {

    return {
      accepted:false,
      reason:"INVALID_SLATE_DATE",
      registry
    };

  }

  const key =
    `${registry.league}:${slateDate}`;

  if (
    !Object.prototype.hasOwnProperty.call(
      registry.slates,key
    ) &&
    boundary !== null &&
    slateDate <= boundary
  ) {

    return {
      accepted:false,
      reason:"HISTORICAL_SLATE_RETIRED",
      registry
    };

  }

  return observeP36Slate_(
    registry,
    slateDate,
    observedGameIds
  );

}

module.exports = {
  validateP36RetentionBoundary_,
  compactP36SlateRegistry_,
  observeP36RetainedSlate_
};
