jest.mock('../config/db', () => ({ query: jest.fn(), getClient: jest.fn() }));
jest.mock('../services/emailService', () => ({ sendGroceryInvite: jest.fn() }));

const db = require('../config/db');
const emailService = require('../services/emailService');
const share = require('../controllers/groceryShareController');
const { GroceryInvitation, INVITE_RESULT } = require('../models/GroceryInvitation');
const { GroceryList } = require('../models/GroceryList');
const { Notification } = require('../models/Notification');

const makeRes = () => {
  const res = { statusCode: 200, body: null };
  res.finished = new Promise((resolve) => { res.resolveFinished = resolve; });
  res.status = jest.fn((code) => { res.statusCode = code; return res; });
  res.json = jest.fn((payload) => { res.body = payload; res.resolveFinished(payload); return res; });
  return res;
};

const run = (handler, req, res) => {
  let fail;
  const errored = new Promise((_, reject) => { fail = reject; });
  handler(req, res, (err) => fail(err || new Error('next() was called without an error')));
  return Promise.race([res.finished, errored]);
};

const makeReq = (overrides = {}) => ({
  user: { id: 7, first_name: 'Hananel', username: 'hananel', email: 'me@example.com' },
  params: {},
  query: {},
  body: {},
  groceryList: { id: 5, owner_id: 7, role: 'owner' },
  groceryRole: 'owner',
  ...overrides,
});

beforeEach(() => {
  jest.restoreAllMocks();
  db.query.mockReset();
  db.query.mockResolvedValue({ rows: [], rowCount: 0 });
  emailService.sendGroceryInvite.mockReset();
  emailService.sendGroceryInvite.mockResolvedValue(true);
  process.env.CLIENT_URL = 'https://app.example';
});

describe('inviting', () => {
  test('rejects a malformed address', async () => {
    const res = makeRes();
    await run(share.invite, makeReq({ body: { email: 'not-an-email' } }), res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('GROCERY_EMAIL_INVALID');
  });

  test('refuses a self-invite', async () => {
    const res = makeRes();
    await run(share.invite, makeReq({ body: { email: 'ME@example.com' } }), res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('GROCERY_SELF_INVITE');
  });

  test('always returns a shareable link, because email delivery can fail', async () => {
    jest.spyOn(GroceryInvitation, 'create').mockResolvedValue({
      invitation: { token: 'abc', invitee_id: 44, expires_at: 'later' },
      inviteeIsRegistered: true,
      alreadyMember: false,
    });
    jest.spyOn(Notification, 'create').mockResolvedValue({});
    emailService.sendGroceryInvite.mockResolvedValue(false);

    const res = makeRes();
    await run(share.invite, makeReq({ body: { email: 'nofar@example.com' } }), res);

    expect(res.statusCode).toBe(201);
    expect(res.body.data.inviteUrl).toBe('https://app.example/grocery/invite/abc');
    // The truth about the email, so the UI can say "share the link instead".
    expect(res.body.data.emailDelivered).toBe(false);
  });

  test('notifies a registered invitee in-app, not just by email', async () => {
    jest.spyOn(GroceryInvitation, 'create').mockResolvedValue({
      invitation: { token: 'abc', invitee_id: 44, expires_at: 'later' },
      inviteeIsRegistered: true,
      alreadyMember: false,
    });
    const notify = jest.spyOn(Notification, 'create').mockResolvedValue({});

    await run(share.invite, makeReq({ body: { email: 'nofar@example.com' } }), makeRes());

    expect(notify).toHaveBeenCalledWith(
      44,
      'grocery_invite',
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ token: 'abc', link: '/grocery/invite/abc' }),
    );
  });

  test('an unregistered invitee still gets a link, and the owner is told why', async () => {
    jest.spyOn(GroceryInvitation, 'create').mockResolvedValue({
      invitation: { token: 'xyz', invitee_id: null, expires_at: 'later' },
      inviteeIsRegistered: false,
      alreadyMember: false,
    });
    const notify = jest.spyOn(Notification, 'create');

    const res = makeRes();
    await run(share.invite, makeReq({ body: { email: 'newcomer@example.com' } }), res);

    expect(res.body.data.inviteeIsRegistered).toBe(false);
    expect(res.body.data.inviteUrl).toContain('/grocery/invite/xyz');
    expect(notify).not.toHaveBeenCalled();
  });

  test('an email failure never breaks the invitation', async () => {
    jest.spyOn(GroceryInvitation, 'create').mockResolvedValue({
      invitation: { token: 'abc', invitee_id: null, expires_at: 'later' },
      inviteeIsRegistered: false,
      alreadyMember: false,
    });
    emailService.sendGroceryInvite.mockRejectedValue(new Error('smtp down'));

    const res = makeRes();
    await run(share.invite, makeReq({ body: { email: 'newcomer@example.com' } }), res);

    expect(res.statusCode).toBe(201);
    expect(res.body.data.emailDelivered).toBe(false);
  });
});

