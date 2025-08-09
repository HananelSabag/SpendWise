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
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  ILS: { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', flag: '🇮🇱' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' }
};

// ✅ Date Management State
export const DATE_FORMATS = {
  'MM/DD/YYYY': { locale: 'en-US', format: 'MM/DD/YYYY' },
  'DD/MM/YYYY': { locale: 'en-GB', format: 'DD/MM/YYYY' },
  'YYYY-MM-DD': { locale: 'sv-SE', format: 'YYYY-MM-DD' },
  'DD.MM.YYYY': { locale: 'de-DE', format: 'DD.MM.YYYY' }
};

// ✅ Time Formats
export const TIME_FORMATS = {
  '12h': '12-hour',
  '24h': '24-hour'
};

// ✅ App Store - Complete Application State Management
export const useAppStore = create(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // ✅ Date Management
        selectedDate: new Date().toISOString().split('T')[0], // Today in YYYY-MM-DD format
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',

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
        currency: 'ILS', // Default to Israeli Shekel to match user expectations
        currencyPosition: 'before', // before, after
        decimalPlaces: 2,
        thousandSeparator: ',',
        decimalSeparator: '.',
        // Exchange rates cache (base USD)
        exchangeRates: {}, // map of currency code -> rate against USD
        exchangeRatesBase: 'USD',
        exchangeRatesUpdatedAt: 0,
        exchangeRatesBackoffUntil: 0,
        exchangeRatesLastError: null,
        // Available currencies list for selectors/UI
        availableCurrencies: Object.values(CURRENCIES),
        
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
            
            // ✅ FIXED: Properly toggle dark class without removing other classes
            if (typeof document !== 'undefined') {
              if (resolvedTheme === 'dark') {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
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
            // ✅ FIXED: Map user preference values to currency codes
            const currencyMapping = {
              'shekel': 'ILS',
              'dollar': 'USD',
              'euro': 'EUR',
              'pound': 'GBP',
              'yen': 'JPY'
            };
            
            // Map preference to actual currency code
            const mappedCurrency = currencyMapping[currencyCode] || currencyCode;
            
            if (!CURRENCIES[mappedCurrency]) return false;
            
            set((state) => {
              state.currency = mappedCurrency;
            });
            
            return true;
          },

          updateCurrencyFormat: (updates) => {
            set((state) => {
              Object.assign(state, updates);
            });
          },

          formatCurrency: (amount, options = {}) => {
            // Backward compatibility: allow passing currency code as second positional arg
            let resolvedOptions = options;
            if (typeof options === 'string') {
              resolvedOptions = { currency: options };
            } else if (options == null || typeof options !== 'object') {
              resolvedOptions = {};
            }
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
            } = resolvedOptions;
            
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

          // Exchange rates: fetch and compute
          updateExchangeRates: async () => {
            const now = Date.now();
            const { exchangeRatesBackoffUntil, exchangeRatesBase } = get();
            if (exchangeRatesBackoffUntil && now < exchangeRatesBackoffUntil) {
              return false; // respect backoff, avoid spamming
            }

            const base = exchangeRatesBase || 'USD';
            const providers = [
              `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}`,
              `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`
            ];
            let attempt = 0;
            const maxAttempts = 2;
            let lastError = null;
            while (attempt < maxAttempts) {
              try {
                // Try providers in order
                let success = false;
                for (const url of providers) {
                  const res = await fetch(url);
                  if (!res.ok) {
                    lastError = new Error(`Failed to fetch exchange rates from provider: ${url}`);
                    continue;
                  }
                  const data = await res.json();
                  let rates = null;
                  if (data && typeof data === 'object') {
                    if (data.rates && typeof data.rates === 'object') {
                      rates = data.rates;
                    } else if (data.result === 'success' && data.rates && typeof data.rates === 'object') {
                      rates = data.rates;
                    }
                  }
                  if (rates && Object.keys(rates).length > 0) {
                    set((state) => {
                      state.exchangeRates = rates;
                      state.exchangeRatesUpdatedAt = Date.now();
                      state.exchangeRatesLastError = null;
                      state.exchangeRatesBackoffUntil = 0;
                    });
                    success = true;
                    break;
                  }
                }
                if (success) return true;
                throw new Error('Invalid rates response');
              } catch (e) {
                lastError = e;
                attempt += 1;
                if (attempt < maxAttempts) {
                  await new Promise((r) => setTimeout(r, 1000 * attempt));
                }
              }
            }
            // Set backoff for 5 minutes to prevent loops; don't throw
            set((state) => {
              state.exchangeRatesLastError = lastError ? String(lastError.message || lastError) : 'Unknown error';
              state.exchangeRatesBackoffUntil = Date.now() + 5 * 60 * 1000;
            });
            if (import.meta.env.DEV) {
              console.warn('updateExchangeRates error:', lastError);
            }
            return false;
          },

          getExchangeRate: async (fromCurrency, toCurrency) => {
            if (!fromCurrency || !toCurrency) return 0;
            if (fromCurrency === toCurrency) return 1;
            const { exchangeRates, exchangeRatesUpdatedAt, exchangeRatesBase, exchangeRatesBackoffUntil } = get();
            const isStale = Date.now() - (exchangeRatesUpdatedAt || 0) > 12 * 60 * 60 * 1000; // 12h
            if (!exchangeRates || Object.keys(exchangeRates).length === 0 || isStale) {
              await get().actions.updateExchangeRates();
            }
            const rates = get().exchangeRates;
            const base = exchangeRatesBase || 'USD';
            // rates map is base -> X. Example: USD->EUR = rates['EUR']
            // To compute A->B: (base->B) / (base->A)
            const toRate = rates[toCurrency];
            const fromRate = rates[fromCurrency];
            if (!toRate || !fromRate) {
              // Respect backoff to avoid loops
              const now = Date.now();
              if (!exchangeRatesBackoffUntil || now >= exchangeRatesBackoffUntil) {
                await get().actions.updateExchangeRates();
              }
              const r2 = get().exchangeRates;
              const t2 = r2[toCurrency];
              const f2 = r2[fromCurrency];
              if (!t2 || !f2) {
                throw new Error(`Exchange rates temporarily unavailable. Please try again later.`);
              }
              return t2 / f2;
            }
            return toRate / fromRate;
          },

          // ✅ Guest preference management (session-only storage)
          initializeGuestPreferences: () => {
            try {
              const guestPrefs = sessionStorage.getItem('spendwise-guest-preferences');
              if (guestPrefs) {
                const parsed = JSON.parse(guestPrefs);
                
                // Apply guest preferences to stores
                if (parsed.theme && THEMES[parsed.theme]) {
                  get().actions.setTheme(parsed.theme);
                }
                if (parsed.currency && CURRENCIES[parsed.currency]) {
                  get().actions.setCurrency(parsed.currency);
                }
                
                console.log('✅ Guest preferences loaded from session:', parsed);
              } else {
                // Set default guest preferences
                get().actions.setGuestDefaults();
              }
            } catch (error) {
              console.warn('Failed to load guest preferences, using defaults:', error);
              get().actions.setGuestDefaults();
            }
          },

          setGuestDefaults: () => {
            // Apply the same defaults as for new users
            get().actions.setTheme('system');
            get().actions.setCurrency('ILS');
            
            // Save defaults to session storage
            get().actions.saveGuestPreferences();
            
            console.log('✅ Guest default preferences applied');
          },

          saveGuestPreferences: () => {
            try {
              const { theme, currency } = get();
              const guestPrefs = {
                theme,
                currency,
                timestamp: Date.now()
              };
              
              sessionStorage.setItem('spendwise-guest-preferences', JSON.stringify(guestPrefs));
              console.log('✅ Guest preferences saved to session:', guestPrefs);
            } catch (error) {
              console.warn('Failed to save guest preferences:', error);
            }
          },

          clearGuestPreferences: () => {
            try {
              sessionStorage.removeItem('spendwise-guest-preferences');
              console.log('✅ Guest preferences cleared from session');
            } catch (error) {
              console.warn('Failed to clear guest preferences:', error);
            }
          },

          // Date management
          setSelectedDate: (date) => {
            set((state) => {
              state.selectedDate = date;
            });
          },

          getDateForServer: (date) => {
            // Convert date to server format (YYYY-MM-DD)
            if (!date) {
              return new Date().toISOString().split('T')[0];
            }
            
            if (typeof date === 'string') {
              // If already in YYYY-MM-DD format, return as is
              if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                return date;
              }
              // Otherwise convert to date and format
              const dateObj = new Date(date);
              return dateObj.toISOString().split('T')[0];
            }
            
            if (date instanceof Date) {
              return date.toISOString().split('T')[0];
            }
            
            return new Date().toISOString().split('T')[0];
          },

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
              state.currency = 'ILS'; // Default to Israeli Shekel
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
  setCurrency: state.actions.setCurrency,
  availableCurrencies: state.availableCurrencies,
  getExchangeRate: state.actions.getExchangeRate,
  updateExchangeRates: state.actions.updateExchangeRates,
  exchangeRates: state.exchangeRates,
  exchangeRatesUpdatedAt: state.exchangeRatesUpdatedAt
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