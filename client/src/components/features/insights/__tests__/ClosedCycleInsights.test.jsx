import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ClosedCycleInsights from '../ClosedCycleInsights';

const t = (_key, options) => options?.fallback || _key;
const formatCurrency = (value) => `ILS ${Number(value).toFixed(2)}`;

describe('ClosedCycleInsights', () => {
  it('shows calendar-day averages, the daily gap, and peak dates', () => {
    render(
      <ClosedCycleInsights
        insights={{
          calendarDays: 30,
          averageIncomePerDay: 450,
          averageExpensePerDay: 700,
          averageNetPerDay: -250,
          peakExpenseDay: { date: '2026-06-10', amount: 17200.98 },
          peakIncomeDay: { date: '2026-06-05', amount: 15330.21 },
        }}
        formatCurrency={formatCurrency}
        t={t}
        language="en"
      />,
    );

    expect(screen.getByText('ILS 450.00')).toBeInTheDocument();
    expect(screen.getByText('ILS 700.00')).toBeInTheDocument();
    expect(screen.getByText(/spent ILS 250.00 more/)).toBeInTheDocument();
    expect(screen.getByText(/Biggest spending day.*10 Jun/)).toBeInTheDocument();
  });
});
