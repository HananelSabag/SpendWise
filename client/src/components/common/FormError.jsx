// components/common/FormError.jsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * FormError Component
 * Displays form field errors with animation and icon
 * 
 * @param {string} message - Error message to display
 * @param {string} className - Additional CSS classes
 */
const FormError = ({ message, className = '' }) => {
  if (!message) return null;
  
  return (
    <div className={`mt-2 text-sm text-error flex items-start gap-1.5 animate-slideUp ${className} dark:text-red-400`}>
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
};

export default FormError;