/**
 * Guarded reset of synchronized financial data for one user.
 *
 * Dry-run (default):
 *   node scripts/reset-synced-user-data.js <email-or-username>
 *
 * Execute and enqueue one clean job per active connection:
 *   node scripts/reset-synced-user-data.js <email> --execute --enqueue --confirm=<email>
 *
 * Preserves the user, password/auth records, manual transactions and encrypted
 * bank connections and per-account enable/disable choices. Removes transaction
 * and job history and clears synchronized account facts, so the next worker run
 * is a clean diagnostic fixture without changing user preferences.
 */

process.env.DB_POOL_MAX ||= '1';

const db = require('../config/db');

function argument(name) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) || null;
}

async function findUser(identifier, client = db) {
  return (await client.query(
    `SELECT id, username, email
       FROM users
      WHERE LOWER(email)=LOWER($1) OR LOWER(username)=LOWER($1)
      LIMIT 1`,
    [identifier],
  )).rows[0] || null;
}

async function snapshot(userId, client = db) {
  const [connections, accounts, transactions, jobs] = await Promise.all([
    client.query(
      `SELECT id, bank_source, display_name, status, consecutive_failures,
              last_sync_at, last_error, created_at,
              LENGTH(encrypted_credentials)::int AS encrypted_credential_length
         FROM bank_connections
        WHERE user_id=$1
        ORDER BY id`,
      [userId],
    ),
    client.query(
      `SELECT bank_source, account_number, account_type, balance, enabled, last_synced_at
         FROM bank_accounts
        WHERE user_id=$1
        ORDER BY bank_source, account_number`,
      [userId],
    ),
    client.query(
      `SELECT COALESCE(bank_source, 'manual') AS source,
              COALESCE(bank_status, 'unknown') AS status,
              COUNT(*)::int AS count,
              MIN(date)::date AS min_date,
              MAX(date)::date AS max_date,
              ROUND(SUM(CASE WHEN type='income' THEN amount ELSE 0 END)::numeric, 2) AS income,
              ROUND(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END)::numeric, 2) AS expense
         FROM transactions
        WHERE user_id=$1
        GROUP BY COALESCE(bank_source, 'manual'), COALESCE(bank_status, 'unknown')
        ORDER BY source, status`,
      [userId],
    ),
    client.query(
      `SELECT status, trigger, COUNT(*)::int AS count, MAX(requested_at) AS latest
         FROM bank_sync_jobs
        WHERE user_id=$1
        GROUP BY status, trigger
        ORDER BY status, trigger`,
      [userId],
    ),
  ]);
  return {
    connections: connections.rows,
    accounts: accounts.rows,
    transactions: transactions.rows,
    jobs: jobs.rows,
  };
}

async function main() {
  const identifier = process.argv[2];
  const execute = process.argv.includes('--execute');
  const enqueue = process.argv.includes('--enqueue');
  if (!identifier || identifier.startsWith('--')) throw new Error('email or username is required');
  if (enqueue && !execute) throw new Error('--enqueue requires --execute');

  const user = await findUser(identifier);
  if (!user) throw new Error(`user not found: ${identifier}`);
  const before = await snapshot(user.id);

  if (!execute) {
    process.stdout.write(`${JSON.stringify({
      mode: 'dry-run',
      user,
      wouldDelete: {
        synchronizedTransactions: before.transactions
          .filter((item) => item.source !== 'manual')
          .reduce((sum, item) => sum + item.count, 0),
        bankAccountFacts: before.accounts.length,
        syncJobs: before.jobs.reduce((sum, item) => sum + item.count, 0),
      },
      wouldPreserve: {
        user: true,
        passwordAndAuth: true,
        encryptedConnections: before.connections.length,
        accountEnableChoices: before.accounts.length,
        manualTransactions: before.transactions
          .filter((item) => item.source === 'manual')
          .reduce((sum, item) => sum + item.count, 0),
      },
      baseline: before,
    }, null, 2)}\n`);
    return;
  }

  const confirmation = argument('confirm');
  if (!confirmation || confirmation.toLowerCase() !== user.email.toLowerCase()) {
    throw new Error(`refusing reset: pass --confirm=${user.email}`);
  }

  const client = await db.getClient();
  let committed = false;
  try {
    await client.query('BEGIN');
    const lockedUser = await findUser(user.email, client);
    if (!lockedUser || lockedUser.id !== user.id) throw new Error('user changed during reset');

    const credentialsBefore = (await client.query(
      'SELECT id, encrypted_credentials FROM bank_connections WHERE user_id=$1 ORDER BY id FOR UPDATE',
      [user.id],
    )).rows;

    const deletedJobs = await client.query('DELETE FROM bank_sync_jobs WHERE user_id=$1', [user.id]);
    const deletedTransactions = await client.query(
      'DELETE FROM transactions WHERE user_id=$1 AND bank_source IS NOT NULL',
      [user.id],
    );
    const clearedAccounts = await client.query(
      `UPDATE bank_accounts
          SET balance=NULL, last_synced_at=TIMESTAMPTZ '1970-01-01 00:00:00+00'
        WHERE user_id=$1`,
      [user.id],
    );
    await client.query(
      `UPDATE bank_connections
          SET last_sync_at=NULL,
              consecutive_failures=0,
              last_error=NULL,
              status=CASE WHEN status='error' THEN 'active' ELSE status END
        WHERE user_id=$1`,
      [user.id],
    );

    const credentialsAfter = (await client.query(
      'SELECT id, encrypted_credentials FROM bank_connections WHERE user_id=$1 ORDER BY id',
      [user.id],
    )).rows;
    const credentialsUnchanged = credentialsBefore.length === credentialsAfter.length
      && credentialsBefore.every((connection, index) => (
        connection.id === credentialsAfter[index].id
        && connection.encrypted_credentials === credentialsAfter[index].encrypted_credentials
      ));
    if (!credentialsUnchanged) throw new Error('encrypted connection verification failed; rolling back');

    let jobs = [];
    if (enqueue) {
      jobs = (await client.query(
        `INSERT INTO bank_sync_jobs (connection_id, user_id, trigger)
         SELECT id, user_id, 'manual'
           FROM bank_connections
          WHERE user_id=$1 AND status='active'
          ORDER BY id
         RETURNING id, connection_id, status, trigger, requested_at`,
        [user.id],
      )).rows;
    }

    await client.query('COMMIT');
    committed = true;
    const after = await snapshot(user.id, client);
    process.stdout.write(`${JSON.stringify({
      mode: 'executed',
      user,
      deleted: {
        synchronizedTransactions: deletedTransactions.rowCount,
        bankAccountFacts: clearedAccounts.rowCount,
        syncJobs: deletedJobs.rowCount,
      },
      preserved: {
        user: true,
        passwordAndAuth: true,
        encryptedConnections: credentialsAfter.length,
        encryptedCredentialsUnchanged: credentialsUnchanged,
        accountEnableChoices: after.accounts.length,
        manualTransactions: after.transactions
          .filter((item) => item.source === 'manual')
          .reduce((sum, item) => sum + item.count, 0),
      },
      enqueuedJobs: jobs,
      after,
    }, null, 2)}\n`);
  } catch (error) {
    if (!committed) await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

main()
  .catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  })
  .finally(() => db.pool.end());
