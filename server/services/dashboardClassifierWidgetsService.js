const db = require('../config/db');
const { institutionKind } = require('../config/institutions');
const {
  classifyTransaction,
  normalizeDescription,
  withoutSupersededPendingBankRows,
} = require('./financialClassificationService');
const { deriveDebitCardAccounts, dateKey } = require('./cardReconciliationService');

const SELECT_COLUMNS = `t.id, t.bank_source, t.bank_account_number, t.amount, t.type,
  t.description, t.notes, t.date, t.transaction_datetime, t.bank_processed_date,
  t.bank_status, t.bank_sync_id, t.raw_category, t.original_amount,
  t.original_currency, t.charged_currency, t.txn_kind, t.installment_number,
  t.installment_total, t.ledger_class, t.settlement_card_source,
  t.settlement_card_account`;

const round2 = (value) => Math.round(((Number(value) || 0) + Number.EPSILON) * 100) / 100;

function addMonthKey(month, offset) {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}

function buildWidgets(periodRows, historyRows, context) {
  const bankCosts = { feesInterest: 0, loanPayments: 0, cashWithdrawn: 0, cashWithdrawalCount: 0 };
  const sourceMap = new Map();

  for (const row of withoutSupersededPendingBankRows(periodRows)) {
    const classification = classifyTransaction(row, context);
    const amount = Math.abs(Number(row.amount) || 0);

    if (classification.calendarInclusion === 'include') {
      const source = row.bank_source;
      if (source) {
        const current = sourceMap.get(source) || { bank_source: source, income: 0, expenses: 0, count: 0 };
        if (classification.direction === 'income') current.income += amount;
        if (classification.direction === 'spend') current.expenses += amount;
        if (classification.direction === 'refund') current.expenses -= amount;
        current.count += 1;
        sourceMap.set(source, current);
      }
    }

    if (classification.calendarInclusion !== 'include' || classification.direction !== 'spend') continue;
    if (classification.loanRepayment) bankCosts.loanPayments += amount;
    if (classification.reason === 'bank fee / interest') bankCosts.feesInterest += amount;
    if (classification.reason === 'ATM / cash withdrawal — bank-direct spending') {
      bankCosts.cashWithdrawn += amount;
      bankCosts.cashWithdrawalCount += 1;
    }
  }

  for (const key of ['feesInterest', 'loanPayments', 'cashWithdrawn']) {
    bankCosts[key] = round2(bankCosts[key]);
  }

  const recurring = new Map();
  for (const row of withoutSupersededPendingBankRows(historyRows)) {
    if (row.type !== 'expense') continue;
    const classification = classifyTransaction(row, context);
    if (classification.calendarInclusion !== 'include' || classification.direction !== 'spend') continue;
    // Generic bank events are obligations/categories, not merchant identities.
    if (classification.settlementRole !== 'none' || classification.loanRepayment
      || classification.reason === 'ATM / cash withdrawal — bank-direct spending'
      || classification.reason === 'bank fee / interest') continue;
    const normalized = normalizeDescription(row.description);
    if (normalized.length <= 2) continue;
    const item = recurring.get(normalized) || {
      description: String(row.description || '').trim(),
      category: String(row.raw_category || '').trim() || null,
      bank_sources: new Set(),
      amounts: [],
      monthlyAmounts: new Map(),
      months: new Set(),
      last_seen: null,
    };
    const amount = Math.abs(Number(row.amount) || 0);
    item.amounts.push(amount);
    if (row.bank_source) item.bank_sources.add(row.bank_source);
    const key = dateKey(row.date);
    if (key) {
      const month = key.slice(0, 7);
      item.months.add(month);
      item.monthlyAmounts.set(month, (item.monthlyAmounts.get(month) || 0) + amount);
      if (!item.last_seen || key > item.last_seen) item.last_seen = key;
    }
    recurring.set(normalized, item);
  }

  const recurringPatterns = [...recurring.values()]
    .filter((item) => item.months.size >= 2)
    .map((item) => {
      const monthlyAmounts = [...item.monthlyAmounts.values()];
      const averageMonthly = monthlyAmounts.reduce((sum, amount) => sum + amount, 0) / monthlyAmounts.length;
      const range = Math.max(...monthlyAmounts) - Math.min(...monthlyAmounts);
      const sources = [...item.bank_sources].sort();
      return {
        description: item.description,
        category: item.category,
        bank_source: sources.length === 1 ? sources[0] : null,
        bank_sources: sources,
        occurrences: item.amounts.length,
        active_months: item.months.size,
        average_amount: round2(averageMonthly),
        amount_stability: range <= Math.max(5, averageMonthly * 0.2) ? 'stable' : 'variable',
        last_seen: item.last_seen,
      };
    })
    .sort((a, b) => b.active_months - a.active_months
      || b.occurrences - a.occurrences
      || b.average_amount - a.average_amount)
    .slice(0, 12);

  const sourceActivity = [...sourceMap.values()].map((item) => ({
    ...item,
    income: round2(item.income),
    expenses: round2(Math.max(0, item.expenses)),
  }));

  return { bankCosts, recurringPatterns, sourceActivity };
}

async function buildDashboardClassifierWidgets(userId, periodStart, periodEnd) {
  const [rowsResult, signaturesResult, accountsResult, overridesResult] = await Promise.all([
    db.query(
      `SELECT ${SELECT_COLUMNS}, COALESCE(ba.enabled, true) AS account_enabled
         FROM transactions t
         LEFT JOIN bank_accounts ba
           ON ba.user_id=t.user_id AND ba.bank_source=t.bank_source
          AND ba.account_number=COALESCE(t.bank_account_number, '')
        WHERE t.user_id=$1 AND t.deleted_at IS NULL
          AND t.date >= CURRENT_DATE - INTERVAL '7 months'
          AND t.date < CURRENT_DATE + INTERVAL '1 day'`,
      [userId],
    ),
    db.query('SELECT * FROM salary_signatures WHERE user_id=$1 AND active=true', [userId]),
    db.query('SELECT bank_source, account_number, enabled FROM bank_accounts WHERE user_id=$1', [userId]),
    db.query('SELECT * FROM transaction_month_overrides WHERE user_id=$1', [userId]),
  ]);
  const enabledRows = rowsResult.rows.filter((row) => row.bank_source == null || row.account_enabled !== false);
  const connectedCardSources = [...new Set(accountsResult.rows
    .filter((account) => account.enabled && institutionKind(account.bank_source) === 'credit_card')
    .map((account) => account.bank_source))];
  const context = {
    salarySignatures: signaturesResult.rows,
    debitCardAccounts: deriveDebitCardAccounts(enabledRows),
    connectedCardSources,
    transactionOverrides: overridesResult.rows,
  };
  const periodMonth = periodStart.slice(0, 7);
  const periodRows = enabledRows.filter((row) => {
    const key = dateKey(row.date);
    if (!key) return false;
    const classification = classifyTransaction(row, context);
    const economicMonth = classification.economicMonth || (classification.salary
      ? addMonthKey(key.slice(0, 7), Number.isInteger(classification.monthOffset)
        ? classification.monthOffset : -1)
      : key.slice(0, 7));
    return economicMonth === periodMonth;
  });
  return buildWidgets(periodRows, enabledRows, context);
}

module.exports = { buildWidgets, buildDashboardClassifierWidgets };
