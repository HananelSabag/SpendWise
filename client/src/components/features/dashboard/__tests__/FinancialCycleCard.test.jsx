/**
 * The card carries the money numbers a user makes decisions on, so these tests pin the one
 * property that matters most: borrowed money must never be presented as income, and the
 * account's real movement must always be shown alongside it.
 *
 * The fixture is the actual payload GET /api/v1/cycles returns for the running cycle
 * (FINANCIAL_CYCLE_SPEC.md §7) — not invented numbers.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import FinancialCycleCard from '../FinancialCycleCard';

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: () => ({ children, ...props }) => <section {...props}>{children}</section> }),
}));

const formatCurrency = (value) => `₪${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const t = (_key, options) => (options && options.fallback) || _key;

/** Real running cycle: salary 13,327.75 in, a 12,805.22 card bill spread into a loan. */
const CYCLE = {
  window: { index: 0, start: '2026-07-09', end: '2026-08-09', running: true, projectedEnd: true, salary: { date: '2026-07-09', amount: 13327.75, description: 'הורייזן טכנו-י' } },
  income: { salary: 13327.75, other: 0, total: 13327.75 },
  expenses: { cards: 16601.79, direct: 2209.38, total: 18811.17, events: [] },
  operatingNet: -5483.42,
  financing: { total: 12805.22, count: 1 },
  bankMovement: 7321.8,
  projection: {
    upcoming: [
      { kind: 'recurring', date: '2026-07-26', amount: -1098.85, label: 'פרעון הלוואה', certainty: 'estimated' },
      { kind: 'recurring', date: '2026-08-01', amount: -73.01, label: 'טפחות ס.ביטו-י', certainty: 'estimated' },
    ],
    upcomingTotal: -1171.86,
    projectedOperatingNet: -6655.28,
    estimate: true,
  },
  needsReview: [],
  reversals: [],
  partials: [],
  cards: [],
};

const CYCLE_WITH_BREAKDOWN = {
  ...CYCLE,
  income: {
    ...CYCLE.income,
    items: [{ id: 'salary', amount: 13327.75, description: 'Salary', date: '2026-07-09' }],
  },
  expenses: {
    ...CYCLE.expenses,
    direct: 40,
    directItems: [{ id: 'bank-out', amount: -40, description: 'ATM', date: '2026-07-12' }],
    events: [
      { source: 'max', accountNumber: '1111', chargeDate: '2026-07-10', class: 'statement', count: 1, total: -100, txns: [{ id: 'max-1', amount: -100, description: 'A', date: '2026-07-01' }] },
      { source: 'max', accountNumber: '1111', chargeDate: '2026-07-12', class: 'immediate', count: 1, total: -50, txns: [{ id: 'max-2', amount: -50, description: 'A2', date: '2026-07-02' }] },
      { source: 'visa_cal', accountNumber: '2222', chargeDate: '2026-07-10', class: 'statement', count: 1, total: -200, txns: [{ id: 'cal-1', amount: -200, description: 'B', date: '2026-07-02' }] },
      { source: 'isracard', accountNumber: '3333', chargeDate: '2026-07-11', class: 'immediate', count: 1, total: -300, txns: [{ id: 'isracard-1', amount: -300, description: 'C', date: '2026-07-03' }] },
      { source: 'amex', accountNumber: '4444', chargeDate: '2026-07-12', class: 'immediate', count: 1, total: -400, txns: [{ id: 'amex-1', amount: -400, description: 'D', date: '2026-07-04' }] },
    ],
  },
};

const renderCard = (props = {}) => render(
  <FinancialCycleCard cycle={CYCLE} formatCurrency={formatCurrency} t={t} totalOutstanding={36828.21} {...props} />,
);

describe('FinancialCycleCard', () => {
  it('leads with the operating net rather than the account movement', () => {
    renderCard();
    // −5,483.42 is what the user must feel: they spent more than they earned this cycle.
    expect(screen.getByText('₪-5,483.42')).toBeInTheDocument();
    expect(screen.getByText('You are spending more than you earn')).toBeInTheDocument();
  });

  it('never lets borrowed money pass as income', () => {
    renderCard();
    // Income stays the salary alone — the ₪12,805.22 spread credit is financing, and had it
    // been added to income the headline would read a comfortable +8,017 instead of −5,483.
    expect(screen.getByText('₪13,327.75')).toBeInTheDocument();
    expect(screen.getByText('Borrowed this cycle')).toBeInTheDocument();
    expect(screen.getByText('₪12,805.22')).toBeInTheDocument();
    expect(screen.getByText('It covered the gap — and you pay it back')).toBeInTheDocument();
  });

  it('shows what the account really did, so the deficit is explainable', () => {
    renderCard();
    expect(screen.getByText('₪7,321.80')).toBeInTheDocument();
    expect(screen.getByText('What the account actually did')).toBeInTheDocument();
  });

  it('keeps the projection separate from settled figures', () => {
    renderCard();
    expect(screen.getByText('Still expected before your next salary')).toBeInTheDocument();
    expect(screen.getByText('₪-6,655.28')).toBeInTheDocument();
    expect(screen.getByText(/פרעון הלוואה/)).toBeInTheDocument();
  });

  it('keeps the dashboard compact until the user asks for every source row', () => {
    renderCard({ cycle: CYCLE_WITH_BREAKDOWN });

    expect(screen.getByText('MAX ••••1111')).toBeInTheDocument();
    expect(screen.queryByText('Amex ••••4444')).not.toBeInTheDocument();

    // The second MAX event is not allowed to crowd a different card out of the two key rows.
    expect(screen.getByText('CAL ••••2222')).toBeInTheDocument();
    expect(screen.queryByText('Isracard ••••3333')).not.toBeInTheDocument();

    const showMore = screen.getByRole('button', { name: 'Show 5 more' });
    expect(showMore).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(showMore);

    expect(screen.getByText('Amex ••••4444')).toBeInTheDocument();
    expect(screen.getByText('Isracard ••••3333')).toBeInTheDocument();
    const showLess = screen.getByRole('button', { name: 'Show less' });
    expect(showLess).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(showLess);
    expect(screen.queryByText('Amex ••••4444')).not.toBeInTheDocument();
  });

  it('hides the financing line when nothing was borrowed', () => {
    renderCard({ cycle: { ...CYCLE, financing: { total: 0, count: 0 } } });
    expect(screen.queryByText('Borrowed this cycle')).not.toBeInTheDocument();
  });

  it('warns when the salary has not landed', () => {
    renderCard({ salaryTracking: { status: 'late', daysLate: 7 } });
    expect(screen.getByText('Your salary has not come in yet — keep an eye on it.')).toBeInTheDocument();
  });

  it('asks for a salary link instead of inventing a window', () => {
    renderCard({ needsSalaryLink: true, cycle: null });
    expect(screen.getByText('Link your salary to see your cycle')).toBeInTheDocument();
    expect(screen.queryByText('What the account actually did')).not.toBeInTheDocument();
  });
});
