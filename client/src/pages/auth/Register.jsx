/**
 * User Registration Page
 * Multi-step registration flow with email verification
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  User,
  ArrowRight,
  Check,
  X,
  Shield,
  Zap,
  TrendingUp,
  Languages,
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { userSchemas, validate } from "../../utils/validationSchemas";
import { cn } from '../../utils/helpers';
import FloatingMenu from '../../components/common/FloatingMenu';
import AccessibilityMenu from '../../components/common/AccessibilityMenu';
import Footer from '../../components/layout/Footer';

/**
 * Password strength indicator component
 */
const PasswordStrengthIndicator = ({ password }) => {
  const { t } = useLanguage();
  
  const getStrength = () => {
    if (!password) return 0;
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    return strength;
  };

  const strength = getStrength();
  const strengthText = ['', t('auth.weak'), t('auth.fair'), t('auth.good'), t('auth.strong'), t('auth.veryStrong')];
  const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-all ${
              level <= strength ? strengthColor[strength] : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
      {password && (
        <p className={`text-xs ${strength <= 2 ? 'text-red-500' : 'text-green-500'}`}>
          {strengthText[strength]}
        </p>
      )}
    </div>
  );
};

/**
 * Email verification success modal
 */
const EmailVerificationModal = ({ email, onClose }) => {
  const { t } = useLanguage();
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('auth.registrationSuccess')}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('auth.verificationEmailSent')} <strong>{email}</strong>
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {t('auth.checkEmailInstructions')}
            </p>
          </div>
          
          <Button
            variant="primary"
            fullWidth
            onClick={onClose}
          >
            {t('auth.goToLogin')}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * User Registration Component
 */
