import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../../hooks/useBankBalance', () => ({
  useBankBalance: () => ({
    hasRealBalance: true,
    totalRealBalance: -2000,
    multiAccount: false,
  }),
}));

import OverdraftRunwayCard from '../OverdraftRunwayCard';

const formatCurrency = (value) => `₪${Number(value).toFixed(0)}`;
const t = (key, values = {}) => {
  const translations = {
    'overdraft.exceeded': `Projected breach ${values.amount || ''}`,
    'overdraft.setupTitle': 'Set limit',
    'overdraft.setupHint': 'Limit hint',
    'overdraft.limitLabel': 'Overdraft limit',
    'overdraft.limitPlaceholder': '5000',
    'overdraft.save': 'Save limit',
  };
  return translations[key] || key;
};
const cycle = {
  forwardReset: {
    knownCardOut: 4000,
    knownFixedOut: 0,
    estimatedCardOut: 4000,
    estimatedFixedOut: 0,
    expectedIncoming: 0,
  },
};

describe('OverdraftRunwayCard', () => {
  it('shows the exact amount beyond the limit for the active scenario', () => {
    render(
      <OverdraftRunwayCard
        cycle={cycle}
        settings={{ overdraftLimit: 5000, useEstimates: false }}
        formatCurrency={formatCurrency}
        t={t}
        onSaveLimit={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Projected breach ₪1000' })).toBeInTheDocument();
  });

  it('collects and saves a previously unconfigured limit', async () => {
    const onSaveLimit = vi.fn().mockResolvedValue(undefined);
    render(
      <OverdraftRunwayCard
        cycle={cycle}
        settings={{ overdraftLimit: null, useEstimates: true }}
        formatCurrency={formatCurrency}
        t={t}
        onSaveLimit={onSaveLimit}
      />,
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: /Overdraft limit/ }), {
      target: { value: '5000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save limit' }));

    expect(onSaveLimit).toHaveBeenCalledWith(5000);
  });
});
