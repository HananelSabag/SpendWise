jest.mock('../config/db', () => ({ query: jest.fn(), getClient: jest.fn() }));
jest.mock('../services/emailService', () => ({ sendGroceryInvite: jest.fn() }));

const db = require('../config/db');
const groceryController = require('../controllers/groceryController');
const { GroceryTrip } = require('../models/GroceryTrip');
const { GroceryList } = require('../models/GroceryList');
const { Transaction } = require('../models/Transaction');
const { Notification } = require('../models/Notification');

const makeRes = () => {
  const res = { statusCode: 200, body: null };
  // `finished` is what tests await: the app's asyncHandler does not return its
  // promise, so there is nothing else to hook onto.
  res.finished = new Promise((resolve) => { res.resolveFinished = resolve; });
  res.status = jest.fn((code) => { res.statusCode = code; return res; });
  res.json = jest.fn((payload) => { res.body = payload; res.resolveFinished(payload); return res; });
  res.set = jest.fn(() => res);
  return res;
};

const makeReq = (overrides = {}) => ({
  user: { id: 7, first_name: 'Hananel', username: 'hananel', email: 'me@example.com' },
  params: {},
  query: {},
  body: {},
  get: () => null,
  groceryList: { id: 5, owner_id: 7, role: 'owner', version: 3 },
  groceryRole: 'owner',
  ...overrides,
});

/**
 * Invoke a controller the way Express does, and resolve when it has actually
 * responded. `asyncHandler` swallows its own promise, so awaiting the call
 * itself would assert against a response that hasn't been written yet.
 */
const run = (handler, req, res) => {
  let fail;
  const errored = new Promise((_, reject) => { fail = reject; });
  handler(req, res, (err) => fail(err || new Error('next() was called without an error')));
  return Promise.race([res.finished, errored]);
};

// Any query a test forgot to stub returns an empty result rather than
// `undefined`, so a missing mock surfaces as a readable assertion failure
// instead of a destructuring crash.
beforeEach(() => {
  jest.restoreAllMocks();
  db.query.mockReset();
  db.query.mockResolvedValue({ rows: [], rowCount: 0 });
  db.getClient.mockReset();
});

