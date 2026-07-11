const fs = require('fs');
const path = require('path');

const service = fs.readFileSync(
  path.join(__dirname, '..', 'services', 'dashboardService.js'),
  'utf8',
);

describe('dashboard calendar-month model guardrails', () => {
  it('uses factual purchase dates for calendar aggregation', () => {
    expect(service).toContain('getCalendarPeriod(requestedOffset)');
    expect(service).not.toContain('COALESCE(t.bank_processed_date, t.date)');
  });

  it('loads recent transactions from the selected period', () => {
    expect(service).toContain('Transaction.getRecentForPeriod');
  });

  it('passes the requested history offset through the calendar period helper', () => {
    expect(service).toContain('getCalendarPeriod(requestedOffset)');
  });
});
