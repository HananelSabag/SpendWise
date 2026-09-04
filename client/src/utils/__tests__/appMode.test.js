import { beforeEach, describe, expect, it } from 'vitest';

import {
  APP_MODE,
  hasChosenHome,
  isGroceryMode,
  landingPathForMode,
  preferencesForMode,
  preferredAppMode,
  resolveAppMode,
  setModeOverride,
} from '../appMode';

beforeEach(() => {
  sessionStorage.clear();
});

describe('preferredAppMode', () => {
  it('defaults to full SpendWise when nothing is set', () => {
    expect(preferredAppMode(undefined)).toBe(APP_MODE.FULL);
    expect(preferredAppMode({ preferences: {} })).toBe(APP_MODE.FULL);
  });

  it('reads the saved grocery default', () => {
    expect(preferredAppMode({ preferences: { default_home: 'grocery' } })).toBe(APP_MODE.GROCERY);
  });

  it('still honours the pre-rename "shopping" value', () => {
    expect(preferredAppMode({ preferences: { default_home: 'shopping' } })).toBe(APP_MODE.GROCERY);
  });

  it('still honours the legacy boolean flag', () => {
    expect(preferredAppMode({ preferences: { shopping_list_as_default_page: true } }))
      .toBe(APP_MODE.GROCERY);
  });

  it('treats an unrelated default_home as full mode', () => {
    expect(preferredAppMode({ preferences: { default_home: 'transactions' } })).toBe(APP_MODE.FULL);
  });
});

describe('one-time override', () => {
  it('wins over the saved preference for this tab only', () => {
    const user = { preferences: { default_home: 'grocery' } };
    expect(resolveAppMode(user)).toBe(APP_MODE.GROCERY);

    setModeOverride(APP_MODE.FULL);

    expect(resolveAppMode(user)).toBe(APP_MODE.FULL);
    // The account preference itself is untouched — that's the whole point.
    expect(preferredAppMode(user)).toBe(APP_MODE.GROCERY);
  });

  it('is cleared with null', () => {
    setModeOverride(APP_MODE.FULL);
    setModeOverride(null);
    expect(resolveAppMode({ preferences: { default_home: 'grocery' } })).toBe(APP_MODE.GROCERY);
  });

  it('ignores a junk value rather than inventing a third mode', () => {
    sessionStorage.setItem('sw_app_mode_override', 'nonsense');
    expect(resolveAppMode({ preferences: {} })).toBe(APP_MODE.FULL);
  });
});

describe('hasChosenHome', () => {
  it('is false for a brand new account, so the picker shows', () => {
    expect(hasChosenHome({ preferences: {} })).toBe(false);
    expect(hasChosenHome(undefined)).toBe(false);
  });

  it('is true once the flag, a default, or the legacy flag is present', () => {
    expect(hasChosenHome({ preferences: { home_preference_set: true } })).toBe(true);
    expect(hasChosenHome({ preferences: { default_home: 'dashboard' } })).toBe(true);
    expect(hasChosenHome({ preferences: { shopping_list_as_default_page: true } })).toBe(true);
  });
});

describe('preferencesForMode', () => {
  it('keeps unrelated preferences intact', () => {
    const saved = preferencesForMode({ theme: 'dark', foo: 1 }, APP_MODE.GROCERY);
    expect(saved).toMatchObject({ theme: 'dark', foo: 1 });
  });

  it('writes the mode and marks the choice as made', () => {
    expect(preferencesForMode({}, APP_MODE.GROCERY)).toMatchObject({
      default_home: 'grocery',
      home_preference_set: true,
      shopping_list_as_default_page: true,
    });
    expect(preferencesForMode({}, APP_MODE.FULL)).toMatchObject({
      default_home: 'dashboard',
      home_preference_set: true,
      shopping_list_as_default_page: false,
    });
  });

  it('round-trips through preferredAppMode', () => {
    for (const mode of [APP_MODE.FULL, APP_MODE.GROCERY]) {
      expect(preferredAppMode({ preferences: preferencesForMode({}, mode) })).toBe(mode);
    }
  });
});

describe('landing paths', () => {
  it('sends each mode to its own entry point', () => {
    expect(landingPathForMode(APP_MODE.GROCERY)).toBe('/grocery');
    expect(landingPathForMode(APP_MODE.FULL)).toBe('/');
  });

  it('isGroceryMode agrees with resolveAppMode', () => {
    const user = { preferences: { default_home: 'grocery' } };
    expect(isGroceryMode(user)).toBe(true);
    setModeOverride(APP_MODE.FULL);
    expect(isGroceryMode(user)).toBe(false);
  });
});
