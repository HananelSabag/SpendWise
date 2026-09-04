/**
 * Grocery sharing controller — invitations and membership.
 *
 * Two things worth knowing before changing anything here:
 *
 * 1. Opening an invitation URL must never join a list. `preview` is read-only;
 *    joining requires an explicit POST .../accept from the invited person.
 * 2. The response to "invite this email" does not vary on whether that email has
 *    a SpendWise account, so this endpoint can't be used to enumerate accounts.
 *    The owner still gets a shareable link, because email delivery is
 *    best-effort and must never be the only way in.
 */

const { asyncHandler } = require('../middleware/errorHandler');
const { fail } = require('../middleware/groceryAccess');
const { GroceryList } = require('../models/GroceryList');
const { GroceryInvitation, INVITE_RESULT } = require('../models/GroceryInvitation');
const { Notification } = require('../models/Notification');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inviteUrlFor = (token) =>
  `${process.env.CLIENT_URL || ''}/grocery/invite/${token}`;

const displayName = (user) =>
  user.first_name || user.username || String(user.email || '').split('@')[0];

/** Map an accept/decline outcome onto HTTP + a stable client code. */
const INVITE_FAILURES = {
  [INVITE_RESULT.NOT_FOUND]:              [404, 'GROCERY_INVITE_NOT_FOUND'],
  [INVITE_RESULT.EXPIRED]:                [410, 'GROCERY_INVITE_EXPIRED'],
  [INVITE_RESULT.WRONG_RECIPIENT]:        [403, 'GROCERY_INVITE_WRONG_RECIPIENT'],
  [INVITE_RESULT.ALREADY_IN_ANOTHER_LIST]:[409, 'GROCERY_ALREADY_IN_ANOTHER_LIST'],
  [INVITE_RESULT.OWN_LIST_NOT_EMPTY]:     [409, 'GROCERY_OWN_LIST_NOT_EMPTY'],
};

