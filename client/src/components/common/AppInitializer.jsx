import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Wifi, CheckCircle, AlertCircle, Coffee, Clock } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { useLanguage } from '../../context/LanguageContext';

const AppInitializer = ({ children }) => {
  const { 
    appState, 
    serverStatus, 
    initializationStep, 
    coldStartDetected,
    isAppReady 
  } = useAppState();
  const { t } = useLanguage();

  // Show loading screen during initialization
  if (!isAppReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <AnimatePresence mode="wait">
            {appState === 'cold_start' && (
              <ColdStartScreen key="cold-start" serverStatus={serverStatus} />
            )}
            {appState === 'initializing' && (
              <InitializingScreen key="initializing" step={initializationStep} />
            )}
            {appState === 'error' && (
              <ErrorScreen key="error" />
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // App is ready - render main app
  return <>{children}</>;
};

// Cold start screen with helpful messaging
const ColdStartScreen = ({ serverStatus }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center"
    >
      <div className="mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center"
        >
          <Server className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </motion.div>
        
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Server Starting Up
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Our server is waking up from sleep mode. This takes about 30-60 seconds.
        </p>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Coffee className="w-4 h-4" />
            <span className="text-sm font-medium">
              Free hosting wakes up slowly - hang tight!
            </span>
          </div>
        </div>
      </div>

      <ServerStatusIndicator status={serverStatus} />
    </motion.div>
  );
};

// Regular initialization screen
const InitializingScreen = ({ step }) => {
  const steps = {
    auth: { icon: CheckCircle, label: 'Authenticating...', progress: 25 },
    server: { icon: Server, label: 'Connecting to server...', progress: 50 },
    data: { icon: Wifi, label: 'Loading your data...', progress: 75 },
    complete: { icon: CheckCircle, label: 'Almost ready!', progress: 100 }
  };

  const currentStep = steps[step] || steps.auth;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center"
      >
        <currentStep.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
      </motion.div>
      
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Loading SpendWise
      </h2>
      
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        {currentStep.label}
      </p>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${currentStep.progress}%` }}
          transition={{ duration: 0.5 }}
          className="bg-blue-600 h-2 rounded-full"
        />
      </div>
    </motion.div>
  );
};

// Error screen with retry option
const ErrorScreen = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center"
    >
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>
      
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Something went wrong
      </h2>
      
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Failed to initialize the app. Please try refreshing.
      </p>
      
      <button
        onClick={handleRetry}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Retry
      </button>
    </motion.div>
  );
};

// Server status indicator
const ServerStatusIndicator = ({ status }) => {
  const statusConfig = {
    checking: { color: 'yellow', label: 'Checking server...', pulse: true },
    cold: { color: 'red', label: 'Server sleeping', pulse: false },
    warming: { color: 'orange', label: 'Server warming up...', pulse: true },
    ready: { color: 'green', label: 'Server ready!', pulse: false }
  };

  const config = statusConfig[status] || statusConfig.checking;

  return (
    <div className="flex items-center justify-center gap-2">
      <div className={`w-3 h-3 rounded-full bg-${config.color}-500 ${config.pulse ? 'animate-pulse' : ''}`} />
      <span className="text-sm text-gray-600 dark:text-gray-300">
        {config.label}
      </span>
    </div>
  );
};

export default AppInitializer; 