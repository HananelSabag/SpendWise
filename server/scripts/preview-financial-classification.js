/** Read-only production preview for calendar classification and card reconciliation. */
process.env.DB_POOL_MAX ||= '1';

const db = require('../config/db');
const { classifyTransaction, summarizeCalendar } = require('../services/financialClassificationService');
const { deriveDebitCardAccounts, reconcile, dateKey } = require('../services/cardReconciliationService');

function shiftedMonth(date, offset = 0) {
  const key = dateKey(date);
  if (!key) return 'unknown';
  const value = new Date(`${key.slice(0, 7)}-01T00:00:00Z`);
  value.setUTCMonth(value.getUTCMonth() + offset);
  return value.toISOString().slice(0, 7);
}

async function main() {
  const identifier = process.argv[2];
  if (!identifier) throw new Error('user id or username is required');
  const userResult = await db.query(
    `SELECT id, username FROM users
      WHERE id = CASE WHEN $1 ~ '^\\d+$' THEN $1::int ELSE -1 END
         OR LOWER(username) = LOWER($1)
         OR LOWER(email) = LOWER($1)
      LIMIT 1`,
    [identifier],
  );
  const user = userResult.rows[0];
  if (!user) throw new Error(`user not found: ${identifier}`);

  const [transactionResult, signatureResult] = await Promise.all([
    db.query(
      `SELECT id, bank_source, bank_account_number, amount, type, description, notes,
              date, transaction_datetime, bank_processed_date, bank_status, bank_sync_id,
              raw_category, original_amount, original_currency, charged_currency, txn_kind,
              installment_number, installment_total, ledger_class,
              settlement_card_source, settlement_card_account
         FROM transactions
        WHERE user_id = $1 AND deleted_at IS NULL
          AND date >= CURRENT_DATE - INTERVAL '120 days'
        ORDER BY date, id`,
      [user.id],
    ),
    db.query('SELECT * FROM salary_signatures WHERE user_id=$1 AND active=true', [user.id]),
  ]);
  const rows = transactionResult.rows;
  const debitCardAccounts = deriveDebitCardAccounts(rows);
  const context = { salarySignatures: signatureResult.rows, debitCardAccounts };
  const byEconomicMonth = new Map();
  for (const row of rows) {
    const classification = classifyTransaction(row, context);
    const month = shiftedMonth(row.date, classification.salary ? classification.monthOffset : 0);
    if (!byEconomicMonth.has(month)) byEconomicMonth.set(month, []);
    byEconomicMonth.get(month).push(row);
  }
  const months = [...byEconomicMonth].sort(([a], [b]) => a.localeCompare(b)).map(([month, monthRows]) => ({
    month,
    transactionCount: monthRows.length,
    totals: summarizeCalendar(monthRows, context).totals,
  }));
  const cardReport = reconcile(rows, context);
  if (process.argv.includes('--summary')) {
    process.stdout.write(`${JSON.stringify({
      mode: 'read-only-preview', user, debitCardAccounts, months,
      reconciliation: {
        unresolvedBankSettlements: cardReport.unresolvedBankSettlements.length,
        unattributedDebit: cardReport.unattributedDebit,
        cards: cardReport.cards.map((card) => ({
          card: `${card.cardSource}:${card.cardAccount}`,
          isDebitCard: card.isDebitCard,
          statements: card.statements.map((statement) => ({
            date: statement.statementDate, status: statement.status,
            bank: statement.bankSettlement.amount, observed: statement.observedTotal,
            delta: statement.delta,
          })),
          matchedImmediateBatches: card.immediate.filter((batch) => batch.status === 'matched').length,
          unmatchedItemizedGroups: card.unmatchedItemizedGroups,
          unmatchedBankSettlements: card.unmatchedBankSettlements,
          debit: card.debit && {
            status: card.debit.status, matchedPairs: card.debit.matchedPairs.length,
            bankOnly: card.debit.bankOnly, cardOnly: card.debit.cardOnly,
          },
        })),
      },
    }, null, 2)}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify({
    mode: 'read-only-preview', user, debitCardAccounts, months,
    reconciliation: {
      unresolvedBankSettlements: cardReport.unresolvedBankSettlements,
      unattributedDebit: cardReport.unattributedDebit,
      cards: cardReport.cards.map((card) => ({
        cardSource: card.cardSource,
        cardAccount: card.cardAccount,
        isDebitCard: card.isDebitCard,
        statements: card.statements,
        immediate: card.immediate,
        debit: card.debit,
        pending: card.pending,
        unprocessedItemized: card.unprocessedItemized,
        unmatchedItemizedGroups: card.unmatchedItemizedGroups,
        unmatchedBankSettlements: card.unmatchedBankSettlements,
      })),
    },
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
}).finally(() => db.pool.end());
