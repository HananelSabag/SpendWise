import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import DeleteTransaction from '../DeleteTransaction';

vi.mock('../../../../stores', () => ({
  useTranslation: () => ({ t: key => key, currentLanguage: 'en' }),
  useCurrency: () => ({ formatCurrency: value => String(value) }),
}));
vi.mock('../../../ui', () => ({
  Modal: ({ children }) => <div role="dialog">{children}</div>,
  Button: ({ children, onClick, disabled }) => <button onClick={onClick} disabled={disabled}>{children}</button>,
  Badge: ({ children }) => <span>{children}</span>,
}));
const transaction = { id: 1, amount: 10, type: 'income', date: '2026-09-07', description: 'Synthetic' };
afterEach(cleanup);

it('disables repeat deletion and closing until the one request finishes', async () => {
  let finish;
  const onSuccess = vi.fn(() => new Promise(resolve => { finish = resolve; }));
  const onClose = vi.fn();
  render(<DeleteTransaction isOpen transaction={transaction} onSuccess={onSuccess} onClose={onClose} />);
  fireEvent.click(screen.getByText('delete.confirm'));
  fireEvent.click(screen.getByText('loading.deleting'));
  fireEvent.click(screen.getByText('actions.cancel'));
  expect(onSuccess).toHaveBeenCalledTimes(1);
  expect(onSuccess).toHaveBeenCalledWith(1, { transaction });
  expect(onClose).not.toHaveBeenCalled();
  await act(async () => { finish(); });
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('keeps the confirmation available when deletion fails', async () => {
  const onClose = vi.fn();
  render(<DeleteTransaction isOpen transaction={transaction} onSuccess={() => Promise.reject(new Error('offline'))} onClose={onClose} />);
  fireEvent.click(screen.getByText('delete.confirm'));
  await waitFor(() => expect(screen.getByText('delete.confirm')).toBeEnabled());
  expect(onClose).not.toHaveBeenCalled();
});
