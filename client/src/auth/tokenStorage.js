/**
 * tokenStorage — the ONLY module allowed to touch auth tokens in storage.
 *
 * Why: the app previously juggled three keys (accessToken / authToken /
 * refreshToken) plus a persisted zustand blob, and different code paths
 * cleaned up different subsets — leaving "zombie" sessions where a stale
 * key made the app render authenticated with a dead token. One module,
 * two keys, one truth.
 */

import { jwtDecode } from 'jwt-decode';

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

// Legacy keys from previous auth implementations — migrated then removed.
const LEGACY_KEYS = ['authToken', 'user', 'blockedSession'];

/** One-time migration: adopt a legacy access token if it's the only one, then purge. */
export function migrateLegacyKeys() {
  try {
    const legacyAccess = localStorage.getItem('authToken');
    if (legacyAccess && !localStorage.getItem(ACCESS_KEY)) {
      localStorage.setItem(ACCESS_KEY, legacyAccess);
    }
    for (const key of LEGACY_KEYS) {
      if (key !== 'blockedSession') localStorage.removeItem(key);
    }
  } catch (_) { /* storage unavailable — nothing to migrate */ }
}

export function getAccessToken() {
  try { return localStorage.getItem(ACCESS_KEY) || null; } catch (_) { return null; }
}

export function getRefreshToken() {
  try { return localStorage.getItem(REFRESH_KEY) || null; } catch (_) { return null; }
}

export function setTokens({ access, refresh } = {}) {
  try {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  } catch (_) { /* private mode etc. — session will simply not persist */ }
}

export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    for (const key of LEGACY_KEYS) localStorage.removeItem(key);
  } catch (_) {}
}

/**
 * Decode a JWT's expiry. Returns epoch-seconds or null when unreadable.
 * (Signature is NOT verified — the server does that; we only need timing.)
 */
export function getTokenExpiry(token) {
  try {
    const { exp } = jwtDecode(token);
    return typeof exp === 'number' ? exp : null;
  } catch (_) {
    return null;
  }
}

/**
 * Is the stored access token present and not within `skewSec` of expiry?
 * The default 120s skew means we treat a token expiring in <2 minutes as
 * already stale, so a refresh happens BEFORE requests start failing.
 */
export function isAccessTokenValid(skewSec = 120) {
  const token = getAccessToken();
  if (!token) return false;
  const exp = getTokenExpiry(token);
  if (exp === null) return false;
  return exp - Date.now() / 1000 > skewSec;
}

/** True when we hold a refresh token (session is recoverable even if access expired). */
export function hasSession() {
  return Boolean(getRefreshToken() || getAccessToken());
}
