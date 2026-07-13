/**
 * Calendar-month aggregation for the Dashboard.
 *
 * Raw rows remain immutable. For connected credit cards, itemized activity is
 * counted on its factual purchase date. A summarized bank settlement is reduced
 * only by the same-month itemized activity already represented in that debit;
 * the unmatched remainder stays visible as real calendar-month cash activity.
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

function detailRow(row, countedAmount = amount(row)) {
  const rawAmount = round2(amount(row));
  const counted = round2(countedAmount);
  return {
    id: row.id,
    date: dateKey(row.date),
    processedDate: dateKey(row.bank_processed_date),
    description: row.description || '',
    notes: row.notes || '',
    bankSource: row.bank_source || null,
    accountNumber: String(row.bank_account_number || ''),
    type: row.type,
    status: row.bank_status || 'completed',
    amount: rawAmount,
    countedAmount: counted,
    adjustment: round2(Math.max(0, rawAmount - counted)),
    installmentNumber: row.installment_number || null,
    installmentTotal: row.installment_total || null,
  };
}

function detailGroup(key, kind, rows, total, extra = {}) {
  return {
    key,
    kind,
    total: round2(total),
    count: rows.length,
    transactions: rows,
    ...extra,
  };
}

function resolveSettlementAccount(classification, connectedBySource) {
  const source = classification.reconciliation?.cardSource;
  if (!source) return { source: null, account: null, matchingScope: 'unresolved' };
  const connected = connectedBySource.get(source) || [];
  const explicit = String(classification.reconciliation?.cardAccount || '');
  if (explicit) {
    return connected.includes(explicit)
      ? { source, account: explicit, matchingScope: 'account' }
      : { source, account: explicit, matchingScope: 'unconnected' };
  }
  if (connected.length === 1) {
    return { source, account: connected[0], matchingScope: 'account' };
  }
  if (connected.length > 1) {
    return { source, account: null, matchingScope: 'provider' };
  }
  return { source, account: null, matchingScope: 'unconnected' };
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

function buildCalendarMonthSummaryFromRows(rows, accounts, debitScopeRows, period, options = {}) {
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
  const context = {
    debitCardAccounts: debitAccounts,
    connectedCardSources: [...connectedBySource.keys()],
  };
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
    // Provider-level groups can contain several real card debits on the same
    // day. Do not drop one merely because a sibling row is still pending; the
    // exact pending/completed duplicate filter already ran above.
    group.activeRows = hasCompleted && group.matchingScope !== 'provider'
      ? group.rows.filter((row) => row.bank_status !== 'pending') : group.rows;
    group.connected = group.matchingScope === 'provider'
      || Boolean(group.source && group.account && connectedCardKeys.has(cardKey(group.source, group.account)));
    if (hasCompleted && group.matchingScope !== 'provider') {
      group.rows.filter((row) => row.bank_status === 'pending').forEach((row) => supersededSettlementIds.add(row.id));
    }
  }

  const matchedReversals = matchConnectedSettlementReversals(scopedRows, settlementGroups, supersededSettlementIds);

  const bank = emptyActivity();
  const cards = emptyActivity();
  const other = emptyActivity();
  const cardActivities = new Map();
  const countedRows = [];
  let debitEnrichmentExcluded = 0;
  let debitEnrichmentExcludedCount = 0;

  for (const row of scopedRows) {
    if (supersededSettlementIds.has(row.id)) continue;
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
  let pendingExpenseAdjustment = 0;
  for (const group of settlementGroups.values()) {
    const bankDebit = round2(group.activeRows.reduce((sum, row) => sum + amount(row), 0));
    const connected = group.connected;
    const itemized = connected ? scopedRows.filter((row) => (
      row.bank_source === group.source
      && (group.matchingScope === 'provider'
        ? (connectedBySource.get(group.source) || []).includes(String(row.bank_account_number || ''))
        : String(row.bank_account_number || '') === String(group.account))
      && !debitKeys.has(cardKey(row.bank_source, row.bank_account_number))
      && dateKey(row.bank_processed_date) === group.billingDate
      && (row.type === 'income' || row.type === 'expense')
    )) : [];
    const itemizedExpenses = round2(itemized.filter((row) => row.type === 'expense').reduce((sum, row) => sum + amount(row), 0));
    const itemizedRefunds = round2(itemized.filter((row) => row.type === 'income').reduce((sum, row) => sum + amount(row), 0));
    const representedNet = round2(Math.max(0, itemizedExpenses - itemizedRefunds));
    const adjustment = connected ? round2(Math.min(bankDebit, representedNet)) : 0;
    const remainingBankDebit = round2(Math.max(0, bankDebit - adjustment));
    const isPendingDebit = group.activeRows.length > 0 && group.activeRows.every((row) => row.bank_status === 'pending');
    totalAdjustment += adjustment;
    if (isPendingDebit) pendingExpenseAdjustment += adjustment;
    const adjustmentDetail = {
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
      matchingBasis: connected
        ? (group.matchingScope === 'provider'
          ? 'same_month_connected_provider_overlap_subtracted'
          : 'same_month_connected_card_overlap_subtracted')
        : 'unconnected_or_unresolved_card',
      matchingScope: group.matchingScope,
    };
    group.adjustmentDetail = adjustmentDetail;
    adjustments.push(adjustmentDetail);
  }
  totalAdjustment = round2(totalAdjustment);
  pendingExpenseAdjustment = round2(pendingExpenseAdjustment);

  const bankFinished = finishActivity(bank, totalAdjustment, pendingExpenseAdjustment);
  const cardsFinished = finishActivity(cards);
  const otherFinished = finishActivity(other);
  const income = round2(bankFinished.income + cardsFinished.income + otherFinished.income);
  const expenses = round2(bankFinished.expenses + cardsFinished.expenses + otherFinished.expenses);

  const matchedBankReversalAmount = round2(matchedReversals.reduce((sum, item) => sum + item.amount, 0));

  const result = {
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
      rawIncomeBeforeAdjustments: income,
      creditCardDebitAdjustments: totalAdjustment,
      bankReversalAdjustments: 0,
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
        matchedBankReversalsIncludedInIncome: matchedBankReversalAmount,
        matchedBankReversalsExcludedFromIncome: 0,
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
      rule: 'subtract_only_same_month_itemized_overlap_from_connected_card_debits',
    },
    model: 'raw_calendar_activity_with_partial_card_debit_reconciliation_v4',
  };

  if (options.includeDetails) {
    const countedAmountById = new Map(countedRows.map((row) => [row.id, amount(row)]));
    for (const group of settlementGroups.values()) {
      let adjustmentLeft = Number(group.adjustmentDetail?.adjustment) || 0;
      for (const row of [...(group.activeRows || [])].sort((a, b) => Number(a.id) - Number(b.id))) {
        if (!countedAmountById.has(row.id) || adjustmentLeft <= 0) continue;
        const deducted = Math.min(countedAmountById.get(row.id), adjustmentLeft);
        countedAmountById.set(row.id, round2(countedAmountById.get(row.id) - deducted));
        adjustmentLeft = round2(adjustmentLeft - deducted);
      }
    }

    const serialize = (row) => detailRow(row, countedAmountById.get(row.id));
    const bankExpenseRows = countedRows
      .filter((row) => institutionKind(row.bank_source) === 'bank' && row.type === 'expense')
      .map(serialize);
    const bankIncomeRows = countedRows
      .filter((row) => institutionKind(row.bank_source) === 'bank' && row.type === 'income')
      .map(serialize);
    const pendingRows = countedRows
      .filter((row) => row.bank_status === 'pending' && row.type === 'expense')
      .map(serialize);
    const matchedReversalIds = new Set(matchedReversals.map((match) => match.incomeTransactionId));
    const refundRows = countedRows
      .filter((row) => (institutionKind(row.bank_source) === 'credit_card' && row.type === 'income')
        || matchedReversalIds.has(row.id))
      .map(serialize);

    const drilldowns = [
      detailGroup('bank:expense', 'bank_expenses', bankExpenseRows, bankFinished.expenses, {
        rawTotal: bankFinished.rawExpenses,
        adjustment: totalAdjustment,
      }),
      detailGroup('bank:income', 'bank_income', bankIncomeRows, bankFinished.income),
      detailGroup('adjustments', 'card_debit_adjustments', [], totalAdjustment, {
        adjustments,
        count: adjustments.filter((item) => item.adjustment > 0).length,
      }),
      detailGroup('refunds', 'refunds_and_installment_proceeds', refundRows,
        round2(cardsFinished.income + matchedBankReversalAmount)),
      detailGroup('pending', 'pending_expenses', pendingRows, result.pending.expenses),
    ];

    for (const activity of cardActivities.values()) {
      const cardRows = countedRows
        .filter((row) => institutionKind(row.bank_source) === 'credit_card'
          && row.type === 'expense'
          && row.bank_source === activity.bankSource
          && String(row.bank_account_number || '') === activity.accountNumber)
        .map(serialize);
      drilldowns.push(detailGroup(
        `card:${activity.bankSource}:${activity.accountNumber}`,
        'credit_card_expenses',
        cardRows,
        finishActivity(activity).expenses,
        { bankSource: activity.bankSource, accountNumber: activity.accountNumber },
      ));
    }

    result.drilldowns = drilldowns;
  }

  return result;
}

async function loadCalendarMonthRows(userId, offset = 0) {
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
  return { rows: transactions.rows, accounts: accounts.rows, debitIdentityRows, period };
}

async function getCalendarMonthSummary(userId, offset = 0) {
  const data = await loadCalendarMonthRows(userId, offset);
  return buildCalendarMonthSummaryFromRows(
    data.rows, data.accounts, data.debitIdentityRows, data.period,
  );
}

async function getCalendarMonthDetails(userId, offset = 0, groupKey = '') {
  const data = await loadCalendarMonthRows(userId, offset);
  const summary = buildCalendarMonthSummaryFromRows(
    data.rows, data.accounts, data.debitIdentityRows, data.period, { includeDetails: true },
  );
  const group = summary.drilldowns.find((item) => item.key === String(groupKey || ''));
  if (!group) return null;
  return { period: summary.period, model: summary.model, ...group };
}

module.exports = {
  getCalendarMonthSummary,
  getCalendarMonthDetails,
  buildCalendarMonthSummaryFromRows,
};
