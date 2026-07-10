const {
  getPeriodContaining,
  getPeriodForOffset,
} = require('../utils/financialPeriod');
const {
  normalizeCycleDay,
  normalizePeriodOffset,
} = require('../services/financialCycleService');

describe('financial period calendar windows', () => {
  it('starts a cycle on the configured boundary day', () => {
    expect(getPeriodContaining(10, new Date('2026-07-10T12:00:00Z'))).toEqual({
      start: '2026-07-10',
      end: '2026-08-10',
    });
  });

  it('keeps the day before the boundary in the previous cycle', () => {
    expect(getPeriodContaining(10, new Date('2026-07-09T12:00:00Z'))).toEqual({
      start: '2026-06-10',
      end: '2026-07-10',
    });
  });

  it('clamps cycle day 31 to the last real day of a short month', () => {
    expect(getPeriodContaining(31, new Date('2026-02-28T12:00:00Z'))).toEqual({
      start: '2026-02-28',
      end: '2026-03-31',
    });
  });

  it('moves backward through cycle windows without losing the cycle day', () => {
    expect(getPeriodForOffset(10, -2, new Date('2026-07-15T12:00:00Z'))).toEqual({
      start: '2026-05-10',
      end: '2026-06-10',
    });
    expect(getPeriodForOffset(31, -1, new Date('2026-03-31T12:00:00Z'))).toEqual({
      start: '2026-02-28',
      end: '2026-03-31',
    });
  });
});

describe('financial period input normalization', () => {
  it('keeps cycle days and history offsets inside safe bounds', () => {
    expect(normalizeCycleDay(10)).toBe(10);
    expect(normalizeCycleDay(32)).toBe(1);
    expect(normalizePeriodOffset(-2)).toBe(-2);
    expect(normalizePeriodOffset(3)).toBe(0);
    expect(normalizePeriodOffset(-200)).toBe(-24);
    expect(normalizePeriodOffset('bad')).toBe(0);
  });
});

