import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/helpers';
import { useNotifications } from '../../hooks/useNotifications';
import { useTranslation } from '../../stores';
import BottomSheet from '../common/BottomSheet';
import { isGroceryNotification, presentNotification } from './notificationPresentation';

/**
 * NotificationBell — the app's one notification centre.
 *
 * Everything lands here, grocery invitations included. They used to be filtered
 * out on the theory that the grocery screen owned them, which meant an
 * invitation was invisible to anyone using full SpendWise — the exact case where
 * you most need to be told.
 *
 * Opening the panel does NOT mark anything read: only tapping a notification
 * marks that one, and "mark all read" is an explicit button.
 */
const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { notifications, markAllRead, markRead } = useNotifications();
  const { t, isRTL } = useTranslation('common');
  const { t: tGrocery } = useTranslation('grocery');

  const unread = notifications.filter((notification) => !notification.is_read).length;

  const handleNotification = useCallback((notification) => {
    if (!notification.is_read) markRead(notification.id);

    const { link } = presentNotification(notification, tGrocery);
    if (link) {
      setOpen(false);
      navigate(link);
    }
  }, [markRead, navigate, tGrocery]);

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(true)}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          'text-gray-500 dark:text-gray-400',
          'hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
          'min-h-[44px] min-w-[44px] flex items-center justify-center'
        )}
        aria-label={t('notifications.title', { fallback: 'Notifications' })}
      >
        <Bell className="w-5 h-5" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1 end-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none"
            >
              {unread > 99 ? '99+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <BottomSheet
        isOpen={open}
        onClose={() => setOpen(false)}
        title={t('notifications.title', { fallback: 'Notifications' })}
        height="auto"
      >
        <div className="flex flex-col gap-1 pb-6" dir={isRTL ? 'rtl' : 'ltr'}>

          {notifications.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {notifications.map((notification) => {
                const { title, body } = presentNotification(notification, tGrocery);
                const grocery = isGroceryNotification(notification.type);
                const Icon = grocery ? ShoppingCart : Bell;

                return (
                  <button
                    type="button"
                    key={notification.id}
                    onClick={() => handleNotification(notification)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-start transition-colors',
                      notification.is_read
                        ? 'bg-gray-50 dark:bg-gray-800/40'
                        : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                      grocery
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
                    )}>
                      <Icon className="w-4 h-4" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{title}</p>
                      {body && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{body}</p>
                      )}
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {unread > 0 && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={markAllRead}
              className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium"
            >
              <CheckCheck className="w-4 h-4" strokeWidth={2} />
              {t('notifications.markAllRead', { fallback: 'Mark all as read' })}
            </motion.button>
          )}

          {notifications.length === 0 && (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <Bell className="w-7 h-7 text-gray-400" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('notifications.empty', { fallback: 'No new notifications' })}
              </p>
            </div>
          )}

        </div>
      </BottomSheet>
    </>
  );
};

export default NotificationBell;
