/**
 * Financial Classification Service — a pure, deterministic classification layer
 * for bank/card transactions. It replaces the fragile single-bucket settlement
 * regex (`דביט|ויזה|אשראי`) with explicit, per-signal classification so that:
 *
 *   - every unique economic expense is counted exactly once (calendar model);
 *   - a monthly card settlement bank row is reconciliation evidence, not spend;
 *   - a debit/direct-card purchase is bank-direct spending (the bank row is the
 *     primary fact) and the card-company copy is enrichment only;
 *   - an immediate-charge card purchase is counted once on the card side and its
 *     bank settlement batch is excluded;
 *   - loans, securities and internal transfers are never silently treated as
 *     earned income;
 *   - anything we cannot classify stays visible as `unknown` / `needs_review`
 *     instead of being silently dropped.
 *
 * This module is PURE: no DB, no I/O, no mutation of the input. It reads the
 * fields that already exist on a `transactions` row (base fields, and the
 * migration-23 metadata columns when present) and returns an explicit shape.
 * Monthly-vs-immediate settlement matching and cross-card reconciliation live in
 * `cardReconciliationService.js`, which consumes this classifier.
 *
 * Design note on metadata availability: production rows synced before the
 * migration-23 rollout have NULL `txn_kind` / `installment_*` / `original_*`.
 * Every rule below therefore prefers the structured metadata when present and
 * falls back to deterministic base-field signals (description, notes, account,
 * bank_sync_id suffix) so it works on both old and freshly-synced rows.
 *
 * @module services/financialClassificationService
 */

const { institutionKind } = require('../config/institutions');

// ---------------------------------------------------------------------------
// Named signals. Each is a single, explicit concept — never one broad bucket.
// Hebrew patterns are matched against provider description/notes text.
// ---------------------------------------------------------------------------

const DEBIT_CARD_DESC = /כרטיס\s*דביט/;                 // Leumi debit-card movement
const CASH_DESC = /(משיכת\s*מזומן|משיכה\s*עם\s*קוד)/;   // ATM / coded withdrawal
const LOAN_REPAY_DESC = /(פרעון\s*הלוואה|החזר\s*הלוואה)/; // loan repayment (expense)
const FEE_INTEREST_DESC = /(ריבית|עמלה|עמל\.)/;          // bank fee / interest
const TAX_DESC = /מס\s*הכנסה/;                            // tax
const LOAN_DISBURSE_DESC = /(העמדת\s*הלוא|קבלת\s*הלוא)/;  // loan disbursement (income side)
// Generic securities/investment terms ONLY. Never hardcode an employer/business
// name here — a former employer's salary (job change) must be recognised as income
// via a user-confirmed salary signature, not silently excluded as "securities".
const SECURITY_DESC = /(ניירות\s*ערך|תיק\s*השקעות|קרן\s*נאמנות)/;
const CARD_LAST4_IN_MEMO = /המסתיים\s*ב[-\s]*(\d{3,4})/;  // "…card ending in 8345"
const INSTALLMENT_IN_MEMO = /תשלום\s+(\d+)\s+מתוך\s+(\d+)/; // "payment X of Y"

/**
 * Per-bank settlement descriptors. A bank labels a credit-card *settlement*
 * (the monthly bill paid to the card company) with a bank-specific phrase that
 * does NOT contain the card's own brand — so brand matching is unreliable.
 * Leumi calls the Max bill `לאומי ויזה` and the Cal bill `כרטיסי אשראי`.
 * `כרטיס דביט` is deliberately NOT here: a debit movement is direct bank
 * spending, not a settlement. Extend this per bank; unknown banks fall back to a
 * conservative "looks like a card settlement but unmapped → needs_review".
 *
 * @type {Record<string, Array<{cardSource: string, test: RegExp}>>}
 */
const BANK_SETTLEMENT_DESCRIPTORS = {
  leumi: [
    { cardSource: 'max', test: /לאומי\s*ויזה/ },
    { cardSource: 'visa_cal', test: /כרטיסי\s*אשראי/ },
  ],
};

