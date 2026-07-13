/**
 * Financial cycle model anchored by observed credit-card billing dates.
 *
 * Economic activity and future cash commitments are intentionally separate:
 * purchases are attributed to the activity window, while known future-billed
 * card rows inform the checking-balance outlook. Bank settlements are
 * reconciled per connected provider/account so unmatched cash is never hidden.
 */

const db = require('../config/db');
const { institutionKind } = require('../config/institutions');
const { getCalendarPeriod, TZ } = require('../utils/calendarPeriod');
const { deriveDebitCardAccounts, dateKey } = require('./cardReconciliationService');
const {
  classifyTransaction,
  normalizeDescription,
  withoutSupersededPendingBankRows,
} = require('./financialClassificationService');

const SELECT_COLUMNS = `id, bank_source, bank_account_number, amount, type,
  description, notes, date, transaction_datetime, bank_processed_date,
  bank_status, bank_sync_id, raw_category, ledger_class,
  settlement_card_source, settlement_card_account,
  txn_kind, installment_number, installment_total`;
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
    if (!isItemizedCreditCard(row, debitAccounts)
      || row.type !== 'expense'
      || row.bank_status === 'pending') continue;
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
        nextBoundarySources: nextObserved?.sources
          || closingBoundary.sources.map((source) => ({ ...source, billingDate: addMonth(source.billingDate) })),
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
        nextBoundarySources: closingBoundary.sources,
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
    nextBoundarySources: [],
  };
}

function buildClassificationContext(data, rows = data.rows || []) {
  const debitCardAccounts = deriveDebitCardAccounts(rows);
  const connectedCardSources = [...new Set((data.accounts || [])
    .filter((account) => account.enabled && institutionKind(account.bank_source) === 'credit_card')
    .map((account) => account.bank_source))];
  return {
    debitCardAccounts,
    connectedCardSources,
    salarySignatures: data.salarySignatures || [],
    transactionOverrides: data.transactionOverrides || [],
  };
}

function activityDate(row) {
  if (institutionKind(row.bank_source) === 'credit_card'
    && row.bank_status !== 'pending'
    && (row.txn_kind === 'installments' || Number(row.installment_total) > 1)) {
    return dateKey(row.bank_processed_date) || dateKey(row.date);
  }
  return dateKey(row.date);
}

