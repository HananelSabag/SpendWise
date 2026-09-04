jest.mock('../config/db', () => ({ query: jest.fn(), getClient: jest.fn() }));

const db = require('../config/db');
const { GroceryInvitation, INVITE_RESULT } = require('../models/GroceryInvitation');

/**
 * A scripted transaction client. `script` maps a regex fragment of the SQL to a
 * result, so each test only has to describe the rows it actually cares about.
 */
const makeClient = (script) => {
  const statements = [];
  const client = {
    statements,
    released: false,
    query: jest.fn(async (sql, params) => {
      statements.push({ sql, params });
      // Match against whitespace-normalised SQL so a pattern doesn't have to
      // reproduce the query's line breaks and indentation.
      const flat = String(sql).replace(/\s+/g, ' ').trim();
      const hit = script.find(([pattern]) => new RegExp(pattern, 'i').test(flat));
      return hit ? hit[1] : { rows: [], rowCount: 0 };
    }),
    release: jest.fn(function release() { client.released = true; }),
  };
  return client;
};

const sqlLog = (client) => client.statements.map((s) => s.sql.replace(/\s+/g, ' ').trim());
const ran = (client, pattern) => sqlLog(client).some((sql) => new RegExp(pattern, 'i').test(sql));

const user = { id: 44, email: 'Nofar@Example.com' };

const pendingInvitation = (overrides = {}) => ({
  id: 10,
  list_id: 5,
  inviter_id: 1,
  invitee_email: 'nofar@example.com',
  invitee_id: 44,
  status: 'pending',
  expires_at: new Date(Date.now() + 86_400_000).toISOString(),
  archived_at: null,
  ...overrides,
});

describe('grocery invitation acceptance', () => {
  beforeEach(() => {
    db.query.mockReset();
    db.getClient.mockReset();
  });

  test('joins and flips status inside one transaction', async () => {
    const client = makeClient([
      ['FROM grocery_list_invitations', { rows: [pendingInvitation()] }],
      ['SELECT 1 FROM grocery_list_members', { rows: [] }],
      ['FROM grocery_list_members m JOIN grocery_lists', { rows: [] }],
    ]);
    db.getClient.mockResolvedValue(client);

    const outcome = await GroceryInvitation.accept('tok', user);

    expect(outcome.result).toBe(INVITE_RESULT.OK);
    expect(outcome.listId).toBe(5);
    expect(ran(client, '^BEGIN$')).toBe(true);
    expect(ran(client, '^COMMIT$')).toBe(true);
    expect(ran(client, 'INSERT INTO grocery_list_members')).toBe(true);
    expect(ran(client, "SET status = 'accepted'")).toBe(true);
    expect(client.released).toBe(true);
  });

  test('locks the invitation row so two taps cannot both join', async () => {
    const client = makeClient([['FROM grocery_list_invitations', { rows: [pendingInvitation()] }]]);
    db.getClient.mockResolvedValue(client);

    await GroceryInvitation.accept('tok', user);

    expect(ran(client, 'FOR UPDATE OF inv')).toBe(true);
  });

  test('accepting twice is a success, not an error', async () => {
    const client = makeClient([
      ['FROM grocery_list_invitations', { rows: [pendingInvitation({ status: 'accepted' })] }],
      ['SELECT 1 FROM grocery_list_members', { rows: [{ '?column?': 1 }] }],
    ]);
    db.getClient.mockResolvedValue(client);

    const outcome = await GroceryInvitation.accept('tok', user);

    expect(outcome.result).toBe(INVITE_RESULT.OK);
    expect(ran(client, '^COMMIT$')).toBe(true);
  });

  test('someone else holding the link cannot redeem it', async () => {
    const client = makeClient([
      ['FROM grocery_list_invitations', { rows: [pendingInvitation({ invitee_id: 99 })] }],
    ]);
    db.getClient.mockResolvedValue(client);

    const outcome = await GroceryInvitation.accept('tok', user);

    expect(outcome.result).toBe(INVITE_RESULT.WRONG_RECIPIENT);
    expect(ran(client, '^ROLLBACK$')).toBe(true);
    expect(ran(client, 'INSERT INTO grocery_list_members')).toBe(false);
  });

  test('an unregistered invitation is matched on the email, case-insensitively', async () => {
    const client = makeClient([
      ['FROM grocery_list_invitations', { rows: [pendingInvitation({ invitee_id: null })] }],
    ]);
    db.getClient.mockResolvedValue(client);

    const outcome = await GroceryInvitation.accept('tok', user);

    expect(outcome.result).toBe(INVITE_RESULT.OK);
  });

  test('an expired invitation is marked expired, not silently accepted', async () => {
    const client = makeClient([
      ['FROM grocery_list_invitations', {
        rows: [pendingInvitation({ expires_at: new Date(Date.now() - 1000).toISOString() })],
      }],
    ]);
    db.getClient.mockResolvedValue(client);

    const outcome = await GroceryInvitation.accept('tok', user);

    expect(outcome.result).toBe(INVITE_RESULT.EXPIRED);
    expect(ran(client, "SET status = 'expired'")).toBe(true);
    expect(ran(client, 'INSERT INTO grocery_list_members')).toBe(false);
  });

  test('refuses rather than silently moving a user out of another shared list', async () => {
    const client = makeClient([
      ['FROM grocery_list_invitations', { rows: [pendingInvitation()] }],
      ['SELECT 1 FROM grocery_list_members', { rows: [] }],
      ['FROM grocery_list_members m JOIN grocery_lists', { rows: [{ list_id: 8, role: 'member', owner_id: 3 }] }],
    ]);
    db.getClient.mockResolvedValue(client);

    const outcome = await GroceryInvitation.accept('tok', user);

    expect(outcome.result).toBe(INVITE_RESULT.ALREADY_IN_ANOTHER_LIST);
    expect(ran(client, '^ROLLBACK$')).toBe(true);
  });

  test('refuses when the user owns a list that still holds items or history', async () => {
    const client = makeClient([
      ['FROM grocery_list_invitations', { rows: [pendingInvitation()] }],
      ['SELECT 1 FROM grocery_list_members', { rows: [] }],
      ['FROM grocery_list_members m JOIN grocery_lists', { rows: [{ list_id: 8, role: 'owner', owner_id: 44 }] }],
      ['other_members', { rows: [{ other_members: '0', history: '2', items: '0' }] }],
    ]);
    db.getClient.mockResolvedValue(client);

    const outcome = await GroceryInvitation.accept('tok', user);

    expect(outcome.result).toBe(INVITE_RESULT.OWN_LIST_NOT_EMPTY);
    expect(ran(client, 'SET archived_at')).toBe(false);
  });

  test('archives an untouched auto-created list instead of blocking the join', async () => {
    const client = makeClient([
      ['FROM grocery_list_invitations', { rows: [pendingInvitation()] }],
      ['SELECT 1 FROM grocery_list_members', { rows: [] }],
      ['FROM grocery_list_members m JOIN grocery_lists', { rows: [{ list_id: 8, role: 'owner', owner_id: 44 }] }],
      ['other_members', { rows: [{ other_members: '0', history: '0', items: '0' }] }],
    ]);
    db.getClient.mockResolvedValue(client);

    const outcome = await GroceryInvitation.accept('tok', user);

    expect(outcome.result).toBe(INVITE_RESULT.OK);
    expect(ran(client, 'SET archived_at = NOW\\(\\)')).toBe(true);
    expect(ran(client, 'INSERT INTO grocery_list_members')).toBe(true);
  });

  test('rolls back and releases the client when a statement throws', async () => {
    const client = makeClient([]);
    client.query.mockImplementation(async (sql) => {
      if (/FROM grocery_list_invitations/i.test(sql)) throw new Error('boom');
      return { rows: [] };
    });
    db.getClient.mockResolvedValue(client);

    await expect(GroceryInvitation.accept('tok', user)).rejects.toThrow('boom');
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });
});

