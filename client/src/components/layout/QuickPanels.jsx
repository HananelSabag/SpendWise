/**
 * 🎯 REVOLUTIONARY QUICK PANELS - Futuristic Command Center
 * Features: Holographic effects, Neural pathways, Quantum animations, Smart transitions
 * Revolutionary design with advanced spatial computing and fluid morphing
 * @version 4.0.0 - REVOLUTIONARY REDESIGN
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import {
  Layers,
  ChevronDown,
  Tag,
  Clock,
  Activity,
  Calculator,
  Sparkles,
  Zap,
  Brain,
  Eye,
  Grid3X3,
  Command
} from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation } from '../../stores';

import { cn } from '../../utils/helpers';

// 🌌 Holographic particles system
const HolographicParticles = ({ isActive }) => {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: i * 0.05,
    duration: 3 + Math.random() * 2,
    scale: 0.5 + Math.random() * 0.5
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full"
          initial={{ 
            x: "50%", 
            y: "50%",
            opacity: 0,
            scale: 0
          }}
          animate={isActive ? {
            x: [`50%`, `${Math.random() * 100}%`, `${Math.random() * 100}%`, `50%`],
            y: [`50%`, `${Math.random() * 100}%`, `${Math.random() * 100}%`, `50%`],
            opacity: [0, 1, 1, 0],
            scale: [0, particle.scale, particle.scale, 0]
          } : {}}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: isActive ? Infinity : 0,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

// 🧠 Neural network connections
const NeuralNetwork = ({ panels, activePanel }) => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
    {panels.map((_, index) => {
      const nextIndex = (index + 1) % panels.length;
      const isActive = activePanel === index || activePanel === nextIndex;
      
      return (
        <motion.path
          key={`neural-${index}`}
          d={`M${25 + (index % 2) * 50},${25 + Math.floor(index / 2) * 50} Q50,50 ${25 + (nextIndex % 2) * 50},${25 + Math.floor(nextIndex / 2) * 50}`}
          fill="none"
          stroke="url(#neuralGradient)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: isActive ? [0, 1, 0.7] : 0,
            opacity: isActive ? [0, 0.8, 0.4] : 0
          }}
          transition={{ 
            duration: 2, 
            repeat: isActive ? Infinity : 0,
            ease: "easeInOut"
          }}
        />
      );
    })}
    <defs>
      <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.6" />
        <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.6" />
      </linearGradient>
    </defs>
  </svg>
);

// 🚀 Revolutionary Panel Card
const RevolutionaryPanelCard = ({ panel, isActive, onHover, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = panel.icon;
  
  const colorMap = {
    blue: { 
      bg: 'from-blue-500/20 to-cyan-500/20', 
      border: 'border-blue-400/50',
      glow: 'shadow-blue-500/25',
      text: 'text-blue-600 dark:text-blue-400'
    },
    green: { 
      bg: 'from-green-500/20 to-emerald-500/20', 
      border: 'border-green-400/50',
      glow: 'shadow-green-500/25',
      text: 'text-green-600 dark:text-green-400'
    },
    orange: { 
      bg: 'from-orange-500/20 to-yellow-500/20', 
      border: 'border-orange-400/50',
      glow: 'shadow-orange-500/25',
      text: 'text-orange-600 dark:text-orange-400'
    }
  };
  
  const colors = colorMap[panel.color] || colorMap.blue;

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => {
        setIsHovered(true);
        onHover?.(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHover?.(false);
      }}
      whileHover={{ 
        scale: 1.05,
        y: -4,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative p-4 rounded-2xl text-left transition-all duration-300 group overflow-hidden min-h-[120px]",
        "backdrop-blur-xl border-2",
        "bg-gradient-to-br from-white/30 via-white/10 to-white/5",
        "dark:from-gray-800/30 dark:via-gray-800/10 dark:to-gray-900/5",
        isHovered ? colors.border : "border-white/20 dark:border-gray-600/20"
      )}
      style={{
        boxShadow: isHovered 
          ? `0 20px 40px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)`
          : "0 8px 16px -4px rgba(0, 0, 0, 0.1)"
      }}
    >
      {/* Holographic overlay */}
      <motion.div
        className={cn("absolute inset-0 bg-gradient-to-br rounded-2xl", colors.bg)}
        animate={{ opacity: isHovered ? 0.6 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Energy pulse ring */}
      <motion.div
        className="absolute inset-0 rounded-2xl border-2 border-transparent"
        animate={isHovered ? {
          borderColor: [`transparent`, colors.border.replace('border-', '').replace('/50', ''), `transparent`],
          scale: [1, 1.05, 1]
        } : {}}
        transition={{ duration: 2, repeat: isHovered ? Infinity : 0 }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Icon container with quantum effects */}
        <motion.div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center mb-3 relative overflow-hidden",
            "bg-gradient-to-br from-white/50 to-white/20 dark:from-gray-700/50 dark:to-gray-800/20",
            "border border-white/30 dark:border-gray-600/30"
          )}
          animate={{
            boxShadow: isHovered 
              ? `0 0 30px ${colors.glow.replace('shadow-', '').replace('/25', '')}`
              : "0 4px 8px rgba(0, 0, 0, 0.1)"
          }}
        >
          {/* Quantum particle effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={isHovered ? {
              x: ["-100%", "100%"],
              opacity: [0, 1, 0]
            } : {}}
            transition={{ 
              duration: 1.5, 
              repeat: isHovered ? Infinity : 0,
              repeatDelay: 0.5
            }}
          />
          
          <Icon className={cn("w-6 h-6 relative z-10", colors.text)} />
        </motion.div>
        
        {/* Text content with morphing effects */}
        <motion.div 
          className="flex-1 flex flex-col justify-between"
          animate={{ y: isHovered ? -2 : 0 }}
        >
          <motion.h4 
            className="font-bold text-sm text-gray-900 dark:text-white mb-2 leading-tight"
            animate={{ 
              scale: isHovered ? 1.02 : 1,
              color: isHovered ? colors.text.replace('text-', '').replace(' dark:text-', '') : undefined
            }}
          >
            {panel.name}
          </motion.h4>
          
          <motion.p 
            className="text-xs text-gray-500 dark:text-gray-400 opacity-80"
            animate={{ opacity: isHovered ? 1 : 0.8 }}
          >
            {panel.description}
          </motion.p>
        </motion.div>
        
        {/* Status indicator */}
        <motion.div
          className="absolute top-3 right-3 w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
          animate={{
            scale: isHovered ? [1, 1.5, 1] : 1,
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            scale: { duration: 0.3 },
            opacity: { duration: 2, repeat: Infinity }
          }}
        />
      </div>
    </motion.button>
  );
};

