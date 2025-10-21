/**
 * 🔍 Smart Logger Utility
 * Conditional logging based on environment
 * Production-safe with zero console.log calls
 * @version 1.0.0
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
const debugMode = isDevelopment && localStorage.getItem('debug') === 'true';

/**
 * Logger class with environment-aware logging
 */
class Logger {
  constructor(namespace = 'App') {
    this.namespace = namespace;
    this.enabled = isDevelopment;
  }

  /**
   * Debug logs - only in development with debug flag
   */
  debug(...args) {
    if (debugMode) {
      console.log(`[${this.namespace}]`, ...args);
    }
  }

  /**
   * Info logs - only in development
   */
  info(...args) {
    if (isDevelopment) {
      console.info(`ℹ️ [${this.namespace}]`, ...args);
    }
  }

  /**
   * Warning logs - always show
   */
  warn(...args) {
    console.warn(`⚠️ [${this.namespace}]`, ...args);
  }

  /**
   * Error logs - always show
   */
  error(...args) {
    console.error(`❌ [${this.namespace}]`, ...args);
  }

  /**
   * Success logs - only in development
   */
  success(...args) {
    if (isDevelopment) {
      console.log(`✅ [${this.namespace}]`, ...args);
    }
  }

  /**
   * Performance timing
   */
  time(label) {
    if (debugMode) {
      console.time(`[${this.namespace}] ${label}`);
    }
  }

  timeEnd(label) {
    if (debugMode) {
      console.timeEnd(`[${this.namespace}] ${label}`);
    }
  }

  /**
   * Group logs
   */
  group(label) {
    if (debugMode) {
      console.group(`[${this.namespace}] ${label}`);
    }
  }

  groupEnd() {
    if (debugMode) {
      console.groupEnd();
    }
  }

  /**
   * Table display
   */
  table(data) {
    if (debugMode) {
      console.table(data);
    }
  }
}

/**
 * Create logger instance for a namespace
 */
export const createLogger = (namespace) => new Logger(namespace);

/**
 * Default logger instance
 */
export const logger = new Logger('SpendWise');

/**
 * Specialized loggers
 */
export const apiLogger = new Logger('API');
export const authLogger = new Logger('Auth');
export const queryLogger = new Logger('Query');
export const routerLogger = new Logger('Router');

/**
 * No-op logger for production (completely silent)
 */
export const productionLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: (...args) => console.error(...args), // Keep errors in production
  success: () => {},
  time: () => {},
  timeEnd: () => {},
  group: () => {},
  groupEnd: () => {},
  table: () => {}
};

/**
 * Get appropriate logger based on environment
 */
export const getLogger = (namespace) => {
  return isDevelopment ? new Logger(namespace) : productionLogger;
};

export default logger;

