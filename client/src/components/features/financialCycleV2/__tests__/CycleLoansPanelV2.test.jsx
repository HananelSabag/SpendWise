import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import CycleLoansPanelV2 from '../CycleLoansPanelV2';
import { movementLabel } from '../CycleKnownExpensesPanelV2';

const mock = vi.hoisted(() => ({ loans: [] }));
vi.mock('../../../../hooks/useCycles', () => ({ useCycles: () => mock }));
const props = { language: 'en', formatCurrency: value => `ILS ${value}`, t: key => key, onManageRecurring: () => {} };
afterEach(cleanup);

it('does not report zero debt when no series was identified', () => {
  mock.loans = [];
  render(<CycleLoansPanelV2 {...props} />);
  expect(screen.getByText('cycleV2.noDetectedLoans')).toBeInTheDocument();
  expect(screen.queryByText('ILS 0')).not.toBeInTheDocument();
});

it('shows the source account, last repayment and original payment descriptions', () => {
  mock.loans = [{ identity: 'leumi|1234|id:x', source: 'leumi', accountNumber: '1234', principal: 5000,
    outstanding: 4000, repaid: 1000, paymentCount: 1, disbursedOn: '2026-07-01',
    payments: [{ date: '2026-08-01', amount: -1000, txn: { id: 1, description: 'Original bank text' } }] }];
  render(<CycleLoansPanelV2 {...props} />);
  expect(screen.getByText('Bank Leumi · 1234')).toBeInTheDocument();
  expect(screen.getByText('cycleV2.loanLastPayment')).toBeInTheDocument();
  expect(screen.getByText('Original bank text')).toBeInTheDocument();
});

it('localizes engine fallback labels while preserving original descriptions', () => {
  const t = key => `translated:${key}`;
  expect(movementLabel({ kind: 'salary', label: 'salary' }, t)).toBe('translated:cycleV2.expectedIncome');
  expect(movementLabel({ kind: 'loan', label: 'loan' }, t)).toBe('translated:cycleV2.loanPayment');
  expect(movementLabel({ kind: 'card', source: 'visa_cal', accountNumber: '12345678' }, t)).toBe('CAL · 5678');
  expect(movementLabel({ kind: 'income', label: 'Original bank text' }, t)).toBe('Original bank text');
});
