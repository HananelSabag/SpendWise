/**
 * Database orchestration for the pure financial-cycle engine.
 * Queries are bounded, expensive engine facts are prepared once per request,
 * and closed-cycle totals can survive future raw-transaction retention.
 */

const db = require('../config/db');
const { randomUUID } = require('crypto');
const engine = require('./cycleEngine');
const { institutionKind } = require('../config/institutions');
const logger = require('../utils/logger');

const HISTORY_YEARS = 2;
const CONTEXT_MONTHS = 26;
const CACHE_TTL_MS = 60_000;
const MAX_CACHE_ENTRIES = 200;
const CALCULATION_VERSION = 7;
const resultCache = new Map();
const cacheInvalidationEpochs = new Map();

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

function cacheInvalidationEpoch(userId) {
  return cacheInvalidationEpochs.get(String(userId)) || 0;
}

function invalidateCycleCache(userId) {
  // A read that started before a mutation must not repopulate the cache after
  // that mutation has cleared it. Epochs are user-scoped: one household's sync
  // must never suppress another household's valid cache fill or notifications.
  const userKey = String(userId);
  cacheInvalidationEpochs.set(userKey, cacheInvalidationEpoch(userId) + 1);
  const prefix = `${userId}:`;
  for (const key of resultCache.keys()) {
    if (key.startsWith(prefix)) resultCache.delete(key);
  }
}

