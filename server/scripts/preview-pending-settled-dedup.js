/** Read-only preview of bank rows re-keyed between pending and completed. */
process.env.DB_POOL_MAX ||= '1';

const db = require('../config/db');
const { previewPendingSettledDuplicates } = require('../services/bankPendingDedupService');

async function main() {
  const rawUserId = process.argv[2];
  const userId = rawUserId ? Number(rawUserId) : null;
  if (rawUserId && (!Number.isInteger(userId) || userId <= 0)) {
    throw new Error('user id must be a positive integer');
  }
  const candidates = await previewPendingSettledDuplicates(userId);
  process.stdout.write(`${JSON.stringify({
    mode: 'preview',
    userId,
    candidateCount: candidates.length,
    candidates,
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
}).finally(() => db.pool.end());
