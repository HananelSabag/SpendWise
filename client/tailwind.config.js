/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // CSS Variables for dynamic theming
      colors: {
        // Primary palette
        primary: {
          50:  'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
        },
        
        // Semantic colors
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--color-card) / <alpha-value>)',
          foreground: 'rgb(var(--color-card-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--color-muted) / <alpha-value>)',
          foreground: 'rgb(var(--color-muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          foreground: 'rgb(var(--color-accent-foreground) / <alpha-value>)',
        },
        
        // Status colors
        success: {
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
          light: 'rgb(var(--color-success-light) / <alpha-value>)',
          dark: 'rgb(var(--color-success-dark) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
          light: 'rgb(var(--color-warning-light) / <alpha-value>)',
          dark: 'rgb(var(--color-warning-dark) / <alpha-value>)',
        },
        error: {
          DEFAULT: 'rgb(var(--color-error) / <alpha-value>)',
          light: 'rgb(var(--color-error-light) / <alpha-value>)',
          dark: 'rgb(var(--color-error-dark) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'rgb(var(--color-info) / <alpha-value>)',
          light: 'rgb(var(--color-info-light) / <alpha-value>)',
          dark: 'rgb(var(--color-info-dark) / <alpha-value>)',
        },
        
        // Chart colors
        chart: {
          1: 'rgb(var(--color-chart-1) / <alpha-value>)',
          2: 'rgb(var(--color-chart-2) / <alpha-value>)',
          3: 'rgb(var(--color-chart-3) / <alpha-value>)',
          4: 'rgb(var(--color-chart-4) / <alpha-value>)',
          5: 'rgb(var(--color-chart-5) / <alpha-value>)',
        }
      },
      
      // Typography
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'Consolas', 'monospace'],
      },
      
      // Spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Border radius
      borderRadius: {
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
      },
      
      // Animations
      animation: {
        'slide-in': 'slide-in 0.2s ease-out',
        'slide-out': 'slide-out 0.2s ease-in',
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.2s ease-in',
        'scale-in': 'scale-in 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateY(-10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        'slide-out': {
          '0%': { transform: 'translateY(0)', opacity: 1 },
          '100%': { transform: 'translateY(-10px)', opacity: 0 },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        'fade-out': {
          '0%': { opacity: 1 },
          '100%': { opacity: 0 },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      
      // Shadows
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(var(--color-shadow) / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(var(--color-shadow) / 0.1), 0 1px 2px -1px rgb(var(--color-shadow) / 0.1)',
        'md': '0 4px 6px -1px rgb(var(--color-shadow) / 0.1), 0 2px 4px -2px rgb(var(--color-shadow) / 0.1)',
        'lg': '0 10px 15px -3px rgb(var(--color-shadow) / 0.1), 0 4px 6px -4px rgb(var(--color-shadow) / 0.1)',
        'xl': '0 20px 25px -5px rgb(var(--color-shadow) / 0.1), 0 8px 10px -6px rgb(var(--color-shadow) / 0.1)',
        '2xl': '0 25px 50px -12px rgb(var(--color-shadow) / 0.25)',
        'inner': 'inset 0 2px 4px 0 rgb(var(--color-shadow) / 0.05)',
      },
      
      // Screens (breakpoints)
      screens: {
        'xs': '475px',
        '3xl': '1920px',
      },
    },
  },
  plugins: [
    // Custom plugin for CSS variables
    function({ addBase }) {
      addBase({
        ':root': {
          // Primary colors
          '--color-primary-50': '239 246 255',
          '--color-primary-100': '219 234 254',
          '--color-primary-200': '191 219 254',
          '--color-primary-300': '147 197 253',
          '--color-primary-400': '96 165 250',
          '--color-primary-500': '59 130 246',
          '--color-primary-600': '37 99 235',
          '--color-primary-700': '29 78 216',
          '--color-primary-800': '30 64 175',
          '--color-primary-900': '30 58 138',
          
          // Semantic colors - Light mode
          '--color-background': '255 255 255',
          '--color-foreground': '15 23 42',
          '--color-card': '255 255 255',
          '--color-card-foreground': '15 23 42',
          '--color-muted': '248 250 252',
          '--color-muted-foreground': '100 116 139',
          '--color-accent': '241 245 249',
          '--color-accent-foreground': '15 23 42',
          
          // Status colors
          '--color-success': '34 197 94',
          '--color-success-light': '220 252 231',
          '--color-success-dark': '21 128 61',
          '--color-warning': '251 146 60',
          '--color-warning-light': '254 243 199',
          '--color-warning-dark': '217 119 6',
          '--color-error': '239 68 68',
          '--color-error-light': '254 226 226',
          '--color-error-dark': '185 28 28',
          '--color-info': '59 130 246',
          '--color-info-light': '219 234 254',
          '--color-info-dark': '29 78 216',
          
          // Chart colors
          '--color-chart-1': '59 130 246',
          '--color-chart-2': '34 197 94',
          '--color-chart-3': '251 146 60',
          '--color-chart-4': '168 85 247',
          '--color-chart-5': '236 72 153',
          
          // Other
          '--color-shadow': '0 0 0',
          '--radius-xl': '0.75rem',
          '--radius-2xl': '1rem',
          '--radius-3xl': '1.5rem',
        },
        
        '.dark': {
          // Dark mode overrides
          '--color-background': '10 10 10',
          '--color-foreground': '248 250 252',
          '--color-card': '24 24 27',
          '--color-card-foreground': '248 250 252',
          '--color-muted': '39 39 42',
          '--color-muted-foreground': '161 161 170',
          '--color-accent': '39 39 42',
          '--color-accent-foreground': '248 250 252',
          '--color-shadow': '255 255 255',
        }
      });
    },
  ],
};