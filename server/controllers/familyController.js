/**
 * Family Hub controller — the household's manual monthly picture.
 *
 * Access was already decided by `middleware/familyAccess.js` before anything
 * here runs; there is no second permission rule in this file.
 *
 * Every user-facing string is a stable `code`; the wording lives in the client's
 * `translations/{en,he}/family.js`. `message` is an English developer fallback.
 *
 * Actors and timestamps are server-set: a client cannot claim it was someone
 * else who typed a number in.
 */

const { asyncHandler } = require('../middleware/errorHandler');
const { FamilyBudget, ITEM_FIELDS, BALANCE_FIELDS } = require('../models/FamilyBudget');
const { summarize } = require('../services/familyBudgetService');
const {
  isItemKind, isCategory, isBalanceKind, DEFAULT_CATEGORY,
} = require('../services/familyTaxonomy');

const MAX_NAME = 120;
const MAX_TEXT = 120;
const MAX_NOTE = 500;
const MAX_MONTHLY = 1000000;      // ₪1M/month — a typo guard, not a business rule
const MAX_BALANCE = 100000000;    // ₪100M
const MAX_PAYMENTS = 600;         // 50 years of monthly payments

const fail = (res, status, code, message) =>
  res.status(status).json({ success: false, error: { code, message } });

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Trimmed string, or null when the client is deliberately clearing it. */
const optionalText = (value, max) => {
  if (value === null || value === undefined) return { value: null };
  const text = String(value).trim();
  if (!text) return { value: null };
  if (text.length > max) return { error: true };
  return { value: text };
};

const optionalNumber = (value, max) => {
  if (value === null || value === undefined || value === '') return { value: null };
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || num > max) return { error: true };
  return { value: Math.round(num * 100) / 100 };
};

const optionalDate = (value) => {
  if (value === null || value === undefined || value === '') return { value: null };
  const text = String(value).slice(0, 10);
  if (!ISO_DATE.test(text) || Number.isNaN(Date.parse(text))) return { error: true };
  return { value: text };
};

/**
 * Validate a monthly-item body. `requireCore` is true on create (kind and name
 * must be present) and false on patch (only what was sent is touched).
 */
