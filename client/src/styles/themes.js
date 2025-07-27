/**
 * 🎨 SPENDWISE COMPREHENSIVE THEME SYSTEM
 * Complete theming solution with mobile optimization and accessibility
 * @version 2.0.0
 */

// ✅ Core Color Palettes
export const colors = {
  light: {
    primary: {
      50: '#EBF5FF',
      100: '#D6EBFF',
      200: '#ADD6FF',
      300: '#85C2FF',
      400: '#5CADFF',
      500: '#3399FF',
      600: '#0A7AFF',
      700: '#0066E0',
      800: '#0052B8',
      900: '#003D8F'
    },
    background: {
      primary: '#FFFFFF',
      secondary: '#F8FAFC',
      tertiary: '#F1F5F9',
      card: '#FFFFFF',
      modal: 'rgba(255, 255, 255, 0.95)',
      overlay: 'rgba(0, 0, 0, 0.5)'
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      tertiary: '#94A3B8',
      muted: '#64748B',
      inverse: '#FFFFFF'
    },
    border: {
      light: '#E2E8F0',
      medium: '#CBD5E1',
      strong: '#94A3B8'
    },
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6'
  },
  dark: {
    primary: {
      50: '#1E3A5F',
      100: '#2A4A73',
      200: '#365987',
      300: '#42699B',
      400: '#4E79AF',
      500: '#5A89C3',
      600: '#6B9AD4',
      700: '#7DABE5',
      800: '#8FBCF6',
      900: '#A1CDFF'
    },
    background: {
      primary: '#0F172A',
      secondary: '#1E293B',
      tertiary: '#334155',
      card: '#1E293B',
      modal: 'rgba(15, 23, 42, 0.95)',
      overlay: 'rgba(0, 0, 0, 0.7)'
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#CBD5E1',
      tertiary: '#94A3B8',
      muted: '#64748B',
      inverse: '#0F172A'
    },
    border: {
      light: '#334155',
      medium: '#475569',
      strong: '#64748B'
    },
    success: '#34D399',
    error: '#F87171',
    warning: '#FBBF24',
    info: '#60A5FA'
  }
};

// ✅ Typography System
export const typography = {
  // Font families
  fonts: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    display: ['Poppins', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'Consolas', 'monospace']
  },
  
  // Font sizes (mobile-first responsive)
  sizes: {
    xs: { mobile: '0.75rem', desktop: '0.75rem' },    // 12px
    sm: { mobile: '0.875rem', desktop: '0.875rem' },  // 14px
    base: { mobile: '1rem', desktop: '1rem' },        // 16px
    lg: { mobile: '1.125rem', desktop: '1.125rem' },  // 18px
    xl: { mobile: '1.25rem', desktop: '1.25rem' },    // 20px
    '2xl': { mobile: '1.5rem', desktop: '1.875rem' }, // 24px/30px
    '3xl': { mobile: '1.875rem', desktop: '2.25rem' }, // 30px/36px
    '4xl': { mobile: '2.25rem', desktop: '3rem' },    // 36px/48px
  },
  
  // Line heights
  lineHeights: {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8
  },
  
  // Font weights
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900
  }
};

// ✅ Spacing System (8px grid)
export const spacing = {
  // Base units
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  
  // Mobile-specific spacing
  mobile: {
    touch: '2.75rem',    // 44px minimum touch target
    gesture: '2rem',     // 32px gesture-friendly padding
    safe: 'env(safe-area-inset-bottom)', // iPhone safe area
    header: '3.5rem',    // 56px mobile header
  },
  
  // Component-specific spacing
  component: {
    cardPadding: { mobile: '1rem', desktop: '1.5rem' },
    buttonPadding: { mobile: '0.75rem 1rem', desktop: '0.75rem 1.5rem' },
    inputPadding: { mobile: '0.75rem', desktop: '0.875rem' },
    modalPadding: { mobile: '1rem', desktop: '2rem' }
  }
};

// ✅ Border Radius System
export const borderRadius = {
  none: '0',
  sm: '0.125rem',    // 2px
  default: '0.25rem', // 4px
  md: '0.375rem',    // 6px
  lg: '0.5rem',      // 8px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  '3xl': '1.5rem',   // 24px
  full: '9999px',
  
  // Component-specific radius
  component: {
    button: '0.375rem',  // 6px
    input: '0.375rem',   // 6px
    card: '0.5rem',      // 8px
    modal: '1rem',       // 16px
  }
};

// ✅ Shadow System
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  
  // Component-specific shadows
  component: {
    card: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    cardHover: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    button: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    modal: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    dropdown: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
  }
};

// ✅ Animation System
export const animations = {
  // Duration
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms'
  },
  
  // Easing
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },
  
  // Presets
  presets: {
    fadeIn: 'fadeIn 300ms ease-out',
    slideIn: 'slideIn 300ms ease-out',
    scaleIn: 'scaleIn 200ms ease-out',
    bounce: 'bounce 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  }
};

// ✅ Mobile-Specific Themes
export const mobileThemes = {
  // Touch targets
  touch: {
    minSize: '44px',
    comfortable: '48px',
    large: '56px'
  },
  
  // Mobile breakpoints
  breakpoints: {
    xs: '320px',
    sm: '375px',
    md: '414px',
    lg: '768px'
  },
  
  // Mobile-optimized colors (higher contrast for outdoor use)
  outdoorMode: {
    light: {
      ...colors.light,
      text: {
        primary: '#000000',  // Pure black for better contrast
        secondary: '#1a1a1a',
        tertiary: '#333333'
      }
    }
  }
};

