const fs = require('fs');
const path = require('path');

const service = fs.readFileSync(
  path.join(__dirname, '..', 'services', 'dashboardService.js'),
  'utf8',
);

describe('dashboard financial-period model guardrails', () => {
  it('uses card payment dates throughout cycle aggregation', () => {
    expect(service).toContain('COALESCE(t.bank_processed_date, t.date)');
    expect(service.match(/COALESCE\(t\.bank_processed_date, t\.date\)/g)?.length).toBeGreaterThanOrEqual(6);
  });

  it('loads recent transactions from the selected period', () => {
    expect(service).toContain('Transaction.getRecentForPeriod');
  });

  it('passes the requested history offset through the shared cycle service', () => {
    expect(service).toContain('getUserFinancialCycle(userId, requestedOffset)');
  });
});

