# SpendWise Server - Node.js Backend API

A robust, production-ready Express.js backend API for the SpendWise expense tracking application, featuring JWT authentication, PostgreSQL database integration, and comprehensive security middleware.

## 👨‍💻 Author & Portfolio Project

**Hananel Sabag** - Software Engineer  
💼 GitHub: [@HananelSabag](https://github.com/HananelSabag)

> **Backend Portfolio Showcase** - This Node.js API demonstrates backend development expertise including Express.js, PostgreSQL, JWT authentication, security middleware, email services, file uploads, logging, and production deployment.

## ⚠️ **Portfolio Project Notice**

This backend is part of a portfolio demonstration project. While you can explore and learn from the code, please note that sensitive configuration files and production secrets are excluded for security reasons.

## 🚀 Tech Stack

### Core Framework
- **Node.js 18+** - JavaScript runtime with ES2020+ features
- **Express.js 4.21** - Fast, unopinionated web framework
- **PostgreSQL** - Robust relational database with JSON support

### Authentication & Security
- **JWT (jsonwebtoken)** - Stateless authentication tokens
- **bcrypt** - Password hashing with salt rounds
- **Helmet** - Security headers and protection
- **CORS** - Cross-origin resource sharing configuration
- **XSS Protection** - Cross-site scripting prevention
- **Rate Limiting** - API request rate limiting

### Database & ORM
- **pg (node-postgres)** - Native PostgreSQL client
- **Connection Pooling** - Efficient database connection management
- **Migrations** - Database schema version control

### Utilities & Services
- **Nodemailer** - Email service integration (Gmail SMTP)
- **Multer** - File upload handling for profile images
- **Winston** - Comprehensive logging with daily rotation
- **Node-cron** - Scheduled task management
- **Moment Timezone** - Date/time manipulation with timezone support
- **Compression** - Response compression middleware

## 📁 Project Structure

```
server/
├── config/                 # Configuration files
│   ├── db.js              # Database connection and pooling
│   └── email.js           # Email service configuration
├── controllers/           # Business logic controllers
│   ├── authController.js  # Authentication logic
│   ├── userController.js  # User management
│   ├── transactionController.js
│   ├── categoryController.js
│   └── exportController.js
├── middleware/            # Express middleware
│   ├── auth.js           # JWT authentication middleware
│   ├── errorHandler.js   # Global error handling
│   ├── rateLimiter.js    # Rate limiting configuration
│   ├── requestId.js      # Request ID generation
│   └── validation.js     # Input validation
├── routes/               # API route definitions
│   ├── userRoutes.js     # User-related endpoints
│   ├── transactionRoutes.js
│   ├── categoryRoutes.js
│   ├── exportRoutes.js
│   └── onboarding.js
├── utils/                # Utility functions
│   ├── logger.js         # Winston logger configuration
│   ├── scheduler.js      # Cron job management
│   ├── emailService.js   # Email sending utilities
│   └── helpers.js        # General helper functions
├── models/               # Database models (if using ORM)
├── migrations/           # Database migration files
├── db/                   # Database-related files
│   └── seeds/           # Database seed files
├── uploads/              # File upload storage
├── logs/                 # Application logs
├── index.js              # Main server entry point
├── app.js                # Express app configuration
└── package.json          # Dependencies and scripts
```

## 🔐 Authentication Flow

### JWT Token System
- **Access Token** - Short-lived (15 minutes) for API access
- **Refresh Token** - Long-lived (7 days) for token renewal
- **Email Verification** - Required for account activation

### Authentication Endpoints
```
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
POST /api/auth/refresh     # Token refresh
POST /api/auth/logout      # User logout
POST /api/auth/verify-email # Email verification
POST /api/auth/forgot-password # Password reset request
POST /api/auth/reset-password  # Password reset
```

## 📊 API Endpoints

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |
| POST | `/refresh` | Refresh access token | No |
| POST | `/logout` | User logout | Yes |
| POST | `/verify-email` | Verify email address | No |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password` | Reset password with token | No |

### User Routes (`/api/users`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/profile` | Get user profile | Yes |
| PUT | `/profile` | Update user profile | Yes |
| PUT | `/preferences` | Update user preferences | Yes |
| POST | `/upload-avatar` | Upload profile image | Yes |
| DELETE | `/account` | Delete user account | Yes |

### Transaction Routes (`/api/transactions`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get user transactions | Yes |
| POST | `/` | Create new transaction | Yes |
| GET | `/:id` | Get specific transaction | Yes |
| PUT | `/:id` | Update transaction | Yes |
| DELETE | `/:id` | Delete transaction | Yes |
| GET | `/stats` | Get transaction statistics | Yes |
| POST | `/bulk` | Bulk transaction operations | Yes |

### Category Routes (`/api/categories`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get user categories | Yes |
| POST | `/` | Create new category | Yes |
| PUT | `/:id` | Update category | Yes |
| DELETE | `/:id` | Delete category | Yes |
| GET | `/default` | Get default categories | Yes |

### Export Routes (`/api/export`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/csv` | Export transactions as CSV | Yes |
| GET | `/json` | Export transactions as JSON | Yes |
| GET | `/pdf` | Export transactions as PDF | Yes |

### Onboarding Routes (`/api/onboarding`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/status` | Get onboarding status | Yes |
| POST | `/complete` | Complete onboarding step | Yes |
| POST | `/skip` | Skip onboarding step | Yes |

## 🛠 Development

### Prerequisites
- Node.js 18+ and npm 8+
- PostgreSQL 12+ (or Supabase account)
- Gmail account for email services (optional)

### Installation

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Start production server
npm start
```

### Environment Variables

Create a `.env` file in the server directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/spendwise
DB_MAX_CONNECTIONS=10
DB_MIN_CONNECTIONS=2
DB_CONNECTION_TIMEOUT=30000
DB_IDLE_TIMEOUT=30000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (Optional)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
EMAIL_FROM=SpendWise <noreply@spendwise.com>

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
CLIENT_URL=http://localhost:5173

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d
```

### Database Setup

#### Using Local PostgreSQL

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE spendwise;

# Connect to the database
\c spendwise

# Run migrations (in order)
\i db/migrations/001_init.sql
\i db/migrations/002_users.sql
\i db/migrations/003_categories.sql
\i db/migrations/004_transactions.sql
\i db/migrations/005_recurring.sql

# Insert seed data (optional)
\i db/seeds/development.sql
```

#### Using Supabase

1. Create a new Supabase project
2. Copy the connection string from Settings > Database
3. Import the provided SQL schema file
4. Update `DATABASE_URL` in your `.env` file

### Available Scripts

```bash
# Development
npm run dev          # Start with nodemon (auto-reload)
npm start           # Start production server

# Database
npm run migrate     # Run database migrations
npm run seed        # Insert seed data
npm run db:reset    # Reset database (dev only)

# Utilities
npm run logs        # View application logs
npm test           # Run tests (when implemented)
```

## 🔒 Security Features

### Authentication Security
- **Password Hashing** - bcrypt with 12 salt rounds
- **JWT Tokens** - Secure token generation and validation
- **Token Rotation** - Automatic refresh token rotation
- **Rate Limiting** - Prevent brute force attacks

### API Security
- **Helmet** - Security headers (CSP, HSTS, etc.)
- **CORS** - Strict origin validation
- **XSS Protection** - Input sanitization
- **SQL Injection Prevention** - Parameterized queries
- **File Upload Security** - Type and size validation

### Data Protection
- **Input Validation** - Comprehensive request validation
- **Error Handling** - Secure error messages
- **Logging** - Security event logging
- **Environment Variables** - Sensitive data protection

## 📝 Middleware Stack

### Request Processing Order
1. **Trust Proxy** - Handle reverse proxy headers
2. **Helmet** - Security headers
3. **Compression** - Response compression
4. **CORS** - Cross-origin handling
5. **Body Parser** - JSON/URL-encoded parsing
6. **Request ID** - Unique request identification
7. **Rate Limiter** - Request rate limiting
8. **Authentication** - JWT token validation (protected routes)
9. **Route Handlers** - Business logic
10. **Error Handler** - Global error handling

## 📊 Database Schema

### Core Tables
- **users** - User accounts and profiles
- **categories** - Transaction categories (user + default)
- **transactions** - Financial transactions
- **recurring_transactions** - Recurring transaction templates
- **user_preferences** - User settings and preferences
- **email_verifications** - Email verification tokens
- **password_resets** - Password reset tokens

### Key Relationships
- Users have many transactions
- Users have many categories
- Transactions belong to categories
- Users have preferences
- Recurring transactions generate transactions

## 🚀 Production Deployment

### Render Deployment

1. **Create Web Service** on Render
2. **Connect Repository** - Link your GitHub repository
3. **Configure Build Settings**:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: 18+

4. **Environment Variables** (Production):
```env
# Database
DATABASE_URL=your-supabase-connection-string

# Server
NODE_ENV=production
PORT=10000

# JWT Secrets (Generate strong secrets!)
JWT_SECRET=your-production-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-production-refresh-secret-min-32-chars

# Email Service
GMAIL_USER=your-production-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password

# CORS
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
CLIENT_URL=https://your-frontend-domain.vercel.app

# Performance
DB_MAX_CONNECTIONS=10
DB_MIN_CONNECTIONS=2
```

### Health Monitoring

The server includes a health check endpoint:

```bash
GET /health

Response:
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

## 📋 Logging

### Log Levels
- **error** - Error conditions
- **warn** - Warning conditions
- **info** - Informational messages
- **debug** - Debug-level messages

### Log Files
- **application.log** - General application logs
- **error.log** - Error-only logs
- **access.log** - HTTP request logs

### Log Configuration
```javascript
// Winston logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## 🔧 Configuration

### Database Connection Pooling
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_MAX_CONNECTIONS) || 10,
  min: parseInt(process.env.DB_MIN_CONNECTIONS) || 2,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000
});
```

### Rate Limiting Configuration
```javascript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
});
```

## 📞 Support & Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify `DATABASE_URL` format
   - Check network connectivity
   - Ensure database server is running

2. **JWT Token Issues**
   - Verify `JWT_SECRET` is set and secure
   - Check token expiration times
   - Ensure client sends tokens correctly

3. **Email Service Issues**
   - Verify Gmail app password
   - Check SMTP settings
   - Ensure 2FA is enabled on Gmail

4. **CORS Issues**
   - Verify `ALLOWED_ORIGINS` includes your frontend URL
   - Check preflight request handling
   - Ensure credentials are included in requests

### Debug Mode

Enable debug logging:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

## 🔗 Related Documentation

- [Main Project README](../README.md)
- [Client Documentation](../client/README.md)
- [Database Schema](./db/schema.md)

---

**SpendWise Server** - A robust Node.js backend for smart expense tracking.
