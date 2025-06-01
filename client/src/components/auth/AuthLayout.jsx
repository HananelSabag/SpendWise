// client/src/components/auth/AuthLayout.jsx

import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { Shield, Zap, TrendingUp } from 'lucide-react';

const AuthLayout = ({ children }) => {
  const { t } = useLanguage();
  
  // Animation variants for features section
  const featureVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-primary-600 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
            {t('auth.welcomeBack')}
          </h1>
          <p className="mt-2 text-lg sm:text-xl text-primary-100">
            {t('auth.loginSubtitle')}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow flex items-center justify-center">
        <div className="max-w-md w-full px-4 sm:px-6 lg:px-8 py-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          {children}
        </div>
      </div>

      {/* Features Section - New Additions */}
      <div className="bg-primary-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              {t('auth.features.title')}
            </h2>
            <p className="text-xl text-primary-100">
              {t('auth.features.subtitle')}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 - Security */}
            <motion.div
              variants={featureVariants}
              className="text-center"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-4 inline-block">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {t('auth.features.secure')}
              </h3>
              <p className="text-primary-100">
                {t('auth.features.secureDesc')}
              </p>
            </motion.div>

            {/* Feature 2 - Speed */}
            <motion.div
              variants={featureVariants}
              className="text-center"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-4 inline-block">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {t('auth.features.fast')}
              </h3>
              <p className="text-primary-100">
                {t('auth.features.fastDesc')}
              </p>
            </motion.div>

            {/* Feature 3 - Analytics */}
            <motion.div
              variants={featureVariants}
              className="text-center"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-4 inline-block">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {t('auth.features.smart')}
              </h3>
              <p className="text-primary-100">
                {t('auth.features.smartDesc')}
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;