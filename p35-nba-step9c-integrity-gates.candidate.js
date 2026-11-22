/**
 * Sportacular P35 NBA D4B — Step 9C isolated integrity gates.
 * Pure functions only. No SpreadsheetApp, UrlFetchApp, or production writes.
 * NOT a deployable finalizer. Approval and transactional promotion remain separate.
 */
function p35NBAKey_(value) {
  return String(value == null ? '' : value).trim().toLowerCase().replace(/\s+/g, ' ');
}
function p35NBAAssert_(condition, message) {
  if (!condition) throw new Error('P35 NBA integrity: ' + message);
}
function p35NBATeamName_(team) {
  return String(team && (team.full_name || team.fullName ||
    (team.city && team.name ? team.city + ' ' + team.name : '') || team.name) || '').trim();
}
/** Validate 30 authoritative franchises, not just an arbitrary 30-entry list. */
function p35NBATeamContract_(teams) {
  p35NBAAssert_(Array.isArray(teams) && teams.length === 30, 'exactly 30 teams required');
  const ids = new Set(), names = new Set();
  teams.forEach((team, i) => {
    const id = Number(team && team.id), name = p35NBAKey_(p35NBATeamName_(team));
    p35NBAAssert_(Number.isSafeInteger(id) && id > 0 && name, 'invalid team at index ' + i);
    p35NBAAssert_(!ids.has(id) && !names.has(name), 'duplicate team at index ' + i);
    ids.add(id); names.add(name);
  });
  return { names, count: 30 };
}
function p35NBAValidateFinalization_(teams, stagedRows, ledger, runId) {
  const contract = p35NBATeamContract_(teams);
  p35NBAAssert_(typeof runId === 'string' && /^[a-zA-Z0-9_-]{8,100}$/.test(runId), 'invalid run ID');
  p35NBAAssert_(Array.isArray(stagedRows) && stagedRows.length > 0, 'staging rows missing');
  p35NBAAssert_(Array.isArray(ledger) && ledger.length === 30, '30 ledger entries required');
  const ledgerNames = new Set(), rowsByTeam = new Map(), byGame = new Map(), unique = new Set();
  ledger.forEach((entry, i) => {
    const name = p35NBAKey_(entry && entry.team);
    p35NBAAssert_(contract.names.has(name) && !ledgerNames.has(name), 'ledger team mismatch at ' + i);
    p35NBAAssert_(entry.runId === runId && entry.status === 'STAGED_VERIFIED', 'unverified or stale ledger at ' + i);
    p35NBAAssert_(Number.isSafeInteger(entry.rowCount) && entry.rowCount > 0, 'invalid ledger row count at ' + i);
    p35NBAAssert_(typeof entry.fingerprint === 'string' && /^[a-f0-9]{64}$/.test(entry.fingerprint), 'missing fingerprint at ' + i);
    ledgerNames.add(name);
  });
  stagedRows.forEach((row, i) => {
    p35NBAAssert_(Array.isArray(row) && row.length === 10, 'invalid row width at ' + i);
    const game = String(row[1] == null ? '' : row[1]).trim();
    const team = p35NBAKey_(row[2]), opponent = p35NBAKey_(row[3]);
    p35NBAAssert_(String(row[0] || '').trim() && /^\d+$/.test(game) && Number(game) > 0, 'invalid date/game at ' + i);
    p35NBAAssert_(contract.names.has(team) && contract.names.has(opponent) && team !== opponent, 'invalid matchup at ' + i);
    const key = game + ':' + team;
    p35NBAAssert_(!unique.has(key), 'duplicate game/team ' + key);
    unique.add(key);
    for (let j = 4; j < 10; j++) p35NBAAssert_(typeof row[j] === 'number' && Number.isSafeInteger(row[j]) && row[j] >= 0, 'invalid stat at ' + i + ':' + j);
    rowsByTeam.set(team, (rowsByTeam.get(team) || 0) + 1);
    if (!byGame.has(game)) byGame.set(game, []);
    byGame.get(game).push({team, opponent, forPoints:row[4], againstPoints:row[5]});
  });
  ledger.forEach(entry => {
    const team = p35NBAKey_(entry.team);
    p35NBAAssert_((rowsByTeam.get(team) || 0) === entry.rowCount, 'ledger count mismatch for ' + team);
  });
  byGame.forEach((entries, game) => {
    p35NBAAssert_(entries.length === 2, 'game ' + game + ' must have two opposing rows');
    const [a,b] = entries;
    p35NBAAssert_(a.team === b.opponent && b.team === a.opponent, 'opponents disagree for game ' + game);
    p35NBAAssert_(a.forPoints === b.againstPoints && b.forPoints === a.againstPoints, 'scores disagree for game ' + game);
  });
  // Fingerprints must be recomputed and compared against staged row payloads
  // by the eventual Apps Script adapter before production promotion.
  return {passed:true, teamCount:contract.count, gameCount:byGame.size, rowCount:stagedRows.length,
    fingerprintVerification:'REQUIRED_EXTERNAL', productionPromotionApproved:false};
}
