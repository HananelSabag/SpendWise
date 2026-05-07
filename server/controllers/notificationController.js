/**
 * Notification Controller
 */

const { Notification } = require('../models/ShoppingShare');
const { asyncHandler } = require('../middleware/errorHandler');

const notificationController = {
  getAll: asyncHandler(async (req, res) => {
    const [notifications, unreadCount] = await Promise.all([
      Notification.getForUser(req.user.id, 30),
      Notification.getUnreadCount(req.user.id),
    ]);
    res.json({ success: true, data: { notifications, unreadCount } });
  }),

  markAllRead: asyncHandler(async (req, res) => {
    await Notification.markAllRead(req.user.id);
    res.json({ success: true });
  }),

  markRead: asyncHandler(async (req, res) => {
    const ok = await Notification.markRead(parseInt(req.params.id, 10), req.user.id);
    if (!ok) return res.status(404).json({ success: false, error: { message: 'התראה לא נמצאה' } });
    res.json({ success: true });
  }),
};

module.exports = notificationController;
