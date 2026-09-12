import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Trash2, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/helpers';
import { useNotifications } from '../../hooks/useNotifications';
import { useTranslation } from '../../stores';
import BottomSheet from '../common/BottomSheet';
import { presentNotification } from './notificationPresentation';

/**
 * NotificationBell — the app's one notification centre.
 *
 * It used to split into labelled groups, because the grocery list ran here as
 * a second app and its invitations sitting between two bank-sync alerts made
 * both harder to read. One app, one list.
 *
 * Opening the panel does NOT mark anything read: only tapping a notification
 * marks that one, and "mark all read" is an explicit button.
 */
const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { notifications, markAllRead, markRead, clearRead } = useNotifications();
  const { t, isRTL } = useTranslation('common');

  const unread = notifications.filter((notification) => !notification.is_read).length;
  const readCount = notifications.length - unread;


  const handleNotification = useCallback((notification) => {
    if (!notification.is_read) markRead(notification.id);

    const { link } = presentNotification(notification);
    if (link) {
      setOpen(false);
      navigate(link);
    }
  }, [markRead, navigate]);

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

          <div className="flex flex-col gap-1.5">
            {notifications.map((notification) => {
              const { title, body } = presentNotification(notification);

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
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-900/20">
                    <Wallet className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{title}</p>
                    {body && (
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{body}</p>
                    )}
                  </div>
                  {!notification.is_read && (
                    <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </div>

          {(unread > 0 || readCount > 0) && (
            <div className="mt-1 flex gap-2">
              {unread > 0 && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={markAllRead}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gray-100 py-2.5 text-sm font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                >
                  <CheckCheck className="w-4 h-4" strokeWidth={2} />
                  {t('notifications.markAllRead', { fallback: 'Mark all as read' })}
                </motion.button>
              )}

              {/* Resolved alerts used to pile up forever on top of anything new. */}
              {readCount > 0 && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={clearRead}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={2} />
                  {t('notifications.clearRead', { fallback: 'Clear read' })}
                </motion.button>
              )}
            </div>
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
