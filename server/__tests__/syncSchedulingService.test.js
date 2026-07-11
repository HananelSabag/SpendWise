const {
  lastTargetInstant,
  zonedWallTimeToUtc,
} = require('../services/syncSchedulingService');

describe('Israel sync target scheduling', () => {
  const previous = process.env.SYNC_TARGET_HOURS;

  beforeEach(() => { delete process.env.SYNC_TARGET_HOURS; });
  afterAll(() => {
    if (previous === undefined) delete process.env.SYNC_TARGET_HOURS;
    else process.env.SYNC_TARGET_HOURS = previous;
  });

  test('uses 07:00 and 19:00 Israel targets in summer', () => {
    expect(lastTargetInstant(new Date('2026-07-11T16:05:00.000Z')).toISOString())
      .toBe('2026-07-11T16:00:00.000Z');
    expect(lastTargetInstant(new Date('2026-07-11T04:05:00.000Z')).toISOString())
      .toBe('2026-07-11T04:00:00.000Z');
  });

  test('converts winter wall time with the winter offset', () => {
    expect(zonedWallTimeToUtc(2026, 0, 15, 7, 'Asia/Jerusalem').toISOString())
      .toBe('2026-01-15T05:00:00.000Z');
    expect(zonedWallTimeToUtc(2026, 0, 15, 19, 'Asia/Jerusalem').toISOString())
      .toBe('2026-01-15T17:00:00.000Z');
  });
});
