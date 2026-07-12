const { detectSalaryConflicts } = require('../services/salaryReviewService');

const row = (id, date, amount = 10000) => ({
  id,
  bank_source: 'leumi',
  bank_account_number: 'bank',
  amount,
  type: 'income',
  description: 'ACME SALARY',
  date,
  bank_status: 'completed',
});

const signatures = [{
  id: 1,
  bank_source: 'leumi',
  bank_account_number: 'bank',
  normalized_description: 'acme salary',
  month_offset: -1,
}];

describe('salary review conflicts', () => {
  test('asks when the same employer pays twice into one economic month', () => {
    const conflicts = detectSalaryConflicts([
      row(1, '2026-07-09', 10000),
      row(2, '2026-07-20', 2500),
    ], signatures);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({ economicMonth: '2026-06', totalAmount: 12500 });
    expect(conflicts[0].transactions).toHaveLength(2);
  });

  test('a bonus decision removes the false second salary anchor', () => {
    const conflicts = detectSalaryConflicts([
      row(1, '2026-07-09', 10000),
      row(2, '2026-07-20', 2500),
    ], signatures, [{ transaction_id: 2, classification: 'bonus', economic_month: '2026-06-01' }]);
    expect(conflicts).toEqual([]);
  });

  test('explicitly confirming both salaries resolves the prompt', () => {
    const overrides = [1, 2].map((transaction_id) => ({ transaction_id, classification: 'salary', economic_month: '2026-06-01' }));
    expect(detectSalaryConflicts([row(1, '2026-07-09'), row(2, '2026-07-20')], signatures, overrides)).toEqual([]);
  });
});
