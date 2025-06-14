# 👋 Welcome Interviewers - SpendWise Portfolio Project

## 🎯 **About This Project**

This is a **full-stack portfolio project** created by **Hananel Sabag** ([@HananelSabag](https://github.com/HananelSabag)) to demonstrate modern web development skills. The project showcases expertise in React, Node.js, PostgreSQL, authentication, security, and production deployment.

## 🚀 **What You'll See Here**

### **Frontend Skills Demonstrated**
- ⚛️ **React 18** with modern hooks and patterns
- ⚡ **Vite** for lightning-fast development
- 🎨 **Tailwind CSS** with responsive design
- 📱 **PWA** implementation with offline support
- 🌐 **Multi-language** support (English/Hebrew with RTL)
- 🔄 **TanStack Query** for smart data management
- 📊 **Recharts** for data visualization
- 🎭 **Framer Motion** for smooth animations

### **Backend Skills Demonstrated**
- 🟢 **Node.js/Express** RESTful API
- 🔐 **JWT Authentication** with refresh tokens
- 🛡️ **Security Middleware** (Helmet, CORS, Rate Limiting)
- 📧 **Email Services** with Nodemailer
- 📁 **File Upload** handling with Multer
- 📝 **Winston Logging** with rotation
- 🗄️ **PostgreSQL** with connection pooling
- ⏰ **Scheduled Tasks** with node-cron

### **Architecture & Best Practices**
- 🏗️ **Clean Architecture** with separation of concerns
- 🔒 **Security Best Practices** throughout
- 📚 **Comprehensive Documentation**
- 🧪 **Error Handling** and validation
- 🚀 **Production Deployment** ready
- 📱 **Mobile-First** responsive design

## 🔍 **How to Explore This Project**

### **1. Browse the Code Structure**
```
📂 Key Directories to Review:
├── client/src/components/    # React components showcase
├── client/src/hooks/         # Custom hooks implementation
├── client/src/context/       # State management patterns
├── server/routes/            # API endpoint design
├── server/controllers/       # Business logic organization
├── server/middleware/        # Security and validation
└── server/utils/             # Utility functions and services
```

### **2. Review Key Files**
- **`client/src/hooks/useAuth.js`** - Authentication flow
- **`client/src/context/LanguageContext.jsx`** - Multi-language implementation
- **`server/controllers/authController.js`** - JWT authentication
- **`server/middleware/auth.js`** - Security middleware
- **`client/src/pages/Dashboard.jsx`** - Main application interface
- **`server/routes/transactionRoutes.js`** - RESTful API design

### **3. Check Configuration Files**
- **`client/vite.config.js`** - Build optimization
- **`client/tailwind.config.js`** - Design system
- **`server/index.js`** - Server setup and middleware stack

## 🛠 **Want to Run It Locally?**

### **Quick Setup (5 minutes)**

1. **Clone and Install**
   ```bash
   git clone https://github.com/HananelSabag/SpendWise.git
   cd SpendWise
   npm install
   cd client && npm install
   cd ../server && npm install
   ```

2. **Setup Environment**
   ```bash
   # Copy the development template
   cp ENV_DEVELOPMENT_TEMPLATE server/.env
   cp ENV_DEVELOPMENT_TEMPLATE client/.env
   
   # Edit the .env files with your database credentials
   # (See ENV_DEVELOPMENT_TEMPLATE for detailed instructions)
   ```

3. **Database Options**
   - **Quick**: Create free [Supabase](https://supabase.com) account
   - **Local**: Install PostgreSQL locally

4. **Start Development**
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend  
   cd client && npm run dev
   ```

5. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

### **Don't Want to Set Up? No Problem!**
You can explore all the source code without running the project. The architecture, patterns, and implementation details are all visible in the codebase.

## 🎨 **Key Features to Notice**

### **User Experience**
- 🌓 **Dark/Light Mode** with system preference detection
- 🌍 **Language Switching** (English ↔ Hebrew) with RTL support
- 📱 **Responsive Design** that works on all devices
- ⚡ **Fast Loading** with code splitting and caching
- 🔄 **Offline Support** through PWA implementation

### **Technical Implementation**
- 🔐 **Secure Authentication** with JWT and refresh tokens
- 📊 **Real-time Dashboard** with interactive charts
- 💾 **Smart Caching** with optimistic updates
- 🛡️ **Input Validation** and XSS protection
- 📧 **Email Verification** system
- 📁 **File Upload** with security checks

## 🔒 **Security & Privacy Note**

This repository is configured to show **all the source code** while protecting **sensitive configuration**:

### **✅ What's Visible (For Learning)**
- Complete React component architecture
- Full Node.js API implementation
- Database schema and migrations
- Security middleware implementation
- Authentication flow logic
- All business logic and utilities

### **🔒 What's Protected**
- Production environment variables
- Database credentials
- API keys and secrets
- User upload files
- Production deployment configs

This approach allows you to see the **complete technical implementation** while ensuring the **live production site remains secure**.

## 💼 **Skills Assessment Areas**

When reviewing this project, you might want to focus on:

### **Frontend Development**
- React component design and reusability
- State management with Context and TanStack Query
- Form handling and validation
- Responsive design implementation
- Performance optimization techniques

### **Backend Development**
- RESTful API design principles
- Authentication and authorization
- Database design and queries
- Security middleware implementation
- Error handling and logging

### **Full-Stack Integration**
- API design and consumption
- Real-time data synchronization
- File upload handling
- Email service integration
- Production deployment readiness

## 📞 **Questions or Discussion?**

I'd be happy to discuss any aspect of this project:

**Hananel Sabag**  
💼 GitHub: [@HananelSabag](https://github.com/HananelSabag)

### **Great Discussion Topics**
- Architecture decisions and trade-offs
- Security implementation choices
- Performance optimization strategies
- Scalability considerations
- Technology stack selection reasoning
- Deployment and DevOps practices

---

**Thank you for taking the time to review my work!** 🙏

This project represents my passion for creating well-architected, secure, and user-friendly web applications. I look forward to discussing how these skills can contribute to your team's success. 