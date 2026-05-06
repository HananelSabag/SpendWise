/**
 * ShoppingShareSheet — manage sharing for the shopping list
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, Users, Mail, Check, X, Clock,
  Trash2, LogOut, Send, UserCheck,
} from 'lucide-react';
import { cn } from '../../../utils/helpers';
import { useShoppingShare } from '../../../hooks/useShoppingShare';
import { useTranslation } from '../../../stores';
import BottomSheet from '../../common/BottomSheet';

const Avatar = ({ name, size = 'md' }) => {
  const initials = (name || '?').slice(0, 2).toUpperCase();
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm' };
  return (
    <div className={cn(
      'rounded-full bg-gradient-to-br from-blue-500 to-indigo-600',
      'flex items-center justify-center text-white font-bold flex-shrink-0',
      sizes[size]
    )}>
      {initials}
    </div>
  );
};

const SectionLabel = ({ icon: Icon, label, count }) => (
  <div className="flex items-center gap-2 mb-2 mt-4">
    <Icon className="w-3.5 h-3.5 text-gray-400" strokeWidth={2} />
    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</span>
    {count > 0 && (
      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 rounded-full">{count}</span>
    )}
  </div>
);

const ShoppingShareSheet = ({ isOpen, onClose }) => {
  const { t } = useTranslation('shopping');
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
    if (!email.trim()) { setEmailError('נדרש אימייל'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('אימייל לא תקין');
      return;
    }
    setEmailError('');
    const result = await invite(email.trim());
    if (result?.success !== false) {
      setSentMsg(t('share.successMessage'));
      setEmail('');
      setTimeout(() => setSentMsg(''), 5000);
    }
  }, [email, invite, t]);

  const handleRespond = useCallback(async (token, action) => {
    setRespondingToken(token);
    await respond(token, action);
    setRespondingToken(null);
  }, [respond]);

  const displayName = (m) =>
    m.first_name ? `${m.first_name} ${m.last_name || ''}`.trim() : m.username || m.email;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t('share.title')} height="auto">
      <div className="flex flex-col gap-1 pb-8" dir="rtl">

        {/* Invite input */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
          {t('share.description')}
        </p>

        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            placeholder={t('share.emailPlaceholder')}
            dir="ltr"
            className={cn(
              'flex-1 rounded-2xl border bg-white/80 dark:bg-gray-800/80 px-4 py-3 text-sm font-medium',
              'text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400',
              'transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
              'dark:border-gray-700',
              emailError && 'border-red-400 focus:ring-red-400/40'
            )}
          />
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={handleInvite}
            disabled={isInviting}
            className={cn(
              'px-4 h-12 rounded-2xl flex items-center gap-2',
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
        </div>

        <AnimatePresence>
          {emailError && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-xs text-red-500 font-medium mt-1">
              {emailError}
            </motion.p>
          )}
          {sentMsg && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 mt-2 px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" strokeWidth={2.5} />
              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">{sentMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pending received invitations */}
        {pendingInvitations.length > 0 && (
          <>
            <SectionLabel icon={Mail} label="הזמנות שקיבלת" count={pendingInvitations.length} />
            <div className="flex flex-col gap-2">
              {pendingInvitations.map((inv) => {
                const name = inv.inviter_first_name
                  ? `${inv.inviter_first_name} ${inv.inviter_last_name || ''}`.trim()
                  : inv.inviter_username;
                const busy = respondingToken === inv.token && isResponding;
                return (
                  <div key={inv.id} className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-2xl',
                    'bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800'
                  )}>
                    <Avatar name={name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">הזמין אותך לרשימת קניות</p>
                    </div>
                    <div className="flex gap-1.5">
                      <motion.button whileTap={{ scale: 0.9 }} disabled={busy}
                        onClick={() => handleRespond(inv.token, 'accept')}
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-500 text-white shadow-sm disabled:opacity-50">
                        {busy ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} disabled={busy}
                        onClick={() => handleRespond(inv.token, 'decline')}
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                        <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </motion.button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* People sharing my list */}
        {myMembers.length > 0 && (
          <>
            <SectionLabel icon={Users} label={t('share.membersLabel')} count={myMembers.length} />
            <div className="flex flex-col gap-2">
              {myMembers.map((m) => (
                <div key={m.member_id ?? m.id} className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-2xl',
                  'bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60',
                  'shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                )}>
                  <Avatar name={displayName(m)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{displayName(m)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.email}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 mr-1">
                    חבר
                  </span>
                  <motion.button whileTap={{ scale: 0.9 }}
                    onClick={() => removeMember(m.member_id ?? m.id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </motion.button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Lists shared with me */}
        {sharedWithMe.length > 0 && (
          <>
            <SectionLabel icon={UserCheck} label="רשימות שמשותפות איתי" count={sharedWithMe.length} />
            <div className="flex flex-col gap-2">
              {sharedWithMe.map((m) => (
                <div key={m.owner_id ?? m.id} className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-2xl',
                  'bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60',
                  'shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                )}>
                  <Avatar name={displayName(m)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{displayName(m)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.email}</p>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 mr-1">
                    {t('share.ownerBadge')}
                  </span>
                  <motion.button whileTap={{ scale: 0.9 }}
                    onClick={() => removeMember(m.owner_id ?? m.id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title={t('share.leave')}>
                    <LogOut className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </motion.button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pending invitations I sent */}
        {pendingSent.length > 0 && (
          <>
            <SectionLabel icon={Clock} label={t('share.pendingLabel')} count={pendingSent.length} />
            <div className="flex flex-col gap-2">
              {pendingSent.map((inv) => (
                <div key={inv.token} className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-2xl',
                  'bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/60'
                )}>
                  <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-gray-400" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate dir-ltr">{inv.invitee_email}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">ממתין לאישור</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }}
                    onClick={() => cancelInvite(inv.invitee_email)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </motion.button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {myMembers.length === 0 && sharedWithMe.length === 0 && pendingSent.length === 0 && pendingInvitations.length === 0 && (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-blue-400" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">עדיין לא שיתפת את הרשימה</p>
          </div>
        )}

      </div>
    </BottomSheet>
  );
};

export default ShoppingShareSheet;
