const { normalizeAgentFailure } = require('../services/bankAgentFailureService');

describe('normalizeAgentFailure', () => {
  test('marks invalid credentials terminal with a safe user message', () => {
    const failure = normalizeAgentFailure({
      agentError: 'INVALID_PASSWORD: provider detail',
      errorCode: 'AUTH_INVALID',
    });

    expect(failure).toMatchObject({
      code: 'AUTH_INVALID',
      transient: false,
      terminal: true,
    });
    expect(failure.userMessage).toBe('The bank rejected the login details. Update them before syncing again.');
  });

  test('does not trust arbitrary terminal codes from the agent', () => {
    const failure = normalizeAgentFailure({
      agentError: 'something broke',
      errorCode: 'MADE_UP_TERMINAL_ERROR',
    });

    expect(failure.terminal).toBe(false);
    expect(failure.userMessage).toBe('something broke');
  });

  test('recognizes credential errors from an older agent during rollout', () => {
    const failure = normalizeAgentFailure({
      agentError: 'INVALID_PASSWORD: login failed',
    });

    expect(failure).toMatchObject({ code: 'AUTH_INVALID', terminal: true });
  });

  test('an unopenable envelope becomes an actionable re-enter, not a mystery', () => {
    // Real production text from the agent after the user paired a device while
    // their connections were still sealed to the shared host's key. Left
    // unclassified this only auto-paused the connection after three tries.
    const failure = normalizeAgentFailure({
      agentError: 'Decryption failed — wrong key or corrupted envelope',
    });

    expect(failure).toMatchObject({ code: 'CREDENTIALS_KEY_MISMATCH', terminal: true });
    expect(failure.userMessage).toContain('Re-enter them');
  });

  test('transient declines never disable a connection', () => {
    const failure = normalizeAgentFailure({
      agentError: 'cooldown',
      errorCode: 'AUTH_INVALID',
      transient: true,
    });

    expect(failure).toMatchObject({ transient: true, terminal: false });
  });
});
