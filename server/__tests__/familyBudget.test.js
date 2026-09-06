/**
 * Family Hub — the arithmetic and the gate.
 *
 * The number this screen exists for ("what's left to live on") is only worth
 * anything if it is not quietly wrong, so the sums are pinned here with a
 * household that looks like a real one: two salaries, charges split across two
 * accounts, a couple of loans, a pension that must NOT be treated as an expense.
 */

const fs = require('fs');
const path = require('path');

const { summarize } = require('../services/familyBudgetService');
const { requireFamilyAccess } = require('../middleware/familyAccess');
const {
  ITEM_KINDS, CATEGORY_KEYS, BALANCE_KINDS,
} = require('../services/familyTaxonomy');

const migration = fs.readFileSync(
  path.join(__dirname, '..', 'DB Migrations', '43_family_hub.sql'),
  'utf8',
);

// Synthetic identities. The real household is an id list in
// `config/familyAccess.js` and nobody's address belongs in a committed test.
const MEMBERS = [
  { id: 1, name: 'Member A' },
  { id: 44, name: 'Member B' },
];

const item = (over) => ({
  kind: 'fixed', name: 'x', amount: 0, owner_user_id: null,
  category_key: 'other', is_active: true, ...over,
});

const balance = (over) => ({
  kind: 'savings', name: 'x', amount: 0, owner_user_id: null, is_active: true, ...over,
});

// A household roughly shaped like the one this was built for.
const ITEMS = [
  item({ kind: 'income', name: 'Salary A', amount: 13000, owner_user_id: 1, category_key: 'salary' }),
  item({ kind: 'income', name: 'Salary B', amount: 9000, owner_user_id: 44, category_key: 'salary' }),
  item({ kind: 'fixed', name: 'Mortgage', amount: 4500, owner_user_id: 44, category_key: 'housing' }),
  item({ kind: 'fixed', name: 'Day care', amount: 3000, owner_user_id: 1, category_key: 'kids' }),
  item({ kind: 'fixed', name: 'Arnona', amount: 600, owner_user_id: 1, category_key: 'housing' }),
  item({ kind: 'fixed', name: 'Utilities', amount: 700, owner_user_id: null, category_key: 'utilities' }),
  item({ kind: 'loan', name: 'Bank loan', amount: 1500, owner_user_id: 1, category_key: 'debt', outstanding_amount: 21000 }),
  item({ kind: 'loan', name: 'Car loan', amount: 1000, owner_user_id: 1, category_key: 'debt', outstanding_amount: 14000 }),
  item({ kind: 'savings', name: 'Monthly saving', amount: 500, owner_user_id: null, category_key: 'savings' }),
  item({ kind: 'variable', name: 'Groceries', amount: 3000, owner_user_id: null, category_key: 'food' }),
  item({ kind: 'variable', name: 'Fuel', amount: 800, owner_user_id: 1, category_key: 'transport' }),
];

const BALANCES = [
  balance({ kind: 'pension', name: 'Pension A', amount: 120000, owner_user_id: 1, monthly_contribution: 1800 }),
  balance({ kind: 'pension', name: 'Pension B', amount: 80000, owner_user_id: 44, monthly_contribution: 1200 }),
  balance({ kind: 'study_fund', name: 'Study fund', amount: 45000, owner_user_id: 1 }),
  balance({ kind: 'savings', name: 'Joint savings', amount: 25000, owner_user_id: null }),
];

describe('family budget arithmetic', () => {
  const summary = summarize(ITEMS, BALANCES, MEMBERS);

  test('the headline is income minus everything already committed', () => {
    expect(summary.monthly.income).toBe(22000);
    expect(summary.monthly.fixed).toBe(8800);
    expect(summary.monthly.loans).toBe(2500);
    expect(summary.monthly.savings).toBe(500);
    expect(summary.monthly.committed).toBe(11800);
    expect(summary.monthly.available).toBe(10200);
  });

  test('variable spending is NOT committed — it is what the leftover is for', () => {
    expect(summary.monthly.variablePlanned).toBe(3800);
    // available (10,200) minus the plan (3,800)
    expect(summary.monthly.projected).toBe(6400);
  });

  test('a pension deposit never becomes an expense', () => {
    // 1,800 + 1,200 of contributions exist in the data...
    expect(summary.assets.monthlyContributions).toBe(3000);
    // ...and change nothing about the month. This is the double-count that
    // would quietly eat ₪3,000 of a net salary that never had it deducted twice.
    expect(summary.monthly.committed).toBe(11800);
    expect(summary.monthly.available).toBe(10200);
  });

  test('per person answers "whose account does this leave from"', () => {
    const memberA = summary.people.find((p) => p.userId === 1);
    const memberB = summary.people.find((p) => p.userId === 44);
    const joint = summary.people.find((p) => p.userId === null);

    // Day care + arnona + both loans land on one account.
    expect(memberA.income).toBe(13000);
    expect(memberA.committed).toBe(6100);
    expect(memberA.available).toBe(6900);

    // The mortgage leaves the other one.
    expect(memberB.income).toBe(9000);
    expect(memberB.committed).toBe(4500);
    expect(memberB.available).toBe(4500);

    // Shared charges belong to nobody rather than being pinned on someone.
    expect(joint.committed).toBe(1200);
    expect(joint.income).toBe(0);
  });

  test('the personal splits add back up to the household total', () => {
    const sum = summary.people.reduce((total, person) => total + person.available, 0);
    expect(sum).toBe(summary.monthly.available);
  });

  test('assets, debt and net worth', () => {
    expect(summary.assets.total).toBe(270000);
    expect(summary.assets.byKind.pension).toBe(200000);
    expect(summary.assets.byOwner['1']).toBe(165000);
    expect(summary.assets.byOwner['44']).toBe(80000);
    expect(summary.debt.total).toBe(35000);
    expect(summary.netWorth).toBe(235000);
  });

  test('a loan with no balance entered is counted monthly but never invented as debt', () => {
    const withUnknown = [...ITEMS, item({ kind: 'loan', name: 'Old loan', amount: 400, owner_user_id: 1 })];
    const result = summarize(withUnknown, BALANCES, MEMBERS);
    expect(result.monthly.loans).toBe(2900);
    expect(result.debt.total).toBe(35000);
    expect(result.debt.loansMissingBalance).toBe(1);
  });

  test('an inactive row leaves every total without being deleted', () => {
    const paused = ITEMS.map((row) => (
      row.name === 'Day care' ? { ...row, is_active: false } : row
    ));
    const result = summarize(paused, BALANCES, MEMBERS);
    expect(result.monthly.fixed).toBe(5800);
    expect(result.monthly.available).toBe(13200);
    expect(result.counts.items).toBe(ITEMS.length);
    expect(result.counts.activeItems).toBe(ITEMS.length - 1);
  });

  test('commitments larger than income read as a deficit, not as zero', () => {
    const tight = [
      item({ kind: 'income', name: 'Salary', amount: 8000, owner_user_id: 1, category_key: 'salary' }),
      item({ kind: 'fixed', name: 'Rent', amount: 7000, owner_user_id: 1, category_key: 'housing' }),
      item({ kind: 'loan', name: 'Loan', amount: 2000, owner_user_id: 1, category_key: 'debt' }),
    ];
    const result = summarize(tight, [], MEMBERS);
    expect(result.monthly.available).toBe(-1000);
    // The share is capped at 1 so a bar can render it, but the money is not.
    expect(result.monthly.committedRatio).toBe(1);
  });

  test('an empty household is all zeros, never NaN', () => {
    const result = summarize([], [], MEMBERS);
    expect(result.monthly.available).toBe(0);
    expect(result.monthly.committedRatio).toBeNull();
    expect(result.netWorth).toBe(0);
    expect(result.people).toHaveLength(3); // both members plus joint
  });
});

