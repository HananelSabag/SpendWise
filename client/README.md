# SpendWise Client - React Frontend

A modern, responsive React application built with Vite, featuring real-time expense tracking, multi-language support, and Progressive Web App capabilities.

## 👨‍💻 Author & Portfolio Project

**Hananel Sabag** - Software Engineer  
💼 GitHub: [@HananelSabag](https://github.com/HananelSabag)

> **Frontend Portfolio Showcase** - This React application demonstrates modern frontend development skills including React 18, Vite, TanStack Query, responsive design, PWA implementation, and production optimization techniques.

## ⚠️ **Portfolio Project Notice**

This frontend is part of a portfolio demonstration project. While you can explore and learn from the code, please note that sensitive configuration files are excluded for security reasons.

## 🚀 Tech Stack

### Core Framework
- **React 18** - Latest React with concurrent features
- **Vite 5** - Lightning-fast build tool and dev server
- **TypeScript Support** - Type-safe development (optional)

### Styling & UI
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Tailwind Merge** - Conditional class merging
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful, customizable icons
- **Heroicons** - Additional icon set

### State Management & Data
- **TanStack Query (React Query)** - Server state management with caching
- **Zustand** - Lightweight client state management
- **React Hook Form** - Performant form handling
- **Zod** - TypeScript-first schema validation

### Routing & Navigation
- **React Router v6** - Declarative routing with data loading
- **Protected Routes** - Authentication-based route protection

### Charts & Visualization
- **Recharts** - Composable charting library built on D3

### PWA & Performance
- **Vite PWA Plugin** - Service worker and offline support
- **Workbox** - Production-ready PWA features
- **Code Splitting** - Automatic route-based code splitting

## 📁 Project Structure

```
client/
├── public/                 # Static assets
│   ├── favicon.ico
│   ├── pwa-192x192.png
│   └── pwa-512x512.png
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Base UI components (Button, Input, etc.)
│   │   ├── layout/        # Layout components (Header, Footer)
│   │   ├── forms/         # Form-specific components
│   │   └── common/        # Shared components
│   ├── pages/             # Main application pages
│   │   ├── Dashboard.jsx  # Main dashboard
│   │   ├── Transactions.jsx
│   │   ├── Profile.jsx
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── hooks/             # Custom React hooks
│   │   ├── useAuth.js     # Authentication hook
│   │   ├── useApi.js      # API interaction hook
│   │   ├── useTransactions.js
│   │   └── useToast.jsx   # Toast notifications
│   ├── context/           # React Context providers
│   │   ├── AuthContext.jsx
│   │   ├── LanguageContext.jsx
│   │   ├── ThemeContext.jsx
│   │   └── CurrencyContext.jsx
│   ├── utils/             # Utility functions
│   │   ├── api.js         # API client configuration
│   │   ├── helpers.js     # General helper functions
│   │   └── constants.js   # Application constants
│   ├── config/            # Configuration files
│   │   └── queryClient.js # React Query configuration
│   ├── assets/            # Images, fonts, etc.
│   ├── index.css          # Global styles and Tailwind imports
│   ├── main.jsx           # Application entry point
│   └── app.jsx            # Main App component
├── dist/                  # Production build output
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
└── package.json           # Dependencies and scripts
```

## 🎨 Key Features

### User Interface
- **Responsive Design** - Mobile-first approach with desktop optimization
- **Dark/Light Mode** - System preference detection with manual toggle
- **RTL Support** - Full right-to-left layout for Hebrew language
- **Accessibility** - ARIA labels, keyboard navigation, screen reader support

### Language & Localization
- **Multi-language Support** - English and Hebrew with dynamic switching
- **Translation System** - Context-based translation with parameter support
- **Date/Currency Formatting** - Locale-aware formatting
- **Session Language Override** - Temporary language switching

### Performance
- **Code Splitting** - Route-based lazy loading
- **Image Optimization** - Responsive images with lazy loading
- **Bundle Optimization** - Vendor chunk splitting for better caching
- **Service Worker** - Offline support and background sync

### Data Management
- **Smart Caching** - Intelligent cache invalidation and updates
- **Optimistic Updates** - Immediate UI updates with rollback on error
- **Offline Support** - Local data persistence and sync when online
- **Real-time Updates** - Live data synchronization

## 🛠 Development

### Prerequisites
- Node.js 18+ and npm 8+
- Modern browser with ES2020 support

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start with mobile network access
npm run dev:mobile

# Start with automatic browser opening
npm run dev:open
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server on localhost
npm run dev:mobile       # Start dev server accessible from network
npm run dev:network      # Start dev server with network access
npm run dev:open         # Start dev server and open browser

# Building
npm run build            # Build for production
npm run preview          # Preview production build locally
npm run preview:mobile   # Preview with network access

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
```

### Environment Variables

**Note**: Create your own `.env` file as it's not included in the repository for security reasons.

Create a `.env` file in the client directory:

```env
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_CLIENT_URL=http://localhost:5173
VITE_ENVIRONMENT=development

# Debug Settings
VITE_DEBUG_MODE=true
VITE_REQUEST_TIMEOUT=10000
VITE_RETRY_ATTEMPTS=3

# Feature Flags
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=false
```

### Production Environment Variables

For production deployment (Vercel):

```env
# Production API
VITE_API_URL=https://your-api-domain.com
VITE_CLIENT_URL=https://your-frontend-domain.com
VITE_ENVIRONMENT=production

# Production Settings
VITE_DEBUG_MODE=false
VITE_REQUEST_TIMEOUT=15000
VITE_RETRY_ATTEMPTS=3
```

## 📱 Mobile Development

The application is optimized for mobile development and testing:

### Network Access Setup

```bash
# Start dev server with network access
npm run dev:mobile

# Your app will be accessible at:
# - Local: http://localhost:5173
# - Network: http://YOUR_IP:5173
```

### Mobile Testing Features
- **Touch Gestures** - Swipe navigation and touch interactions
- **Responsive Breakpoints** - Tailwind's mobile-first breakpoints
- **PWA Installation** - Add to home screen capability
- **Offline Mode** - Works without internet connection

## 🎯 Component Architecture

### UI Components (`src/components/ui/`)
- **Button** - Customizable button with variants and sizes
- **Input** - Form input with validation states
- **Modal** - Accessible modal dialogs
- **LoadingSpinner** - Loading indicators
- **Toast** - Notification system

### Layout Components (`src/components/layout/`)
- **Header** - Navigation and user menu
- **Footer** - Application footer
- **Sidebar** - Navigation sidebar (if applicable)

### Form Components (`src/components/forms/`)
- **TransactionForm** - Add/edit transaction form
- **CategoryForm** - Category management form
- **ProfileForm** - User profile editing

## 🔧 Configuration

### Vite Configuration (`vite.config.js`)
- **Path Aliases** - Simplified imports with @ prefix
- **PWA Settings** - Service worker and manifest configuration
- **Build Optimization** - Chunk splitting and minification
- **Development Server** - HMR and network access settings

### Tailwind Configuration (`tailwind.config.js`)
- **Custom Colors** - Brand color palette
- **Typography** - Font families and sizes
- **Responsive Breakpoints** - Mobile-first breakpoints
- **Dark Mode** - Class-based dark mode support

## 🚀 Build & Deployment

### Production Build

```bash
# Create production build
npm run build

# Build output will be in dist/ directory
# - Optimized and minified code
# - Service worker for PWA
# - Static assets with cache headers
```

### Build Analysis

```bash
# Analyze bundle size
npm run build

# Check build output
ls -la dist/

# Preview production build
npm run preview
```

## 🔍 Debugging

### Development Tools
- **React DevTools** - Component inspection and profiling
- **TanStack Query DevTools** - Query cache inspection
- **Vite DevTools** - Build analysis and HMR debugging

### Debug Configuration
```javascript
// Enable query devtools in development
if (import.meta.env.MODE === 'development') {
  window.queryClient = queryClient;
}
```

## 📊 Performance Optimization

### Bundle Optimization
- **Code Splitting** - Route-based lazy loading
- **Vendor Chunks** - Separate chunks for libraries
- **Tree Shaking** - Unused code elimination
- **Minification** - Terser optimization

### Runtime Performance
- **React Query Caching** - Intelligent data caching
- **Memoization** - Component and value memoization
- **Lazy Loading** - Images and components
- **Service Worker** - Asset caching and offline support

## 🧪 Testing

```bash
# Run tests (when implemented)
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📝 Contributing

This is a portfolio project, but feedback and suggestions are welcome:

1. Follow the existing code structure and naming conventions
2. Use TypeScript for new components (optional but recommended)
3. Ensure responsive design for all screen sizes
4. Add proper accessibility attributes
5. Test on both desktop and mobile devices
6. Update documentation for new features

## 📞 Contact

For questions about this frontend implementation:

**Hananel Sabag**  
💼 GitHub: [@HananelSabag](https://github.com/HananelSabag)

## 🔗 Related Documentation

- [Main Project README](../README.md)
- [Server Documentation](../server/README.md)
- [API Documentation](../server/README.md#api-endpoints)

---

**SpendWise Client** - A modern React application showcasing frontend development expertise. 