describe('previewing an invitation', () => {
  test('is read-only — no membership is created by looking', async () => {
    jest.spyOn(GroceryInvitation, 'getByToken').mockResolvedValue({
      token: 'abc',
      list_id: 5,
      invitee_id: 7,
      invitee_email: 'me@example.com',
      status: 'pending',
      expires_at: new Date(Date.now() + 10_000).toISOString(),
      list_name: 'Household',
      member_count: 2,
      inviter_first_name: 'Nofar',
      archived_at: null,
    });
    jest.spyOn(GroceryList, 'getMembership').mockResolvedValue(null);

    const res = makeRes();
    await run(share.preview, makeReq({ params: { token: 'abc' } }), res);

    expect(res.body.data.addressedToMe).toBe(true);
    expect(res.body.data.expired).toBe(false);
    // The only writes in this whole request would have to come from these:
    expect(db.query).not.toHaveBeenCalled();
  });

  test('marks an invitation addressed to another account', async () => {
    jest.spyOn(GroceryInvitation, 'getByToken').mockResolvedValue({
      token: 'abc',
      list_id: 5,
      invitee_id: 44,
      invitee_email: 'nofar@example.com',
      status: 'pending',
      expires_at: new Date(Date.now() + 10_000).toISOString(),
      archived_at: null,
      member_count: 2,
    });
    jest.spyOn(GroceryList, 'getMembership').mockResolvedValue(null);

    const res = makeRes();
    await run(share.preview, makeReq({ params: { token: 'abc' } }), res);

    expect(res.body.data.addressedToMe).toBe(false);
  });
});

describe('responding to an invitation', () => {
  test('marks only this invitation read, never everything', async () => {
    jest.spyOn(GroceryInvitation, 'accept').mockResolvedValue({
      result: INVITE_RESULT.OK, listId: 5, inviterId: 1,
    });
    const markOne = jest.spyOn(Notification, 'markReadByDataValue').mockResolvedValue(1);
    const markAll = jest.spyOn(Notification, 'markAllRead');
    jest.spyOn(Notification, 'create').mockResolvedValue({});

    await run(share.accept, makeReq({ params: { token: 'abc' } }), makeRes());

    expect(markOne).toHaveBeenCalledWith(7, 'grocery_invite', 'token', 'abc');
    expect(markAll).not.toHaveBeenCalled();
  });

  test('maps each refusal onto its own status and code', async () => {
    const cases = [
      [INVITE_RESULT.NOT_FOUND, 404, 'GROCERY_INVITE_NOT_FOUND'],
      [INVITE_RESULT.EXPIRED, 410, 'GROCERY_INVITE_EXPIRED'],
      [INVITE_RESULT.WRONG_RECIPIENT, 403, 'GROCERY_INVITE_WRONG_RECIPIENT'],
      [INVITE_RESULT.ALREADY_IN_ANOTHER_LIST, 409, 'GROCERY_ALREADY_IN_ANOTHER_LIST'],
      [INVITE_RESULT.OWN_LIST_NOT_EMPTY, 409, 'GROCERY_OWN_LIST_NOT_EMPTY'],
    ];

    for (const [result, status, code] of cases) {
      jest.spyOn(GroceryInvitation, 'accept').mockResolvedValue({ result });
      const res = makeRes();
      await run(share.accept, makeReq({ params: { token: 'abc' } }), res);

      expect(res.statusCode).toBe(status);
      expect(res.body.error.code).toBe(code);
    }
  });
});

describe('membership management', () => {
  test('the owner cannot remove themselves through the member endpoint', async () => {
    const res = makeRes();
    await run(share.removeMember, makeReq({ params: { userId: '7' } }), res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('GROCERY_OWNER_CANNOT_LEAVE');
  });

  test('the owner leaves by disbanding, not by leaving', async () => {
    const res = makeRes();
    await run(share.leave, makeReq(), res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('GROCERY_OWNER_CANNOT_LEAVE');
  });

  test('members do not see who else was invited', async () => {
    jest.spyOn(GroceryList, 'getMembers').mockResolvedValue([
      { user_id: 1, role: 'owner', email: 'owner@example.com' },
      { user_id: 7, role: 'member', email: 'me@example.com' },
    ]);
    const pending = jest.spyOn(GroceryInvitation, 'getPendingForList');

    const res = makeRes();
    await run(
      share.getMembers,
      makeReq({ groceryRole: 'member', groceryList: { id: 5, owner_id: 1, role: 'member' } }),
      res,
    );

    expect(pending).not.toHaveBeenCalled();
    expect(res.body.data.pendingInvitations).toEqual([]);
    expect(res.body.data.members.every((m) => m.email === undefined)).toBe(true);
  });

  test('disbanding tells every removed member', async () => {
    jest.spyOn(GroceryList, 'disband').mockResolvedValue([44, 45]);
    const notify = jest.spyOn(Notification, 'create').mockResolvedValue({});

    const res = makeRes();
    await run(share.disband, makeReq(), res);

    expect(res.body.data.removed).toBe(2);
    expect(notify).toHaveBeenCalledTimes(2);
    expect(notify.mock.calls.map((call) => call[0])).toEqual([44, 45]);
  });
});
