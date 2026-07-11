/**
 * Pure card reconciliation. Calendar spending and provider-statement evidence
 * stay separate: itemized purchases are economic facts; bank settlements are
 * only used to prove completeness and are never added to spending.
 */

const { institutionKind } = require('../config/institutions');
const {
  classifyTransaction,
  CARD_LAST4_IN_MEMO,
  DEBIT_CARD_DESC,
  regexTest,
} = require('./financialClassificationService');

const DEFAULT_TOLERANCE_ABS = 5;
const DEFAULT_TOLERANCE_RATE = 0.005;

const num = (value) => Number(value) || 0;
const round2 = (value) => Math.round((num(value) + Number.EPSILON) * 100) / 100;
const tolerance = (base) => Math.max(DEFAULT_TOLERANCE_ABS, Math.abs(base) * DEFAULT_TOLERANCE_RATE);
const economicAmount = (row) => (row.type === 'income' ? -1 : 1) * Math.abs(num(row.amount));

function dateKey(value) {
  if (!value) return null;
  const text = String(value);
  if (!(value instanceof Date) && /^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = value instanceof Date ? value : new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: process.env.PERIOD_TIMEZONE || 'Asia/Jerusalem',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function dayDistance(a, b) {
  const left = dateKey(a);
  const right = dateKey(b);
  if (!left || !right) return Number.POSITIVE_INFINITY;
  return Math.abs((Date.parse(`${left}T00:00:00Z`) - Date.parse(`${right}T00:00:00Z`)) / 86400000);
}

/** Infer debit cards only when bank evidence names a connected card last-4. */
function deriveDebitCardAccounts(rows) {
  const cardAccounts = new Map();
  for (const row of rows) {
    if (institutionKind(row.bank_source) === 'credit_card' && row.bank_account_number) {
      cardAccounts.set(String(row.bank_account_number), row.bank_source);
    }
  }
  const debit = new Map();
  for (const row of rows) {
    if (institutionKind(row.bank_source) !== 'bank' || row.type !== 'expense'
      || !regexTest(DEBIT_CARD_DESC, row.description)) continue;
    const match = String(row.notes || '').match(CARD_LAST4_IN_MEMO);
    const account = match?.[1];
    if (account && cardAccounts.has(account)) debit.set(account, cardAccounts.get(account));
  }
  return [...debit].map(([account, source]) => ({ source, account }));
}

function groupItemized(items) {
  const grouped = new Map();
  for (const item of items) {
    const processedDate = dateKey(item.r.bank_processed_date) || 'unknown';
    if (!grouped.has(processedDate)) grouped.set(processedDate, []);
    grouped.get(processedDate).push(item);
  }
  return [...grouped].map(([processedDate, list]) => {
    const purchaseDates = [...new Set(list.map(({ r }) => dateKey(r.date)).filter(Boolean))].sort();
    const spanDays = purchaseDates.length > 1
      ? dayDistance(purchaseDates[0], purchaseDates[purchaseDates.length - 1]) : 0;
    const hasInstallments = list.some(({ c, r }) => c.installment || r.txn_kind === 'installments');
    return {
      processedDate,
      total: round2(list.reduce((sum, { r }) => sum + economicAmount(r), 0)),
      count: list.length,
      purchaseDates,
      purchaseSpanDays: spanDays,
      // A statement spans a meaningful purchase window or carries installment
      // rows. Immediate batches can contain many purchases (e.g. 8 Anthropic
      // charges) and may span a few days, so count/"largest amount" are unsafe.
      statementLike: hasInstallments || spanDays >= 7,
      rows: list,
    };
  });
}

function buildStatement(pair, unknownGroup) {
  const { settlement, group } = pair;
  const unknownCandidates = unknownGroup && group
    ? unknownGroup.rows.filter(({ r }) => {
      const distance = dayDistance(r.date, group.processedDate);
      return dateKey(r.date) <= group.processedDate && distance <= 35;
    }) : [];
  const unprocessedCandidateTotal = round2(
    unknownCandidates.reduce((sum, { r }) => sum + economicAmount(r), 0),
  );
  const itemizedTotal = group?.total || 0;
  const observedTotal = round2(itemizedTotal + unprocessedCandidateTotal);
  const delta = round2(settlement.amount - observedTotal);
  let status = 'unavailable';
  let note = 'bank statement exists but its itemized provider group is outside the captured window';
  if (group && settlement.pending) {
    status = 'partial';
    note = 'bank settlement is pending; compare again only after the final bank amount arrives';
  } else if (group && unknownCandidates.length) {
    status = 'partial';
    note = 'some captured purchases have no provider processed date; statement grouping is incomplete';
  } else if (group && Math.abs(delta) <= tolerance(observedTotal)) {
    status = 'matched';
    note = 'final bank settlement matches the captured provider statement';
  } else if (group) {
    status = 'mismatch';
    note = 'both captured sides are final and differ beyond tolerance';
  }
  return {
    statementDate: group?.processedDate || settlement.date,
    bankSettlement: { id: settlement.id, amount: settlement.amount, pending: settlement.pending },
    itemizedTotal,
    itemizedCount: group?.count || 0,
    unprocessedCandidateTotal,
    unprocessedCandidateCount: unknownCandidates.length,
    observedTotal,
    delta,
    status,
    note,
  };
}

function buildImmediate(pair) {
  const { settlement, group } = pair;
  const itemizedAmount = group?.total || 0;
  const delta = round2(settlement.amount - itemizedAmount);
  return {
    processedDate: settlement.date,
    bankId: settlement.id,
    bankAmount: settlement.amount,
    itemizedAmount,
    itemizedCount: group?.count || 0,
    delta,
    status: !group ? 'unmatched'
      : settlement.pending ? 'partial'
        : Math.abs(delta) <= tolerance(itemizedAmount) ? 'matched' : 'mismatch',
    pending: settlement.pending,
  };
}

function buildDebit(source, account, cardEnrichment, bankDebitPrimary, allowUnlabelledBankRows = false) {
  const cardRows = cardEnrichment.filter(({ r }) => r.bank_source === source
    && String(r.bank_account_number || '') === account);
  const bankRows = bankDebitPrimary.filter(({ r }) => {
    const match = String(r.notes || '').match(CARD_LAST4_IN_MEMO);
    return match?.[1] === account || (allowUnlabelledBankRows && !match);
  });
  const unusedBank = new Set(bankRows.map(({ r }) => r.id));
  const matches = [];
  const cardOnly = [];
  for (const card of cardRows) {
    const candidates = bankRows
      .filter(({ r }) => unusedBank.has(r.id) && Math.abs(num(r.amount) - num(card.r.amount)) < 0.01)
      .sort((a, b) => dayDistance(a.r.date, card.r.date) - dayDistance(b.r.date, card.r.date));
    const bank = candidates.find(({ r }) => dayDistance(r.date, card.r.date) <= 5);
    if (!bank) {
      cardOnly.push({ id: card.r.id, amount: round2(card.r.amount), date: dateKey(card.r.date) });
      continue;
    }
    unusedBank.delete(bank.r.id);
    matches.push({ bankId: bank.r.id, cardId: card.r.id, amount: round2(bank.r.amount),
      bankDate: dateKey(bank.r.date), cardDate: dateKey(card.r.date) });
  }
  const bankOnly = bankRows.filter(({ r }) => unusedBank.has(r.id)).map(({ r }) => ({
    id: r.id, amount: round2(r.amount), date: dateKey(r.date), pending: r.bank_status === 'pending',
    note: 'valid primary bank spend; provider enrichment is optional',
  }));
  return {
    matchedPairs: matches,
    bankOnly,
    cardOnly,
    bankPrimaryIds: bankRows.map(({ r }) => r.id),
    bankPrimaryTotal: round2(bankRows.filter(({ r }) => r.bank_status !== 'pending')
      .reduce((sum, { r }) => sum + Math.abs(num(r.amount)), 0)),
    bankPendingTotal: round2(bankRows.filter(({ r }) => r.bank_status === 'pending')
      .reduce((sum, { r }) => sum + Math.abs(num(r.amount)), 0)),
    cardEnrichmentTotal: round2(cardRows.reduce((sum, { r }) => sum + Math.abs(num(r.amount)), 0)),
    status: cardOnly.length ? 'partial' : 'matched',
    note: 'debit uses the bank movement as primary spending; provider rows only enrich it',
  };
}

/** Reconcile independently per provider/card/processed-date group. */
function reconcile(rows, context = {}) {
  const debitCardAccounts = context.debitCardAccounts || deriveDebitCardAccounts(rows);
  const ctx = { ...context, debitCardAccounts };
  const classified = rows.map((r) => ({ r, c: classifyTransaction(r, ctx) }));
  const bankSettlements = classified.filter(({ c }) => c.reconciliation.side === 'bank_settlement');
  const bankDebitPrimary = classified.filter(({ c }) => c.reconciliation.side === 'bank_primary'
    && c.settlementRole === 'debit_direct');
  const cardItemized = classified.filter(({ c }) => c.reconciliation.side === 'card_itemized'
    && c.sourceRole === 'card_itemized');
  const cardEnrichment = classified.filter(({ c }) => c.reconciliation.side === 'card_itemized'
    && c.sourceRole === 'card_enrichment');

  const cardKeys = new Map();
  for (const { r } of [...cardItemized, ...cardEnrichment]) {
    const key = `${r.bank_source}:${r.bank_account_number || ''}`;
    cardKeys.set(key, { source: r.bank_source, account: String(r.bank_account_number || '') });
  }
  const accountsBySource = new Map();
  for (const { source, account } of cardKeys.values()) {
    if (!accountsBySource.has(source)) accountsBySource.set(source, new Set());
    accountsBySource.get(source).add(account);
  }

  const unresolvedBankSettlements = [];
  const settlementsByCard = new Map();
  for (const { r, c } of bankSettlements) {
    const source = c.reconciliation.cardSource;
    const knownAccounts = accountsBySource.get(source) || new Set();
    let account = c.reconciliation.cardAccount;
    if (!account && knownAccounts.size === 1) account = [...knownAccounts][0];
    if (!source || !account || !knownAccounts.has(String(account))) {
      unresolvedBankSettlements.push({ id: r.id, source, account: account || null,
        amount: round2(r.amount), date: dateKey(r.date), pending: r.bank_status === 'pending' });
      continue;
    }
    const key = `${source}:${account}`;
    if (!settlementsByCard.has(key)) settlementsByCard.set(key, []);
    settlementsByCard.get(key).push({
      id: r.id, amount: round2(Math.abs(num(r.amount))), date: dateKey(r.date),
      pending: r.bank_status === 'pending',
    });
  }

  const cards = [];
  for (const { source, account } of cardKeys.values()) {
    const key = `${source}:${account}`;
    const isDebit = debitCardAccounts.some((d) => d.source === source && String(d.account) === account);
    const items = cardItemized.filter(({ r }) => r.bank_source === source
      && String(r.bank_account_number || '') === account);
    const completed = items.filter(({ r }) => r.bank_status !== 'pending');
    const pending = items.filter(({ r }) => r.bank_status === 'pending');
    const groups = groupItemized(completed);
    const unknownGroup = groups.find((g) => g.processedDate === 'unknown') || null;
    const matchableGroups = groups.filter((g) => g.processedDate !== 'unknown');
    const usedGroups = new Set();
    const pairs = (settlementsByCard.get(key) || []).map((settlement) => {
      const group = matchableGroups.find((candidate) => candidate.processedDate === settlement.date
        && !usedGroups.has(candidate.processedDate)) || null;
      if (group) usedGroups.add(group.processedDate);
      return { settlement, group };
    });
    const statementPairs = pairs.filter(({ group }) => group?.statementLike);
    const immediatePairs = pairs.filter(({ group }) => group && !group.statementLike);
    const unmatchedBankSettlements = pairs.filter(({ group }) => !group).map(({ settlement }) => ({
      ...settlement,
      status: settlement.pending ? 'partial' : 'unavailable',
      note: 'bank settlement has no captured provider group; it is not treated as a mismatch',
    }));
    const statements = statementPairs.map((pair) => buildStatement(pair, unknownGroup));
    const immediate = immediatePairs.map(buildImmediate);
    const unmatchedItemizedGroups = matchableGroups.filter((g) => !usedGroups.has(g.processedDate)).map((g) => ({
      processedDate: g.processedDate, total: g.total, count: g.count,
      statementLike: g.statementLike,
      note: g.statementLike
        ? 'forming/future statement with no bank settlement yet'
        : 'immediate provider batch with no captured bank counterpart',
    }));

    cards.push({
      cardSource: source,
      cardAccount: account,
      isDebitCard: isDebit,
      statements,
      monthly: statements[0] || null,
      immediate,
      debit: isDebit ? buildDebit(
        source, account, cardEnrichment, bankDebitPrimary, debitCardAccounts.length === 1,
      ) : null,
      pending: {
        itemizedPending: round2(pending.reduce((sum, { r }) => sum + economicAmount(r), 0)),
        count: pending.length,
        note: 'pending provider purchases stay separate and never create needs_review alone',
      },
      unprocessedItemized: unknownGroup ? { total: unknownGroup.total, count: unknownGroup.count } : null,
      unmatchedItemizedGroups,
      unmatchedBankSettlements,
    });
  }

  const attributedDebitIds = new Set(cards.flatMap((card) => card.debit?.bankPrimaryIds || []));
  const unattributedDebit = bankDebitPrimary.filter(({ r }) => !attributedDebitIds.has(r.id)).map(({ r }) => ({
    id: r.id, amount: round2(r.amount), date: dateKey(r.date), pending: r.bank_status === 'pending',
    note: 'bank debit movement could not be linked to a connected debit card account',
  }));

  return { debitCardAccounts, cards, unresolvedBankSettlements, unattributedDebit };
}

module.exports = {
  reconcile,
  deriveDebitCardAccounts,
  groupItemized,
  buildStatement,
  buildImmediate,
  buildDebit,
  dateKey,
  dayDistance,
};
