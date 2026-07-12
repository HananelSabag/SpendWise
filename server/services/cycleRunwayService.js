/**
 * Financial cycle model anchored by observed credit-card billing dates.
 *
 * One intentional dedupe rule exists: when itemized credit-card data is
 * connected, the summarized bank settlement is excluded because the purchases
 * are already counted. Everything else follows the raw transaction type/date.
 */

const db = require('../config/db');
const { institutionKind } = require('../config/institutions');
const { getCalendarPeriod, TZ } = require('../utils/calendarPeriod');
const { deriveDebitCardAccounts, dateKey } = require('./cardReconciliationService');
const { withoutSupersededPendingBankRows } = require('./financialClassificationService');

const SELECT_COLUMNS = `id, bank_source, bank_account_number, amount, type,
  description, notes, date, transaction_datetime, bank_processed_date,
  bank_status, bank_sync_id, raw_category, ledger_class,
  settlement_card_source, settlement_card_account`;
const CARD_SETTLEMENT_HINT = /(כרטיסי?\s*אשראי|לאומי\s*ויזה|ויזה|מקס|ישראכרט|כאל|אמריקן|credit\s*card|max|visa|isracard|amex|\bcal\b)/i;
const round2 = (value) => Math.round(((Number(value) || 0) + Number.EPSILON) * 100) / 100;

function todayKey() {
  return dateKey(new Date());
}

