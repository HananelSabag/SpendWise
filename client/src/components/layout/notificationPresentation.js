/**
 * Notification presentation — turn a stored `{ type, data }` into text.
 *
 * The server stores a stable type plus structured data and only an English
 * fallback in `title`/`body`. Display text is resolved from the translation
 * files where a type has them, which is why a Hebrew-stored notification no
 * longer forces Hebrew on an English user (and vice versa).
 *
 * Grocery invitations used to be the one family resolved that way. Nothing
 * emits them any more — the list is its own app — so every type now falls back
 * to the stored strings, which is what an unknown type always did.
 */

export const presentNotification = (notification) => {
  const data = notification?.data || {};

  return {
    title: notification?.title || '',
    body: notification?.body || '',
    link: typeof data.link === 'string' && data.link.startsWith('/') ? data.link : null,
  };
};
