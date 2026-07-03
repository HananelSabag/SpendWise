/**
 * ConnectBankModal — Bank Connect wizard
 *
 * 3 steps: pick bank → credentials → consent & confirm.
 *
 * Security: credentials are encrypted IN THE BROWSER (sealedBox util) with
 * the scraper agent's public key before they leave this device. They are
 * never kept in localStorage, never sent in plaintext, and all form state
 * is wiped when the modal closes.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Building2, ShieldCheck, ChevronRight, ChevronLeft, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';

import { Modal } from '../../ui';
import { useTranslation } from '../../../stores';
import { useToast } from '../../../hooks/useToast';
import { cn } from '../../../utils/helpers';
import { sealCredentials } from '../../../utils/sealedBox';
import bankConnectionsApi from '../../../api/bankConnections';
import { bankBrand } from './bankSyncMeta';

// Per-bank credential field definitions. `key` must match what
// israeli-bank-scrapers expects (see spendwise-agent src/core/banks.js BANKS).
export const BANK_FORMS = {
  yahav: {
    color: 'from-blue-600 to-blue-800',
    fields: [
      { key: 'username',   labelKey: 'fieldUsername',   type: 'text' },
      { key: 'password',   labelKey: 'fieldPassword',   type: 'password' },
      { key: 'nationalID', labelKey: 'fieldNationalID', type: 'text', inputMode: 'numeric' },
    ],
  },
  leumi: {
    color: 'from-indigo-600 to-indigo-900',
    fields: [
      { key: 'username', labelKey: 'fieldUsername', type: 'text' },
      { key: 'password', labelKey: 'fieldPassword', type: 'password' },
    ],
  },
  isracard: {
    color: 'from-purple-600 to-purple-800',
    fields: [
      { key: 'id',          labelKey: 'fieldId',       type: 'text', inputMode: 'numeric' },
      { key: 'card6Digits', labelKey: 'fieldCard6',    type: 'text', inputMode: 'numeric', maxLength: 6 },
      { key: 'password',    labelKey: 'fieldPassword', type: 'password' },
    ],
  },
  max: {
    color: 'from-teal-600 to-teal-800',
    fields: [
      { key: 'username', labelKey: 'fieldUsername', type: 'text' },
      { key: 'password', labelKey: 'fieldPassword', type: 'password' },
    ],
  },
  discount: {
    color: 'from-emerald-600 to-emerald-800',
    fields: [
      { key: 'id',       labelKey: 'fieldId',       type: 'text', inputMode: 'numeric' },
      { key: 'password', labelKey: 'fieldPassword', type: 'password' },
      { key: 'num',      labelKey: 'fieldNum',      type: 'text' },
    ],
  },
};

const STEPS = ['pick', 'credentials', 'confirm'];

const ConnectBankModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation('bankSync');
  const toast = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [bank, setBank] = useState(null);
  const [creds, setCreds] = useState({});
  const [displayName, setDisplayName] = useState('');
  const [consent, setConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  // Wipe ALL state whenever the modal closes — credentials must not
  // survive in memory longer than the wizard session.
  useEffect(() => {
    if (!isOpen) {
      setStep(0); setBank(null); setCreds({}); setDisplayName('');
      setConsent(false); setShowPassword(false); setSubmitting(false); setSucceeded(false);
    }
  }, [isOpen]);

  const fields = bank ? BANK_FORMS[bank].fields : [];
  const credsComplete = fields.every((f) => (creds[f.key] || '').trim().length > 0);

  const handleSubmit = useCallback(async () => {
    if (!bank || !credsComplete || !consent || submitting) return;
    setSubmitting(true);
    try {
      const publicKey = await bankConnectionsApi.getPublicKey();
      const envelope = sealCredentials(creds, publicKey);
      await bankConnectionsApi.create(bank, envelope, displayName.trim() || undefined);

      setCreds({}); // drop plaintext from state immediately
      setSucceeded(true);
      queryClient.invalidateQueries({ queryKey: ['bankConnections'] });
      onSuccess?.();
    } catch (err) {
      toast.error(err?.message || t('loadError'));
    } finally {
      setSubmitting(false);
    }
  }, [bank, creds, credsComplete, consent, submitting, displayName, queryClient, onSuccess, toast, t]);

  const stepTitle = succeeded
    ? t('connected')
    : [t('stepPickBank'), t('stepCredentials'), t('stepConfirm')][step];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('connectBank')} sheet drawerWidth={480}>
      <div className="p-4 space-y-5">

        {/* Progress dots */}
        {!succeeded && (
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === step ? 'w-8 bg-primary-500' : i < step ? 'w-4 bg-primary-300' : 'w-4 bg-gray-200 dark:bg-gray-700',
                )}
              />
            ))}
          </div>
        )}

        <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white">{stepTitle}</h3>

        <AnimatePresence mode="wait">

          {/* ── Success ─────────────────────────────────────────────── */}
          {succeeded && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 py-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{t('connectedNote')}</p>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-colors"
              >
                {t('done')}
              </button>
            </motion.div>
          )}

          {/* ── Step 1: pick bank ───────────────────────────────────── */}
          {!succeeded && step === 0 && (
            <motion.div key="pick" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="grid grid-cols-2 gap-3">
              {Object.keys(BANK_FORMS).map((source) => (
                <button
                  key={source}
                  onClick={() => { setBank(source); setCreds({}); setStep(1); }}
                  className={cn(
                    'rounded-xl p-4 text-white text-start bg-gradient-to-br shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]',
                    bankBrand(source).gradient,
                    bank === source && 'ring-2 ring-offset-2 ring-indigo-500',
                  )}
                >
                  <Building2 className="w-6 h-6 mb-2 opacity-90" />
                  <p className="font-bold text-sm">{t(`bankNames.${source}`)}</p>
                </button>
              ))}
            </motion.div>
          )}

          {/* ── Step 2: credentials ─────────────────────────────────── */}
          {!succeeded && step === 1 && bank && (
            <motion.div key="creds" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-3">
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    {t(f.labelKey)}
                  </label>
                  <div className="relative">
                    <input
                      type={f.type === 'password' && !showPassword ? 'password' : 'text'}
                      inputMode={f.inputMode}
                      maxLength={f.maxLength}
                      value={creds[f.key] || ''}
                      onChange={(e) => setCreds((c) => ({ ...c, [f.key]: e.target.value }))}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                    {f.type === 'password' && (
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 end-3 flex items-center text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                  {t('displayNameLabel')}
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t('displayNamePlaceholder')}
                  maxLength={100}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </motion.div>
          )}

          {/* ── Step 3: security explainer + consent ────────────────── */}
          {!succeeded && step === 2 && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-4">
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                  <ShieldCheck className="w-5 h-5" />
                  {t('securityTitle')}
                </div>
                {['securityPoint1', 'securityPoint2', 'securityPoint3', 'securityPoint4'].map((k) => (
                  <div key={k} className="flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-200">
                    <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{t(k)}</span>
                  </div>
                ))}
              </div>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-xs text-gray-600 dark:text-gray-300">{t('consentLabel')}</span>
              </label>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Navigation ──────────────────────────────────────────────── */}
        {!succeeded && step > 0 && (
          <div className="flex gap-3">
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={submitting}
              className="flex items-center justify-center gap-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              {t('back')}
            </button>

            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                disabled={!credsComplete}
                className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
              >
                {t('next')}
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleSubmit}
                disabled={!consent || submitting}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? t('connecting') : t('connect')}
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ConnectBankModal;
