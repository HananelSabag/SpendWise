import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import CycleControlTab from '../CycleControlTab';

vi.mock('../../dashboard/SalaryCandidatePrompt', () => ({ default: () => null }));
vi.mock('../WatchedMerchants', () => ({ default: () => null }));
vi.mock('../../../ui', () => ({ InfoHint: ({ children }) => <span>{children}</span> }));
vi.mock('../../../../hooks/useIsMobile', () => ({ useIsMobile: () => false }));
vi.mock('../../../ui/Modal', () => ({
  default: ({ isOpen, title, children }) => (isOpen ? <section aria-label={title}>{children}</section> : null),
}));
vi.mock('../../common/BottomSheet', () => ({
  default: ({ isOpen, title, children }) => (isOpen ? <section aria-label={title}>{children}</section> : null),
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

const overriddenCycle = {
  decisions: [{
    ...cycle.decisions[0],
    automatic: false,
    override: 'income',
    classification: 'income',
    reason: 'user_override',
  }],
};

describe('CycleControlTab', () => {
  it('opens a decision to show the refund effect and the linked bank copy', () => {
    render(
      <CycleControlTab cycle={cycle} signatures={[{ id: 1 }, { id: 2 }]} formatCurrency={formatCurrency} t={t} language="en" />,
    );

    // The list is just tappable rows; the reasoning and effect live in the sheet.
    fireEvent.click(screen.getByText('Big Apple'));
    expect(screen.getByText('−₪18.00 · expenses')).toBeInTheDocument();

    // Opening the suppressed bank copy shows what it is linked to.
    fireEvent.click(screen.getByText('Debit card'));
    expect(screen.getByText(/Linked to MAX/)).toBeInTheDocument();
  });

  it('lets the user pick a new classification from the sheet', () => {
    const onDecisionChange = vi.fn();
    render(
      <CycleControlTab cycle={overriddenCycle} signatures={[{ id: 1 }]} formatCurrency={formatCurrency} t={t} onDecisionChange={onDecisionChange} language="en" />,
    );

    fireEvent.click(screen.getByText('Big Apple'));
    fireEvent.click(screen.getByRole('button', { name: /^refund$/i }));
    expect(onDecisionChange).toHaveBeenCalledWith(expect.objectContaining({ transactionId: 7795 }), 'refund');
  });

  it('resets an override back to automatic', () => {
    const onDecisionReset = vi.fn();
    render(
      <CycleControlTab cycle={overriddenCycle} signatures={[{ id: 1 }]} formatCurrency={formatCurrency} t={t} onDecisionReset={onDecisionReset} language="en" />,
    );

    fireEvent.click(screen.getByText('Big Apple'));
    fireEvent.click(screen.getByRole('button', { name: /Back to automatic/ }));
    expect(onDecisionReset).toHaveBeenCalledWith(expect.objectContaining({ transactionId: 7795 }));
  });

  it('keeps long mobile decision lists compact until the user asks for more', () => {
    const longCycle = {
      decisions: Array.from({ length: 13 }, (_, index) => ({
        ...cycle.decisions[0],
        transactionId: 8000 + index,
        description: `Decision ${index + 1}`,
      })),
    };

    render(
      <CycleControlTab cycle={longCycle} signatures={[{ id: 1 }]} formatCurrency={formatCurrency} t={t} language="en" />,
    );

    expect(screen.getByText('Decision 12')).toBeInTheDocument();
    expect(screen.queryByText('Decision 13')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show 1 more' }));
    expect(screen.getByText('Decision 13')).toBeInTheDocument();
  });
});
