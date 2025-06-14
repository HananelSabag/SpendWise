# SpendWise - Smart Expense Tracking Application

A modern, full-stack expense tracking application built with React and Node.js, featuring real-time data synchronization, multi-language support, and intelligent financial insights.

## 👨‍💻 Author & Portfolio Project

**Hananel Sabag** - Software Engineer  
💼 GitHub: [@HananelSabag](https://github.com/HananelSabag)

> **Portfolio Showcase Project** - This project demonstrates full-stack development skills including React, Node.js, PostgreSQL, authentication, real-time features, and production deployment. Created as part of my software engineering portfolio.

## ⚠️ **Important Notice - Portfolio Project**

This repository is shared for **educational and portfolio demonstration purposes only**. 

### 📋 **Viewing & Learning**
- ✅ **Clone and explore** the codebase to see implementation patterns
- ✅ **Study the architecture** and coding techniques used
- ✅ **Review the documentation** and project structure
- ✅ **Use as reference** for learning full-stack development

### 🚫 **Deployment Restrictions**
- ❌ **Do NOT deploy** this project as your own website
- ❌ **Do NOT use** for commercial purposes
- ❌ **Do NOT claim** as your own work
- ❌ **Critical configuration files** are excluded for security

### 🔒 **Security & Privacy**
For security reasons, sensitive configuration files and production secrets are not included in this repository. The project is designed to showcase code quality and architecture while protecting the live production environment.

## 🌟 Overview

SpendWise is a comprehensive personal finance management tool that helps users track expenses, manage budgets, and gain insights into their spending patterns. The application features a clean, responsive interface with support for both English and Hebrew languages, dark/light themes, and offline capabilities through Progressive Web App (PWA) technology.

### Key Features

- **Smart Transaction Management** - Add, edit, and categorize transactions with intelligent suggestions
- **Real-time Dashboard** - Visual insights with charts and spending analytics
- **Multi-language Support** - Full Hebrew and English localization with RTL support
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Offline Capabilities** - PWA with offline data synchronization
- **Secure Authentication** - JWT-based authentication with email verification
- **Data Export** - Export transactions in CSV, JSON, and PDF formats
- **Category Management** - Custom categories with icons and descriptions
- **Dark/Light Themes** - User preference-based theme switching

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS with custom components
- **State Management**: TanStack Query (React Query) + Zustand
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React + Heroicons
- **PWA**: Vite PWA plugin with Workbox

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with native pg driver
- **Authentication**: JWT with bcrypt password hashing
- **Email**: Nodemailer with Gmail SMTP
- **File Upload**: Multer for profile images
- **Security**: Helmet, CORS, XSS protection, rate limiting
- **Logging**: Winston with daily log rotation
- **Scheduling**: Node-cron for automated tasks

### Database & Hosting
- **Database**: Supabase (PostgreSQL)
- **Backend Hosting**: Render
- **Frontend Hosting**: Vercel
- **File Storage**: Server-based uploads with CORS support

## 📁 Project Structure

```
SpendWise/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Main application pages
│   │   ├── hooks/         # Custom React hooks
│   │   ├── context/       # React context providers
│   │   ├── utils/         # Utility functions
│   │   └── config/        # Configuration files
│   ├── public/            # Static assets
│   └── dist/              # Production build output
├── server/                # Backend Node.js application
│   ├── routes/            # API route definitions
│   ├── controllers/       # Business logic controllers
│   ├── middleware/        # Express middleware
│   ├── config/            # Database and app configuration
│   ├── utils/             # Server utilities
│   └── uploads/           # File upload storage
└── mcp-tools/             # Development tools and scripts
```

## 🚀 Quick Start (For Learning & Development)

### Prerequisites

- Node.js 18+ and npm 8+
- PostgreSQL database (or Supabase account)
- Gmail account for email services (optional)

### 1. Clone the Repository

```bash
git clone https://github.com/HananelSabag/SpendWise.git
cd SpendWise
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 3. Environment Configuration

**Note**: You'll need to create your own environment files as they're not included in the repository for security reasons.

**Server (.env in server/ directory):**
```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Email (optional)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Server
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Client (.env in client/ directory):**
```env
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_CLIENT_URL=http://localhost:5173
VITE_ENVIRONMENT=development
VITE_DEBUG_MODE=true
```

### 4. Database Setup

Run the database migrations (if using local PostgreSQL):
```bash
cd server
npm run migrate
```

For Supabase, import the provided SQL schema file.

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📱 Mobile Development

The application supports mobile development with network access:

```bash
# Start with network access for mobile testing
cd client
npm run dev:mobile

# Your mobile device can access the app at:
# http://YOUR_LOCAL_IP:5173
```

## 🧪 Testing

```bash
# Run frontend tests
cd client
npm run test

# Run backend tests
cd server
npm run test

# Lint code
npm run lint
```

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

This is a portfolio project, but feedback and suggestions are welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/suggestion`)
3. Commit your changes (`git commit -m 'Add suggestion'`)
4. Push to the branch (`git push origin feature/suggestion`)
5. Open a Pull Request

## 📞 Contact

For questions about this project or collaboration opportunities:

**Hananel Sabag**  
💼 GitHub: [@HananelSabag](https://github.com/HananelSabag)

---

**SpendWise** - A full-stack portfolio project demonstrating modern web development practices and technologies.
