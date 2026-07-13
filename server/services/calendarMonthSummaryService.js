/**
 * Calendar-month aggregation for the Dashboard.
 *
 * Raw rows remain immutable. For connected credit cards, itemized activity is
 * counted on its factual purchase date and the summarized bank settlement is
 * excluded. For unconnected cards, the bank settlement remains the fallback
 * expense because no itemized provider activity is available.
 */

const db = require('../config/db');
const { INSTITUTIONS, institutionKind } = require('../config/institutions');
const { getCalendarPeriod, TZ } = require('../utils/calendarPeriod');
const { deriveDebitCardAccounts, dateKey, dayDistance } = require('./cardReconciliationService');
const {
  classifyTransaction,
  withoutSupersededPendingBankRows,
} = require('./financialClassificationService');

const CARD_SOURCES = Object.entries(INSTITUTIONS)
  .filter(([, institution]) => institution.kind === 'credit_card')
  .map(([source]) => source);

const SELECT_COLUMNS = `id, bank_source, bank_account_number, amount, type,
  description, notes, date, transaction_datetime, bank_processed_date,
  bank_status, bank_sync_id, raw_category, ledger_class,
  settlement_card_source, settlement_card_account,
  txn_kind, installment_number, installment_total`;

const round2 = (value) => Math.round(((Number(value) || 0) + Number.EPSILON) * 100) / 100;
const amount = (row) => Math.abs(Number(row.amount) || 0);
const cardKey = (source, account) => `${source}:${String(account || '')}`;

function emptyActivity() {
  return { income: 0, incomeCount: 0, expenses: 0, expenseCount: 0, pendingIncome: 0, pendingExpenses: 0, pendingCount: 0 };
}

function addActivity(activity, row) {
  const value = amount(row);
  const pending = row.bank_status === 'pending';
  if (row.type === 'income') {
    activity.income += value;
    activity.incomeCount += 1;
    if (pending) activity.pendingIncome += value;
  } else if (row.type === 'expense') {
    activity.expenses += value;
    activity.expenseCount += 1;
    if (pending) activity.pendingExpenses += value;
  } else {
    return false;
  }
  if (pending) activity.pendingCount += 1;
  return true;
}

function finishActivity(activity, expenseAdjustment = 0, pendingExpenseAdjustment = 0) {
  const income = round2(activity.income);
  const rawExpenses = round2(activity.expenses);
  const expenses = round2(Math.max(0, rawExpenses - expenseAdjustment));
  return {
    income,
    incomeCount: activity.incomeCount,
    expenses,
    rawExpenses,
    expenseCount: activity.expenseCount,
    net: round2(income - expenses),
    pendingIncome: round2(activity.pendingIncome),
    pendingExpenses: round2(Math.max(0, activity.pendingExpenses - pendingExpenseAdjustment)),
    pendingCount: activity.pendingCount,
  };
}

function resolveSettlementAccount(classification, connectedBySource) {
  const source = classification.reconciliation?.cardSource;
  if (!source) return { source: null, account: null };
  const connected = connectedBySource.get(source) || [];
  const explicit = String(classification.reconciliation?.cardAccount || '');
  if (explicit && connected.includes(explicit)) return { source, account: explicit };
  if (connected.length === 1) return { source, account: connected[0] };
  return { source, account: explicit || null };
}

function matchConnectedSettlementReversals(rows, settlementGroups, supersededSettlementIds) {
  const settlements = [...settlementGroups.values()]
    .filter((group) => group.connected)
    .flatMap((group) => group.activeRows || []);
  const usedSettlementIds = new Set();
  const matches = [];

  const incomes = (rows || [])
    .filter((row) => !supersededSettlementIds.has(row.id)
      && institutionKind(row.bank_source) === 'bank'
      && row.type === 'income')
    .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')) || Number(a.id) - Number(b.id));

  for (const incomeRow of incomes) {
    const match = settlements
      .filter((settlement) => !usedSettlementIds.has(settlement.id)
        && settlement.bank_source === incomeRow.bank_source
        && String(settlement.bank_account_number || '') === String(incomeRow.bank_account_number || '')
        && Math.abs(amount(settlement) - amount(incomeRow)) < 0.01
        && dayDistance(settlement.date, incomeRow.date) <= 7)
      .sort((a, b) => dayDistance(a.date, incomeRow.date) - dayDistance(b.date, incomeRow.date))[0];

    if (!match) continue;
    usedSettlementIds.add(match.id);
    matches.push({
      incomeTransactionId: incomeRow.id,
      debitTransactionId: match.id,
      amount: round2(amount(incomeRow)),
      incomeDate: dateKey(incomeRow.date),
      debitDate: dateKey(match.date),
      matchingBasis: 'same_bank_account_exact_amount_within_7_days',
    });
  }

  return matches;
}

