/**
 * Grocery list controller — active list, items, edit lease, trips and history.
 *
 * Every user-facing string is a stable `code`; the client owns the wording in
 * `translations/{en,he}/grocery.js`. `message` is an English developer fallback
 * and is not meant to be displayed.
 *
 * Client-supplied ownership, actors, timestamps and purchase state are never
 * trusted: purchaser, purchase time and completion time are all set server-side.
 */

const db = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');
const { fail } = require('../middleware/groceryAccess');
const { GroceryList, LEASE_TTL_SECONDS } = require('../models/GroceryList');
const { GroceryTrip } = require('../models/GroceryTrip');
const { GroceryInvitation } = require('../models/GroceryInvitation');
const { Transaction } = require('../models/Transaction');
const { Notification } = require('../models/Notification');
const supabaseStorage = require('../services/supabaseStorage');
const { isValidCategory, isValidUnit, DEFAULT_CATEGORY } = require('../services/groceryCategories');
const { scrapeProductUrl, parseHtmlForOg } = require('../utils/urlScraper');
const logger = require('../utils/logger');

const MAX_NAME = 200;
const MAX_NOTE = 500;
const MAX_URL = 2000;
const MAX_STORE = 120;
const MAX_TOTAL = 1000000;

/** Normalise + validate an item payload. Returns `{ error }` or `{ fields }`. */
const parseItemFields = (body, { requireName }) => {
  const fields = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return { error: 'GROCERY_NAME_REQUIRED' };
    if (name.length > MAX_NAME) return { error: 'GROCERY_NAME_TOO_LONG' };
    fields.name = name;
  } else if (requireName) {
    return { error: 'GROCERY_NAME_REQUIRED' };
  }

  if (body.category_key !== undefined) {
    const key = String(body.category_key);
    if (!isValidCategory(key)) return { error: 'GROCERY_CATEGORY_INVALID' };
    fields.category_key = key;
  } else if (requireName) {
    fields.category_key = DEFAULT_CATEGORY;
  }

  if (body.quantity !== undefined) {
    if (body.quantity === null || body.quantity === '') {
      fields.quantity = null;
    } else {
      const quantity = Number(body.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 99999) {
        return { error: 'GROCERY_QUANTITY_INVALID' };
      }
      fields.quantity = quantity;
    }
  }

  if (body.unit !== undefined) {
    if (!body.unit) {
      fields.unit = null;
    } else if (!isValidUnit(String(body.unit))) {
      return { error: 'GROCERY_UNIT_INVALID' };
    } else {
      fields.unit = String(body.unit);
    }
  }

  if (body.note !== undefined) {
    const note = body.note ? String(body.note).trim() : '';
    if (note.length > MAX_NOTE) return { error: 'GROCERY_NOTE_TOO_LONG' };
    fields.note = note || null;
  }

  for (const key of ['image_url', 'product_url']) {
    if (body[key] === undefined) continue;
    const value = body[key] ? String(body[key]).trim() : '';
    if (!value) {
      fields[key] = null;
      continue;
    }
    if (value.length > MAX_URL || !/^https:\/\//i.test(value)) {
      return { error: key === 'image_url' ? 'GROCERY_IMAGE_URL_INVALID' : 'GROCERY_PRODUCT_URL_INVALID' };
    }
    fields[key] = value;
  }

  return { fields };
};

/** Full list payload. One shape for the initial load and for every poll hit. */
const buildState = async (list, userId) => {
  const [members, activeTrip, lease, pendingInvites] = await Promise.all([
    GroceryList.getMembers(list.id),
    GroceryTrip.getActive(list.id),
    GroceryList.getLeaseState(list.id),
    GroceryInvitation.getPendingForList(list.id),
  ]);

  const items = await GroceryTrip.getItems(activeTrip.id);

  return {
    list: {
      id: list.id,
      name: list.name,
      ownerId: list.owner_id,
      role: list.role,
      version: lease?.version ?? Number(list.version),
    },
    members,
    // Only the owner manages membership, so only the owner sees invited addresses.
    pendingInvitations: list.role === 'owner' ? pendingInvites : [],
    trip: {
      id: activeTrip.id,
      createdAt: activeTrip.created_at,
    },
    items,
    lock: {
      isLocked: lease?.isLocked ?? false,
      lockedBy: lease?.lockedBy ?? null,
      expiresAt: lease?.expiresAt ?? null,
      heldByMe: !!lease?.isLocked && lease.lockedBy?.userId === userId,
      ttlSeconds: LEASE_TTL_SECONDS,
    },
  };
};

