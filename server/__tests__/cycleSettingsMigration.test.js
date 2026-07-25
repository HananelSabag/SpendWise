const fs = require('fs');
const path = require('path');

describe('financial cycle settings migration', () => {
  const sql = fs.readFileSync(
    path.join(__dirname, '..', 'DB Migrations', '33_forward_reset_cycle_settings.sql'),
    'utf8',
  );

  test('stores only reporting configuration and preserves raw transactions', () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS financial_cycle_settings/i);
    expect(sql).toMatch(/engine_mode IN \('automatic', 'manual'\)/i);
    expect(sql).toMatch(/manual_anchor_day BETWEEN 1 AND 31/i);
    expect(sql).toMatch(/calculation_version SET DEFAULT 4/i);
    expect(sql).not.toMatch(/DELETE FROM transactions/i);
  });
});

describe('financial cycle recurring override migration', () => {
  const sql = fs.readFileSync(
    path.join(__dirname, '..', 'DB Migrations', '34_cycle_recurring_overrides_and_estimates.sql'),
    'utf8',
  );

  test('adds only durable user rules and the shared estimate preference', () => {
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS recurrence_kind/i);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS recurrence_enabled/i);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS use_estimates/i);
    expect(sql).toMatch(/calculation_version SET DEFAULT 5/i);
    expect(sql).not.toMatch(/DELETE FROM transactions/i);
  });
});

describe('financial cycle overdraft-limit migration', () => {
  const sql = fs.readFileSync(
    path.join(__dirname, '..', 'DB Migrations', '37_financial_cycle_overdraft_limit.sql'),
    'utf8',
  );

  test('adds a non-negative planning threshold without touching financial data', () => {
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS overdraft_limit/i);
    expect(sql).toMatch(/overdraft_limit >= 0/i);
    expect(sql).not.toMatch(/UPDATE\s+transactions|DELETE\s+FROM\s+transactions/i);
  });
});