const parseItemFields = (body, memberIds, { requireCore }) => {
  const fields = {};

  if (body.kind !== undefined) {
    if (!isItemKind(body.kind)) return { error: 'FAMILY_KIND_INVALID' };
    fields.kind = String(body.kind);
  } else if (requireCore) {
    return { error: 'FAMILY_KIND_INVALID' };
  }

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return { error: 'FAMILY_NAME_REQUIRED' };
    if (name.length > MAX_NAME) return { error: 'FAMILY_NAME_TOO_LONG' };
    fields.name = name;
  } else if (requireCore) {
    return { error: 'FAMILY_NAME_REQUIRED' };
  }

  if (body.amount !== undefined) {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 0 || amount > MAX_MONTHLY) {
      return { error: 'FAMILY_AMOUNT_INVALID' };
    }
    fields.amount = Math.round(amount * 100) / 100;
  } else if (requireCore) {
    fields.amount = 0;
  }

  // NULL is a real answer here: the charge is joint, not unassigned.
  if (body.owner_user_id !== undefined) {
    if (body.owner_user_id === null || body.owner_user_id === '') {
      fields.owner_user_id = null;
    } else {
      const ownerId = Number(body.owner_user_id);
      if (!memberIds.includes(ownerId)) return { error: 'FAMILY_OWNER_INVALID' };
      fields.owner_user_id = ownerId;
    }
  }

  if (body.category_key !== undefined) {
    if (!isCategory(body.category_key)) return { error: 'FAMILY_CATEGORY_INVALID' };
    fields.category_key = String(body.category_key);
  } else if (requireCore) {
    fields.category_key = DEFAULT_CATEGORY;
  }

  if (body.charge_day !== undefined) {
    if (body.charge_day === null || body.charge_day === '') {
      fields.charge_day = null;
    } else {
      const day = Number(body.charge_day);
      if (!Number.isInteger(day) || day < 1 || day > 31) return { error: 'FAMILY_DAY_INVALID' };
      fields.charge_day = day;
    }
  }

  if (body.is_active !== undefined) fields.is_active = !!body.is_active;

  if (body.notes !== undefined) {
    const notes = optionalText(body.notes, MAX_NOTE);
    if (notes.error) return { error: 'FAMILY_NOTE_TOO_LONG' };
    fields.notes = notes.value;
  }

  if (body.sort_order !== undefined) {
    const order = Number(body.sort_order);
    fields.sort_order = Number.isFinite(order) ? Math.trunc(order) : 0;
  }

  // ── Loan-only extras. Accepted on any row (the column is nullable), but only
  //    a loan row ever fills them in from the UI.
  if (body.lender !== undefined) {
    const lender = optionalText(body.lender, MAX_TEXT);
    if (lender.error) return { error: 'FAMILY_NAME_TOO_LONG' };
    fields.lender = lender.value;
  }

  if (body.outstanding_amount !== undefined) {
    const outstanding = optionalNumber(body.outstanding_amount, MAX_BALANCE);
    if (outstanding.error) return { error: 'FAMILY_AMOUNT_INVALID' };
    fields.outstanding_amount = outstanding.value;
  }

  if (body.payments_left !== undefined) {
    if (body.payments_left === null || body.payments_left === '') {
      fields.payments_left = null;
    } else {
      const left = Number(body.payments_left);
      if (!Number.isInteger(left) || left < 0 || left > MAX_PAYMENTS) {
        return { error: 'FAMILY_PAYMENTS_INVALID' };
      }
      fields.payments_left = left;
    }
  }

  if (body.end_date !== undefined) {
    const endDate = optionalDate(body.end_date);
    if (endDate.error) return { error: 'FAMILY_DATE_INVALID' };
    fields.end_date = endDate.value;
  }

  // Only ever write columns the model whitelists.
  for (const key of Object.keys(fields)) {
    if (!ITEM_FIELDS.includes(key)) delete fields[key];
  }
  return { fields };
};

const parseBalanceFields = (body, memberIds, { requireCore }) => {
  const fields = {};

  if (body.kind !== undefined) {
    if (!isBalanceKind(body.kind)) return { error: 'FAMILY_KIND_INVALID' };
    fields.kind = String(body.kind);
  } else if (requireCore) {
    return { error: 'FAMILY_KIND_INVALID' };
  }

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return { error: 'FAMILY_NAME_REQUIRED' };
    if (name.length > MAX_NAME) return { error: 'FAMILY_NAME_TOO_LONG' };
    fields.name = name;
  } else if (requireCore) {
    return { error: 'FAMILY_NAME_REQUIRED' };
  }

  if (body.institution !== undefined) {
    const institution = optionalText(body.institution, MAX_TEXT);
    if (institution.error) return { error: 'FAMILY_NAME_TOO_LONG' };
    fields.institution = institution.value;
  }

  if (body.owner_user_id !== undefined) {
    if (body.owner_user_id === null || body.owner_user_id === '') {
      fields.owner_user_id = null;
    } else {
      const ownerId = Number(body.owner_user_id);
      if (!memberIds.includes(ownerId)) return { error: 'FAMILY_OWNER_INVALID' };
      fields.owner_user_id = ownerId;
    }
  }

  if (body.amount !== undefined) {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 0 || amount > MAX_BALANCE) {
      return { error: 'FAMILY_AMOUNT_INVALID' };
    }
    fields.amount = Math.round(amount * 100) / 100;
  } else if (requireCore) {
    fields.amount = 0;
  }

  if (body.monthly_contribution !== undefined) {
    const contribution = optionalNumber(body.monthly_contribution, MAX_MONTHLY);
    if (contribution.error) return { error: 'FAMILY_AMOUNT_INVALID' };
    fields.monthly_contribution = contribution.value;
  }

  if (body.as_of !== undefined) {
    const asOf = optionalDate(body.as_of);
    if (asOf.error) return { error: 'FAMILY_DATE_INVALID' };
    fields.as_of = asOf.value;
  }

  if (body.is_active !== undefined) fields.is_active = !!body.is_active;

  if (body.notes !== undefined) {
    const notes = optionalText(body.notes, MAX_NOTE);
    if (notes.error) return { error: 'FAMILY_NOTE_TOO_LONG' };
    fields.notes = notes.value;
  }

  if (body.sort_order !== undefined) {
    const order = Number(body.sort_order);
    fields.sort_order = Number.isFinite(order) ? Math.trunc(order) : 0;
  }

  for (const key of Object.keys(fields)) {
    if (!BALANCE_FIELDS.includes(key)) delete fields[key];
  }
  return { fields };
};

