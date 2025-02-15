import { text } from 'express';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Colors
      colors: {
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',  // Main brand color
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          1000:'#5eead4',
          1100:'#ccfbf1'

        },
        success: {
          light: '#ecfdf5',  // Background for success states
          DEFAULT: '#10b981', // Main success color
          dark: '#059669',    // Hover states
        },
        error: {
          light: '#fef2f2',   // Background for error states
          DEFAULT: '#ef4444', // Main error color
          dark: '#dc2626',    // Hover states
        }
      },

      // Custom container sizes
      maxWidth: {
        'layout': '1440px',
        'card': '400px',
      },

      // Common border radius values
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        'full': '9999px',
      },

      // Customized shadows
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      },

      // Custom fonts
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },

      // Animation utilities
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fadeIn': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    function({ addComponents, theme }) {
      addComponents({
        // Button Variants
        '.btn': {
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.medium'),
          transition: 'all 200ms',
          '&:focus': {
            outline: 'none',
            ring: '2px',
            ringColor: theme('colors.primary.500'),
          },
        },
        '.btn-primary': {
          backgroundColor: theme('colors.primary.1000'),
          color: theme('colors.white'),
          '&:hover': {
            backgroundColor: theme('colors.primary.1000'),
          },
        },
        '.btn-secondary': {
          backgroundColor: theme('colors.gray.100'),
          textColor: theme('colors.black'),
          color: theme('colors.gray.80'),
          '&:hover': {
            backgroundColor: theme('colors.gray.200'),
          },
        },

        // Input Styles
        '.input-base': {
          width: '100%',
          padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.lg'),
          borderWidth: '1px',
          borderColor: theme('colors.gray.200'),
          '&:focus': {
            outline: 'none',
            ring: '2px',
            ringColor: theme('colors.primary.500'),
            borderColor: 'transparent',
          },
        },

        // Card Styles
        '.card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.xl'),
          boxShadow: theme('boxShadow.lg'),
          padding: theme('spacing.6'),
        },
        
        // Gradient Backgrounds
        '.gradient-primary': {
          background: 'linear-gradient(to bottom right, #ccfbf1, #5eead4)',
        },
        '.gradient-primary-dark': {
          background: 'linear-gradient(to bottom right, #14b8a6, #0d9488)',
        }
        
      });
    },
  ],
}