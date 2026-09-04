/**
 * GroceryShareSheet — who is on the list, and how someone else gets on it.
 *
 * Sharing is a link. One tap copies it, you paste it wherever you already talk
 * to the person, and they get an Accept screen. There is no email field and no
 * multi-step flow: the earlier version made you type an address and then leaned
 * on a mail provider that isn't configured, which turned a two-second job into
 * a dead end.
 *
 * The link is recipient-less by design — treat it as the secret. It expires, and
 * "Revoke" invalidates it for anyone still holding it.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Link2, Loader2, LogOut, RotateCcw, UserMinus } from 'lucide-react';
import BottomSheet from '../../common/BottomSheet';
import { cn } from '../../../utils/helpers';
import { useTranslation } from '../../../stores';
import { useToast } from '../../../hooks/useToast';
import { api } from '../../../api';
import { useGrocerySharing, useMyGroceryInvitations } from '../../../hooks/useGrocerySharing';

const displayNameOf = (member) =>
  [member.first_name, member.last_name].filter(Boolean).join(' ') || member.username;

const MemberAvatar = ({ member }) => (
  member.avatar
    ? <img src={member.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
    : (
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
        {(member.first_name || member.username || '?').charAt(0).toUpperCase()}
      </span>
    )
);

const GroceryShareSheet = ({ isOpen, onClose, members, role, currentUserId }) => {
  const { t } = useTranslation('grocery');
  const toast = useToast();
  const { removeMember, leaveList, disband, respond } = useGrocerySharing();
  const { invitations: myInvitations } = useMyGroceryInvitations();

  const [link, setLink] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(null);

  const isOwner = role === 'owner';

  // Show an existing link straight away, so "Copy" is one tap on the second visit.
  useEffect(() => {
    if (!isOpen || !isOwner) return;
    let cancelled = false;
    api.grocery.getShareLink().then((result) => {
      if (!cancelled && result.success) setLink(result.data?.inviteUrl || null);
    });
    return () => { cancelled = true; };
  }, [isOpen, isOwner]);

  useEffect(() => {
    if (!isOpen) { setCopied(false); setConfirming(null); }
  }, [isOpen]);

  const copy = useCallback(async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t('share.copied'));
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard access can be blocked; the URL is on screen and selectable.
      toast.error(t('share.copyFailed'));
    }
  }, [t, toast]);

  /** One button: make the link if there isn't one, then copy it. */
  const handleShare = useCallback(async () => {
    if (link) { await copy(link); return; }

    setBusy(true);
    const result = await api.grocery.createShareLink();
    setBusy(false);

    if (!result.success) {
      toast.error(t(`errors.${result.error?.code}`, { fallback: t('errors.generic') }));
      return;
    }
    setLink(result.data.inviteUrl);
    await copy(result.data.inviteUrl);
  }, [link, copy, t, toast]);

  const handleRevoke = useCallback(async () => {
    setBusy(true);
    const result = await api.grocery.revokeShareLink();
    setBusy(false);
    if (result.success) {
      setLink(null);
      setConfirming(null);
      toast.success(t('share.linkRevoked'));
    }
  }, [t, toast]);

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

        {/* The share link — the whole invitation flow, in one button */}
        {isOwner && (
          <section>
            <button
              type="button"
              onClick={handleShare}
              disabled={busy}
              className={cn(
                'flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-colors',
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700',
                busy && 'opacity-70'
              )}
            >
              {busy
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              {copied ? t('share.copied') : t('share.copyLink')}
            </button>

            <p className="mt-2 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
              {t('share.linkHint')}
            </p>

            <AnimatePresence>
              {link && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-2 flex items-center gap-2"
                >
                  <p
                    dir="ltr"
                    className="min-w-0 flex-1 truncate rounded-lg bg-gray-100 px-2.5 py-2 text-[11px] text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                  >
                    {link}
                  </p>
                  <button
                    type="button"
                    onClick={() => copy(link)}
                    aria-label={t('share.copyLink')}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirming !== 'revoke') { setConfirming('revoke'); return; }
                      handleRevoke();
                    }}
                    aria-label={t('share.revokeLink')}
                    className={cn(
                      'flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors',
                      confirming === 'revoke'
                        ? 'bg-red-500 text-white'
                        : 'border border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400'
                    )}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {confirming === 'revoke' && t('share.revokeLink')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
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
