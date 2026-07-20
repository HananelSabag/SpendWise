import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import FinancialCycleCard from '../FinancialCycleCard';

// The card leads with the projected checking balance, so it reads the shared bank-balance hook.
vi.mock('../../../../hooks/useBankBalance', () => ({
  useBankBalance: () => ({ hasRealBalance: true, totalRealBalance: 12150 }),
}));

const formatCurrency = (value) => `ILS ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const t = (_key, options) => options?.fallback || _key;

const CYCLE = {
  window: { start: '2026-07-09', end: '2026-08-09', running: true },
  income: { salary: 0, other: 0, total: 0, items: [] },
  expenses: { cards: 3259.78, direct: 2209.39, total: 5469.17, events: [] },
  operatingNet: -5469.17,
  financing: { total: 0, count: 0 },
  bankMovement: 8017.17,
  partials: [],
  forwardReset: {
    mode: 'automatic',
    status: 'open',
    completionDate: '2026-08-10',
    expectedIncoming: 13327.75,
    knownCardOut: 2823.79,
    estimatedCardOut: 17442.56,
    fixedOut: 1171.86,
    knownNetChange: -3995.65,
    estimatedNetChange: -5286.67,
    stages: [],
  },
};

const renderCard = (props = {}) => render(
  <FinancialCycleCard cycle={CYCLE} formatCurrency={formatCurrency} t={t} {...props} />,
);

describe('FinancialCycleCard', () => {
  it('reserves the card while the cycle query is loading', () => {
    renderCard({ cycle: null, isLoading: true });
    expect(screen.getByLabelText('Loading financial cycle')).toHaveAttribute('aria-busy', 'true');
  });

  it('leads with the projected checking balance at cycle end', () => {
    renderCard();
    expect(screen.getByText(/Estimated bank balance at cycle end/)).toBeInTheDocument();
    // 12,150 now + estimatedNetChange (−5,286.67) → ~6,863.33.
    expect(screen.getByText('~ILS 6,863.33')).toBeInTheDocument();
    expect(screen.getByText('estimate')).toBeInTheDocument();
  });

  it('shows completed and future money with plain labels', () => {
    renderCard();
    expect(screen.getByText('Received so far')).toBeInTheDocument();
    expect(screen.getByText('Spent so far')).toBeInTheDocument();
    expect(screen.getByText('Future income')).toBeInTheDocument();
    expect(screen.getByText('+ILS 13,327.75')).toBeInTheDocument();
    expect(screen.getByText('Future expenses')).toBeInTheDocument();
    expect(screen.getByText('−ILS 18,614.42')).toBeInTheDocument();
  });

  it('opens the full breakdown on the cycle page', () => {
    const onOpenCycle = vi.fn();
    renderCard({ onOpenCycle });
    fireEvent.click(screen.getByRole('button', { name: /Full breakdown/ }));
    expect(onOpenCycle).toHaveBeenCalled();
  });

  it('warns when a linked salary is late', () => {
    renderCard({ salaryTracking: { status: 'late' } });
    expect(screen.getByText('Your salary has not come in yet — keep an eye on it.')).toBeInTheDocument();
  });

  it('asks for a salary link instead of inventing an automatic window', () => {
    renderCard({ needsSalaryLink: true, cycle: null });
    expect(screen.getByText('Link your salary to see your cycle')).toBeInTheDocument();
  });
});
