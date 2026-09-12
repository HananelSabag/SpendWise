const fs = require('fs');
const path = require('path');

const service = fs.readFileSync(
  path.join(__dirname, '..', 'services', 'dashboardService.js'),
  'utf8',
);

describe('dashboard shell performance guardrails', () => {
  it('loads only the recent rows used by the live dashboard', () => {
    expect(service).toContain('Transaction.getRecent(userId, 10)');
    expect(service).not.toContain('getAvailableMonths');
    expect(service).not.toContain('calendarActivity');
  });

});
