const {
  calendarDateInTz,
  normalizeProcessedDate,
  normalizeBankStatus,
} = require('../services/bankSyncService');

describe('bank sync statement metadata', () => {
  test('keeps an Israeli local-midnight payment on the same calendar day', () => {
    expect(calendarDateInTz(new Date('2026-07-09T21:00:00.000Z'))).toBe('2026-07-10');
  });

  test('normalizes a valid processed date and rejects malformed input', () => {
    expect(normalizeProcessedDate('2026-07-10T00:00:00.000Z')).toBe('2026-07-10');
    expect(normalizeProcessedDate('not-a-date')).toBeNull();
    expect(normalizeProcessedDate(null)).toBeNull();
  });

  test('accepts only scraper-supported transaction statuses', () => {
    expect(normalizeBankStatus('pending')).toBe('pending');
    expect(normalizeBankStatus('completed')).toBe('completed');
    expect(normalizeBankStatus('unknown')).toBeNull();
  });
});
