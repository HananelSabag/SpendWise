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
