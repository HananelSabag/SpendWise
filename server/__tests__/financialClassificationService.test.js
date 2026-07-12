const {
  classifyTransaction,
  summarizeCalendar,
  spendingBreakdown,
  withoutSupersededPendingBankRows,
} = require('../services/financialClassificationService');

const row = (overrides = {}) => ({
  id: 1,
  bank_source: 'leumi',
  bank_account_number: '797-43483_78',
  amount: 100,
  type: 'expense',
  description: 'ordinary movement',
  date: '2026-07-01',
  bank_status: 'completed',
  ...overrides,
});

describe('financial classification', () => {
  test('maps Leumi Max and Cal settlements without treating debit as settlement', () => {
    const max = classifyTransaction(row({
      description: 'לאומי ויזה', bank_sync_id: 'leumi:acct:122254', amount: 12744.22,
    }));
    expect(max.settlementRole).toBe('card_settlement');
    expect(max.calendarInclusion).toBe('exclude');
    expect(max.reconciliation).toMatchObject({ cardSource: 'max', cardAccount: '2254' });

    const cal = classifyTransaction(row({
      description: 'כרטיסי אשראי-י', bank_sync_id: 'leumi:acct:987654', amount: 4734.66,
    }));
    expect(cal.reconciliation).toMatchObject({ cardSource: 'visa_cal', cardAccount: null });

    const debit = classifyTransaction(row({
      description: 'כרטיס דביט', notes: 'בכרטיס המסתיים ב-8345', amount: 88,
    }));
    expect(debit).toMatchObject({
      economicRole: 'expense', sourceRole: 'bank_primary', settlementRole: 'debit_direct',
      calendarInclusion: 'include', direction: 'spend',
    });
  });

  test('uses bank debit as primary and the connected Max copy as enrichment only', () => {
    const card = classifyTransaction(row({
      bank_source: 'max', bank_account_number: '8345', description: 'ALIEXPRESS', amount: 240.98,
    }), { debitCardAccounts: [{ source: 'max', account: '8345' }] });
    expect(card).toMatchObject({
      sourceRole: 'card_enrichment', settlementRole: 'debit_direct', calendarInclusion: 'exclude',
    });
  });

  test('classifies salary, financing, securities, and confirmed internal transfers separately', () => {
    const salaryContext = { salarySignatures: [{
      id: 1, bank_source: 'leumi', bank_account_number: '797-43483_78',
      normalized_description: 'הורייזן טכנו-י', month_offset: -1,
    }] };
    expect(classifyTransaction(row({ type: 'income', description: 'הורייזן טכנו-י' }), salaryContext))
      .toMatchObject({ economicRole: 'income', salary: true, monthOffset: -1, calendarInclusion: 'include' });
    expect(classifyTransaction(row({ type: 'income', description: 'העמדת הלואה' })))
      .toMatchObject({ economicRole: 'loan', calendarInclusion: 'exclude' });
    expect(classifyTransaction(row({ type: 'income', description: 'פריסה לתשלומים' })))
      .toMatchObject({ economicRole: 'loan', calendarInclusion: 'exclude', direction: 'neutral' });
    expect(classifyTransaction(row({ type: 'income', description: 'העברת ניירות ערך' })))
      .toMatchObject({ economicRole: 'security', calendarInclusion: 'exclude' });
    // A former employer's salary must NOT be hardcoded as "securities": unmarked it
    // is ordinary income, and a user salary signature makes it salary (job change).
    expect(classifyTransaction(row({ type: 'income', description: 'גלש"ן שווקים-י' })))
      .toMatchObject({ economicRole: 'income', salary: false, calendarInclusion: 'include' });
    expect(classifyTransaction(row({ type: 'income', description: 'גלש"ן שווקים-י' }), {
      salarySignatures: [{
        id: 2, bank_source: 'leumi', bank_account_number: '797-43483_78',
        normalized_description: 'גלש"ן שווקים-י', month_offset: -1,
      }],
    })).toMatchObject({ economicRole: 'income', salary: true, monthOffset: -1 });
    expect(classifyTransaction(row({ type: 'income', description: 'העברה שלי' }), {
      internalTransferSignatures: [{ bank_source: 'leumi', description: 'העברה שלי' }],
    })).toMatchObject({ economicRole: 'transfer', calendarInclusion: 'exclude' });
  });

  test('ordinary bank cash/direct expenses count, while unknown sources remain visible', () => {
    expect(classifyTransaction(row({ description: 'משיכת מזומן' })))
      .toMatchObject({ calendarInclusion: 'include', direction: 'spend' });
    expect(classifyTransaction(row({ description: 'פרעון הלוואה' })))
      .toMatchObject({ economicRole: 'loan', loanRepayment: true, calendarInclusion: 'include' });
    expect(classifyTransaction(row({ bank_source: 'mystery_bank' })))
      .toMatchObject({ economicRole: 'unknown', calendarInclusion: 'needs_review' });
  });

  test('a reviewed bonus remains income but no longer creates a salary anchor', () => {
    const context = {
      salarySignatures: [{
        id: 1, bank_source: 'leumi', bank_account_number: '797-43483_78',
        normalized_description: 'acme salary', month_offset: -1,
      }],
      transactionOverrides: [{
        transaction_id: 7, classification: 'bonus', economic_month: '2026-06-01',
      }],
    };
    expect(classifyTransaction(row({ id: 7, type: 'income', description: 'ACME SALARY' }), context))
      .toMatchObject({
        economicRole: 'income', salary: false, direction: 'income',
        economicMonth: '2026-06', calendarInclusion: 'include',
      });
  });

  test('refunds reduce card spend and pending affects committed, not actual', () => {
    const summary = summarizeCalendar([
      row({ id: 1, bank_source: 'max', bank_account_number: '2254', amount: 100 }),
      row({ id: 2, bank_source: 'max', bank_account_number: '2254', amount: 20, type: 'income' }),
      row({ id: 3, bank_source: 'max', bank_account_number: '2254', amount: 30, bank_status: 'pending' }),
      row({ id: 4, amount: 50, type: 'income', description: 'gift' }),
    ]).totals;
    expect(summary.cardRefunds).toBe(20);
    expect(summary.spendActual).toBe(80);
    expect(summary.spendCommitted).toBe(110);
    expect(summary.netActual).toBe(-30);
    expect(summary.netCommitted).toBe(-60);
  });

  test('derived totals supersede an exact pending bank copy with its completed fact', () => {
    const rows = [
      row({ id: 1, amount: 1086.44, description: 'פרעון הלוואה', bank_status: 'pending' }),
      row({ id: 2, amount: 1086.44, description: 'פרעון הלוואה', bank_status: 'completed' }),
      row({ id: 3, amount: 1046.45, description: 'פרעון הלוואה', bank_status: 'pending', date: '2026-07-12' }),
    ];
    expect(withoutSupersededPendingBankRows(rows).map((item) => item.id)).toEqual([2, 3]);
    expect(summarizeCalendar(rows).totals).toMatchObject({
      bankDirectSpend: 1086.44,
      bankDirectPending: 1046.45,
      spendCommitted: 2132.89,
    });
  });

  test('dashboard breakdown preserves every expense bucket for an honest Other total', () => {
    const rows = Array.from({ length: 14 }, (_, index) => row({
      id: index + 1,
      bank_source: 'max',
      amount: index + 1,
      raw_category: `category-${index + 1}`,
    }));
    const breakdown = spendingBreakdown(rows);
    expect(breakdown).toHaveLength(14);
    expect(breakdown.reduce((sum, item) => sum + item.amount, 0)).toBe(105);
    expect(spendingBreakdown(rows, {}, 12)).toHaveLength(12);
  });
});
