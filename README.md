
# SpendWise: Advanced Personal Finance Management System

SpendWise is a sophisticated full-stack application designed to revolutionize personal finance management through real-time tracking, advanced analytics, and intelligent financial insights.

## Key Features

- **Real-time Balance Tracking**
  - Daily balance updates
  - Expense categorization
  - Income management

- **Smart Analytics**
  - Expense pattern recognition
  - Spending forecasts
  - Budget optimization recommendations

- **Advanced Security**
  - JWT authentication
  - Rate limiting
  - Data encryption

- **Responsive Design**
  - Mobile-first approach
  - Cross-platform compatibility
  - Intuitive user interface

## Tech Stack

### Frontend
- React 18
- Tailwind CSS
- Recharts
- Axios

### Backend
- Node.js
- Express.js
- PostgreSQL
- Python (Analytics Engine)

### DevOps
- Docker
- JWT Authentication
- Swagger Documentation
- Winston Logging

## Quick Start

### Prerequisites
- Node.js (v14+)
- PostgreSQL (v12+)
- Python (v3.8+)

### Installation

```bash
# Clone repository
git clone https://github.com/HananelSabag/SpendWise.git
cd SpendWise

# Backend setup
cd server
npm install
cp .env.example .env
# Configure .env file with your credentials

# Frontend setup
cd ../client
npm install

# Database setup
psql -U postgres
CREATE DATABASE spendwise;
\q

# Run migrations
cd ../server
npm run db:migrate
```

### Development Environment

```bash
# Start backend server
cd server
npm run dev

# Start frontend development server
cd ../client
npm run dev
```

Access the application:
- Frontend: http://localhost:5173
- API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs

## Project Structure

```
SpendWise/
├── client/                # React frontend
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   └── services/     # API services
├── server/               # Node.js backend
│   ├── controllers/      # Request handlers
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   └── middleware/      # Custom middleware
└── python/              # Analytics engine
    └── analysis/        # Data analysis scripts
```

## API Documentation

Comprehensive API documentation is available at `/api-docs` when running the server. The API follows RESTful principles and includes:

- Authentication endpoints
- User management
- Transaction operations
- Analytics endpoints

## Testing

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd client
npm test
```

## Deployment

The application supports various deployment options:

```bash
# Production build
cd client
npm run build

cd ../server
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Hananel Sabag**
- GitHub: [@HananelSabag](https://github.com/HananelSabag)
- LinkedIn: [Hananel Sabag](https://linkedin.com/in/hananel-sabag)

## Acknowledgments

- Modern financial management principles
- React best practices
- Node.js design patterns
- PostgreSQL optimization techniques
```
