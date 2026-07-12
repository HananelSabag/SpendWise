const fs = require('fs');
const path = require('path');

const migration = fs.readFileSync(
  path.join(__dirname, '..', 'DB Migrations', '24_merchant_watch_rules.sql'),
  'utf8',
);

describe('merchant watch migration', () => {
  test('keeps rules user-owned and auditable without mutating transactions', () => {
    expect(migration).toMatch(/user_id INTEGER NOT NULL REFERENCES users\(id\) ON DELETE CASCADE/i);
    expect(migration).toMatch(/created_from_transaction_id INTEGER REFERENCES transactions\(id\) ON DELETE SET NULL/i);
    expect(migration).toMatch(/condition IN \('all', 'above', 'exact'\)/i);
    expect(migration).not.toMatch(/UPDATE\s+transactions|DELETE\s+FROM\s+transactions/i);
  });
});
