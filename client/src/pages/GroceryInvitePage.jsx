/**
 * GroceryInvitePage — /grocery/invite/:token
 *
 * A preview, never an action. Opening this URL joins nothing: it shows who
 * invited you and what you'd be joining, and the only way in is pressing Accept.
 * That's deliberate — a link in an email or a chat gets opened by previews,
 * scanners and curious taps, and none of those should change membership.
 */

import React, { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Check, Loader2, ShoppingCart, Users, X } from 'lucide-react';
import { api } from '../api';
import { cn } from '../utils/helpers';
import { useTranslation } from '../stores';
import { useToast } from '../hooks/useToast';
import { useGrocerySharing } from '../hooks/useGrocerySharing';

const Shell = ({ children, isRTL }) => (
  <div
    dir={isRTL ? 'rtl' : 'ltr'}
    className="flex min-h-[80vh] items-center justify-center bg-gray-50 px-4 py-10 dark:bg-gray-900"
  >
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      {children}
    </motion.div>
  </div>
);

const GroceryInvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t, isRTL } = useTranslation('grocery');
  const toast = useToast();
  const { respond } = useGrocerySharing();
  const [busy, setBusy] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['grocery', 'invite-preview', token],
    enabled: !!token,
    queryFn: async () => {
      const result = await api.grocery.previewInvitation(token);
      if (!result.success) throw new Error(result.error?.code || 'GROCERY_INVITE_NOT_FOUND');
      return result.data;
    },
    retry: false,
  });

  const handleAccept = useCallback(async () => {
    setBusy('accept');
    const result = await respond(token, 'accept');
    setBusy(null);
    if (result) {
      toast.success(t('invite.accepted'));
      navigate('/grocery', { replace: true });
    } else {
      refetch();
    }
  }, [respond, token, toast, t, navigate, refetch]);

  const handleDecline = useCallback(async () => {
    setBusy('decline');
    const result = await respond(token, 'decline');
    setBusy(null);
    if (result) {
      toast.success(t('invite.declined'));
      navigate('/grocery', { replace: true });
    }
  }, [respond, token, toast, t, navigate]);

  if (isLoading) {
    return (
      <Shell isRTL={isRTL}>
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
        </div>
      </Shell>
    );
  }

  if (isError || !data) {
    return (
      <Shell isRTL={isRTL}>
        <div className="text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" strokeWidth={1.5} />
          <p className="mb-5 text-sm text-gray-600 dark:text-gray-300">{t('invite.notFound')}</p>
          <button
            type="button"
            onClick={() => navigate('/grocery', { replace: true })}
            className="h-11 w-full rounded-xl bg-blue-600 text-sm font-bold text-white"
          >
            {t('invite.goToList')}
          </button>
        </div>
      </Shell>
    );
  }

  const inviterName = data.inviter.firstName || data.inviter.username;

  // Order matters: expiry and "already in" are true statements about a link
  // that is otherwise fine, whereas "sent to someone else" only applies to an
  // addressed invitation. An open link is addressed to whoever opened it.
  const blockedReason = data.alreadyMember
    ? t('invite.alreadyMember')
    : data.expired
      ? t('invite.expired')
      : !data.addressedToMe
        ? t('invite.notForYou')
        : data.status !== 'pending'
          ? t('invite.notFound')
          : null;

  return (
    <Shell isRTL={isRTL}>
      <div className="text-center">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
          <ShoppingCart className="h-8 w-8" strokeWidth={1.5} />
        </span>

        <h1 className="mb-1 text-lg font-extrabold text-gray-900 dark:text-gray-50">
          {t('invite.title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('invite.invitedBy', { name: inviterName })}
        </p>
        {data.isOpenLink && (
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {t('invite.viaLink')}
          </p>
        )}

        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          <Users className="h-3.5 w-3.5" />
          {t('invite.listLine', { count: data.memberCount })}
        </div>

        {blockedReason ? (
          <div className="mt-6 space-y-3">
            <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              {blockedReason}
            </p>
            <button
              type="button"
              onClick={() => navigate('/grocery', { replace: true })}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white"
            >
              <ArrowLeft className={cn('h-4 w-4', isRTL && 'rotate-180')} />
              {t('invite.goToList')}
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-2">
            <button
              type="button"
              onClick={handleAccept}
              disabled={!!busy}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {busy === 'accept'
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Check className="h-4 w-4" />}
              {busy === 'accept' ? t('invite.accepting') : t('invite.accept')}
            </button>
            <button
              type="button"
              onClick={handleDecline}
              disabled={!!busy}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300"
            >
              <X className="h-4 w-4" />
              {t('invite.decline')}
            </button>
          </div>
        )}
      </div>
    </Shell>
  );
};

export default GroceryInvitePage;
