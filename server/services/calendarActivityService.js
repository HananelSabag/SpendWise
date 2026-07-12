/**
 * Calendar activity is the factual "what happened this month" model.
 *
 * Unlike monthly accounting, transaction dates are never economically shifted:
 * a salary received on July 9 is July activity. The shared classifier still
 * prevents duplicate card settlements and debit enrichment copies.
 */

const { getCalendarPeriod, TZ } = require('../utils/calendarPeriod');
const {
  classifyTransaction,
  summarizeCalendar,
  spendingBreakdown,
  withoutSupersededPendingBankRows,
} = require('./financialClassificationService');
const { deriveDebitCardAccounts, dateKey } = require('./cardReconciliationService');
const { loadAccountingData } = require('./monthlyAccountingService');

const round2 = (value) => Math.round(((Number(value) || 0) + Number.EPSILON) * 100) / 100;

function emptyEventGroups() {
  return {
    cardCharges: { posted: 0, pending: 0, refunds: 0, count: 0 },
    bankPayments: { posted: 0, pending: 0, count: 0 },
    debitCardPayments: { posted: 0, pending: 0, count: 0 },
    transfers: { incoming: 0, outgoing: 0, count: 0 },
    loanPayments: { posted: 0, pending: 0, count: 0 },
    cashWithdrawals: { posted: 0, pending: 0, count: 0 },
    feesAndTax: { posted: 0, pending: 0, count: 0 },
  };
}

function addSpend(group, amount, pending) {
  group[pending ? 'pending' : 'posted'] += amount;
  group.count += 1;
}

function buildCalendarActivityFromData(data, offset = 0, now = new Date()) {
  const period = getCalendarPeriod(offset, now);
  const rows = data.rows.filter((row) => {
    const key = dateKey(row.date);
    return key && key >= period.start && key < period.end;
  });
  const context = {
    salarySignatures: data.salarySignatures,
    debitCardAccounts: deriveDebitCardAccounts(data.debitScopeRows),
    connectedCardSources: data.connectedCardSources,
    transactionOverrides: data.transactionOverrides,
  };
  const { totals } = summarizeCalendar(rows, context);
  const events = emptyEventGroups();

  for (const row of withoutSupersededPendingBankRows(rows)) {
    const classification = classifyTransaction(row, context);
    const amount = Math.abs(Number(row.amount) || 0);

    if (classification.economicRole === 'transfer' && classification.settlementRole !== 'card_settlement') {
      events.transfers[row.type === 'income' ? 'incoming' : 'outgoing'] += amount;
      events.transfers.count += 1;
      continue;
    }
    if (classification.calendarInclusion !== 'include') continue;

    if (classification.sourceRole === 'card_itemized') {
      if (classification.direction === 'refund') events.cardCharges.refunds += amount;
      else addSpend(events.cardCharges, amount, classification.pending);
      continue;
    }
    if (classification.direction !== 'spend') continue;
    if (classification.loanRepayment) addSpend(events.loanPayments, amount, classification.pending);
    else if (classification.settlementRole === 'debit_direct') addSpend(events.debitCardPayments, amount, classification.pending);
    else if (/cash withdrawal/i.test(classification.reason)) addSpend(events.cashWithdrawals, amount, classification.pending);
    else if (/fee|interest|tax/i.test(classification.reason)) addSpend(events.feesAndTax, amount, classification.pending);
    else if (classification.sourceRole === 'bank_primary') addSpend(events.bankPayments, amount, classification.pending);
  }

  for (const group of Object.values(events)) {
    for (const [key, value] of Object.entries(group)) {
      if (key !== 'count') group[key] = round2(value);
    }
  }

  return {
    period: {
      month: period.month,
      start: period.start,
      end: period.end,
      offset: period.offset,
      isCurrent: period.isCurrent,
      daysElapsed: period.daysElapsed,
      daysInMonth: period.daysInMonth,
      timezone: TZ,
    },
    income: {
      total: totals.earnedIncome,
      salary: totals.salaryIncome,
      other: totals.otherIncome,
    },
    spending: {
      posted: totals.spendActual,
      pending: round2(totals.spendCommitted - totals.spendActual),
      committed: totals.spendCommitted,
    },
    net: {
      posted: totals.netActual,
      committed: totals.netCommitted,
    },
    events,
    breakdown: spendingBreakdown(rows, context),
    transactionCount: rows.length,
    needsReview: totals.needsReview,
  };
}

async function buildCalendarActivity(userId, offset = 0) {
  const period = getCalendarPeriod(offset);
  const data = await loadAccountingData(userId, period.start, period.end);
  return buildCalendarActivityFromData(data, offset);
}

module.exports = { buildCalendarActivity, buildCalendarActivityFromData };
