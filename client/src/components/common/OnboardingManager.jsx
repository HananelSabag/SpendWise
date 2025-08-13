/**
 * 🎯 ONBOARDING MANAGER - Auto-Trigger Based on DB Status
 * Shows onboarding popup only if user.onboarding_completed is false in database
 * Marks onboarding_completed: true when user completes onboarding
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useNotifications } from '../../stores';
import OnboardingModal from '../features/onboarding/OnboardingModal';
import { api } from '../../api';

const OnboardingManager = () => {
  const { user, updateProfile } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // ✅ Check if onboarding should be shown
  const checkOnboardingStatus = useCallback(async () => {
    if (!user || !user.id || hasChecked || isChecking) return;

    setIsChecking(true);
    
    try {
      // silent

      // ✅ Check database status (onboarding_completed field)
      const shouldShowOnboarding = !user.onboarding_completed && !user.onboardingCompleted;
      
      if (shouldShowOnboarding) {
        // silent
        setShowOnboarding(true);
      } else {
        // silent
      }
      
      setHasChecked(true);
    } catch (error) {
      // silent
      setHasChecked(true);
    } finally {
      setIsChecking(false);
    }
  }, [user, hasChecked, isChecking]);

  // ✅ Handle onboarding completion
  const handleOnboardingComplete = useCallback(async () => {
    try {
      // silent
      
      // ✅ Update user profile to mark onboarding as completed
      const result = await updateProfile({
        onboarding_completed: true,
        onboardingCompleted: true,
        onboarding_completed_at: new Date().toISOString()
      });

      if (result.success) {
        // silent
        setShowOnboarding(false);
        
        // ✅ Navigate to dashboard after successful onboarding
        // silent
        navigate('/', { replace: true });
        
        addNotification({
          type: 'success',
          message: 'Welcome to SpendWise! Your account is now fully set up.',
          duration: 5000
        });
      } else {
        // silent
        addNotification({
          type: 'error',
          message: 'Failed to save onboarding completion. Please try again.',
          duration: 5000
        });
      }
    } catch (error) {
      // silent
      addNotification({
        type: 'error',
        message: 'Error completing onboarding. Please try again.',
        duration: 5000
      });
    }
  }, [updateProfile, addNotification, navigate]);

  // ✅ Handle onboarding close/skip
  const handleOnboardingClose = useCallback(() => {
    // silent
    setShowOnboarding(false);
    
    // Optional: Mark as skipped in database for analytics
    // This doesn't mark as completed, so it can show again next time
    addNotification({
      type: 'info',
      message: 'You can start the setup process anytime from your profile.',
      duration: 4000
    });
  }, [addNotification]);

  // ✅ Handle onboarding skip (separate from close)
  const handleOnboardingSkip = useCallback(() => {
    // silent
    setShowOnboarding(false);
    
    addNotification({
      type: 'info',
      message: 'Setup skipped. You can complete it later from your profile.',
      duration: 4000
    });
  }, [addNotification]);

  // ✅ Check onboarding status when user changes
  useEffect(() => {
    if (user && !hasChecked) {
      // Small delay to ensure user data is fully loaded
      const timer = setTimeout(() => {
        checkOnboardingStatus();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [user, hasChecked, checkOnboardingStatus]);

  // ✅ Reset check status when user changes (for logout/login scenarios)
  useEffect(() => {
    if (!user) {
      setHasChecked(false);
      setShowOnboarding(false);
    }
  }, [user]);

  // ✅ Don't render anything if no user or not showing onboarding
  if (!user || !showOnboarding) {
    return null;
  }

  return (
    <OnboardingModal
      isOpen={showOnboarding}
      onComplete={handleOnboardingComplete}
      onClose={handleOnboardingClose}
      onSkip={handleOnboardingSkip}
      forceShow={false} // Allow user to close/skip
    />
  );
};

export default OnboardingManager; 