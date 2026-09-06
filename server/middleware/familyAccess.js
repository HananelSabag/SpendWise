/**
 * Family Hub authorization — the ONE place the decision is made.
 *
 * There is no per-row ownership in `family_monthly_items` / `family_balances`:
 * the household shares one dataset, so "may this person read/write it at all" is
 * the whole question, and it is answered here from the allowlist in
 * `config/familyAccess.js`. Do not add a second, slightly-different rule in a
 * controller or a query — that is exactly how the grocery list nearly grew two
 * conflicting permission models.
 */

const { isFamilyMember } = require('../config/familyAccess');

const requireFamilyAccess = (req, res, next) => {
  if (!isFamilyMember(req.user)) {
    // Deliberately terse: someone who is not in the household has no business
    // learning what the feature is or who is in it.
    return res.status(403).json({
      success: false,
      error: {
        code: 'FAMILY_FORBIDDEN',
        message: 'This area is limited to the household members',
      },
    });
  }
  next();
};

module.exports = { requireFamilyAccess };
