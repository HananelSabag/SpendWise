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

/** Real running cycle after the opening salary and post-salary statements close the prior cycle. */
const CYCLE = {
  window: { index: 0, start: '2026-07-09', end: '2026-08-09', running: true, projectedEnd: true, salary: { date: '2026-07-09', amount: 13327.75, description: 'הורייזן טכנו-י' } },
  income: { salary: 0, other: 0, total: 0, items: [] },
  // The MAX bill still building this cycle (it bills 10/08) is counted now as a card expense,
  // not floated off in a separate "next bill" box.
  expenses: {
    cards: 3259.78, direct: 2209.39, total: 5469.17,
    events: [{
      source: 'max', accountNumber: '2254', class: 'statement', chargeDate: '2026-08-10',
      count: 16, total: -2823.79, accruing: true, future: true,
      txns: [{ id: 'accr-1', amount: -2823.79, description: 'MAX purchases this cycle', date: '2026-07-15' }],
    }],
  },
  operatingNet: -5469.17,
  financing: { total: 0, count: 0 },
  bankMovement: 8017.17,
  timingAdjustment: 13486.34,
  projection: {
    upcoming: [
      { kind: 'recurring', date: '2026-07-26', amount: -1098.85, label: 'פרעון הלוואה', certainty: 'estimated' },
      { kind: 'recurring', date: '2026-08-01', amount: -73.01, label: 'טפחות ס.ביטו-י', certainty: 'estimated' },
      { kind: 'salary', date: '2026-08-09', amount: 13327.75, label: 'salary', certainty: 'estimated' },
    ],
    upcomingTotal: -1171.86,
    estimatedSalary: 13327.75,
    projectedOperatingNet: 6686.72,
    estimate: true,
  },
  needsReview: [],
  reversals: [],
  partials: [],
  cards: [],
  nextCardForecast: {
    bills: [{
      source: 'max', accountNumber: '2254', chargeDate: '2026-08-10',
      knownAmount: 2823.79, knownCount: 16, estimatedAmount: 2823.79,
    }],
  },
};

const CYCLE_WITH_BREAKDOWN = {
  ...CYCLE,
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
  it('reserves the card while the cycle query is loading', () => {
    renderCard({ cycle: null, isLoading: true });
    expect(screen.getByLabelText('Loading financial cycle')).toHaveAttribute('aria-busy', 'true');
  });

  it('leads with the operating net rather than the account movement', () => {
    renderCard();
    expect(screen.getAllByText('₪-5,469.17')).toHaveLength(2);
    expect(screen.getByText('You are spending more than you earn')).toBeInTheDocument();
  });

  it('keeps the opening salary out of settled income and only in the estimate', () => {
    renderCard();
    expect(screen.getByText('₪0.00')).toBeInTheDocument();
    expect(screen.getByText(/Aug 9.*salary/)).toBeInTheDocument();
    expect(screen.getByText('₪13,327.75')).toBeInTheDocument();
    expect(screen.queryByText('Borrowed this cycle')).not.toBeInTheDocument();
    expect(screen.queryByText('₪12,805.22')).not.toBeInTheDocument();
  });

  it('shows what the account really did, so the deficit is explainable', () => {
    renderCard();
    expect(screen.getByText('₪8,017.17')).toBeInTheDocument();
    expect(screen.getByText('Change in your balance')).toBeInTheDocument();
  });

  it('marks an incomplete cycle before presenting understated figures', () => {
    renderCard({ cycle: { ...CYCLE, partials: [{ source: 'max', chargeDate: '2026-05-10' }] } });
    expect(screen.getByText('This cycle is incomplete')).toBeInTheDocument();
  });

  it('keeps the projection separate from settled figures', () => {
    renderCard();
    expect(screen.getByText('Still expected before your next salary')).toBeInTheDocument();
    expect(screen.getByText('₪6,686.72')).toBeInTheDocument();
    expect(screen.getByText(/פרעון הלוואה/)).toBeInTheDocument();
  });

  it('counts the building card bill inside this cycle, not in a separate next-bill box', () => {
    renderCard();
    // The accruing MAX bill lives in the expense breakdown now, flagged as still building.
    expect(screen.queryByText('Next bill')).not.toBeInTheDocument();
    expect(screen.getByText('MAX ••••2254')).toBeInTheDocument();
    expect(screen.getByText(/Bill building/)).toBeInTheDocument();
    expect(screen.getByText(/2,823\.79/)).toBeInTheDocument();
  });

  it('keeps the dashboard compact until the user asks for every source row', () => {
    renderCard({ cycle: CYCLE_WITH_BREAKDOWN });

    expect(screen.getByText('MAX ••••1111')).toBeInTheDocument();
    expect(screen.queryByText('Amex ••••4444')).not.toBeInTheDocument();

    // The second MAX event is not allowed to crowd a different card out of the two key rows.
    expect(screen.getByText('CAL ••••2222')).toBeInTheDocument();
    expect(screen.queryByText('Isracard ••••3333')).not.toBeInTheDocument();

    const showMore = screen.getByRole('button', { name: 'Show 4 more' });
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
    expect(screen.queryByText('Change in your balance')).not.toBeInTheDocument();
  });
});
