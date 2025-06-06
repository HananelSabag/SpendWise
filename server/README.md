# SpendWise Backend API

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21.2-blue.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-blue.svg)](https://postgresql.org/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)
[![Production Ready](https://img.shields.io/badge/Production-Ready-green.svg)](https://spendwise-dx8g.onrender.com/health)

> **Enterprise-grade REST API for expense tracking and financial management**
> 
> Developed by **Hananel Sabag** - Full Stack Developer

## 🚀 Live Production API

- **Base URL**: `https://spendwise-dx8g.onrender.com`
- **Health Check**: `https://spendwise-dx8g.onrender.com/health`
- **API Version**: `v1`
- **Status**: ✅ **Production Ready**

## 🏗️ Architecture Overview

SpendWise Backend is a robust, production-ready Node.js API built with modern enterprise patterns and best practices. The system is designed for scalability, security, and maintainability.

### **Key Features**

- 🔐 **JWT Authentication** with refresh token rotation
- 📊 **Real-time Dashboard** with optimized queries
- 🔄 **Recurring Transactions** with intelligent scheduling
- 📧 **Email Verification** with SMTP integration
- 🗃️ **Data Export** (CSV, JSON, PDF ready)
- 📱 **File Upload** with security validation
- ⚡ **Rate Limiting** and DDoS protection
- 🔍 **Advanced Search** with full-text capabilities
- 📈 **Analytics & Statistics** with period-based insights
- 🛡️ **Security Headers** and XSS protection

## 🗄️ Database Architecture

### **Supabase PostgreSQL Cloud Database**

- **Provider**: Supabase (PostgreSQL 15.x)
- **Connection**: Direct IP with SSL encryption
- **Pool Configuration**: Optimized for cloud deployment
- **Backup**: Automated daily backups
- **Scaling**: Horizontal scaling ready

### **Database Schema**

```sql
-- Core Tables
├── users                    # User accounts and preferences
├── categories              # Transaction categories (income/expense)
├── expenses                # Expense transactions
├── income                  # Income transactions
├── recurring_templates     # Recurring transaction templates
├── user_verification_tokens # Email verification system
└── password_reset_tokens   # Password reset workflow

-- Views & Functions
├── daily_balances          # Optimized balance calculations
├── get_period_balance()    # Period-based balance function
├── generate_recurring_transactions() # Auto-generation system
└── update_future_transactions()     # Template propagation
```

### **Advanced Database Features**

- **Soft Deletes**: Data integrity with `deleted_at` timestamps
- **Optimized Indexes**: Performance-tuned for common queries
- **Stored Procedures**: Complex business logic in database
- **Views**: Pre-computed balance calculations
- **Triggers**: Automatic data consistency
- **Connection Pooling**: Efficient resource management

## 🛠️ Technology Stack

### **Backend Framework**
- **Node.js** 18.x - JavaScript runtime
- **Express.js** 4.21.2 - Web application framework
- **PostgreSQL** 15.x - Primary database (Supabase)

### **Authentication & Security**
- **jsonwebtoken** - JWT implementation
- **bcrypt** - Password hashing
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **express-rate-limit** - API rate limiting
- **xss** - XSS protection

### **Data & Utilities**
- **pg** - PostgreSQL client
- **multer** - File upload handling
- **nodemailer** - Email service
- **winston** - Advanced logging
- **node-cron** - Scheduled tasks
- **moment-timezone** - Date/time management

### **Production & Monitoring**
- **compression** - Response compression
- **winston-daily-rotate-file** - Log rotation
- **dotenv** - Environment management

## 📊 API Endpoints

### **Authentication & User Management**
```http
POST   /api/v1/users/register              # User registration
POST   /api/v1/users/login                 # User authentication
POST   /api/v1/users/logout                # Session termination
POST   /api/v1/users/refresh-token         # Token refresh
GET    /api/v1/users/verify-email/:token   # Email verification
POST   /api/v1/users/resend-verification   # Resend verification
POST   /api/v1/users/forgot-password       # Password reset request
POST   /api/v1/users/reset-password        # Password reset
GET    /api/v1/users/profile               # Get user profile
PUT    /api/v1/users/profile               # Update profile
POST   /api/v1/users/profile/picture       # Upload profile picture
```

### **Transaction Management**
```http
GET    /api/v1/transactions/dashboard       # Dashboard data
GET    /api/v1/transactions/recent          # Recent transactions
GET    /api/v1/transactions/period/:period  # Period-based data
GET    /api/v1/transactions                 # List with filters
POST   /api/v1/transactions/:type           # Create transaction
PUT    /api/v1/transactions/:type/:id       # Update transaction
DELETE /api/v1/transactions/:type/:id       # Delete transaction
GET    /api/v1/transactions/search          # Search transactions
GET    /api/v1/transactions/stats           # Statistics
```

### **Recurring Transactions**
```http
GET    /api/v1/transactions/recurring       # List templates
GET    /api/v1/transactions/templates       # Template management
PUT    /api/v1/transactions/templates/:id   # Update template
DELETE /api/v1/transactions/templates/:id   # Delete template
POST   /api/v1/transactions/templates/:id/skip # Skip dates
POST   /api/v1/transactions/generate-recurring # Manual generation
```

### **Categories & Analytics**
```http
GET    /api/v1/categories                   # List categories
POST   /api/v1/categories                   # Create category
PUT    /api/v1/categories/:id               # Update category
DELETE /api/v1/categories/:id               # Delete category
GET    /api/v1/categories/:id/stats         # Category statistics
```

### **Data Export**
```http
GET    /api/v1/export/options               # Export options
GET    /api/v1/export/csv                   # CSV export
GET    /api/v1/export/json                  # JSON export
GET    /api/v1/export/pdf                   # PDF export (coming)
```

## 🏃‍♂️ Quick Start

### **Prerequisites**
- Node.js 18.x or higher
- PostgreSQL database (or Supabase account)
- npm or yarn package manager

### **Installation**

```bash
# Clone the repository
git clone <repository-url>
cd SpendWise/server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Or production server
npm start
```

### **Environment Configuration**

```bash
# Database (Required)
DATABASE_URL=postgresql://username:password@host:port/database

# Server
NODE_ENV=production
PORT=10000

# JWT Secrets (Required)
JWT_SECRET=your_super_secure_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Security
ALLOWED_ORIGINS=https://your-frontend.com
```

## 🛡️ Security Features

### **Authentication Security**
- JWT with refresh token rotation
- Secure password hashing (bcrypt)
- Email verification system
- Rate limiting on auth endpoints
- Session management

### **API Security**
- CORS protection
- Helmet security headers
- XSS protection
- SQL injection prevention
- Input validation & sanitization
- File upload security

### **Data Protection**
- Sensitive data filtering in logs
- Soft deletes for data integrity
- Environment variable protection
- SSL/TLS encryption
- Database connection pooling

## 📈 Performance Optimizations

### **Database Performance**
- Optimized indexes on frequently queried columns
- Connection pooling for efficient resource usage
- Prepared statements for SQL injection prevention
- Database views for complex calculations
- Query result caching

### **API Performance**
- Response compression (gzip)
- Request deduplication
- Efficient pagination
- Optimized serialization
- Memory usage monitoring

### **Monitoring & Logging**
- Structured logging with Winston
- Request ID tracking
- Performance metrics
- Error tracking and reporting
- Health check endpoints

## 🔄 Recurring Transaction System

### **Intelligent Scheduling**
- Daily, weekly, monthly patterns
- Flexible date configurations
- Skip date functionality
- Template-based generation
- Automatic propagation

### **Business Logic**
```javascript
// Example: Monthly rent on the 1st
{
  interval_type: 'monthly',
  day_of_month: 1,
  amount: 1200,
  description: 'Monthly Rent'
}

// Example: Weekly groceries on Sundays
{
  interval_type: 'weekly',
  day_of_week: 0, // Sunday
  amount: 150,
  description: 'Weekly Groceries'
}
```

## 📊 Analytics & Reporting

### **Dashboard Metrics**
- Real-time balance calculations
- Period-based comparisons (daily, weekly, monthly, yearly)
- Category breakdowns
- Spending trends and patterns
- Income vs expense analysis

### **Advanced Features**
- Custom date range queries
- Category-wise statistics
- Recurring transaction insights
- Export capabilities
- Search functionality

## 🚀 Deployment

### **Production Deployment (Render)**
The API is deployed on Render with the following configuration:

```yaml
# Build Command
npm install

# Start Command
npm start

# Environment Variables
NODE_ENV=production
DATABASE_URL=<supabase_connection_string>
JWT_SECRET=<secure_secret>
# ... other environment variables
```

### **Health Monitoring**
- **Health Check**: `GET /health`
- **Database Status**: Included in health response
- **Uptime Monitoring**: 99.9% availability target
- **Error Tracking**: Comprehensive logging system

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

## 📁 Project Structure

```
server/
├── config/          # Database and app configuration
│   ├── db.js         # PostgreSQL/Supabase connection
│   └── email.js      # Email service configuration
├── controllers/      # Request handlers
│   ├── authController.js
│   ├── transactionController.js
│   ├── categoryController.js
│   └── exportController.js
├── middleware/       # Express middleware
│   ├── auth.js       # JWT authentication
│   ├── validate.js   # Input validation
│   ├── rateLimiter.js # API rate limiting
│   ├── errorHandler.js # Error handling
│   └── upload.js     # File upload handling
├── models/          # Data layer
│   ├── User.js       # User model
│   ├── Transaction.js # Transaction model
│   ├── Category.js   # Category model
│   └── RecurringTemplate.js
├── routes/          # API routes
│   ├── userRoutes.js
│   ├── transactionRoutes.js
│   ├── categoryRoutes.js
│   └── exportRoutes.js
├── utils/           # Utility functions
│   ├── logger.js     # Winston logging
│   ├── scheduler.js  # Cron jobs
│   ├── TimeManager.js # Date utilities
│   ├── dbQueries.js  # Database queries
│   └── errorCodes.js # Error definitions
├── db/              # Database schema
│   ├── 01_schema.sql
│   ├── 02_procedures.sql
│   ├── 03_balance_views.sql
│   └── 04_indexes.sql
└── index.js         # Application entry point
```

## 🤝 Contributing

This is a personal project by **Hananel Sabag**. For collaboration opportunities or questions, please reach out through professional channels.

## 📧 Contact

**Hananel Sabag**  
Full Stack Developer  
Specializing in Node.js, React, and PostgreSQL

## 📄 License

This project is licensed under the ISC License.

---

## 🏆 Technical Highlights

### **Code Quality**
- ✅ Modern ES6+ JavaScript
- ✅ Comprehensive error handling
- ✅ Input validation and sanitization
- ✅ Production-ready logging
- ✅ Security best practices

### **Scalability**
- ✅ Database connection pooling
- ✅ Horizontal scaling ready
- ✅ Stateless API design
- ✅ Efficient query optimization
- ✅ Caching strategies

### **Maintainability**
- ✅ Clean architecture patterns
- ✅ Comprehensive documentation
- ✅ Modular code structure
- ✅ Environment-based configuration
- ✅ Professional git workflow

---

> **Note**: This backend API demonstrates enterprise-level Node.js development skills, including advanced database design, security implementation, and production deployment capabilities.
