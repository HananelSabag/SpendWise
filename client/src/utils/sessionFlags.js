/**
 * Session-scoped UI flags (sessionStorage) — used to react immediately to a
 * user's home-preference choice before React Query's profile cache refreshes.
 */

export const HOME_REDIRECT_KEY = 'sw_home_redirect';

/** Read a sessionStorage flag safely (never throws — SSR/private-mode safe). */
export const getSessionFlag = (key) => {
  try { return sessionStorage.getItem(key); } catch { return null; }
};
