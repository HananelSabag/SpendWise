jest.mock('../config/db', () => ({ query: jest.fn(), getClient: jest.fn() }));
jest.mock('../models/UserCache', () => ({
  UserCache: new Proxy({}, { get: () => jest.fn() }),
}));

const db = require('../config/db');
const { User } = require('../models/User');

/**
 * The value bound to `language_preference` in the INSERT.
 *
 * Both statements write `language_preference, currency_preference, ...` in that
 * order, and currency is pinned to ILS app-wide, so the language is simply the
 * parameter immediately before 'ILS'. Cheaper and far less brittle than pairing
 * the column list against a VALUES clause that also contains literals.
 */
const languageFromInsert = () => {
  const call = db.query.mock.calls.find(([sql]) => /INSERT INTO users/i.test(sql));
  expect(call).toBeDefined();

  const params = call[1];
  const currencyIndex = params.indexOf('ILS');
  expect(currencyIndex).toBeGreaterThan(0);

  return params[currencyIndex - 1];
};

beforeEach(() => {
  db.query.mockReset();
  // No existing user, then the created row.
  db.query.mockResolvedValue({ rows: [{ id: 1, email: 'a@b.com' }], rowCount: 0 });
});

/**
 * SpendWise is an Israeli-market app. New accounts were hardcoded to English,
 * so every signup started in the wrong language and generally stayed there.
 */
describe('a new account starts in the right language', () => {
  test('password signup defaults to Hebrew', async () => {
    await User.create('a@b.com', 'ab', 'pw12345678', { firstName: 'A' });
    expect(languageFromInsert()).toBe('he');
  });

  test('password signup honours an explicit English choice', async () => {
    await User.create('a@b.com', 'ab', 'pw12345678', { firstName: 'A', language: 'en' });
    expect(languageFromInsert()).toBe('en');
  });

  test('Google signup defaults to Hebrew', async () => {
    await User.createGoogleOnlyUser('a@b.com', 'ab', { google_id: 'g1' });
    expect(languageFromInsert()).toBe('he');
  });

  test('Google signup honours an explicit English choice', async () => {
    await User.createGoogleOnlyUser('a@b.com', 'ab', { google_id: 'g1', language: 'en' });
    expect(languageFromInsert()).toBe('en');
  });

  test('an unrecognised language falls back to Hebrew rather than being stored', async () => {
    await User.create('a@b.com', 'ab', 'pw12345678', { language: 'fr' });
    expect(languageFromInsert()).toBe('he');
  });
});
