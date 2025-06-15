/**
 * Email Verification Page
 * Handles email verification token processing and user feedback
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Home, LogIn } from 'lucide-react';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import GuestPreferences from '../../components/common/GuestPreferences';
import AccessibilityMenu from '../../components/common/AccessibilityMenu';
import { cn } from '../../utils/helpers';

/**
 * Robust token extraction utility
 * Prioritizes React Router params but includes fallbacks for edge cases
 */
const extractTokenFromUrl = (paramsToken, locationPathname, locationSearch) => {
  console.log('🔍 [TOKEN] Extracting token from URL:', {
    paramsToken,
    pathname: locationPathname,
    search: locationSearch,
    href: window.location.href
  });

  // Method 1: React Router useParams (most reliable after proper routing)
  if (paramsToken && paramsToken.trim()) {
    const cleaned = paramsToken.trim();
    console.log('🔍 [TOKEN] Method 1 - React Router params:', cleaned);
    return cleaned;
  }

  // Method 2: Manual pathname extraction (fallback)
  const pathParts = locationPathname.split('/').filter(Boolean);
  const tokenIndex = pathParts.indexOf('verify-email');
  if (tokenIndex !== -1 && pathParts[tokenIndex + 1]) {
    const tokenFromPath = decodeURIComponent(pathParts[tokenIndex + 1]).trim();
    console.log('🔍 [TOKEN] Method 2 - Manual pathname extraction:', tokenFromPath);
    return tokenFromPath;
  }

  // Method 3: Search params (query string fallback)
  if (locationSearch) {
    const urlParams = new URLSearchParams(locationSearch);
    const tokenFromSearch = urlParams.get('token');
    if (tokenFromSearch && tokenFromSearch.trim()) {
      const cleaned = tokenFromSearch.trim();
      console.log('🔍 [TOKEN] Method 3 - Search params:', cleaned);
      return cleaned;
    }
  }

  console.log('🔍 [TOKEN] No valid token found');
  return null;
};

/**
 * Email Verification Component
 */
