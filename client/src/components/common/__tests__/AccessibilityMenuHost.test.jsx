import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AccessibilityMenuHost, {
  openAccessibilityMenu,
} from '../AccessibilityMenuHost';

vi.mock('../AccessibilityMenu', () => ({
  default: ({ isOpen, onClose }) => isOpen
    ? <button onClick={onClose}>Close accessibility settings</button>
    : null,
}));

describe('AccessibilityMenuHost', () => {
  it('stays visually hidden until a permanent navigation entry opens it', () => {
    render(<AccessibilityMenuHost />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    act(() => openAccessibilityMenu());
    const closeButton = screen.getByRole('button', {
      name: 'Close accessibility settings',
    });

    fireEvent.click(closeButton);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
