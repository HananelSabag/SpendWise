/**
 * Notification presentation — turn a stored `{ type, data }` into text.
 *
 * The server stores a stable type plus structured data and only an English
 * fallback in `title`/`body`. All display text is resolved here from the
 * translation files, which is why a Hebrew-stored notification no longer forces
 * Hebrew on an English user (and vice versa).
 *
 * An unknown type falls back to the stored strings rather than showing a raw key.
 */

const GROCERY_TYPES = new Set([
  'grocery_invite',
  'grocery_invite_accepted',
  'grocery_invite_declined',
  'grocery_member_removed',
  'grocery_member_left',
  'grocery_list_disbanded',
  'grocery_trip_completed',
]);

export const isGroceryNotification = (type) => GROCERY_TYPES.has(String(type || ''));

/**
 * @param {object} notification the stored row
 * @param {(key: string, options?: object) => string} tGrocery `t` bound to the grocery module
 */
export const presentNotification = (notification, tGrocery) => {
  const type = String(notification?.type || '');
  const data = notification?.data || {};

  if (isGroceryNotification(type)) {
    return {
      title: tGrocery(`notifications.${type}.title`, { fallback: notification.title }),
      body: tGrocery(`notifications.${type}.body`, { ...data, fallback: notification.body }),
      link: typeof data.link === 'string' && data.link.startsWith('/') ? data.link : '/grocery',
    };
  }

  return {
    title: notification?.title || '',
    body: notification?.body || '',
    link: typeof data.link === 'string' && data.link.startsWith('/') ? data.link : null,
  };
};
