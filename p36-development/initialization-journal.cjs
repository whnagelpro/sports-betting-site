"use strict";

const {
  isValidP36Date_
} = require("./slate-date-engine.cjs");

function getP36JournalKey_(league) {

  if (!["NBA","NHL","MLB","NFL"].includes(league)) {
    throw new Error("INVALID_LEAGUE");
  }

  return `P36_${league}_INITIALIZATION_JOURNAL_V1`;

}

function validateP36Journal_(league,journal) {

  getP36JournalKey_(league);

  if (
    !journal ||
    typeof journal !== "object" ||
    Array.isArray(journal) ||
    journal.version !== 1 ||
    journal.league !== league ||
    !isValidP36Date_(journal.slateDate) ||
    journal.slateKey !== `${league}:${journal.slateDate}` ||
    typeof journal.runId !== "string" ||
    !journal.runId.trim()
  ) {
    throw new Error("INVALID_JOURNAL");
  }

  return true;

}

function loadP36Journal_(league,properties) {

  const key = getP36JournalKey_(league);
  const raw = properties.getProperty(key);

  if (raw === null) {

    return {
      key,
      raw:null,
      journal:null
    };

  }

  let journal;

  try {

    journal = JSON.parse(raw);

  } catch (error) {

    throw new Error("JOURNAL_JSON_CORRUPTED");

  }

  validateP36Journal_(league,journal);

  return {key,raw,journal};

}

function saveP36Journal_(
  league,
  properties,
  journal,
  lock
) {

  if (!lock || lock.hasLock() !== true) {
    throw new Error("SCRIPT_LOCK_REQUIRED");
  }

  validateP36Journal_(league,journal);

  const existing =
    loadP36Journal_(league,properties);

  const raw = JSON.stringify(journal);

  if (existing.raw !== null) {

    if (existing.raw === raw) {

      return {
        saved:false,
        reason:"JOURNAL_UNCHANGED"
      };

    }

    throw new Error("EXISTING_JOURNAL_CONFLICT");

  }

  properties.setProperty(existing.key,raw);

  if (properties.getProperty(existing.key) !== raw) {

    throw new Error("JOURNAL_WRITE_VERIFICATION_FAILED");

  }

  return {
    saved:true,
    reason:"JOURNAL_SAVED"
  };

}

function clearP36Journal_(
  league,
  properties,
  expectedRaw,
  registry,
  pipelineState,
  lock
) {

  if (!lock || lock.hasLock() !== true) {
    throw new Error("SCRIPT_LOCK_REQUIRED");
  }

  const existing =
    loadP36Journal_(league,properties);

  if (
    typeof expectedRaw !== "string" ||
    existing.raw !== expectedRaw
  ) {
    throw new Error("JOURNAL_CONCURRENT_MODIFICATION");
  }

  const {
    validateP36SlateRegistry_
  } = require("./slate-registry.cjs");

  validateP36SlateRegistry_(registry);

  const journal = existing.journal;

  const slate =
    registry.slates[journal.slateKey];

  if (
    registry.league !== league ||
    !slate ||
    slate.state !== "PROCESSING" ||
    slate.runId !== journal.runId ||
    !pipelineState ||
    pipelineState.p36RunId !== journal.runId ||
    pipelineState.p36SlateKey !== journal.slateKey ||
    typeof pipelineState.completed !== "boolean" ||
    typeof pipelineState.stage !== "string" ||
    !pipelineState.stage.trim() ||
    pipelineState.completed !==
      (pipelineState.stage === "COMPLETE")
  ) {

    throw new Error("INITIALIZATION_NOT_COMMITTED");

  }

  properties.deleteProperty(existing.key);

  if (properties.getProperty(existing.key) !== null) {

    throw new Error("JOURNAL_DELETE_VERIFICATION_FAILED");

  }

  return {
    cleared:true,
    reason:"JOURNAL_CLEARED"
  };

}

module.exports = {
  getP36JournalKey_,
  validateP36Journal_,
  loadP36Journal_,
  saveP36Journal_,
  clearP36Journal_
};
