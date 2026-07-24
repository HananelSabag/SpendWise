import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { renderGoogleButton } = vi.hoisted(() => ({
  renderGoogleButton: vi.fn(),
}));

vi.mock('../../../../services/simpleGoogleAuth.js', () => ({
  simpleGoogleAuth: {
    renderButton: renderGoogleButton,
    initialize: vi.fn(),
  },
}));

vi.mock('../../../../stores', () => ({
  useTranslation: () => ({ t: () => 'Continue with Google' }),
}));

import SimpleGoogleButton from '../SimpleGoogleButton';

describe('SimpleGoogleButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    renderGoogleButton.mockResolvedValue(true);
  });

  it('renders GSI immediately and keeps the iframe stable across callback changes', async () => {
    const firstSuccess = vi.fn();
    const latestSuccess = vi.fn();
    const { rerender } = render(
      <SimpleGoogleButton onSuccess={firstSuccess} onError={vi.fn()} />,
    );

    await waitFor(() => expect(renderGoogleButton).toHaveBeenCalledTimes(1));

    rerender(<SimpleGoogleButton onSuccess={latestSuccess} onError={vi.fn()} />);
    expect(renderGoogleButton).toHaveBeenCalledTimes(1);

    renderGoogleButton.mock.calls[0][1]('google-credential');
    expect(firstSuccess).not.toHaveBeenCalled();
    expect(latestSuccess).toHaveBeenCalledWith('google-credential');
  });
});
