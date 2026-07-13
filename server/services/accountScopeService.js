/**
 * Keep user-disabled synchronized accounts out of derived financial models.
 * Missing metadata remains included: only an exact account explicitly marked
 * `enabled=false` is excluded.
 */

function accountKey(source, account) {
  return `${String(source || '')}:${String(account || '')}`;
}

function disabledAccountKeys(accounts = []) {
  return new Set(accounts
    .filter((account) => account?.enabled === false)
    .map((account) => accountKey(account.bank_source, account.account_number)));
}

function filterDisabledAccountRows(rows = [], accounts = []) {
  const disabled = disabledAccountKeys(accounts);
  if (!disabled.size) return rows;
  return rows.filter((row) => row?.bank_source == null
    || !disabled.has(accountKey(row.bank_source, row.bank_account_number)));
}

module.exports = { accountKey, disabledAccountKeys, filterDisabledAccountRows };
