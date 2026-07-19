/**
 * Database orchestration for the pure financial-cycle engine.
 * Queries are bounded, expensive engine facts are prepared once per request,
 * and closed-cycle totals can survive future raw-transaction retention.
 */

const db = require('../config/db');
const engine = require('./cycleEngine');
const { institutionKind } = require('../config/institutions');
const logger = require('../utils/logger');

const HISTORY_YEARS = 2;
const CONTEXT_MONTHS = 26;
const CACHE_TTL_MS = 15_000;
const MAX_CACHE_ENTRIES = 200;
const CALCULATION_VERSION = 4;
const resultCache = new Map();

const SELECT_COLUMNS = `id, bank_source, bank_account_number, amount, type, description, notes,
  date::text AS date, transaction_datetime, bank_processed_date::text AS bank_processed_date,
  bank_status, bank_sync_id, original_amount, original_currency, charged_currency,
  raw_category, txn_kind, installment_number, installment_total`;

function isoDate(value = new Date()) {
  return engine.ilDate(value);
}

function cacheGet(key) {
  const hit = resultCache.get(key);
  if (!hit || hit.expiresAt <= Date.now()) {
    if (hit) resultCache.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key, value) {
  const now = Date.now();
  for (const [candidate, entry] of resultCache) {
    if (entry.expiresAt <= now) resultCache.delete(candidate);
  }
  // Expired cleanup alone does not bound a busy multi-user process. Evict the
  // oldest inserted entry before adding a new key so memory cannot grow forever.
  if (!resultCache.has(key)) {
    while (resultCache.size >= MAX_CACHE_ENTRIES) {
      resultCache.delete(resultCache.keys().next().value);
    }
  }
  resultCache.set(key, { value, expiresAt: now + CACHE_TTL_MS });
  return value;
}

function invalidateCycleCache(userId) {
  const prefix = `${userId}:`;
  for (const key of resultCache.keys()) {
    if (key.startsWith(prefix)) resultCache.delete(key);
  }
}

function extractIdentifier(bankSyncId) {
  if (!bankSyncId) return null;
  const parts = String(bankSyncId).split(':');
  return parts.length ? parts[parts.length - 1] : null;
}

function toNormalized(row) {
  const signed = row.type === 'income' ? Number(row.amount) : -Number(row.amount);
  return {
    id: row.id,
    source: row.bank_source,
    accountNumber: row.bank_account_number == null ? null : String(row.bank_account_number),
    amount: signed,
    date: row.date,
    processedDate: row.bank_processed_date || row.date,
    status: row.bank_status || 'completed',
    description: row.description || '',
    notes: row.notes || '',
    identifier: extractIdentifier(row.bank_sync_id),
    originalCurrency: row.original_currency,
    rawCategory: row.raw_category || null,
    txnKind: row.txn_kind,
    installments: row.installment_number && row.installment_total
      ? { number: row.installment_number, total: row.installment_total }
      : null,
  };
}

async function loadUserData(userId, { startDate = null, endDate = null } = {}) {
  const { rows } = await db.query(
    `/* bounded cycle engine source rows */
     SELECT ${SELECT_COLUMNS}
       FROM transactions
      WHERE user_id = $1
        AND deleted_at IS NULL
        AND bank_source IS NOT NULL
        AND ($2::date IS NULL
          OR bank_processed_date >= $2::date
          OR (bank_processed_date IS NULL AND date >= $2::date))
        AND ($3::date IS NULL
          OR bank_processed_date <= $3::date
          OR (bank_processed_date IS NULL AND date <= $3::date))
        AND NOT EXISTS (
          SELECT 1
            FROM bank_accounts disabled_account
           WHERE disabled_account.user_id = transactions.user_id
             AND disabled_account.bank_source = transactions.bank_source
             AND disabled_account.account_number = transactions.bank_account_number
             AND disabled_account.enabled = false
        )
      ORDER BY COALESCE(bank_processed_date, date), id`,
    [userId, startDate, endDate],
  );

  const bankTxns = [];
  const cardsByKey = new Map();
  for (const row of rows) {
    const txn = toNormalized(row);
    if (institutionKind(row.bank_source) === 'credit_card') {
      const key = `${row.bank_source}:${txn.accountNumber || 'default'}`;
      if (!cardsByKey.has(key)) {
        cardsByKey.set(key, { source: row.bank_source, accountNumber: txn.accountNumber, txns: [] });
      }
      cardsByKey.get(key).txns.push(txn);
    } else {
      bankTxns.push(txn);
    }
  }
  return { bankTxns, cards: [...cardsByKey.values()] };
}

async function loadSalarySignatures(userId) {
  const { rows } = await db.query(
    `SELECT id, bank_source, bank_account_number, normalized_description, display_description,
            month_offset, cycle_anchor
       FROM salary_signatures
      WHERE user_id = $1 AND active = true
      ORDER BY id`,
    [userId],
  );
  return rows.map((row) => ({
    id: row.id,
    normalizedDescription: row.normalized_description,
    displayDescription: row.display_description,
    bankSource: row.bank_source,
    accountNumber: row.bank_account_number == null ? null : String(row.bank_account_number),
    monthOffset: row.month_offset,
    cycleAnchor: row.cycle_anchor !== false,
  }));
}

async function loadCreditClassifications(userId) {
  const { rows } = await db.query(
    `SELECT transaction_id, class, reason
       FROM credit_classifications
      WHERE user_id = $1
      ORDER BY transaction_id`,
    [userId],
  );
  return rows.map((row) => ({
    transactionId: row.transaction_id,
    class: row.class,
    reason: row.reason,
  }));
}

async function loadTransactionOverrides(userId) {
  try {
    const { rows } = await db.query(
      `SELECT transaction_id, classification, reason, updated_at
         FROM cycle_transaction_overrides
        WHERE user_id = $1
        ORDER BY transaction_id`,
      [userId],
    );
    return rows.map((row) => ({
      transactionId: row.transaction_id,
      classification: row.classification,
      reason: row.reason,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    // A rolling deploy can briefly run new code before migration 32 is applied.
    if (error.code === '42P01') return [];
    throw error;
  }
}

async function loadCycleSettings(userId) {
  try {
    const { rows } = await db.query(
      `SELECT engine_mode, manual_anchor_day, updated_at
         FROM financial_cycle_settings
        WHERE user_id = $1`,
      [userId],
    );
    const row = rows[0];
    return {
      engineMode: row?.engine_mode || 'automatic',
      manualAnchorDay: row?.manual_anchor_day == null ? null : Number(row.manual_anchor_day),
      updatedAt: row?.updated_at || null,
    };
  } catch (error) {
    if (error.code === '42P01') return { engineMode: 'automatic', manualAnchorDay: null, updatedAt: null };
    throw error;
  }
}

async function saveCycleSettings(userId, { engineMode, manualAnchorDay = null }) {
  const anchorDay = engineMode === 'manual' ? Number(manualAnchorDay) : null;
  const { rows } = await db.query(
    `WITH saved AS (
       INSERT INTO financial_cycle_settings (user_id, engine_mode, manual_anchor_day)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET
         engine_mode = EXCLUDED.engine_mode,
         manual_anchor_day = EXCLUDED.manual_anchor_day,
         updated_at = NOW()
       RETURNING engine_mode, manual_anchor_day, updated_at
     ), cleared AS (
       DELETE FROM financial_cycle_aggregates WHERE user_id = $1
     )
     SELECT * FROM saved`,
    [userId, engineMode, anchorDay],
  );
  invalidateCycleCache(userId);
  return {
    engineMode: rows[0].engine_mode,
    manualAnchorDay: rows[0].manual_anchor_day == null ? null : Number(rows[0].manual_anchor_day),
    updatedAt: rows[0].updated_at,
  };
}

async function loadSalaryClassifications(userId) {
  const { rows } = await db.query(
    `SELECT transaction_id, classification
       FROM transaction_month_overrides
      WHERE user_id = $1
        AND classification IN ('salary', 'bonus', 'other')`,
    [userId],
  );
  return rows.map((row) => ({
    transactionId: row.transaction_id,
    classification: row.classification,
  }));
}

async function saveCreditClassification(userId, transactionId, klass, reason = null) {
  const { rows } = await db.query(
    `INSERT INTO credit_classifications (transaction_id, user_id, class, reason)
     SELECT t.id, t.user_id, $3, $4
       FROM transactions t
      WHERE t.id = $1
        AND t.user_id = $2
        AND t.deleted_at IS NULL
        AND t.bank_source IS NOT NULL
        AND t.type = 'income'
        AND COALESCE(t.bank_status, 'completed') = 'completed'
     ON CONFLICT (transaction_id) DO UPDATE SET
       class = EXCLUDED.class,
       reason = EXCLUDED.reason,
       updated_at = NOW()
     RETURNING transaction_id, class, reason, updated_at`,
    [transactionId, userId, klass, reason],
  );
  if (!rows.length) return null;
  invalidateCycleCache(userId);
  return {
    transactionId: rows[0].transaction_id,
    class: rows[0].class,
    reason: rows[0].reason,
    updatedAt: rows[0].updated_at,
  };
}

async function saveTransactionOverride(userId, transactionId, classification, reason = null) {
  const { rows } = await db.query(
    `INSERT INTO cycle_transaction_overrides (
       transaction_id, user_id, classification, reason
     )
     SELECT t.id, t.user_id, $3, $4
       FROM transactions t
      WHERE t.id = $1
        AND t.user_id = $2
        AND t.deleted_at IS NULL
        AND t.bank_source IS NOT NULL
        AND (
          $3 IN ('transfer', 'exclude')
          OR ($3 IN ('salary', 'income', 'financing', 'refund') AND t.type = 'income')
          OR ($3 = 'expense' AND t.type = 'expense')
        )
     ON CONFLICT (transaction_id) DO UPDATE SET
       classification = EXCLUDED.classification,
       reason = EXCLUDED.reason,
       updated_at = NOW()
     RETURNING transaction_id, classification, reason, updated_at`,
    [transactionId, userId, classification, reason],
  );
  if (!rows.length) return null;
  invalidateCycleCache(userId);
  return {
    transactionId: rows[0].transaction_id,
    classification: rows[0].classification,
    reason: rows[0].reason,
    updatedAt: rows[0].updated_at,
  };
}

async function deleteTransactionOverride(userId, transactionId) {
  const { rowCount } = await db.query(
    `DELETE FROM cycle_transaction_overrides
      WHERE transaction_id = $1 AND user_id = $2`,
    [transactionId, userId],
  );
  invalidateCycleCache(userId);
  return rowCount > 0;
}

function effectiveSalaryAnchors(signatures) {
  const anchors = signatures.filter((signature) => signature.cycleAnchor !== false);
  return anchors.length ? anchors : signatures;
}

function findSalaryWindows(bankTxns, signatures, asOf, salaryClassifications = []) {
  const classifications = new Map(salaryClassifications.map((item) => [
    Number(item.transactionId), item.classification,
  ]));
  const anchors = effectiveSalaryAnchors(signatures);
  // A household has one reporting boundary. Additional linked salaries remain income streams;
  // treating every salary as an anchor creates four-day "months" in joint accounts.
  const primary = anchors[0] || null;
  const events = primary
    ? engine.findSalaryEvents(bankTxns, primary)
      .filter((event) => {
        const reviewed = classifications.get(Number(event.txn.id));
        return !reviewed || reviewed === 'salary';
      })
      .map((event) => ({ ...event, signature: primary }))
      .sort((a, b) => a.date.localeCompare(b.date))
    : [];
  return { anchors, primary, events, windows: engine.buildWindows(events, { asOf }) };
}

function resolveCycleWindows({ bankTxns, signatures, settings, asOf, months, salaryClassifications }) {
  if (settings.engineMode === 'manual') {
    return {
      anchors: effectiveSalaryAnchors(signatures),
      primary: effectiveSalaryAnchors(signatures)[0] || signatures[0] || null,
      events: [],
      windows: engine.buildFixedDayWindows(settings.manualAnchorDay, { asOf, months }),
    };
  }
  return findSalaryWindows(bankTxns, signatures, asOf, salaryClassifications);
}

async function loadCycleInputs(userId, { asOf, months, creditClassifications }) {
  const today = isoDate(asOf);
  const startDate = engine.addMonths(today, -months);
  const endDate = engine.addMonths(today, 2);
  const [
    data, signatures, storedClassifications, salaryClassifications, transactionOverrides, settings,
  ] = await Promise.all([
    loadUserData(userId, { startDate, endDate }),
    loadSalarySignatures(userId),
    creditClassifications === undefined
      ? loadCreditClassifications(userId)
      : Promise.resolve(creditClassifications),
    loadSalaryClassifications(userId),
    loadTransactionOverrides(userId),
    loadCycleSettings(userId),
  ]);
  return {
    ...data,
    signatures,
    storedClassifications,
    salaryClassifications,
    transactionOverrides,
    settings,
  };
}

function emptyCycleResult(status, signatures, loans = [], settings = { engineMode: 'automatic', manualAnchorDay: null }) {
  return {
    status,
    cycles: [],
    current: null,
    signatures,
    loans,
    totalOutstanding: loans.reduce((sum, loan) => sum + loan.outstanding, 0),
    recurring: [],
    salaryTracking: null,
    salaryChange: null,
    fundingForecast: { streams: [], expectedTotal: 0, start: null, end: null },
    settings,
  };
}

function cycleNotificationIssues(result) {
  const issues = [];
  const current = result.current;
  if (result.status === 'salary_not_linked' || result.status === 'salary_never_seen') {
    issues.push({ key: 'salary-setup', kind: 'salary_setup' });
  }
  if (current?.needsReview?.length) {
    issues.push({ key: `credit-review:${current.window.start}`, kind: 'credit_review' });
  }
  if (current?.unreconciledCardEvents?.length) {
    issues.push({ key: `card-review:${current.window.start}`, kind: 'card_review' });
  }
  if (result.salaryChange?.suspected) {
    issues.push({ key: 'salary-change', kind: 'salary_change' });
  } else if (result.salaryTracking?.status === 'late') {
    issues.push({ key: 'salary-late', kind: 'salary_late' });
  }
  return issues;
}

const CYCLE_NOTIFICATION_COPY = {
  en: {
    salary_setup: ['Complete your financial cycle', 'Choose the salary that anchors your cycle.'],
    credit_review: ['A transaction needs your decision', 'The cycle engine found money in that it cannot classify with certainty.'],
    card_review: ['A card charge needs review', 'A completed card charge could not be linked to a bank movement.'],
    salary_change: ['Did your salary change?', 'A salary is late, but a similar new credit arrived. Confirm it in Control.'],
    salary_late: ['Salary has not been detected', 'Open Control to confirm the salary setup or choose a new salary.'],
  },
  he: {
    salary_setup: ['השלמת הגדרת המחזור הפיננסי', 'צריך לבחור את המשכורת שמגדירה את תחילת המחזור.'],
    credit_review: ['עסקה מחכה להחלטה שלך', 'המנוע מצא כסף שנכנס ולא יכול לסווג אותו בוודאות.'],
    card_review: ['חיוב כרטיס דורש בדיקה', 'חיוב שהושלם לא קושר לתנועת בנק מתאימה.'],
    salary_change: ['המשכורת השתנתה?', 'המשכורת הקבועה לא זוהתה, אבל נכנסה העברה דומה. צריך לאשר אותה ב-Control.'],
    salary_late: ['המשכורת עדיין לא זוהתה', 'אפשר להיכנס ל-Control ולאשר את ההגדרה או לבחור משכורת חדשה.'],
  },
};

async function syncCycleNotifications(userId, result) {
  const issues = cycleNotificationIssues(result);
  try {
    const { rows } = await db.query(
      'SELECT language_preference FROM users WHERE id = $1',
      [userId],
    );
    const language = rows[0]?.language_preference === 'he' ? 'he' : 'en';
    const activeKeys = issues.map((issue) => issue.key);

    await db.query(
      `UPDATE notifications
          SET is_read = true
        WHERE user_id = $1
          AND type = 'cycle_action_required'
          AND is_read = false
          AND NOT ((data ->> 'issueKey') = ANY($2::text[]))`,
      [userId, activeKeys],
    );

    for (const issue of issues) {
      const [title, body] = CYCLE_NOTIFICATION_COPY[language][issue.kind];
      await db.query(
        `INSERT INTO notifications (user_id, type, title, body, data)
         SELECT $1, 'cycle_action_required', $2, $3, $4::jsonb
          WHERE NOT EXISTS (
            SELECT 1 FROM notifications
             WHERE user_id = $1
               AND type = 'cycle_action_required'
               AND is_read = false
               AND data ->> 'issueKey' = $5
          )
         ON CONFLICT DO NOTHING`,
        [
          userId,
          title,
          body,
          JSON.stringify({
            issueKey: issue.key,
            action: issue.kind,
            link: '/financial-cycle?tab=control',
          }),
          issue.key,
        ],
      );
    }
  } catch (error) {
    // Notification delivery must never make the financial-cycle endpoint unavailable.
    logger.warn('Could not sync financial-cycle action notifications', {
      userId,
      error: error.message,
    });
  }
}

async function getFinancialCycles(userId, {
  asOf = new Date(),
  creditClassifications,
  years = HISTORY_YEARS,
  skipCache = false,
} = {}) {
  const today = isoDate(asOf);
  const boundedYears = Math.max(1, Math.min(Number(years) || HISTORY_YEARS, 5));
  const cacheKey = `${userId}:history:${today}:${boundedYears}`;
  if (!skipCache && creditClassifications === undefined) {
    const cached = cacheGet(cacheKey);
    if (cached) return cached;
  }

  const {
    bankTxns, cards, signatures, storedClassifications, salaryClassifications,
    transactionOverrides, settings,
  } = await loadCycleInputs(userId, {
    asOf,
    months: (boundedYears * 12) + 2,
    creditClassifications,
  });
  if (!bankTxns.length) return emptyCycleResult('no_bank_data', signatures, [], settings);

  const prepared = engine.prepareCycleData({
    bankTxns,
    cards,
    asOf,
    creditClassifications: storedClassifications,
    transactionOverrides,
  });
  if (!signatures.length && settings.engineMode !== 'manual') {
    const empty = emptyCycleResult('salary_not_linked', signatures, prepared.loans, settings);
    await syncCycleNotifications(userId, empty);
    return empty;
  }

  const { events, windows, primary } = resolveCycleWindows({
    bankTxns,
    signatures,
    settings,
    asOf,
    months: (boundedYears * 12) + 2,
    salaryClassifications,
  });
  if (!windows.length) {
    const empty = emptyCycleResult('salary_never_seen', signatures, prepared.loans, settings);
    await syncCycleNotifications(userId, empty);
    return empty;
  }
  const salaryTrackingTxns = bankTxns.filter((txn) => {
    const reviewed = salaryClassifications.find(
      (item) => Number(item.transactionId) === Number(txn.id),
    );
    return !reviewed || reviewed.classification === 'salary';
  });
  const fundingForecast = engine.buildFundingForecast(salaryTrackingTxns, signatures, { asOf });
  const cycles = windows.map((window) => engine.buildCycle({
    bankTxns,
    cards,
    window,
    asOf,
    salarySignature: window.salary.signature || primary,
    salarySignatures: signatures,
    fundingForecast,
    creditClassifications: storedClassifications,
    salaryClassifications,
    transactionOverrides,
    preparedData: prepared,
  }));
  const latest = events[events.length - 1]?.signature || primary;
  const result = {
    status: 'ok',
    cycles,
    current: cycles.find((cycle) => cycle.window.running) || cycles[cycles.length - 1] || null,
    signatures,
    loans: prepared.loans,
    totalOutstanding: prepared.loans.reduce((sum, loan) => sum + loan.outstanding, 0),
    recurring: prepared.recurring,
    salaryTracking: latest ? engine.trackSalary(salaryTrackingTxns, latest, { asOf }) : null,
    fundingForecast,
    settings,
    salaryChange: latest ? engine.detectSalaryChange(salaryTrackingTxns, latest, {
      asOf,
      cards: [],
      excludeTxns: prepared.reversals.map((reversal) => reversal.creditTxn),
    }) : null,
  };

  await Promise.all([
    persistClosedCycleAggregates(userId, cycles),
    syncCycleNotifications(userId, result),
  ]);
  return (!skipCache && creditClassifications === undefined)
    ? cacheSet(cacheKey, result)
    : result;
}

async function getCurrentFinancialCycle(userId, { asOf = new Date(), skipCache = false } = {}) {
  const today = isoDate(asOf);
  const cacheKey = `${userId}:current:${today}`;
  if (!skipCache) {
    const cached = cacheGet(cacheKey);
    if (cached) return cached;
  }

  const {
    bankTxns, cards, signatures, storedClassifications, salaryClassifications,
    transactionOverrides, settings,
  } = await loadCycleInputs(userId, {
    asOf,
    months: CONTEXT_MONTHS,
  });
  if (!bankTxns.length) return emptyCycleResult('no_bank_data', signatures, [], settings);

  const prepared = engine.prepareCycleData({
    bankTxns,
    cards,
    asOf,
    creditClassifications: storedClassifications,
    transactionOverrides,
  });
  if (!signatures.length && settings.engineMode !== 'manual') {
    const empty = emptyCycleResult('salary_not_linked', signatures, prepared.loans, settings);
    await syncCycleNotifications(userId, empty);
    return empty;
  }

  const { windows, primary } = resolveCycleWindows({
    bankTxns,
    signatures,
    settings,
    asOf,
    months: CONTEXT_MONTHS,
    salaryClassifications,
  });
  if (!windows.length) {
    const empty = emptyCycleResult('salary_never_seen', signatures, prepared.loans, settings);
    await syncCycleNotifications(userId, empty);
    return empty;
  }
  const window = windows.find((candidate) => candidate.running) || windows[windows.length - 1];
  const salaryTrackingTxns = bankTxns.filter((txn) => {
    const reviewed = salaryClassifications.find(
      (item) => Number(item.transactionId) === Number(txn.id),
    );
    return !reviewed || reviewed.classification === 'salary';
  });
  const fundingForecast = engine.buildFundingForecast(salaryTrackingTxns, signatures, { asOf });
  const current = engine.buildCycle({
    bankTxns,
    cards,
    window,
    asOf,
    salarySignature: window.salary.signature || primary,
    salarySignatures: signatures,
    fundingForecast,
    creditClassifications: storedClassifications,
    salaryClassifications,
    transactionOverrides,
    preparedData: prepared,
  });
  const result = {
    status: 'ok',
    cycles: [current],
    current,
    signatures,
    loans: prepared.loans,
    totalOutstanding: prepared.loans.reduce((sum, loan) => sum + loan.outstanding, 0),
    recurring: prepared.recurring,
    salaryTracking: primary ? engine.trackSalary(salaryTrackingTxns, primary, { asOf }) : null,
    fundingForecast,
    settings,
    salaryChange: null,
  };
  await syncCycleNotifications(userId, result);
  return skipCache ? result : cacheSet(cacheKey, result);
}

function cycleCategoryTotals(cycle) {
  const totals = new Map();
  const add = (txn) => {
    const amount = Number(txn && txn.amount);
    if (!Number.isFinite(amount) || amount === 0) return;
    const category = String(txn.rawCategory || 'other').trim() || 'other';
    // Purchases are negative movements (positive category spend); refunds are positive
    // movements and reduce the same category instead of disappearing from yearly trends.
    totals.set(category, Math.round(((totals.get(category) || 0) - amount) * 100) / 100);
  };
  cycle.expenses.cards.events.forEach((event) => {
    const excluded = new Set((event.excludedTransactionIds || []).map(Number));
    (event.txns || []).forEach((txn) => {
      if (!excluded.has(Number(txn.id))) add(txn);
    });
  });
  cycle.expenses.direct.items.forEach((item) => add(item.txn));
  return Object.fromEntries([...totals.entries()].sort((a, b) => b[1] - a[1]));
}

function aggregatePayload(cycle) {
  return {
    start: cycle.window.start,
    end: cycle.window.end,
    income: cycle.income.total,
    expenses: cycle.expenses.total,
    operatingNet: cycle.operatingNet,
    financing: cycle.financing.total,
    bankMovement: cycle.bankMovement,
    timingAdjustment: cycle.timingAdjustment,
    categories: cycleCategoryTotals(cycle),
  };
}

async function persistClosedCycleAggregates(userId, cycles) {
  const payload = cycles
    .filter((cycle) => !cycle.window.running && !(cycle.partials || []).length)
    .map(aggregatePayload);
  if (!payload.length) return;
  try {
    await db.query(
      `INSERT INTO financial_cycle_aggregates (
         user_id, cycle_start, cycle_end, income, expenses, operating_net,
         financing, bank_movement, timing_adjustment, category_totals,
         calculation_version, calculated_at
       )
       SELECT $1, (item->>'start')::date, (item->>'end')::date,
              (item->>'income')::numeric, (item->>'expenses')::numeric,
              (item->>'operatingNet')::numeric, (item->>'financing')::numeric,
              (item->>'bankMovement')::numeric, (item->>'timingAdjustment')::numeric,
              COALESCE(item->'categories', '{}'::jsonb), $3, now()
         FROM jsonb_array_elements($2::jsonb) item
       ON CONFLICT (user_id, cycle_start) DO UPDATE SET
         cycle_end = EXCLUDED.cycle_end,
         income = EXCLUDED.income,
         expenses = EXCLUDED.expenses,
         operating_net = EXCLUDED.operating_net,
         financing = EXCLUDED.financing,
         bank_movement = EXCLUDED.bank_movement,
         timing_adjustment = EXCLUDED.timing_adjustment,
         category_totals = EXCLUDED.category_totals,
         calculation_version = EXCLUDED.calculation_version,
         calculated_at = now()`,
      [userId, JSON.stringify(payload), CALCULATION_VERSION],
    );
  } catch (error) {
    if (error.code !== '42P01') throw error;
  }
}

function summarizeYear(year, rows, source) {
  const categories = new Map();
  const months = rows.map((row) => {
    const categoryTotals = row.categories || row.category_totals || {};
    for (const [category, amount] of Object.entries(categoryTotals)) {
      categories.set(category, Math.round(((categories.get(category) || 0) + Number(amount || 0)) * 100) / 100);
    }
    return {
      cycleStart: row.start || row.cycle_start,
      cycleEnd: row.end || row.cycle_end,
      income: Number(row.income) || 0,
      expenses: Number(row.expenses) || 0,
      operatingNet: Number(row.operatingNet ?? row.operating_net) || 0,
      financing: Number(row.financing) || 0,
      bankMovement: Number(row.bankMovement ?? row.bank_movement) || 0,
      timingAdjustment: Number(row.timingAdjustment ?? row.timing_adjustment) || 0,
    };
  }).sort((a, b) => a.cycleStart.localeCompare(b.cycleStart));
  const sum = (key) => Math.round(months.reduce((total, month) => total + month[key], 0) * 100) / 100;
  const income = sum('income');
  const operatingNet = sum('operatingNet');
  return {
    year,
    source,
    totals: {
      income,
      expenses: sum('expenses'),
      operatingNet,
      financing: sum('financing'),
      bankMovement: sum('bankMovement'),
      timingAdjustment: sum('timingAdjustment'),
      savingsRate: income ? Math.round((operatingNet / income) * 10000) / 100 : 0,
    },
    months,
    categories: [...categories.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount),
  };
}

async function loadStoredYear(userId, year) {
  try {
    const { rows } = await db.query(
      `SELECT cycle_start::text, cycle_end::text, income, expenses, operating_net,
              financing, bank_movement, timing_adjustment, category_totals
         FROM financial_cycle_aggregates
        WHERE user_id = $1
          AND calculation_version = $3
          AND cycle_start >= make_date($2, 1, 1)
          AND cycle_start < make_date($2 + 1, 1, 1)
        ORDER BY cycle_start`,
      [userId, year, CALCULATION_VERSION],
    );
    return rows;
  } catch (error) {
    if (error.code === '42P01') return [];
    throw error;
  }
}

async function getYearReview(userId, year, { asOf = new Date() } = {}) {
  const selectedYear = Number(year);
  const currentYear = Number(isoDate(asOf).slice(0, 4));
  const stored = await loadStoredYear(userId, selectedYear);
  if (stored.length && selectedYear < currentYear) {
    return summarizeYear(selectedYear, stored, 'aggregates');
  }

  const result = await getFinancialCycles(userId, {
    asOf,
    years: Math.max(HISTORY_YEARS, currentYear - selectedYear + 1),
  });
  const live = result.cycles
    .filter((cycle) => Number(cycle.window.start.slice(0, 4)) === selectedYear)
    .filter((cycle) => !(cycle.partials || []).length)
    .map(aggregatePayload);
  if (live.length) return summarizeYear(selectedYear, live, 'live');
  return summarizeYear(selectedYear, stored, stored.length ? 'aggregates' : 'none');
}

async function getAvailableCycleYears(userId) {
  try {
    const { rows } = await db.query(
      `SELECT DISTINCT year
         FROM (
           SELECT EXTRACT(YEAR FROM cycle_start)::int AS year
             FROM financial_cycle_aggregates WHERE user_id = $1
           UNION
           SELECT EXTRACT(YEAR FROM COALESCE(bank_processed_date, date))::int AS year
             FROM transactions
            WHERE user_id = $1 AND deleted_at IS NULL AND bank_source IS NOT NULL
         ) available
        WHERE year IS NOT NULL
        ORDER BY year DESC`,
      [userId],
    );
    return rows.map((row) => Number(row.year));
  } catch (error) {
    if (error.code !== '42P01') throw error;
    const { rows } = await db.query(
      `SELECT DISTINCT EXTRACT(YEAR FROM COALESCE(bank_processed_date, date))::int AS year
         FROM transactions
        WHERE user_id = $1 AND deleted_at IS NULL AND bank_source IS NOT NULL
        ORDER BY year DESC`,
      [userId],
    );
    return rows.map((row) => Number(row.year));
  }
}

module.exports = {
  extractIdentifier,
  toNormalized,
  loadUserData,
  loadSalarySignatures,
  loadCreditClassifications,
  loadTransactionOverrides,
  loadCycleSettings,
  saveCreditClassification,
  saveTransactionOverride,
  deleteTransactionOverride,
  saveCycleSettings,
  getFinancialCycles,
  getCurrentFinancialCycle,
  getYearReview,
  getAvailableCycleYears,
  invalidateCycleCache,
  summarizeYear,
};
