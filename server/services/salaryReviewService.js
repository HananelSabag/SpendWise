const db = require('../config/db');
const { classifyTransaction, normalizeDescription } = require('./financialClassificationService');
const { dateKey } = require('./cardReconciliationService');

const SELECT_COLUMNS = `id, bank_source, bank_account_number, amount, type, description, notes,
  date, transaction_datetime, bank_processed_date, bank_status, bank_sync_id, raw_category,
  original_amount, original_currency, charged_currency, txn_kind,
  installment_number, installment_total, ledger_class,
  settlement_card_source, settlement_card_account`;

function addMonthKey(month, offset) {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}

function salaryMonth(row, classification) {
  const key = dateKey(row.date);
  if (!key) return null;
  return addMonthKey(key.slice(0, 7), Number.isInteger(classification.monthOffset) ? classification.monthOffset : -1);
}

function detectSalaryConflicts(rows, salarySignatures, overrides = []) {
  const overrideMap = new Map(overrides.map((item) => [Number(item.transaction_id), item]));
  const baseContext = { salarySignatures };
  const groups = new Map();

  for (const row of rows) {
    const classification = classifyTransaction(row, baseContext);
    if (!classification.salary) continue;
    const month = salaryMonth(row, classification);
    if (!month) continue;
    const groupKey = [
      row.bank_source,
      row.bank_account_number || '',
      normalizeDescription(row.description),
      month,
    ].join('|');
    const group = groups.get(groupKey) || {
      id: groupKey,
      economicMonth: month,
      description: row.description,
      bankSource: row.bank_source,
      accountNumber: row.bank_account_number,
      transactions: [],
    };
    const override = overrideMap.get(Number(row.id));
    group.transactions.push({
      id: row.id,
      amount: Number(row.amount) || 0,
      date: dateKey(row.date),
      description: row.description,
      classification: override?.classification || 'salary',
      explicitlyReviewed: Boolean(override),
    });
    groups.set(groupKey, group);
  }

  return [...groups.values()]
    .filter((group) => {
      const salaryLike = group.transactions.filter((item) => item.classification === 'salary');
      if (salaryLike.length < 2) return false;
      return !salaryLike.every((item) => item.explicitlyReviewed);
    })
    .map((group) => ({
      ...group,
      totalAmount: group.transactions.reduce((sum, item) => sum + item.amount, 0),
      transactions: group.transactions.sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id),
    }))
    .sort((a, b) => b.economicMonth.localeCompare(a.economicMonth));
}

async function loadReviewData(userId) {
  const [rowsResult, signaturesResult, overridesResult] = await Promise.all([
    db.query(
      `SELECT ${SELECT_COLUMNS}
         FROM transactions t
        WHERE t.user_id=$1 AND t.deleted_at IS NULL AND t.type='income'
          AND t.date >= CURRENT_DATE - INTERVAL '180 days'
          AND (t.bank_source IS NULL OR NOT EXISTS (
            SELECT 1
              FROM bank_accounts ba_filter
             WHERE ba_filter.user_id = t.user_id
               AND ba_filter.bank_source = t.bank_source
               AND ba_filter.account_number = COALESCE(t.bank_account_number, '')
               AND ba_filter.enabled = false
          ))
        ORDER BY t.date, t.id`,
      [userId],
    ),
    db.query('SELECT * FROM salary_signatures WHERE user_id=$1 AND active=true', [userId]),
    db.query('SELECT * FROM transaction_month_overrides WHERE user_id=$1', [userId]),
  ]);
  return {
    rows: rowsResult.rows,
    signatures: signaturesResult.rows,
    overrides: overridesResult.rows,
  };
}

async function buildSalaryReview(userId) {
  const data = await loadReviewData(userId);
  return { conflicts: detectSalaryConflicts(data.rows, data.signatures, data.overrides) };
}

async function saveSalaryReview(userId, rawDecisions) {
  if (!Array.isArray(rawDecisions) || rawDecisions.length < 2 || rawDecisions.length > 10) {
    const error = new Error('decisions must contain between 2 and 10 transactions');
    error.statusCode = 400;
    throw error;
  }
  const allowed = new Set(['salary', 'bonus', 'other']);
  const decisions = rawDecisions.map((item) => ({
    transactionId: Number(item?.transactionId),
    classification: String(item?.classification || ''),
  }));
  if (decisions.some((item) => !Number.isInteger(item.transactionId) || item.transactionId <= 0 || !allowed.has(item.classification))) {
    const error = new Error('Each decision requires a valid transactionId and salary, bonus, or other classification');
    error.statusCode = 400;
    throw error;
  }
  if (new Set(decisions.map((item) => item.transactionId)).size !== decisions.length) {
    const error = new Error('Duplicate transaction decisions are not allowed');
    error.statusCode = 400;
    throw error;
  }

  const data = await loadReviewData(userId);
  const rowsById = new Map(data.rows.map((row) => [Number(row.id), row]));
  const baseContext = { salarySignatures: data.signatures };
  const prepared = decisions.map((decision) => {
    const row = rowsById.get(decision.transactionId);
    const classification = row ? classifyTransaction(row, baseContext) : null;
    if (!row || !classification?.salary) {
      const error = new Error(`Transaction ${decision.transactionId} is not a salary-review candidate`);
      error.statusCode = 404;
      throw error;
    }
    return {
      transaction_id: decision.transactionId,
      classification: decision.classification,
      economic_month: `${salaryMonth(row, classification)}-01`,
    };
  });

  await db.query(`
    INSERT INTO transaction_month_overrides (
      transaction_id, user_id, economic_month, classification, reason, created_by
    )
    SELECT x.transaction_id, $1, x.economic_month, x.classification,
           'Resolved duplicate salary review', 'user'
      FROM jsonb_to_recordset($2::jsonb) AS x(
        transaction_id integer, economic_month date, classification text
      )
    ON CONFLICT (transaction_id) DO UPDATE SET
      economic_month=EXCLUDED.economic_month,
      classification=EXCLUDED.classification,
      reason=EXCLUDED.reason,
      created_by='user',
      updated_at=NOW()
  `, [userId, JSON.stringify(prepared)]);

  return buildSalaryReview(userId);
}

module.exports = { detectSalaryConflicts, buildSalaryReview, saveSalaryReview };