/** Everything the page renders, in one call. It is a small dataset by design. */
const loadOverview = async () => {
  const [members, items, balances] = await Promise.all([
    FamilyBudget.members(),
    FamilyBudget.listItems(),
    FamilyBudget.listBalances(),
  ]);
  return { members, items, balances, summary: summarize(items, balances, members) };
};

module.exports = {
  getOverview: asyncHandler(async (req, res) => {
    res.json({ success: true, data: await loadOverview() });
  }),

  createItem: asyncHandler(async (req, res) => {
    const members = await FamilyBudget.members();
    const parsed = parseItemFields(req.body || {}, members.map((m) => m.id), { requireCore: true });
    if (parsed.error) return fail(res, 400, parsed.error, 'Invalid monthly item');

    const item = await FamilyBudget.createItem(parsed.fields, req.user.id);
    res.status(201).json({ success: true, data: { item, ...(await loadOverview()) } });
  }),

  updateItem: asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await FamilyBudget.getItem(id);
    if (!existing) return fail(res, 404, 'FAMILY_NOT_FOUND', 'Item not found');

    const members = await FamilyBudget.members();
    const parsed = parseItemFields(req.body || {}, members.map((m) => m.id), { requireCore: false });
    if (parsed.error) return fail(res, 400, parsed.error, 'Invalid monthly item');

    const item = await FamilyBudget.updateItem(id, parsed.fields, req.user.id);
    res.json({ success: true, data: { item, ...(await loadOverview()) } });
  }),

  deleteItem: asyncHandler(async (req, res) => {
    const removed = await FamilyBudget.deleteItem(Number(req.params.id));
    if (!removed) return fail(res, 404, 'FAMILY_NOT_FOUND', 'Item not found');
    res.json({ success: true, data: await loadOverview() });
  }),

  createBalance: asyncHandler(async (req, res) => {
    const members = await FamilyBudget.members();
    const parsed = parseBalanceFields(req.body || {}, members.map((m) => m.id), { requireCore: true });
    if (parsed.error) return fail(res, 400, parsed.error, 'Invalid balance');

    const balance = await FamilyBudget.createBalance(parsed.fields, req.user.id);
    res.status(201).json({ success: true, data: { balance, ...(await loadOverview()) } });
  }),

  updateBalance: asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await FamilyBudget.getBalance(id);
    if (!existing) return fail(res, 404, 'FAMILY_NOT_FOUND', 'Balance not found');

    const members = await FamilyBudget.members();
    const parsed = parseBalanceFields(req.body || {}, members.map((m) => m.id), { requireCore: false });
    if (parsed.error) return fail(res, 400, parsed.error, 'Invalid balance');

    const balance = await FamilyBudget.updateBalance(id, parsed.fields, req.user.id);
    res.json({ success: true, data: { balance, ...(await loadOverview()) } });
  }),

  deleteBalance: asyncHandler(async (req, res) => {
    const removed = await FamilyBudget.deleteBalance(Number(req.params.id));
    if (!removed) return fail(res, 404, 'FAMILY_NOT_FOUND', 'Balance not found');
    res.json({ success: true, data: await loadOverview() });
  }),

  // exported for tests
  parseItemFields,
  parseBalanceFields,
};
