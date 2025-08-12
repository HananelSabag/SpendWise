/**
 * 🔐 PASSWORD STRENGTH ANALYZER - Mobile-First Security Component
 * Extracted from Register.jsx for better reusability and performance
 * Features: Real-time analysis, Visual feedback, Mobile-responsive
 * @version 2.0.0
 */

import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, X, AlertCircle, Shield, Eye, EyeOff,
  Lock, Star, Award, Crown, Zap 
} from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation } from '../../../stores';
import { cn } from '../../../utils/helpers';

/**
 * 🛡️ Password Strength Analysis Logic
 */
const analyzePassword = (password) => {
  if (!password) {
    return {
      score: 0,
      strength: 'empty',
      checks: {},
      suggestions: []
    };
  }

  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    noSequential: !/123|abc|qwerty/i.test(password),
    noRepeating: !/(.)\1{2,}/.test(password)
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = Math.min((passedChecks / 7) * 100, 100);

  let strength = 'weak';
  if (score >= 85) strength = 'excellent';
  else if (score >= 70) strength = 'strong';
  else if (score >= 50) strength = 'medium';
  else if (score >= 25) strength = 'weak';

  const suggestions = [];
  if (!checks.length) suggestions.push('Use at least 8 characters');
  if (!checks.uppercase) suggestions.push('Add uppercase letters');
  if (!checks.lowercase) suggestions.push('Add lowercase letters');
  if (!checks.numbers) suggestions.push('Add numbers');
  if (!checks.symbols) suggestions.push('Add special characters');
  if (!checks.noSequential) suggestions.push('Avoid sequential characters');
  if (!checks.noRepeating) suggestions.push('Avoid repeating characters');

  return { score, strength, checks, suggestions };
};

/**
 * 📊 Password Strength Indicator
 */
const StrengthMeter = ({ score, strength, className = '' }) => {
  const { t } = useTranslation('auth');

  const strengthConfig = {
    empty: { color: 'bg-gray-200', label: t('password.empty', { fallback: 'Enter password' }), icon: Lock },
    weak: { color: 'bg-red-500', label: t('password.weak', { fallback: 'Weak' }), icon: AlertCircle },
    medium: { color: 'bg-yellow-500', label: t('password.medium', { fallback: 'Medium' }), icon: Shield },
    strong: { color: 'bg-blue-500', label: t('password.strong', { fallback: 'Strong' }), icon: Star },
    excellent: { color: 'bg-green-500', label: t('password.excellent', { fallback: 'Excellent' }), icon: Crown }
  };

  const config = strengthConfig[strength] || strengthConfig.empty;
  const IconComponent = config.icon;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Strength Bar */}
      <div className="relative">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full transition-all duration-300", config.color)}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Strength Label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <IconComponent className={cn("w-4 h-4", {
            'text-gray-400': strength === 'empty',
            'text-red-500': strength === 'weak',
            'text-yellow-500': strength === 'medium',
            'text-blue-500': strength === 'strong',
            'text-green-500': strength === 'excellent'
          })} />
          <span className={cn("text-sm font-medium", {
            'text-gray-500': strength === 'empty',
            'text-red-600': strength === 'weak',
            'text-yellow-600': strength === 'medium',
            'text-blue-600': strength === 'strong',
            'text-green-600': strength === 'excellent'
          })}>
            {config.label}
          </span>
        </div>
        
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {Math.round(score)}%
        </span>
      </div>
    </div>
  );
};

/**
 * ✅ Password Checks List
 */
const ChecksList = ({ checks, suggestions, compact = false }) => {
  const { t } = useTranslation('auth');

  const checkItems = [
    { key: 'length', label: t('password.checks.length', { fallback: 'At least 8 characters' }) },
    { key: 'uppercase', label: t('password.checks.uppercase', { fallback: 'Uppercase letter' }) },
    { key: 'lowercase', label: t('password.checks.lowercase', { fallback: 'Lowercase letter' }) },
    { key: 'numbers', label: t('password.checks.numbers', { fallback: 'Number' }) },
    { key: 'symbols', label: t('password.checks.symbols', { fallback: 'Special character' }) },
    { key: 'noSequential', label: t('password.checks.noSequential', { fallback: 'No sequential characters' }) },
    { key: 'noRepeating', label: t('password.checks.noRepeating', { fallback: 'No repeating characters' }) }
  ];

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-1 text-xs">
        {checkItems.slice(0, 4).map(({ key, label }) => (
          <div key={key} className={cn("flex items-center space-x-1", {
            'text-green-600': checks[key],
            'text-gray-400': !checks[key]
          })}>
            {checks[key] ? (
              <Check className="w-3 h-3" />
            ) : (
              <X className="w-3 h-3" />
            )}
            <span className="truncate">{label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {checkItems.map(({ key, label }) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn("flex items-center space-x-2 text-sm", {
            'text-green-600': checks[key],
            'text-gray-400': !checks[key]
          })}
        >
          {checks[key] ? (
            <Check className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
          <span>{label}</span>
        </motion.div>
      ))}
    </div>
  );
};

/**
 * 🔐 Main Password Strength Component
 */
const PasswordStrength = ({ 
  password, 
  onAnalysisChange,
  showChecks = true,
  compact = false,
  className = '' 
}) => {
  const analysis = useMemo(() => analyzePassword(password), [password]);

  // Avoid invoking parent setState during render phase
  useEffect(() => {
    if (onAnalysisChange) {
      onAnalysisChange(analysis);
    }
  }, [analysis, onAnalysisChange]);

  const { score, strength, checks, suggestions } = analysis;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Strength Meter */}
      <StrengthMeter score={score} strength={strength} />

      {/* Checks List */}
      {showChecks && (
        <ChecksList checks={checks} suggestions={suggestions} compact={compact} />
      )}

      {/* Suggestions (for non-compact mode) */}
      {!compact && suggestions.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p className="font-medium mb-1">Suggestions:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PasswordStrength;
export { analyzePassword, StrengthMeter, ChecksList }; 