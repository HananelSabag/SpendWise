// components/common/FormError.jsx
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../utils/helpers';

const FormError = ({ message, className = '' }) => {
  if (!message) return null;
  
  return (
    <div className={cn(
      'mt-2 text-sm text-red-500 dark:text-red-400 flex items-start gap-1.5 animate-fadeIn',
      className
    )}>
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
};

export default FormError;