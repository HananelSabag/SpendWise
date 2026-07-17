import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import CycleBreakdown from '../CycleBreakdown';

vi.mock('../../../../hooks/useIsMobile', () => ({ useIsMobile: () => false }));
vi.mock('../../../ui/Modal', () => ({ default: () => null }));
vi.mock('../../../common/BottomSheet', () => ({ default: () => null }));

const t = (_key, options) => options?.fallback || _key;
const formatCurrency = (value) => `₪${Number(value).toFixed(2)}`;

describe('CycleBreakdown', () => {
  it('shows direct bank money per account instead of blending accounts together', () => {
    const cycle = {
      window: { start: '2026-07-01', end: '2026-08-01' },
      expenses: {
        events: [],
        direct: 175,
        directItems: [
          { id: 1, source: 'leumi', accountNumber: '1111', date: '2026-07-05', description: 'Loan', amount: -100 },
          { id: 2, source: 'yahav', accountNumber: '2222', date: '2026-07-06', description: 'Cash', amount: -75 },
        ],
      },
      income: {
        total: 1000,
        items: [
          { id: 3, source: 'leumi', accountNumber: '1111', date: '2026-07-01', description: 'Salary', amount: 1000 },
        ],
      },
    };

    render(<CycleBreakdown cycle={cycle} formatCurrency={formatCurrency} t={t} language="en" compactRowLimit={10} />);

    expect(screen.getAllByRole('button', { name: /Bank Leumi ••••1111/ })).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Bank Yahav ••••2222/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Out of the account/ })).not.toBeInTheDocument();
  });
});
