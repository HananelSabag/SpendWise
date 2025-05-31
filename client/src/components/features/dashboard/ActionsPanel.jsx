import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';

const ActionsPanel = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">{t('actions.title')}</h2>
      {/* Actions content */}
    </div>
  );
};

export default ActionsPanel;