const Register = () => {
  const navigate = useNavigate();
  const { register, isRegistering } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const isRTL = language === 'he';

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Email verification state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Password requirements validation
  const passwordRequirements = [
    { id: 'length', text: t('auth.passwordLength'), check: (p) => p.length >= 8 },
    { id: 'number', text: t('auth.passwordNumber'), check: (p) => /[0-9]/.test(p) },
    { id: 'upper', text: t('auth.passwordUpper'), check: (p) => /[A-Z]/.test(p) },
    { id: 'lower', text: t('auth.passwordLower'), check: (p) => /[a-z]/.test(p) }
  ];

  /**
   * Handle input changes and clear errors
   */
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  /**
   * Navigate to next registration step
   */
  const nextStep = () => {
    if (currentStep === 1) {
      const stepErrors = {};
      
      if (!formData.username) {
        stepErrors.username = t('validation.usernameRequired');
      } else if (formData.username.length < 3) {
        stepErrors.username = t('validation.usernameTooShort');
      }
      
      if (!formData.email) {
        stepErrors.email = t('validation.emailRequired');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        stepErrors.email = t('validation.emailInvalid');
      }

      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        return;
      }
    }
    
    setCurrentStep(2);
  };

  /**
   * Navigate to previous registration step
   */
  const prevStep = () => {
    setCurrentStep(1);
    setErrors({});
  };

  /**
   * Handle registration form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validate all fields
    const { success, errors: validationErrors } = validate(userSchemas.register, formData);

    if (!success) {
      setErrors(validationErrors);
      return;
    }

    if (!agreedToTerms) {
      setErrors({ terms: t('validation.agreeToTerms') });
      return;
    }

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      setRegisteredEmail(formData.email);
      setShowVerificationModal(true);
      
    } catch (err) {
      const errorData = err.response?.data?.error;
      
      if (errorData?.code === 'EMAIL_NOT_VERIFIED') {
        setErrors({ 
          general: t('auth.emailNotVerifiedError')
        });
      } else if (errorData?.message?.includes('already exists')) {
        setErrors({ 
          email: t('auth.emailAlreadyRegistered')
        });
      } else {
        setErrors({ 
          general: errorData?.message || t('errors.generic')
        });
      }
    }
  };

  /**
   * Handle verification modal close
   */
  const handleVerificationModalClose = () => {
    setShowVerificationModal(false);
    navigate('/login', { 
      state: { 
        message: t('auth.verificationEmailSentMessage'),
        email: registeredEmail 
      } 
    });
  };

  // Application benefits for showcase
  const benefits = [
    { icon: Shield, text: t('auth.benefit1') },
    { icon: Zap, text: t('auth.benefit2') },
    { icon: TrendingUp, text: t('auth.benefit3') }
  ];

  const menuButtons = [
    {
      icon: Languages,
      label: language === 'he' ? 'English' : 'עברית',
      onClick: toggleLanguage
    }
  ];

  return (
    <>
      <div className="min-h-screen flex relative" dir={isRTL ? 'rtl' : 'ltr'}>
        <FloatingMenu buttons={menuButtons} />
        <AccessibilityMenu />
        
        {/* Registration Form Side */}
        <motion.div 
          className={cn(
            'w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gray-900',
            isRTL ? 'lg:order-2' : 'lg:order-1'
          )}
          initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-full max-w-md space-y-8">
            {/* Logo */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link to="/" className="inline-flex items-center justify-center mb-8">
                <motion.div 
                  className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-3xl text-white font-bold">S</span>
                </motion.div>
              </Link>
              
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('auth.createAccount')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('auth.registerSubtitle')}
                </p>
              </div>
            </motion.div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center ${currentStep >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 1 ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300'
                  }`}>
                    {currentStep > 1 ? <Check className="w-5 h-5" /> : '1'}
                  </div>
                  <span className={cn(
                    'text-sm font-medium',
                    isRTL ? 'mr-2' : 'ml-2'
                  )}>
                    {t('auth.accountInfo')}
                  </span>
                </div>
                <div className="w-16 h-0.5 bg-gray-300" />
                <div className={`flex items-center ${currentStep >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 2 ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300'
                  }`}>
                    2
                  </div>
                  <span className={cn(
                    'text-sm font-medium',
                    isRTL ? 'mr-2' : 'ml-2'
                  )}>
                    {t('auth.security')}
                  </span>
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <motion.form 
              onSubmit={handleSubmit}
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <AnimatePresence mode="wait">
                {/* Step 1: Account Information */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <Input
                      label={t('auth.username')}
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleChange('username', e.target.value)}
                      placeholder={t('auth.usernamePlaceholder')}
                      icon={User}
                      error={errors.username}
                      required
                    />

                    <Input
                      label={t('auth.email')}
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder={t('auth.emailPlaceholder')}
                      icon={Mail}
                      error={errors.email}
                      required
                    />

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          {t('auth.emailVerificationNotice')}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="primary"
                      size="large"
                      fullWidth
                      onClick={nextStep}
                      className="py-3 px-6 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span>{t('common.continue')}</span>
                        <ArrowRight className={cn(
                          'w-5 h-5',
                          isRTL ? 'rotate-180' : ''
                        )} />
                      </div>
                    </Button>
                  </motion.div>
                )}

                {/* Step 2: Security Information */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <Input
                        label={t('auth.password')}
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        placeholder={t('auth.passwordPlaceholder')}
                        icon={Lock}
                        error={errors.password}
                        required
                        suffix={
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        }
                      />
                      <PasswordStrengthIndicator password={formData.password} />
                      
                      {/* Password Requirements */}
                      <div className="mt-3 space-y-1">
                        {passwordRequirements.map((req) => (
                          <div
                            key={req.id}
                            className={`flex items-center text-xs ${
                              req.check(formData.password) ? 'text-green-500' : 'text-gray-400'
                            }`}
                          >
                            {req.check(formData.password) ? (
                              <Check className="w-3 h-3 mr-1" />
                            ) : (
                              <X className="w-3 h-3 mr-1" />
                            )}
                            {req.text}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Input
                      label={t('auth.confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      icon={Lock}
                      error={errors.confirmPassword}
                      required
                      suffix={
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      }
                    />

                    {/* Terms Agreement */}
                    <div>
                      <label className="flex items-start cursor-pointer">
                        <input
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="w-4 h-4 mt-0.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className={cn(
                          'text-sm text-gray-600 dark:text-gray-400',
                          isRTL ? 'mr-2' : 'ml-2'
                        )}>
                          {t('auth.agreeToTerms')}
                        </span>
                      </label>
                      {errors.terms && (
                        <p className="mt-1 text-sm text-red-500">{errors.terms}</p>
                      )}
                    </div>

                    {/* Error Alert */}
                    <AnimatePresence>
                      {errors.general && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <Alert 
                            type="error" 
                            dismissible 
                            onDismiss={() => setErrors({})}
                          >
                            {errors.general}
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="large"
                        onClick={prevStep}
                      >
                        {t('common.back')}
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="large"
                        fullWidth
                        loading={isRegistering}
                        disabled={!agreedToTerms}
                      >
                        {isRegistering ? (
                          <LoadingSpinner size="small" />
                        ) : (
                          <>
                            <UserPlus className="w-5 h-5 mr-2" />
                            {t('auth.createAccount')}
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sign In Link */}
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                {t('auth.alreadyHaveAccount')}{' '}
                <Link 
                  to="/login" 
                  className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  {t('auth.signInNow')}
                </Link>
              </p>
            </motion.form>
          </div>
        </motion.div>

        {/* Feature Showcase Side */}
        <div className={cn(
          'hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-600 dark:to-primary-800 relative overflow-hidden',
          isRTL ? 'lg:order-1' : 'lg:order-2'
        )}>
          {/* Animated Background */}
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.1 }}
            transition={{ duration: 1 }}
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          </motion.div>

          {/* Content */}
          <div className="relative z-10 flex items-center justify-center w-full p-12">
            <div className="max-w-lg text-white">
              <motion.h2 
                className="text-4xl font-bold mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {t('auth.startJourney')}
              </motion.h2>
              
              <motion.p 
                className="text-xl mb-12 text-white/90"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {t('auth.joinThousands')}
              </motion.p>

              {/* Benefits */}
              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center"
                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  >
                    <div className={cn(
                      'flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center',
                      isRTL ? 'ml-4' : 'mr-4'
                    )}>
                      <benefit.icon className="w-6 h-6" />
                    </div>
                    <p className="text-lg">{benefit.text}</p>
                  </motion.div>
                ))}
              </div>

              {/* Stats */}
              <motion.div 
                className="mt-12 grid grid-cols-3 gap-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold">10K+</div>
                  <div className="text-sm text-white/80">{t('auth.activeUsers')}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">$2M+</div>
                  <div className="text-sm text-white/80">{t('auth.savedMoney')}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">4.9</div>
                  <div className="text-sm text-white/80">{t('auth.rating')}</div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Verification Modal */}
      <AnimatePresence>
        {showVerificationModal && (
          <EmailVerificationModal 
            email={registeredEmail}
            onClose={handleVerificationModalClose}
          />
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
};

export default Register;