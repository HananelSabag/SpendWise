/**
 * 🎯 MODAL CONTAINER - Enhanced with Zustand Integration
 * Features: Translation support, Theme awareness, Mobile-first design
 * @version 2.0.0
 */

import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

// ✅ NEW: Import Zustand stores (replaces Context API!)
import { useTranslation, useTheme } from '../../stores';

import Modal from './Modal';
import Card from './Card';
import { cn } from '../../utils/helpers';

const ModalContainer = ({ 
  title, 
  icon: Icon, 
  onClose, 
  children, 
  className = "",
  headerActions = null
}) => {
  // ✅ NEW: Zustand stores (replacing Context API)
  const { t, isRTL } = useTranslation();
  const { isDark } = useTheme();

  return (
    <Modal onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          'max-w-4xl w-full max-h-[90vh] overflow-hidden',
          isRTL && 'rtl',
          className
        )}
      >
        <Card variant="modalHeader" padding="default" className="rounded-t-xl">
          <div className={cn(
            'flex items-center justify-between',
            isRTL && 'flex-row-reverse'
          )}>
            <div className={cn(
              'flex items-center gap-3',
              isRTL && 'flex-row-reverse'
            )}>
              {Icon && <Icon className="w-6 h-6 text-white" />}
              <h2 className="text-xl font-bold text-white">{title}</h2>
            </div>
            <div className={cn(
              'flex items-center gap-2',
              isRTL && 'flex-row-reverse'
            )}>
              {headerActions}
              <button 
                onClick={onClose} 
                className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                aria-label={t('common.close', { fallback: 'Close' })}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </Card>
        
        <Card variant="modal" padding="adaptive" className="rounded-b-xl max-h-[calc(90vh-80px)] overflow-y-auto">
          {children}
        </Card>
      </motion.div>
    </Modal>
  );
};

export default ModalContainer; 