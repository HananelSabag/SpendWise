import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import GroceryQuickAdd from '../GroceryQuickAdd';
import translations from '../../../../translations/en/grocery';

vi.mock('../../../../stores', () => ({
  useTranslation: () => ({
    t: (key, options) => key.split('.').reduce((value, part) => value?.[part], translations)
      ?? options?.fallback ?? key,
    isRTL: false,
  }),
}));

afterEach(cleanup);

const t = (key) => key.split('.').reduce((value, part) => value?.[part], translations);

const setup = (props = {}) => {
  const onAdd = vi.fn().mockResolvedValue(true);
  const onExpand = vi.fn();
  render(<GroceryQuickAdd onAdd={onAdd} onExpand={onExpand} {...props} />);
  return { onAdd, onExpand, input: screen.getByLabelText(t('quickAdd.aria')) };
};

describe('one-line quick add', () => {
  it('shows the guessed category as you type, without making it a step', async () => {
    const { input } = setup();

    expect(screen.getByLabelText(/Category: Other/)).toBeTruthy();

    fireEvent.change(input, { target: { value: 'greek yogurt' } });

    await waitFor(() => {
      expect(screen.getByLabelText(/Category: Dairy & Eggs/)).toBeTruthy();
    });
  });

  it('adds on Enter and stays ready for the next item', async () => {
    const { onAdd, input } = setup();

    fireEvent.change(input, { target: { value: 'milk' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd.mock.calls[0][0]).toMatchObject({ name: 'milk', category_key: 'dairy_eggs' });

    // Items arrive in bursts, so the field clears and keeps the cursor.
    await waitFor(() => expect(input.value).toBe(''));
    expect(document.activeElement).toBe(input);
  });

  it('keeps the line empty of controls that have nothing to act on', () => {
    const { input } = setup();

    expect(screen.queryByLabelText(t('quickAdd.quantity'))).toBeNull();
    expect(screen.queryByLabelText(t('quickAdd.addPhoto'))).toBeNull();

    fireEvent.change(input, { target: { value: 'bread' } });

    expect(screen.getByLabelText(t('quickAdd.quantity'))).toBeTruthy();
    expect(screen.getByLabelText(t('quickAdd.addPhoto'))).toBeTruthy();
    expect(screen.getByLabelText(t('quickAdd.addLink'))).toBeTruthy();
  });

  it('will not submit an empty or whitespace-only name', async () => {
    const { onAdd, input } = setup();

    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onAdd).not.toHaveBeenCalled();
  });

  it('hands the editor what was already typed rather than a blank form', async () => {
    const { onExpand, input } = setup();

    fireEvent.change(input, { target: { value: 'greek yogurt' } });
    await waitFor(() => expect(screen.getByLabelText(/Category: Dairy & Eggs/)).toBeTruthy());
    fireEvent.change(screen.getByLabelText(t('quickAdd.quantity')), { target: { value: '2' } });
    fireEvent.click(screen.getByLabelText(t('quickAdd.addPhoto')));

    expect(onExpand).toHaveBeenCalledWith({
      name: 'greek yogurt',
      category_key: 'dairy_eggs',
      quantity: '2',
      focusField: 'image',
    });
  });

  it('lets a corrected category stick while the name keeps changing', async () => {
    const { onAdd, input } = setup();

    fireEvent.change(input, { target: { value: 'milk' } });
    await waitFor(() => expect(screen.getByLabelText(/Category: Dairy & Eggs/)).toBeTruthy());

    fireEvent.click(screen.getByLabelText(/^Category:/));
    fireEvent.click(screen.getByRole('option', { name: t('categories.frozen') }));

    fireEvent.change(input, { target: { value: 'milk ice cream' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => expect(onAdd).toHaveBeenCalled());
    expect(onAdd.mock.calls[0][0].category_key).toBe('frozen');
  });
});
