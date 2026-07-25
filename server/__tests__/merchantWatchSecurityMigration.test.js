const fs = require('fs');
const path = require('path');

const migration = fs.readFileSync(
  path.join(__dirname, '..', 'DB Migrations', '38_merchant_watch_rls.sql'),
  'utf8',
);

describe('merchant watch RLS migration', () => {
  test('makes the API-owned table inaccessible to direct anon/authenticated clients', () => {
    expect(migration).toMatch(
      /ALTER TABLE public\.merchant_watch_rules ENABLE ROW LEVEL SECURITY/i,
    );
    expect(migration).not.toMatch(/CREATE\s+POLICY/i);
  });
});
