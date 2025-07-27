/**
 * 🎛️ APP STORE - Global Application State
 * Replaces AppStateContext.jsx, ThemeContext.jsx, AccessibilityContext.jsx
 * Features: Theme management, Accessibility, Currency, Date preferences
 * @version 2.0.0
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ✅ Theme Configuration
export const THEMES = {
  light: {
    name: 'Light',
    class: '',
    colors: {
      primary: '#3B82F6',
      background: '#FFFFFF',
      surface: '#F8FAFC',
      text: '#1E293B'
    }
  },
  dark: {
    name: 'Dark',
    class: 'dark',
    colors: {
      primary: '#60A5FA',
      background: '#0F172A',
      surface: '#1E293B',
      text: '#F8FAFC'
    }
  },
  auto: {
    name: 'Auto',
    class: 'auto',
    description: 'Follows system preference'
  }
};

// ✅ Currency Configuration
export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  ILS: { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
};

// ✅ Date Format Configuration
export const DATE_FORMATS = {
  'MM/DD/YYYY': { format: 'MM/DD/YYYY', example: '12/31/2023', locale: 'en-US' },
  'DD/MM/YYYY': { format: 'DD/MM/YYYY', example: '31/12/2023', locale: 'en-GB' },
  'YYYY-MM-DD': { format: 'YYYY-MM-DD', example: '2023-12-31', locale: 'sv-SE' },
  'DD.MM.YYYY': { format: 'DD.MM.YYYY', example: '31.12.2023', locale: 'de-DE' }
};

// ✅ App Store
export const useAppStore = create(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // ✅ Theme State
        theme: 'auto',
        currentTheme: 'light', // Resolved theme (light/dark)
        systemTheme: 'light',
        customThemes: {},
        
        // ✅ Accessibility State
        accessibility: {
          fontSize: 'medium', // small, medium, large, xl
          contrast: 'normal', // normal, high
          reducedMotion: false,
          screenReader: false,
          keyboardNavigation: true,
          focusVisible: true,
          announcements: true
        },
        
        // ✅ Currency State
        currency: 'USD',
        currencyPosition: 'before', // before, after
        decimalPlaces: 2,
        thousandSeparator: ',',
        decimalSeparator: '.',
        
        // ✅ Date/Time State
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h', // 12h, 24h
        weekStart: 'sunday', // sunday, monday
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        
        // ✅ UI State
        sidebarCollapsed: false,
        pageTitle: 'SpendWise',
        notifications: [],
        modals: [],
        loading: {
          global: false,
          operations: new Set()
        },
        
        // ✅ Performance State
        performanceMode: 'auto', // auto, high, battery
        animationsEnabled: true,
        precacheEnabled: true,
        
        // ✅ App Actions
        actions: {
          // Theme management
          setTheme: (theme) => {
            if (!THEMES[theme]) return false;
            
            set((state) => {
              state.theme = theme;
            });
            
            get().actions.updateResolvedTheme();
            return true;
          },

          setSystemTheme: (systemTheme) => {
            set((state) => {
              state.systemTheme = systemTheme;
            });
            
            get().actions.updateResolvedTheme();
          },

          updateResolvedTheme: () => {
            const { theme, systemTheme } = get();
            const resolvedTheme = theme === 'auto' ? systemTheme : theme;
            
            set((state) => {
              state.currentTheme = resolvedTheme;
            });
            
            // Update document class
            if (typeof document !== 'undefined') {
              document.documentElement.className = resolvedTheme === 'dark' ? 'dark' : '';
            }
          },

          // Accessibility management
          updateAccessibility: (updates) => {
            set((state) => {
              Object.assign(state.accessibility, updates);
            });
            
            get().actions.applyAccessibilitySettings();
          },

          applyAccessibilitySettings: () => {
            const { accessibility } = get();
            
            if (typeof document !== 'undefined') {
              const root = document.documentElement;
              
              // Font size
              root.style.setProperty('--font-size-scale', {
                'small': '0.875',
                'medium': '1',
                'large': '1.125',
                'xl': '1.25'
              }[accessibility.fontSize] || '1');
              
              // Reduced motion
              root.style.setProperty('--motion-reduce', accessibility.reducedMotion ? '1' : '0');
              
              // High contrast
              if (accessibility.contrast === 'high') {
                root.classList.add('high-contrast');
              } else {
                root.classList.remove('high-contrast');
              }
              
              // Focus visible
              if (accessibility.focusVisible) {
                root.classList.add('focus-visible');
              } else {
                root.classList.remove('focus-visible');
              }
            }
          },

          // Currency management
          setCurrency: (currencyCode) => {
            if (!CURRENCIES[currencyCode]) return false;
            
            set((state) => {
              state.currency = currencyCode;
            });
            
            return true;
          },

          updateCurrencyFormat: (updates) => {
            set((state) => {
              Object.assign(state, updates);
            });
          },

          formatCurrency: (amount, options = {}) => {
            const {
              currency,
              currencyPosition,
              decimalPlaces,
              thousandSeparator,
              decimalSeparator
            } = get();
            
            const {
              currency: overrideCurrency = currency,
              showSymbol = true,
              compact = false
            } = options;
            
            const currencyData = CURRENCIES[overrideCurrency];
            if (!currencyData) return amount.toString();
            
            // Format number
            let formatted = parseFloat(amount).toFixed(decimalPlaces);
            
            // Add separators
            const parts = formatted.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
            formatted = parts.join(decimalSeparator);
            
            // Add currency symbol
            if (showSymbol) {
              const symbol = currencyData.symbol;
              formatted = currencyPosition === 'before' 
                ? `${symbol}${formatted}` 
                : `${formatted} ${symbol}`;
            }
            
            return formatted;
          },

          // Date management
          setDateFormat: (format) => {
            if (!DATE_FORMATS[format]) return false;
            
            set((state) => {
              state.dateFormat = format;
            });
            
            return true;
          },

          formatDate: (date, options = {}) => {
            const { dateFormat, timeFormat } = get();
            const { includeTime = false, format = dateFormat } = options;
            
            const dateObj = new Date(date);
            const formatConfig = DATE_FORMATS[format];
            
            if (!formatConfig) return dateObj.toLocaleDateString();
            
            let formatted = dateObj.toLocaleDateString(formatConfig.locale);
            
            if (includeTime) {
              const timeOptions = { 
                hour12: timeFormat === '12h',
                hour: '2-digit',
                minute: '2-digit'
              };
              formatted += ` ${dateObj.toLocaleTimeString(formatConfig.locale, timeOptions)}`;
            }
            
            return formatted;
          },

          // UI State management
          setSidebarCollapsed: (collapsed) => {
            set((state) => {
              state.sidebarCollapsed = collapsed;
            });
          },

          setPageTitle: (title) => {
            set((state) => {
              state.pageTitle = title;
            });
            
            if (typeof document !== 'undefined') {
              document.title = `${title} | SpendWise`;
            }
          },

          // Loading management
          setGlobalLoading: (loading) => {
            set((state) => {
              state.loading.global = loading;
            });
          },

          addLoadingOperation: (operation) => {
            set((state) => {
              state.loading.operations.add(operation);
            });
          },

          removeLoadingOperation: (operation) => {
            set((state) => {
              state.loading.operations.delete(operation);
            });
          },

          isLoading: (operation = null) => {
            const { loading } = get();
            return operation ? loading.operations.has(operation) : loading.global;
          },

          // Notification management
          addNotification: (notification) => {
            const id = Date.now().toString();
            const newNotification = {
              id,
              type: 'info',
              autoHide: true,
              duration: 5000,
              ...notification,
              timestamp: Date.now()
            };
            
            set((state) => {
              state.notifications.push(newNotification);
            });
            
            // Auto-remove if enabled
            if (newNotification.autoHide) {
              setTimeout(() => {
                get().actions.removeNotification(id);
              }, newNotification.duration);
            }
            
            return id;
          },

          removeNotification: (id) => {
            set((state) => {
              state.notifications = state.notifications.filter(n => n.id !== id);
            });
          },

          clearNotifications: () => {
            set((state) => {
              state.notifications = [];
            });
          },

          // Performance management
          setPerformanceMode: (mode) => {
            set((state) => {
              state.performanceMode = mode;
              
              // Adjust settings based on mode
              if (mode === 'battery') {
                state.animationsEnabled = false;
                state.precacheEnabled = false;
              } else if (mode === 'high') {
                state.animationsEnabled = true;
                state.precacheEnabled = true;
              }
            });
          },

          // Reset to defaults
          resetToDefaults: () => {
            set((state) => {
              state.theme = 'auto';
              state.accessibility = {
                fontSize: 'medium',
                contrast: 'normal',
                reducedMotion: false,
                screenReader: false,
                keyboardNavigation: true,
                focusVisible: true,
                announcements: true
              };
              state.currency = 'USD';
              state.dateFormat = 'MM/DD/YYYY';
              state.timeFormat = '12h';
              state.performanceMode = 'auto';
              state.animationsEnabled = true;
              state.precacheEnabled = true;
            });
            
            get().actions.updateResolvedTheme();
            get().actions.applyAccessibilitySettings();
          }
        }
      })),
      {
        name: 'spendwise-app',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          theme: state.theme,
          accessibility: state.accessibility,
          currency: state.currency,
          currencyPosition: state.currencyPosition,
          decimalPlaces: state.decimalPlaces,
          thousandSeparator: state.thousandSeparator,
          decimalSeparator: state.decimalSeparator,
          dateFormat: state.dateFormat,
          timeFormat: state.timeFormat,
          weekStart: state.weekStart,
          timezone: state.timezone,
          sidebarCollapsed: state.sidebarCollapsed,
          performanceMode: state.performanceMode,
          animationsEnabled: state.animationsEnabled,
          precacheEnabled: state.precacheEnabled
        })
      }
    )
  )
);

// ✅ Selectors
export const appSelectors = {
  theme: (state) => state.currentTheme,
  isDark: (state) => state.currentTheme === 'dark',
  accessibility: (state) => state.accessibility,
  currency: (state) => state.currency,
  dateFormat: (state) => state.dateFormat,
  isLoading: (state) => state.loading.global,
  notifications: (state) => state.notifications
};

// ✅ Convenience hooks
export const useTheme = () => useAppStore((state) => ({
  theme: state.currentTheme,
  isDark: state.currentTheme === 'dark',
  setTheme: state.actions.setTheme
}));

export const useAccessibility = () => useAppStore((state) => ({
  accessibility: state.accessibility,
  updateAccessibility: state.actions.updateAccessibility
}));

export const useCurrency = () => useAppStore((state) => ({
  currency: state.currency,
  formatCurrency: state.actions.formatCurrency,
  setCurrency: state.actions.setCurrency
}));

export const useNotifications = () => useAppStore((state) => ({
  notifications: state.notifications,
  addNotification: state.actions.addNotification,
  removeNotification: state.actions.removeNotification,
  clearNotifications: state.actions.clearNotifications
}));

// ✅ Initialize app store
if (typeof window !== 'undefined') {
  const store = useAppStore.getState();
  
  // Detect system theme
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  store.actions.setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
  
  // Listen for system theme changes
  mediaQuery.addEventListener('change', (e) => {
    store.actions.setSystemTheme(e.matches ? 'dark' : 'light');
  });
  
  // Apply initial settings
  store.actions.updateResolvedTheme();
  store.actions.applyAccessibilitySettings();
  
  // Debug logging
  if (import.meta.env.VITE_DEBUG_MODE === 'true') {
    useAppStore.subscribe(
      (state) => state.currentTheme,
      (theme) => {
        console.log('🎨 Theme changed to:', theme);
      }
    );
  }
}

export default useAppStore; 