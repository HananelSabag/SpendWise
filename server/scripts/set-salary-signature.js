process.env.DB_POOL_MAX = '1';
const db = require('../config/db');

const normalize = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();

async function main() {
  const transactionId = Number(process.argv[2]);
  const apply = process.argv.includes('--apply');
  if (!Number.isInteger(transactionId)) throw new Error('transaction id required');
  const result = await db.query(
    `SELECT id, user_id, bank_source, bank_account_number, description, type
       FROM transactions WHERE id=$1 AND deleted_at IS NULL`,
    [transactionId],
  );
  const row = result.rows[0];
  if (!row || row.type !== 'income' || !row.bank_source) throw new Error('transaction is not synced income');
  const signature = {
    userId: row.user_id,
    source: row.bank_source,
    account: row.bank_account_number,
    description: row.description,
    normalized: normalize(row.description),
    monthOffset: -1,
  };
  if (!apply) return process.stdout.write(`${JSON.stringify({ mode: 'preview', signature }, null, 2)}\n`);
  await db.query(
    `INSERT INTO salary_signatures
       (user_id, bank_source, bank_account_number, normalized_description,
        display_description, month_offset, created_from_transaction_id)
     VALUES ($1,$2,$3,$4,$5,-1,$6)
     ON CONFLICT (user_id, bank_source, COALESCE(bank_account_number, ''), normalized_description)
       WHERE active=true
     DO UPDATE SET display_description=EXCLUDED.display_description,
       created_from_transaction_id=EXCLUDED.created_from_transaction_id, updated_at=now()`,
    [row.user_id, row.bank_source, row.bank_account_number, signature.normalized, row.description, row.id],
  );
  process.stdout.write(`${JSON.stringify({ mode: 'applied', signature }, null, 2)}\n`);
}

main().catch((error) => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; })
  .finally(() => db.pool.end());
