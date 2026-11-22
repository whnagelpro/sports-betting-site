/**
 * P35 NBA D4B / Step 9B — ISOLATED DEVELOPMENT CANDIDATE.
 * Not installed in Apps Script. Never invoke in production before QA.
 * The worker and finalizer are intentionally external dependencies.
 * Cross-endpoint completeness is NOT independent verification.
 */
const P35_NBA_TEAM_LOG_HEADERS_ = [
  'Game Date','Game ID','Team','Opponent','Points For',
  'Points Allowed','Rebounds','Assists','Threes','Turnovers'
];

function p35ValidateNBATeamRows_(teamName, rows) {
  const normalized = v => String(v == null ? '' : v).trim().toLowerCase();
  if (!normalized(teamName) || !Array.isArray(rows) || rows.length === 0) {
    throw new Error('P35 NBA: team name and nonempty rows required');
  }
  const seen = new Set();
  for (const [index, row] of rows.entries()) {
    if (!Array.isArray(row) || row.length !== 10) {
      throw new Error('P35 NBA: invalid row width at ' + (index + 1));
    }
    if (!String(row[0] || '').trim() || !String(row[1] || '').trim() ||
        normalized(row[2]) !== normalized(teamName) ||
        !normalized(row[3]) || normalized(row[3]) === normalized(teamName)) {
      throw new Error('P35 NBA: invalid row identity at ' + (index + 1));
    }
    const key = String(row[1]).trim();
    if (seen.has(key)) throw new Error('P35 NBA: duplicate game ' + key);
    seen.add(key);
    for (let c = 4; c < 10; c++) {
      if (typeof row[c] !== 'number' || !Number.isFinite(row[c]) ||
          row[c] < 0 || !Number.isInteger(row[c])) {
        throw new Error('P35 NBA: invalid numeric value at row ' + (index + 1) + ', column ' + (c + 1));
      }
    }
  }
  return { valid: true, rowCount: rows.length, team: teamName };
}

/** Staging only; refuses to create tabs or touch production. */
function stageNBATeamGameLogRowsForTeam_(targetTeamName, rows) {
  p35ValidateNBATeamRows_(targetTeamName, rows);
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('NBA Team Game Logs Staging');
  if (!sheet) throw new Error('P35 NBA: staging sheet missing');
  const existing = sheet.getDataRange().getValues();
  const header = existing[0] || [];
  if (header.length !== 10 || header.some((h,i) => String(h).trim() !== P35_NBA_TEAM_LOG_HEADERS_[i])) {
    throw new Error('P35 NBA: staging headers mismatch');
  }
  const normalized = v => String(v == null ? '' : v).trim().toLowerCase();
  const keep = existing.slice(1).filter(r => normalized(r[2]) !== normalized(targetTeamName));
  const combined = keep.concat(rows);
  const seen = new Set();
  for (const r of combined) {
    if (!Array.isArray(r) || r.length !== 10) throw new Error('P35 NBA: invalid existing staging row');
    const key = String(r[1]).trim() + '|' + normalized(r[2]);
    if (!key || seen.has(key)) throw new Error('P35 NBA: duplicate staging key ' + key);
    seen.add(key);
  }
  // No write until all incoming and retained rows have been validated.
  // This is NOT transactional; sheet-write failure still needs retry/recovery QA.
  if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow()-1, 10).clearContent();
  if (combined.length) sheet.getRange(2, 1, combined.length, 10).setValues(combined);
  return { team: targetTeamName, teamRows: rows.length, stagedRows: combined.length };
}

/** Pure orchestration decision. No Google services. */
function p35PlanNBATeamStep_(state, teams) {
  if (!state || state.stage !== 'TEAM_GAME_LOGS') throw new Error('P35 NBA: wrong stage');
  if (!Array.isArray(teams) || teams.length !== 30) throw new Error('P35 NBA: expected 30 teams');
  const ids = teams.map(t => Number(t && t.id));
  if (ids.some(n => !Number.isInteger(n) || n <= 0) || new Set(ids).size !== 30) {
    throw new Error('P35 NBA: invalid team queue');
  }
  const index = state.teamTeamIndex;
  if (!Number.isInteger(index) || index < 0 || index > 30) {
    throw new Error('P35 NBA: missing/invalid team checkpoint; explicit migration required');
  }
  return index === 30
    ? { action: 'FINALIZE_REQUIRES_SEPARATE_APPROVAL' }
    : { action: 'STAGE_TEAM', index, teamId: ids[index], team: teams[index] };
}

/**
 * Proposed replacement for the existing TEAM_GAME_LOGS block, NOT executable
 * as-is in production. Needs integration with real dates, worker return
 * contract, run-specific staging ledger, and strict finalizer.
 *
 *   const plan = p35PlanNBATeamStep_(state, getNBADailyPlayerGameLogTeams_());
 *   if (plan.action === 'STAGE_TEAM') {
 *     // 1. call hardened worker, 2. validate data, 3. stage rows,
 *     // 4. verify staging, 5. checkpoint teamTeamIndex, 6. retry.
 *   } else {
 *     // Finalizer MUST validate all 30 teams and require explicit approval.
 *   }
 */
