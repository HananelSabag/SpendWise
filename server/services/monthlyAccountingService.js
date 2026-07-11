const db = require('../config/db');
const { INSTITUTIONS } = require('../config/institutions');
const { getCalendarPeriod, TZ } = require('../utils/calendarPeriod');

const CARD_SOURCES = Object.entries(INSTITUTIONS).filter(([, x]) => x.kind === 'credit_card').map(([x]) => x);
const SETTLEMENT = '(דביט|ויזה|מקס|ישראכרט|כאל|אמקס|אמריקן אקספרס|אשראי|max|visa|isracard|cal|amex|american express)';
const FINANCING = '(העמדת הלוא|קבלת הלוא|גלש"ן שווקים)';
const NORMALIZED_DESCRIPTION = `LOWER(REGEXP_REPLACE(TRIM(t.description), '\\s+', ' ', 'g'))`;

function monthForOffset(offset = 0, now = new Date()) {
  return getCalendarPeriod(offset, now);
}

async function buildMonth(userId, offset = 0) {
  const period = monthForOffset(offset);
  const next = monthForOffset(period.offset + 1);
  const result = await db.query(`
    WITH month_rows AS (
      SELECT t.*,
        CASE WHEN t.bank_source = ANY($5::text[]) THEN 'card'
             WHEN t.bank_source IS NULL THEN 'manual' ELSE 'bank' END AS source_kind,
        (t.bank_source IS NOT NULL AND NOT (t.bank_source = ANY($5::text[]))
          AND t.type='expense' AND t.description ~* $6) AS is_settlement,
        (t.type='income' AND t.description ~* $7) AS is_financing,
        EXISTS (SELECT 1 FROM salary_signatures s WHERE s.user_id=t.user_id AND s.active
          AND s.bank_source=t.bank_source
          AND s.bank_account_number IS NOT DISTINCT FROM t.bank_account_number
          AND s.normalized_description=${NORMALIZED_DESCRIPTION}) AS is_salary
      FROM transactions t
      WHERE t.user_id=$1 AND t.deleted_at IS NULL AND t.date >= $2 AND t.date < $3
    ), next_salary AS (
      SELECT COALESCE(SUM(t.amount),0) AS amount, COUNT(*)::int AS count
      FROM transactions t JOIN salary_signatures s ON s.user_id=t.user_id AND s.active
       AND s.bank_source=t.bank_source
       AND s.bank_account_number IS NOT DISTINCT FROM t.bank_account_number
       AND s.normalized_description=${NORMALIZED_DESCRIPTION}
      WHERE t.user_id=$1 AND t.deleted_at IS NULL AND t.type='income'
        AND t.date >= $3 AND t.date < $4 AND s.month_offset=-1
    ), connected_cards AS (
      SELECT COUNT(*)::int AS count
      FROM bank_accounts
      WHERE user_id=$1 AND enabled=true AND bank_source = ANY($5::text[])
    ), settlement AS (
      SELECT COALESCE(SUM(t.amount),0) AS amount
      FROM transactions t WHERE t.user_id=$1 AND t.deleted_at IS NULL
       AND t.type='expense' AND t.bank_source IS NOT NULL
       AND NOT (t.bank_source = ANY($5::text[])) AND t.description ~* $6
       AND t.date >= $3 AND t.date < $4
    )
    SELECT
      COALESCE((SELECT amount FROM next_salary),0) AS salary_actual,
      COALESCE((SELECT count FROM next_salary),0) AS salary_count,
      COALESCE(SUM(amount) FILTER (WHERE type='income' AND NOT is_salary AND NOT is_financing),0) AS other_income,
      COALESCE(SUM(amount) FILTER (WHERE source_kind='card' AND type='expense' AND bank_status IS DISTINCT FROM 'pending'),0) AS card_posted,
      COALESCE(SUM(amount) FILTER (WHERE source_kind='card' AND type='expense' AND bank_status='pending'),0) AS card_pending,
      COALESCE(SUM(amount) FILTER (WHERE source_kind='card' AND type='income'),0) AS card_refunds,
      COALESCE(SUM(amount) FILTER (WHERE source_kind='bank' AND type='expense' AND NOT is_settlement),0) AS bank_direct,
      COALESCE(SUM(amount) FILTER (WHERE source_kind='manual' AND type='expense'),0) AS manual_expenses,
      COALESCE((SELECT amount FROM settlement),0) AS settlement_total,
      COALESCE((SELECT count FROM connected_cards),0) AS connected_card_count,
      COUNT(*)::int AS transaction_count
    FROM month_rows
  `, [userId, period.start, period.end, next.end, CARD_SOURCES, SETTLEMENT, FINANCING]);
  const r = result.rows[0] || {};
  const n = (v) => Number(v) || 0;
  const actualIncome = n(r.salary_actual) + n(r.other_income);
  const itemizedCardPosted = Math.max(0, n(r.card_posted) - n(r.card_refunds));
  const hasConnectedCard = n(r.connected_card_count) > 0;
  const settlement = n(r.settlement_total);
  const fallbackCardSpend = !hasConnectedCard && !period.isCurrent ? settlement : 0;
  const cardPosted = hasConnectedCard ? itemizedCardPosted : fallbackCardSpend;
  const actualSpend = cardPosted + n(r.bank_direct) + n(r.manual_expenses);
  const committed = actualSpend + n(r.card_pending);
  const difference = settlement - itemizedCardPosted;
  const tolerance = Math.max(5, itemizedCardPosted * 0.005);
  const reconciliationStatus = !hasConnectedCard
    ? 'unavailable'
    : !itemizedCardPosted
      ? 'unavailable'
      : !settlement
        ? 'partial'
        : Math.abs(difference) <= tolerance ? 'matched' : 'mismatch';
  const status = period.isCurrent ? 'open' : n(r.salary_actual) === 0 ? 'awaiting_salary' : reconciliationStatus === 'partial' ? 'awaiting_settlement' : reconciliationStatus === 'mismatch' || n(r.salary_count) > 1 ? 'needs_review' : 'closed';
  const dailyDivisor = Math.max(1, period.daysElapsed);
  return {
    ...period, status,
    income: { actual: actualIncome, salaryActual: n(r.salary_actual), other: n(r.other_income) },
    spending: {
      bankDirect: n(r.bank_direct),
      cardPosted,
      cardPending: hasConnectedCard ? n(r.card_pending) : 0,
      manual: n(r.manual_expenses),
      actual: actualSpend,
      committed,
      cardDataMode: hasConnectedCard ? 'itemized' : fallbackCardSpend ? 'settlement_fallback' : 'unavailable',
    },
    net: { actual: actualIncome - committed },
    dailyAverage: {
      income: actualIncome / dailyDivisor,
      spending: committed / dailyDivisor,
    },
    reconciliation: { status: reconciliationStatus, itemizedTotal: itemizedCardPosted, settlementTotal: settlement, difference },
    transactionCount: Number(r.transaction_count) || 0,
  };
}

async function buildOverview(userId) {
  const [previous, current] = await Promise.all([buildMonth(userId, -1), buildMonth(userId, 0)]);
  return { previous, current, timezone: TZ };
}

module.exports = { buildMonth, buildOverview, monthForOffset };
