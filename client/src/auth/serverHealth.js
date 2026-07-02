/**
 * serverHealth — the ONE cold-start mechanism.
 *
 * Render's free tier sleeps after inactivity. Previously three overlapping
 * systems reacted to that (a toast, a banner, a full-page redirect), each
 * re-armed on every page load. This module:
 *
 *  1. Pings /health once at boot (fire-and-forget) so the server starts
 *     waking BEFORE the user clicks anything.
 *  2. Remembers the last confirmed-warm time in sessionStorage, so a soft
 *     reload within 10 minutes doesn't re-arm "is it awake?" machinery.
 */

const WARM_KEY = 'spendwise-last-warm-at';
const WARM_WINDOW_MS = 10 * 60 * 1000;

function apiBase() {
  const raw = import.meta.env.VITE_API_URL || 'https://spendwise-dx8g.onrender.com/api/v1';
  const trimmed = raw.replace(/\/$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
}

export function markWarm() {
  try { sessionStorage.setItem(WARM_KEY, String(Date.now())); } catch (_) {}
}

/** Was the server confirmed responsive within the last 10 minutes? */
export function isRecentlyWarm() {
  try {
    const at = Number(sessionStorage.getItem(WARM_KEY) || 0);
    return Date.now() - at < WARM_WINDOW_MS;
  } catch (_) {
    return false;
  }
}

/** Fire-and-forget boot ping. Never throws, never blocks rendering. */
export function warmUpServer() {
  if (isRecentlyWarm()) return;
  try {
    // /health lives at the server root, not under /api/v1.
    const healthUrl = apiBase().replace(/\/api\/v1$/, '') + '/health';
    fetch(healthUrl, { method: 'GET', cache: 'no-store' })
      .then((res) => { if (res.ok) markWarm(); })
      .catch(() => { /* asleep — the ping itself has started the wake-up */ });
  } catch (_) {}
}
