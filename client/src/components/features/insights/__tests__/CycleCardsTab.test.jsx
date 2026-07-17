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
      {
        source: 'max', accountNumber: '2254', class: 'statement', chargeDate: '2026-07-10',
        total: -100, count: 1,
        txns: [{ id: 'statement-1', date: '2026-07-01', description: 'Groceries', amount: -100 }],
      },
      {
        source: 'max', accountNumber: '2254', class: 'immediate', chargeDate: '2026-07-08',
        total: -50, count: 1,
        txns: [{ id: 'immediate-1', date: '2026-07-08', description: 'Online service', amount: -50 }],
      },
    ],
  },
  unreconciledCardEvents: [],
};

describe('CycleCardsTab', () => {
  it('leads with the card total and splits monthly from direct charges', () => {
    render(<CycleCardsTab cycle={cycle} formatCurrency={formatCurrency} t={t} language="en" />);

    expect(screen.getByText('−₪150.00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Monthly bill/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Charged directly/ })).toBeInTheDocument();
  });

  it('opens the exact purchases behind a charge group', () => {
    render(<CycleCardsTab cycle={cycle} formatCurrency={formatCurrency} t={t} language="en" />);

    fireEvent.click(screen.getByRole('button', { name: /Monthly bill/ }));
    expect(screen.getByRole('region', { name: 'MAX ••2254' })).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.queryByText('Online service')).not.toBeInTheDocument();
  });
});