function buildSettlementReconciliation(rows, accounts, context, window = null) {
  const activeRows = withoutSupersededPendingBankRows(rows);
  const debitKeys = new Set(context.debitCardAccounts.map((item) => debitKey(item.source, item.account)));
  const connectedBySource = new Map();
  for (const account of accounts || []) {
    if (!account.enabled || institutionKind(account.bank_source) !== 'credit_card') continue;
    if (debitKeys.has(debitKey(account.bank_source, account.account_number))) continue;
    const list = connectedBySource.get(account.bank_source) || [];
    list.push(String(account.account_number || ''));
    connectedBySource.set(account.bank_source, list);
  }

  const groups = new Map();
  for (const row of activeRows) {
    if (institutionKind(row.bank_source) !== 'bank' || row.type !== 'expense') continue;
    const rowDate = dateKey(row.date);
    if (window && (!rowDate || rowDate < window.cycleStart || rowDate >= window.cycleEndExclusive)) continue;
    const classification = classifyTransaction(row, context);
    if (classification.settlementRole !== 'card_settlement') continue;
    const source = classification.reconciliation?.cardSource || null;
    const connectedAccounts = connectedBySource.get(source) || [];
    const explicit = String(classification.reconciliation?.cardAccount || '');
    const account = explicit
      ? explicit : connectedAccounts.length === 1 ? connectedAccounts[0] : null;
    const matchingScope = explicit
      ? (connectedAccounts.includes(explicit) ? 'account' : 'unconnected')
      : connectedAccounts.length === 1 ? 'account'
        : connectedAccounts.length > 1 ? 'provider' : 'unconnected';
    const billingDate = dateKey(row.date);
    const key = `${source || 'unresolved'}:${account || 'unresolved'}:${billingDate}`;
    const group = groups.get(key) || { source, account, matchingScope, billingDate, rows: [] };
    group.rows.push(row);
    groups.set(key, group);
  }

  const countedById = new Map();
  const inactiveIds = new Set();
  const adjustments = [];
  for (const group of groups.values()) {
    const hasCompleted = group.rows.some((row) => row.bank_status !== 'pending');
    // A provider-level group may aggregate distinct debits for several cards.
    // Preserve a pending sibling unless an exact completed duplicate already
    // removed it in withoutSupersededPendingBankRows().
    const settlementRows = hasCompleted && group.matchingScope !== 'provider'
      ? group.rows.filter((row) => row.bank_status !== 'pending') : group.rows;
    group.rows.filter((row) => !settlementRows.includes(row)).forEach((row) => inactiveIds.add(row.id));
    const connected = group.matchingScope === 'provider'
      || Boolean(group.source && group.account
        && (connectedBySource.get(group.source) || []).includes(group.account));
    const bankDebit = round2(settlementRows.reduce((sum, row) => sum + Math.abs(Number(row.amount) || 0), 0));
    const itemized = connected ? activeRows.filter((row) => (
      row.bank_source === group.source
      && (group.matchingScope === 'provider'
        ? (connectedBySource.get(group.source) || []).includes(String(row.bank_account_number || ''))
        : String(row.bank_account_number || '') === group.account)
      && !debitKeys.has(debitKey(row.bank_source, row.bank_account_number))
      && dateKey(row.bank_processed_date) === group.billingDate
      && (row.type === 'income' || row.type === 'expense')
    )) : [];
    const itemizedExpenses = round2(itemized.filter((row) => row.type === 'expense')
      .reduce((sum, row) => sum + Math.abs(Number(row.amount) || 0), 0));
    const itemizedRefunds = round2(itemized.filter((row) => row.type === 'income')
      .reduce((sum, row) => sum + Math.abs(Number(row.amount) || 0), 0));
    const represented = round2(Math.max(0, itemizedExpenses - itemizedRefunds));
    const adjustment = connected ? round2(Math.min(bankDebit, represented)) : 0;
    let adjustmentLeft = adjustment;
    for (const row of settlementRows.sort((a, b) => Number(a.id) - Number(b.id))) {
      const raw = Math.abs(Number(row.amount) || 0);
      const deducted = Math.min(raw, adjustmentLeft);
      countedById.set(row.id, round2(raw - deducted));
      adjustmentLeft = round2(adjustmentLeft - deducted);
    }
    adjustments.push({
      cardSource: group.source,
      accountNumber: group.account,
      billingDate: group.billingDate,
      connected,
      matchingScope: group.matchingScope,
      bankDebit,
      itemizedExpenses,
      itemizedRefunds,
      adjustment,
      remainingBankDebit: round2(bankDebit - adjustment),
    });
  }
  return { countedById, inactiveIds, adjustments };
}

