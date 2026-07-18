const fs = require('fs');
const path = require('path');

const migration = fs.readFileSync(
  path.join(__dirname, '..', 'DB Migrations', '20_data_retention.sql'),
  'utf8'
);
const safeRetention = fs.readFileSync(
  path.join(__dirname, '..', 'DB Migrations', '28_cycle_aggregates_and_safe_retention.sql'),
  'utf8'
);

describe('operational data-retention migration guardrails', () => {
  it('defaults manual execution to a non-destructive dry run', () => {
    expect(migration).toMatch(/run_data_retention\(p_dry_run BOOLEAN DEFAULT true\)/);
    expect(migration).toContain('RETURN preview_data_retention()');
  });

  it('never deletes financial, user, connection, or shopping-item history', () => {
    const protectedTables = [
      'transactions',
      'users',
      'bank_connections',
      'bank_accounts',
      'shopping_items',
      'shopping_shares'
    ];

    for (const table of protectedTables) {
      expect(migration).not.toMatch(new RegExp(`DELETE\\s+FROM\\s+${table}\\b`, 'i'));
    }
  });

  it('preserves the newest sync diagnostic for every connection', () => {
    expect(migration).toMatch(/max\(latest\.id\)/);
    expect(migration).toMatch(/latest\.connection_id = j\.connection_id/);
  });

  it('uses a single named database cron job and bounds its own history', () => {
    expect(migration).toContain("'spendwise-data-retention'");
    expect(migration).toContain('cron.job_run_details');
    expect(migration).toContain('data_retention_runs');
  });

  it('adds a disabled-by-default gate in front of destructive cleanup', () => {
    expect(safeRetention).toMatch(/enabled BOOLEAN NOT NULL DEFAULT false/i);
    expect(safeRetention).toContain("'reason', 'retention_disabled'");
    expect(safeRetention).toContain('run_data_retention_unchecked(false)');
  });

  it('keeps durable cycle totals before raw data can ever be pruned', () => {
    expect(safeRetention).toContain('CREATE TABLE IF NOT EXISTS financial_cycle_aggregates');
    expect(safeRetention).toContain('bank_movement NUMERIC(14,2) NOT NULL');
    expect(safeRetention).toContain('category_totals JSONB NOT NULL');
    expect(safeRetention).not.toMatch(/DELETE\s+FROM\s+transactions\b/i);
  });
});
