import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import FamilyOverviewPanel from '../FamilyOverviewPanel';

/**
 * The one thing this panel must never get wrong: the big number is what is LEFT,
 * not what came in. A household with ₪22,000 of income and ₪11,800 already
 * committed has ₪10,200 to live on, and showing the income where the leftover
 * belongs is the exact lie this screen was built to kill.
 */

const formatCurrency = (value) => `₪${Number(value).toFixed(0)}`;

const t = (key, values = {}) => {
  const strings = {
    'overview.headline': 'Left to live on',
    'overview.deficit': 'Short this month',
    'overview.committedShare': `${values.percent}% committed`,
    'overview.projected': 'Projected',
    'overview.joint': 'Joint',
    'overview.personCommitted': 'Out',
    'overview.personIncome': 'In',
    'kind.income': 'Income',
    'kind.fixed': 'Fixed',
    'kind.loan': 'Loans',
    'kind.savings': 'Saving',
    'kind.variable': 'Variable',
  };
  return strings[key] || key;
};

const members = [
  { id: 1, name: 'Hananel' },
  { id: 44, name: 'Nofar' },
];

const summary = {
  monthly: {
    income: 22000, fixed: 8800, loans: 2500, savings: 500,
    committed: 11800, available: 10200,
    variablePlanned: 3800, projected: 6400, committedRatio: 0.54,
  },
  people: [
    { key: '1', userId: 1, name: 'Hananel', income: 13000, committed: 6100, variable: 800, available: 6900 },
    { key: '44', userId: 44, name: 'Nofar', income: 9000, committed: 4500, variable: 0, available: 4500 },
    { key: 'joint', userId: null, name: null, income: 0, committed: 1200, variable: 3000, available: -1200 },
  ],
  assets: { total: 270000, byKind: {}, byOwner: {}, monthlyContributions: 3000 },
  debt: { total: 35000, loansMissingBalance: 0 },
  netWorth: 235000,
};

const renderPanel = (over = {}) => render(
  <FamilyOverviewPanel
    summary={summary}
    members={members}
    formatCurrency={formatCurrency}
    t={t}
    hasRows
    onGoToFlow={vi.fn()}
    onGoToAssets={vi.fn()}
    onAddFirst={vi.fn()}
    {...over}
  />,
);

describe('FamilyOverviewPanel', () => {
  // The dominant number is the one rendered at hero size; asserting on the
  // element itself is what pins "the leftover leads", not just "10200 appears
  // somewhere on the page".
  const heroNumber = (container) => container.querySelector('.text-4xl');

  it('leads with what is left, not with the income', () => {
    const { container } = renderPanel();
    expect(screen.getByText('Left to live on')).toBeInTheDocument();
    expect(heroNumber(container)).toHaveTextContent('₪10200');
    expect(screen.queryByText('Short this month')).not.toBeInTheDocument();
  });

  it('shows each of the four figures behind the number', () => {
    renderPanel();
    expect(screen.getAllByText('₪22000').length).toBeGreaterThan(0); // income
    expect(screen.getAllByText('₪8800').length).toBeGreaterThan(0);  // fixed
    expect(screen.getAllByText('₪2500').length).toBeGreaterThan(0);  // loans
    expect(screen.getAllByText('₪500').length).toBeGreaterThan(0);   // saving
    expect(screen.getByText('54% committed')).toBeInTheDocument();
  });

  it('renders a deficit as a deficit', () => {
    const { container } = renderPanel({
      summary: {
        ...summary,
        monthly: { ...summary.monthly, available: -1000, committed: 23000, committedRatio: 1 },
      },
    });
    expect(screen.getByText('Short this month')).toBeInTheDocument();
    expect(screen.queryByText('Left to live on')).not.toBeInTheDocument();
    // Shown as a magnitude under a "short" label rather than a stray minus sign.
    expect(heroNumber(container)).toHaveTextContent('₪1000');
  });

  it('names the joint bucket instead of pinning shared charges on a person', () => {
    renderPanel();
    expect(screen.getByText('Joint')).toBeInTheDocument();
    expect(screen.getByText('Hananel')).toBeInTheDocument();
    expect(screen.getByText('Nofar')).toBeInTheDocument();
  });

  it('offers the first row instead of an empty screen', () => {
    const onAddFirst = vi.fn();
    render(
      <FamilyOverviewPanel
        summary={summary}
        members={members}
        formatCurrency={formatCurrency}
        t={t}
        hasRows={false}
        onGoToFlow={vi.fn()}
        onGoToAssets={vi.fn()}
        onAddFirst={onAddFirst}
      />,
    );
    expect(screen.getByText('overview.emptyCta')).toBeInTheDocument();
    expect(screen.queryByText('Left to live on')).not.toBeInTheDocument();
  });
});
