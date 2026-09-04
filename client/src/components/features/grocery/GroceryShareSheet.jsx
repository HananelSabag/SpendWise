/**
 * GroceryShareSheet — membership, invitations, and leaving.
 *
 * The invite link is a first-class result, not a fallback footnote: email
 * delivery depends on a verified sending domain and can legitimately fail, so
 * the sheet always hands the owner a copyable link and says plainly whether the
 * email actually went out.
 */

import React, { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Loader2, LogOut, Mail, UserMinus, UserPlus, X } from 'lucide-react';
import BottomSheet from '../../common/BottomSheet';
import { cn } from '../../../utils/helpers';
import { useTranslation } from '../../../stores';
import { useToast } from '../../../hooks/useToast';
import { useGrocerySharing, useMyGroceryInvitations } from '../../../hooks/useGrocerySharing';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialsOf = (member) =>
  (member.first_name || member.username || '?').charAt(0).toUpperCase();

const displayNameOf = (member) =>
  [member.first_name, member.last_name].filter(Boolean).join(' ') || member.username;

const MemberAvatar = ({ member }) => (
  member.avatar
    ? <img src={member.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
    : (
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
        {initialsOf(member)}
      </span>
    )
);

const GroceryShareSheet = ({ isOpen, onClose, members, pendingInvitations, role, currentUserId }) => {
  const { t } = useTranslation('grocery');
  const toast = useToast();
  const { invite, cancelInvite, removeMember, leaveList, disband, respond, isInviting } = useGrocerySharing();
  const { invitations: myInvitations } = useMyGroceryInvitations();

  const [email, setEmail] = useState('');
  const [lastInvite, setLastInvite] = useState(null);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(null);

  const isOwner = role === 'owner';

  const handleInvite = useCallback(async (event) => {
    event.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(value)) {
      toast.error(t('errors.GROCERY_EMAIL_INVALID'));
      return;
    }
    const result = await invite(value);
    if (!result) return;

    setLastInvite(result);
    setEmail('');
    setCopied(false);
    toast.success(t('share.invited'));
  }, [email, invite, t, toast]);

  const handleCopy = useCallback(async () => {
    if (!lastInvite?.inviteUrl) return;
    try {
      await navigator.clipboard.writeText(lastInvite.inviteUrl);
      setCopied(true);
      toast.success(t('share.copied'));
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard can be blocked; the link is on screen and selectable anyway.
      toast.error(t('errors.generic'));
    }
  }, [lastInvite, t, toast]);

  const inputClass = cn(
    'h-11 w-full rounded-xl border px-3 text-[15px]',
    'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400',
    'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
    'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50 dark:placeholder:text-gray-500'
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t('share.title')}>
      <div className="space-y-5 px-4 pb-6">

        {/* Invitations addressed to me */}
        {myInvitations.length > 0 && (
          <section className="space-y-2">
            {myInvitations.map((invitation) => (
              <div
                key={invitation.token}
                className="rounded-2xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-500/30 dark:bg-blue-500/10"
              >
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                  {t('banner.invitation', {
                    name: invitation.inviter_first_name || invitation.inviter_username,
                  })}
                </p>
                <div className="mt-2.5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => respond(invitation.token, 'accept')}
                    className="h-10 flex-1 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    {t('invite.accept')}
                  </button>
                  <button
                    type="button"
                    onClick={() => respond(invitation.token, 'decline')}
                    className="h-10 flex-1 rounded-xl border border-blue-200 text-xs font-bold text-blue-700 dark:border-blue-500/40 dark:text-blue-300"
                  >
                    {t('invite.decline')}
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Members */}
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            {t('share.members')}
          </h3>
          <ul className="space-y-1.5">
            {members.map((member) => (
              <li
                key={member.user_id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2 dark:border-gray-700"
              >
                <MemberAvatar member={member} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
                    {displayNameOf(member)}
                    {member.user_id === currentUserId && (
                      <span className="ms-1.5 text-xs font-medium text-gray-400">
                        ({t('share.you')})
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                    {member.role === 'owner' ? t('share.roleOwner') : t('share.roleMember')}
                  </p>
                </div>

                {isOwner && member.role !== 'owner' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirming !== `member-${member.user_id}`) {
                        setConfirming(`member-${member.user_id}`);
                        return;
                      }
                      removeMember(member.user_id);
                      setConfirming(null);
                    }}
                    aria-label={t('share.remove')}
                    className={cn(
                      'flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors',
                      confirming === `member-${member.user_id}`
                        ? 'bg-red-500 text-white'
                        : 'text-gray-400 hover:text-red-500'
                    )}
                  >
                    <UserMinus className="h-4 w-4" />
                    {confirming === `member-${member.user_id}` && t('share.remove')}
                  </button>
                )}
              </li>
            ))}
          </ul>

          {members.length <= 1 && (
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">{t('share.alone')}</p>
          )}
        </section>

        {/* Pending invitations (owner only — the API doesn't send these to members) */}
        {isOwner && pendingInvitations.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {t('share.pending')}
            </h3>
            <ul className="space-y-1.5">
              {pendingInvitations.map((invitation) => (
                <li
                  key={invitation.id}
                  className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 px-3 py-2 dark:border-gray-700"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-700">
                    <Mail className="h-4 w-4" />
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm text-gray-600 dark:text-gray-300" dir="ltr">
                    {invitation.invitee_email}
                  </p>
                  <button
                    type="button"
                    onClick={() => cancelInvite(invitation.invitee_email)}
                    aria-label={t('share.cancelInvite')}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Invite form */}
        {isOwner && (
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {t('share.inviteLabel')}
            </h3>
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="email"
                dir="ltr"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('share.emailPlaceholder')}
                className={cn(inputClass, 'flex-1')}
              />
              <button
                type="submit"
                disabled={isInviting || !email.trim()}
                aria-label={t('share.send')}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-gray-700"
              >
                {isInviting
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <UserPlus className="h-4 w-4" />}
              </button>
            </form>

            <AnimatePresence>
              {lastInvite && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 space-y-2 rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60"
                >
                  <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    {t('share.linkHint')}
                  </p>
                  <div className="flex gap-2">
                    <p
                      dir="ltr"
                      className="min-w-0 flex-1 truncate rounded-lg bg-white px-2.5 py-2 text-[11px] text-gray-500 dark:bg-gray-900 dark:text-gray-400"
                    >
                      {lastInvite.inviteUrl}
                    </p>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-gray-900 px-3 text-xs font-bold text-white dark:bg-gray-100 dark:text-gray-900"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? t('share.copied') : t('share.copyLink')}
                    </button>
                  </div>

                  {!lastInvite.inviteeIsRegistered && (
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      {t('share.notRegistered')}
                    </p>
                  )}
                  <p className={cn(
                    'text-xs font-medium',
                    lastInvite.emailDelivered
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-gray-400 dark:text-gray-500'
                  )}>
                    {lastInvite.emailDelivered ? t('share.emailSent') : t('share.emailFailed')}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {/* Leave / disband */}
        <section className="border-t border-gray-100 pt-4 dark:border-gray-700">
          {isOwner ? (
            members.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  if (confirming !== 'disband') { setConfirming('disband'); return; }
                  disband();
                  setConfirming(null);
                }}
                className={cn(
                  'flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors',
                  confirming === 'disband'
                    ? 'bg-red-500 text-white'
                    : 'border border-gray-200 text-red-500 dark:border-gray-700'
                )}
              >
                <UserMinus className="h-4 w-4" />
                {confirming === 'disband' ? t('share.disbandConfirm') : t('share.disband')}
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={() => {
                if (confirming !== 'leave') { setConfirming('leave'); return; }
                leaveList();
                setConfirming(null);
                onClose();
              }}
              className={cn(
                'flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors',
                confirming === 'leave'
                  ? 'bg-red-500 text-white'
                  : 'border border-gray-200 text-red-500 dark:border-gray-700'
              )}
            >
              <LogOut className="h-4 w-4" />
              {confirming === 'leave' ? t('share.leaveConfirm') : t('share.leave')}
            </button>
          )}
        </section>
      </div>
    </BottomSheet>
  );
};

export default GroceryShareSheet;
