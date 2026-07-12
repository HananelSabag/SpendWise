const fs = require('fs');
const path = require('path');

const model = fs.readFileSync(
  path.join(__dirname, '..', 'models', 'Transaction.js'),
  'utf8',
);

describe('transaction calendar period model guardrails', () => {
  it('filters client lists by factual transaction date', () => {
    expect(model).toContain('conditions.push(`t.date >= $${startParam}`)');
    expect(model).toContain('conditions.push(`t.date < $${endParam}`)');
  });

  it('does not move card purchases between months using provider processed date', () => {
    expect(model).not.toContain('THEN COALESCE(t.bank_processed_date, t.date)');
    expect(model).toContain('t.date AS financial_period_date');
  });
});