const VerifyEmail = () => {
  const { token: paramsToken } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { verifyEmail, isVerifyingEmail } = useAuth();
  
  const [status, setStatus] = useState('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isIPhone, setIsIPhone] = useState(false);
  const [extractedToken, setExtractedToken] = useState(null);

  useEffect(() => {
    // Detect iPhone/iOS devices
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isiPhone = /iPhone|iPad|iPod/i.test(userAgent);
    setIsIPhone(isiPhone);
    
    // Extract token using multiple methods
    const token = extractTokenFromUrl(paramsToken, location.pathname, location.search);
    setExtractedToken(token);
    
    if (token) {
      handleVerifyEmail(token);
    } else {
      console.error('🔍 [TOKEN] No valid token found');
      setStatus('error');
      setErrorMessage(t('auth.invalidVerificationLink') || 'Invalid verification link');
    }
  }, [paramsToken, location.pathname, location.search]);

  /**
   * Process email verification token
   */
  const handleVerifyEmail = async (token) => {
    console.log('🔍 [VERIFY] Starting verification with token:', token?.substring(0, 10) + '...');
    
    try {
      setStatus('verifying');
      
      const result = await verifyEmail(token);
      
      setStatus('success');
      setUserEmail(result.user?.email || 'your email');
      
      // Navigate to dashboard after successful verification
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
      
    } catch (error) {
      console.error('🔍 [VERIFY] Verification failed:', error);
      const errorData = error.response?.data?.error;
      const errorMsg = errorData?.message || error.message;
      
      if (errorMsg?.includes('expired') || errorData?.code === 'TOKEN_EXPIRED') {
        setStatus('expired');
      } else if (errorMsg?.includes('already') || errorData?.code === 'ALREADY_VERIFIED') {
        setStatus('already-used');
      } else if (errorMsg?.includes('invalid') || errorData?.code === 'INVALID_TOKEN') {
        setStatus('error');
        setErrorMessage(t('auth.invalidVerificationLink') || 'Invalid verification link');
      } else {
        setStatus('error');
        setErrorMessage(errorMsg || t('auth.verificationFailed'));
      }
    }
  };

  /**
   * Get status-specific content configuration
   */
  const getStatusContent = () => {
    switch (status) {
      case 'verifying':
        return {
          icon: <LoadingSpinner size="large" />,
          title: t('auth.verifyingEmail'),
          description: t('auth.pleaseWait'),
          color: 'blue'
        };
        
      case 'success':
        return {
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          title: t('auth.emailVerified'),
          description: t('auth.emailVerifiedSuccess') + ' ' + t('auth.redirectingToDashboard'),
          color: 'green'
        };
        
      case 'expired':
        return {
          icon: <AlertCircle className="w-16 h-16 text-yellow-500" />,
          title: t('auth.tokenExpired'),
          description: t('auth.tokenExpiredMessage'),
          color: 'yellow'
        };
        
      case 'already-used':
        return {
          icon: <AlertCircle className="w-16 h-16 text-blue-500" />,
          title: t('auth.alreadyVerified'),
          description: t('auth.alreadyVerifiedMessage'),
          color: 'blue'
        };
        
      case 'error':
      default:
        return {
          icon: <XCircle className="w-16 h-16 text-red-500" />,
          title: t('auth.verificationFailed'),
          description: errorMessage || t('auth.verificationFailedMessage'),
          color: 'red',
          showTroubleshooting: isIPhone
        };
    }
  };

  const content = getStatusContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 relative">
      {/* Guest Preferences & Accessibility - Top Right */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        <AccessibilityMenu />
        <GuestPreferences />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-sm w-full"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
          {/* Status Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              delay: 0.2, 
              type: "spring", 
              stiffness: 200, 
              damping: 10 
            }}
            className="mb-4 flex justify-center"
          >
            {content.icon}
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl font-bold text-gray-900 dark:text-white mb-3"
          >
            {content.title}
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 dark:text-gray-400 mb-6"
          >
            {content.description}
          </motion.p>

          {/* Enhanced iPhone-specific troubleshooting */}
          {content.showTroubleshooting && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-left"
            >
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                📱 iPhone/iOS Troubleshooting
              </h4>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                <p>This verification link might not work properly when opened from the Gmail app on iPhone/iOS. Try these solutions:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Long-press the verification link in your email</li>
                  <li>Select "Copy" to copy the link</li>
                  <li>Open Safari browser (not the Gmail app)</li>
                  <li>Paste the link in Safari's address bar and tap Go</li>
                  <li>Alternatively, try opening the email on a computer</li>
                </ol>
                <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-800 rounded">
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    <strong>Why this happens:</strong> Gmail's built-in browser on iOS sometimes modifies links, causing verification to fail.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4 text-left"
            >
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-xs">
                🔧 Debug Info (Development Only)
              </h4>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>Extracted Token:</strong> {extractedToken ? `${extractedToken.substring(0, 20)}...` : 'None'}</p>
                <p><strong>Params Token:</strong> {paramsToken ? `${paramsToken.substring(0, 20)}...` : 'None'}</p>
                <p><strong>Pathname:</strong> {location.pathname}</p>
                <p><strong>Search:</strong> {location.search || 'None'}</p>
                <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...</p>
              </div>
            </motion.div>
          )}

          {/* Success Message */}
          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6"
            >
              <p className="text-sm text-green-800 dark:text-green-200">
                🎉 {t('auth.welcomeToSpendWise')}! {t('auth.redirectingIn')} 2 {t('auth.seconds')}...
              </p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            {status === 'success' ? (
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigate('/', { replace: true })}
                className="flex items-center justify-center"
              >
                <Home className="w-5 h-5 mr-2" />
                {t('auth.goToDashboard')}
              </Button>
            ) : status === 'verifying' ? (
              <Button
                variant="outline"
                fullWidth
                disabled={true}
                className="flex items-center justify-center"
              >
                <LoadingSpinner size="small" className="mr-2" />
                {t('auth.verifying')}...
              </Button>
            ) : (
              <>
                {(status === 'expired' || status === 'error') && (
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => navigate('/login', { replace: true })}
                    className="flex items-center justify-center"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    {t('auth.backToLogin')}
                  </Button>
                )}
                
                {status === 'already-used' && (
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => navigate('/login', { replace: true })}
                    className="flex items-center justify-center"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    {t('auth.proceedToLogin')}
                  </Button>
                )}
              </>
            )}
          </motion.div>

          {/* Support Link */}
          {status !== 'verifying' && status !== 'success' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-sm text-gray-500 dark:text-gray-400"
            >
              {t('auth.needHelp')}{' '}
              <Link to="/contact" className="text-primary-600 hover:text-primary-700 dark:text-primary-400">
                {t('auth.contactSupport')}
              </Link>
            </motion.p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;