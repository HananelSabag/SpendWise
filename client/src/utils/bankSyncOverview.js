const latestDate = (current, candidate) => {
  if (!candidate) return current;
  if (!current) return candidate;
  return new Date(candidate) > new Date(current) ? candidate : current;
};

const syncResultCount = (result, keys, fallback = 0) => {
  for (const key of keys) {
    const value = Number(result?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
};

// Mirrors STALLED_HOURS in server/services/bankConnectionHealth.js. Only used
// as a fallback for a payload that predates `sync_health` — the server stays
// the source of truth.
const STALLED_HOURS = 26;

// The user must do something before this connection can ever sync again.
export const BLOCKING_HEALTH = new Set(['error', 'needs_credentials']);
// Nothing is arriving, and it is not the user's fault: the agent is gone or
// nobody is picking the jobs up. This is the state that used to render as a
// cheerful permanent "syncing now" spinner.
export const STALLED_HEALTH = new Set(['agent_offline', 'waiting_for_agent', 'stalled']);
const WORKING_HEALTH = new Set(['syncing', 'queued']);

/**
 * Health of one connection, tolerating an older API payload (a cached response
 * from before `sync_health` existed). Even then a long-dead last sync must not
 * read as healthy — that lie is the whole reason this exists.
 */
export function connectionHealth(connection = {}, now = Date.now()) {
  if (connection.sync_health) return connection.sync_health;
  if (connection.status === 'error') return 'error';
  if (connection.status === 'paused') return 'paused';
  if (connection.latest_job_status === 'running') return 'syncing';
  // A never-synced connection is measured from when it was created, so a bank
  // linked a minute ago is "queued", not "stalled".
  const reference = connection.last_sync_at || connection.created_at;
  const referenceMs = reference ? new Date(reference).getTime() : null;
  if (referenceMs && (now - referenceMs) / 3_600_000 >= STALLED_HOURS) return 'stalled';
  return connection.latest_job_status === 'pending' ? 'queued' : 'ok';
}

/** Build display-only sync health facts without changing any financial data. */
export function buildBankSyncOverview(connections = [], sources = [], now = Date.now()) {
  const sourcesById = new Map(sources.map((source) => [source.source, source]));
  const summary = {
    connectionCount: connections.length,
    readyCount: 0,
    issueCount: 0,
    stalledCount: 0,
    workingCount: 0,
    newCount: 0,
    processedCount: 0,
    accountCount: 0,
    enabledAccountCount: 0,
    disabledAccountCount: 0,
    lastSync: null,
    institutions: [],
  };

  for (const connection of connections) {
    const result = connection.latest_job_result || {};
    const source = sourcesById.get(connection.bank_source) || {};
    const accounts = Array.isArray(source.accounts) ? source.accounts : [];
    const enabledAccounts = accounts.filter((account) => account.enabled !== false).length;
    const disabledAccounts = accounts.length - enabledAccounts;
    const added = syncResultCount(result, ['inserted', 'new_transactions', 'imported']);
    const processed = syncResultCount(
      result,
      ['processed', 'transactions', 'total'],
      added + syncResultCount(result, ['skipped']),
    );
    const health = connectionHealth(connection, now);
    const isIssue = BLOCKING_HEALTH.has(health);
    const isStalled = STALLED_HEALTH.has(health);
    const isWorking = WORKING_HEALTH.has(health);

    if (isIssue) summary.issueCount += 1;
    else if (isStalled) summary.stalledCount += 1;
    else if (isWorking) summary.workingCount += 1;
    else summary.readyCount += 1;

    summary.newCount += added;
    summary.processedCount += processed;
    summary.accountCount += accounts.length;
    summary.enabledAccountCount += enabledAccounts;
    summary.disabledAccountCount += disabledAccounts;
    summary.lastSync = latestDate(summary.lastSync, connection.last_sync_at || source.last_sync);
    summary.institutions.push({
      connection,
      source,
      accountCount: accounts.length,
      enabledAccountCount: enabledAccounts,
      disabledAccountCount: disabledAccounts,
      added,
      processed,
      health,
      isIssue,
      isStalled,
      isWorking,
    });
  }

  return summary;
}
