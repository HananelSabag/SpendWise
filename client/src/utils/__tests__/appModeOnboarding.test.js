import { beforeEach, describe, expect, it } from 'vitest';

import {
  APP_MODE,
  hasSeenOnboarding,
  preferencesWithOnboardingSeen,
  preferencesForMode,
} from '../appMode';

beforeEach(() => {
  sessionStorage.clear();
});

describe('per-mode onboarding tracking', () => {
  it('a fresh account has seen neither intro', () => {
    expect(hasSeenOnboarding({ preferences: {} }, APP_MODE.FULL)).toBe(false);
    expect(hasSeenOnboarding({ preferences: {} }, APP_MODE.GROCERY)).toBe(false);
    expect(hasSeenOnboarding(undefined, APP_MODE.FULL)).toBe(false);
  });

  it('marks one mode without marking the other', () => {
    const prefs = preferencesWithOnboardingSeen({}, APP_MODE.GROCERY);

    expect(hasSeenOnboarding({ preferences: prefs }, APP_MODE.GROCERY)).toBe(true);
    // The whole point of tracking per mode: switching later still gets an intro.
    expect(hasSeenOnboarding({ preferences: prefs }, APP_MODE.FULL)).toBe(false);
  });

  it('accumulates rather than replacing', () => {
    let prefs = preferencesWithOnboardingSeen({}, APP_MODE.GROCERY);
    prefs = preferencesWithOnboardingSeen(prefs, APP_MODE.FULL);

    expect(hasSeenOnboarding({ preferences: prefs }, APP_MODE.GROCERY)).toBe(true);
    expect(hasSeenOnboarding({ preferences: prefs }, APP_MODE.FULL)).toBe(true);
  });

  it('leaves unrelated preferences alone', () => {
    const prefs = preferencesWithOnboardingSeen(
      { default_home: 'grocery', theme: 'dark' },
      APP_MODE.GROCERY
    );

    expect(prefs).toMatchObject({ default_home: 'grocery', theme: 'dark' });
  });

  it('survives a later mode change, so the intro is not re-shown', () => {
    let prefs = preferencesWithOnboardingSeen({}, APP_MODE.GROCERY);
    prefs = preferencesForMode(prefs, APP_MODE.FULL);

    expect(hasSeenOnboarding({ preferences: prefs }, APP_MODE.GROCERY)).toBe(true);
    expect(prefs.default_home).toBe('dashboard');
  });

  it('treats a malformed stored value as unseen rather than throwing', () => {
    expect(hasSeenOnboarding({ preferences: { onboarding_seen: null } }, APP_MODE.FULL)).toBe(false);
    expect(hasSeenOnboarding({ preferences: { onboarding_seen: {} } }, APP_MODE.FULL)).toBe(false);
  });
});
