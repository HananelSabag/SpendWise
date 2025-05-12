/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <- allows toggling dark mode by adding a 'dark' class to <html> or <body>
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary color palette - blues
        primary: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6', // a bit deeper than your current 300 
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },

        // A set of "neutral" or "coolGray" for backgrounds
        neutral: {
          50:  '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },

        // Additional color variations for backgrounds, success, and error
        error: {
          light: '#FEE2E2',
          DEFAULT: '#EF4444',
          dark: '#B91C1C',
          darker: '#991B1B',
        },
        success: {
          light: '#D1FAE5',
          DEFAULT: '#10B981',
          dark: '#059669',
        },
        warning: {
          light: '#FEF3C7',
          DEFAULT: '#F59E0B',
          dark: '#D97706',
        },
        info: {
          light: '#E0F2FE',
          DEFAULT: '#0EA5E9',
          dark: '#0284C7',
        },

        // Card and page backgrounds
        card: {
          DEFAULT: '#F8FAFC',
          shadow: 'rgba(0, 0, 0, 0.1)',
          hover: '#F1F5F9',
        },
        pageBackground: {
          DEFAULT: 'linear-gradient(to bottom, #E3F2FD, #BFDBFE)',
          dark: 'linear-gradient(to bottom, #1E293B, #0F172A)',
        },
      },

      // You can define brand new radial or subtle gradient for backgrounds
      backgroundImage: {
        'blue-radial': 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)',
        'dark-gradient': 'linear-gradient(to bottom, #1E293B, #0F172A)',
      },

      // Slightly bigger radius/ shadows can give a softer look
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'md': '0 6px 12px rgba(0, 0, 0, 0.08)',
        'lg': '0 10px 20px rgba(0, 0, 0, 0.15)',
        'xl': '0 15px 30px rgba(0, 0, 0, 0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // If you want a secondary heading font (poppins, etc.)
        heading: ['Poppins', 'sans-serif'],
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-in-out',
        'slideUp': 'slideUp 0.3s ease-out',
        'slideDown': 'slideDown 0.3s ease-out',
        'slideLeft': 'slideLeft 0.3s ease-out',
        'slideRight': 'slideRight 0.3s ease-out',
        'bounce': 'bounce 1s infinite',
        'spin': 'spin 1s linear infinite',
        'ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ripple': 'ripple 0.7s linear'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        ripple: {
          '0%': { width: '0px', height: '0px', opacity: '0.5' },
          '100%': { width: '200px', height: '200px', opacity: '0' },
        }
      }
    },
  },
  plugins: [
    function({ addComponents, theme }) {
      addComponents({
        // Updated button classes
        '.btn': {
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.medium'),
          transition: 'all 200ms',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme('spacing.2'),
        },
        '.btn-primary': {
          backgroundColor: theme('colors.primary.500'),
          color: theme('colors.white'),
          '&:hover': {
            backgroundColor: theme('colors.primary.600'),
          },
          '&:disabled': {
            backgroundColor: theme('colors.primary.300'),
            cursor: 'not-allowed',
          },
        },
        '.btn-secondary': {
          backgroundColor: theme('colors.white'),
          color: theme('colors.primary.600'),
          border: `1px solid ${theme('colors.primary.400')}`,
          '&:hover': {
            backgroundColor: theme('colors.primary.50'),
          },
        },
        '.btn-danger': {
          backgroundColor: theme('colors.error.DEFAULT'),
          color: theme('colors.white'),
          '&:hover': {
            backgroundColor: theme('colors.error.dark'),
          },
          '&:disabled': {
            backgroundColor: theme('colors.error.light'),
            cursor: 'not-allowed',
          },
        },

        // Example of toggling dark mode
        '.dark-mode-text': {
          '@apply text-gray-900 dark:text-gray-100': {},
        },

        '.card': {
          backgroundColor: theme('colors.card.DEFAULT'),
          borderRadius: theme('borderRadius.xl'),
          boxShadow: `0 4px 6px ${theme('colors.card.shadow')}`,
          padding: theme('spacing.6'),
          transition: 'all 200ms',
        },
        '.card-hover': {
          '&:hover': {
            boxShadow: `0 10px 15px -3px ${theme('colors.card.shadow')}`,
            transform: 'translateY(-2px)',
          }
        },
        '.gradient-primary': {
          background: theme('colors.pageBackground.DEFAULT'),
          '&.dark': {
            background: theme('colors.pageBackground.dark'),
          },
        },
        
        // High contrast mode for accessibility
        '.high-contrast': {
          // Text contrast
          '& body': {
            color: '#000 !important',
            backgroundColor: '#fff !important',
          },
          // Links and buttons
          '& a, & button': {
            color: '#00f !important',
            backgroundColor: '#fff !important',
            borderColor: '#00f !important',
            textDecoration: 'underline !important',
          },
          // Form elements
          '& input, & select, & textarea': {
            color: '#000 !important',
            backgroundColor: '#fff !important',
            borderColor: '#000 !important',
          },
          // Headers and emphasis
          '& h1, & h2, & h3, & h4, & h5, & h6, & strong, & b': {
            color: '#000 !important',
          },
          // Remove gradients and shadows
          '& *': {
            boxShadow: 'none !important',
            textShadow: 'none !important',
            backgroundImage: 'none !important',
          },
          // Add border to improve distinction
          '& .card, & .btn, & input, & select': {
            border: '2px solid #000 !important',
          }
        }
      });
    },
  ],
};