/**
 * Grocery list access + edit-lease middleware.
 *
 * Centralises the two checks every grocery mutation needs, so no route can
 * accidentally invent its own slightly-different SQL rule:
 *
 *   attachList   — resolves the caller's list and membership (403 if none)
 *   requireOwner — owner-only actions (membership management)
 *   requireLease — the caller holds the live edit lease on that list
 *
 * `requireLease` auto-acquires a free lease so ordinary one-handed use ("tap the
 * item, it's in the cart") never needs an explicit Edit tap, while still making
 * the server — not a disabled button — the thing that stops a second editor.
 */

const { GroceryList, LEASE_TTL_SECONDS } = require('../models/GroceryList');

const fail = (res, status, code, message, extra = {}) =>
  res.status(status).json({ success: false, error: { code, message, ...extra } });

/** Resolve (and lazily create) the caller's list. Sets req.groceryList / req.groceryRole. */
const attachList = async (req, res, next) => {
  try {
    const list = await GroceryList.resolveForUser(req.user.id);
    if (!list) {
      return fail(res, 403, 'GROCERY_NO_LIST', 'No grocery list is available for this user');
    }
    req.groceryList = list;
    req.groceryRole = list.role;
    next();
  } catch (err) {
    next(err);
  }
};

const requireOwner = (req, res, next) => {
  if (req.groceryRole !== 'owner') {
    return fail(res, 403, 'GROCERY_OWNER_ONLY', 'Only the list owner can do this');
  }
  next();
};

/**
 * The caller must hold the edit lease. Reads the token from the
 * `X-Grocery-Lease` header (kept out of the body so every mutation shape stays
 * identical) and, when the list is free, grants it on the spot.
 *
 * Responds 409 GROCERY_LOCKED with the current holder when someone else has it,
 * which is the signal the client turns into read-only mode.
 */
const requireLease = async (req, res, next) => {
  try {
    const listId = req.groceryList.id;
    const token = req.get('X-Grocery-Lease') || null;
    const sessionId = req.get('X-Grocery-Session') || `req-${req.user.id}`;

    if (token) {
      const held = await GroceryList.heartbeatLease(listId, req.user.id, token, LEASE_TTL_SECONDS);
      if (held) {
        req.groceryLease = { token, list: held };
        return next();
      }
    }

    // No token, or a lapsed one: take the lease if it is actually free.
    const acquired = await GroceryList.acquireLease(
      listId, req.user.id, sessionId, LEASE_TTL_SECONDS
    );

    if (!acquired) {
      const state = await GroceryList.getLeaseState(listId);
      return fail(res, 409, 'GROCERY_LOCKED', 'Another member is editing this list', {
        lockedBy: state?.lockedBy || null,
        expiresAt: state?.expiresAt || null,
        version: state?.version ?? null,
      });
    }

    req.groceryLease = { token: acquired.lock_token, list: acquired };
    // Surface a freshly minted token so the client can keep using it.
    res.set('X-Grocery-Lease', acquired.lock_token);
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { attachList, requireOwner, requireLease, fail };
