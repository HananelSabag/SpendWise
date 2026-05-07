/**
 * Shopping Wishlist Controller
 */

const { ShoppingItem } = require('../models/ShoppingItem');
const { asyncHandler } = require('../middleware/errorHandler');

const VALID_CATEGORIES = ['ריהוט', 'מטבח', 'חדר שינה', 'אלקטרוניקה', 'ביגוד', 'אחר'];

function validateFields(body, requireName = false) {
  const { name, category, price_ils, buy_url, notes } = body;
  if (requireName && (!name || !name.trim())) {
    return 'שם המוצר הוא שדה חובה';
  }
  if (category !== undefined && category !== null && !VALID_CATEGORIES.includes(category)) {
    return 'קטגוריה לא חוקית';
  }
  if (price_ils !== undefined && price_ils !== null && price_ils !== '') {
    const p = parseFloat(price_ils);
    if (isNaN(p) || p < 0) return 'מחיר חייב להיות מספר חיובי';
  }
  if (buy_url !== undefined && buy_url !== null && buy_url !== '') {
    if (buy_url.length > 2000 || !/^https?:\/\//i.test(buy_url)) {
      return 'כתובת URL לא חוקית (חייב להתחיל ב-http:// או https://)';
    }
  }
  if (notes !== undefined && notes !== null && notes.length > 1000) {
    return 'הערות ארוכות מדי (מקסימום 1000 תווים)';
  }
  return null;
}

const shoppingController = {
  getAll: asyncHandler(async (req, res) => {
    const items = await ShoppingItem.getAll(req.user.id);
    const total = items
      .filter((i) => !i.is_bought)
      .reduce((sum, i) => sum + parseFloat(i.price_ils || 0), 0);
    res.json({ success: true, data: { items, total } });
  }),

  create: asyncHandler(async (req, res) => {
    const { name, category, price_ils, buy_url, notes } = req.body;
    const err = validateFields(req.body, true);
    if (err) return res.status(400).json({ success: false, error: { message: err } });
    const item = await ShoppingItem.create(req.user.id, { name, category, price_ils, buy_url, notes });
    res.status(201).json({ success: true, data: item });
  }),

  update: asyncHandler(async (req, res) => {
    const err = validateFields(req.body, false);
    if (err) return res.status(400).json({ success: false, error: { message: err } });
    const item = await ShoppingItem.update(req.params.id, req.user.id, req.body);
    if (!item) return res.status(404).json({ success: false, error: { message: 'פריט לא נמצא' } });
    res.json({ success: true, data: item });
  }),

  remove: asyncHandler(async (req, res) => {
    const deleted = await ShoppingItem.delete(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ success: false, error: { message: 'פריט לא נמצא' } });
    res.json({ success: true });
  }),
};

module.exports = shoppingController;
