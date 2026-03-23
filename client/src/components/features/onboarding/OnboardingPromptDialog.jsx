/**
 * 🚀 ONBOARDING PROMPT DIALOG — "Start setup?" invitation
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Clock, Target, Shield, TrendingUp, Zap, CheckCircle } from 'lucide-react';

import { useTranslation, useAuth, useNotifications } from '../../../stores';
import { Modal, Button } from '../../ui';
import { cn } from '../../../utils/helpers';

const OnboardingPromptDialog = ({
  isOpen,
  onStart,
  onDismiss,
  onSkip,
  type = 'welcome'
}) => {
  const { t, isRTL }        = useTranslation('onboarding');
  const { user }             = useAuth();
  const { addNotification }  = useNotifications();

  const [currentBenefit, setCurrentBenefit] = useState(0);
  const [isAnimating, setIsAnimating]        = useState(false);

  const benefits = [
    { icon: Target,    title: t('prompt.benefits.organization.title'), description: t('prompt.benefits.organization.description'), color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { icon: TrendingUp, title: t('prompt.benefits.insights.title'),    description: t('prompt.benefits.insights.description'),    color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { icon: Shield,    title: t('prompt.benefits.security.title'),     description: t('prompt.benefits.security.description'),    color: 'text-purple-600',  bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { icon: Zap,       title: t('prompt.benefits.automation.title'),   description: t('prompt.benefits.automation.description'),  color: 'text-orange-600',  bg: 'bg-orange-50 dark:bg-orange-900/20' },
  ];

  // Auto-cycle benefits for welcome type
  useEffect(() => {
    if (type !== 'welcome' || !isOpen) return;
    const id = setInterval(() => setCurrentBenefit(p => (p + 1) % benefits.length), 3000);
    return () => clearInterval(id);
  }, [type, isOpen, benefits.length]);

  const getContent = () => {
    switch (type) {
      case 'reminder': return {
        title: t('prompt.reminder.title'),
        subtitle: t('prompt.reminder.subtitle'),
        gradient: 'from-orange-500 to-red-600',
        cta: t('prompt.reminder.cta'),
        benefits: benefits.slice(0, 2)
      };
      case 'complete': return {
        title: t('prompt.complete.title'),
        subtitle: t('prompt.complete.subtitle'),
        gradient: 'from-emerald-500 to-blue-600',
        cta: t('prompt.complete.cta'),
        benefits: []
      };
      default: return {
        title: t('prompt.welcome.title', { name: user?.username || '' }),
        subtitle: t('prompt.welcome.subtitle'),
        gradient: 'from-blue-500 to-purple-600',
        cta: t('prompt.welcome.cta'),
        benefits
      };
    }
  };

  const content = getContent();

  const handleStart = useCallback(async () => {
    setIsAnimating(true);
    try {
      await onStart?.();
    } catch (error) {
      addNotification({ type: 'error', message: t('prompt.startFailed'), duration: 5000 });
    } finally {
      setIsAnimating(false);
    }
  }, [onStart, addNotification, t]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onDismiss?.('close_button')}
      title={t('prompt.title', 'Get Started')}
      sheet
      drawerWidth={480}
    >
      <div style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
        {/* Gradient banner */}
        <div className={cn('px-5 py-6 text-white text-center bg-gradient-to-br', content.gradient)}>
          <div className="w-14 h-14 mx-auto mb-3 bg-white/20 rounded-2xl flex items-center justify-center">
            {type === 'complete'
              ? <CheckCircle className="w-7 h-7 text-white" />
              : <Sparkles className="w-7 h-7 text-white" />}
          </div>
          <h2 className="text-xl font-bold mb-1">{content.title}</h2>
          <p className="text-sm text-white/85">{content.subtitle}</p>
        </div>

        <div className="p-5 space-y-4">
          {/* Benefits */}
          {content.benefits.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t('prompt.benefitsTitle', 'What you\'ll get')}
              </p>
              <div className="relative min-h-[80px]">
                <AnimatePresence mode="wait">
                  {content.benefits.map((b, i) => {
                    if (type === 'welcome' && i !== currentBenefit) return null;
                    const Icon = b.icon;
                    return (
                      <motion.div
                        key={b.title}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-xl border-2',
                          type === 'welcome'
                            ? 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'
                        )}
                      >
                        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', b.bg)}>
                          <Icon className={cn('w-4.5 h-4.5', b.color)} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{b.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{b.description}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
              {/* Dot indicator */}
              {type === 'welcome' && (
                <div className="flex justify-center gap-1.5">
                  {benefits.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentBenefit(i)}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        i === currentBenefit ? 'w-5 bg-blue-500' : 'w-1.5 bg-gray-300 dark:bg-gray-600'
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Time estimate */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <Clock className="w-3.5 h-3.5" />
            {type === 'reminder'
              ? t('prompt.timeEstimate.quick', 'Takes about 1 minute')
              : t('prompt.timeEstimate.full', 'Takes about 2–3 minutes')}
          </div>

          {/* CTA */}
          <Button
            variant="primary"
            onClick={handleStart}
            disabled={isAnimating}
            className={cn(
              'w-full h-11 text-sm font-semibold bg-gradient-to-r',
              content.gradient.replace('from-', 'from-').replace('to-', 'to-')
            )}
          >
            {isAnimating ? t('prompt.starting', 'Starting...') : (
              <>
                {content.cta}
                <ArrowRight className={cn('w-4 h-4', isRTL ? 'mr-2' : 'ml-2')} />
              </>
            )}
          </Button>

          <div className="flex gap-2">
            {onSkip && (
              <Button variant="ghost" onClick={() => { onSkip(); onDismiss?.('skipped'); }} className="flex-1 h-9 text-sm">
                {t('prompt.skipForNow', 'Skip for now')}
              </Button>
            )}
            <Button variant="outline" onClick={() => onDismiss?.('maybe_later')} className="flex-1 h-9 text-sm">
              {t('prompt.maybeLater', 'Maybe later')}
            </Button>
          </div>

          <p className="text-xs text-center text-gray-400 dark:text-gray-500">
            {t('prompt.skipNotice', 'You can always set up later from your profile')}
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default OnboardingPromptDialog;
