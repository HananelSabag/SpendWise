/**
 * Factual calendar-month cash flow.
 *
 * The headline is deliberately bank-only: every imported bank income and bank
 * expense on its real local date. Itemized card activity and manual activity are
 * reported separately and never added to bank cash flow.
 */

const db = require('../config/db');
const { institutionKind } = require('../config/institutions');
const { getCalendarPeriod, TZ } = require('../utils/calendarPeriod');
const { dateKey } = require('./cardReconciliationService');
const { withoutSupersededPendingBankRows } = require('./financialClassificationService');

const SELECT_COLUMNS = `id, bank_source, bank_account_number, amount, type,
  description, notes, date, transaction_datetime, bank_processed_date,
  bank_status, bank_sync_id, raw_category, ledger_class,
  settlement_card_source, settlement_card_account`;

const round2 = (value) => Math.round(((Number(value) || 0) + Number.EPSILON) * 100) / 100;

function emptyFlow() {
  return { income: 0, expenses: 0, pendingIncome: 0, pendingExpenses: 0, count: 0 };
}

function addRaw(flow, row) {
  const amount = Math.abs(Number(row.amount) || 0);
  if (row.type === 'income') {
    flow.income += amount;
    if (row.bank_status === 'pending') flow.pendingIncome += amount;
  } else if (row.type === 'expense') {
    flow.expenses += amount;
    if (row.bank_status === 'pending') flow.pendingExpenses += amount;
  } else {
    return;
  }
  flow.count += 1;
}

function finishFlow(flow, { refundsReduceExpenses = false } = {}) {
  const income = round2(flow.income);
  const expenses = round2(refundsReduceExpenses ? Math.max(0, flow.expenses - income) : flow.expenses);
  return {
    income,
    expenses,
    net: round2(income - flow.expenses),
    pendingIncome: round2(flow.pendingIncome),
    pendingExpenses: round2(flow.pendingExpenses),
    count: flow.count,
  };
}

function buildCalendarActivityFromRows(rows, offset = 0, now = new Date()) {
  const period = getCalendarPeriod(offset, now);
  const windowRows = withoutSupersededPendingBankRows(rows).filter((row) => {
    const key = dateKey(row.date);
    return key && key >= period.start && key < period.end;
  });
  const bank = emptyFlow();
  const cards = emptyFlow();
  const manual = emptyFlow();
  const other = emptyFlow();

  for (const row of windowRows) {
    const kind = institutionKind(row.bank_source);
    if (kind === 'bank') addRaw(bank, row);
    else if (kind === 'credit_card') addRaw(cards, row);
    else if (row.bank_source == null) addRaw(manual, row);
    else addRaw(other, row);
  }

  const bankCashFlow = finishFlow(bank);
  const cardRaw = finishFlow(cards);
  const manualActivity = finishFlow(manual);
  const otherActivity = finishFlow(other);
  const cardActivity = {
    charges: cardRaw.expenses,
    refunds: cardRaw.income,
    netCharges: round2(Math.max(0, cardRaw.expenses - cardRaw.income)),
    pendingCharges: cardRaw.pendingExpenses,
    count: cardRaw.count,
  };

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
    bankCashFlow,
    cardActivity,
    manualActivity,
    otherActivity,
    transactionCount: windowRows.length,
  };
}

async function buildCalendarActivity(userId, offset = 0) {
  const period = getCalendarPeriod(offset);
  const result = await db.query(
    `SELECT ${SELECT_COLUMNS}
       FROM transactions t
      WHERE t.user_id = $1 AND t.deleted_at IS NULL
        AND t.date >= $2 AND t.date < $3
        AND (t.bank_source IS NULL OR NOT EXISTS (
          SELECT 1 FROM bank_accounts ba
           WHERE ba.user_id = t.user_id
             AND ba.bank_source = t.bank_source
             AND ba.account_number = COALESCE(t.bank_account_number, '')
             AND ba.enabled = false
        ))
      ORDER BY t.date, t.id`,
    [userId, period.start, period.end],
  );
  return buildCalendarActivityFromRows(result.rows, offset);
}

module.exports = { buildCalendarActivity, buildCalendarActivityFromRows };
