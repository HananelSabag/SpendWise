jest.mock('../config/db', () => ({ query: jest.fn() }));

const db = require('../config/db');
const { loadCardSettings } = require('../services/cycleService');

describe('financial card settings', () => {
  beforeEach(() => db.query.mockReset());

  test('derives the linked provider identifier from transactions.bank_sync_id', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{
        bank_source: 'max',
        bank_account_number: '1234',
        statement_day: 10,
        included: true,
        linked_transaction_id: 42,
        linked_bank_source: 'leumi',
        linked_bank_account_number: '5678',
        linked_bank_sync_id: 'leumi:account:582254',
        linked_description: 'MAX card settlement',
        updated_at: '2026-07-23T15:00:00.000Z',
      }],
    });

    await expect(loadCardSettings(7)).resolves.toEqual([{
      source: 'max',
      accountNumber: '1234',
      statementDay: 10,
      included: true,
      linkedTransactionId: 42,
      linkedBankSource: 'leumi',
      linkedBankAccountNumber: '5678',
      linkedIdentifier: '582254',
      linkedDescription: 'MAX card settlement',
      updatedAt: '2026-07-23T15:00:00.000Z',
    }]);

    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toContain('linked.bank_sync_id AS linked_bank_sync_id');
    expect(sql).not.toContain('linked.identifier');
    expect(params).toEqual([7]);
  });
});
