import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import CycleControlTab from '../CycleControlTab';

vi.mock('../../dashboard/SalaryCandidatePrompt', () => ({ default: () => null }));
vi.mock('../WatchedMerchants', () => ({ default: () => null }));
vi.mock('../../../ui', () => ({
  InfoHint: ({ children }) => <span>{children}</span>,
}));

const t = (_key, options) => options?.fallback || _key;
const formatCurrency = (value) => `₪${Number(value).toFixed(2)}`;

const cycle = {
  decisions: [
    {
      transactionId: 7795,
      date: '2026-07-09',
      processedDate: '2026-07-12',
      description: 'Big Apple',
      amount: 18,
      source: 'max',
      accountNumber: '8345',
      classification: 'refund',
      included: true,
      automatic: true,
      override: null,
      editable: true,
      needsAction: false,
      impactLine: 'expenses',
      impactAmount: -18,
      reason: 'auto_card_immediate',
    },
    {
      transactionId: 7312,
      date: '2026-07-12',
      processedDate: '2026-07-12',
      description: 'Debit card',
      amount: 18,
      source: 'leumi',
      accountNumber: '3478',
      classification: 'card_settlement',
      included: false,
      automatic: true,
      override: null,
      editable: false,
      needsAction: false,
      impactLine: 'none',
      impactAmount: 0,
      reason: 'bank_copy_suppressed',
      linkedTo: { source: 'max', accountNumber: '8345', date: '2026-07-12' },
    },
  ],
};

describe('CycleControlTab', () => {
  it('shows the refund effect and the linked bank copy without contradictory totals', () => {
    render(
      <CycleControlTab
        cycle={cycle}
        signatures={[{ id: 1 }, { id: 2 }]}
        formatCurrency={formatCurrency}
        t={t}
        language="en"
      />,
    );

    expect(screen.getByText('Big Apple')).toBeInTheDocument();
    expect(screen.getByText('−₪18.00 · expenses')).toBeInTheDocument();
    expect(screen.getByText('Debit card')).toBeInTheDocument();
    expect(screen.getByText(/Linked to MAX/)).toBeInTheDocument();
  });

  it('lets the user override and reset a classification', () => {
    const onDecisionChange = vi.fn();
    const onDecisionReset = vi.fn();
    const overridden = {
      decisions: [{
        ...cycle.decisions[0],
        automatic: false,
        override: 'income',
        classification: 'income',
        reason: 'user_override',
      }],
    };
    render(
      <CycleControlTab
        cycle={overridden}
        signatures={[{ id: 1 }, { id: 2 }]}
        formatCurrency={formatCurrency}
        t={t}
        onDecisionChange={onDecisionChange}
        onDecisionReset={onDecisionReset}
        language="en"
      />,
    );

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'refund' } });
    expect(onDecisionChange).toHaveBeenCalledWith(expect.objectContaining({ transactionId: 7795 }), 'refund');
    fireEvent.click(screen.getAllByRole('button', { name: 'Automatic' }).at(-1));
    expect(onDecisionReset).toHaveBeenCalledWith(expect.objectContaining({ transactionId: 7795 }));
  });
});
