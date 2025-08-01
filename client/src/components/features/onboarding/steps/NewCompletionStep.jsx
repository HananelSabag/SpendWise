/**
 * 🎉 NEW COMPLETION STEP - Final Onboarding Step
 * Handles profile updates, recurring transaction creation, and completion
 * @version 3.0.0 - REDESIGNED ONBOARDING
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle, User, Repeat, DollarSign, Sparkles,
  ArrowRight, Clock, TrendingUp, Calendar
} from 'lucide-react';

// ✅ Import Zustand stores
import { 
  useAuth, 
  useTranslation, 
  useNotifications,
  useTheme,
  useCurrency
} from '../../../../stores';

import { Button, Card, Badge } from '../../../ui';
import { cn } from '../../../../utils/helpers';
import { api } from '../../../../api';

/**
 * 🎉 New Completion Step Component
 */
const NewCompletionStep = ({ 
  data = {}, 
  onComplete 
}) => {
  // ✅ Zustand stores
  const { user, updateProfile } = useAuth();
  const { t, isRTL, setLanguage } = useTranslation('onboarding');
  const { addNotification } = useNotifications();
  const { setTheme } = useTheme();
  const { setCurrency, formatCurrency } = useCurrency();

  // ✅ Local state
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionStep, setCompletionStep] = useState('preparing');
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState([]);

  // ✅ Extract data from all onboarding steps
  const profileData = data?.profileData || {};
  const selectedTemplates = data?.selectedTemplates || [];
  const summary = data?.summary || {};

  // ✅ Completion steps
  const completionSteps = [
    { id: 'preparing', label: 'Preparing...', duration: 500 },
    { id: 'profile', label: 'Updating profile', duration: 1000 },
    { id: 'preferences', label: 'Setting preferences', duration: 800 },
    { id: 'templates', label: 'Creating recurring transactions', duration: 1500 },
    { id: 'finalizing', label: 'Finalizing setup', duration: 700 }
  ];

  // ✅ Handle profile picture upload
  const uploadProfilePicture = async (file) => {
    if (!file) return null;
    
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await api.auth.uploadProfilePicture(formData);
      return response.data?.profilePictureUrl;
    } catch (error) {
      console.error('Profile picture upload error:', error);
      throw new Error('Failed to upload profile picture');
    }
  };

  // ✅ Handle recurring template creation
  const createRecurringTemplates = async (templates) => {
    if (!templates || templates.length === 0) return [];
    
    const createdTemplates = [];
    
    for (const template of templates) {
      try {
        const templateData = {
          name: template.name,
          description: template.description,
          amount: template.amount,
          type: template.type,
          category_name: template.category,
          interval_type: template.frequency === 'weekly' ? 'weekly' : 'monthly',
          day_of_month: template.frequency === 'monthly' ? 1 : null,
          day_of_week: template.frequency === 'weekly' ? 1 : null,
          is_active: true
        };
        
        const response = await api.transactions.createRecurringTemplate(templateData);
        if (response.success) {
          createdTemplates.push(response.data);
        }
      } catch (error) {
        console.error(`Failed to create template ${template.name}:`, error);
        throw new Error(`Failed to create ${template.name}`);
      }
    }
    
    return createdTemplates;
  };

  // ✅ Main completion handler
  const handleCompletion = useCallback(async () => {
    if (isCompleting) return;
    
    setIsCompleting(true);
    setErrors([]);
    setProgress(0);
    
    try {
      for (let i = 0; i < completionSteps.length; i++) {
        const step = completionSteps[i];
        setCompletionStep(step.id);
        
        switch (step.id) {
          case 'preparing':
            // Just a delay for UI
            await new Promise(resolve => setTimeout(resolve, step.duration));
            break;
            
          case 'profile':
            try {
              let profilePictureUrl = null;
              
              // Upload profile picture if provided
              if (profileData.profilePictureFile) {
                profilePictureUrl = await uploadProfilePicture(profileData.profilePictureFile);
              }
              
              // Update profile
              const profileUpdateData = {
                first_name: profileData.firstName,
                last_name: profileData.lastName,
                ...(profilePictureUrl && { profile_picture_url: profilePictureUrl })
              };
              
              // Add password if needed (hybrid auth)
              if (profileData.password && profileData.confirmPassword) {
                profileUpdateData.password = profileData.password;
              }
              
              const profileResult = await updateProfile(profileUpdateData);
              if (!profileResult.success) {
                throw new Error('Failed to update profile');
              }
            } catch (error) {
              throw new Error(`Profile update failed: ${error.message}`);
            }
            break;
            
          case 'preferences':
            try {
              // Apply preferences immediately
              if (profileData.language) {
                setLanguage(profileData.language);
              }
              if (profileData.theme) {
                setTheme(profileData.theme);
              }
              if (profileData.currency) {
                setCurrency(profileData.currency);
              }
              
              // Update preferences in profile
              const prefUpdateData = {
                language_preference: profileData.language,
                theme_preference: profileData.theme,
                currency_preference: profileData.currency
              };
              
              const prefResult = await updateProfile(prefUpdateData);
              if (!prefResult.success) {
                throw new Error('Failed to update preferences');
              }
            } catch (error) {
              throw new Error(`Preferences update failed: ${error.message}`);
            }
            break;
            
          case 'templates':
            try {
              if (selectedTemplates.length > 0) {
                await createRecurringTemplates(selectedTemplates);
              }
            } catch (error) {
              throw new Error(`Recurring templates creation failed: ${error.message}`);
            }
            break;
            
          case 'finalizing':
            try {
              // Mark onboarding as completed
              const completionResult = await updateProfile({
                onboarding_completed: true,
                onboardingCompleted: true,
                onboarding_completed_at: new Date().toISOString()
              });
              
              if (!completionResult.success) {
                throw new Error('Failed to mark onboarding as completed');
              }
            } catch (error) {
              throw new Error(`Finalization failed: ${error.message}`);
            }
            break;
        }
        
        // Update progress
        setProgress(((i + 1) / completionSteps.length) * 100);
        
        // Delay for next step
        if (i < completionSteps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, step.duration));
        }
      }
      
      // Success!
      addNotification({
        type: 'success',
        message: '🎉 Welcome to SpendWise! Your account is fully set up.',
        duration: 5000
      });
      
      // Complete onboarding
      setTimeout(() => {
        onComplete?.();
      }, 1000);
      
    } catch (error) {
      console.error('Onboarding completion error:', error);
      setErrors(prev => [...prev, error.message]);
      
      addNotification({
        type: 'error',
        message: `Setup failed: ${error.message}`,
        duration: 7000
      });
      
      setIsCompleting(false);
    }
  }, [
    isCompleting, 
    profileData, 
    selectedTemplates, 
    updateProfile, 
    setLanguage, 
    setTheme, 
    setCurrency, 
    addNotification, 
    onComplete
  ]);

  // ✅ Auto-start completion when component mounts
  useEffect(() => {
    // Small delay to show the completion screen
    const timer = setTimeout(() => {
      handleCompletion();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [handleCompletion]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-full flex items-center justify-center"
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      <div className="w-full max-w-2xl">
        {!isCompleting ? (
          // Initial completion screen
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-center"
          >
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-6 shadow-xl">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              🎉 Ready to Complete Setup!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Let's finalize your SpendWise account with your preferences and recurring transactions
            </p>
            
            {/* Summary */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Card className="p-4">
                <User className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Profile</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {profileData.firstName} {profileData.lastName}
                </p>
              </Card>
              
              <Card className="p-4">
                <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Currency</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {profileData.currency || 'USD'}
                </p>
              </Card>
              
              <Card className="p-4">
                <Repeat className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Recurring</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedTemplates.length} templates
                </p>
              </Card>
            </div>
          </motion.div>
        ) : (
          // Completion in progress
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mb-6 shadow-xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
            </div>
            
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Setting up your account...
            </h2>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-6">
              <motion.div
                className="bg-gradient-to-r from-purple-500 to-blue-600 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            {/* Current step */}
            <div className="mb-6">
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {completionSteps.find(s => s.id === completionStep)?.label || 'Processing...'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round(progress)}% complete
              </p>
            </div>
            
            {/* Steps list */}
            <div className="space-y-2 mb-6">
              {completionSteps.map((step, index) => {
                const isActive = step.id === completionStep;
                const isCompleted = completionSteps.findIndex(s => s.id === completionStep) > index;
                
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "flex items-center justify-center space-x-3 py-2 px-4 rounded-lg transition-colors",
                      isActive && "bg-blue-50 dark:bg-blue-900/20",
                      isCompleted && "bg-green-50 dark:bg-green-900/20"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : isActive ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"
                      />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={cn(
                      "text-sm",
                      isActive && "font-medium text-blue-600",
                      isCompleted && "text-green-600",
                      !isActive && !isCompleted && "text-gray-500"
                    )}>
                      {step.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Errors */}
            {errors.length > 0 && (
              <Card className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                  Setup Issues:
                </h4>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setErrors([]);
                    setIsCompleting(false);
                    setProgress(0);
                    setCompletionStep('preparing');
                  }}
                  className="mt-3"
                >
                  Try Again
                </Button>
              </Card>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default NewCompletionStep;