// ✅ Accessibility Themes
export const accessibilityThemes = {
  // High contrast mode
  highContrast: {
    light: {
      background: {
        primary: '#FFFFFF',
        secondary: '#F0F0F0',
        tertiary: '#E0E0E0'
      },
      text: {
        primary: '#000000',
        secondary: '#1a1a1a',
        tertiary: '#333333'
      },
      border: {
        light: '#666666',
        medium: '#333333',
        strong: '#000000'
      }
    },
    dark: {
      background: {
        primary: '#000000',
        secondary: '#1a1a1a',
        tertiary: '#333333'
      },
      text: {
        primary: '#FFFFFF',
        secondary: '#E0E0E0',
        tertiary: '#CCCCCC'
      },
      border: {
        light: '#666666',
        medium: '#CCCCCC',
        strong: '#FFFFFF'
      }
    }
  },
  
  // Reduced motion
  reducedMotion: {
    duration: {
      fast: '0ms',
      normal: '0ms',
      slow: '0ms'
    },
    presets: {
      fadeIn: 'opacity 0s',
      slideIn: 'opacity 0s',
      scaleIn: 'opacity 0s'
    }
  },
  
  // Large text mode
  largeText: {
    sizes: {
      xs: { mobile: '1rem', desktop: '1rem' },        // 16px
      sm: { mobile: '1.125rem', desktop: '1.125rem' }, // 18px
      base: { mobile: '1.25rem', desktop: '1.25rem' }, // 20px
      lg: { mobile: '1.5rem', desktop: '1.5rem' },     // 24px
      xl: { mobile: '1.75rem', desktop: '1.75rem' },   // 28px
      '2xl': { mobile: '2rem', desktop: '2.5rem' },    // 32px/40px
      '3xl': { mobile: '2.5rem', desktop: '3rem' },    // 40px/48px
      '4xl': { mobile: '3rem', desktop: '4rem' },      // 48px/64px
    }
  }
};

// ✅ Component-Specific Themes
export const componentThemes = {
  // Button themes
  button: {
    primary: {
      light: {
        bg: colors.light.primary[500],
        bgHover: colors.light.primary[600],
        text: colors.light.text.inverse,
        border: colors.light.primary[500]
      },
      dark: {
        bg: colors.dark.primary[500],
        bgHover: colors.dark.primary[600],
        text: colors.dark.text.inverse,
        border: colors.dark.primary[500]
      }
    },
    secondary: {
      light: {
        bg: colors.light.background.secondary,
        bgHover: colors.light.background.tertiary,
        text: colors.light.text.primary,
        border: colors.light.border.medium
      },
      dark: {
        bg: colors.dark.background.secondary,
        bgHover: colors.dark.background.tertiary,
        text: colors.dark.text.primary,
        border: colors.dark.border.medium
      }
    }
  },
  
  // Card themes
  card: {
    default: {
      light: {
        bg: colors.light.background.card,
        border: colors.light.border.light,
        shadow: shadows.component.card
      },
      dark: {
        bg: colors.dark.background.card,
        border: colors.dark.border.light,
        shadow: shadows.component.card
      }
    },
    elevated: {
      light: {
        bg: colors.light.background.card,
        border: colors.light.border.light,
        shadow: shadows.component.cardHover
      },
      dark: {
        bg: colors.dark.background.card,
        border: colors.dark.border.light,
        shadow: shadows.component.cardHover
      }
    }
  },
  
  // Input themes
  input: {
    default: {
      light: {
        bg: colors.light.background.primary,
        border: colors.light.border.medium,
        borderFocus: colors.light.primary[500],
        text: colors.light.text.primary,
        placeholder: colors.light.text.tertiary
      },
      dark: {
        bg: colors.dark.background.primary,
        border: colors.dark.border.medium,
        borderFocus: colors.dark.primary[500],
        text: colors.dark.text.primary,
        placeholder: colors.dark.text.tertiary
      }
    }
  }
};

// ✅ Theme Utilities
export const themeUtils = {
  // Get theme value with fallback
  get: (theme, path, fallback = null) => {
    const keys = path.split('.');
    let value = theme;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return fallback;
      }
    }
    
    return value;
  },
  
  // Merge themes
  merge: (baseTheme, overrideTheme) => {
    return {
      ...baseTheme,
      ...overrideTheme,
      colors: {
        ...baseTheme.colors,
        ...overrideTheme.colors
      }
    };
  },
  
  // Generate CSS variables from theme
  toCSSVariables: (theme, prefix = '--theme') => {
    const variables = {};
    
    const flatten = (obj, path = '') => {
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        const newPath = path ? `${path}-${key}` : key;
        
        if (typeof value === 'object' && value !== null) {
          flatten(value, newPath);
        } else {
          variables[`${prefix}-${newPath}`] = value;
        }
      });
    };
    
    flatten(theme);
    return variables;
  }
};

// ✅ Default Export
export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  mobileThemes,
  accessibilityThemes,
  componentThemes,
  themeUtils
};