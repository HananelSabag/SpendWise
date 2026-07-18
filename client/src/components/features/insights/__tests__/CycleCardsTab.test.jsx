import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import CycleCardsTab from '../CycleCardsTab';

vi.mock('../../../../hooks/useIsMobile', () => ({ useIsMobile: () => false }));
vi.mock('../../../ui/Modal', () => ({
  default: ({ isOpen, title, children }) => isOpen ? <section aria-label={title}>{children}</section> : null,
}));
vi.mock('../../../common/BottomSheet', () => ({
  default: ({ isOpen, title, children }) => isOpen ? <section aria-label={title}>{children}</section> : null,
}));

const t = (_key, options) => options?.fallback || _key;
const formatCurrency = (value) => `₪${Number(value).toFixed(2)}`;

const cycle = {
  cards: [
    { source: 'max', accountNumber: '2254', settlement: { mode: 'aggregated' }, statementDay: { certain: true, day: 10 } },
  ],
  expenses: {
    events: [
      // The bill still building this cycle (bills 10/08) is a card expense now, flagged accruing.
      {
        source: 'max', accountNumber: '2254', class: 'statement', chargeDate: '2026-08-10',
        total: -300, count: 1, accruing: true, future: true,
        txns: [{ id: 'accr-1', date: '2026-07-15', description: 'Future groceries', amount: -300 }],
      },
      {
        source: 'max', accountNumber: '2254', class: 'immediate', chargeDate: '2026-07-08',
        total: -50, count: 1,
        txns: [{ id: 'immediate-1', date: '2026-07-08', description: 'Online service', amount: -50 }],
      },
    ],
  },
  nextCardForecast: {
    bills: [{
      source: 'max', accountNumber: '2254', chargeDate: '2026-08-10',
      knownAmount: 300, knownCount: 1,
      historicalAverage: 1100, historyCount: 2, estimatedAmount: 1100,
    }],
  },
  unreconciledCardEvents: [],
};

describe('CycleCardsTab', () => {
  it('leads with the card total and splits the building bill from direct charges', () => {
    render(<CycleCardsTab cycle={cycle} formatCurrency={formatCurrency} t={t} language="en" />);

    // 300 building + 50 charged directly = 350 this cycle.
    expect(screen.getByText(/350\.00/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bill building/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Charged directly/ })).toBeInTheDocument();
    expect(screen.getByText(/10 Aug/)).toBeInTheDocument();
  });

  it('opens the exact purchases behind the building bill', () => {
    render(<CycleCardsTab cycle={cycle} formatCurrency={formatCurrency} t={t} language="en" />);

    fireEvent.click(screen.getByRole('button', { name: /Bill building/ }));
    expect(screen.getByRole('region', { name: 'MAX ••••2254' })).toBeInTheDocument();
    expect(screen.getByText('Future groceries')).toBeInTheDocument();
    expect(screen.queryByText('Online service')).not.toBeInTheDocument();
  });

  it('opens the exact purchases behind a direct charge', () => {
    render(<CycleCardsTab cycle={cycle} formatCurrency={formatCurrency} t={t} language="en" />);

    fireEvent.click(screen.getByRole('button', { name: /Charged directly/ }));
    expect(screen.getByText('Online service')).toBeInTheDocument();
    expect(screen.queryByText('Future groceries')).not.toBeInTheDocument();
  });

  it('flags how much bigger the building bill may still grow, not a parallel figure', () => {
    render(<CycleCardsTab cycle={cycle} formatCurrency={formatCurrency} t={t} language="en" />);

    expect(screen.getByText(/May grow to/)).toBeInTheDocument();
    expect(screen.getByText(/~₪1100\.00/)).toBeInTheDocument();
    // The old parallel "actually accumulated" box is gone — the amount is the expense row itself.
    expect(screen.queryByText('Actually accumulated')).not.toBeInTheDocument();
  });

  it('hides the growth hint when the estimate is turned off, keeping the bill as an expense', () => {
    render(<CycleCardsTab cycle={cycle} formatCurrency={formatCurrency} t={t} language="en" useCardEstimate={false} />);

    expect(screen.queryByText(/May grow to/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bill building/ })).toBeInTheDocument();
  });
});
