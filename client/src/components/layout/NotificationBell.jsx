import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, X, ShoppingCart, CheckCheck } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useNotifications } from '../../hooks/useNotifications';
import { useShoppingShare } from '../../hooks/useShoppingShare';
import BottomSheet from '../common/BottomSheet';

const Avatar = ({ name, size = 'sm' }) => {
  const initials = (name || '?').slice(0, 2).toUpperCase();
  return (
    <div className={cn(
      'rounded-full bg-gradient-to-br from-blue-500 to-indigo-600',
      'flex items-center justify-center text-white font-bold flex-shrink-0',
      size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
    )}>
      {initials}
    </div>
  );
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [respondingToken, setRespondingToken] = useState(null);

  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const {
    pendingInvitations,
    respond,
    isResponding,
  } = useShoppingShare();

  const totalBadge = unreadCount + pendingInvitations.length;

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    if (unreadCount > 0) markAllRead();
  }, [unreadCount, markAllRead]);

  const handleRespond = useCallback(async (token, action) => {
    setRespondingToken(token);
    await respond(token, action);
    setRespondingToken(null);
  }, [respond]);

  const inviterName = (inv) =>
    inv.inviter_first_name
      ? `${inv.inviter_first_name} ${inv.inviter_last_name || ''}`.trim()
      : inv.inviter_username || inv.inviter_email;

  // Non-invite notifications (invites already shown in pending section)
  const otherNotifications = notifications.filter(n => n.type !== 'shopping_invite');

  return (
    <>
      {/* Bell button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleOpen}
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
          {totalBadge > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none"
            >
              {totalBadge > 99 ? '99+' : totalBadge}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Panel */}
      <BottomSheet isOpen={open} onClose={handleClose} title="התראות" height="auto">
        <div className="flex flex-col gap-1 pb-6" dir="rtl">

          {/* Pending invitations */}
          {pendingInvitations.length > 0 && (
            <>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 mt-1">
                הזמנות לרשימת קניות ({pendingInvitations.length})
              </p>
              <div className="flex flex-col gap-2 mb-3">
                {pendingInvitations.map((inv) => {
                  const name = inviterName(inv);
                  const busy = respondingToken === inv.token && isResponding;
                  return (
                    <div key={inv.id} className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-2xl',
                      'bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800'
                    )}>
                      <Avatar name={name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">הזמין אותך לרשימת קניות משותפת</p>
                      </div>
                      <div className="flex gap-1.5">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          disabled={busy}
                          onClick={() => handleRespond(inv.token, 'accept')}
                          className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-500 text-white shadow-sm disabled:opacity-50"
                        >
                          {busy
                            ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            : <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                          }
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          disabled={busy}
                          onClick={() => handleRespond(inv.token, 'decline')}
                          className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                        >
                          <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </motion.button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Other notifications */}
          {otherNotifications.length > 0 && (
            <>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                פעילות אחרונה
              </p>
              <div className="flex flex-col gap-1.5">
                {otherNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markRead(n.id)}
                    className={cn(
                      'flex items-start gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-colors',
                      n.is_read
                        ? 'bg-gray-50 dark:bg-gray-800/40'
                        : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                      n.type === 'shopping_invite_accepted'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
                    )}>
                      <ShoppingCart className="w-4 h-4" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{n.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.body}</p>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Mark all read button */}
          {unreadCount > 0 && otherNotifications.length > 0 && (
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
          {pendingInvitations.length === 0 && otherNotifications.length === 0 && (
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
