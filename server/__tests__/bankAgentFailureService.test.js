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

  test('transient declines never disable a connection', () => {
    const failure = normalizeAgentFailure({
      agentError: 'cooldown',
      errorCode: 'AUTH_INVALID',
      transient: true,
    });

    expect(failure).toMatchObject({ transient: true, terminal: false });
  });
});
