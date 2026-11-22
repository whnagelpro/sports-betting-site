"use strict";

const {
  createP36SlateRegistry_,
  validateP36SlateRegistry_,
  getP36PendingSlates_
} = require("./slate-registry.cjs");

function getP36RegistryPropertyKey_(league) {

  if (!["NBA","NHL","MLB","NFL"].includes(league)) {
    throw new Error("INVALID_LEAGUE");
  }

  return `P36_${league}_SLATE_REGISTRY_V1`;

}

function validateP36StorageRegistry_(league, registry) {

  validateP36SlateRegistry_(registry);

  if (registry.league !== league) {
    throw new Error("REGISTRY_LEAGUE_MISMATCH");
  }

  return true;

}

function loadP36SlateRegistry_(league, properties) {

  const key = getP36RegistryPropertyKey_(league);

  const raw = properties.getProperty(key);

  if (raw === null) {

    return {
      key,
      exists: false,
      raw: null,
      registry: createP36SlateRegistry_(league)
    };

  }

  if (typeof raw !== "string" || !raw.trim()) {
    throw new Error("INVALID_REGISTRY_PROPERTY");
  }

  let registry;

  try {

    registry = JSON.parse(raw);

  } catch (error) {

    throw new Error("REGISTRY_JSON_CORRUPTED");

  }

  validateP36StorageRegistry_(league, registry);

  return {
    key,
    exists: true,
    raw,
    registry
  };

}

function saveP36SlateRegistry_(
  league,
  properties,
  registry,
  expectedRaw,
  getByteLength
) {

  const key = getP36RegistryPropertyKey_(league);

  validateP36StorageRegistry_(league, registry);

  if (
    expectedRaw !== null &&
    typeof expectedRaw !== "string"
  ) {
    throw new Error("INVALID_EXPECTED_PROPERTY");
  }

  if (typeof getByteLength !== "function") {
    throw new Error("INVALID_BYTE_LENGTH_FUNCTION");
  }

  const raw = JSON.stringify(registry);

  const bytes = getByteLength(raw);

  if (!Number.isSafeInteger(bytes) || bytes < 1) {
    throw new Error("INVALID_REGISTRY_BYTE_LENGTH");
  }

  // Conservative limit below the Script Properties
  // per-value storage limit.

  if (bytes > 8000) {
    throw new Error("REGISTRY_STORAGE_LIMIT_EXCEEDED");
  }

  const currentRaw = properties.getProperty(key);

  if (currentRaw !== expectedRaw) {
    throw new Error("REGISTRY_CONCURRENT_MODIFICATION");
  }

  if (currentRaw !== null) {
    loadP36SlateRegistry_(league, properties);
  }

  if (currentRaw === raw) {

    return {
      saved: false,
      reason: "REGISTRY_UNCHANGED",
      bytes,
      raw
    };

  }

  properties.setProperty(key, raw);

  if (properties.getProperty(key) !== raw) {
    throw new Error("REGISTRY_WRITE_VERIFICATION_FAILED");
  }

  return {
    saved: true,
    reason: "REGISTRY_SAVED",
    bytes,
    raw
  };

}

function getP36SlateRefreshDates_(registry, today) {

  validateP36SlateRegistry_(registry);

  if (
    typeof today !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(today) ||
    !Number.isFinite(Date.parse(today)) ||
    new Date(today).toISOString().slice(0,10) !== today
  ) {
    throw new Error("INVALID_TODAY_DATE");
  }

  const dates = new Set([today]);

  for (const date of getP36PendingSlates_(registry)) {

    if (date <= today) {
      dates.add(date);
    }

  }

  return [...dates].sort();

}

module.exports = {
  getP36RegistryPropertyKey_,
  loadP36SlateRegistry_,
  saveP36SlateRegistry_,
  getP36SlateRefreshDates_
};