describe('grocery invitation creation and lifecycle', () => {
  beforeEach(() => db.query.mockReset());

  test('reports an existing member without creating a duplicate invitation', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 44 }] })       // user lookup
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }); // already a member

    const result = await GroceryInvitation.create(5, 1, 'Nofar@Example.com');

    expect(result.alreadyMember).toBe(true);
    expect(result.invitation).toBeNull();
    expect(db.query).toHaveBeenCalledTimes(2);
  });

  test('refreshes an existing pending invitation rather than stacking rows', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 44 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 10, token: 'fresh' }] });

    const result = await GroceryInvitation.create(5, 1, 'nofar@example.com');

    expect(result.invitation.token).toBe('fresh');
    expect(db.query.mock.calls[2][0]).toMatch(/UPDATE grocery_list_invitations/i);
    expect(db.query.mock.calls[2][0]).toMatch(/token\s+= gen_random_uuid\(\)/i);
  });

  test('an unregistered address still gets an invitation row', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })                       // no such user
      .mockResolvedValueOnce({ rows: [] })                       // no pending row
      .mockResolvedValueOnce({ rows: [{ id: 11, token: 'tok' }] });

    const result = await GroceryInvitation.create(5, 1, 'newcomer@example.com');

    expect(result.inviteeIsRegistered).toBe(false);
    expect(result.invitation.id).toBe(11);
    expect(db.query.mock.calls[2][1]).toEqual([5, 1, 'newcomer@example.com', null]);
  });

  test('emails are normalised to lowercase before they touch the database', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 12 }] });

    await GroceryInvitation.create(5, 1, '  MiXeD@Case.COM ');

    expect(db.query.mock.calls[0][1]).toEqual(['mixed@case.com']);
  });

  test('registration claims invitations sent before the account existed', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    await GroceryInvitation.linkForNewUser(77, 'New@Example.com');

    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toMatch(/invitee_id IS NULL/);
    expect(sql).toMatch(/status = 'pending'/);
    // Still pending: linking must not join anyone automatically.
    expect(sql).not.toMatch(/status = 'accepted'/);
    expect(params).toEqual([77, 'new@example.com']);
  });

  test('pending invitations are found by id or by email', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    await GroceryInvitation.getPendingForUser(44, 'Nofar@Example.com');

    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toMatch(/inv\.invitee_id = \$1 OR LOWER\(inv\.invitee_email\) = \$2/);
    expect(params).toEqual([44, 'nofar@example.com']);
  });
});

