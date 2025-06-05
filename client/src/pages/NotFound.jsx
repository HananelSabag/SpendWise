import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search, HelpCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/ui/Button';
import { cn } from '../utils/helpers';

const NotFound = () => {
  const { t, language } = useLanguage();
  const isRTL = language === 'he';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md w-full"
      >
        {/* 404 Number */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-9xl font-bold text-primary-600 dark:text-primary-400 mb-4">
            404
          </h1>
          <div className="w-24 h-1 bg-primary-600 dark:bg-primary-400 mx-auto rounded-full" />
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('notFound.title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            {t('notFound.message')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {t('notFound.suggestion')}
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-4"
        >
          {/* Primary Action - Home */}
          <Link to="/">
            <Button
              variant="primary"
              size="large"
              fullWidth
              className="py-3 px-6 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              <Home className={cn(
                'w-5 h-5',
                isRTL ? 'ml-2' : 'mr-2'
              )} />
              {t('notFound.goHome')}
            </Button>
          </Link>

          {/* Secondary Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="large"
              fullWidth
              onClick={() => window.history.back()}
              className="flex-1"
            >
              <ArrowLeft className={cn(
                'w-5 h-5',
                isRTL ? 'ml-2 rotate-180' : 'mr-2'
              )} />
              {t('common.goBack')}
            </Button>
            
            <Link to="/transactions" className="flex-1">
              <Button
                variant="outline"
                size="large"
                fullWidth
              >
                <Search className={cn(
                  'w-5 h-5',
                  isRTL ? 'ml-2' : 'mr-2'
                )} />
                {t('nav.transactions')}
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-8 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm"
        >
          <div className="flex items-center justify-center mb-2">
            <HelpCircle className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('notFound.needHelp')}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {t('notFound.helpMessage')}
          </p>
        </motion.div>

        {/* Floating Animation Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="absolute top-20 left-10 w-32 h-32 bg-primary-400 rounded-full blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.1, scale: 1 }}
            transition={{ delay: 0.7, duration: 1 }}
            className="absolute bottom-20 right-10 w-24 h-24 bg-primary-600 rounded-full blur-3xl"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