const groceryShareController = {
  /** POST /grocery/invitations — owner invites an email address. */
  invite: asyncHandler(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email || !EMAIL_PATTERN.test(email) || email.length > 255) {
      return fail(res, 400, 'GROCERY_EMAIL_INVALID', 'A valid email address is required');
    }
    if (email === String(req.user.email || '').toLowerCase()) {
      return fail(res, 400, 'GROCERY_SELF_INVITE', 'You are already on this list');
    }

    const listId = req.groceryList.id;
    const { invitation, inviteeIsRegistered, alreadyMember } =
      await GroceryInvitation.create(listId, req.user.id, email);

    if (alreadyMember) {
      // Not an enumeration leak: the owner can already see their own members.
      return fail(res, 409, 'GROCERY_ALREADY_MEMBER', 'That person is already on the list');
    }

    const inviterName = displayName(req.user);
    const url = inviteUrlFor(invitation.token);

    // In-app first: this is the path that always works.
    if (invitation.invitee_id) {
      await Notification.create(
        invitation.invitee_id,
        'grocery_invite',
        'Shared grocery list invitation',
        `${inviterName} invited you to a shared grocery list`,
        { token: invitation.token, listId, inviterName, inviterId: req.user.id, link: `/grocery/invite/${invitation.token}` }
      ).catch((err) => logger.warn('[GROCERY] invite notification failed', { message: err.message }));
    }

    // Email is a convenience, never a requirement — report the truth about it.
    const emailDelivered = await emailService
      .sendGroceryInvite(inviterName, email, invitation.token, { isRegistered: inviteeIsRegistered })
      .catch(() => false);

    res.status(201).json({
      success: true,
      data: {
        inviteUrl: url,
        expiresAt: invitation.expires_at,
        emailDelivered: !!emailDelivered,
        // Told only to the owner, who initiated it, so the UI can say
        // "they'll need to sign up first" instead of pretending a mail landed.
        inviteeIsRegistered,
      },
    });
  }),

  /** GET /grocery/invitations — pending invitations addressed to me. */
  getMyInvitations: asyncHandler(async (req, res) => {
    const invitations = await GroceryInvitation.getPendingForUser(req.user.id, req.user.email);
    res.json({ success: true, data: invitations });
  }),

  /**
   * GET /grocery/invitations/:token — read-only preview.
   * Never mutates anything; the Accept button does that.
   */
  preview: asyncHandler(async (req, res) => {
    const invitation = await GroceryInvitation.getByToken(req.params.token);
    if (!invitation || invitation.archived_at) {
      return fail(res, 404, 'GROCERY_INVITE_NOT_FOUND', 'Invitation not found');
    }

    const userEmail = String(req.user.email || '').toLowerCase();
    const addressedToMe = invitation.invitee_id === req.user.id
      || (invitation.invitee_id === null && invitation.invitee_email === userEmail);

    const expired = new Date(invitation.expires_at) <= new Date();
    const alreadyMember = !!(await GroceryList.getMembership(invitation.list_id, req.user.id));

    res.json({
      success: true,
      data: {
        token: invitation.token,
        listName: invitation.list_name,
        memberCount: invitation.member_count,
        status: invitation.status,
        expiresAt: invitation.expires_at,
        expired,
        addressedToMe,
        alreadyMember,
        inviter: {
          firstName: invitation.inviter_first_name,
          lastName: invitation.inviter_last_name,
          username: invitation.inviter_username,
          avatar: invitation.inviter_avatar,
        },
      },
    });
  }),

  /** POST /grocery/invitations/:token/accept */
  accept: asyncHandler(async (req, res) => {
    const outcome = await GroceryInvitation.accept(req.params.token, req.user);

    if (outcome.result !== INVITE_RESULT.OK) {
      const [status, code] = INVITE_FAILURES[outcome.result] || [400, 'GROCERY_INVITE_FAILED'];
      return fail(res, status, code, 'Could not accept the invitation');
    }

    // Retire only the notification for THIS invitation.
    await Notification.markReadByDataValue(
      req.user.id, 'grocery_invite', 'token', req.params.token
    ).catch(() => {});

    const memberName = displayName(req.user);
    await Notification.create(
      outcome.inviterId,
      'grocery_invite_accepted',
      'Invitation accepted',
      `${memberName} joined your grocery list`,
      { listId: outcome.listId, memberId: req.user.id, memberName, link: '/grocery' }
    ).catch(() => {});

    res.json({ success: true, data: { listId: outcome.listId } });
  }),

  /** POST /grocery/invitations/:token/decline */
  decline: asyncHandler(async (req, res) => {
    const declined = await GroceryInvitation.decline(req.params.token, req.user);
    if (!declined) {
      return fail(res, 404, 'GROCERY_INVITE_NOT_FOUND', 'Invitation not found');
    }

    await Notification.markReadByDataValue(
      req.user.id, 'grocery_invite', 'token', req.params.token
    ).catch(() => {});

    const memberName = displayName(req.user);
    await Notification.create(
      declined.inviter_id,
      'grocery_invite_declined',
      'Invitation declined',
      `${memberName} declined your grocery list invitation`,
      { listId: declined.list_id, memberName }
    ).catch(() => {});

    res.json({ success: true });
  }),

  /** DELETE /grocery/invitations — owner withdraws a pending invitation. */
  cancel: asyncHandler(async (req, res) => {
    const email = String(req.body.email || req.query.email || '').trim().toLowerCase();
    if (!email) return fail(res, 400, 'GROCERY_EMAIL_INVALID', 'Email is required');

    const cancelled = await GroceryInvitation.cancel(req.groceryList.id, req.user.id, email);
    if (!cancelled) {
      return fail(res, 404, 'GROCERY_INVITE_NOT_FOUND', 'No pending invitation for that address');
    }

    if (cancelled.invitee_id) {
      await Notification.deleteByDataValue(
        cancelled.invitee_id, 'grocery_invite', 'token', cancelled.token
      ).catch(() => {});
    }

    res.json({ success: true });
  }),

  /** GET /grocery/members */
  getMembers: asyncHandler(async (req, res) => {
    const [members, pendingInvitations] = await Promise.all([
      GroceryList.getMembers(req.groceryList.id),
      req.groceryRole === 'owner'
        ? GroceryInvitation.getPendingForList(req.groceryList.id)
        : Promise.resolve([]),
    ]);

    res.json({
      success: true,
      data: {
        members: members.map((m) => ({
          ...m,
          // Only the owner needs addresses; members see names.
          email: req.groceryRole === 'owner' ? m.email : undefined,
        })),
        pendingInvitations,
        role: req.groceryRole,
        ownerId: req.groceryList.owner_id,
      },
    });
  }),

  /** DELETE /grocery/members/:userId — owner removes a member. */
  removeMember: asyncHandler(async (req, res) => {
    const targetId = Number(req.params.userId);
    if (!Number.isInteger(targetId)) {
      return fail(res, 400, 'GROCERY_USER_ID_INVALID', 'Invalid user id');
    }
    if (targetId === req.user.id) {
      return fail(res, 400, 'GROCERY_OWNER_CANNOT_LEAVE', 'The owner cannot remove themselves');
    }

    const removed = await GroceryList.removeMember(req.groceryList.id, req.user.id, targetId);
    if (!removed) return fail(res, 404, 'GROCERY_MEMBER_NOT_FOUND', 'Member not found');

    await Notification.create(
      targetId,
      'grocery_member_removed',
      'Removed from a grocery list',
      `${displayName(req.user)} removed you from the shared grocery list`,
      { listId: req.groceryList.id, actorName: displayName(req.user) }
    ).catch(() => {});

    res.json({ success: true });
  }),

  /** POST /grocery/leave — a member walks away. */
  leave: asyncHandler(async (req, res) => {
    if (req.groceryRole === 'owner') {
      return fail(res, 400, 'GROCERY_OWNER_CANNOT_LEAVE', 'The owner closes the list instead of leaving');
    }

    const left = await GroceryList.leave(req.groceryList.id, req.user.id);
    if (!left) return fail(res, 404, 'GROCERY_MEMBER_NOT_FOUND', 'You are not a member of this list');

    await Notification.create(
      req.groceryList.owner_id,
      'grocery_member_left',
      'A member left your grocery list',
      `${displayName(req.user)} left the shared grocery list`,
      { listId: req.groceryList.id, memberName: displayName(req.user) }
    ).catch(() => {});

    res.json({ success: true });
  }),

  /** DELETE /grocery/members — owner ends the sharing but keeps the list. */
  disband: asyncHandler(async (req, res) => {
    const removedIds = await GroceryList.disband(req.groceryList.id, req.user.id);
    const ownerName = displayName(req.user);

    await Promise.all(removedIds.map((memberId) =>
      Notification.create(
        memberId,
        'grocery_list_disbanded',
        'Shared grocery list closed',
        `${ownerName} closed the shared grocery list`,
        { listId: req.groceryList.id, actorName: ownerName }
      ).catch(() => {})
    ));

    res.json({ success: true, data: { removed: removedIds.length } });
  }),
};

module.exports = groceryShareController;
