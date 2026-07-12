const fs = require('fs');
const path = require('path');

const read = (...parts) => fs.readFileSync(path.join(__dirname, '..', ...parts), 'utf8');

describe('disabled account financial scope', () => {
  test.each([
    ['Runway', ['services', 'cycleRunwayService.js']],
    ['monthly accounting', ['services', 'monthlyAccountingService.js']],
    ['salary review', ['services', 'salaryReviewService.js']],
    ['salary candidates', ['controllers', 'transactionController.js']],
    ['available months', ['models', 'Transaction.js']],
  ])('%s excludes rows whose account toggle is off', (_name, parts) => {
    const source = read(...parts);
    expect(source).toMatch(/ba_filter\.enabled\s*=\s*false/i);
    expect(source).toMatch(/ba_filter\.account_number\s*=\s*COALESCE\(t\.bank_account_number,\s*''\)/i);
  });
});