async function invalidateCycleDerivedData(userId) {
  // Mutations are committed before this runs. Advance the epoch first so a
  // read that began against the old snapshot cannot restore an aggregate
  // after it has been deleted.
  invalidateCycleCache(userId);
  try {
    await db.query('DELETE FROM financial_cycle_aggregates WHERE user_id = $1', [userId]);
  } catch (error) {
    // Keep rolling deployments compatible while the aggregate table is being created.
    if (error.code !== '42P01') {
      // The source mutation has already committed, so surfacing a false failure to the
      // client would invite a retry. Live calculations remain authoritative and the
      // warning makes a persistent-cache permission/outage issue operationally visible.
      logger.warn('Could not invalidate persisted financial-cycle aggregates', {
        userId,
        error: error.message,
      });
    }
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
      `SELECT o.transaction_id, o.classification, o.reason, o.updated_at,
               o.recurrence_kind, o.recurrence_enabled,
               o.recurrence_group_id, o.recurrence_label, o.recurrence_include_estimate,
               t.bank_source, t.bank_account_number, t.bank_sync_id, t.description,
              t.date::text AS date, t.bank_processed_date::text AS bank_processed_date,
              CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END AS signed_amount
         FROM cycle_transaction_overrides o
         JOIN transactions t ON t.id = o.transaction_id AND t.user_id = o.user_id
        WHERE o.user_id = $1
        ORDER BY o.transaction_id`,
      [userId],
    );
    return rows.map((row) => ({
      transactionId: row.transaction_id,
      classification: row.classification,
      reason: row.reason,
      ...(row.recurrence_kind !== undefined ? {
        recurrenceKind: row.recurrence_kind,
        recurrenceEnabled: row.recurrence_enabled === true,
        recurrenceGroupId: row.recurrence_group_id || null,
        recurrenceLabel: row.recurrence_label || null,
        recurrenceIncludeEstimate: row.recurrence_include_estimate !== false,
      } : {}),
      ...(row.bank_source !== undefined ? {
        source: row.bank_source,
        accountNumber: row.bank_account_number == null ? null : String(row.bank_account_number),
        identifier: extractIdentifier(row.bank_sync_id),
        description: row.description || '',
        date: row.bank_processed_date || row.date,
        amount: Number(row.signed_amount),
      } : {}),
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    // A rolling deploy can briefly run new code before migrations 32/34 are applied.  The old
    // classification still works; only recurrence projection waits for the additive migration.
    if (error.code === '42703') {
      const { rows } = await db.query(
        `SELECT o.transaction_id, o.classification, o.reason, o.updated_at,
                o.recurrence_kind, o.recurrence_enabled,
                t.bank_source, t.bank_account_number, t.bank_sync_id, t.description,
                t.date::text AS date, t.bank_processed_date::text AS bank_processed_date,
                CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END AS signed_amount
           FROM cycle_transaction_overrides o
           JOIN transactions t ON t.id = o.transaction_id AND t.user_id = o.user_id
          WHERE o.user_id = $1
          ORDER BY o.transaction_id`,
        [userId],
      );
      return rows.map((row) => ({
        transactionId: row.transaction_id,
        classification: row.classification,
        reason: row.reason,
        recurrenceKind: row.recurrence_kind,
        recurrenceEnabled: row.recurrence_enabled === true,
        recurrenceGroupId: null,
        recurrenceLabel: null,
        recurrenceIncludeEstimate: true,
        source: row.bank_source,
        accountNumber: row.bank_account_number == null ? null : String(row.bank_account_number),
        identifier: extractIdentifier(row.bank_sync_id),
        description: row.description || '',
        date: row.bank_processed_date || row.date,
        amount: Number(row.signed_amount),
        updatedAt: row.updated_at,
      }));
    }
    if (error.code === '42P01') return [];
    throw error;
  }
}

async function loadCycleSettings(userId) {
  try {
    const { rows } = await db.query(
      `SELECT engine_mode, manual_anchor_day, use_estimates, updated_at
         FROM financial_cycle_settings
        WHERE user_id = $1`,
      [userId],
    );
    const row = rows[0];
    return {
      engineMode: row?.engine_mode || 'automatic',
      manualAnchorDay: row?.manual_anchor_day == null ? null : Number(row.manual_anchor_day),
      useEstimates: row?.use_estimates !== false,
      updatedAt: row?.updated_at || null,
    };
  } catch (error) {
    if (error.code === '42703') {
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
        useEstimates: true,
        updatedAt: row?.updated_at || null,
      };
    }
    if (error.code === '42P01') return { engineMode: 'automatic', manualAnchorDay: null, useEstimates: true, updatedAt: null };
    throw error;
  }
}

async function loadCardSettings(userId) {
  try {
    const { rows } = await db.query(
      `SELECT settings.bank_source, settings.bank_account_number, settings.statement_day,
              settings.included, settings.linked_transaction_id, settings.updated_at,
              linked.bank_source AS linked_bank_source,
              linked.bank_account_number AS linked_bank_account_number,
              linked.bank_sync_id AS linked_bank_sync_id,
              linked.description AS linked_description
         FROM financial_card_settings settings
         LEFT JOIN transactions linked
           ON linked.id = settings.linked_transaction_id
          AND linked.user_id = settings.user_id
          AND linked.deleted_at IS NULL
        WHERE settings.user_id = $1
        ORDER BY settings.bank_source, settings.bank_account_number`,
      [userId],
    );
    return rows.map((row) => ({
      source: row.bank_source,
      accountNumber: String(row.bank_account_number),
      statementDay: row.statement_day == null ? null : Number(row.statement_day),
      included: row.included !== false,
      linkedTransactionId: row.linked_transaction_id || null,
      linkedBankSource: row.linked_bank_source || null,
      linkedBankAccountNumber: row.linked_bank_account_number == null
        ? null
        : String(row.linked_bank_account_number),
      linkedIdentifier: extractIdentifier(row.linked_bank_sync_id),
      linkedDescription: row.linked_description || null,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    if (error.code === '42P01') return [];
    throw error;
  }
}

async function saveCardSetting(userId, source, accountRef, {
  statementDay,
  included,
  linkedTransactionId,
} = {}) {
  const suffix = String(accountRef || '');
  const accountLookup = await db.query(
    `SELECT bank_account_number
       FROM transactions
      WHERE user_id = $1 AND bank_source = $2 AND deleted_at IS NULL
        AND RIGHT(COALESCE(bank_account_number::text, ''), LENGTH($3)) = $3
      GROUP BY bank_account_number
      LIMIT 2`,
    [userId, source, suffix],
  );
  if (accountLookup.rows.length !== 1) return null;
  const accountNumber = String(accountLookup.rows[0].bank_account_number);
  const current = await db.query(
    `SELECT statement_day, included, linked_transaction_id
       FROM financial_card_settings
      WHERE user_id = $1 AND bank_source = $2 AND bank_account_number = $3`,
    [userId, source, accountNumber],
  );
  const previous = current.rows[0];
  let resolvedDay = statementDay === undefined
    ? (previous?.statement_day ?? null)
    : (statementDay == null ? null : Number(statementDay));
  const resolvedIncluded = included === undefined ? previous?.included !== false : included !== false;
  const resolvedLinkedTransactionId = linkedTransactionId === undefined
    ? (previous?.linked_transaction_id || null)
    : (linkedTransactionId || null);
  if (linkedTransactionId) {
    const linked = await db.query(
      `SELECT bank_source,
              EXTRACT(DAY FROM COALESCE(bank_processed_date, date))::int AS statement_day
         FROM transactions
        WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [linkedTransactionId, userId],
    );
    if (!linked.rows.length || institutionKind(linked.rows[0].bank_source) !== 'bank') return null;
    resolvedDay = Number(linked.rows[0].statement_day);
  }
  const { rows } = await db.query(
    `INSERT INTO financial_card_settings (
       user_id, bank_source, bank_account_number, statement_day, included, linked_transaction_id
     ) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, bank_source, bank_account_number) DO UPDATE SET
       statement_day = EXCLUDED.statement_day,
       included = EXCLUDED.included,
       linked_transaction_id = EXCLUDED.linked_transaction_id,
       updated_at = NOW()
     RETURNING bank_source, bank_account_number, statement_day, included, linked_transaction_id, updated_at`,
    [userId, source, accountNumber, resolvedDay, resolvedIncluded, resolvedLinkedTransactionId],
  );
  await invalidateCycleDerivedData(userId);
  return {
    source: rows[0].bank_source,
    accountNumber: String(rows[0].bank_account_number),
    statementDay: rows[0].statement_day == null ? null : Number(rows[0].statement_day),
    included: rows[0].included !== false,
    linkedTransactionId: rows[0].linked_transaction_id || null,
    updatedAt: rows[0].updated_at,
  };
}

async function saveCycleSettings(userId, { engineMode, manualAnchorDay = null, useEstimates }) {
  const anchorDay = engineMode === 'manual' ? Number(manualAnchorDay) : null;
  const { rows } = await db.query(
    `WITH saved AS (
       INSERT INTO financial_cycle_settings (user_id, engine_mode, manual_anchor_day, use_estimates)
       VALUES ($1, $2, $3, COALESCE($4, true))
       ON CONFLICT (user_id) DO UPDATE SET
         engine_mode = EXCLUDED.engine_mode,
         manual_anchor_day = EXCLUDED.manual_anchor_day,
         use_estimates = COALESCE($4, financial_cycle_settings.use_estimates),
         updated_at = NOW()
       RETURNING engine_mode, manual_anchor_day, use_estimates, updated_at
     ), cleared AS (
       DELETE FROM financial_cycle_aggregates WHERE user_id = $1
     )
     SELECT * FROM saved`,
    [userId, engineMode, anchorDay, useEstimates == null ? null : useEstimates !== false],
  );
  await invalidateCycleDerivedData(userId);
  return {
    engineMode: rows[0].engine_mode,
    manualAnchorDay: rows[0].manual_anchor_day == null ? null : Number(rows[0].manual_anchor_day),
    useEstimates: rows[0].use_estimates !== false,
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
     WHERE credit_classifications.user_id = EXCLUDED.user_id
     RETURNING transaction_id, class, reason, updated_at`,
    [transactionId, userId, klass, reason],
  );
  if (!rows.length) return null;
  await invalidateCycleDerivedData(userId);
  return {
    transactionId: rows[0].transaction_id,
    class: rows[0].class,
    reason: rows[0].reason,
    updatedAt: rows[0].updated_at,
  };
}

async function saveTransactionOverride(
  userId,
  transactionId,
  classification,
  reason = null,
  {
    recurrenceKind = null,
    recurrenceEnabled = false,
    recurrenceGroupId = null,
    recurrenceLabel = null,
    recurrenceIncludeEstimate = true,
  } = {},
) {
  let groupId = recurrenceEnabled ? recurrenceGroupId : null;
  let groupLabel = recurrenceEnabled ? String(recurrenceLabel || '').trim() : null;
  let includeEstimate = recurrenceEnabled ? recurrenceIncludeEstimate !== false : true;
  if (recurrenceEnabled && groupId) {
    const existing = await db.query(
      `SELECT recurrence_kind, recurrence_label, recurrence_include_estimate
         FROM cycle_transaction_overrides
        WHERE user_id = $1 AND recurrence_group_id = $2::uuid
        LIMIT 1`,
      [userId, groupId],
    );
    if (!existing.rows.length) return null;
    recurrenceKind = existing.rows[0].recurrence_kind;
    groupLabel = groupLabel || existing.rows[0].recurrence_label;
    includeEstimate = existing.rows[0].recurrence_include_estimate !== false;
  }
  if (recurrenceEnabled && !groupId) groupId = randomUUID();
  if (recurrenceEnabled && !groupLabel) groupLabel = null;
  const { rows } = await db.query(
    `INSERT INTO cycle_transaction_overrides (
       transaction_id, user_id, classification, reason, recurrence_kind, recurrence_enabled,
       recurrence_group_id, recurrence_label, recurrence_include_estimate
     )
     SELECT t.id, t.user_id, $3, $4, $5, $6, $7::uuid, $8, $9
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
       recurrence_kind = EXCLUDED.recurrence_kind,
       recurrence_enabled = EXCLUDED.recurrence_enabled,
       recurrence_group_id = EXCLUDED.recurrence_group_id,
       recurrence_label = EXCLUDED.recurrence_label,
       recurrence_include_estimate = EXCLUDED.recurrence_include_estimate,
       updated_at = NOW()
     WHERE cycle_transaction_overrides.user_id = EXCLUDED.user_id
     RETURNING transaction_id, classification, reason, recurrence_kind, recurrence_enabled,
               recurrence_group_id, recurrence_label, recurrence_include_estimate, updated_at`,
    [
      transactionId, userId, classification, reason, recurrenceKind, recurrenceEnabled === true,
      groupId, groupLabel, includeEstimate,
    ],
  );
  if (!rows.length) return null;
  await invalidateCycleDerivedData(userId);
  return {
    transactionId: rows[0].transaction_id,
    classification: rows[0].classification,
    reason: rows[0].reason,
    recurrenceKind: rows[0].recurrence_kind,
    recurrenceEnabled: rows[0].recurrence_enabled === true,
    recurrenceGroupId: rows[0].recurrence_group_id,
    recurrenceLabel: rows[0].recurrence_label,
    recurrenceIncludeEstimate: rows[0].recurrence_include_estimate !== false,
    updatedAt: rows[0].updated_at,
  };
}

async function deleteTransactionOverride(userId, transactionId) {
  const { rowCount } = await db.query(
    `DELETE FROM cycle_transaction_overrides
      WHERE transaction_id = $1 AND user_id = $2`,
    [transactionId, userId],
  );
  await invalidateCycleDerivedData(userId);
  return rowCount > 0;
}

function buildRecurringGroups(transactionOverrides = []) {
  const groups = new Map();
  for (const item of transactionOverrides) {
    if (!item.recurrenceEnabled || !item.recurrenceKind) continue;
    const id = item.recurrenceGroupId || `legacy-${item.transactionId}`;
    if (!groups.has(id)) {
      groups.set(id, {
        id,
        label: item.recurrenceLabel || item.description || 'Recurring transaction',
        recurrenceKind: item.recurrenceKind,
        includeInEstimate: item.recurrenceIncludeEstimate !== false,
        matchers: [],
      });
    }
    groups.get(id).matchers.push({
      transactionId: item.transactionId,
      description: item.description || '',
      source: item.source || null,
      accountLast4: item.accountNumber == null ? null : String(item.accountNumber).slice(-4),
    });
  }
  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label));
}

async function updateRecurringGroup(userId, groupRef, {
  label,
  includeInEstimate,
  active,
} = {}) {
  let groupId = groupRef;
  if (String(groupRef).startsWith('legacy-')) {
    const transactionId = Number(String(groupRef).slice(7));
    if (!Number.isInteger(transactionId)) return null;
    groupId = randomUUID();
    const promoted = await db.query(
      `UPDATE cycle_transaction_overrides
          SET recurrence_group_id = $3::uuid,
              recurrence_label = COALESCE($4, recurrence_label),
              recurrence_include_estimate = COALESCE($5, recurrence_include_estimate),
              recurrence_enabled = COALESCE($6, recurrence_enabled),
              updated_at = NOW()
        WHERE user_id = $1 AND transaction_id = $2 AND recurrence_enabled = true
        RETURNING transaction_id`,
      [userId, transactionId, groupId, label || null, includeInEstimate, active],
    );
    if (!promoted.rows.length) return null;
  } else {
    const changed = await db.query(
      `UPDATE cycle_transaction_overrides
          SET recurrence_label = COALESCE($3, recurrence_label),
              recurrence_include_estimate = COALESCE($4, recurrence_include_estimate),
              recurrence_enabled = COALESCE($5, recurrence_enabled),
              updated_at = NOW()
        WHERE user_id = $1 AND recurrence_group_id = $2::uuid
        RETURNING transaction_id`,
      [userId, groupId, label || null, includeInEstimate, active],
    );
    if (!changed.rows.length) return null;
  }
  await invalidateCycleDerivedData(userId);
  const groups = buildRecurringGroups(await loadTransactionOverrides(userId));
  return groups.find((group) => group.id === groupId) || { id: groupId, active: false };
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

function resolveCycleWindows({ bankTxns, signatures, settings, asOf, months, salaryClassifications, preparedData }) {
  if (settings.engineMode === 'manual') {
    return {
      anchors: effectiveSalaryAnchors(signatures),
      primary: effectiveSalaryAnchors(signatures)[0] || signatures[0] || null,
      events: [],
      windows: engine.buildFixedDayWindows(settings.manualAnchorDay, { asOf, months }),
    };
  }
  const anchors = effectiveSalaryAnchors(signatures);
  const primary = anchors[0] || signatures[0] || null;
  const anchorDay = engine.latestStatementDay(preparedData?.cardViews || []);
  return {
    anchors,
    primary,
    events: [],
    windows: anchorDay
      ? engine.buildBillingCycleWindows(anchorDay, { asOf, months })
      : [],
  };
}

async function loadCycleInputs(userId, { asOf, months, creditClassifications }) {
  const today = isoDate(asOf);
  const startDate = engine.addMonths(today, -months);
  const endDate = engine.addMonths(today, 2);
  const [
    data, signatures, storedClassifications, salaryClassifications, transactionOverrides, settings,
    cardSettings,
  ] = await Promise.all([
    loadUserData(userId, { startDate, endDate }),
    loadSalarySignatures(userId),
    creditClassifications === undefined
      ? loadCreditClassifications(userId)
      : Promise.resolve(creditClassifications),
    loadSalaryClassifications(userId),
    loadTransactionOverrides(userId),
    loadCycleSettings(userId),
    loadCardSettings(userId),
  ]);
  return {
    ...data,
    signatures,
    storedClassifications,
    salaryClassifications,
    transactionOverrides,
    settings,
    cardSettings,
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
    recurringGroups: [],
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
  const requestEpoch = cacheInvalidationEpoch(userId);

  const {
    bankTxns, cards, signatures, storedClassifications, salaryClassifications,
    transactionOverrides, settings, cardSettings,
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
    cardSettings,
  });
  const { events, windows, primary } = resolveCycleWindows({
    bankTxns,
    signatures,
    settings,
    asOf,
    months: (boundedYears * 12) + 2,
    salaryClassifications,
    preparedData: prepared,
  });
  if (!windows.length) {
    const empty = emptyCycleResult('cycle_anchor_not_found', signatures, prepared.loans, settings);
    if (requestEpoch === cacheInvalidationEpoch(userId)) {
      await syncCycleNotifications(userId, empty);
    }
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
    recurring: prepared.recurring.filter((series) => series.needsUserLabel),
    recurringGroups: buildRecurringGroups(transactionOverrides),
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
    requestEpoch === cacheInvalidationEpoch(userId)
      ? persistClosedCycleAggregates(userId, cycles)
      : Promise.resolve(),
    requestEpoch === cacheInvalidationEpoch(userId)
      ? syncCycleNotifications(userId, result)
      : Promise.resolve(),
  ]);
  return (!skipCache
    && creditClassifications === undefined
    && requestEpoch === cacheInvalidationEpoch(userId))
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
  const requestEpoch = cacheInvalidationEpoch(userId);

  const {
    bankTxns, cards, signatures, storedClassifications, salaryClassifications,
    transactionOverrides, settings, cardSettings,
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
    cardSettings,
  });
  const { windows, primary } = resolveCycleWindows({
    bankTxns,
    signatures,
    settings,
    asOf,
    months: CONTEXT_MONTHS,
    salaryClassifications,
    preparedData: prepared,
  });
  if (!windows.length) {
    const empty = emptyCycleResult('cycle_anchor_not_found', signatures, prepared.loans, settings);
    if (requestEpoch === cacheInvalidationEpoch(userId)) {
      await syncCycleNotifications(userId, empty);
    }
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
    recurring: prepared.recurring.filter((series) => series.needsUserLabel),
    recurringGroups: buildRecurringGroups(transactionOverrides),
    salaryTracking: primary ? engine.trackSalary(salaryTrackingTxns, primary, { asOf }) : null,
    fundingForecast,
    settings,
    salaryChange: null,
  };
  if (requestEpoch === cacheInvalidationEpoch(userId)) {
    await syncCycleNotifications(userId, result);
  }
  return !skipCache && requestEpoch === cacheInvalidationEpoch(userId)
    ? cacheSet(cacheKey, result)
    : result;
}

/**
 * The recurring/loan control tabs need classified source rows, not 26 fully
 * calculated historical cycle summaries. Build one wide control window so
 * card settlements are still suppressed correctly while each source row is
 * classified only once.
 */
async function getCycleControlData(userId, { asOf = new Date(), skipCache = false } = {}) {
  const today = isoDate(asOf);
  const cacheKey = `${userId}:control:${today}`;
  if (!skipCache) {
    const cached = cacheGet(cacheKey);
    if (cached) return cached;
  }
  const requestEpoch = cacheInvalidationEpoch(userId);
  const months = (HISTORY_YEARS * 12) + 2;
  const {
    bankTxns, cards, signatures, storedClassifications, salaryClassifications,
    transactionOverrides, settings, cardSettings,
  } = await loadCycleInputs(userId, { asOf, months });
  if (!bankTxns.length) {
    return {
      status: 'no_bank_data',
      decisions: [],
      loans: [],
      recurring: [],
      recurringGroups: buildRecurringGroups(transactionOverrides),
      totalOutstanding: 0,
      settings,
    };
  }

  const prepared = engine.prepareCycleData({
    bankTxns,
    cards,
    asOf,
    creditClassifications: storedClassifications,
    transactionOverrides,
    cardSettings,
  });
  const primary = effectiveSalaryAnchors(signatures)[0] || signatures[0] || null;
  const start = engine.addMonths(today, -months);
  const end = engine.addMonths(today, 2);
  const fundingForecast = engine.buildFundingForecast(bankTxns, signatures, { asOf });
  const controlCycle = engine.buildCycle({
    bankTxns,
    cards,
    window: {
      index: 0,
      start,
      end,
      effectiveEnd: end,
      running: false,
      projectedEnd: false,
      mode: 'manual',
      anchorDay: null,
      salary: { date: start, amount: 0, txn: null, signature: primary },
    },
    asOf,
    salarySignature: primary,
    salarySignatures: signatures,
    fundingForecast,
    creditClassifications: storedClassifications,
    salaryClassifications,
    transactionOverrides,
    preparedData: prepared,
  });
  const result = {
    status: 'ok',
    decisions: controlCycle.decisions || [],
    loans: prepared.loans,
    recurring: prepared.recurring.filter((series) => series.needsUserLabel),
    recurringGroups: buildRecurringGroups(transactionOverrides),
    totalOutstanding: prepared.loans.reduce((sum, loan) => sum + loan.outstanding, 0),
    settings,
  };
  return !skipCache && requestEpoch === cacheInvalidationEpoch(userId)
    ? cacheSet(cacheKey, result)
    : result;
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
  const result = await getFinancialCycles(userId, {
    asOf,
    years: Math.max(HISTORY_YEARS, currentYear - selectedYear + 1),
  });
  const live = result.cycles
    .filter((cycle) => Number(cycle.window.start.slice(0, 4)) === selectedYear)
    .filter((cycle) => !(cycle.partials || []).length)
    .map(aggregatePayload);
  if (live.length) return summarizeYear(selectedYear, live, 'live');
  // Aggregates are a retention fallback, never a substitute for source rows that
  // can be recalculated with the user's latest classifications and settings.
  const stored = await loadStoredYear(userId, selectedYear);
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
  loadCardSettings,
  saveCreditClassification,
  saveTransactionOverride,
  updateRecurringGroup,
  deleteTransactionOverride,
  saveCardSetting,
  saveCycleSettings,
  getFinancialCycles,
  getCurrentFinancialCycle,
  getCycleControlData,
  getYearReview,
  getAvailableCycleYears,
  invalidateCycleCache,
  invalidateCycleDerivedData,
  summarizeYear,
};
