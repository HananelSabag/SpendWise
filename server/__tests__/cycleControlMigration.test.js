const fs = require('fs');
const path = require('path');

const sql = fs.readFileSync(
  path.join(__dirname, '..', 'DB Migrations', '32_cycle_control_and_audit.sql'),
  'utf8',
);

describe('financial-cycle Control migration', () => {
  test('stores user decisions separately from immutable bank rows', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS cycle_transaction_overrides');
    expect(sql).toContain('transaction_id integer PRIMARY KEY REFERENCES transactions(id)');
    expect(sql).toContain("'salary', 'income', 'financing', 'refund', 'expense', 'transfer', 'exclude'");
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
    expect(sql).not.toMatch(/DELETE\s+FROM\s+transactions/i);
  });

  test('deduplicates unresolved cycle alerts and versions only derived aggregates', () => {
    expect(sql).toContain('notifications_cycle_issue_unread_idx');
    expect(sql).toContain("type = 'cycle_action_required'");
    expect(sql).toContain('ALTER COLUMN calculation_version SET DEFAULT 3');
    expect(sql).toContain('DELETE FROM financial_cycle_aggregates');
  });
});
