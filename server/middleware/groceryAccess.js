/**
 * Grocery list access middleware.
 *
 * Centralises the checks every grocery route needs, so no route can invent its
 * own slightly-different SQL rule:
 *
 *   attachList   — resolves the caller's list and membership (403 if none)
 *   requireOwner — owner-only actions (membership management)
 *
 * There is deliberately no lock here. Two people adding different items, or
 * checking off different items, cannot conflict; the only real collision is two
 * people editing the same item, which is handled per item in the controller
 * (a short claim) and enforced by `grocery_items.version`.
 */

const { GroceryList } = require('../models/GroceryList');

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

module.exports = { attachList, requireOwner, fail };