function nextDay(key) {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function prevDay(key) {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function addMonth(key) {
  if (!key) return null;
  const [year, month, day] = key.split('-').map(Number);
  const target = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

function daysBetween(startKey, endExclusive) {
  return Math.max(1, Math.round((Date.parse(`${endExclusive}T00:00:00Z`) - Date.parse(`${startKey}T00:00:00Z`)) / 86400000));
}

function debitKey(source, account) {
  return `${source}:${String(account || '')}`;
}

function debitAccountSet(rows) {
  return new Set(deriveDebitCardAccounts(rows).map((item) => debitKey(item.source, item.account)));
}

function isItemizedCreditCard(row, debitAccounts) {
  return institutionKind(row.bank_source) === 'credit_card'
    && !debitAccounts.has(debitKey(row.bank_source, row.bank_account_number));
}

function isBankCardSettlement(row, hasConnectedCardDetail) {
  if (!hasConnectedCardDetail || institutionKind(row.bank_source) !== 'bank' || row.type !== 'expense') return false;
  return row.ledger_class === 'card_settlement'
    || Boolean(String(row.settlement_card_source || '').trim())
    || CARD_SETTLEMENT_HINT.test(String(row.description || ''));
}

/**
 * Per card/account and processed month, the dominant processed date is the
 * provider billing date. This ignores one-off processing dates while preserving
 * weekend/holiday shifts already present in the raw provider data.
 */
function deriveBillingBoundaries(rows, debitAccounts = debitAccountSet(rows)) {
  const dateGroups = new Map();
  for (const row of rows) {
    if (!isItemizedCreditCard(row, debitAccounts) || row.type !== 'expense') continue;
    const billingDate = dateKey(row.bank_processed_date);
    if (!billingDate) continue;
    const account = String(row.bank_account_number || '');
    const month = billingDate.slice(0, 7);
    const key = `${row.bank_source}|${account}|${month}|${billingDate}`;
    const group = dateGroups.get(key) || {
      bankSource: row.bank_source,
      accountNumber: account,
      month,
      billingDate,
      count: 0,
      total: 0,
    };
    group.count += 1;
    group.total += Math.abs(Number(row.amount) || 0);
    dateGroups.set(key, group);
  }

  const dominantByAccountMonth = new Map();
  for (const group of dateGroups.values()) {
    const key = `${group.bankSource}|${group.accountNumber}|${group.month}`;
    const current = dominantByAccountMonth.get(key);
    if (!current || group.count > current.count || (group.count === current.count && group.total > current.total)) {
      dominantByAccountMonth.set(key, group);
    }
  }

  const byMonth = new Map();
  for (const group of dominantByAccountMonth.values()) {
    const boundary = byMonth.get(group.month) || {
      month: group.month,
      billingDate: group.billingDate,
      sources: [],
      count: 0,
      total: 0,
    };
    if (group.billingDate > boundary.billingDate) boundary.billingDate = group.billingDate;
    boundary.sources.push({
      bankSource: group.bankSource,
      accountNumber: group.accountNumber,
      billingDate: group.billingDate,
      count: group.count,
      total: round2(group.total),
    });
    boundary.count += group.count;
    boundary.total += group.total;
    byMonth.set(group.month, boundary);
  }
  return [...byMonth.values()]
    .map((boundary) => ({ ...boundary, total: round2(boundary.total) }))
    .sort((a, b) => a.billingDate.localeCompare(b.billingDate));
}

function resolveCycleWindow(boundaries, offset = 0, today = todayKey()) {
  const paid = boundaries.filter((boundary) => boundary.billingDate <= today);
  if (offset === 0) {
    const closingBoundary = paid[paid.length - 1];
    if (closingBoundary) {
      const nextObserved = boundaries.find((boundary) => boundary.billingDate > today);
      return {
        anchor: 'card_billing',
        cycleStart: nextDay(closingBoundary.billingDate),
        cycleEndExclusive: nextDay(today),
        lastDay: today,
        openedAfterBillingDate: closingBoundary.billingDate,
        nextBillingDate: nextObserved?.billingDate || addMonth(closingBoundary.billingDate),
        boundarySources: closingBoundary.sources,
      };
    }
  } else {
    const closingIndex = paid.length + offset;
    const closingBoundary = paid[closingIndex];
    const openingBoundary = paid[closingIndex - 1];
    if (openingBoundary) {
      return {
        anchor: 'card_billing',
        cycleStart: nextDay(openingBoundary.billingDate),
        cycleEndExclusive: nextDay(closingBoundary.billingDate),
        lastDay: closingBoundary.billingDate,
        openedAfterBillingDate: openingBoundary.billingDate,
        nextBillingDate: closingBoundary.billingDate,
        boundarySources: closingBoundary.sources,
      };
    }
  }

  const fallback = getCalendarPeriod(offset, new Date(`${today}T12:00:00Z`));
  return {
    anchor: 'calendar_fallback',
    cycleStart: fallback.start,
    cycleEndExclusive: offset === 0 ? nextDay(today) : fallback.end,
    lastDay: offset === 0 ? today : prevDay(fallback.end),
    openedAfterBillingDate: null,
    nextBillingDate: null,
    boundarySources: [],
  };
}

function reduceCycleRows(rows, accounts, window) {
  const debitAccounts = debitAccountSet(rows);
  const connectedCardSources = new Set(
    accounts.filter((account) => account.enabled && institutionKind(account.bank_source) === 'credit_card')
      .map((account) => account.bank_source),
  );
  const hasConnectedCardDetail = connectedCardSources.size > 0;
  const totals = {
    incomePosted: 0,
    incomePending: 0,
    bankExpensesPosted: 0,
    bankExpensesPending: 0,
    cardExpensesPosted: 0,
    cardExpensesPending: 0,
    cardRefunds: 0,
    manualExpenses: 0,
    excludedCardSettlements: 0,
    transactionCount: 0,
  };
  const includedRows = [];

  for (const row of withoutSupersededPendingBankRows(rows)) {
    const key = dateKey(row.date);
    if (!key || key < window.cycleStart || key >= window.cycleEndExclusive) continue;
    totals.transactionCount += 1;
    const amount = Math.abs(Number(row.amount) || 0);
    const pending = row.bank_status === 'pending';
    const kind = institutionKind(row.bank_source);

    if (kind === 'bank') {
      if (row.type === 'income') totals[pending ? 'incomePending' : 'incomePosted'] += amount;
      else if (row.type === 'expense') {
        if (isBankCardSettlement(row, hasConnectedCardDetail)) totals.excludedCardSettlements += amount;
        else totals[pending ? 'bankExpensesPending' : 'bankExpensesPosted'] += amount;
      }
      includedRows.push(row);
      continue;
    }
    if (kind === 'credit_card') {
      if (!isItemizedCreditCard(row, debitAccounts)) continue;
      if (row.type === 'income') totals.cardRefunds += amount;
      else if (row.type === 'expense') totals[pending ? 'cardExpensesPending' : 'cardExpensesPosted'] += amount;
      includedRows.push(row);
      continue;
    }
    if (row.bank_source == null || kind === 'unknown') {
      if (row.type === 'income') totals[pending ? 'incomePending' : 'incomePosted'] += amount;
      else if (row.type === 'expense') totals.manualExpenses += amount;
      includedRows.push(row);
    }
  }

  for (const [key, value] of Object.entries(totals)) {
    if (typeof value === 'number' && key !== 'transactionCount') totals[key] = round2(value);
  }
  const cardCommitted = round2(Math.max(0, totals.cardExpensesPosted + totals.cardExpensesPending - totals.cardRefunds));
  const spentActual = round2(totals.bankExpensesPosted + Math.max(0, totals.cardExpensesPosted - totals.cardRefunds) + totals.manualExpenses);
  const spentCommitted = round2(totals.bankExpensesPosted + totals.bankExpensesPending + cardCommitted + totals.manualExpenses);
  const totalIncome = round2(totals.incomePosted + totals.incomePending);
  return {
    totals,
    includedRows,
    cardCommitted,
    spentActual,
    spentCommitted,
    totalIncome,
    netActual: round2(totals.incomePosted - spentActual),
    netCommitted: round2(totalIncome - spentCommitted),
    debitAccounts,
  };
}

function buildCardBillingCycles(rows, debitAccounts = debitAccountSet(rows)) {
  const groups = new Map();
  for (const row of rows) {
    if (!isItemizedCreditCard(row, debitAccounts)) continue;
    if (row.type !== 'expense' && row.type !== 'income') continue;
    const billingDate = dateKey(row.bank_processed_date);
    const key = `${row.bank_source}|${row.bank_account_number || ''}|${billingDate || 'unassigned'}`;
    const group = groups.get(key) || {
      bankSource: row.bank_source,
      accountNumber: String(row.bank_account_number || ''),
      billingDate,
      posted: 0,
      pending: 0,
      refunds: 0,
      count: 0,
    };
    const amount = Math.abs(Number(row.amount) || 0);
    if (row.type === 'income') group.refunds += amount;
    else group[row.bank_status === 'pending' ? 'pending' : 'posted'] += amount;
    group.count += 1;
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => ({
    ...group,
    posted: round2(group.posted),
    pending: round2(group.pending),
    refunds: round2(group.refunds),
    total: round2(Math.max(0, group.posted + group.pending - group.refunds)),
  })).sort((a, b) => String(a.billingDate || '9999').localeCompare(String(b.billingDate || '9999')));
}

function buildDailyHistory(rows, accounts, cycleStart, cycleEndExclusive) {
  const reduced = reduceCycleRows(rows, accounts, { cycleStart, cycleEndExclusive });
  const days = new Map();
  for (let cursor = cycleStart; cursor < cycleEndExclusive; cursor = nextDay(cursor)) {
    days.set(cursor, { date: cursor, spentActual: 0, spentCommitted: 0, spentPending: 0, totalIncome: 0, incomeExSalary: 0, salaryIncome: 0, transactionCount: 0, needsReviewCount: 0 });
  }
  const debitAccounts = reduced.debitAccounts;
  const hasCardDetail = accounts.some((account) => account.enabled && institutionKind(account.bank_source) === 'credit_card');
  for (const row of withoutSupersededPendingBankRows(rows)) {
    const key = dateKey(row.date);
    const day = days.get(key);
    if (!day) continue;
    const amount = Math.abs(Number(row.amount) || 0);
    const kind = institutionKind(row.bank_source);
    if (kind === 'bank' && row.type === 'expense' && isBankCardSettlement(row, hasCardDetail)) continue;
    if (kind === 'credit_card' && !isItemizedCreditCard(row, debitAccounts)) continue;
    day.transactionCount += 1;
    if (row.type === 'income' && kind !== 'credit_card') day.totalIncome += amount;
    else if (row.type === 'income' && kind === 'credit_card') {
      day.spentActual -= amount;
      day.spentCommitted -= amount;
    } else if (row.type === 'expense') {
      day.spentCommitted += amount;
      if (row.bank_status !== 'pending') day.spentActual += amount;
    }
  }
  let cumulativeSpent = 0;
  let cumulativeIncome = 0;
  return [...days.values()].map((day) => {
    day.spentActual = round2(day.spentActual);
    day.spentCommitted = round2(day.spentCommitted);
    day.spentPending = round2(day.spentCommitted - day.spentActual);
    day.totalIncome = round2(day.totalIncome);
    day.incomeExSalary = day.totalIncome;
    cumulativeSpent = round2(cumulativeSpent + day.spentCommitted);
    cumulativeIncome = round2(cumulativeIncome + day.totalIncome);
    return {
      ...day,
      cumulativeSpent,
      cumulativeIncome,
      cumulativeTotalIncome: cumulativeIncome,
      cumulativeNetIncludingSalary: round2(cumulativeIncome - cumulativeSpent),
      cumulativeNetExSalary: round2(cumulativeIncome - cumulativeSpent),
    };
  });
}

function buildCycleFromData(data, offset = 0, now = todayKey()) {
  const rows = data.rows || [];
  const accounts = data.accounts || [];
  const debitAccounts = debitAccountSet(rows);
  const boundaries = deriveBillingBoundaries(rows, debitAccounts);
  const window = resolveCycleWindow(boundaries, offset, now);
  const reduced = reduceCycleRows(rows, accounts, window);
  const cardBillingCycles = buildCardBillingCycles(reduced.includedRows, debitAccounts);
  const bankAccounts = accounts.filter((account) => account.enabled && institutionKind(account.bank_source) === 'bank' && account.balance != null);
  const checkingBalance = bankAccounts.length ? round2(bankAccounts.reduce((sum, account) => sum + Number(account.balance), 0)) : null;
  const daysElapsed = daysBetween(window.cycleStart, window.cycleEndExclusive);
  const pendingBank = reduced.totals.bankExpensesPending;
  const upcomingCards = offset === 0 ? reduced.cardCommitted : 0;

  return {
    offset,
    anchor: window.anchor,
    isCurrent: offset === 0,
    needsBillingSetup: window.anchor !== 'card_billing',
    cycleStart: window.cycleStart,
    cycleEndExclusive: window.cycleEndExclusive,
    lastDay: window.lastDay,
    daysElapsed,
    timezone: TZ,
    checkingBalance: offset === 0 ? checkingBalance : null,
    billing: {
      openedAfterBillingDate: window.openedAfterBillingDate,
      nextBillingDate: window.nextBillingDate,
      boundarySources: window.boundarySources,
      observedBoundaries: boundaries,
    },
    money: {
      spentActual: reduced.spentActual,
      spentCommitted: reduced.spentCommitted,
      spentPending: round2(reduced.spentCommitted - reduced.spentActual),
      totalIncome: reduced.totalIncome,
      incomeExSalary: reduced.totalIncome,
      salaryInWindow: 0,
      netIncludingSalaryActual: reduced.netActual,
      netIncludingSalaryCommitted: reduced.netCommitted,
      netExSalaryActual: reduced.netActual,
      netExSalaryCommitted: reduced.netCommitted,
      bankExpenses: round2(reduced.totals.bankExpensesPosted + reduced.totals.bankExpensesPending),
      cardActivity: reduced.cardCommitted,
      manualExpenses: reduced.totals.manualExpenses,
      excludedCardSettlements: reduced.totals.excludedCardSettlements,
    },
    dailyAverage: {
      spent: round2(reduced.spentCommitted / daysElapsed),
      income: round2(reduced.totalIncome / daysElapsed),
    },
    expected: {
      bankPending: offset === 0 ? pendingBank : 0,
      cardChargesNotYetSettled: upcomingCards,
      remainingKnown: offset === 0 ? round2(pendingBank + upcomingCards) : 0,
    },
    dailyHistory: buildDailyHistory(rows, accounts, window.cycleStart, window.cycleEndExclusive),
    cardBillingCycles,
    needsReview: [],
  };
}

function buildProjection(current, rawSettings = {}) {
  const settings = {
    enabled: rawSettings?.enabled === true,
    expectedIncome: Number(rawSettings?.expectedIncome ?? rawSettings?.expectedSalary) > 0
      ? round2(rawSettings.expectedIncome ?? rawSettings.expectedSalary) : null,
    expectedIncomeDate: dateKey(rawSettings?.expectedIncomeDate ?? rawSettings?.expectedSalaryDate),
    expectedCharge: Number(rawSettings?.expectedCharge) > 0 ? round2(rawSettings.expectedCharge) : null,
    expectedChargeDate: dateKey(rawSettings?.expectedChargeDate),
    expectedChargeLabel: String(rawSettings?.expectedChargeLabel || '').trim().slice(0, 80),
  };
  const expectedIncome = settings.enabled ? settings.expectedIncome || 0 : 0;
  const plannedExpenses = settings.enabled ? settings.expectedCharge || 0 : 0;
  const knownPending = current.expected?.remainingKnown || 0;
  const expectedRemainingExpenses = round2(knownPending + plannedExpenses);
  const projectedCheckingBalance = current.checkingBalance == null ? null
    : round2(current.checkingBalance + expectedIncome - expectedRemainingExpenses);
  const warning = projectedCheckingBalance == null ? 'unavailable'
    : projectedCheckingBalance < 0 ? 'negative'
      : projectedCheckingBalance < 1000 ? 'low' : 'ok';
  return {
    settings,
    expectedIncome: settings.enabled ? { amount: expectedIncome, date: settings.expectedIncomeDate } : null,
    expectedCharge: settings.enabled && settings.expectedCharge ? {
      amount: settings.expectedCharge,
      date: settings.expectedChargeDate,
      label: settings.expectedChargeLabel || 'Expected expense',
    } : null,
    knownPending,
    upcomingCardCharges: current.expected?.cardChargesNotYetSettled || 0,
    pendingBankExpenses: current.expected?.bankPending || 0,
    plannedExpenses,
    expectedRemainingExpenses,
    projectedCheckingBalance,
    warning,
    factsAsOf: current.lastDay,
    isPlanningOnly: true,
  };
}

async function loadCycleData(userId) {
  const [transactions, accounts] = await Promise.all([
    db.query(
      `SELECT ${SELECT_COLUMNS} FROM transactions t
        WHERE t.user_id=$1 AND t.deleted_at IS NULL
          AND t.date >= CURRENT_DATE - INTERVAL '180 days'
          AND (t.bank_source IS NULL OR NOT EXISTS (
                SELECT 1 FROM bank_accounts ba_filter
                 WHERE ba_filter.user_id=t.user_id AND ba_filter.bank_source=t.bank_source
                   AND ba_filter.account_number=COALESCE(t.bank_account_number, '') AND ba_filter.enabled=false
          ))
        ORDER BY t.date, t.id`,
      [userId],
    ),
    db.query('SELECT bank_source, account_number, balance, enabled FROM bank_accounts WHERE user_id=$1', [userId]),
  ]);
  return { rows: transactions.rows, accounts: accounts.rows };
}

async function buildCycle(userId, offset = 0) {
  return buildCycleFromData(await loadCycleData(userId), offset);
}

async function buildRunwayOverview(userId) {
  const [data, preferences] = await Promise.all([
    loadCycleData(userId),
    db.query('SELECT preferences FROM users WHERE id=$1', [userId]),
  ]);
  const current = buildCycleFromData(data, 0);
  const previous = buildCycleFromData(data, -1);
  const settings = preferences.rows[0]?.preferences?.runway_projection || {};
  return {
    current,
    previous,
    projection: buildProjection(current, settings),
    billing: current.billing,
    timezone: TZ,
  };
}

module.exports = {
  buildCycle,
  buildCycleFromData,
  buildRunwayOverview,
  buildDailyHistory,
  buildCardBillingCycles,
  buildProjection,
  deriveBillingBoundaries,
  resolveCycleWindow,
  reduceCycleRows,
  isBankCardSettlement,
};
