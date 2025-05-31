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
  Eye,
  EyeOff,
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
import FloatingMenu from '../../components/common/FloatingMenu';
import { userSchemas, validate } from "../../utils/validationSchemas";

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

    // Real-time validation
    if (field === 'email' && value) {
      const emailError = validateEmail(value);
      if (emailError) {
        setErrors(prev => ({ ...prev, email: emailError }));
      }
    }

    if (field === 'confirmPassword' && value) {
      if (value !== formData.password) {
        setErrors(prev => ({ ...prev, confirmPassword: t('validation.passwordsDoNotMatch') }));
      }
    }
  };

  // Handle step navigation
  const nextStep = () => {
    if (currentStep === 1) {
      // Validate step 1
      const newErrors = {};
      if (!formData.username) newErrors.username = t('validation.usernameRequired');
      if (!formData.email) newErrors.email = t('validation.emailRequired');
      else {
        const emailError = validateEmail(formData.email);
        if (emailError) newErrors.email = emailError;
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }
    
    setCurrentStep(2);
  };

  // Handle form submission
 const handleSubmit = async (e) => {
  e.preventDefault();
  setErrors({});
  setLoading(true);

  // Validate form data
  const { success, errors: zodErrors } = validate(userSchemas.register, formData);

  let newErrors = {};
  if (!success) newErrors = zodErrors;

  //  Check for errors in step 2
  if (!agreedToTerms) newErrors.terms = t('validation.agreeToTerms');
  if (formData.password !== formData.confirmPassword) {
    newErrors.confirmPassword = t('validation.passwordsDoNotMatch');
  }

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    setLoading(false);
    return;
  }

  // Prepare data for registration
  const result = await register(formData);
  if (!result.success) {
    setErrors({ general: result.error.message });
  }
  setLoading(false);
};


  return (
    <div className="min-h-screen flex" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Left Side - Form */}
      <motion.div 
        className={`w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gray-900 
          ${isRTL ? 'lg:order-2' : 'lg:order-1'}`}
        initial={{ opacity: 0, x: -50 }}
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

          {/* Progress Steps - עדכון כיוון */}
          <div className={`flex items-center justify-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
            <div className={`flex items-center ${currentStep >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep >= 1 ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300'
              }`}>
                {currentStep > 1 ? <Check className="w-5 h-5" /> : '1'}
              </div>
              <span className="ml-2 text-sm font-medium">{t('auth.accountInfo')}</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300" />
            <div className={`flex items-center ${currentStep >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep >= 2 ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">{t('auth.security')}</span>
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
                  />

                  <Button
                    type="button"
                    variant="primary"
                    size="large"
                    fullWidth
                    onClick={nextStep}
                  >
                    {t('common.continue')}
                    <ArrowRight className="w-5 h-5 ml-2" />
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
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder={t('auth.passwordPlaceholder')}
                      icon={Lock}
                      error={errors.password}
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
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    icon={Lock}
                    error={errors.confirmPassword}
                  />

                  {/* Terms */}
                  <div>
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="w-4 h-4 mt-0.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        {t('auth.agreeToTerms')}{' '}
                        <Link to="/terms" className="text-primary-600 hover:underline">
                          {t('auth.termsOfService')}
                        </Link>{' '}
                        {t('common.and')}{' '}
                        <Link to="/privacy" className="text-primary-600 hover:underline">
                          {t('auth.privacyPolicy')}
                        </Link>
                      </span>
                    </label>
                    {errors.terms && (
                      <p className="mt-1 text-sm text-red-500">{errors.terms}</p>
                    )}
                  </div>

                  {/* Error Alert */}
                  <AnimatePresence>
                    {errors.submit && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <Alert type="error" dismissible onDismiss={() => setErrors({})}>
                          {errors.submit}
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Buttons - עדכון כיוון */}
                  <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
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

      {/* Right Side - Feature Showcase */}
      <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 to-primary-700 
        dark:from-primary-600 dark:to-primary-800 relative overflow-hidden
        ${isRTL ? 'lg:order-1' : 'lg:order-2'}`}
      >
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
              {[
                { icon: Shield, text: t('auth.benefit1') },
                { icon: Zap, text: t('auth.benefit2') },
                { icon: TrendingUp, text: t('auth.benefit3') }
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
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

      {/* Add Floating Menu */}
      <FloatingMenu
        buttons={[
          {
            label: t('floatingMenu.changeLanguage'),
            icon: Languages,
            onClick: toggleLanguage,
          }
        ]}
      />
    </div>
  );
};

export default Register;