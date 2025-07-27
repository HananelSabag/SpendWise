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
        
        // ✅ NEW: Admin theme colors
        admin: {
          50:  'rgb(var(--color-admin-50) / <alpha-value>)',
          100: 'rgb(var(--color-admin-100) / <alpha-value>)',
          200: 'rgb(var(--color-admin-200) / <alpha-value>)',
          300: 'rgb(var(--color-admin-300) / <alpha-value>)',
          400: 'rgb(var(--color-admin-400) / <alpha-value>)',
          500: 'rgb(var(--color-admin-500) / <alpha-value>)',
          600: 'rgb(var(--color-admin-600) / <alpha-value>)',
          700: 'rgb(var(--color-admin-700) / <alpha-value>)',
          800: 'rgb(var(--color-admin-800) / <alpha-value>)',
          900: 'rgb(var(--color-admin-900) / <alpha-value>)',
        },
        
        // ✅ NEW: Analytics colors
        analytics: {
          income: 'rgb(var(--color-analytics-income) / <alpha-value>)',
          expense: 'rgb(var(--color-analytics-expense) / <alpha-value>)',
          savings: 'rgb(var(--color-analytics-savings) / <alpha-value>)',
          neutral: 'rgb(var(--color-analytics-neutral) / <alpha-value>)',
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
          6: 'rgb(var(--color-chart-6) / <alpha-value>)',
          7: 'rgb(var(--color-chart-7) / <alpha-value>)',
          8: 'rgb(var(--color-chart-8) / <alpha-value>)',
        },
        
        // ✅ NEW: Performance monitoring colors
        performance: {
          excellent: 'rgb(var(--color-performance-excellent) / <alpha-value>)',
          good: 'rgb(var(--color-performance-good) / <alpha-value>)',
          fair: 'rgb(var(--color-performance-fair) / <alpha-value>)',
          poor: 'rgb(var(--color-performance-poor) / <alpha-value>)',
        }
      },
      
      // Typography
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'Consolas', 'monospace'],
      },
      
      // ✅ Enhanced spacing for admin and mobile
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        // ✅ NEW: Admin dashboard spacing
        'admin-header': '4rem',
        'admin-sidebar': '16rem',
        'admin-content': 'calc(100vh - 4rem)',
        // ✅ NEW: Mobile-optimized spacing
        'mobile-safe': 'env(safe-area-inset-bottom)',
        'mobile-header': '3.5rem',
      },
      
      // ✅ Enhanced border radius
      borderRadius: {
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        // ✅ NEW: Component-specific radius
        'card': 'var(--radius-card)',
        'button': 'var(--radius-button)',
        'input': 'var(--radius-input)',
      },
      
      // ✅ Enhanced animations for admin and analytics
      animation: {
        'slide-in': 'slide-in 0.2s ease-out',
        'slide-out': 'slide-out 0.2s ease-in',
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.2s ease-in',
        'scale-in': 'scale-in 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        // ✅ NEW: Admin-specific animations
        'admin-slide-in': 'admin-slide-in 0.3s ease-out',
        'admin-fade-in': 'admin-fade-in 0.25s ease-out',
        'chart-draw': 'chart-draw 1s ease-out',
        'progress-fill': 'progress-fill 1.5s ease-out',
        'dashboard-enter': 'dashboard-enter 0.4s ease-out',
        // ✅ NEW: Performance indicators
        'performance-pulse': 'performance-pulse 2s ease-in-out infinite',
        'loading-shimmer': 'loading-shimmer 1.5s ease-in-out infinite',
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
        // ✅ NEW: Admin animations
        'admin-slide-in': {
          '0%': { transform: 'translateX(-20px)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        'admin-fade-in': {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'chart-draw': {
          '0%': { strokeDashoffset: 1000 },
          '100%': { strokeDashoffset: 0 },
        },
        'progress-fill': {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress-value, 0%)' },
        },
        'dashboard-enter': {
          '0%': { opacity: 0, transform: 'scale(0.95) translateY(20px)' },
          '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
        },
        'performance-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.7)' },
          '50%': { boxShadow: '0 0 0 10px rgba(59, 130, 246, 0)' },
        },
        'loading-shimmer': {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
        },
      },
      
      // ✅ Enhanced shadows for depth
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(var(--color-shadow) / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(var(--color-shadow) / 0.1), 0 1px 2px -1px rgb(var(--color-shadow) / 0.1)',
        'md': '0 4px 6px -1px rgb(var(--color-shadow) / 0.1), 0 2px 4px -2px rgb(var(--color-shadow) / 0.1)',
        'lg': '0 10px 15px -3px rgb(var(--color-shadow) / 0.1), 0 4px 6px -4px rgb(var(--color-shadow) / 0.1)',
        'xl': '0 20px 25px -5px rgb(var(--color-shadow) / 0.1), 0 8px 10px -6px rgb(var(--color-shadow) / 0.1)',
        '2xl': '0 25px 50px -12px rgb(var(--color-shadow) / 0.25)',
        'inner': 'inset 0 2px 4px 0 rgb(var(--color-shadow) / 0.05)',
        // ✅ NEW: Admin-specific shadows
        'admin': '0 4px 12px -2px rgb(var(--color-admin-500) / 0.1)',
        'admin-lg': '0 8px 24px -4px rgb(var(--color-admin-500) / 0.15)',
        'card-hover': '0 8px 16px -4px rgb(var(--color-shadow) / 0.15)',
        'button-press': 'inset 0 2px 4px 0 rgb(var(--color-shadow) / 0.1)',
      },
      
      // ✅ Enhanced screens for responsive design
      screens: {
        'xs': '475px',
        'admin-sm': '640px',
        'admin-md': '1024px',
        'admin-lg': '1280px',
        'admin-xl': '1536px',
        '3xl': '1920px',
      },
      
      // ✅ NEW: Grid template configurations
      gridTemplateColumns: {
        'admin': '16rem 1fr',
        'admin-collapsed': '4rem 1fr',
        'dashboard': 'repeat(auto-fit, minmax(300px, 1fr))',
        'analytics': 'repeat(auto-fit, minmax(250px, 1fr))',
      },
      
      // ✅ NEW: Z-index scale
      zIndex: {
        'modal': '1000',
        'dropdown': '1010',
        'tooltip': '1020',
        'toast': '1030',
        'admin-header': '100',
        'admin-sidebar': '90',
      },
      
      // ✅ NEW: Min/max width utilities
      minWidth: {
        'admin-sidebar': '16rem',
        'card': '20rem',
        'mobile': '20rem',
      },
      maxWidth: {
        'admin-content': 'calc(100vw - 16rem)',
        'dashboard': '1400px',
        'analytics': '1200px',
      },
    },
  },
  plugins: [
    // Custom plugin for CSS variables
    function({ addBase, addUtilities }) {
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
          
          // ✅ NEW: Admin colors (Purple theme)
          '--color-admin-50': '250 245 255',
          '--color-admin-100': '243 232 255',
          '--color-admin-200': '233 213 255',
          '--color-admin-300': '196 181 253',
          '--color-admin-400': '168 85 247',
          '--color-admin-500': '147 51 234',
          '--color-admin-600': '126 34 206',
          '--color-admin-700': '107 33 168',
          '--color-admin-800': '88 28 135',
          '--color-admin-900': '74 29 120',
          
          // ✅ NEW: Analytics colors
          '--color-analytics-income': '34 197 94',   // Green
          '--color-analytics-expense': '239 68 68',  // Red
          '--color-analytics-savings': '59 130 246', // Blue
          '--color-analytics-neutral': '156 163 175', // Gray
          
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
          
          // ✅ Enhanced chart colors
          '--color-chart-1': '59 130 246',   // Blue
          '--color-chart-2': '34 197 94',    // Green
          '--color-chart-3': '251 146 60',   // Orange
          '--color-chart-4': '168 85 247',   // Purple
          '--color-chart-5': '236 72 153',   // Pink
          '--color-chart-6': '20 184 166',   // Teal
          '--color-chart-7': '248 113 113',  // Rose
          '--color-chart-8': '163 163 163',  // Gray
          
          // ✅ NEW: Performance colors
          '--color-performance-excellent': '34 197 94',  // Green
          '--color-performance-good': '59 130 246',      // Blue
          '--color-performance-fair': '251 146 60',      // Orange
          '--color-performance-poor': '239 68 68',       // Red
          
          // Other
          '--color-shadow': '0 0 0',
          '--radius-xl': '0.75rem',
          '--radius-2xl': '1rem',
          '--radius-3xl': '1.5rem',
          '--radius-card': '0.5rem',
          '--radius-button': '0.375rem',
          '--radius-input': '0.375rem',
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
      
      // ✅ NEW: Utility classes for admin and analytics
      addUtilities({
        '.admin-gradient': {
          background: 'linear-gradient(135deg, rgb(147 51 234) 0%, rgb(79 70 229) 100%)'
        },
        '.analytics-gradient': {
          background: 'linear-gradient(135deg, rgb(59 130 246) 0%, rgb(34 197 94) 100%)'
        },
        '.performance-gradient': {
          background: 'linear-gradient(90deg, rgb(34 197 94) 0%, rgb(59 130 246) 50%, rgb(251 146 60) 100%)'
        },
        '.shimmer': {
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          backgroundSize: '200px 100%',
          animation: 'loading-shimmer 1.5s ease-in-out infinite'
        },
        '.glass': {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }
      });
    },
  ],
};