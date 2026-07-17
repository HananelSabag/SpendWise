const TERMINAL_CONNECTION_CODES = new Set([
  'AUTH_INVALID',
  'PASSWORD_CHANGE_REQUIRED',
  'ACCOUNT_BLOCKED',
  'MFA_REQUIRED',
  'CREDENTIALS_INVALID_FORMAT',
]);

const USER_MESSAGES = {
  AUTH_INVALID: 'The bank rejected the login details. Update them before syncing again.',
  PASSWORD_CHANGE_REQUIRED: 'The bank requires a password change before syncing can continue.',
  ACCOUNT_BLOCKED: 'The bank account is blocked. Resolve it with the bank before syncing again.',
  MFA_REQUIRED: 'This connection requires an authentication step that is not configured.',
  CREDENTIALS_INVALID_FORMAT: 'The saved login details are incomplete. Update them before syncing again.',
};

const LEGACY_ERROR_CODES = {
  INVALID_PASSWORD: 'AUTH_INVALID',
  CHANGE_PASSWORD: 'PASSWORD_CHANGE_REQUIRED',
  ACCOUNT_BLOCKED: 'ACCOUNT_BLOCKED',
  TWO_FACTOR_RETRIEVER_MISSING: 'MFA_REQUIRED',
};

function normalizeAgentFailure({ agentError, transient, errorCode } = {}) {
  const rawError = String(agentError || 'Unknown agent error').slice(0, 500);
  const suppliedCode = typeof errorCode === 'string'
    ? errorCode.trim().toUpperCase().slice(0, 64)
    : null;
  const legacyType = rawError.match(/^([A-Z_]+):/)?.[1];
  const normalizedCode = suppliedCode || LEGACY_ERROR_CODES[legacyType] || null;
  const isTransient = transient === true;
  const terminal = !isTransient && TERMINAL_CONNECTION_CODES.has(normalizedCode);

  return {
    rawError,
    code: normalizedCode,
    transient: isTransient,
    terminal,
    userMessage: terminal ? USER_MESSAGES[normalizedCode] : rawError,
  };
}

module.exports = {
  TERMINAL_CONNECTION_CODES,
  normalizeAgentFailure,
};
