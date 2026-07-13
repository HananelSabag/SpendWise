/**
 * Read-only financial-cycle audit against raw synchronized rows.
 * Usage (from server/): node scripts/audit-financial-cycle.js <email-or-username>
 */

process.env.DB_POOL_MAX ||= '1';

const db = require('../config/db');
const { institutionKind } = require('../config/institutions');
const { deriveDebitCardAccounts, dateKey } = require('../services/cardReconciliationService');
const { classifyTransaction } = require('../services/financialClassificationService');
const {
  buildCycleFromData,
  buildProjection,
  deriveBillingBoundaries,
  reduceCycleRows,
  resolveCycleWindow,
} = require('../services/cycleRunwayService');

const round2 = (value) => Math.round(((Number(value) || 0) + Number.EPSILON) * 100) / 100;
const accountKey = (source, account) => `${source}:${String(account || '')}`;

function treatmentFor(row, context) {
  const kind = institutionKind(row.bank_source);
  const debitKey = accountKey(row.bank_source, row.bank_account_number);
  if (kind === 'credit_card' && context.debitAccounts.has(debitKey)) return 'excluded_debit_card_enrichment';
  const classification = classifyTransaction(row, context.classification);
  if (classification.settlementRole === 'card_settlement') return classification.calendarInclusion === 'include'
    ? 'bank_card_settlement_unconnected'
    : 'bank_card_settlement_reconciliation';
  if (classification.calendarInclusion === 'exclude') return `excluded_${classification.economicRole}`;
  if (classification.calendarInclusion === 'needs_review') return 'needs_review';
  if (kind === 'credit_card') return row.type === 'income' ? 'card_refund' : 'card_expense';
  if (kind === 'bank') return row.type === 'income' ? 'bank_income' : 'bank_expense';
  return row.type === 'income' ? 'manual_income' : 'manual_expense';
}

function auditActivityDate(row) {
  if (institutionKind(row.bank_source) === 'credit_card'
    && row.bank_status !== 'pending'
    && (row.txn_kind === 'installments' || Number(row.installment_total) > 1)) {
    return dateKey(row.bank_processed_date) || dateKey(row.date);
  }
  return dateKey(row.date);
}

function auditWindow(rows, accounts, window) {
  const debitAccounts = new Set(deriveDebitCardAccounts(rows).map((item) => accountKey(item.source, item.account)));
  const connectedCardSources = accounts
    .filter((account) => account.enabled && institutionKind(account.bank_source) === 'credit_card')
    .map((account) => account.bank_source);
  const context = {
    debitAccounts,
    classification: { connectedCardSources, debitCardAccounts: deriveDebitCardAccounts(rows) },
  };
  const inWindow = rows.filter((row) => {
    const key = auditActivityDate(row);
    return key && key >= window.cycleStart && key < window.cycleEndExclusive;
  });
  const buckets = new Map();
  const notable = [];
  for (const row of inWindow) {
    const treatment = treatmentFor(row, context);
    const amount = Math.abs(Number(row.amount) || 0);
    const bucket = buckets.get(treatment) || { count: 0, total: 0 };
    bucket.count += 1;
    bucket.total += row.type === 'income' ? -amount : amount;
    buckets.set(treatment, bucket);
    const classification = classifyTransaction(row, context.classification);
    if (amount >= 500 || row.type === 'income' || row.bank_status === 'pending' || treatment.includes('settlement')) {
      notable.push({
        id: row.id,
        date: dateKey(row.date),
        processedDate: dateKey(row.bank_processed_date),
        source: row.bank_source,
        account: row.bank_account_number,
        type: row.type,
        status: row.bank_status,
        amount: round2(amount),
        description: row.description,
        ledgerClass: row.ledger_class,
        settlementSource: row.settlement_card_source,
        settlementAccount: row.settlement_card_account,
        cycleTreatment: treatment,
        classifierTreatment: `${classification.calendarInclusion}:${classification.reason}`,
      });
    }
  }
  const reduced = reduceCycleRows(rows, accounts, window);
  return {
    window,
    rawRowCount: inWindow.length,
    treatments: Object.fromEntries([...buckets].map(([key, value]) => [key, {
      count: value.count,
      signedTotal: round2(value.total),
    }])),
    reduced: {
      totals: reduced.totals,
      cardCommitted: reduced.cardCommitted,
      spentActual: reduced.spentActual,
      spentCommitted: reduced.spentCommitted,
      totalIncome: reduced.totalIncome,
      netActual: reduced.netActual,
      netCommitted: reduced.netCommitted,
    },
    notable,
  };
}

