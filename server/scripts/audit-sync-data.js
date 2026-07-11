/**
 * Read-only production sync audit for one username.
 * Usage (from server/): node scripts/audit-sync-data.js <user-id-or-username>
 */

// Diagnostics must not compete with the live Render service for Supabase's
// small session pool. pg will queue this script's parallel reads locally.
process.env.DB_POOL_MAX ||= '1';

const db = require('../config/db');
const { buildDashboardData } = require('../services/dashboardService');
const { buildOverview: buildMonthlyAccounting } = require('../services/monthlyAccountingService');

async function main() {
  const identifier = process.argv[2];
  if (!identifier) throw new Error('user id or username is required');

  const userResult = await db.query(
    `SELECT id, username
       FROM users
      WHERE id = CASE WHEN $1 ~ '^\\d+$' THEN $1::int ELSE -1 END
         OR username = $1
      LIMIT 1`,
    [identifier],
  );
  const user = userResult.rows[0];
  if (!user) throw new Error(`user not found: ${identifier}`);

  const result = await db.query(
    `SELECT id, bank_source, bank_account_number, amount, type, description,
            date, transaction_datetime, bank_processed_date, bank_status,
            raw_category, notes
       FROM transactions
      WHERE user_id = $1
        AND deleted_at IS NULL
        AND bank_source IS NOT NULL
        AND date >= CURRENT_DATE - INTERVAL '90 days'
      ORDER BY transaction_datetime DESC`,
    [user.id],
  );

  const bySource = {};
  for (const row of result.rows) {
    const source = row.bank_source;
    bySource[source] ??= { count: 0, pending: 0, processedDates: {} };
    const summary = bySource[source];
    summary.count += 1;
    if (row.bank_status === 'pending') summary.pending += 1;
    const processed = row.bank_processed_date || 'null';
    summary.processedDates[processed] = (summary.processedDates[processed] || 0) + 1;
  }

  const notable = result.rows
    .filter((row) => Number(row.amount) >= 1000 || /הלווא|משכורת|ויזה|horizon/i.test(`${row.description || ''} ${row.notes || ''}`))
    .map((row) => ({
      id: row.id,
      source: row.bank_source,
      amount: row.amount,
      type: row.type,
      description: row.description,
      date: row.date,
      datetime: row.transaction_datetime,
      processed: row.bank_processed_date,
      status: row.bank_status,
      notes: row.notes,
    }));

  const dashboard = await buildDashboardData(user.id);
  const monthlyAccounting = await buildMonthlyAccounting(user.id);
  const retentionResult = await db.query(`
    SELECT
      to_regprocedure('public.preview_data_retention()') IS NOT NULL AS installed,
      EXISTS (
        SELECT 1 FROM cron.job WHERE jobname = 'spendwise-data-retention'
      ) AS scheduled
  `);
  const retention = retentionResult.rows[0];
  if (retention?.installed) {
    const preview = await db.query('SELECT public.preview_data_retention() AS report');
    retention.preview = preview.rows[0]?.report || null;
  }
  process.stdout.write(`${JSON.stringify({
    user,
    bySource,
    notable,
    dashboard: {
      period: dashboard.period,
      summary: dashboard.summary,
      bankCosts: dashboard.bankCosts,
      sources: dashboard.sources,
    },
    monthlyAccounting,
    retention,
  }, null, 2)}\n`);
}

main()
  .catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  })
  .finally(() => db.pool.end());
