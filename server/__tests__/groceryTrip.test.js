jest.mock('../config/db', () => ({ query: jest.fn(), getClient: jest.fn() }));

const db = require('../config/db');
const { GroceryTrip } = require('../models/GroceryTrip');

const makeClient = () => {
  const statements = [];
  const client = {
    statements,
    query: jest.fn(async (rawSql, params) => {
      // Match on whitespace-normalised SQL so patterns don't have to mirror the
      // query's formatting.
      const sql = String(rawSql).replace(/\s+/g, ' ').trim();
      statements.push({ sql, params });
      if (/UPDATE grocery_trips SET status = 'completed'/i.test(sql)) {
        return { rows: [{ id: 9, status: 'completed' }] };
      }
      if (/INSERT INTO grocery_trips/i.test(sql)) return { rows: [{ id: 10 }] };
      if (/UPDATE grocery_items SET trip_id/i.test(sql)) return { rowCount: 3 };
      if (/UPDATE grocery_lists SET version/i.test(sql)) return { rows: [{ version: '11' }] };
      if (/INSERT INTO grocery_items/i.test(sql)) return { rows: [{ id: 1 }] };
      if (/UPDATE grocery_items SET/i.test(sql)) return { rows: [{ id: 1, version: 2 }] };
      return { rows: [], rowCount: 0 };
    }),
    release: jest.fn(),
  };
  return client;
};

const ran = (client, pattern) =>
  client.statements.some(({ sql }) => new RegExp(pattern, 'i').test(sql));

beforeEach(() => {
  db.query.mockReset();
  db.query.mockResolvedValue({ rows: [], rowCount: 0 });
  db.getClient.mockReset();
});

describe('completing a trip', () => {
  test('archives, opens a fresh trip and bumps the version in one transaction', async () => {
    const client = makeClient();
    db.getClient.mockResolvedValue(client);

    const result = await GroceryTrip.complete(5, 9, 7, { storeName: 'Rami Levy', totalIls: 312.4 });

    expect(result.trip.id).toBe(9);
    expect(result.nextTrip.id).toBe(10);
    expect(ran(client, '^BEGIN$')).toBe(true);
    expect(ran(client, '^COMMIT$')).toBe(true);
    expect(ran(client, "INSERT INTO grocery_trips \\(list_id, status\\) VALUES \\(\\$1, 'active'\\)")).toBe(true);
    expect(ran(client, 'UPDATE grocery_lists SET version = version \\+ 1')).toBe(true);
    expect(client.release).toHaveBeenCalled();
  });

  test('carries unpurchased leftovers into the new list instead of losing them', async () => {
    const client = makeClient();
    db.getClient.mockResolvedValue(client);

    const result = await GroceryTrip.complete(5, 9, 7, {});

    const carry = client.statements.find(({ sql }) => /UPDATE grocery_items SET trip_id/i.test(sql));
    expect(carry.sql).toMatch(/is_purchased = false/);
    expect(carry.params).toEqual([9, 10]);
    expect(result.carriedOver).toBe(3);
  });

  test('purchased items stay with the archived trip', async () => {
    const client = makeClient();
    db.getClient.mockResolvedValue(client);

    await GroceryTrip.complete(5, 9, 7, {});

    expect(ran(client, 'DELETE FROM grocery_items')).toBe(false);
  });

  test('completing a trip that is no longer active changes nothing', async () => {
    const client = makeClient();
    client.query.mockImplementation(async (rawSql) => {
      const sql = String(rawSql).replace(/\s+/g, ' ').trim();
      if (/UPDATE grocery_trips SET status = 'completed'/i.test(sql)) return { rows: [] };
      return { rows: [], rowCount: 0 };
    });
    db.getClient.mockResolvedValue(client);

    const result = await GroceryTrip.complete(5, 9, 7, {});

    expect(result.trip).toBeNull();
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
  });
});

describe('item writes', () => {
  test('a new item lands after the current maximum sort order', async () => {
    const client = makeClient();
    db.getClient.mockResolvedValue(client);

    await GroceryTrip.addItem(9, 5, 7, { name: 'Milk', category_key: 'dairy_eggs' });

    const insert = client.statements.find(({ sql }) => /INSERT INTO grocery_items/i.test(sql));
    expect(insert.sql).toMatch(/COALESCE\(\(SELECT MAX\(sort_order\) \+ 1 FROM grocery_items WHERE trip_id = \$1\), 0\)/i);
  });

  test('a partial edit only touches the fields it was given', async () => {
    const client = makeClient();
    db.getClient.mockResolvedValue(client);

    await GroceryTrip.updateItem(3, 5, { note: 'ripe ones' });

    const update = client.statements.find(({ sql }) => /^UPDATE grocery_items SET/i.test(sql));
    expect(update.sql).toMatch(/note = \$2/);
    expect(update.sql).not.toMatch(/name =/);
    expect(update.sql).not.toMatch(/category_key =/);
    expect(update.sql).toMatch(/version = version \+ 1/);
  });

  test('an expected version turns the write into a compare-and-set', async () => {
    const client = makeClient();
    client.query.mockImplementation(async (rawSql) => {
      const sql = String(rawSql).replace(/\s+/g, ' ').trim();
      if (/^UPDATE grocery_items SET/i.test(sql)) return { rows: [] };
      return { rows: [{ version: '4' }], rowCount: 0 };
    });
    db.getClient.mockResolvedValue(client);

    const result = await GroceryTrip.updateItem(3, 5, { name: 'Milk' }, 2);

    expect(result.conflict).toBe(true);
    expect(result.item).toBeNull();
  });

  test('an edit with nothing to change is a no-op, not an empty UPDATE', async () => {
    const result = await GroceryTrip.updateItem(3, 5, {});

    expect(result.item).toBeNull();
    expect(db.getClient).not.toHaveBeenCalled();
  });

  test('purchase metadata is written by the server, from its own clock', async () => {
    const client = makeClient();
    db.getClient.mockResolvedValue(client);

    await GroceryTrip.setPurchased(3, 5, 7, true);

    const update = client.statements.find(({ sql }) => /is_purchased = \$2/i.test(sql));
    expect(update.sql).toMatch(/purchased_by = CASE WHEN \$2 THEN \$3::int ELSE NULL END/);
    expect(update.sql).toMatch(/purchased_at = CASE WHEN \$2 THEN NOW\(\) ELSE NULL END/);
    expect(update.params).toEqual([3, true, 7]);
  });
});

describe('linking an expense', () => {
  test('only links a completed trip that has none yet', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 9 }] });

    await GroceryTrip.linkTransaction(9, 5, 777);

    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toMatch(/status = 'completed'/);
    expect(sql).toMatch(/transaction_id IS NULL/);
    expect(params).toEqual([9, 5, 777]);
  });

  test('a second attempt returns nothing to link', async () => {
    db.query.mockResolvedValue({ rows: [] });
    await expect(GroceryTrip.linkTransaction(9, 5, 778)).resolves.toBeNull();
  });
});

describe('history', () => {
  test('lists completed trips newest first with their item counts', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await GroceryTrip.getHistory(5, { limit: 10, offset: 0 });

    const [sql] = db.query.mock.calls[0];
    expect(sql).toMatch(/t\.status = 'completed'/);
    expect(sql).toMatch(/ORDER BY t\.completed_at DESC/);
    expect(sql).toMatch(/COUNT\(i\.id\)::int\s+AS item_count/);
    // The stored object path must never leave the server.
    expect(sql).toMatch(/\(t\.receipt_path IS NOT NULL\) AS has_receipt/);
    expect(sql).not.toMatch(/t\.receipt_path,/);
  });
});