describe('item validation', () => {

  test('an item needs a name', async () => {
    const res = makeRes();
    await run(groceryController.addItem, makeReq({ body: { name: '   ' } }), res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('GROCERY_NAME_REQUIRED');
  });

  test('an unknown category is rejected instead of stored', async () => {
    const res = makeRes();
    await run(groceryController.addItem, makeReq({ body: { name: 'Milk', category_key: 'furniture' } }), res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('GROCERY_CATEGORY_INVALID');
  });

  test('a missing category falls back to "other" rather than failing', async () => {
    jest.spyOn(GroceryTrip, 'getActive').mockResolvedValue({ id: 9 });
    const addItem = jest.spyOn(GroceryTrip, 'addItem').mockResolvedValue({ item: { id: 1 }, version: 4 });

    await run(groceryController.addItem, makeReq({ body: { name: 'Milk' } }), makeRes());

    expect(addItem).toHaveBeenCalledWith(9, 5, 7, expect.objectContaining({ category_key: 'other' }));
  });

  test('quantity must be a positive number', async () => {
    const res = makeRes();
    await run(groceryController.addItem, makeReq({ body: { name: 'Milk', quantity: -2 } }), res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('GROCERY_QUANTITY_INVALID');
  });

  test('plain http links are refused', async () => {
    const res = makeRes();
    await run(
      groceryController.addItem,
      makeReq({ body: { name: 'Yogurt', product_url: 'http://shop.example/item' } }),
      res,
    );

    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('GROCERY_PRODUCT_URL_INVALID');
  });
});

describe('purchase state is server-owned', () => {

  test('the purchaser and timestamp come from the session, not the payload', async () => {
    jest.spyOn(GroceryTrip, 'getItemById').mockResolvedValue({ id: 3, list_id: 5, trip_status: 'active' });
    const setPurchased = jest.spyOn(GroceryTrip, 'setPurchased')
      .mockResolvedValue({ item: { id: 3 }, version: 8 });

    await run(
      groceryController.setPurchased,
      makeReq({
        params: { id: '3' },
        // A client trying to claim someone else bought it, an hour ago.
        body: { purchased: true, purchased_by: 999, purchased_at: '2020-01-01T00:00:00Z' },
      }),
      makeRes(),
    );

    expect(setPurchased).toHaveBeenCalledWith(3, 5, 7, true);
  });

  test('an item on another list is not found, not forbidden-with-details', async () => {
    jest.spyOn(GroceryTrip, 'getItemById').mockResolvedValue({ id: 3, list_id: 99, trip_status: 'active' });
    const res = makeRes();

    await run(groceryController.setPurchased, makeReq({ params: { id: '3' } }), res);

    expect(res.statusCode).toBe(404);
    expect(res.body.error.code).toBe('GROCERY_ITEM_NOT_FOUND');
  });

  test('a completed trip stays read-only', async () => {
    jest.spyOn(GroceryTrip, 'getItemById').mockResolvedValue({ id: 3, list_id: 5, trip_status: 'completed' });
    const res = makeRes();

    await run(groceryController.updateItem, makeReq({ params: { id: '3' }, body: { name: 'x' } }), res);

    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe('GROCERY_TRIP_ARCHIVED');
  });

  test('a stale item version conflicts rather than overwriting', async () => {
    jest.spyOn(GroceryTrip, 'getItemById').mockResolvedValue({ id: 3, list_id: 5, trip_status: 'active' });
    jest.spyOn(GroceryTrip, 'updateItem').mockResolvedValue({ item: null, conflict: true });
    const res = makeRes();

    await run(
      groceryController.updateItem,
      makeReq({ params: { id: '3' }, body: { name: 'Milk', version: 2 } }),
      res,
    );

    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe('GROCERY_ITEM_STALE');
  });
});

describe('finishing a trip', () => {

  test('refuses to archive a trip where nothing was picked up', async () => {
    jest.spyOn(GroceryTrip, 'getActive').mockResolvedValue({ id: 9 });
    jest.spyOn(GroceryTrip, 'getItems').mockResolvedValue([{ id: 1, is_purchased: false }]);
    const complete = jest.spyOn(GroceryTrip, 'complete');
    const res = makeRes();

    await run(groceryController.completeTrip, makeReq({ body: {} }), res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('GROCERY_TRIP_EMPTY');
    expect(complete).not.toHaveBeenCalled();
  });

  test('rejects a nonsense total', async () => {
    jest.spyOn(GroceryTrip, 'getActive').mockResolvedValue({ id: 9 });
    const res = makeRes();

    await run(groceryController.completeTrip, makeReq({ body: { totalIls: -5 } }), res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('GROCERY_TOTAL_INVALID');
  });

  test('the total is optional', async () => {
    jest.spyOn(GroceryTrip, 'getActive').mockResolvedValue({ id: 9 });
    jest.spyOn(GroceryTrip, 'getItems').mockResolvedValue([{ id: 1, is_purchased: true }]);
    const complete = jest.spyOn(GroceryTrip, 'complete')
      .mockResolvedValue({ trip: { id: 9 }, carriedOver: 0, version: 10 });
    jest.spyOn(GroceryList, 'getMembers').mockResolvedValue([{ user_id: 7 }]);

    const res = makeRes();
    await run(groceryController.completeTrip, makeReq({ body: { storeName: 'Rami Levy' } }), res);

    expect(res.statusCode).toBe(200);
    expect(complete).toHaveBeenCalledWith(5, 9, 7, expect.objectContaining({
      storeName: 'Rami Levy',
      totalIls: null,
    }));
  });

  test('tells the other members, not the person who pressed the button', async () => {
    jest.spyOn(GroceryTrip, 'getActive').mockResolvedValue({ id: 9 });
    jest.spyOn(GroceryTrip, 'getItems').mockResolvedValue([{ id: 1, is_purchased: true }]);
    jest.spyOn(GroceryTrip, 'complete').mockResolvedValue({ trip: { id: 9 }, carriedOver: 2, version: 10 });
    jest.spyOn(GroceryList, 'getMembers').mockResolvedValue([{ user_id: 7 }, { user_id: 44 }]);
    const notify = jest.spyOn(Notification, 'create').mockResolvedValue({});

    await run(groceryController.completeTrip, makeReq({ body: {} }), makeRes());

    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith(44, 'grocery_trip_completed', expect.any(String), expect.any(String), expect.any(Object));
  });
});

describe('SpendWise linkage stays manual and single-shot', () => {

  test('an already-linked trip returns the existing expense without creating another', async () => {
    jest.spyOn(GroceryTrip, 'getTrip').mockResolvedValue({
      id: 9, status: 'completed', transaction_id: 555, total_ils: '250.00',
    });
    const create = jest.spyOn(Transaction, 'create');
    const res = makeRes();

    await run(groceryController.linkToSpendWise, makeReq({ params: { id: '9' } }), res);

    expect(create).not.toHaveBeenCalled();
    expect(res.body.data).toEqual({ transactionId: 555, created: false });
  });

  test('an unfinished trip cannot create an expense', async () => {
    jest.spyOn(GroceryTrip, 'getTrip').mockResolvedValue({ id: 9, status: 'active', total_ils: '250.00' });
    const res = makeRes();

    await run(groceryController.linkToSpendWise, makeReq({ params: { id: '9' } }), res);

    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe('GROCERY_TRIP_NOT_COMPLETED');
  });

  test('a trip with no total asks for one instead of booking zero', async () => {
    jest.spyOn(GroceryTrip, 'getTrip').mockResolvedValue({
      id: 9, status: 'completed', transaction_id: null, total_ils: null,
    });
    const res = makeRes();

    await run(groceryController.linkToSpendWise, makeReq({ params: { id: '9' } }), res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('GROCERY_TOTAL_REQUIRED');
  });

  test('creates one expense dated to the shop and links it to the trip', async () => {
    jest.spyOn(GroceryTrip, 'getTrip').mockResolvedValue({
      id: 9,
      status: 'completed',
      transaction_id: null,
      total_ils: '312.40',
      store_name: 'Shufersal',
      completed_at: '2026-09-02T17:30:00.000Z',
    });
    const create = jest.spyOn(Transaction, 'create').mockResolvedValue({ id: 777 });
    jest.spyOn(GroceryTrip, 'linkTransaction').mockResolvedValue({ id: 9, transaction_id: 777 });
    const res = makeRes();

    await run(groceryController.linkToSpendWise, makeReq({ params: { id: '9' } }), res);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 312.4,
        type: 'expense',
        description: 'Shufersal',
        date: '2026-09-02',
      }),
      7,
    );
    expect(res.statusCode).toBe(201);
    expect(res.body.data).toEqual({ transactionId: 777, created: true });
  });

  test('a lost race retracts the expense it just made instead of double-charging', async () => {
    jest.spyOn(GroceryTrip, 'getTrip')
      .mockResolvedValueOnce({
        id: 9, status: 'completed', transaction_id: null, total_ils: '100.00',
        completed_at: '2026-09-02T17:30:00.000Z',
      })
      .mockResolvedValueOnce({ id: 9, transaction_id: 555 });
    jest.spyOn(Transaction, 'create').mockResolvedValue({ id: 777 });
    jest.spyOn(GroceryTrip, 'linkTransaction').mockResolvedValue(null);
    const remove = jest.spyOn(Transaction, 'delete').mockResolvedValue({});
    const res = makeRes();

    await run(groceryController.linkToSpendWise, makeReq({ params: { id: '9' } }), res);

    expect(remove).toHaveBeenCalledWith(777, 7);
    expect(res.body.data).toEqual({ transactionId: 555, created: false });
  });
});

describe('live polling', () => {
  test('an unchanged version answers without loading the list', async () => {
    jest.spyOn(GroceryList, 'getVersion').mockResolvedValue(12);
    const getItems = jest.spyOn(GroceryTrip, 'getItems');
    const res = makeRes();

    await run(groceryController.getState, makeReq({ query: { version: '12' } }), res);

    expect(res.body.data).toEqual({ unchanged: true, version: 12 });
    expect(getItems).not.toHaveBeenCalled();
  });

  test('a changed version returns the whole list', async () => {
    jest.spyOn(GroceryList, 'getVersion').mockResolvedValue(13);
    jest.spyOn(GroceryList, 'getMembers').mockResolvedValue([]);
    jest.spyOn(GroceryTrip, 'getActive').mockResolvedValue({ id: 9, created_at: 'x' });
    jest.spyOn(GroceryTrip, 'getItems').mockResolvedValue([]);
    const res = makeRes();

    await run(groceryController.getState, makeReq({ query: { version: '12' } }), res);

    expect(res.body.data.unchanged).toBeUndefined();
    expect(res.body.data.list.version).toBe(13);
  });

  // The state payload no longer carries a list-wide lock at all.
  test('the payload has no list-level lock', async () => {
    jest.spyOn(GroceryList, 'getVersion').mockResolvedValue(3);
    jest.spyOn(GroceryList, 'getMembers').mockResolvedValue([]);
    jest.spyOn(GroceryTrip, 'getActive').mockResolvedValue({ id: 9, created_at: 'x' });
    jest.spyOn(GroceryTrip, 'getItems').mockResolvedValue([]);
    const res = makeRes();

    await run(groceryController.getState, makeReq(), res);

    expect(res.body.data.lock).toBeUndefined();
  });

  test('members see the list but not who else was invited', async () => {
    jest.spyOn(GroceryList, 'getVersion').mockResolvedValue(3);
    jest.spyOn(GroceryList, 'getMembers').mockResolvedValue([{ user_id: 7 }]);
    jest.spyOn(GroceryTrip, 'getActive').mockResolvedValue({ id: 9, created_at: 'x' });
    jest.spyOn(GroceryTrip, 'getItems').mockResolvedValue([]);
    const { GroceryInvitation } = require('../models/GroceryInvitation');
    jest.spyOn(GroceryInvitation, 'getPendingForList')
      .mockResolvedValue([{ id: 1, invitee_email: 'someone@example.com' }]);

    const res = makeRes();
    await run(
      groceryController.getState,
      makeReq({ groceryList: { id: 5, owner_id: 1, role: 'member', version: 3 }, groceryRole: 'member' }),
      res,
    );

    expect(res.body.data.pendingInvitations).toEqual([]);
  });
});

describe('per-item edit claim', () => {
  test('claims a free item', async () => {
    jest.spyOn(GroceryTrip, 'getItemById').mockResolvedValue({ id: 3, list_id: 5 });
    jest.spyOn(GroceryTrip, 'claimItem').mockResolvedValue({ id: 3, editing_until: 'later' });
    const res = makeRes();

    await run(groceryController.claimItem, makeReq({ params: { id: '3' } }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.expiresAt).toBe('later');
  });

  test('refuses a claim held by someone else, and names them', async () => {
    jest.spyOn(GroceryTrip, 'getItemById').mockResolvedValue({ id: 3, list_id: 5 });
    jest.spyOn(GroceryTrip, 'claimItem').mockResolvedValue(null);
    jest.spyOn(GroceryTrip, 'getItemClaim').mockResolvedValue({ editing_by_name: 'Nofar' });
    const res = makeRes();

    await run(groceryController.claimItem, makeReq({ params: { id: '3' } }), res);

    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe('GROCERY_ITEM_BUSY');
    expect(res.body.error.editingBy).toBe('Nofar');
  });

  test('an item on another list cannot be claimed', async () => {
    jest.spyOn(GroceryTrip, 'getItemById').mockResolvedValue({ id: 3, list_id: 99 });
    const claim = jest.spyOn(GroceryTrip, 'claimItem');
    const res = makeRes();

    await run(groceryController.claimItem, makeReq({ params: { id: '3' } }), res);

    expect(res.statusCode).toBe(404);
    expect(claim).not.toHaveBeenCalled();
  });

  test('releasing is idempotent and never fails the caller', async () => {
    const release = jest.spyOn(GroceryTrip, 'releaseItem').mockResolvedValue(undefined);
    const res = makeRes();

    await run(groceryController.releaseItem, makeReq({ params: { id: '3' } }), res);

    expect(res.statusCode).toBe(200);
    expect(release).toHaveBeenCalledWith(3, 7);
  });
});

describe('notification cleanup', () => {
  const { Notification } = require('../models/Notification');

  // The centre had no way to empty itself, so months of resolved alerts sat on
  // top of anything new.
  test('clearing removes only what has been read', async () => {
    db.query.mockResolvedValue({ rowCount: 6 });

    const removed = await Notification.clearRead(7);

    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toMatch(/DELETE FROM notifications/i);
    expect(sql).toMatch(/is_read = true/);
    expect(params).toEqual([7]);
    expect(removed).toBe(6);
  });

  test('it is scoped to the caller', async () => {
    db.query.mockResolvedValue({ rowCount: 0 });
    await Notification.clearRead(7);
    expect(db.query.mock.calls[0][0]).toMatch(/user_id = \$1/);
  });
});