describe('family access', () => {
  const run = (user) => {
    const req = { user };
    const res = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; },
    };
    let passed = false;
    requireFamilyAccess(req, res, () => { passed = true; });
    return { passed, res };
  };

  test('both household accounts get in', () => {
    expect(run({ id: 1 }).passed).toBe(true);
    expect(run({ id: 44 }).passed).toBe(true);
  });

  test('everyone else is refused, including an authenticated stranger', () => {
    const stranger = run({ id: 49, email: 'someone.else@example.com' });
    expect(stranger.passed).toBe(false);
    expect(stranger.res.statusCode).toBe(403);
    expect(stranger.res.body.error.code).toBe('FAMILY_FORBIDDEN');

    expect(run(null).passed).toBe(false);
    expect(run({}).passed).toBe(false);
    expect(run({ id: 0 }).passed).toBe(false);
  });

  test('an address only opens the door when the environment supplies it', () => {
    const guest = { id: 77, email: 'guest@example.com' };
    expect(run(guest).passed).toBe(false);

    process.env.FAMILY_HUB_EMAILS = 'guest@example.com';
    try {
      expect(run(guest).passed).toBe(true);
      // Case and stray spacing are normalised on both sides.
      expect(run({ id: 78, email: '  Guest@Example.com ' }).passed).toBe(true);
    } finally {
      delete process.env.FAMILY_HUB_EMAILS;
    }
    expect(run(guest).passed).toBe(false);
  });

  test('the environment can move the household to different accounts', () => {
    process.env.FAMILY_HUB_USER_IDS = '5,6';
    try {
      expect(run({ id: 5 }).passed).toBe(true);
      expect(run({ id: 1 }).passed).toBe(false); // the default no longer applies
    } finally {
      delete process.env.FAMILY_HUB_USER_IDS;
    }
    expect(run({ id: 1 }).passed).toBe(true);
  });

  test('no personal address is hard-coded in the access list', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'config', 'familyAccess.js'),
      'utf8',
    );
    expect(source).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
  });
});

describe('family hub migration', () => {
  test('runs as one all-or-nothing transaction', () => {
    expect(migration).toMatch(/^\s*BEGIN;/m);
    expect(migration).toMatch(/^COMMIT;/m);
  });

  test('creates both tables', () => {
    expect(migration).toMatch(/CREATE TABLE IF NOT EXISTS family_monthly_items\b/i);
    expect(migration).toMatch(/CREATE TABLE IF NOT EXISTS family_balances\b/i);
  });

  test('the CHECK constraints match the server vocabulary exactly', () => {
    const kinds = migration.match(/kind IN \('income'[\s\S]*?\)\)/);
    expect(kinds).toBeTruthy();
    expect([...kinds[0].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort())
      .toEqual([...ITEM_KINDS].sort());

    const categories = migration.match(/category_key IN \(([\s\S]*?)\)\)/);
    expect(categories).toBeTruthy();
    expect([...categories[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort())
      .toEqual([...CATEGORY_KEYS].sort());

    const balanceKinds = migration.match(/kind IN \('savings', 'pension'[\s\S]*?\)\)/);
    expect(balanceKinds).toBeTruthy();
    expect([...balanceKinds[0].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort())
      .toEqual([...BALANCE_KINDS].sort());
  });

  test('the most private table in the app is not left open to the anon key', () => {
    expect(migration).toMatch(/ALTER TABLE family_monthly_items ENABLE ROW LEVEL SECURITY/i);
    expect(migration).toMatch(/ALTER TABLE family_balances\s+ENABLE ROW LEVEL SECURITY/i);
  });
});
