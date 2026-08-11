const TERMINAL_CONNECTION_CODES = new Set([
  'AUTH_INVALID',
  'PASSWORD_CHANGE_REQUIRED',
  'ACCOUNT_BLOCKED',
  'MFA_REQUIRED',
  'CREDENTIALS_INVALID_FORMAT',
  'CREDENTIALS_KEY_MISMATCH',
]);

const USER_MESSAGES = {
  AUTH_INVALID: 'The bank rejected the login details. Update them before syncing again.',
  PASSWORD_CHANGE_REQUIRED: 'The bank requires a password change before syncing can continue.',
  ACCOUNT_BLOCKED: 'The bank account is blocked. Resolve it with the bank before syncing again.',
  MFA_REQUIRED: 'This connection requires an authentication step that is not configured.',
  CREDENTIALS_INVALID_FORMAT: 'The saved login details are incomplete. Update them before syncing again.',
  CREDENTIALS_KEY_MISMATCH: 'These login details are sealed to a different sync agent. Re-enter them so this agent can read them.',
};

const LEGACY_ERROR_CODES = {
  INVALID_PASSWORD: 'AUTH_INVALID',
  CHANGE_PASSWORD: 'PASSWORD_CHANGE_REQUIRED',
  ACCOUNT_BLOCKED: 'ACCOUNT_BLOCKED',
  TWO_FACTOR_RETRIEVER_MISSING: 'MFA_REQUIRED',
};

// A sealed-box open failure means the envelope was sealed to a DIFFERENT
// agent key — the classic case being a user who pairs their own computer
// while their saved connections are still sealed to the shared host. The
// agent reports it as free text, so it is matched here and turned into an
// actionable code; left unclassified it read as a generic failure and just
// auto-paused the connection after three tries with nothing to act on.
const KEY_MISMATCH_PATTERN = /decrypt(ion)?\s+failed|wrong key|corrupted envelope|sealed box/i;

function normalizeAgentFailure({ agentError, transient, errorCode } = {}) {
  const rawError = String(agentError || 'Unknown agent error').slice(0, 500);
  const suppliedCode = typeof errorCode === 'string'
    ? errorCode.trim().toUpperCase().slice(0, 64)
    : null;
  const legacyType = rawError.match(/^([A-Z_]+):/)?.[1];
  const inferredCode = KEY_MISMATCH_PATTERN.test(rawError) ? 'CREDENTIALS_KEY_MISMATCH' : null;
  const normalizedCode = suppliedCode || LEGACY_ERROR_CODES[legacyType] || inferredCode || null;
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