function reduceCycleRows(rows, accounts, window, rawContext = {}) {
  const context = rawContext.debitCardAccounts ? rawContext : buildClassificationContext({ accounts }, rows);
  const debitAccounts = new Set(context.debitCardAccounts.map((item) => debitKey(item.source, item.account)));
  const reconciliation = buildSettlementReconciliation(rows, accounts, context, window);
  const totals = {
    incomePosted: 0,
    incomePending: 0,
    salaryIncome: 0,
    bankExpensesPosted: 0,
    bankExpensesPending: 0,
    cardExpensesPosted: 0,
    cardExpensesPending: 0,
    cardRefundsPosted: 0,
    cardRefundsPending: 0,
    manualExpenses: 0,
    financingInflows: 0,
    transferInflows: 0,
    excludedCardSettlements: 0,
    unmatchedCardSettlements: 0,
    debitEnrichmentExcluded: 0,
    transactionCount: 0,
  };
  const includedRows = [];
  const dailyEntries = [];
  const needsReview = [];

  const addEntry = (row, key, amount, role, pending, salary = false) => {
    totals.transactionCount += 1;
    includedRows.push(row);
    dailyEntries.push({ date: key, amount, role, pending, salary });
  };

  for (const row of withoutSupersededPendingBankRows(rows)) {
    const key = activityDate(row);
    if (!key || key < window.cycleStart || key >= window.cycleEndExclusive) continue;
    if (reconciliation.inactiveIds.has(row.id)) continue;
    const rawAmount = Math.abs(Number(row.amount) || 0);
    const pending = row.bank_status === 'pending';
    const classification = classifyTransaction(row, context);

    if (classification.settlementRole === 'card_settlement') {
      const counted = reconciliation.countedById.get(row.id) ?? rawAmount;
      totals.excludedCardSettlements += rawAmount - counted;
      totals.unmatchedCardSettlements += counted;
      if (counted > 0) {
        totals[pending ? 'bankExpensesPending' : 'bankExpensesPosted'] += counted;
        addEntry(row, key, counted, 'expense', pending);
      }
      continue;
    }

    if (classification.calendarInclusion === 'exclude') {
      if (classification.sourceRole === 'card_enrichment') totals.debitEnrichmentExcluded += rawAmount;
      else if (row.type === 'income' && classification.economicRole === 'loan') totals.financingInflows += rawAmount;
      else if (row.type === 'income') totals.transferInflows += rawAmount;
      continue;
    }
    if (classification.calendarInclusion === 'needs_review') {
      needsReview.push({ id: row.id, reason: classification.reason });
    }

    if (classification.direction === 'refund') {
      totals[pending ? 'cardRefundsPending' : 'cardRefundsPosted'] += rawAmount;
      addEntry(row, key, rawAmount, 'income', pending, classification.salary === true);
    } else if (classification.direction === 'income' || row.type === 'income') {
      totals[pending ? 'incomePending' : 'incomePosted'] += rawAmount;
      if (classification.salary) totals.salaryIncome += rawAmount;
      addEntry(row, key, rawAmount, 'income', pending);
    } else if (row.type === 'expense') {
      if (classification.sourceRole === 'card_itemized') {
        if (debitAccounts.has(debitKey(row.bank_source, row.bank_account_number))) continue;
        totals[pending ? 'cardExpensesPending' : 'cardExpensesPosted'] += rawAmount;
      } else if (classification.sourceRole === 'manual') {
        totals.manualExpenses += rawAmount;
      } else {
        totals[pending ? 'bankExpensesPending' : 'bankExpensesPosted'] += rawAmount;
      }
      addEntry(row, key, rawAmount, 'expense', pending);
    }
  }

  for (const [key, value] of Object.entries(totals)) {
    if (typeof value === 'number' && key !== 'transactionCount') totals[key] = round2(value);
  }
  const refundsActual = totals.cardRefundsPosted;
  const refundsCommitted = round2(refundsActual + totals.cardRefundsPending);
  const spentActual = round2(totals.bankExpensesPosted + totals.cardExpensesPosted + totals.manualExpenses);
  const spentCommitted = round2(spentActual + totals.bankExpensesPending + totals.cardExpensesPending);
  const incomeActual = round2(totals.incomePosted + refundsActual);
  const totalIncome = round2(totals.incomePosted + totals.incomePending + refundsCommitted);
  return {
    totals,
    includedRows,
    dailyEntries,
    cardCommitted: round2(totals.cardExpensesPosted + totals.cardExpensesPending),
    spentActual,
    spentCommitted,
    totalIncome,
    netActual: round2(incomeActual - spentActual),
    netCommitted: round2(totalIncome - spentCommitted),
    debitAccounts,
    reconciliation: reconciliation.adjustments,
    needsReview,
  };
}

