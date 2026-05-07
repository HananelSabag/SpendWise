/**
 * ShoppingShareSheet — manage list sharing
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, Users, Mail, Check, X, Clock,
  Trash2, LogOut, Send, UserCheck, Crown,
} from 'lucide-react';
import { cn } from '../../../utils/helpers';
import { useShoppingShare } from '../../../hooks/useShoppingShare';
import { useTranslation } from '../../../stores';
import BottomSheet from '../../common/BottomSheet';

const AVATAR_COLORS = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-emerald-500 to-emerald-600',
  'from-orange-500 to-orange-600',
  'from-pink-500 to-pink-600',
];

const Avatar = ({ name, size = 'md', colorIdx = 0 }) => {
  const initial = (name || '?')[0].toUpperCase();
  const sizeMap = { sm: 'w-9 h-9 text-sm', md: 'w-11 h-11 text-base', lg: 'w-14 h-14 text-lg' };
  return (
    <div className={cn(
      'rounded-2xl flex items-center justify-center text-white font-extrabold flex-shrink-0',
      `bg-gradient-to-br ${AVATAR_COLORS[colorIdx % AVATAR_COLORS.length]}`,
      'shadow-md',
      sizeMap[size]
    )}>
      {initial}
    </div>
  );
};

const SectionHeader = ({ icon: Icon, label, count, color = 'text-gray-500' }) => (
  <div className="flex items-center gap-2 px-1 mt-6 mb-3">
    <div className={cn('w-5 h-5 flex items-center justify-center', color)}>
      <Icon className="w-4 h-4" strokeWidth={2} />
    </div>
    <span className={cn('text-xs font-bold uppercase tracking-wider', color)}>{label}</span>
    {count > 0 && (
      <span className="ml-1 text-xs font-extrabold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
        {count}
      </span>
    )}
  </div>
);

const ShoppingShareSheet = ({ isOpen, onClose }) => {
  const { t, isRTL } = useTranslation('shopping');
  const {
    myMembers, sharedWithMe, pendingSent, pendingInvitations,
    invite, respond, removeMember, cancelInvite,
    isInviting, isResponding,
  } = useShoppingShare();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [sentMsg, setSentMsg] = useState('');
  const [respondingToken, setRespondingToken] = useState(null);

  const handleInvite = useCallback(async () => {
    if (!email.trim()) { setEmailError(isRTL ? 'נדרש אימייל' : 'Email required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError(isRTL ? 'אימייל לא תקין' : 'Invalid email');
      return;
    }
    setEmailError('');
    await invite(email.trim());
    setSentMsg(t('share.successMessage'));
    setEmail('');
    setTimeout(() => setSentMsg(''), 4000);
  }, [email, invite, t, isRTL]);

  const handleRespond = useCallback(async (token, action) => {
    setRespondingToken(token);
    await respond(token, action);
    setRespondingToken(null);
  }, [respond]);

  const displayName = (m) =>
    m.first_name ? `${m.first_name} ${m.last_name || ''}`.trim() : m.username || m.email;

  const isEmpty = myMembers.length === 0 && sharedWithMe.length === 0
    && pendingSent.length === 0 && pendingInvitations.length === 0;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t('share.title')} height="full">
      <div className="flex flex-col pb-8 gap-0">

        {/* ── Invite section ── */}
        <div className={cn(
          'rounded-2xl p-4 mb-2',
          'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
          'border border-blue-100 dark:border-blue-800/40'
        )}>
          <p className={cn('text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 leading-relaxed', isRTL ? 'text-right' : 'text-left')}>
            {t('share.description')}
          </p>

          {/* Email input */}
          <div className="relative mb-2">
            <Mail className={cn(
              'absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none',
              isRTL ? 'right-4' : 'left-4'
            )} strokeWidth={2} />
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              placeholder={t('share.emailPlaceholder')}
              dir="ltr"
              className={cn(
                'w-full rounded-xl border bg-white dark:bg-gray-800 py-3.5 text-sm font-medium',
                'text-gray-800 dark:text-gray-100 placeholder:text-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400',
                'transition-all duration-200 dark:border-gray-700',
                isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4',
                emailError && 'border-red-400 focus:ring-red-400/40'
              )}
            />
          </div>

          <AnimatePresence>
            {emailError && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={cn('text-xs text-red-500 font-medium mb-2', isRTL ? 'text-right' : 'text-left')}>
                {emailError}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Send button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleInvite}
            disabled={isInviting}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl',
              'bg-gradient-to-l from-blue-600 to-indigo-600 text-white font-bold text-sm',
              'shadow-md shadow-blue-500/25 transition-opacity',
              isInviting && 'opacity-60 cursor-not-allowed'
            )}
          >
            {isInviting
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Send className="w-4 h-4" strokeWidth={2.5} />
            }
            {t('share.send')}
          </motion.button>

          <AnimatePresence>
            {sentMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={cn(
                  'flex items-center gap-2 mt-3 px-3 py-2.5 rounded-xl',
                  'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800',
                  isRTL ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" strokeWidth={2.5} />
                <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">{sentMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Pending received invitations ── */}
        {pendingInvitations.length > 0 && (
          <>
            <SectionHeader icon={Mail} label={isRTL ? 'הזמנות שקיבלת' : 'Invitations Received'} count={pendingInvitations.length} color="text-blue-500" />
            <div className="flex flex-col gap-3">
              {pendingInvitations.map((inv, idx) => {
                const name = inv.inviter_first_name
                  ? `${inv.inviter_first_name} ${inv.inviter_last_name || ''}`.trim()
                  : inv.inviter_username;
                const busy = respondingToken === inv.token && isResponding;
                return (
                  <motion.div key={inv.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'flex items-center gap-4 px-4 py-4 rounded-2xl',
                      'bg-blue-50/80 dark:bg-blue-900/15 border border-blue-200/60 dark:border-blue-800/40'
                    )}
                  >
                    <Avatar name={name} size="md" colorIdx={idx} />
                    <div className={cn('flex-1 min-w-0', isRTL ? 'text-right' : 'text-left')}>
                      <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {isRTL ? 'הזמין אותך לרשימת קניות' : 'Invited you to a shopping list'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <motion.button whileTap={{ scale: 0.9 }} disabled={busy}
                        onClick={() => handleRespond(inv.token, 'accept')}
                        className="h-9 px-3 rounded-xl flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-bold shadow-sm disabled:opacity-50">
                        {busy ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
                        {isRTL ? 'אישור' : 'Accept'}
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} disabled={busy}
                        onClick={() => handleRespond(inv.token, 'decline')}
                        className="h-9 px-3 rounded-xl flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold">
                        <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                        {isRTL ? 'דחייה' : 'Decline'}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* ── People I share my list with ── */}
        {myMembers.length > 0 && (
          <>
            <SectionHeader icon={Users} label={t('share.membersLabel')} count={myMembers.length} color="text-purple-500" />
            <div className="flex flex-col gap-3">
              {myMembers.map((m, idx) => (
                <motion.div key={m.member_id ?? m.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex items-center gap-4 px-4 py-4 rounded-2xl',
                    'bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60',
                    'shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
                  )}
                >
                  <Avatar name={displayName(m)} size="md" colorIdx={idx + 1} />
                  <div className={cn('flex-1 min-w-0', isRTL ? 'text-right' : 'text-left')}>
                    <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{displayName(m)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{m.email}</p>
                  </div>
                  <span className={cn(
                    'text-[11px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0',
                    'text-emerald-600 bg-emerald-50 border-emerald-200',
                    'dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800'
                  )}>
                    {isRTL ? 'חבר' : 'Member'}
                  </span>
                  <motion.button whileTap={{ scale: 0.9 }}
                    onClick={() => removeMember(m.member_id ?? m.id)}
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center',
                      'bg-gray-50 dark:bg-gray-700 text-gray-400',
                      'hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
                    )}>
                    <Trash2 className="w-4 h-4" strokeWidth={2} />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* ── Lists shared with me ── */}
        {sharedWithMe.length > 0 && (
          <>
            <SectionHeader icon={UserCheck} label={isRTL ? 'רשימות שמשותפות איתי' : 'Shared With Me'} count={sharedWithMe.length} color="text-emerald-500" />
            <div className="flex flex-col gap-3">
              {sharedWithMe.map((m, idx) => (
                <motion.div key={m.owner_id ?? m.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex items-center gap-4 px-4 py-4 rounded-2xl',
                    'bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60',
                    'shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
                  )}
                >
                  <Avatar name={displayName(m)} size="md" colorIdx={idx + 2} />
                  <div className={cn('flex-1 min-w-0', isRTL ? 'text-right' : 'text-left')}>
                    <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{displayName(m)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{m.email}</p>
                  </div>
                  <div className={cn('flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1 rounded-full border',
                    'text-blue-600 bg-blue-50 border-blue-200',
                    'dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800')}>
                    <Crown className="w-3 h-3" strokeWidth={2} />
                    <span className="text-[11px] font-bold">{t('share.ownerBadge')}</span>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }}
                    onClick={() => removeMember(m.owner_id ?? m.id)}
                    title={t('share.leave')}
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center',
                      'bg-gray-50 dark:bg-gray-700 text-gray-400',
                      'hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
                    )}>
                    <LogOut className="w-4 h-4" strokeWidth={2} />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* ── Pending sent invitations ── */}
        {pendingSent.length > 0 && (
          <>
            <SectionHeader icon={Clock} label={t('share.pendingLabel')} count={pendingSent.length} color="text-orange-400" />
            <div className="flex flex-col gap-3">
              {pendingSent.map((inv) => (
                <motion.div key={inv.token}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex items-center gap-4 px-4 py-4 rounded-2xl',
                    'bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/60'
                  )}
                >
                  <div className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
                  </div>
                  <div className={cn('flex-1 min-w-0', isRTL ? 'text-right' : 'text-left')}>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate" dir="ltr">{inv.invitee_email}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {isRTL ? 'ממתין לאישור' : 'Awaiting response'}
                    </p>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }}
                    onClick={() => cancelInvite(inv.invitee_email)}
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center',
                      'bg-gray-100 dark:bg-gray-700 text-gray-400',
                      'hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
                    )}>
                    <X className="w-4 h-4" strokeWidth={2.5} />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* ── Empty state ── */}
        {isEmpty && (
          <div className="flex flex-col items-center py-12 text-center">
            <div className={cn(
              'w-20 h-20 rounded-3xl flex items-center justify-center mb-5',
              'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30',
              'shadow-[0_8px_24px_rgba(99,102,241,0.12)]'
            )}>
              <Users className="w-10 h-10 text-blue-400" strokeWidth={1.5} />
            </div>
            <p className="text-base font-bold text-gray-700 dark:text-gray-300 mb-1">
              {isRTL ? 'עדיין לא שיתפת את הרשימה' : "You haven't shared the list yet"}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
              {isRTL ? 'הזמן חברים להצטרף ולשתף ברשימה שלך' : 'Invite friends to join and share your list'}
            </p>
          </div>
        )}

      </div>
    </BottomSheet>
  );
};

export default ShoppingShareSheet;