function buildCalendarMonthSummaryFromRows(rows, accounts, debitScopeRows, period) {
  const connectedBySource = new Map();
  for (const account of accounts || []) {
    if (!account.enabled || institutionKind(account.bank_source) !== 'credit_card') continue;
    const list = connectedBySource.get(account.bank_source) || [];
    list.push(String(account.account_number || ''));
    connectedBySource.set(account.bank_source, list);
  }
  const connectedCardKeys = new Set(
    [...connectedBySource].flatMap(([source, accountNumbers]) => accountNumbers.map((account) => cardKey(source, account))),
  );
  const debitAccounts = deriveDebitCardAccounts((debitScopeRows?.length ? debitScopeRows : rows) || []);
  const debitKeys = new Set(debitAccounts.map((item) => cardKey(item.source, item.account)));
  const context = { debitCardAccounts: debitAccounts };
  const scopedRows = withoutSupersededPendingBankRows(rows || []).filter((row) => {
    const key = dateKey(row.date);
    return key && key >= period.start && key < period.end;
  });

  // One bank statement may leave a stale pending row beside its completed row.
  // Prefer completed within the same provider/card/billing-day lifecycle.
  const settlementGroups = new Map();
  for (const row of scopedRows) {
    if (institutionKind(row.bank_source) !== 'bank' || row.type !== 'expense') continue;
    const classification = classifyTransaction(row, context);
    if (classification.settlementRole !== 'card_settlement') continue;
    const resolved = resolveSettlementAccount(classification, connectedBySource);
    const billingDate = dateKey(row.date);
    const key = `${resolved.source || 'unresolved'}:${resolved.account || 'unresolved'}:${billingDate}`;
    const group = settlementGroups.get(key) || { ...resolved, billingDate, rows: [] };
    group.rows.push(row);
    settlementGroups.set(key, group);
  }

  const supersededSettlementIds = new Set();
  for (const group of settlementGroups.values()) {
    const hasCompleted = group.rows.some((row) => row.bank_status !== 'pending');
    group.activeRows = hasCompleted ? group.rows.filter((row) => row.bank_status !== 'pending') : group.rows;
    group.connected = Boolean(group.source && group.account && connectedCardKeys.has(cardKey(group.source, group.account)));
    if (hasCompleted) {
      group.rows.filter((row) => row.bank_status === 'pending').forEach((row) => supersededSettlementIds.add(row.id));
    }
  }

  const connectedSettlementIds = new Set(
    [...settlementGroups.values()]
      .filter((group) => group.connected)
      .flatMap((group) => group.activeRows || [])
      .map((row) => row.id),
  );
  const matchedReversals = matchConnectedSettlementReversals(scopedRows, settlementGroups, supersededSettlementIds);
  const matchedReversalIds = new Set(matchedReversals.map((match) => match.incomeTransactionId));

  const bank = emptyActivity();
  const cards = emptyActivity();
  const other = emptyActivity();
  const cardActivities = new Map();
  const countedRows = [];
  let debitEnrichmentExcluded = 0;
  let debitEnrichmentExcludedCount = 0;

  for (const row of scopedRows) {
    if (supersededSettlementIds.has(row.id)) continue;
    // Connected-card settlements and their exact bank reversals are statement
    // evidence, not new calendar activity. The itemized card rows are the facts.
    if (connectedSettlementIds.has(row.id) || matchedReversalIds.has(row.id)) continue;
    const kind = institutionKind(row.bank_source);
    if (kind === 'credit_card' && debitKeys.has(cardKey(row.bank_source, row.bank_account_number))) {
      debitEnrichmentExcluded += amount(row);
      debitEnrichmentExcludedCount += 1;
      continue;
    }
    const target = kind === 'bank' ? bank : kind === 'credit_card' ? cards : other;
    if (!addActivity(target, row)) continue;
    countedRows.push(row);
    if (kind === 'credit_card') {
      const key = cardKey(row.bank_source, row.bank_account_number);
      const activity = cardActivities.get(key) || {
        bankSource: row.bank_source,
        accountNumber: String(row.bank_account_number || ''),
        ...emptyActivity(),
      };
      addActivity(activity, row);
      cardActivities.set(key, activity);
    }
  }

  const adjustments = [];
  let totalAdjustment = 0;
  for (const group of settlementGroups.values()) {
    const bankDebit = round2(group.activeRows.reduce((sum, row) => sum + amount(row), 0));
    const connected = group.connected;
    const itemized = connected ? scopedRows.filter((row) => (
      row.bank_source === group.source
      && String(row.bank_account_number || '') === String(group.account)
      && !debitKeys.has(cardKey(row.bank_source, row.bank_account_number))
      && dateKey(row.bank_processed_date) === group.billingDate
      && (row.type === 'income' || row.type === 'expense')
    )) : [];
    const itemizedExpenses = round2(itemized.filter((row) => row.type === 'expense').reduce((sum, row) => sum + amount(row), 0));
    const itemizedRefunds = round2(itemized.filter((row) => row.type === 'income').reduce((sum, row) => sum + amount(row), 0));
    const representedNet = round2(Math.max(0, itemizedExpenses - itemizedRefunds));
    const adjustment = connected ? bankDebit : 0;
    const remainingBankDebit = round2(Math.max(0, bankDebit - adjustment));
    const isPendingDebit = group.activeRows.length > 0 && group.activeRows.every((row) => row.bank_status === 'pending');
    totalAdjustment += adjustment;
    adjustments.push({
      cardSource: group.source,
      accountNumber: group.account,
      billingDate: group.billingDate,
      connected: Boolean(connected),
      bankDebit,
      bankStatus: isPendingDebit ? 'pending' : 'completed',
      itemizedExpenses,
      itemizedRefunds,
      itemizedCount: itemized.length,
      alreadyRepresented: representedNet,
      adjustment,
      remainingBankDebit,
      matchingBasis: connected ? 'connected_card_settlement_excluded' : 'unconnected_or_unresolved_card',
    });
  }
  totalAdjustment = round2(totalAdjustment);

  const bankFinished = finishActivity(bank);
  const cardsFinished = finishActivity(cards);
  const otherFinished = finishActivity(other);
  const income = round2(bankFinished.income + cardsFinished.income + otherFinished.income);
  const expenses = round2(bankFinished.expenses + cardsFinished.expenses + otherFinished.expenses);

  const matchedBankReversalAmount = round2(matchedReversals.reduce((sum, item) => sum + item.amount, 0));

  return {
    period: {
      month: period.month,
      start: period.start,
      end: period.end,
      offset: period.offset,
      isCurrent: period.isCurrent,
      timezone: TZ,
    },
    totals: {
      income,
      expenses,
      net: round2(income - expenses),
      transactionCount: countedRows.length,
      rawExpensesBeforeAdjustments: round2(expenses + totalAdjustment),
      rawIncomeBeforeAdjustments: round2(income + matchedBankReversalAmount),
      creditCardDebitAdjustments: totalAdjustment,
      bankReversalAdjustments: matchedBankReversalAmount,
    },
    breakdown: {
      bankTransactions: bankFinished,
      creditCardTransactions: cardsFinished,
      creditCards: [...cardActivities.values()].map((activity) => {
        const finished = finishActivity(activity);
        return {
          bankSource: activity.bankSource,
          accountNumber: activity.accountNumber,
          charges: finished.expenses,
          chargeCount: finished.expenseCount,
          refunds: finished.income,
          refundCount: finished.incomeCount,
          netCharges: round2(Math.max(0, finished.expenses - finished.income)),
          pendingCount: finished.pendingCount,
        };
      }).sort((a, b) => cardKey(a.bankSource, a.accountNumber).localeCompare(cardKey(b.bankSource, b.accountNumber))),
      otherTransactions: otherFinished,
      refundsAndReversals: {
        cardRefunds: cardsFinished.income,
        matchedBankReversals: matchedBankReversalAmount,
        matchedBankReversalsExcludedFromIncome: matchedBankReversalAmount,
        matches: matchedReversals,
      },
      debitCardEnrichmentExcluded: {
        amount: round2(debitEnrichmentExcluded),
        count: debitEnrichmentExcludedCount,
      },
    },
    pending: {
      income: round2(bankFinished.pendingIncome + cardsFinished.pendingIncome + otherFinished.pendingIncome),
      expenses: round2(bankFinished.pendingExpenses + cardsFinished.pendingExpenses + otherFinished.pendingExpenses),
      count: bankFinished.pendingCount + cardsFinished.pendingCount + otherFinished.pendingCount,
      includedInTotals: true,
    },
    reconciliation: {
      totalAdjustment,
      adjustments,
      supersededPendingSettlementCount: supersededSettlementIds.size,
      rule: 'connected_card_settlements_excluded_unconnected_settlements_counted',
    },
    model: 'purchase_date_calendar_with_connected_settlements_excluded_v3',
  };
}

