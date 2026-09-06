/**
 * Grocery list access middleware.
 *
 * Centralises the checks every grocery route needs, so no route can invent its
 * own slightly-different SQL rule:
 *
 *   attachList   — resolves which list the request is about (403 if none)
 *   requireOwner — owner-only actions (membership management)
 *
 * There is deliberately no lock here. Two people adding different items, or
 * checking off different items, cannot conflict; the only real collision is two
 * people editing the same item, which is handled per item in the controller
 * (a short claim) and enforced by `grocery_items.version`.
 */

const { GroceryList } = require('../models/GroceryList');
const logger = require('../utils/logger');

/** Header a client uses to say which of its lists a request is about. */
const LIST_HEADER = 'x-grocery-list';

const fail = (res, status, code, message, extra = {}) =>
  res.status(status).json({ success: false, error: { code, message, ...extra } });

/**
 * Resolve (and lazily create) the list this request is about.
 * Sets req.groceryList / req.groceryRole.
 *
 * Since migration 44 a user can be on several lists, so a request may name one
 * — `X-Grocery-List`, or `?listId=` for anything that can't set headers. It is
 * only ever a hint: the id is resolved through membership, so naming a list you
 * are not on gets you your own list, not theirs.
 *
 * An unknown id falls back rather than failing, on purpose. The client sends
 * back whatever list it last saw, and the honest reasons for a mismatch — you
 * were removed, you left, the owner disbanded — should land you on a working
 * list, not on an error screen. The next `/state` poll tells the UI which list
 * it is actually on, so it corrects itself within seconds.
 */
const attachList = async (req, res, next) => {
  try {
    const requested = req.get(LIST_HEADER) || req.query?.listId;
    let list = null;

    if (requested && /^\d+$/.test(String(requested).trim())) {
      list = await GroceryList.findForUserById(String(requested).trim(), req.user.id);
      if (!list) {
        logger.debug?.('[GROCERY] requested list is not one of the caller\'s', {
          userId: req.user.id, requested,
        });
      }
    }

    if (!list) list = await GroceryList.resolveForUser(req.user.id);

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

module.exports = { attachList, requireOwner, fail, LIST_HEADER };
