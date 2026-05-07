/**
 * Shopping Share Controller
 */

const { ShoppingShare, Notification } = require('../models/ShoppingShare');
const { asyncHandler } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');

const SILENT_OK = { success: true, message: 'אם האימייל רשום במערכת, נשלחה הזמנה' };

const shoppingShareController = {
  // POST /shopping/invite
  invite: asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email?.trim()) {
      return res.status(400).json({ success: false, error: { message: 'נדרש אימייל' } });
    }

    const inviteeEmail = email.trim().toLowerCase();

    // Silent self-invite
    if (inviteeEmail === req.user.email.toLowerCase()) {
      return res.json(SILENT_OK);
    }

    try {
      const { invitation, inviteeFound } = await ShoppingShare.createInvitation(
        req.user.id,
        inviteeEmail
      );

      if (inviteeFound && invitation) {
        const inviterName = req.user.first_name || req.user.username;

        emailService
          .sendShoppingInvite(inviterName, inviteeEmail, invitation.token)
          .catch(() => {});

        await Notification.create(
          invitation.invitee_id,
          'shopping_invite',
          'הזמנה לרשימת קניות',
          `${inviterName} הזמין אותך לרשימת קניות משותפת`,
          { token: invitation.token, inviterName, inviterId: req.user.id }
        );
      }
    } catch (_) {}

    res.json(SILENT_OK);
  }),

  // GET /shopping/invitations
  getInvitations: asyncHandler(async (req, res) => {
    const invitations = await ShoppingShare.getPendingInvitations(req.user.id);
    res.json({ success: true, data: invitations });
  }),

  // POST /shopping/invitations/:token/respond  (body: { action: 'accept'|'decline' })
  respondToInvitation: asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { action } = req.body;

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ success: false, error: { message: 'פעולה לא תקינה' } });
    }

    if (action === 'accept') {
      const inv = await ShoppingShare.acceptInvitation(token, req.user.id);
      if (!inv) return res.status(404).json({ success: false, error: { message: 'הזמנה לא נמצאה' } });

      const memberName = req.user.first_name || req.user.username;
      await Promise.all([
        Notification.create(
          inv.inviter_id,
          'shopping_invite_accepted',
          'הזמנה התקבלה',
          `${memberName} הצטרף לרשימת הקניות שלך`,
          { memberId: req.user.id, memberName }
        ).catch(() => {}),
        // Clear the invite notification now that it's been acted on
        Notification.markReadByType(req.user.id, 'shopping_invite').catch(() => {}),
      ]);

      return res.json({ success: true, message: 'הצטרפת לרשימה בהצלחה' });
    }

    const declined = await ShoppingShare.declineInvitation(token, req.user.id);
    if (!declined) return res.status(404).json({ success: false, error: { message: 'הזמנה לא נמצאה' } });
    // Clear the invite notification now that it's been acted on
    Notification.markReadByType(req.user.id, 'shopping_invite').catch(() => {});
    res.json({ success: true, message: 'ההזמנה נדחתה' });
  }),

  // GET /shopping/members
  getMembers: asyncHandler(async (req, res) => {
    const members = await ShoppingShare.getMembers(req.user.id);
    res.json({ success: true, data: members });
  }),

  // DELETE /shopping/members/:userId  (owner removes member OR member leaves)
  removeMember: asyncHandler(async (req, res) => {
    const targetId = parseInt(req.params.userId, 10);
    if (isNaN(targetId)) return res.status(400).json({ success: false, error: { message: 'מזהה לא תקין' } });

    // Try owner-removes-member first, then member-leaves-voluntarily
    const ownerRemoved = await ShoppingShare.removeMember(req.user.id, targetId);
    const memberLeft = ownerRemoved ? false : await ShoppingShare.leaveShare(targetId, req.user.id);

    if (!ownerRemoved && !memberLeft) return res.status(404).json({ success: false, error: { message: 'שיתוף לא נמצא' } });

    // Notify the removed member (not when they leave voluntarily)
    if (ownerRemoved) {
      const removerName = req.user.first_name || req.user.username;
      Notification.create(
        targetId,
        'shopping_removed',
        'הוסרת מרשימת קניות',
        `${removerName} הסיר אותך מרשימת הקניות המשותפת`,
        { removedBy: req.user.id, removerName }
      ).catch(() => {});
    }

    res.json({ success: true });
  }),

  // DELETE /shopping/disband  — owner removes ALL members at once
  disband: asyncHandler(async (req, res) => {
    const removedIds = await ShoppingShare.disbandShare(req.user.id);
    const ownerName = req.user.first_name || req.user.username;

    for (const memberId of removedIds) {
      Notification.create(
        memberId,
        'shopping_removed',
        'רשימת הקניות המשותפת הסתיימה',
        `${ownerName} סגר את רשימת הקניות המשותפת`,
        { removedBy: req.user.id, removerName: ownerName, disbanded: true }
      ).catch(() => {});
    }

    res.json({ success: true, removed: removedIds.length });
  }),

  // DELETE /shopping/invitations/:email
  cancelInvitation: asyncHandler(async (req, res) => {
    const email = decodeURIComponent(req.params.email).toLowerCase();
    await ShoppingShare.cancelInvitation(req.user.id, email);
    res.json({ success: true });
  }),
};

module.exports = shoppingShareController;