describe('open share links', () => {
  beforeEach(() => {
    db.query.mockReset();
    db.getClient.mockReset();
  });

  test('reuses the list\'s existing live link instead of minting a new one', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 3, token: 'existing' }] });

    const link = await GroceryInvitation.createLink(5, 1);

    expect(link.token).toBe('existing');
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test('retires a lapsed link before creating the replacement', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })                        // none live
      .mockResolvedValueOnce({ rowCount: 1 })                     // expire the old one
      .mockResolvedValueOnce({ rows: [{ id: 4, token: 'fresh' }] });

    const link = await GroceryInvitation.createLink(5, 1);

    expect(link.token).toBe('fresh');
    expect(db.query.mock.calls[1][0]).toMatch(/SET status = 'expired'/i);
    // A link has no recipient — that is what makes it shareable.
    expect(db.query.mock.calls[2][1]).toEqual([5, 1]);
    expect(db.query.mock.calls[2][0]).toMatch(/VALUES \(\$1, \$2, NULL, NULL\)/);
  });

  test('revoking cancels the pending link', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    await expect(GroceryInvitation.revokeLink(5)).resolves.toBe(true);

    const [sql] = db.query.mock.calls[0];
    expect(sql).toMatch(/SET status = 'cancelled'/i);
    expect(sql).toMatch(/invitee_email IS NULL/);
  });

  test('the owner\'s pending list excludes the link — it has no one to wait on', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    await GroceryInvitation.getPendingForList(5);

    expect(db.query.mock.calls[0][0]).toMatch(/invitee_email IS NOT NULL/);
  });

  test('anyone holding the link may redeem it', async () => {
    const client = makeClient([
      ['FROM grocery_list_invitations', {
        rows: [pendingInvitation({ invitee_id: null, invitee_email: null })],
      }],
      ['SELECT 1 FROM grocery_list_members', { rows: [] }],
      ['FROM grocery_list_members m JOIN grocery_lists', { rows: [] }],
    ]);
    db.getClient.mockResolvedValue(client);

    const outcome = await GroceryInvitation.accept('tok', { id: 99, email: 'stranger@example.com' });

    expect(outcome.result).toBe(INVITE_RESULT.OK);
    expect(ran(client, 'INSERT INTO grocery_list_members')).toBe(true);
  });

  test('redeeming a link does not consume it for the next person', async () => {
    const client = makeClient([
      ['FROM grocery_list_invitations', {
        rows: [pendingInvitation({ invitee_id: null, invitee_email: null })],
      }],
      ['SELECT 1 FROM grocery_list_members', { rows: [] }],
      ['FROM grocery_list_members m JOIN grocery_lists', { rows: [] }],
    ]);
    db.getClient.mockResolvedValue(client);

    await GroceryInvitation.accept('tok', { id: 99, email: 'stranger@example.com' });

    expect(ran(client, "SET status = 'accepted'")).toBe(false);
    expect(ran(client, 'SET responded_at = NOW\(\)')).toBe(true);
  });

  test('an existing member reopening the link does not burn it either', async () => {
    const client = makeClient([
      ['FROM grocery_list_invitations', {
        rows: [pendingInvitation({ invitee_id: null, invitee_email: null })],
      }],
      ['SELECT 1 FROM grocery_list_members', { rows: [{ '?column?': 1 }] }],
    ]);
    db.getClient.mockResolvedValue(client);

    const outcome = await GroceryInvitation.accept('tok', { id: 44, email: 'nofar@example.com' });

    expect(outcome.result).toBe(INVITE_RESULT.OK);
    expect(ran(client, "SET status = 'accepted'")).toBe(false);
  });

  test('an addressed invitation still refuses the wrong person', async () => {
    const client = makeClient([
      ['FROM grocery_list_invitations', { rows: [pendingInvitation({ invitee_id: 44 })] }],
    ]);
    db.getClient.mockResolvedValue(client);

    const outcome = await GroceryInvitation.accept('tok', { id: 99, email: 'stranger@example.com' });

    expect(outcome.result).toBe(INVITE_RESULT.WRONG_RECIPIENT);
  });

  test('an expired link is refused like any other invitation', async () => {
    const client = makeClient([
      ['FROM grocery_list_invitations', {
        rows: [pendingInvitation({
          invitee_id: null,
          invitee_email: null,
          expires_at: new Date(Date.now() - 1000).toISOString(),
        })],
      }],
    ]);
    db.getClient.mockResolvedValue(client);

    const outcome = await GroceryInvitation.accept('tok', { id: 99, email: 'stranger@example.com' });

    expect(outcome.result).toBe(INVITE_RESULT.EXPIRED);
  });
});
