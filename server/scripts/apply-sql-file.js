/** Apply one tracked SQL migration inside a transaction. */
const fs = require('fs');
const path = require('path');

process.env.DB_POOL_MAX = '1';
const db = require('../config/db');

async function main() {
  const relative = process.argv[2];
  const apply = process.argv.includes('--apply');
  if (!relative) throw new Error('migration path required');
  const migrationsRoot = path.resolve(__dirname, '..', 'DB Migrations');
  const file = path.resolve(migrationsRoot, relative);
  if (!file.startsWith(migrationsRoot + path.sep)) throw new Error('path must stay inside DB Migrations');
  const sql = fs.readFileSync(file, 'utf8');
  if (!apply) {
    process.stdout.write(`${JSON.stringify({ mode: 'preview', file, bytes: Buffer.byteLength(sql) })}\n`);
    return;
  }
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    process.stdout.write(`${JSON.stringify({ mode: 'applied', file })}\n`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
}).finally(() => db.pool.end());
