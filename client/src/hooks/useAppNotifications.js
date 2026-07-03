/**
 * useNotifications — legacy compatibility layer over the single toast system.
 *
 * Historically the app had two notification systems: react-hot-toast (via
 * useToast), which is mounted at app root and actually renders, and an
 * appStore `notifications` array pushed to by `addNotification` that NOTHING
 * rendered — so every addNotification call was a silent no-op.
 *
 * Rather than hand-edit the ~29 callers, this maps the legacy
 * `addNotification({ type, message, duration })` API onto useToast, so the
 * whole app funnels through one rendering path. The dead appStore array and
 * its actions have been removed.
 *
 * Prefer useToast() directly in new code; this exists for the existing callers.
 */

import { useCallback } from 'react';
import { useToast } from './useToast';

export const useNotifications = () => {
  const toast = useToast();

  const addNotification = useCallback((notification = {}) => {
    const type = notification.type || 'info';
    const message = notification.message ?? notification.title ?? '';
    if (!message) return undefined;
    const show = toast[type] || toast.info;
    return show(message, notification.duration ? { duration: notification.duration } : {});
  }, [toast]);

  return { addNotification };
};

export default useNotifications;
