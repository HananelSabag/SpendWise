/**
 * cycleService — feeds the pure cycleEngine with a user's real data.
 *
 * The engine (services/cycleEngine.js) knows nothing about Postgres; this is the only place
 * that translates our stored rows into the engine's normalized shape and back. See
 * FINANCIAL_CYCLE_SPEC.md for the model, and `scripts/verify-cycle-engine.js` for the
 * regression oracle the engine is held to.
 *
 * @module services/cycleService
 */

const db = require('../config/db');
const engine = require('./cycleEngine');
const { institutionKind } = require('../config/institutions');

const SELECT_COLUMNS = `id, bank_source, bank_account_number, amount, type, description, notes,
  date::text AS date, transaction_datetime, bank_processed_date::text AS bank_processed_date,
  bank_status, bank_sync_id, original_amount, original_currency, charged_currency,
  txn_kind, installment_number, installment_total`;

/**
 * The provider's own identifier, which `bank_sync_id` carries as its last colon-separated
 * segment (see bankSyncService: banks get `source:acct:date:e|i+amount:rawId`, card companies
 * get `source:acct:rawId`). It is the key that ties a loan to its repayments (SPEC §3d), so
 * losing it would cost us loan tracking entirely.
 */
function extractIdentifier(bankSyncId) {
  if (!bankSyncId) return null;
  const parts = String(bankSyncId).split(':');
  return parts.length ? parts[parts.length - 1] : null;
}

/**
 * Our rows store a positive `amount` plus a `type`; the engine works in signed amounts, where
 * negative means money left the account. `bank_processed_date` is the day the money actually
 * moves and is the engine's only timing truth — fall back to `date` only when a provider never
 * supplied one.
 */
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
    txnKind: row.txn_kind,
    installments: row.installment_number && row.installment_total
      ? { number: row.installment_number, total: row.installment_total }
      : null,
  };
}

/** Every live synced row for a user, split the way the engine wants it: bank vs cards. */
async function loadUserData(userId) {
  const { rows } = await db.query(
    `/* cycle engine source rows */
     SELECT ${SELECT_COLUMNS}
       FROM transactions
      WHERE user_id = $1
        AND deleted_at IS NULL
        AND bank_source IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
            FROM bank_accounts disabled_account
           WHERE disabled_account.user_id = transactions.user_id
             AND disabled_account.bank_source = transactions.bank_source
             AND disabled_account.account_number = transactions.bank_account_number
             AND disabled_account.enabled = false
        )
      ORDER BY COALESCE(bank_processed_date, date), id`,
    [userId],
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

/** The user's confirmed salary identities (SPEC §5 link 1). */
async function loadSalarySignatures(userId) {
  const { rows } = await db.query(
    `SELECT id, bank_source, bank_account_number, normalized_description, display_description,
            month_offset, cycle_anchor
       FROM salary_signatures
      WHERE user_id = $1 AND active = true
      ORDER BY id`,
    [userId],
  );
  return rows.map((r) => ({
    id: r.id,
    normalizedDescription: r.normalized_description,
    displayDescription: r.display_description,
    bankSource: r.bank_source,
    monthOffset: r.month_offset,
    cycleAnchor: r.cycle_anchor !== false,
  }));
}

/** User-confirmed meanings for credits the engine could only suggest (SPEC section 3e). */
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

/**
 * Persist one answer without trusting a browser-supplied user id or arbitrary transaction.
 * The INSERT ... SELECT proves that the row is this user's live, settled bank credit. Repeating
 * the same answer is an idempotent update, which makes double taps harmless.
 */
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
  return {
    transactionId: rows[0].transaction_id,
    class: rows[0].class,
    reason: rows[0].reason,
    updatedAt: rows[0].updated_at,
  };
}

/**
 * Build every financial cycle for a user, newest last, plus the standing facts the control
 * centre needs (loans, series awaiting a label, salary tracking, job-change suspicion).
 *
 * With no salary linked there is no anchor and therefore no cycle — we return the reason
 * rather than inventing a window, so the UI can ask the user to link their salary (SPEC §5).
 */
async function getFinancialCycles(userId, { asOf = new Date(), creditClassifications } = {}) {
  const [{ bankTxns, cards }, signatures, storedClassifications] = await Promise.all([
    loadUserData(userId),
    loadSalarySignatures(userId),
    creditClassifications === undefined
      ? loadCreditClassifications(userId)
      : Promise.resolve(creditClassifications),
  ]);

  if (!bankTxns.length) {
    return { status: 'no_bank_data', cycles: [], signatures, loans: [], recurring: [] };
  }
  if (!signatures.length) {
    return { status: 'salary_not_linked', cycles: [], signatures, loans: engine.deriveLoans(bankTxns), recurring: [] };
  }

  // A user can have more than one salary identity over time — a job change leaves the old
  // employer's payments in history, and those months still deserve correct windows.
  const anchorSignatures = signatures.filter((signature) => signature.cycleAnchor !== false);
  const effectiveAnchors = anchorSignatures.length ? anchorSignatures : signatures;
  const salaryEvents = effectiveAnchors
    .flatMap((sig) => engine.findSalaryEvents(bankTxns, sig).map((e) => ({ ...e, signature: sig })))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (!salaryEvents.length) {
    return { status: 'salary_never_seen', cycles: [], signatures, loans: engine.deriveLoans(bankTxns), recurring: [] };
  }

  const windows = engine.buildWindows(salaryEvents, { asOf });
  const cycles = windows.map((window) => engine.buildCycle({
    bankTxns,
    cards,
    window,
    asOf,
    salarySignature: window.salary.signature,
    creditClassifications: storedClassifications,
  }));

  const loans = engine.deriveLoans(bankTxns);
  const latest = effectiveAnchors[effectiveAnchors.length - 1];

  // Bank lines that are really a card's own charges must never be offered for labelling —
  // the engine already explains them, and asking about them is noise.
  const cardSettlementLines = engine.reconcile(
    bankTxns,
    cards
      .flatMap((c) => engine.buildCardView(c.txns, { bankTxns, asOf }).events)
      .filter((e) => !e.future),
  ).matched.map((m) => m.bankTxn);

  return {
    status: 'ok',
    cycles,
    current: cycles.find((c) => c.window.running) || cycles[cycles.length - 1] || null,
    signatures,
    loans,
    totalOutstanding: loans.reduce((sum, l) => sum + l.outstanding, 0),
    recurring: engine.deriveRecurringCharges(bankTxns, {
      knownLoanIds: loans.map((l) => l.identifier),
      excludeTxns: cardSettlementLines,
    }),
    salaryTracking: engine.trackSalary(bankTxns, latest, { asOf }),
    salaryChange: engine.detectSalaryChange(bankTxns, latest, { asOf, cards }),
  };
}

module.exports = {
  extractIdentifier,
  toNormalized,
  loadUserData,
  loadSalarySignatures,
  loadCreditClassifications,
  saveCreditClassification,
  getFinancialCycles,
};
