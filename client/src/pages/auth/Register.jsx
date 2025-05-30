// pages/auth/Register.jsx
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
  Languages
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import { userSchemas, validate } from "../../utils/validationSchemas";
import { cn } from '../../utils/helpers';
import FloatingMenu from '../../components/common/FloatingMenu';
import AccessibilityMenu from '../../components/common/AccessibilityMenu';
import AccessibilityStatement from '../../components/common/AccessibilityStatement';
import AuthFooter from '../../components/auth/AuthFooter';

const PasswordStrengthIndicator = ({ password }) => {
  const { t, language } = useLanguage();
  const isRTL = language === 'he';
  
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

const Register = () => {
  const navigate = useNavigate();
  const { register, isRegistering, error: authError } = useAuth();
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
  const [showAccessibility, setShowAccessibility] = useState(false);

  // Password requirements
  const passwordRequirements = [
    { id: 'length', text: t('auth.passwordLength'), check: (p) => p.length >= 8 },
    { id: 'number', text: t('auth.passwordNumber'), check: (p) => /[0-9]/.test(p) },
    { id: 'upper', text: t('auth.passwordUpper'), check: (p) => /[A-Z]/.test(p) },
    { id: 'lower', text: t('auth.passwordLower'), check: (p) => /[a-z]/.test(p) }
  ];

  // Handle input change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle step navigation
  const nextStep = () => {
    if (currentStep === 1) {
      // Validate step 1
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

  // Handle form submission
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
      // Attempt registration
      const result = await register(formData);
      
      if (result.success) {
        // Navigate to login with success message
        navigate('/auth/login', { 
          state: { 
            message: t('register.success.message') 
          } 
        });
      } else {
        // Handle registration error
        setErrors({ 
          general: result.error?.message || t('register.errors.registrationFailed') 
        });
      }
    } catch (err) {
      console.error('Registration error:', err);
      setErrors({ 
        general: t('errors.generic') 
      });
    }
  };

  // Benefits list
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
        
        {/* Form Side */}
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
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('auth.createAccount')}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {t('auth.registerSubtitle')}
              </p>
            </motion.div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center">
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

            {/* Form */}
            <motion.form 
              onSubmit={handleSubmit}
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Username */}
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

                    {/* Email */}
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

                    <Button
                      type="button"
                      variant="primary"
                      size="large"
                      fullWidth
                      onClick={nextStep}
                    >
                      {t('common.continue')}
                      <ArrowRight className={cn(
                        'w-5 h-5',
                        isRTL ? 'mr-2 rotate-180' : 'ml-2'
                      )} />
                    </Button>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Password */}
                    <div>
                      <Input
                        label={t('auth.password')}
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        placeholder={t('auth.passwordPlaceholder')}
                        icon={Lock}
                        error={errors.password}
                        required
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

                    {/* Confirm Password */}
                    <Input
                      label={t('auth.confirmPassword')}
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      icon={Lock}
                      error={errors.confirmPassword}
                      required
                    />

                    {/* Terms */}
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
                      {(errors.general || authError) && (
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
                            {errors.general || authError}
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Buttons */}
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="large"
                        onClick={() => setCurrentStep(1)}
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
                        {t('auth.createAccount')}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sign In Link */}
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                {t('auth.alreadyHaveAccount')}{' '}
                <Link 
                  to="/auth/login" 
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

      <AuthFooter />
    </>
  );
};

export default Register;