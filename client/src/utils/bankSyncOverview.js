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

/** Build display-only sync health facts without changing any financial data. */
export function buildBankSyncOverview(connections = [], sources = []) {
  const sourcesById = new Map(sources.map((source) => [source.source, source]));
  const summary = {
    connectionCount: connections.length,
    readyCount: 0,
    issueCount: 0,
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
    const isIssue = connection.status === 'error' || connection.latest_job_status === 'failed';
    const isWorking = ['pending', 'running'].includes(connection.latest_job_status);

    if (isIssue) summary.issueCount += 1;
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
      isIssue,
      isWorking,
    });
  }

  return summary;
}

