// components/common/LanguageSwitcher.jsx
import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../ui/Button';

const LanguageSwitcher = ({ variant = 'ghost', size = 'default' }) => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleLanguage}
      icon={Languages}
      title={t('floatingMenu.changeLanguage')}
    >
      {language === 'he' ? 'EN' : 'עב'}
    </Button>
  );
};

export default LanguageSwitcher;