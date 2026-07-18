const { getCalendarPeriod } = require('../utils/calendarPeriod');

describe('calendar period Israel boundaries', () => {
  test('uses the Israel-local month across a UTC month boundary', () => {
    expect(getCalendarPeriod(0, new Date('2026-03-31T21:30:00Z'))).toMatchObject({
      month: '2026-04', start: '2026-04-01', end: '2026-05-01', daysElapsed: 1,
    });
  });

  test('handles year rollover and leap February without date arithmetic drift', () => {
    expect(getCalendarPeriod(-1, new Date('2027-01-01T00:30:00+02:00'))).toMatchObject({
      month: '2026-12', start: '2026-12-01', end: '2027-01-01', daysInMonth: 31,
    });
    expect(getCalendarPeriod(0, new Date('2028-02-29T12:00:00+02:00'))).toMatchObject({
      month: '2028-02', daysInMonth: 29, daysElapsed: 29,
    });
  });
});