async function main() {
  const identifier = process.argv[2];
  if (!identifier) throw new Error('email or username is required');
  const user = (await db.query(
    `SELECT id, username, email, preferences
       FROM users
      WHERE LOWER(email)=LOWER($1) OR LOWER(username)=LOWER($1)
      LIMIT 1`,
    [identifier],
  )).rows[0];
  if (!user) throw new Error(`user not found: ${identifier}`);

  const [transactions, accountResult, signatureResult] = await Promise.all([
    db.query(
      `SELECT id, bank_source, bank_account_number, amount, type, description, notes,
              date, transaction_datetime, bank_processed_date, bank_status, bank_sync_id,
              raw_category, ledger_class, settlement_card_source, settlement_card_account,
              installment_number, installment_total, txn_kind
         FROM transactions
        WHERE user_id=$1 AND deleted_at IS NULL
          AND date >= CURRENT_DATE - INTERVAL '180 days'
        ORDER BY date, id`,
      [user.id],
    ),
    db.query(
      `SELECT bank_source, account_number, balance, enabled
         FROM bank_accounts WHERE user_id=$1 ORDER BY bank_source, account_number`,
      [user.id],
    ),
    db.query('SELECT * FROM salary_signatures WHERE user_id=$1 AND active=true ORDER BY id', [user.id]),
  ]);
  const data = { rows: transactions.rows, accounts: accountResult.rows };
  const today = dateKey(new Date());
  const classificationContext = {
    salarySignatures: signatureResult.rows,
    debitCardAccounts: deriveDebitCardAccounts(data.rows),
  };
  const incomeHistory = data.rows
    .filter((row) => institutionKind(row.bank_source) === 'bank'
      && row.type === 'income' && Math.abs(Number(row.amount) || 0) >= 1000)
    .map((row) => {
      const classification = classifyTransaction(row, classificationContext);
      return {
        id: row.id,
        date: dateKey(row.date),
        amount: round2(row.amount),
        description: row.description,
        role: classification.economicRole,
        salary: classification.salary === true,
        inclusion: classification.calendarInclusion,
      };
    });
  const upcomingCardRows = data.rows
    .filter((row) => institutionKind(row.bank_source) === 'credit_card'
      && (row.bank_status === 'pending' || dateKey(row.bank_processed_date) > today))
    .map((row) => ({
      id: row.id,
      source: row.bank_source,
      account: row.bank_account_number,
      date: dateKey(row.date),
      processedDate: dateKey(row.bank_processed_date),
      status: row.bank_status,
      type: row.type,
      amount: round2(row.amount),
      description: row.description,
      installmentNumber: row.installment_number,
      installmentTotal: row.installment_total,
      transactionKind: row.txn_kind,
    }));
  if (process.argv.includes('--income-only')) {
    process.stdout.write(`${JSON.stringify({
      mode: 'read-only-income',
      salarySignatures: signatureResult.rows,
      incomeHistory,
    }, null, 2)}\n`);
    return;
  }
  const boundaries = deriveBillingBoundaries(data.rows);
  const currentWindow = resolveCycleWindow(boundaries, 0, today);
  const previousWindow = resolveCycleWindow(boundaries, -1, today);
  const current = buildCycleFromData(data, 0, today);
  const previous = buildCycleFromData(data, -1, today);
  const currentAudit = auditWindow(data.rows, data.accounts, currentWindow);
  const previousAudit = auditWindow(data.rows, data.accounts, previousWindow);
  const projection = buildProjection(current, user.preferences?.runway_projection || {});

  if (process.argv.includes('--review-only')) {
    const reviewIds = new Set([
      ...current.needsReview,
      ...previous.needsReview,
    ].map((item) => Number(item.id)));
    const reviewRows = data.rows.filter((row) => reviewIds.has(Number(row.id))).map((row) => ({
      id: row.id,
      source: row.bank_source,
      account: row.bank_account_number,
      date: dateKey(row.date),
      processedDate: dateKey(row.bank_processed_date),
      status: row.bank_status,
      type: row.type,
      amount: round2(row.amount),
      description: row.description,
      notes: row.notes,
      syncId: row.bank_sync_id,
      ledgerClass: row.ledger_class,
      settlementSource: row.settlement_card_source,
      settlementAccount: row.settlement_card_account,
    }));
    process.stdout.write(`${JSON.stringify({
      mode: 'read-only-review',
      user: { id: user.id, username: user.username, email: user.email },
      current: { needsReview: current.needsReview, reconciliation: current.reconciliation },
      previous: { needsReview: previous.needsReview, reconciliation: previous.reconciliation },
      rows: reviewRows,
    }, null, 2)}\n`);
    return;
  }

  if (process.argv.includes('--summary-only')) {
    const summarize = (cycle) => ({
      window: `${cycle.cycleStart}..${cycle.lastDay}`,
      anchor: cycle.anchor,
      income: cycle.money.totalIncome,
      expenses: cycle.money.spentCommitted,
      net: cycle.money.netIncludingSalaryCommitted,
      financingInflows: cycle.money.financingInflows,
      transferInflows: cycle.money.transferInflows,
      cardCommitments: cycle.expected.cardChargesNotYetSettled,
      cardCommitmentsPosted: cycle.expected.cardChargesPosted,
      cardCommitmentsPending: cycle.expected.cardChargesPending,
      checkingBalance: cycle.checkingBalance,
      expectedEndBalance: cycle.isCurrent ? projection.projectedCheckingBalance : null,
      cardBillingCycles: cycle.cardBillingCycles.map((item) => ({
        source: item.bankSource,
        account: item.accountNumber,
        billingDate: item.billingDate,
        total: item.total,
        count: item.count,
      })),
      needsReview: cycle.needsReview,
      model: cycle.model,
    });
    process.stdout.write(`${JSON.stringify({
      mode: 'read-only-summary',
      user: { id: user.id, username: user.username, email: user.email },
      today,
      current: summarize(current),
      previous: summarize(previous),
    }, null, 2)}\n`);
    return;
  }

  if (process.argv.includes('--compact')) {
    const compactCycle = (cycle, audit) => ({
      window: {
        cycleStart: cycle.cycleStart,
        lastDay: cycle.lastDay,
        openedAfterBillingDate: cycle.billing.openedAfterBillingDate,
        nextBillingDate: cycle.billing.nextBillingDate,
      },
      money: cycle.money,
      expected: cycle.expected,
      cardBillingCycles: cycle.cardBillingCycles,
      treatments: audit.treatments,
      reduced: audit.reduced,
      notable: audit.notable,
    });
    process.stdout.write(`${JSON.stringify({
      mode: 'read-only-compact',
      user: { id: user.id, username: user.username, email: user.email },
      today,
      accounts: data.accounts,
      boundaries,
      salarySignatures: signatureResult.rows,
      incomeHistory,
      upcomingCardRows,
      current: compactCycle(current, currentAudit),
      projection,
      previous: compactCycle(previous, previousAudit),
    }, null, 2)}\n`);
    return;
  }

  process.stdout.write(`${JSON.stringify({
    mode: 'read-only',
    user: { id: user.id, username: user.username, email: user.email },
    today,
    accounts: data.accounts,
    boundaries,
    current: {
      calculated: current,
      projection,
      audit: currentAudit,
    },
    previous: {
      calculated: previous,
      audit: previousAudit,
    },
  }, null, 2)}\n`);
}

main()
  .catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  })
  .finally(() => db.pool.end());
