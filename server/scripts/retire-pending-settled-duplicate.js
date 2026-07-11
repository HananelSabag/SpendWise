/** Guarded, reversible retirement of one proven pending-to-settled duplicate. */
process.env.DB_POOL_MAX ||= '1';

const db = require('../config/db');
const {
  previewPendingSettledDuplicates,
  retirePendingSettledDuplicate,
} = require('../services/bankPendingDedupService');

async function main() {
  const apply = process.argv.includes('--apply');
  const positional = process.argv.slice(2).filter((arg) => arg !== '--apply');
  const [staleId, settledId] = positional.map(Number);
  if (!Number.isInteger(staleId) || !Number.isInteger(settledId)) {
    throw new Error('usage: node scripts/retire-pending-settled-duplicate.js <stale-id> <settled-id> [--apply]');
  }

  const candidates = await previewPendingSettledDuplicates(null);
  const exact = candidates.filter(
    (row) => Number(row.stale_id) === staleId && Number(row.settled_id) === settledId,
  );
  if (exact.length !== 1) {
    throw new Error(`expected exactly one preview match for ${staleId} -> ${settledId}; found ${exact.length}`);
  }

  if (!apply) {
    process.stdout.write(`${JSON.stringify({ mode: 'preview', candidate: exact[0] }, null, 2)}\n`);
    return;
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const retired = await retirePendingSettledDuplicate(staleId, settledId, client);
    await client.query('COMMIT');
    process.stdout.write(`${JSON.stringify({ mode: 'applied', ...retired, settled_id: settledId })}\n`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
}).finally(() => db.pool.end());
