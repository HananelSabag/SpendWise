/**
 * App mode — full SpendWise, or the grocery list on its own.
 *
 * Two distinct concepts, deliberately kept apart:
 *
 *   preference  `user.preferences.default_home` — what the app opens as, saved
 *               on the account and changed only from Profile → Preferences or
 *               the first-run picker.
 *   override    a sessionStorage flag — a one-time "just for now" switch that
 *               lasts until the tab closes and never touches the preference.
 *
 * The two modes don't blend: in grocery mode the app shows the grocery shell and
 * the grocery routes, and the only crossing point is an explicit switch action.
 * Reading the effective mode always goes through `resolveAppMode` so no
 * component invents its own slightly different rule (which is exactly how the
 * old `shopping_list_as_default_page` flag ended up contradicting itself).
 */

export const APP_MODE = {
  FULL: 'full',
  GROCERY: 'grocery',
};

const OVERRIDE_KEY = 'sw_app_mode_override';
export const HOME_PREFERENCE_SET = 'home_preference_set';

/** Values `default_home` may hold. 'shopping' is the pre-rename spelling. */
const GROCERY_PREFERENCE_VALUES = new Set(['grocery', 'shopping']);

const readOverride = () => {
  try {
    const value = sessionStorage.getItem(OVERRIDE_KEY);
    return value === APP_MODE.FULL || value === APP_MODE.GROCERY ? value : null;
  } catch {
    return null;
  }
};

/** Set (or clear, with `null`) the one-time mode for this tab. */
export const setModeOverride = (mode) => {
  try {
    if (mode === null) sessionStorage.removeItem(OVERRIDE_KEY);
    else sessionStorage.setItem(OVERRIDE_KEY, mode);
  } catch { /* private mode — the saved preference still applies */ }
};

/** What the account is set to, ignoring any one-time override. */
export const preferredAppMode = (user) => {
  const preferences = user?.preferences || {};
  if (GROCERY_PREFERENCE_VALUES.has(preferences.default_home)) return APP_MODE.GROCERY;
  // Legacy flag from the wishlist era — still honoured for accounts that set it.
  if (preferences.shopping_list_as_default_page === true) return APP_MODE.GROCERY;
  return APP_MODE.FULL;
};

/** The mode actually in effect right now: this tab's override, else the preference. */
export const resolveAppMode = (user) => readOverride() || preferredAppMode(user);

export const isGroceryMode = (user) => resolveAppMode(user) === APP_MODE.GROCERY;

/** Has the user ever been asked which home they want? */
export const hasChosenHome = (user) => {
  const preferences = user?.preferences || {};
  return preferences[HOME_PREFERENCE_SET] === true
    || !!preferences.default_home
    || preferences.shopping_list_as_default_page === true;
};

/** The preference payload to persist for a mode; used by the picker and Profile. */
export const preferencesForMode = (existing, mode) => ({
  ...(existing || {}),
  default_home: mode === APP_MODE.GROCERY ? 'grocery' : 'dashboard',
  [HOME_PREFERENCE_SET]: true,
  // Keep the legacy key consistent for any client still reading it. Remove once
  // no persisted preference carries it (see AGENTS.md).
  shopping_list_as_default_page: mode === APP_MODE.GROCERY,
});

export const landingPathForMode = (mode) => (mode === APP_MODE.GROCERY ? '/grocery' : '/');
