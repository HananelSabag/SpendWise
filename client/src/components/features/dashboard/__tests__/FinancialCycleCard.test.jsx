import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import FinancialCycleCard from '../FinancialCycleCard';

const formatCurrency = (value) => `ILS ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const t = (_key, options) => options?.fallback || _key;

const CYCLE = {
  window: { start: '2026-07-09', end: '2026-08-09', running: true },
  income: { salary: 0, other: 0, total: 0, items: [] },
  expenses: { cards: 3259.78, direct: 2209.39, total: 5469.17, events: [] },
  operatingNet: -5469.17,
  financing: { total: 0, count: 0 },
  bankMovement: 8017.17,
  projection: { upcoming: [], upcomingTotal: -1171.86, estimatedSalary: 13327.75 },
  partials: [],
  forwardReset: {
    mode: 'automatic',
    status: 'open',
    completionDate: '2026-08-10',
    expectedIncoming: 13327.75,
    knownCardOut: 2823.79,
    estimatedCardOut: 17442.56,
    estimatedFixedOut: 1171.86,
    knownNetChange: -2823.79,
    estimatedNetChange: -5286.67,
    stages: [
      { kind: 'loan', date: '2026-07-26', amount: -1098.85, label: 'loan' },
      { kind: 'recurring', date: '2026-08-01', amount: -73.01, label: 'insurance' },
      { kind: 'income', date: '2026-08-09', amount: 13327.75, label: 'salary', primary: true },
      { kind: 'card', date: '2026-08-10', amount: -2823.79, estimatedAmount: -17442.56, label: 'max 2254' },
    ],
  },
};

const renderCard = (props = {}) => render(
  <FinancialCycleCard cycle={CYCLE} formatCurrency={formatCurrency} t={t} totalOutstanding={36828.21} {...props} />,
);

describe('FinancialCycleCard', () => {
  it('reserves the card while the cycle query is loading', () => {
    renderCard({ cycle: null, isLoading: true });
    expect(screen.getByLabelText('Loading financial cycle')).toHaveAttribute('aria-busy', 'true');
  });

  it('leads with only what still has to happen before the reset', () => {
    renderCard();
    expect(screen.getByText('Until the next reset')).toBeInTheDocument();
    expect(screen.getByText('Reset effect')).toBeInTheDocument();
    expect(screen.queryByText('Net — how you are living')).not.toBeInTheDocument();
    expect(screen.queryByText('Change in your balance')).not.toBeInTheDocument();
  });

  it('shows the next salary, fixed debits, and card bill as separate stages', () => {
    renderCard();
    expect(screen.getByText('salary')).toBeInTheDocument();
    expect(screen.getByText('loan')).toBeInTheDocument();
    expect(screen.getByText('insurance')).toBeInTheDocument();
    expect(screen.getByText('max 2254')).toBeInTheDocument();
    expect(screen.getAllByText('−ILS 17,442.56').length).toBeGreaterThan(0);
  });

  it('links directly to the previous closed cycle', () => {
    renderCard({ onOpenPrevious: () => {} });
    expect(screen.getByRole('button', { name: 'Previous closed cycle' })).toBeInTheDocument();
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
