import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from './Modal';
import Card from './Card';

const ModalContainer = ({ 
  title, 
  icon: Icon, 
  onClose, 
  children, 
  className = "",
  headerActions = null
}) => (
  <Modal onClose={onClose}>
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`max-w-4xl w-full max-h-[90vh] overflow-hidden ${className}`}
    >
      <Card variant="modalHeader" padding="default" className="rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="w-6 h-6 text-white" />}
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
            <button 
              onClick={onClose} 
              className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
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

export default ModalContainer; 