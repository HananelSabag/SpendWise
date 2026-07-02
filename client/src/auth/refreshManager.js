/**
 * refreshManager — single-flight token refresh with honest failure handling.
 *
 * THE core fix for "I came back after an hour and got logged out":
 * the old interceptor treated ANY refresh failure (including a timeout
 * against a sleeping Render server) as a dead session and wiped tokens.
 * Here, only an explicit 401/403 from the refresh endpoint kills the
 * session; timeouts / network errors / 5xx keep the tokens and retry.
 *
 * Single-flight: concurrent callers (a burst of 401s from parallel
 * queries) all await the SAME refresh promise — exactly one network call.
 *
 * Emits on window:
 *   'auth:logout'     — session is truly dead; app should reset + navigate.
 *   'auth:refreshed'  — new access token stored; timers restarted.
 */

import axios from 'axios';
import {
  getAccessToken, getRefreshToken, setTokens, clearTokens, getTokenExpiry,
} from './tokenStorage.js';

const RETRY_DELAY_MS = 30_000;       // transient failure → try again in 30s
const PROACTIVE_SKEW_SEC = 120;      // refresh 2 minutes before expiry
const REFRESH_TIMEOUT_MS = 60_000;   // generous: must survive a Render cold start

let inflight = null;                 // the single-flight promise
let proactiveTimer = null;
let retryTimer = null;
let loggedOut = false;               // latch: emit auth:logout exactly once per session

function apiBase() {
  const raw = import.meta.env.VITE_API_URL || 'https://spendwise-dx8g.onrender.com/api/v1';
  const trimmed = raw.replace(/\/$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
}

function emit(name, detail) {
  try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch (_) {}
}

function clearTimers() {
  if (proactiveTimer) { clearTimeout(proactiveTimer); proactiveTimer = null; }
  if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
}

/** The session is dead for real. Clear everything, tell the app once. */
function fatalLogout(reason) {
  if (loggedOut) return;
  loggedOut = true;
  clearTimers();
  clearTokens();
  emit('auth:logout', { reason });
}

/** Called after login/refresh stores fresh tokens — re-arms everything. */
export function sessionStarted() {
  loggedOut = false;
  scheduleProactiveRefresh();
}

/** Full stop (user-initiated logout). No event — the caller is the logout flow. */
export function sessionEnded() {
  loggedOut = true;
  clearTimers();
  inflight = null;
}

/**
 * Ensure we hold a fresh access token.
 * Resolves { ok:true, token } on success.
 * Resolves { ok:false, fatal:true } when the session is dead (logout emitted).
 * Resolves { ok:false, transient:true } on network/cold-start trouble —
 *   tokens are KEPT, a retry is scheduled, caller should fail softly.
 */
export function ensureFreshToken() {
  if (inflight) return inflight;

  inflight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      // Nothing to refresh with. Only fatal if we thought we had a session.
      if (getAccessToken()) fatalLogout('NO_REFRESH_TOKEN');
      return { ok: false, fatal: true };
    }

    try {
      // Raw axios (NOT the app client) — must not recurse into interceptors.
      const res = await axios.post(
        `${apiBase()}/users/refresh-token`,
        { refreshToken },
        { timeout: REFRESH_TIMEOUT_MS, headers: { 'Content-Type': 'application/json' } },
      );

      const d = res?.data || {};
      const access = d?.data?.accessToken || d?.accessToken || null;
      const refresh = d?.data?.refreshToken || d?.refreshToken || null;

      if (!access) {
        // Server answered 200 without a token — treat as transient, not fatal.
        scheduleRetry();
        return { ok: false, transient: true };
      }

      setTokens({ access, refresh });
      loggedOut = false;
      scheduleProactiveRefresh();
      emit('auth:refreshed', { });
      return { ok: true, token: access };
    } catch (err) {
      const status = err?.response?.status || 0;

      if (status === 401 || status === 403) {
        // The refresh token itself was rejected — the session is genuinely over.
        fatalLogout(err?.response?.data?.error?.code || 'REFRESH_REJECTED');
        return { ok: false, fatal: true };
      }

      // Timeout / network / 5xx — the server is asleep or unreachable.
      // The refresh token is still perfectly valid: KEEP it, retry soon.
      scheduleRetry();
      return { ok: false, transient: true };
    }
  })().finally(() => { inflight = null; });

  return inflight;
}

function scheduleRetry() {
  if (retryTimer || loggedOut) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    ensureFreshToken();
  }, RETRY_DELAY_MS);
}

/** Arm a timer to refresh just before the current access token expires. */
export function scheduleProactiveRefresh() {
  if (proactiveTimer) { clearTimeout(proactiveTimer); proactiveTimer = null; }
  const token = getAccessToken();
  if (!token || loggedOut) return;

  const exp = getTokenExpiry(token);
  if (exp === null) return;

  const msUntilRefresh = (exp - Date.now() / 1000 - PROACTIVE_SKEW_SEC) * 1000;
  if (msUntilRefresh <= 0) {
    // Already inside the skew window — refresh now.
    ensureFreshToken();
    return;
  }
  proactiveTimer = setTimeout(() => {
    proactiveTimer = null;
    ensureFreshToken();
  }, msUntilRefresh);
}
