import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/helpers';
import { useNotifications } from '../../hooks/useNotifications';
import BottomSheet from '../common/BottomSheet';

/**
 * NotificationBell — the app's general notification center.
 *
 * Shopping is a profile-gated mini-app now, so shopping invitations and
 * shopping-related notifications are NOT shown here — they live in the
 * Shopping page's own invite banner (see ShoppingWishlistPage). This bell
 * shows only non-shopping system notifications.
 */
const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { notifications, markAllRead, markRead } = useNotifications();

  // Everything shopping-related is handled inside the shopping mini-app.
  const items = notifications.filter(n => !String(n.type || '').startsWith('shopping'));
  const unread = items.filter(n => !n.is_read).length;

  const handleClose = useCallback(() => {
    setOpen(false);
    if (unread > 0) markAllRead();
  }, [unread, markAllRead]);

  const handleNotification = useCallback((notification) => {
    if (!notification.is_read) markRead(notification.id);
    const link = notification.data?.link;
    if (typeof link === 'string' && link.startsWith('/')) {
      setOpen(false);
      navigate(link);
    }
  }, [markRead, navigate]);

  return (
    <>
      {/* Bell button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(true)}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          'text-gray-500 dark:text-gray-400',
          'hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
          'min-h-[44px] min-w-[44px] flex items-center justify-center'
        )}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none"
            >
              {unread > 99 ? '99+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Panel */}
      <BottomSheet isOpen={open} onClose={handleClose} title="התראות" height="auto">
        <div className="flex flex-col gap-1 pb-6" dir="rtl">

          {items.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {items.map((n) => (
                <button
                  type="button"
                  key={n.id}
                  onClick={() => handleNotification(n)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-start transition-colors',
                    n.is_read
                      ? 'bg-gray-50 dark:bg-gray-800/40'
                      : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm'
                  )}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-500">
                    <Bell className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{n.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.body}</p>
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Mark all read */}
          {unread > 0 && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={markAllRead}
              className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium"
            >
              <CheckCheck className="w-4 h-4" strokeWidth={2} />
              סמן הכל כנקרא
            </motion.button>
          )}

          {/* Empty state */}
          {items.length === 0 && (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <Bell className="w-7 h-7 text-gray-400" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">אין התראות חדשות</p>
            </div>
          )}

        </div>
      </BottomSheet>
    </>
  );
};

export default NotificationBell;
