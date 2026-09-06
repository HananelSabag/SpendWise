import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_LANGUAGE, resolveInitialLanguage } from '../translationStore';

/**
 * Which language a first-time visitor gets.
 *
 * This is not a style preference: the sign-up screen's language is what the
 * client SENDS as the new account's `language_preference`, so an English
 * default silently created English accounts for Israeli users. Two real
 * accounts were created that way before this was fixed.
 */
describe('initial language', () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('is Hebrew when nobody has chosen', () => {
    expect(resolveInitialLanguage()).toBe('he');
    expect(DEFAULT_LANGUAGE).toBe('he');
  });

  it('honours a saved choice over the default', () => {
    localStorage.setItem('spendwise-language', 'en');
    expect(resolveInitialLanguage()).toBe('en');
  });

  it('lets this tab override the saved account preference', () => {
    localStorage.setItem('spendwise-language', 'he');
    sessionStorage.setItem('spendwise-session-language', 'en');
    expect(resolveInitialLanguage()).toBe('en');
  });
});
