/**
 * MODERN ONBOARDING MODAL - Responsive Layout
 * Mobile: bottom sheet (88dvh, drag-to-dismiss)
 * Desktop: side drawer (slides from right, ESC to close)
 * @version 6.0.0 - POLISHED DRAWER + BOTTOM SHEET
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

import { useModernOnboardingState } from '../../../hooks/useModernOnboardingState';
import { useOnboardingNavigation } from '../../../hooks/useOnboardingNavigation';
import { useOnboardingCompletion } from '../../../hooks/useOnboardingCompletion';
import { useIsMobile } from '../../../hooks/useIsMobile';

import ModernOnboardingHeader from './components/ModernOnboardingHeader';
import ModernOnboardingFooter from './components/ModernOnboardingFooter';

import { useTranslation } from '../../../stores';
import { cn } from '../../../utils/helpers';

const ModernOnboardingModal = ({
  isOpen = false,
  onClose,
  onComplete,
  onSkip,
  forceShow = false,
  previewOnly = false,
  className = ''
}) => {
  const { t, isRTL } = useTranslation('onboarding');
  const isMobile = useIsMobile();
  const dragControls = useDragControls();

  const onboardingState = useModernOnboardingState({
    enableValidation: true,
    persistData: true
  });

  const {
    currentStep,
    stepData,
    steps,
    currentStepConfig,
    progress,
    setIsCompleting,
    isCompleting,
    isCompleted,
    setIsCompleted,
    getStepData,
    updateStepData,
    validateStep
  } = onboardingState;

  const {
    canGoNext,
    canGoPrevious,
    isLastStep,
    goNext,
    goBack,
  } = useOnboardingNavigation(onboardingState, {
    onComplete,
    onSkip
  });

  const { completeOnboarding } = useOnboardingCompletion(stepData, {
    onSuccess: onComplete,
    onError: (error) => {
      console.error('Modern onboarding completion failed:', error);
    }
  });

  // ESC key + body scroll lock
  React.useEffect(() => {
    if (!isOpen && !forceShow) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !isCompleting) onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, forceShow, isCompleting, onClose]);

  const handleComplete = async () => {
    try {
      if (previewOnly) {
        onComplete?.();
        onClose?.();
        return;
      }
      setIsCompleting(true);
      const result = await completeOnboarding();
      if (result) {
        setIsCompleted(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        onComplete?.();
        onClose?.();
      }
    } catch (error) {
      console.error('ModernOnboardingModal - Completion failed:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleFinishNow = async () => {
    const validation = validateStep(currentStepConfig.id, stepData[currentStepConfig.id]);
    if (!validation.isValid) return;
    await handleComplete();
  };

  const isCurrentStepValid = React.useMemo(() => {
    const validation = validateStep(currentStepConfig.id, stepData[currentStepConfig.id]);
    return validation.isValid;
  }, [validateStep, currentStepConfig.id, stepData]);

  if (!isOpen && !forceShow) return null;

  // Shared inner layout: header → scrollable content → footer
  const innerContent = (
    <>
      {/* Header: step indicator, progress bar, X button (desktop) */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <ModernOnboardingHeader
          currentStep={currentStep}
          totalSteps={steps.length}
          progress={progress.percentage}
          title={currentStepConfig?.title || t('title') || 'Welcome to SpendWise'}
          canClose={!isCompleting}
          onClose={onClose}
          isRTL={isRTL}
          isMobile={isMobile}
        />
      </div>

      {/* Scrollable step content */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="w-full"
          >
            {(() => {
              const StepComponent = currentStepConfig?.component;
              if (!StepComponent) return null;
              return (
                <StepComponent
                  data={getStepData(currentStepConfig.id)}
                  onDataUpdate={(data) => updateStepData(currentStepConfig.id, data)}
                  onNext={goNext}
                  onBack={goBack}
                />
              );
            })()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer: navigation buttons */}
      <div className="flex-shrink-0">
        <ModernOnboardingFooter
          currentStep={currentStep}
          totalSteps={steps.length}
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNext && isCurrentStepValid}
          isCompleting={isCompleting}
          onPrevious={goBack}
          onNext={goNext}
          onComplete={handleComplete}
          onFinishNow={handleFinishNow}
          isRTL={isRTL}
          isValid={isCurrentStepValid}
          isCompleted={isCompleted}
        />
      </div>
    </>
  );

  const portalTarget = document.getElementById('portal-root') || document.body;

  // ─── MOBILE: Bottom Sheet ────────────────────────────────────────────────
  if (isMobile) {
    return createPortal(
      <AnimatePresence>
        {(isOpen || forceShow) && (
          <>
            {/* Backdrop */}
            <motion.div
              key="ob-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Bottom Sheet — 88dvh leaves a visible top gap so it reads as a sheet */}
            <motion.div
              key="ob-sheet"
              drag="y"
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0 }}
              dragElastic={0.12}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 400) onClose?.();
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className={cn(
                'fixed bottom-0 left-0 right-0 z-[201]',
                'bg-white dark:bg-gray-900',
                'rounded-t-3xl shadow-2xl',
                'flex flex-col',
                'h-[88dvh]',
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div
                onPointerDown={(e) => dragControls.start(e)}
                className="flex-shrink-0 flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
                style={{ touchAction: 'none' }}
              >
                <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              </div>

              {innerContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      portalTarget
    );
  }

  // ─── DESKTOP: Side Drawer ────────────────────────────────────────────────
  return createPortal(
    <AnimatePresence>
      {(isOpen || forceShow) && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          {/* Backdrop */}
          <motion.div
            key="ob-backdrop-d"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            key="ob-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ width: Math.min(680, window.innerWidth - 48) }}
            className={cn(
              'relative flex flex-col h-full',
              'bg-white dark:bg-gray-900',
              'shadow-2xl shadow-black/20',
              'overflow-hidden',
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {innerContent}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    portalTarget
  );
};

export default ModernOnboardingModal;
