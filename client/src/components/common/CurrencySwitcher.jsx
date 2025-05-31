// components/common/CurrencySwitcher.jsx
import React from 'react';
import { DollarSign } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../ui/Button';

const CurrencySwitcher = ({ variant = 'ghost', size = 'default' }) => {
  const { currency, toggleCurrency } = useCurrency();
  const { t } = useLanguage();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleCurrency}
      icon={DollarSign}
      title={t('floatingMenu.switchCurrency')}
    >
      {currency}
    </Button>
  );
};

export default CurrencySwitcher;