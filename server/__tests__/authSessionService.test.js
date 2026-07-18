process.env.JWT_SECRET = 'test_access_secret_for_sessions';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_sessions';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';

const mockQuery = jest.fn();
const mockGetClient = jest.fn();
jest.mock('../config/db', () => ({ query: mockQuery, getClient: mockGetClient }));
jest.mock('../utils/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const jwt = require('jsonwebtoken');
const { generateTokens } = require('../middleware/auth');
const {
  digest,
  issueSession,
  rotateSession,
  revokeSession,
  revokeAllForUser,
} = require('../services/authSessionService');

const user = { id: 7, email: 'person@example.com', role: 'user' };
const req = { ip: '127.0.0.1', get: jest.fn(() => 'test-agent') };

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });
});

describe('authSessionService', () => {
  it('issues typed tokens and persists only a refresh-token hash', async () => {
    const tokens = await issueSession(user, req);
    const access = jwt.verify(tokens.accessToken, process.env.JWT_SECRET);
    const refresh = jwt.verify(tokens.refreshToken, process.env.JWT_REFRESH_SECRET);

    expect(access.typ).toBe('access');
    expect(refresh.typ).toBe('refresh');
    expect(refresh.sid).toBe(access.sid);
    expect(refresh.jti).toBeTruthy();
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const params = mockQuery.mock.calls[0][1];
    expect(params[3]).toBe(digest(tokens.refreshToken));
    expect(params[3]).not.toContain(tokens.refreshToken);
  });

  it('bridges a verified legacy refresh token into a stateful session', async () => {
    const legacy = generateTokens(user).refreshToken;
    const decoded = jwt.verify(legacy, process.env.JWT_REFRESH_SECRET);
    const rotated = await rotateSession(legacy, user, decoded, req);

    expect(jwt.verify(rotated.refreshToken, process.env.JWT_REFRESH_SECRET).sid).toBeTruthy();
    expect(mockGetClient).not.toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('rotates a session atomically and retires the old token', async () => {
    const old = generateTokens(user, { sessionId: '87830e8f-5264-4f4c-a3b7-420c3e8db86d', refreshTokenId: 'old-jti' }).refreshToken;
    const decoded = jwt.verify(old, process.env.JWT_REFRESH_SECRET);
    const client = {
      query: jest.fn(async (sql) => {
        if (sql.includes('SELECT id, family_id')) {
          return { rows: [{
            id: decoded.sid,
            family_id: '550e8400-e29b-41d4-a716-446655440000',
            user_id: user.id,
            refresh_token_hash: digest(old),
            expires_at: new Date(Date.now() + 60_000),
            revoked_at: null,
            revoked_reason: null,
          }] };
        }
        return { rows: [], rowCount: 1 };
      }),
      release: jest.fn(),
    };
    mockGetClient.mockResolvedValue(client);

    const tokens = await rotateSession(old, user, decoded, req);
    expect(tokens.refreshToken).not.toBe(old);
    expect(client.query.mock.calls.map(([sql]) => sql.trim().split(/\s+/)[0])).toEqual(
      expect.arrayContaining(['BEGIN', 'SELECT', 'INSERT', 'UPDATE', 'COMMIT'])
    );
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it('returns a non-fatal conflict for an immediate cross-tab rotation race', async () => {
    const old = generateTokens(user, { sessionId: '87830e8f-5264-4f4c-a3b7-420c3e8db86d' }).refreshToken;
    const decoded = jwt.verify(old, process.env.JWT_REFRESH_SECRET);
    const client = {
      query: jest.fn(async (sql) => sql.includes('SELECT id, family_id')
        ? { rows: [{
          id: decoded.sid,
          family_id: '550e8400-e29b-41d4-a716-446655440000',
          user_id: user.id,
          refresh_token_hash: digest(old),
          expires_at: new Date(Date.now() + 60_000),
          revoked_at: new Date(),
          revoked_reason: 'rotated',
        }] }
        : { rows: [], rowCount: 1 }),
      release: jest.fn(),
    };
    mockGetClient.mockResolvedValue(client);

    await expect(rotateSession(old, user, decoded, req)).rejects.toMatchObject({
      code: 'SESSION_ALREADY_ROTATED', status: 409,
    });
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('revokes the whole family on logout without exposing invalid-token errors', async () => {
    const token = generateTokens(user, { sessionId: '87830e8f-5264-4f4c-a3b7-420c3e8db86d' }).refreshToken;
    await expect(revokeSession(token)).resolves.toBe(true);
    await expect(revokeSession('not-a-token')).resolves.toBe(false);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('can revoke sessions through an existing transaction client', async () => {
    const client = { query: jest.fn().mockResolvedValue({ rowCount: 2 }) };
    await revokeAllForUser(user.id, 'password_changed', null, client);
    expect(client.query).toHaveBeenCalledTimes(1);
    expect(client.query.mock.calls[0]).toHaveLength(2);
  });
});
