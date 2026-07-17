import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import InfoHint from '../InfoHint';

describe('InfoHint', () => {
  it('uses a viewport-safe dialog on mobile and an anchored popover on larger screens', () => {
    render(<InfoHint title="Balance help">Explanation</InfoHint>);

    fireEvent.click(screen.getByRole('button', { name: 'Balance help' }));
    const dialog = screen.getByRole('dialog');

    expect(dialog).toHaveClass('fixed', 'inset-x-4', 'top-1/2', 'max-h-[70vh]');
    expect(dialog).toHaveClass('sm:absolute', 'sm:inset-x-auto', 'sm:top-6');
    expect(dialog).toHaveTextContent('Explanation');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