async function getCalendarMonthSummary(userId, offset = 0) {
  const period = getCalendarPeriod(offset);
  const [transactions, accounts, debitScope] = await Promise.all([
    db.query(
      `SELECT ${SELECT_COLUMNS}
         FROM transactions t
        WHERE t.user_id = $1 AND t.deleted_at IS NULL
          AND t.date >= $2 AND t.date < $3
        ORDER BY t.date, t.id`,
      [userId, period.start, period.end],
      'calendar_month_rows',
    ),
    db.query(
      `SELECT bank_source, account_number, enabled
         FROM bank_accounts
        WHERE user_id = $1 AND bank_source = ANY($2::text[])`,
      [userId, CARD_SOURCES],
      'calendar_month_connected_cards',
    ),
    db.query(
      `SELECT bank_source, bank_account_number, type, description, notes
         FROM transactions
        WHERE user_id = $1 AND deleted_at IS NULL
          AND description LIKE '%דביט%'`,
      [userId],
      'calendar_month_debit_card_scope',
    ),
  ]);
  const debitIdentityRows = [
    ...debitScope.rows,
    ...accounts.rows.map((account) => ({
      bank_source: account.bank_source,
      bank_account_number: account.account_number,
      type: 'expense',
      description: '',
      notes: '',
    })),
  ];
  return buildCalendarMonthSummaryFromRows(transactions.rows, accounts.rows, debitIdentityRows, period);
}

module.exports = { getCalendarMonthSummary, buildCalendarMonthSummaryFromRows };
