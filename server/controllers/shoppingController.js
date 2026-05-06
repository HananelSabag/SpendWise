/**
 * Shopping Wishlist Controller
 */

const { ShoppingItem } = require('../models/ShoppingItem');
const { asyncHandler } = require('../middleware/errorHandler');

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
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: { message: 'שם המוצר הוא שדה חובה' } });
    }
    const item = await ShoppingItem.create(req.user.id, { name, category, price_ils, buy_url, notes });
    res.status(201).json({ success: true, data: item });
  }),

  update: asyncHandler(async (req, res) => {
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
