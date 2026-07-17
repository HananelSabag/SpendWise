/**
 * computeBankBalance — the one place that turns /bank-sync/stats `sources` into a balance.
 *
 * Both the dashboard hero (ModernBalancePanel) and the financial-cycle page read the same
 * account balances, and they must never disagree: a finance app that shows two different
 * "how much is in the account" numbers on two screens is untrustworthy. So the reduction lives
 * here, pure and shared, and each screen only handles its own presentation.
 *
 * Rules (see ModernBalancePanel history): a credit company never holds a balance, only banks
 * do; a bank that does not report a balance (e.g. Yahav via israeli-bank-scrapers) is shown as
 * unavailable, never as a fake 0, and is excluded from the total.
 */

export function computeBankBalance(sources) {
  const list = Array.isArray(sources) ? sources : [];

  const lastSync = list.reduce((latest, src) => {
    const d = src.last_sync ? new Date(src.last_sync) : null;
    if (!d || Number.isNaN(d.getTime())) return latest;
    return !latest || d > latest ? d : latest;
  }, null);

  const bankSources = list.filter((src) => src.kind !== 'credit_card');
  const bankAccounts = bankSources.flatMap((src) =>
    (src.accounts || [])
      .filter((a) => a.enabled !== false)
      .map((a) => {
        const numericBalance = a.balance === null || a.balance === undefined
          ? null
          : Number(a.balance);
        return {
          source: src.source,
          accountNumber: a.account_number || null,
          // A malformed provider value must behave like an unavailable balance, never poison
          // the shared total with NaN.
          balance: Number.isFinite(numericBalance) ? numericBalance : null,
        };
      }),
  );

  const accountsWithBalance = bankAccounts.filter((a) => a.balance !== null);
  const totalRealBalance = accountsWithBalance.reduce((sum, a) => sum + a.balance, 0);

  return {
    sources: list,
    hasSynced: list.length > 0,
    bankSources,
    hasBankSource: bankSources.length > 0,
    bankAccounts,
    accountsWithBalance,
    hasRealBalance: accountsWithBalance.length > 0,
    // True when a real total exists but at least one account could not report one.
    someBalancesUnavailable: accountsWithBalance.length > 0 && accountsWithBalance.length < bankAccounts.length,
    totalRealBalance,
    multiAccount: bankAccounts.length > 1,
    lastSync,
  };
}

export default computeBankBalance;