const groceryController = {
  /**
   * GET /grocery/state?version=N
   *
   * Viewers poll this while the screen is visible. When `version` still matches,
   * it answers with a ~40-byte body instead of the whole list — which is what
   * makes a few-second poll interval affordable on a sleeping Render dyno.
   */
  getState: asyncHandler(async (req, res) => {
    const list = req.groceryList;
    const since = req.query.version !== undefined ? Number(req.query.version) : null;

    // Retire a lapsed lease here rather than in a cron job — the poll that
    // notices it is exactly the moment someone wants the list back.
    await GroceryList.clearExpiredLease(list.id);

    if (since !== null && Number.isFinite(since)) {
      const lease = await GroceryList.getLeaseState(list.id);
      // Acquiring and releasing the lease bump `version` too, so this one number
      // covers "did anything change" — including who is editing.
      if (lease && lease.version === since) {
        return res.json({ success: true, data: { unchanged: true, version: lease.version } });
      }
    }

    const state = await buildState(list, req.user.id);
    res.json({ success: true, data: state });
  }),

  // ─── Items ────────────────────────────────────────────────────────────────

  addItem: asyncHandler(async (req, res) => {
    const { error, fields } = parseItemFields(req.body, { requireName: true });
    if (error) return fail(res, 400, error, 'Invalid item payload');

    const trip = await GroceryTrip.getActive(req.groceryList.id);
    const { item, version } = await GroceryTrip.addItem(
      trip.id, req.groceryList.id, req.user.id, fields
    );

    res.status(201).json({ success: true, data: { item, version } });
  }),

  updateItem: asyncHandler(async (req, res) => {
    const itemId = Number(req.params.id);
    if (!Number.isInteger(itemId)) return fail(res, 400, 'GROCERY_ITEM_ID_INVALID', 'Invalid item id');

    const existing = await GroceryTrip.getItemById(itemId);
    if (!existing || existing.list_id !== req.groceryList.id) {
      return fail(res, 404, 'GROCERY_ITEM_NOT_FOUND', 'Item not found');
    }
    if (existing.trip_status !== 'active') {
      return fail(res, 409, 'GROCERY_TRIP_ARCHIVED', 'Completed trips are read-only');
    }

    const { error, fields } = parseItemFields(req.body, { requireName: false });
    if (error) return fail(res, 400, error, 'Invalid item payload');

    const expectedVersion = Number.isInteger(Number(req.body.version))
      ? Number(req.body.version)
      : null;

    const { item, version, conflict } = await GroceryTrip.updateItem(
      itemId, req.groceryList.id, fields, expectedVersion
    );

    if (conflict) {
      return fail(res, 409, 'GROCERY_ITEM_STALE', 'This item changed since you loaded it');
    }
    if (!item) return fail(res, 404, 'GROCERY_ITEM_NOT_FOUND', 'Item not found');

    res.json({ success: true, data: { item, version } });
  }),

  setPurchased: asyncHandler(async (req, res) => {
    const itemId = Number(req.params.id);
    if (!Number.isInteger(itemId)) return fail(res, 400, 'GROCERY_ITEM_ID_INVALID', 'Invalid item id');

    const existing = await GroceryTrip.getItemById(itemId);
    if (!existing || existing.list_id !== req.groceryList.id) {
      return fail(res, 404, 'GROCERY_ITEM_NOT_FOUND', 'Item not found');
    }
    if (existing.trip_status !== 'active') {
      return fail(res, 409, 'GROCERY_TRIP_ARCHIVED', 'Completed trips are read-only');
    }

    const purchased = req.body.purchased !== false;
    const { item, version } = await GroceryTrip.setPurchased(
      itemId, req.groceryList.id, req.user.id, purchased
    );
    if (!item) return fail(res, 404, 'GROCERY_ITEM_NOT_FOUND', 'Item not found');

    res.json({ success: true, data: { item, version } });
  }),

  deleteItem: asyncHandler(async (req, res) => {
    const itemId = Number(req.params.id);
    if (!Number.isInteger(itemId)) return fail(res, 400, 'GROCERY_ITEM_ID_INVALID', 'Invalid item id');

    const existing = await GroceryTrip.getItemById(itemId);
    if (!existing || existing.list_id !== req.groceryList.id) {
      return fail(res, 404, 'GROCERY_ITEM_NOT_FOUND', 'Item not found');
    }
    if (existing.trip_status !== 'active') {
      return fail(res, 409, 'GROCERY_TRIP_ARCHIVED', 'Completed trips are read-only');
    }

    const { deleted, version } = await GroceryTrip.deleteItem(itemId, req.groceryList.id);
    if (!deleted) return fail(res, 404, 'GROCERY_ITEM_NOT_FOUND', 'Item not found');

    res.json({ success: true, data: { version } });
  }),

  // ─── Edit lease ───────────────────────────────────────────────────────────

  acquireLock: asyncHandler(async (req, res) => {
    const sessionId = String(req.body.sessionId || req.get('X-Grocery-Session') || '').slice(0, 64)
      || `session-${req.user.id}`;

    const acquired = await GroceryList.acquireLease(
      req.groceryList.id, req.user.id, sessionId, LEASE_TTL_SECONDS
    );

    if (!acquired) {
      const state = await GroceryList.getLeaseState(req.groceryList.id);
      return fail(res, 409, 'GROCERY_LOCKED', 'Another member is editing this list', {
        lockedBy: state?.lockedBy || null,
        expiresAt: state?.expiresAt || null,
      });
    }

    res.json({
      success: true,
      data: {
        token: acquired.lock_token,
        expiresAt: acquired.lock_expires_at,
        ttlSeconds: LEASE_TTL_SECONDS,
        version: Number(acquired.version),
      },
    });
  }),

  heartbeatLock: asyncHandler(async (req, res) => {
    const token = req.get('X-Grocery-Lease') || req.body.token;
    if (!token) return fail(res, 400, 'GROCERY_LEASE_TOKEN_REQUIRED', 'Lease token required');

    const held = await GroceryList.heartbeatLease(
      req.groceryList.id, req.user.id, token, LEASE_TTL_SECONDS
    );
    if (!held) {
      const state = await GroceryList.getLeaseState(req.groceryList.id);
      return fail(res, 409, 'GROCERY_LEASE_LOST', 'Your edit session expired', {
        lockedBy: state?.lockedBy || null,
      });
    }

    res.json({
      success: true,
      data: { expiresAt: held.lock_expires_at, version: Number(held.version) },
    });
  }),

  releaseLock: asyncHandler(async (req, res) => {
    const token = req.get('X-Grocery-Lease') || req.body.token;
    if (token) {
      await GroceryList.releaseLease(req.groceryList.id, req.user.id, token);
    } else if (req.groceryRole === 'owner') {
      // Owner escape hatch for a lease stuck on a device they no longer have.
      await GroceryList.forceReleaseLease(req.groceryList.id);
    }
    res.json({ success: true });
  }),

  // ─── Trips ────────────────────────────────────────────────────────────────

  completeTrip: asyncHandler(async (req, res) => {
    const trip = await GroceryTrip.getActive(req.groceryList.id);

    const storeName = req.body.storeName ? String(req.body.storeName).trim().slice(0, MAX_STORE) : null;

    let totalIls = null;
    if (req.body.totalIls !== undefined && req.body.totalIls !== null && req.body.totalIls !== '') {
      totalIls = Number(req.body.totalIls);
      if (!Number.isFinite(totalIls) || totalIls < 0 || totalIls > MAX_TOTAL) {
        return fail(res, 400, 'GROCERY_TOTAL_INVALID', 'Invalid total');
      }
    }

    const purchasedCount = (await GroceryTrip.getItems(trip.id))
      .filter((item) => item.is_purchased).length;
    if (purchasedCount === 0) {
      return fail(res, 400, 'GROCERY_TRIP_EMPTY', 'Nothing was purchased on this trip');
    }

    const result = await GroceryTrip.complete(req.groceryList.id, trip.id, req.user.id, {
      storeName, totalIls, receiptPath: null, receiptMime: null,
    });
    if (!result.trip) {
      return fail(res, 409, 'GROCERY_TRIP_ALREADY_COMPLETED', 'Trip already completed');
    }

    // Tell the other members the shop is done and the list has reset.
    const members = await GroceryList.getMembers(req.groceryList.id);
    const actorName = req.user.first_name || req.user.username;
    await Promise.all(
      members
        .filter((m) => m.user_id !== req.user.id)
        .map((m) => Notification.create(
          m.user_id,
          'grocery_trip_completed',
          'Shopping finished',
          `${actorName} finished the shopping trip`,
          { tripId: result.trip.id, listId: req.groceryList.id, actorName, link: '/grocery' }
        ).catch(() => {}))
    );

    res.json({
      success: true,
      data: {
        trip: result.trip,
        carriedOver: result.carriedOver,
        version: result.version,
      },
    });
  }),

  getHistory: asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const [trips, total] = await Promise.all([
      GroceryTrip.getHistory(req.groceryList.id, { limit, offset }),
      GroceryTrip.getHistoryCount(req.groceryList.id),
    ]);

    res.json({ success: true, data: { trips, total, limit, offset } });
  }),

  getTripDetail: asyncHandler(async (req, res) => {
    const tripId = Number(req.params.id);
    if (!Number.isInteger(tripId)) return fail(res, 400, 'GROCERY_TRIP_ID_INVALID', 'Invalid trip id');

    const trip = await GroceryTrip.getTrip(tripId, req.groceryList.id);
    if (!trip) return fail(res, 404, 'GROCERY_TRIP_NOT_FOUND', 'Trip not found');

    const items = await GroceryTrip.getItems(tripId);
    res.json({
      success: true,
      data: {
        trip: {
          id: trip.id,
          status: trip.status,
          storeName: trip.store_name,
          totalIls: trip.total_ils,
          completedAt: trip.completed_at,
          completedBy: trip.completed_by,
          transactionId: trip.transaction_id,
          hasReceipt: !!trip.receipt_path,
        },
        items,
      },
    });
  }),

  // ─── Receipts (private bucket, signed reads) ──────────────────────────────

  uploadReceipt: asyncHandler(async (req, res) => {
    const tripId = Number(req.params.id);
    if (!Number.isInteger(tripId)) return fail(res, 400, 'GROCERY_TRIP_ID_INVALID', 'Invalid trip id');
    if (!req.file) return fail(res, 400, 'GROCERY_FILE_REQUIRED', 'No file uploaded');

    const trip = await GroceryTrip.getTrip(tripId, req.groceryList.id);
    if (!trip) return fail(res, 404, 'GROCERY_TRIP_NOT_FOUND', 'Trip not found');

    try {
      const stored = await supabaseStorage.uploadGroceryReceipt(req.file, req.groceryList.id, tripId);
      const previousPath = trip.receipt_path;

      await db.query(
        `UPDATE grocery_trips SET receipt_path = $2, receipt_mime = $3 WHERE id = $1`,
        [tripId, stored.path, stored.mime]
      );

      if (previousPath) await supabaseStorage.deleteGroceryReceipt(previousPath);

      res.json({ success: true, data: { hasReceipt: true } });
    } catch (err) {
      logger.error('[GROCERY] Receipt upload failed', { message: err.message, tripId });
      return fail(res, 502, 'GROCERY_RECEIPT_UPLOAD_FAILED', 'Could not store the receipt');
    }
  }),

  getReceiptUrl: asyncHandler(async (req, res) => {
    const tripId = Number(req.params.id);
    if (!Number.isInteger(tripId)) return fail(res, 400, 'GROCERY_TRIP_ID_INVALID', 'Invalid trip id');

    const trip = await GroceryTrip.getTrip(tripId, req.groceryList.id);
    if (!trip?.receipt_path) return fail(res, 404, 'GROCERY_RECEIPT_NOT_FOUND', 'No receipt on this trip');

    try {
      const url = await supabaseStorage.createReceiptSignedUrl(trip.receipt_path, 300);
      res.json({ success: true, data: { url, mime: trip.receipt_mime, expiresInSeconds: 300 } });
    } catch (err) {
      logger.error('[GROCERY] Receipt signing failed', { message: err.message, tripId });
      return fail(res, 502, 'GROCERY_RECEIPT_UNAVAILABLE', 'Could not open the receipt');
    }
  }),

  // ─── SpendWise linkage ────────────────────────────────────────────────────

  /**
   * POST /grocery/trips/:id/spendwise
   *
   * Deliberately explicit and one-shot. Bank/card sync will import the same
   * supermarket charge on its own, so creating the expense automatically would
   * double-count it. The unique index on `transaction_id` plus the IS NULL guard
   * mean a double tap returns the existing link instead of a second expense.
   */
  linkToSpendWise: asyncHandler(async (req, res) => {
    const tripId = Number(req.params.id);
    if (!Number.isInteger(tripId)) return fail(res, 400, 'GROCERY_TRIP_ID_INVALID', 'Invalid trip id');

    const trip = await GroceryTrip.getTrip(tripId, req.groceryList.id);
    if (!trip) return fail(res, 404, 'GROCERY_TRIP_NOT_FOUND', 'Trip not found');
    if (trip.status !== 'completed') {
      return fail(res, 409, 'GROCERY_TRIP_NOT_COMPLETED', 'Finish the trip first');
    }
    if (trip.transaction_id) {
      return res.json({ success: true, data: { transactionId: trip.transaction_id, created: false } });
    }
    const amount = Number(trip.total_ils);
    if (!Number.isFinite(amount) || amount <= 0) {
      return fail(res, 400, 'GROCERY_TOTAL_REQUIRED', 'Add a total before sending it to SpendWise');
    }

    const date = new Date(trip.completed_at);
    const transaction = await Transaction.create({
      amount,
      type: 'expense',
      description: trip.store_name || 'Supermarket shopping',
      notes: `SpendWise grocery trip #${trip.id}`,
      date: date.toISOString().split('T')[0],
      transaction_datetime: date.toISOString(),
    }, req.user.id);

    const linked = await GroceryTrip.linkTransaction(tripId, req.groceryList.id, transaction.id);
    if (!linked) {
      // Someone linked it a moment ago — retract the expense we just created
      // rather than leaving a duplicate charge behind.
      await Transaction.delete(transaction.id, req.user.id).catch(() => {});
      const current = await GroceryTrip.getTrip(tripId, req.groceryList.id);
      return res.json({
        success: true,
        data: { transactionId: current?.transaction_id ?? null, created: false },
      });
    }

    res.status(201).json({ success: true, data: { transactionId: transaction.id, created: true } });
  }),

  // ─── Product photo + link helpers ─────────────────────────────────────────

  uploadItemImage: asyncHandler(async (req, res) => {
    if (!req.file) return fail(res, 400, 'GROCERY_FILE_REQUIRED', 'No file uploaded');
    try {
      const stored = await supabaseStorage.uploadGroceryItemImage(req.file, req.groceryList.id);
      res.json({ success: true, data: { imageUrl: stored.publicUrl } });
    } catch (err) {
      logger.error('[GROCERY] Item image upload failed', { message: err.message });
      return fail(res, 502, 'GROCERY_IMAGE_UPLOAD_FAILED', 'Could not store the photo');
    }
  }),

  scrapeUrl: asyncHandler(async (req, res) => {
    const url = String(req.body.url || '').trim();
    if (!url) return fail(res, 400, 'GROCERY_URL_REQUIRED', 'URL is required');
    if (url.length > MAX_URL || !/^https:\/\//i.test(url)) {
      return fail(res, 400, 'GROCERY_PRODUCT_URL_INVALID', 'URL must start with https://');
    }
    const result = await scrapeProductUrl(url);
    res.json({ success: true, data: result });
  }),

  parseHtml: asyncHandler(async (req, res) => {
    const { html, url } = req.body;
    if (!html || typeof html !== 'string') {
      return fail(res, 400, 'GROCERY_HTML_REQUIRED', 'html is required');
    }
    if (html.length > 512 * 1024) {
      return fail(res, 413, 'GROCERY_HTML_TOO_LARGE', 'html too large');
    }
    let baseUrl = '';
    if (url) {
      try { baseUrl = new URL(url).origin; } catch { /* ignore */ }
    }
    res.json({ success: true, data: parseHtmlForOg(html, baseUrl) });
  }),
};

module.exports = groceryController;