function buildCardBillingCycles(rows, debitAccounts = debitAccountSet(rows), options = {}) {
  const groups = new Map();
  for (const row of rows) {
    if (!isItemizedCreditCard(row, debitAccounts)) continue;
    if (row.type !== 'expense' && row.type !== 'income') continue;
    if (options.window) {
      const key = activityDate(row);
      if (!key || key < options.window.cycleStart || key >= options.window.cycleEndExclusive) continue;
    }
    const billingDate = options.billingDateForRow
      ? options.billingDateForRow(row)
      : row.bank_status === 'pending'
        ? options.pendingBillingDate?.(row) || null
        : dateKey(row.bank_processed_date);
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

function observedStatementDateResolver(boundaries, fallbackDate) {
  const datesByCard = new Map();
  for (const boundary of boundaries) {
    for (const source of boundary.sources || []) {
      const key = debitKey(source.bankSource, source.accountNumber);
      const dates = datesByCard.get(key) || [];
      dates.push(source.billingDate);
      datesByCard.set(key, dates);
    }
  }
  for (const dates of datesByCard.values()) dates.sort();

  return (row) => {
    if (row.bank_status === 'pending') return fallbackDate || null;
    const processedDate = dateKey(row.bank_processed_date);
    const observedDates = datesByCard.get(debitKey(row.bank_source, row.bank_account_number)) || [];
    if (processedDate && observedDates.includes(processedDate)) return processedDate;
    const economicDate = activityDate(row);
    return observedDates.find((date) => economicDate && date >= economicDate)
      || processedDate
      || fallbackDate
      || null;
  };
}

function buildUpcomingCardCommitments(rows, window, context, today) {
  if (!window.nextBillingDate) return { total: 0, posted: 0, pending: 0, refunds: 0, rows: [], cycles: [] };
  const debitAccounts = new Set(context.debitCardAccounts.map((item) => debitKey(item.source, item.account)));
  const nextDateByCard = new Map((window.nextBoundarySources || [])
    .map((source) => [debitKey(source.bankSource, source.accountNumber), source.billingDate]));
  const commitmentRows = withoutSupersededPendingBankRows(rows).filter((row) => {
    if (institutionKind(row.bank_source) !== 'credit_card'
      || debitAccounts.has(debitKey(row.bank_source, row.bank_account_number))
      || (row.type !== 'expense' && row.type !== 'income')) return false;
    const transactionDate = dateKey(row.date);
    const processedDate = dateKey(row.bank_processed_date);
    if (row.bank_status === 'pending') {
      return transactionDate && transactionDate >= window.openedAfterBillingDate && transactionDate <= today;
    }
    return processedDate && processedDate > today && processedDate <= window.nextBillingDate;
  });
  const posted = round2(commitmentRows.filter((row) => row.type === 'expense' && row.bank_status !== 'pending')
    .reduce((sum, row) => sum + Math.abs(Number(row.amount) || 0), 0));
  const pending = round2(commitmentRows.filter((row) => row.type === 'expense' && row.bank_status === 'pending')
    .reduce((sum, row) => sum + Math.abs(Number(row.amount) || 0), 0));
  const refunds = round2(commitmentRows.filter((row) => row.type === 'income')
    .reduce((sum, row) => sum + Math.abs(Number(row.amount) || 0), 0));
  const pendingBillingDate = (row) => nextDateByCard.get(debitKey(row.bank_source, row.bank_account_number))
    || window.nextBillingDate;
  return {
    total: round2(Math.max(0, posted + pending - refunds)),
    posted,
    pending,
    refunds,
    rows: commitmentRows,
    cycles: buildCardBillingCycles(commitmentRows, debitAccounts, { pendingBillingDate }),
  };
}

function buildDailyHistory(rows, accounts, cycleStart, cycleEndExclusive, rawContext = {}) {
  const reduced = reduceCycleRows(rows, accounts, { cycleStart, cycleEndExclusive }, rawContext);
  const days = new Map();
  for (let cursor = cycleStart; cursor < cycleEndExclusive; cursor = nextDay(cursor)) {
    days.set(cursor, { date: cursor, spentActual: 0, spentCommitted: 0, spentPending: 0, totalIncome: 0, incomeExSalary: 0, salaryIncome: 0, transactionCount: 0, needsReviewCount: 0 });
  }
  for (const entry of reduced.dailyEntries) {
    const day = days.get(entry.date);
    if (!day) continue;
    day.transactionCount += 1;
    if (entry.role === 'income') {
      day.totalIncome += entry.amount;
      if (entry.salary) day.salaryIncome += entry.amount;
    }
    else {
      day.spentCommitted += entry.amount;
      if (!entry.pending) day.spentActual += entry.amount;
    }
  }
  let cumulativeSpent = 0;
  let cumulativeIncome = 0;
  let cumulativeSalary = 0;
  return [...days.values()].map((day) => {
    day.spentActual = round2(day.spentActual);
    day.spentCommitted = round2(day.spentCommitted);
    day.spentPending = round2(day.spentCommitted - day.spentActual);
    day.totalIncome = round2(day.totalIncome);
    day.salaryIncome = round2(day.salaryIncome);
    day.incomeExSalary = round2(day.totalIncome - day.salaryIncome);
    cumulativeSpent = round2(cumulativeSpent + day.spentCommitted);
    cumulativeIncome = round2(cumulativeIncome + day.totalIncome);
    cumulativeSalary = round2(cumulativeSalary + day.salaryIncome);
    return {
      ...day,
      cumulativeSpent,
      cumulativeIncome,
      cumulativeTotalIncome: cumulativeIncome,
      cumulativeNetIncludingSalary: round2(cumulativeIncome - cumulativeSpent),
      cumulativeNetExSalary: round2(cumulativeIncome - cumulativeSalary - cumulativeSpent),
    };
  });
}

function medianNumber(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function monthAfter(month, offset) {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}

function dateInMonth(month, day) {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return `${month}-${String(Math.min(lastDay, Math.max(1, day))).padStart(2, '0')}`;
}

function buildExpectedSalaryForecast(rows, window, context, today) {
  if (!window?.nextBillingDate) return { total: 0, entries: [], method: 'none' };
  const groups = new Map();
  for (const row of rows || []) {
    if (institutionKind(row.bank_source) !== 'bank' || row.type !== 'income'
      || row.bank_status === 'pending') continue;
    const date = dateKey(row.date);
    if (!date || date > today) continue;
    const classification = classifyTransaction(row, context);
    if (!classification.salary) continue;
    const key = [row.bank_source, row.bank_account_number || '', normalizeDescription(row.description)].join('|');
    const group = groups.get(key) || {
      bankSource: row.bank_source,
      accountNumber: String(row.bank_account_number || ''),
      description: row.description || '',
      rows: [],
    };
    group.rows.push({ date, amount: Math.abs(Number(row.amount) || 0) });
    groups.set(key, group);
  }

  const horizonExclusive = nextDay(window.nextBillingDate);
  const entries = [];
  for (const group of groups.values()) {
    group.rows.sort((a, b) => a.date.localeCompare(b.date));
    const distinctMonths = new Set(group.rows.map((item) => item.date.slice(0, 7)));
    if (distinctMonths.size < 2) continue;
    const samples = group.rows.slice(-3);
    const typicalDay = Math.round(medianNumber(samples.map((item) => Number(item.date.slice(8, 10)))));
    const estimatedAmount = round2(medianNumber(samples.map((item) => item.amount)));
    let expectedDate = null;
    for (let offset = 0; offset < 3 && !expectedDate; offset += 1) {
      const candidate = dateInMonth(monthAfter(today.slice(0, 7), offset), typicalDay);
      if (candidate > today && candidate >= window.cycleStart && candidate < horizonExclusive) {
        expectedDate = candidate;
      }
    }
    if (!expectedDate || !estimatedAmount) continue;
    entries.push({
      ...group,
      rows: undefined,
      expectedDate,
      amount: estimatedAmount,
      sampleCount: samples.length,
      method: 'median_of_recent_salary_history',
    });
  }
  entries.sort((a, b) => a.expectedDate.localeCompare(b.expectedDate) || a.description.localeCompare(b.description));
  return {
    total: round2(entries.reduce((sum, entry) => sum + entry.amount, 0)),
    entries,
    method: entries.length ? 'recurring_explicit_salary_labels' : 'none',
  };
}

function buildCycleFromData(data, offset = 0, now = todayKey()) {
  const rows = data.rows || [];
  const accounts = data.accounts || [];
  const debitAccounts = debitAccountSet(rows);
  const boundaries = deriveBillingBoundaries(rows, debitAccounts);
  const window = resolveCycleWindow(boundaries, offset, now);
  const context = buildClassificationContext(data, rows);
  const reduced = reduceCycleRows(rows, accounts, window, context);
  const upcoming = offset === 0
    ? buildUpcomingCardCommitments(rows, window, context, now)
    : { total: 0, posted: 0, pending: 0, refunds: 0, rows: [], cycles: [] };
  const cardBillingCycles = offset === 0
    ? upcoming.cycles
    : buildCardBillingCycles(rows, debitAccounts, {
      window,
      billingDateForRow: observedStatementDateResolver(boundaries, window.nextBillingDate),
    });
  const bankAccounts = accounts.filter((account) => account.enabled && institutionKind(account.bank_source) === 'bank' && account.balance != null);
  const checkingBalance = bankAccounts.length ? round2(bankAccounts.reduce((sum, account) => sum + Number(account.balance), 0)) : null;
  const daysElapsed = daysBetween(window.cycleStart, window.cycleEndExclusive);
  const pendingBank = reduced.totals.bankExpensesPending;
  const salaryInWindow = reduced.totals.salaryIncome;
  const salaryForecast = offset === 0
    ? buildExpectedSalaryForecast(rows, window, context, now)
    : { total: 0, entries: [], method: 'none' };

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
      nextBoundarySources: window.nextBoundarySources,
      observedBoundaries: boundaries,
    },
    money: {
      spentActual: reduced.spentActual,
      spentCommitted: reduced.spentCommitted,
      spentPending: round2(reduced.spentCommitted - reduced.spentActual),
      totalIncome: reduced.totalIncome,
      incomeExSalary: round2(reduced.totalIncome - salaryInWindow),
      salaryInWindow,
      netIncludingSalaryActual: reduced.netActual,
      netIncludingSalaryCommitted: reduced.netCommitted,
      netExSalaryActual: round2(reduced.netActual - salaryInWindow),
      netExSalaryCommitted: round2(reduced.netCommitted - salaryInWindow),
      bankExpenses: round2(reduced.totals.bankExpensesPosted + reduced.totals.bankExpensesPending),
      cardActivity: reduced.cardCommitted,
      cardRefunds: round2(reduced.totals.cardRefundsPosted + reduced.totals.cardRefundsPending),
      manualExpenses: reduced.totals.manualExpenses,
      excludedCardSettlements: reduced.totals.excludedCardSettlements,
      unmatchedCardSettlements: reduced.totals.unmatchedCardSettlements,
      financingInflows: reduced.totals.financingInflows,
      transferInflows: reduced.totals.transferInflows,
    },
    dailyAverage: {
      spent: round2(reduced.spentCommitted / daysElapsed),
      income: round2(reduced.totalIncome / daysElapsed),
    },
    expected: {
      bankPending: offset === 0 ? pendingBank : 0,
      cardChargesNotYetSettled: upcoming.total,
      cardChargesPosted: upcoming.posted,
      cardChargesPending: upcoming.pending,
      cardRefundsExpected: upcoming.refunds,
      salaryIncomeExpected: salaryForecast.total,
      salaryForecast,
      remainingKnown: offset === 0 ? round2(pendingBank + upcoming.total) : 0,
    },
    dailyHistory: buildDailyHistory(rows, accounts, window.cycleStart, window.cycleEndExclusive, context),
    cardBillingCycles,
    reconciliation: reduced.reconciliation,
    needsReview: reduced.needsReview,
    model: 'financial_cycle_activity_and_cash_commitments_v2',
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
  const automaticIncome = Number(current.expected?.salaryIncomeExpected) || 0;
  const hasManualIncome = settings.enabled && settings.expectedIncome != null;
  const expectedIncome = hasManualIncome ? settings.expectedIncome : automaticIncome;
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
    expectedIncome: expectedIncome > 0 ? {
      amount: expectedIncome,
      date: hasManualIncome ? settings.expectedIncomeDate : null,
      source: hasManualIncome ? 'manual' : 'automatic_salary_history',
      entries: hasManualIncome ? [] : current.expected?.salaryForecast?.entries || [],
    } : null,
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
    hasAutomaticSalaryForecast: !hasManualIncome && automaticIncome > 0,
  };
}

async function loadCycleData(userId) {
  const [transactions, accounts, salarySignatures, transactionOverrides] = await Promise.all([
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
    db.query('SELECT * FROM salary_signatures WHERE user_id=$1 AND active=true', [userId]),
    db.query('SELECT * FROM transaction_month_overrides WHERE user_id=$1', [userId]),
  ]);
  return {
    rows: transactions.rows,
    accounts: accounts.rows,
    salarySignatures: salarySignatures.rows,
    transactionOverrides: transactionOverrides.rows,
  };
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
  buildExpectedSalaryForecast,
  deriveBillingBoundaries,
  resolveCycleWindow,
  reduceCycleRows,
  isBankCardSettlement,
};
