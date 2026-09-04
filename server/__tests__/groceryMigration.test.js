const fs = require('fs');
const path = require('path');

const migration = fs.readFileSync(
  path.join(__dirname, '..', 'DB Migrations', '40_grocery_lists.sql'),
  'utf8',
);

const { CATEGORY_KEYS } = require('../services/groceryCategories');

describe('grocery list migration', () => {
  test('runs as one all-or-nothing transaction', () => {
    expect(migration).toMatch(/^\s*BEGIN;/m);
    expect(migration).toMatch(/^COMMIT;/m);
  });

  test('creates the list-centric tables', () => {
    for (const table of [
      'grocery_lists',
      'grocery_list_members',
      'grocery_list_invitations',
      'grocery_trips',
      'grocery_items',
    ]) {
      expect(migration).toMatch(new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`, 'i'));
    }
  });

  test('allows exactly one active trip per list', () => {
    expect(migration).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS uq_grocery_trips_active[\s\S]*?ON grocery_trips\(list_id\) WHERE status = 'active'/i,
    );
  });

  test('allows at most one pending invitation per list + email', () => {
    expect(migration).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS uq_grocery_invitation_pending[\s\S]*?WHERE status = 'pending'/i,
    );
  });

  test('a trip can back at most one SpendWise expense', () => {
    expect(migration).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS uq_grocery_trips_transaction[\s\S]*?ON grocery_trips\(transaction_id\) WHERE transaction_id IS NOT NULL/i,
    );
  });

  // Migration 42 widened this list; assert against the migration that owns it
  // now, so the server's keys and the live CHECK constraint cannot drift apart.
  test('the effective category CHECK matches the server list exactly', () => {
    const aisles = fs.readFileSync(
      path.join(__dirname, '..', 'DB Migrations', '42_grocery_aisles_and_item_locks.sql'),
      'utf8',
    );
    const match = aisles.match(/category_key IN \(([\s\S]*?)\)\)/);
    expect(match).toBeTruthy();

    const inMigration = [...match[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(inMigration.sort()).toEqual([...CATEGORY_KEYS].sort());
  });

  test('purchase state and timestamp cannot disagree', () => {
    expect(migration).toMatch(/chk_grocery_item_purchase/);
    expect(migration).toMatch(/is_purchased = false AND purchased_at IS NULL/);
    expect(migration).toMatch(/is_purchased = true\s+AND purchased_at IS NOT NULL/);
  });

  test('the edit lease columns can only be set or cleared together', () => {
    expect(migration).toMatch(/chk_grocery_lists_lock_pairing/);
  });

  test('invitation emails are stored lowercased', () => {
    expect(migration).toMatch(/CHECK \(invitee_email = LOWER\(invitee_email\)\)/i);
  });

  test('retires the superseded wishlist tables and its Hebrew notifications', () => {
    expect(migration).toMatch(/DROP TABLE IF EXISTS shopping_invitations CASCADE/i);
    expect(migration).toMatch(/DROP TABLE IF EXISTS shopping_shares\s+CASCADE/i);
    expect(migration).toMatch(/DROP TABLE IF EXISTS shopping_items\s+CASCADE/i);
    expect(migration).toMatch(/DELETE FROM notifications WHERE type LIKE 'shopping%'/i);
  });

  test('documents verification and rollback', () => {
    expect(migration).toMatch(/VERIFICATION/);
    expect(migration).toMatch(/ROLLBACK \(destructive/);
  });
});

describe('open link invitations migration', () => {
  const linkMigration = fs.readFileSync(
    path.join(__dirname, '..', 'DB Migrations', '41_grocery_link_invitations.sql'),
    'utf8',
  );

  test('runs as one all-or-nothing transaction', () => {
    expect(linkMigration).toMatch(/^\s*BEGIN;/m);
    expect(linkMigration).toMatch(/^COMMIT;/m);
  });

  test('lets an invitation exist without a recipient', () => {
    expect(linkMigration).toMatch(
      /ALTER TABLE grocery_list_invitations\s+ALTER COLUMN invitee_email DROP NOT NULL/i,
    );
  });

  // Postgres treats NULLs as distinct in the existing (list_id, invitee_email)
  // index, so without this one a list could accumulate open links and "revoke"
  // would only kill whichever one it happened to find.
  test('allows only one open link per list', () => {
    expect(linkMigration).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS uq_grocery_invitation_open_link[\s\S]*?ON grocery_list_invitations\(list_id\)[\s\S]*?WHERE status = 'pending' AND invitee_email IS NULL/i,
    );
  });

  test('documents verification and rollback', () => {
    expect(linkMigration).toMatch(/VERIFICATION/);
    expect(linkMigration).toMatch(/ROLLBACK:/);
  });
});

describe('aisles + per-item locking migration', () => {
  const aisles = fs.readFileSync(
    path.join(__dirname, '..', 'DB Migrations', '42_grocery_aisles_and_item_locks.sql'),
    'utf8',
  );

  test('runs as one all-or-nothing transaction', () => {
    expect(aisles).toMatch(/^\s*BEGIN;/m);
    expect(aisles).toMatch(/^COMMIT;/m);
  });

  test('adds the two aisles Israeli supermarkets actually shelve separately', () => {
    expect(aisles).toMatch(/'alcohol'/);
    expect(aisles).toMatch(/'disposables'/);
  });

  test('adds a per-item edit claim', () => {
    expect(aisles).toMatch(/ADD COLUMN IF NOT EXISTS editing_user_id/i);
    expect(aisles).toMatch(/ADD COLUMN IF NOT EXISTS editing_until/i);
  });

  // The whole point of the change: one person editing must not freeze the list.
  test('retires the list-level lease columns', () => {
    for (const column of [
      'lock_user_id', 'lock_session_id', 'lock_token',
      'lock_acquired_at', 'lock_expires_at',
    ]) {
      expect(aisles).toMatch(new RegExp(`DROP COLUMN IF EXISTS ${column}`, 'i'));
    }
  });

  test('keeps `version`, which live polling depends on', () => {
    expect(aisles).not.toMatch(/DROP COLUMN IF EXISTS version/i);
  });

  test('documents verification and rollback', () => {
    expect(aisles).toMatch(/VERIFICATION/);
    expect(aisles).toMatch(/ROLLBACK:/);
  });
});
