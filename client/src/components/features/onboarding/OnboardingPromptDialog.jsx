/**
 * OnboardingPromptDialog - Optional dialog for incomplete onboarding
 * 
 * Shows a small, non-intrusive dialog asking users if they want to 
 * complete onboarding or skip it entirely.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, SkipForward, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../ui';
import { cn } from '../../../utils/helpers';

const OnboardingPromptDialog = ({ 
  isOpen, 
  onClose, 
  onContinueOnboarding,
  onSkipOnboarding 
}) => {
  const { t, language } = useLanguage();
  const { markOnboardingComplete, refreshProfile } = useAuth();
  const isRTL = language === 'he';
  const [isSkipping, setIsSkipping] = useState(false);

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      console.log(`🚀 [ONBOARDING-PROMPT] Skipping onboarding...`);
      const result = await markOnboardingComplete();
      console.log(`🚀 [ONBOARDING-PROMPT] Skip API response:`, result);
      
      localStorage.removeItem('spendwise-onboarding-progress');
      localStorage.setItem('spendwise-onboarding-skipped', 'true');
      
      if (refreshProfile) {
        console.log(`🚀 [ONBOARDING-PROMPT] Refreshing profile...`);
        await refreshProfile();
        console.log(`🚀 [ONBOARDING-PROMPT] Profile refreshed`);
      }
      
      onSkipOnboarding?.();
      onClose();
      console.log(`🚀 [ONBOARDING-PROMPT] Onboarding skipped successfully`);
    } catch (error) {
      console.error('❌ [ONBOARDING-PROMPT] Failed to skip onboarding:', error);
      console.error('❌ [ONBOARDING-PROMPT] Error details:', error.response?.data || error.message);
      onClose();
    } finally {
      setIsSkipping(false);
    }
  };

  const handleContinue = () => {
    onContinueOnboarding?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl",
            "border border-gray-200 dark:border-gray-700",
            "max-w-md w-full mx-4 p-6",
            "text-center"
          )}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className={cn(
              "absolute top-4 p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300",
              "hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors",
              isRTL ? "left-4" : "right-4"
            )}
          >
            <X size={18} />
          </button>

          {/* Content */}
          <div className="mt-2 mb-6">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {isRTL 
                ? "נראה שלא סיימת את חווית האונבורד"
                : "Looks like you didn't finish the onboarding experience"
              }
            </h3>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {isRTL 
                ? "האם תרצה להמשיך ולסיים את ההדרכה, או שאתה מעדיף לדלג ולהתחיל להשתמש באפליקציה?"
                : "Would you like to continue and finish the setup, or skip it and start using the app?"
              }
            </p>
          </div>

          {/* Action Buttons */}
          <div className={cn(
            "flex gap-3",
            isRTL ? "flex-row-reverse" : "flex-row"
          )}>
            {/* Skip Button */}
            <Button
              onClick={handleSkip}
              disabled={isSkipping}
              variant="outline"
              className={cn(
                "flex-1 flex items-center justify-center gap-2",
                "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200",
                isRTL && "flex-row-reverse"
              )}
            >
              {isSkipping ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <SkipForward className="w-4 h-4" />
              )}
              <span>
                {isRTL ? "דלג ותתחיל" : "Skip & Start"}
              </span>
            </Button>

            {/* Continue Button */}
            <Button
              onClick={handleContinue}
              disabled={isSkipping}
              className={cn(
                "flex-1 bg-blue-600 hover:bg-blue-700 text-white",
                "flex items-center justify-center gap-2",
                isRTL && "flex-row-reverse"
              )}
            >
              <ArrowRight className="w-4 h-4" />
              <span>
                {isRTL ? "המשך הדרכה" : "Continue Setup"}
              </span>
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            {isRTL 
              ? "תמיד תוכל לחזור להדרכה דרך תפריט העזרה"
              : "You can always access the setup later from the Help menu"
            }
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingPromptDialog; 