const fs = require('fs');
const path = require('path');

const route = fs.readFileSync(
  path.join(__dirname, '..', 'routes', 'bankSyncRoutes.js'),
  'utf8',
);
const statsRoute = route.slice(
  route.indexOf("router.get('/stats'"),
  route.indexOf('module.exports'),
);

describe('bank-sync stats boundary', () => {
  test('stays operational and leaves financial totals to the cycle engine', () => {
    expect(route).not.toContain("require('../utils/calendarPeriod')");
    expect(statsRoute).not.toMatch(/periodOffset|getCalendarPeriod|total_income|total_expense|income_count|expense_count/);
    expect(statsRoute).toContain("'transaction_count'");
    expect(statsRoute).toContain("'balance'");
    expect(statsRoute).toContain("'enabled'");
    expect(statsRoute).toContain("'last_transaction_at'");
    expect(statsRoute).toContain('AS last_sync');
  });
});