// A last-resort signal that a bank expense *might* be an unmapped card
// settlement (for banks we have not modelled). Used only to raise needs_review,
// never to silently exclude. Intentionally does NOT include דביט.
const GENERIC_CARD_SETTLEMENT_HINT = /(ויזה|מסטרקארד|master\s*card|isracard|ישראכרט|כאל|מקס\b|אמריקן\s*אקספרס|כרטיסי\s*אשראי)/i;

const CARD_KINDS = new Set(['credit_card']);

function normalizeDescription(text) {
  return String(text || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function regexTest(pattern, value) {
  if (!(pattern instanceof RegExp)) return false;
  pattern.lastIndex = 0;
  return pattern.test(String(value || ''));
}

/** Last 4 digits encoded in a Leumi settlement identifier, e.g. 582254 → 2254. */
function cardAccountFromSyncId(bankSyncId) {
  if (!bankSyncId) return null;
  const ref = String(bankSyncId).split(':').pop() || '';
  const m = ref.match(/(\d{4})$/);
  return m ? m[1] : null;
}

/** Structured installment position from metadata first, else parsed from memo. */
function installmentPosition(txn) {
  const number = Number(txn.installment_number);
  const total = Number(txn.installment_total);
  if (Number.isInteger(number) && Number.isInteger(total) && number > 0 && total > 0) {
    return { number, total };
  }
  const memoMatch = String(txn.notes || '').match(INSTALLMENT_IN_MEMO);
  if (memoMatch) {
    return { number: Number(memoMatch[1]), total: Number(memoMatch[2]) };
  }
  return null;
}

/** True when a card-source row belongs to a known debit card (from context). */
function isDebitCardRow(txn, context) {
  const set = context && context.debitCardAccounts;
  if (!set) return false;
  const account = txn.bank_account_number || '';
  if (Array.isArray(set)) {
    return set.some((d) => (typeof d === 'string'
      ? d === account
      : d.source === txn.bank_source && String(d.account) === String(account)));
  }
  if (set instanceof Set) return set.has(`${txn.bank_source}:${account}`) || set.has(account);
  return false;
}

/** Does this row match one of the user's confirmed salary signatures? */
function matchesSalarySignature(txn, signatures) {
  if (!Array.isArray(signatures) || !signatures.length) return null;
  const desc = normalizeDescription(txn.description);
  return signatures.find((s) => s.bank_source === txn.bank_source
    && (s.bank_account_number == null
      || String(s.bank_account_number) === String(txn.bank_account_number || ''))
    && normalizeDescription(s.normalized_description || s.display_description) === desc) || null;
}

function matchesTransactionSignature(txn, signatures) {
  if (!Array.isArray(signatures)) return null;
  const desc = normalizeDescription(txn.description);
  return signatures.find((s) => (s.bank_source == null || s.bank_source === txn.bank_source)
    && (s.bank_account_number == null
      || String(s.bank_account_number) === String(txn.bank_account_number || ''))
    && normalizeDescription(s.normalized_description || s.display_description || s.description) === desc) || null;
}

/**
 * Classify one transaction row. Pure — returns a new object, never mutates.
 *
 * @param {object} txn  a transactions row (base fields + optional metadata)
 * @param {object} [context]
 * @param {Array}  [context.debitCardAccounts]  card accounts known to be debit
 *   cards, e.g. [{ source: 'max', account: '8345' }]
 * @param {Array}  [context.salarySignatures]   active salary signatures
 * @param {RegExp} [context.securityPattern]    override securities detection
 * @param {RegExp} [context.financingPattern]   override loan-disbursement detection
 * @returns {object} classification
 */
function classifyTransaction(txn, context = {}) {
  if (txn.type !== 'income' && txn.type !== 'expense') {
    return {
      id: txn.id,
      pending: txn.bank_status === 'pending',
      installment: null,
      economicRole: 'unknown', sourceRole: 'unknown', settlementRole: 'unknown',
      calendarInclusion: 'needs_review', direction: 'neutral', confidence: 'low',
      reason: `unrecognised transaction type "${txn.type}"`,
      reconciliation: { include: false, side: 'none', cardSource: null, cardAccount: null },
    };
  }
  const type = txn.type === 'income' ? 'income' : 'expense';
  const description = String(txn.description || '');
  const kind = institutionKind(txn.bank_source);
  const isCard = CARD_KINDS.has(kind);
  const isBank = kind === 'bank';
  const isManual = txn.bank_source == null;
  const pending = txn.bank_status === 'pending';
  const financingPattern = context.financingPattern || LOAN_DISBURSE_DESC;
  const securityPattern = context.securityPattern || SECURITY_DESC;
  const installment = isCard ? installmentPosition(txn) : null;

  const base = {
    id: txn.id,
    pending,
    installment,
    reconciliation: { include: false, side: 'none', cardSource: null, cardAccount: null },
  };

  // 1. Manual entries — user-authored, always their own calendar fact.
  if (isManual) {
    return {
      ...base,
      economicRole: type === 'income' ? 'income' : 'expense',
      sourceRole: 'manual',
      settlementRole: 'none',
      calendarInclusion: 'include',
      direction: type === 'income' ? 'income' : 'spend',
      confidence: 'high',
      reason: 'manual user entry',
    };
  }

  // 2. Card-company rows (max / visa_cal / isracard / amex).
  if (isCard) {
    // 2a. Debit card: the bank row is primary; this itemised copy only enriches.
    if (isDebitCardRow(txn, context)) {
      return {
        ...base,
        economicRole: type === 'income' ? 'income' : 'expense',
        sourceRole: 'card_enrichment',
        settlementRole: 'debit_direct',
        calendarInclusion: 'exclude',
        direction: 'neutral',
        confidence: 'high',
        reason: `debit-card (${txn.bank_source}:${txn.bank_account_number}) itemised copy — bank row is primary`,
        reconciliation: {
          include: true, side: 'card_itemized', cardSource: txn.bank_source,
          cardAccount: String(txn.bank_account_number || ''),
        },
      };
    }
    // 2b. Ordinary credit-card purchase or refund — the spending truth.
    return {
      ...base,
      economicRole: type === 'income' ? 'income' : 'expense',
      sourceRole: 'card_itemized',
      settlementRole: 'none',
      calendarInclusion: 'include',
      direction: type === 'income' ? 'refund' : 'spend',
      confidence: 'high',
      reason: installment
        ? `credit-card installment ${installment.number}/${installment.total} — charged portion counts on purchase date`
        : (type === 'income' ? 'credit-card refund/credit' : 'credit-card itemised purchase'),
      reconciliation: {
        include: true, side: 'card_itemized', cardSource: txn.bank_source,
        cardAccount: String(txn.bank_account_number || ''),
      },
    };
  }

  // 3. Bank rows.
  if (isBank) {
    if (type === 'income') {
      // A user-confirmed salary signature (or an explicit stored ledger class)
      // ALWAYS wins over a text-pattern guess. This is what lets a former
      // employer's salary (job change) be recognised as real income once marked —
      // instead of a hardcoded name silently excluding it as "securities".
      const salary = matchesSalarySignature(txn, context.salarySignatures);
      if (salary || txn.ledger_class === 'salary') {
        return { ...base, economicRole: 'income', sourceRole: 'bank_primary', settlementRole: 'none',
          calendarInclusion: 'include', direction: 'income', salary: true,
          monthOffset: Number.isInteger(salary?.month_offset) ? salary.month_offset : -1,
          confidence: 'high', reason: `salary (${salary ? `signature ${salary.id ?? 'match'}` : 'stored ledger class'})` };
      }
      if (regexTest(financingPattern, description) || txn.ledger_class === 'loan_disbursement') {
        return { ...base, economicRole: 'loan', sourceRole: 'bank_primary', settlementRole: 'none',
          calendarInclusion: 'exclude', direction: 'neutral', confidence: 'high',
          reason: 'loan disbursement — financing, not earned income' };
      }
      if (regexTest(securityPattern, description) || txn.ledger_class === 'security_transfer') {
        return { ...base, economicRole: 'security', sourceRole: 'bank_primary', settlementRole: 'none',
          calendarInclusion: 'exclude', direction: 'neutral', confidence: 'high',
          reason: 'securities/investment transfer — not earned income' };
      }
      if (txn.ledger_class === 'internal_transfer'
        || matchesTransactionSignature(txn, context.internalTransferSignatures)
        || regexTest(context.internalTransferPattern, description)) {
        return { ...base, economicRole: 'transfer', sourceRole: 'bank_primary', settlementRole: 'none',
          calendarInclusion: 'exclude', direction: 'neutral', confidence: 'high',
          reason: 'confirmed internal transfer — not earned income' };
      }
      return { ...base, economicRole: 'income', sourceRole: 'bank_primary', settlementRole: 'none',
        calendarInclusion: 'include', direction: 'income', salary: false, confidence: 'high',
        reason: 'other bank income' };
    }

    // Bank expense. Order matters: debit before any settlement/generic check.
    if (txn.ledger_class === 'internal_transfer'
      || matchesTransactionSignature(txn, context.internalTransferSignatures)
      || regexTest(context.internalTransferPattern, description)) {
      return { ...base, economicRole: 'transfer', sourceRole: 'bank_primary', settlementRole: 'none',
        calendarInclusion: 'exclude', direction: 'neutral', confidence: 'high',
        reason: 'confirmed internal transfer — not economic spending' };
    }
    if (txn.ledger_class === 'debit_direct' || regexTest(DEBIT_CARD_DESC, description)) {
      const memo4 = (String(txn.notes || '').match(CARD_LAST4_IN_MEMO) || [])[1] || null;
      return { ...base, economicRole: 'expense', sourceRole: 'bank_primary', settlementRole: 'debit_direct',
        calendarInclusion: 'include', direction: 'spend', confidence: 'high',
        reason: 'debit-card direct bank spending (primary fact)',
        reconciliation: { include: true, side: 'bank_primary', cardSource: null, cardAccount: memo4 } };
    }

    const descriptors = BANK_SETTLEMENT_DESCRIPTORS[txn.bank_source] || [];
    const matched = descriptors.find((d) => regexTest(d.test, description));
    const storedSettlementSource = String(txn.settlement_card_source || '').trim() || null;
    const settlementSource = storedSettlementSource || matched?.cardSource || null;
    if (settlementSource || txn.ledger_class === 'card_settlement') {
      const resolvedSource = settlementSource || null;
      const explicitAccount = String(txn.settlement_card_account || '').trim() || null;
      // The forensic audit proved that Leumi's Max references end in card 2254.
      // Other settlement references are opaque bank identifiers, not card numbers.
      const inferredMaxAccount = txn.bank_source === 'leumi' && resolvedSource === 'max'
        ? cardAccountFromSyncId(txn.bank_sync_id) : null;
      // Unconnected-card edge case: when the caller tells us which card companies
      // are connected and this settlement's company is NOT among them, there is no
      // itemized purchase detail — so the bank charge IS the real spend (spec §2.3
      // fallback), not just reconciliation. Only applied when connectedCardSources
      // is explicitly provided; otherwise default to reconciliation-only exclusion.
      const connected = context.connectedCardSources;
      const cardConnected = !Array.isArray(connected) || !resolvedSource || connected.includes(resolvedSource);
      if (!cardConnected) {
        return { ...base, economicRole: 'expense', sourceRole: 'bank_primary', settlementRole: 'card_settlement',
          calendarInclusion: 'include', direction: 'spend', confidence: 'high',
          reason: `card settlement (${resolvedSource}) counted as spend — card company not connected (no itemized detail)`,
          reconciliation: { include: false, side: 'none', cardSource: resolvedSource, cardAccount: null } };
      }
      return { ...base, economicRole: 'transfer', sourceRole: 'bank_primary', settlementRole: 'card_settlement',
        calendarInclusion: 'exclude', direction: 'neutral', confidence: resolvedSource ? 'high' : 'medium',
        reason: `card settlement (${resolvedSource || 'unresolved provider'}) — reconciliation evidence, not calendar spend`,
        reconciliation: { include: true, side: 'bank_settlement', cardSource: resolvedSource,
          cardAccount: explicitAccount || inferredMaxAccount } };
    }

    if (regexTest(CASH_DESC, description)) {
      return { ...base, economicRole: 'expense', sourceRole: 'bank_primary', settlementRole: 'none',
        calendarInclusion: 'include', direction: 'spend', confidence: 'high',
        reason: 'ATM / cash withdrawal — bank-direct spending' };
    }
    if (regexTest(LOAN_REPAY_DESC, description)) {
      return { ...base, economicRole: 'loan', sourceRole: 'bank_primary', settlementRole: 'none',
        calendarInclusion: 'include', direction: 'spend', loanRepayment: true, confidence: 'high',
        reason: 'loan repayment — real bank expense and feeds Loans sector' };
    }
    if (regexTest(FEE_INTEREST_DESC, description)) {
      return { ...base, economicRole: 'expense', sourceRole: 'bank_primary', settlementRole: 'none',
        calendarInclusion: 'include', direction: 'spend', confidence: 'high', reason: 'bank fee / interest' };
    }
    if (regexTest(TAX_DESC, description)) {
      return { ...base, economicRole: 'expense', sourceRole: 'bank_primary', settlementRole: 'none',
        calendarInclusion: 'include', direction: 'spend', confidence: 'high', reason: 'tax' };
    }

    // Unmapped bank expense. Default = it IS spending (task rule: ordinary bank
    // expenses count unless explicitly classified out). But if it *looks* like an
    // unmapped card settlement, surface it for review rather than double-counting.
    if (regexTest(GENERIC_CARD_SETTLEMENT_HINT, description)) {
      return { ...base, economicRole: 'unknown', sourceRole: 'bank_primary', settlementRole: 'unknown',
        calendarInclusion: 'needs_review', direction: 'spend', confidence: 'low',
        reason: 'bank expense resembles a card settlement but no descriptor mapped this bank/label' };
    }
    return { ...base, economicRole: 'expense', sourceRole: 'bank_primary', settlementRole: 'none',
      calendarInclusion: 'include', direction: 'spend', confidence: 'medium',
      reason: 'ordinary bank expense (no special class matched)' };
  }

  // 4. Unknown source kind (mis-registered bank_source). Never silently drop.
  return {
    ...base,
    economicRole: 'unknown', sourceRole: 'unknown', settlementRole: 'unknown',
    calendarInclusion: 'needs_review', direction: 'neutral', confidence: 'low',
    reason: `unrecognised bank_source "${txn.bank_source}"`,
  };
}

/**
 * Aggregate a list of rows into the calendar-month performance figures, counting
 * every economic expense once. Pure. Pending rows are reported separately and
 * never create a needs_review by themselves.
 *
 * @param {Array<object>} rows transactions rows
 * @param {object} [context] same context as classifyTransaction
 * @returns {object} totals + the classified rows + any needs_review items
 */
function summarizeCalendar(rows, context = {}) {
  const classified = rows.map((r) => ({ row: r, c: classifyTransaction(r, context) }));
  const acc = {
    earnedIncome: 0, salaryIncome: 0, otherIncome: 0, otherIncomeExcluded: 0,
    cardSpendPosted: 0, cardSpendPending: 0, cardRefunds: 0,
    bankDirectSpend: 0, bankDirectPending: 0, manualSpend: 0,
    excludedSettlement: 0, excludedEnrichment: 0,
    needsReview: [],
  };
  for (const { row, c } of classified) {
    const amt = Math.abs(Number(row.amount) || 0);
    if (c.calendarInclusion === 'needs_review') { acc.needsReview.push({ id: row.id, reason: c.reason }); continue; }
    if (c.calendarInclusion === 'exclude') {
      if (c.settlementRole === 'card_settlement') acc.excludedSettlement += amt;
      else if (c.sourceRole === 'card_enrichment') acc.excludedEnrichment += amt;
      else acc.otherIncomeExcluded += amt; // financing / security / transfer income
      continue;
    }
    // include
    if (c.direction === 'refund') {
      acc.cardRefunds += amt;
    } else if (c.direction === 'income') {
      acc.earnedIncome += amt;
      if (c.salary) acc.salaryIncome += amt;
      else acc.otherIncome += amt;
    } else if (c.sourceRole === 'card_itemized') {
      if (c.pending) acc.cardSpendPending += amt;
      else acc.cardSpendPosted += amt;
    } else if (c.sourceRole === 'manual') {
      acc.manualSpend += amt;
    } else { // bank_primary spend (debit, cash, loan repay, fee, tax, ordinary)
      if (c.pending) acc.bankDirectPending += amt;
      else acc.bankDirectSpend += amt;
    }
  }
  for (const [key, value] of Object.entries(acc)) {
    if (typeof value === 'number') acc[key] = Math.round((value + Number.EPSILON) * 100) / 100;
  }
  const cardSpendNet = Math.max(0, acc.cardSpendPosted - acc.cardRefunds);
  const money = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
  acc.spendActual = money(cardSpendNet + acc.bankDirectSpend + acc.manualSpend);
  acc.spendCommitted = money(acc.spendActual + acc.cardSpendPending + acc.bankDirectPending);
  acc.netActual = money(acc.earnedIncome - acc.spendActual);
  acc.netCommitted = money(acc.earnedIncome - acc.spendCommitted);
  return { totals: acc, classified };
}

// Friendly bucket for an auto-classified bank-direct spend row (no provider
// category). Mirrors the legacy dashboard labels so the UI stays consistent.
function autoBucket(classification) {
  if (classification.settlementRole === 'debit_direct') return 'Card Spending';
  if (classification.loanRepayment || classification.economicRole === 'loan') return 'Loan Payments';
  switch (classification.reason) {
    case 'ATM / cash withdrawal — bank-direct spending': return 'Cash Withdrawals';
    case 'bank fee / interest': return 'Bank Fees & Interest';
    case 'tax': return 'Tax';
    default: return 'Other';
  }
}

/**
 * Spending breakdown that counts every economic expense once, consistent with
 * `summarizeCalendar`. Settlements, debit-card *enrichment* copies, income and
 * refunds are excluded. Card itemized rows bucket by their provider category;
 * bank-direct rows bucket by a friendly auto label. Pure.
 *
 * @param {Array<object>} rows
 * @param {object} [context]
 * @param {number} [limit=12]
 * @returns {Array<{name:string, source:'source'|'auto', amount:number, count:number}>}
 */
function spendingBreakdown(rows, context = {}, limit = 12) {
  const buckets = new Map();
  for (const row of rows) {
    const c = classifyTransaction(row, context);
    if (c.calendarInclusion !== 'include' || c.direction !== 'spend') continue;
    const rawCategory = String(row.raw_category || '').trim();
    const name = rawCategory || autoBucket(c);
    const source = rawCategory ? 'source' : 'auto';
    const key = `${name}|${source}`;
    const bucket = buckets.get(key) || { name, source, amount: 0, count: 0 };
    bucket.amount += Math.abs(Number(row.amount) || 0);
    bucket.count += 1;
    buckets.set(key, bucket);
  }
  return [...buckets.values()]
    .map((b) => ({ ...b, amount: Math.round((b.amount + Number.EPSILON) * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

module.exports = {
  classifyTransaction,
  summarizeCalendar,
  spendingBreakdown,
  // exported for reconciliation + tests
  normalizeDescription,
  cardAccountFromSyncId,
  installmentPosition,
  isDebitCardRow,
  matchesSalarySignature,
  matchesTransactionSignature,
  regexTest,
  BANK_SETTLEMENT_DESCRIPTORS,
  DEBIT_CARD_DESC,
  CARD_LAST4_IN_MEMO,
};
