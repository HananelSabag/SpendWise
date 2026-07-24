import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPost } = vi.hoisted(() => ({ mockPost: vi.fn() }));
vi.mock('../client.js', () => ({
  api: { client: { post: mockPost, get: vi.fn(), put: vi.fn() } }
}));

import { authAPI } from '../auth.js';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('auth API route contracts', () => {
  it('posts a Google credential and returns the normalized session', async () => {
    mockPost.mockResolvedValue({
      data: {
        data: {
          user: { id: 1, email: 'person@example.com', role: 'user' },
          accessToken: 'google-access',
          tokens: { refreshToken: 'google-refresh' },
        },
      },
    });

    const result = await authAPI.processGoogleCredential('header.payload.signature');

    expect(mockPost).toHaveBeenCalledWith('/users/auth/google', {
      idToken: 'header.payload.signature',
    });
    expect(result).toMatchObject({
      success: true,
      token: 'google-access',
      refreshToken: 'google-refresh',
      user: { id: 1, email: 'person@example.com' },
    });
  });

  it('preserves Google server error codes for the login screen', async () => {
    mockPost.mockRejectedValue({
      response: {
        status: 403,
        data: {
          error: {
            code: 'GOOGLE_AUTH_DISABLED',
            message: 'Google sign-in is currently disabled.',
          },
        },
      },
    });

    await expect(
      authAPI.processGoogleCredential('header.payload.signature'),
    ).resolves.toMatchObject({
      success: false,
      error: {
        code: 'GOOGLE_AUTH_DISABLED',
        status: 403,
        message: 'Google sign-in is currently disabled.',
      },
    });
  });

  it('rejects malformed Google credentials before making a request', async () => {
    await expect(authAPI.processGoogleCredential('not-a-jwt')).resolves.toMatchObject({
      success: false,
      error: { code: 'GOOGLE_LOGIN_ERROR' },
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('uses the server password-reset request route', async () => {
    mockPost.mockResolvedValue({ data: { message: 'sent' } });
    await expect(authAPI.requestPasswordReset('Person@Example.com')).resolves.toMatchObject({ success: true });
    expect(mockPost).toHaveBeenCalledWith('/users/password-reset', { email: 'person@example.com' });
  });

  it('uses the confirm route and normalizes the password form payload', async () => {
    mockPost.mockResolvedValue({ data: { message: 'reset' } });
    await expect(authAPI.resetPassword({ token: 'raw-token', password: 'Password1' })).resolves.toMatchObject({ success: true });
    expect(mockPost).toHaveBeenCalledWith('/users/password-reset/confirm', {
      token: 'raw-token', password: 'Password1'
    });
  });

  it('unwraps verification token objects used by the store and page', async () => {
    mockPost.mockResolvedValue({ data: { message: 'verified' } });
    await authAPI.verifyEmail({ token: 'verify-token' });
    expect(mockPost).toHaveBeenCalledWith('/users/verify-email', { token: 'verify-token' });
  });

  it('sends the refresh token for server revocation before clearing storage', async () => {
    localStorage.setItem('accessToken', 'access');
    localStorage.setItem('refreshToken', 'refresh');
    mockPost.mockResolvedValue({ data: { success: true } });

    await authAPI.logout();
    expect(mockPost).toHaveBeenCalledWith('/users/logout', { refreshToken: 'refresh' });
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});
