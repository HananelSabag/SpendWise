/**
 * 🎉 NEW COMPLETION STEP - Simplified final step
 * No background loading; relies on footer Finish to complete.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, User, Repeat, DollarSign } from 'lucide-react';
import { useTranslation } from '../../../../stores';
import { Card } from '../../../ui';
import { cn } from '../../../../utils/helpers';

const NewCompletionStep = ({ data = {} }) => {
  const { isRTL, t } = useTranslation('onboarding');

  const profileData = data?.profileData || {};
  const selectedTemplates = data?.selectedTemplates || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-full flex items-center justify-center"
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      <div className="w-full max-w-2xl text-center">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-6 shadow-xl">
          <Sparkles className="w-12 h-12 text-white" />
        </div>

        <h1 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">
          {t('completion.readyTitle') || 'Ready to finish setup'}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          {t('completion.readySubtitle') || 'Review your summary and click Finish to complete.'}
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-4">
            <User className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold mb-1">{t('completion.profile') || 'Profile'}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {(profileData.firstName || '') + ' ' + (profileData.lastName || '')}
            </p>
          </Card>

          <Card className="p-4">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold mb-1">{t('completion.currency') || 'Currency'}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {profileData.currency || 'USD'}
            </p>
          </Card>

          <Card className="p-4">
            <Repeat className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold mb-1">{t('completion.recurring') || 'Recurring'}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedTemplates.length} {t('completion.templates') || 'templates'}
            </p>
          </Card>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
          {t('completion.footerHint') || 'Use the Finish button below to complete setup.'}
        </p>
      </div>
    </motion.div>
  );
};

export default NewCompletionStep;