/**
 * 🎯 MODERN ONBOARDING MANAGER - New 3-Step Manager
 * Auto-trigger based on DB status with enhanced UX
 * Features: Smart detection, Better error handling, Fallback strategies
 * @version 4.0.0 - MODERN REDESIGN
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useNotifications } from '../../stores';
import ModernOnboardingModal from '../features/onboarding/ModernOnboardingModal';
import { api } from '../../api';

const ModernOnboardingManager = () => {
  const { user, updateProfile } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // ✅ Enhanced onboarding check
  const checkOnboardingStatus = useCallback(async () => {
    if (!user || !user.id || hasChecked || isChecking) return;

    setIsChecking(true);
    
    try {
      console.log('🔍 ModernOnboardingManager - Checking onboarding status for user:', user.id);

      // ✅ Check database status (multiple field support for compatibility)
      const shouldShowOnboarding = !user.onboarding_completed && 
                                  !user.onboardingCompleted && 
                                  !localStorage.getItem('modern_onboarding_completed');
      
      if (shouldShowOnboarding) {
        console.log('✅ ModernOnboardingManager - Showing onboarding');
        setShowOnboarding(true);
      } else {
        console.log('✅ ModernOnboardingManager - Onboarding already completed');
      }
      
      setHasChecked(true);
    } catch (error) {
      console.error('❌ ModernOnboardingManager - Check failed:', error);
      setHasChecked(true);
    } finally {
      setIsChecking(false);
    }
  }, [user, hasChecked, isChecking]);

  // ✅ Enhanced completion handler
  const handleOnboardingComplete = useCallback(async () => {
    try {
      console.log('🎯 ModernOnboardingManager - Starting completion process');
      
      // ✅ Update user profile to mark onboarding as completed
      const updateData = {
        onboarding_completed: true,
        onboardingCompleted: true,
        onboarding_completed_at: new Date().toISOString(),
        modern_onboarding_version: '4.0.0'
      };

      const result = await updateProfile(updateData);

      if (result.success) {
        console.log('✅ ModernOnboardingManager - Profile updated successfully');
        
        // ✅ Set local storage flag as backup
        localStorage.setItem('modern_onboarding_completed', 'true');
        localStorage.setItem('modern_onboarding_completed_at', new Date().toISOString());
        
        // ✅ Close modal
        setShowOnboarding(false);
        
        // ✅ Navigate to dashboard after successful onboarding
        navigate('/', { replace: true });
        
        // ✅ Show success notification
        addNotification({
          type: 'success',
          message: '🎉 Welcome to SpendWise! Your account is now fully set up.',
          duration: 5000
        });
      } else {
        console.error('❌ ModernOnboardingManager - Profile update failed:', result.error);
        throw new Error(result.error?.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('❌ ModernOnboardingManager - Completion failed:', error);
      
      // ✅ Enhanced error handling with retry option
      addNotification({
        type: 'error',
        message: 'Failed to complete setup. Please try again or contact support.',
        duration: 6000,
        action: {
          label: 'Retry',
          onClick: () => handleOnboardingComplete()
        }
      });
    }
  }, [updateProfile, addNotification, navigate]);

  // ✅ Enhanced close handler
  const handleOnboardingClose = useCallback(() => {
    console.log('🔍 ModernOnboardingManager - User closed onboarding');
    setShowOnboarding(false);
    
    // ✅ Set temporary flag to prevent immediate re-showing
    localStorage.setItem('modern_onboarding_dismissed', 'true');
    localStorage.setItem('modern_onboarding_dismissed_at', new Date().toISOString());
    
    addNotification({
      type: 'info',
      message: 'Setup paused. You can complete it anytime from your profile.',
      duration: 4000
    });
  }, [addNotification]);

  // ✅ Enhanced skip handler
  const handleOnboardingSkip = useCallback(() => {
    console.log('🔍 ModernOnboardingManager - User skipped onboarding');
    setShowOnboarding(false);
    
    // ✅ Mark as skipped but not completed
    localStorage.setItem('modern_onboarding_skipped', 'true');
    localStorage.setItem('modern_onboarding_skipped_at', new Date().toISOString());
    
    addNotification({
      type: 'info',
      message: 'Setup skipped. Complete it later for the full SpendWise experience.',
      duration: 5000
    });
  }, [addNotification]);

  // ✅ Check onboarding status when user changes
  useEffect(() => {
    if (user && !hasChecked) {
      // ✅ Check if user recently dismissed onboarding
      const dismissed = localStorage.getItem('modern_onboarding_dismissed');
      const dismissedAt = localStorage.getItem('modern_onboarding_dismissed_at');
      
      if (dismissed && dismissedAt) {
        const dismissedTime = new Date(dismissedAt);
        const hoursSinceDismissal = (new Date() - dismissedTime) / (1000 * 60 * 60);
        
        // ✅ Don't show again for 24 hours after dismissal
        if (hoursSinceDismissal < 24) {
          console.log('🔍 ModernOnboardingManager - Recently dismissed, skipping check');
          setHasChecked(true);
          return;
        }
      }

      // ✅ Small delay to ensure user data is fully loaded
      const timer = setTimeout(() => {
        checkOnboardingStatus();
      }, 800);
      
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

  // ✅ Clear dismissal flags on successful login for returning users
  useEffect(() => {
    if (user && user.onboarding_completed) {
      localStorage.removeItem('modern_onboarding_dismissed');
      localStorage.removeItem('modern_onboarding_dismissed_at');
      localStorage.removeItem('modern_onboarding_skipped');
      localStorage.removeItem('modern_onboarding_skipped_at');
    }
  }, [user]);

  // ✅ Don't render anything if no user or not showing onboarding
  if (!user || !showOnboarding) {
    return null;
  }

  return (
    <ModernOnboardingModal
      isOpen={showOnboarding}
      onComplete={handleOnboardingComplete}
      onClose={handleOnboardingClose}
      onSkip={handleOnboardingSkip}
      forceShow={false}
      previewOnly={false}
    />
  );
};

export default ModernOnboardingManager;
