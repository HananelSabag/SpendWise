import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Home, LogIn } from 'lucide-react';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext'; // ADD: Import useAuth
import { cn } from '../../utils/helpers';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { verifyEmail, isVerifyingEmail } = useAuth(); // ADD: Use AuthContext
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error, expired
  const [errorMessage, setErrorMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (token) {
      handleVerifyEmail();
    }
  }, [token]);

  // UPDATED: Use AuthContext verifyEmail method
  const handleVerifyEmail = async () => {
    try {
      setStatus('verifying');
      console.log('📧 [VERIFY-EMAIL-PAGE] Starting verification with token:', token);
      
      const result = await verifyEmail(token);
      console.log('📧 [VERIFY-EMAIL-PAGE] Verification result:', result);
      
      // If we get here, verification was successful and user is logged in
      setStatus('success');
      setUserEmail(result.user?.email || 'your email');
      
      // Navigate to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
      
    } catch (error) {
      console.error('📧 [VERIFY-EMAIL-PAGE] Verification failed:', error);
      
      const errorData = error.response?.data?.error;
      const errorMsg = errorData?.message || error.message;
      
      if (errorMsg?.includes('expired') || errorData?.code === 'TOKEN_EXPIRED') {
        setStatus('expired');
      } else if (errorMsg?.includes('already') || errorData?.code === 'ALREADY_VERIFIED') {
        setStatus('already-used');
      } else {
        setStatus('error');
        setErrorMessage(errorMsg || t('auth.verificationFailed'));
      }
    }
  };

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
          color: 'red'
        };
    }
  };

  const content = getStatusContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              delay: 0.2, 
              type: "spring", 
              stiffness: 200, 
              damping: 10 
            }}
            className="mb-6 flex justify-center"
          >
            {content.icon}
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-gray-900 dark:text-white mb-4"
          >
            {content.title}
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 dark:text-gray-400 mb-8"
          >
            {content.description}
          </motion.p>

          {/* Success message with countdown */}
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

          {/* Additional Help Text */}
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