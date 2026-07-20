const fs = require('fs');
const path = require('path');

const service = fs.readFileSync(
  path.join(__dirname, '..', 'services', 'cycleService.js'),
  'utf8',
);
const routes = fs.readFileSync(
  path.join(__dirname, '..', 'routes', 'cycleRoutes.js'),
  'utf8',
);

describe('financial-cycle orchestration guardrails', () => {
  it('bounds source queries to an indexed working window', () => {
    expect(service).toContain('bank_processed_date >= $2::date');
    expect(service).toContain('bank_processed_date <= $3::date');
    expect(service).toContain('CONTEXT_MONTHS = 26');
  });

  it('prepares shared engine facts once and builds only one current window', () => {
    expect(service).toContain('engine.prepareCycleData');
    const current = service.slice(
      service.indexOf('async function getCurrentFinancialCycle'),
      service.indexOf('function cycleCategoryTotals'),
    );
    expect((current.match(/engine\.buildCycle\(/g) || [])).toHaveLength(1);
    expect(routes).toContain('getCurrentFinancialCycle(req.user.id)');
  });

  it('keeps exact results briefly on the server and persists closed complete cycles', () => {
    expect(service).toContain('CACHE_TTL_MS = 15_000');
    expect(service).toContain('financial_cycle_aggregates');
    expect(service).toContain('CALCULATION_VERSION = 5');
    expect(service).toContain('!cycle.window.running && !(cycle.partials || []).length');
  });
});