/**
 * 🚀 Revolutionary Quick Panels Command Center
 */
const QuickPanels = ({ 
  onOpenModal,
  className = '' 
}) => {
  const { t, isRTL } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [activePanel, setActivePanel] = useState(-1);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  
  const buttonRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // ✅ Revolutionary Quick panel items with enhanced metadata
  const quickPanels = [
    {
      name: t('common.categoryManager', { fallback: t('common.categories') }),
      description: t('common.manageCategoriesDesc'),
      icon: Tag,
      color: 'blue',
      shortcut: 'Ctrl+C',
      onClick: () => {
        onOpenModal?.('categories');
        setShowDropdown(false);
      }
    },
    {
      name: t('common.recurringManager', { fallback: t('common.recurring') }),
      description: t('common.recurringTransactionsDesc'),
      icon: Clock,
      color: 'green',
      shortcut: 'Ctrl+R',
      onClick: () => {
        onOpenModal?.('recurring');
        setShowDropdown(false);
      }
    },
    {
      name: t('common.calculator'),
      description: t('common.quickCalculatorDesc'),
      icon: Calculator,
      color: 'orange',
      shortcut: 'Ctrl+K',
      onClick: () => {
        onOpenModal?.('exchange');
        setShowDropdown(false);
      }
    }
  ];

  // Magnetic button effect
  const handleMouseMove = (e) => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    mouseX.set((e.clientX - centerX) / rect.width);
    mouseY.set((e.clientY - centerY) / rect.height);
  };

  const handleMouseLeave = () => {
    setIsButtonHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  // ✅ Close dropdown when clicking outside
  const handleBackdropClick = useCallback(() => {
    setShowDropdown(false);
    setActivePanel(-1);
  }, []);

  return (
    <div className={cn("hidden lg:block relative", className)}>
      {/* Revolutionary Command Center Button */}
      <motion.button
        ref={buttonRef}
        onClick={() => setShowDropdown(!showDropdown)}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsButtonHovered(true)}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative inline-flex items-center px-4 py-3 text-sm font-medium rounded-2xl",
          "backdrop-blur-xl bg-gradient-to-r from-white/40 via-white/20 to-white/10",
          "dark:from-gray-800/40 dark:via-gray-800/20 dark:to-gray-900/10",
          "border border-white/30 dark:border-gray-600/30",
          "transition-all duration-300 overflow-hidden min-h-[44px]",
          "hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/25"
        )}
        style={{
          transform: `rotateX(${mouseY.get() * 5}deg) rotateY(${mouseX.get() * 5}deg)`
        }}
        aria-expanded={showDropdown}
        aria-haspopup="true"
      >
        {/* Holographic background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"
          animate={{ opacity: isButtonHovered ? 0.6 : 0 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Energy pulse effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={isButtonHovered ? {
            x: ["-100%", "100%"]
          } : {}}
          transition={{ duration: 1.5, repeat: isButtonHovered ? Infinity : 0 }}
        />
        
        {/* Content */}
        <div className="relative z-10 flex items-center">
          <motion.div
            className="w-6 h-6 mr-3 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
            animate={{
              rotate: showDropdown ? 180 : 0,
              boxShadow: isButtonHovered 
                ? "0 0 20px rgba(59, 130, 246, 0.6)"
                : "0 2px 4px rgba(0, 0, 0, 0.1)"
            }}
          >
            <Grid3X3 className="w-3 h-3 text-white" />
          </motion.div>
          
          <motion.span 
            className="bg-gradient-to-r from-gray-700 to-gray-900 dark:from-white dark:to-gray-300 bg-clip-text text-transparent font-bold"
            animate={{ x: isButtonHovered ? 2 : 0 }}
          >
            {t('common.quickPanels')}
          </motion.span>
          
          <motion.div
            animate={{ 
              rotate: showDropdown ? 180 : 0,
              x: isButtonHovered ? 4 : 0
            }}
            transition={{ duration: 0.3 }}
            className="ml-2"
          >
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </motion.div>
        </div>
        
        {/* Border animation */}
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-transparent"
          animate={isButtonHovered ? {
            borderImage: [
              "linear-gradient(0deg, transparent, rgba(59, 130, 246, 0.5), transparent) 1",
              "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent) 1",
              "linear-gradient(180deg, transparent, rgba(59, 130, 246, 0.5), transparent) 1",
              "linear-gradient(270deg, transparent, rgba(59, 130, 246, 0.5), transparent) 1"
            ]
          } : {}}
          transition={{ duration: 2, repeat: isButtonHovered ? Infinity : 0 }}
        />
      </motion.button>

      {/* Revolutionary Command Center Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <>
            {/* Enhanced backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 backdrop-blur-sm bg-black/10"
              onClick={handleBackdropClick}
            />
            
            {/* Futuristic Command Center Panel */}
            <motion.div
              initial={{ 
                opacity: 0, 
                y: -20, 
                scale: 0.9,
                rotateX: -15
              }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                rotateX: 0
              }}
              exit={{ 
                opacity: 0, 
                y: -20, 
                scale: 0.9,
                rotateX: -15
              }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: 0.4
              }}
              className={cn(
                "absolute mt-4 w-96 z-40 overflow-hidden",
                "backdrop-blur-2xl bg-gradient-to-br from-white/30 via-white/10 to-white/5",
                "dark:from-gray-800/30 dark:via-gray-800/10 dark:to-gray-900/5",
                "border border-white/30 dark:border-gray-600/30",
                "rounded-3xl shadow-2xl",
                isRTL ? "left-0" : "right-0"
              )}
              style={{
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)"
              }}
            >
              {/* Holographic particles */}
              <HolographicParticles isActive={showDropdown} />
              
              {/* Neural network background */}
              <NeuralNetwork panels={quickPanels} activePanel={activePanel} />
              
              {/* Command center content */}
              <div className="relative z-10 p-6">
                {/* Futuristic header */}
                <motion.div 
                  className="flex items-center mb-6"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <motion.div
                    className="w-8 h-8 mr-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center"
                    animate={{
                      boxShadow: [
                        "0 0 20px rgba(6, 182, 212, 0.4)",
                        "0 0 30px rgba(6, 182, 212, 0.6)",
                        "0 0 20px rgba(6, 182, 212, 0.4)"
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Command className="w-4 h-4 text-white" />
                  </motion.div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    {t('common.quickPanels')}
                  </h3>
                  <motion.div
                    className="ml-auto w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>

                {/* Revolutionary panels grid */}
                <motion.div 
                  className="grid grid-cols-2 gap-4 mb-6"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1,
                        delayChildren: 0.2
                      }
                    }
                  }}
                  initial="hidden"
                  animate="visible"
                >
                  {quickPanels.map((panel, index) => (
                    <motion.div
                      key={panel.name}
                      variants={{
                        hidden: { opacity: 0, scale: 0.8, y: 20 },
                        visible: { 
                          opacity: 1, 
                          scale: 1, 
                          y: 0,
                          transition: { type: "spring", stiffness: 300, damping: 20 }
                        }
                      }}
                    >
                      <RevolutionaryPanelCard
                        panel={panel}
                        isActive={activePanel === index}
                        onHover={(isHovered) => {
                          if (isHovered) {
                            setActivePanel(index);
                          } else {
                            setActivePanel(-1);
                          }
                        }}
                        onClick={panel.onClick}
                      />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Futuristic footer with system status */}
                <motion.div 
                  className="pt-4 border-t border-white/20 dark:border-gray-600/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <Brain className="w-3 h-3 mr-1" />
                      <span>{t('common.quickPanelsTip')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-green-500 text-xs font-mono">ONLINE</span>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Ambient light effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-radial from-blue-500/10 via-transparent to-transparent pointer-events-none"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickPanels; 