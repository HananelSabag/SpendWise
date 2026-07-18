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

  it('uses a short server cache for repeated home loads', () => {
    expect(service).toContain('CACHE_TTL_MS = 15_000');
    expect(service).toContain('cache.get(userId)');
  });
});
