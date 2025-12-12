# AccuBooks Backend

A comprehensive Node.js/Express backend for the AccuBooks accounting platform with TypeScript, Prisma ORM, and advanced monitoring capabilities.

## 🚀 Features

### Core Architecture
- **TypeScript**: Full TypeScript migration with strict type checking
- **Express.js**: RESTful API framework with middleware support
- **Prisma ORM**: Advanced database management with singleton pattern
- **PostgreSQL**: Primary database with optimized queries
- **Redis**: Caching and session storage (optional)

### Authentication & Security
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Role-Based Access Control**: Multi-role authorization system
- **Rate Limiting**: API rate limiting with configurable windows
- **Input Validation**: Comprehensive request validation with error handling
- **Security Headers**: CORS, helmet, and security middleware

### Error Handling & Monitoring
- **Typed Custom Errors**: Comprehensive error classes with status codes
- **Global Error Handler**: Centralized error processing with detailed logging
- **System Panic Monitor**: Memory leak detection and performance monitoring
- **Health Checks**: Comprehensive system health monitoring
- **Metrics Collection**: Request/response metrics, database stats, system resources

### Business Logic
- **User Management**: User registration, authentication, and profile management
- **Account Management**: Chart of accounts, financial accounts
- **Transaction Processing**: Journal entries, financial transactions
- **Invoice Management**: Invoice creation, tracking, and payment processing
- **Reporting**: Financial reports with drill-down capabilities
- **Audit Logging**: Comprehensive audit trail for all operations

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/          # Request handlers
│   ├── services/            # Business logic layer
│   ├── routes/              # API route definitions
│   ├── middleware/          # Express middleware
│   ├── utils/               # Utility functions
│   ├── config/              # Configuration management
│   ├── lib/                 # Library files (Prisma, etc.)
│   ├── types/               # TypeScript type definitions
│   └── __tests__/           # Test files
├── prisma/                  # Database schema and migrations
├── scripts/                 # Build and utility scripts
├── dist/                    # Compiled JavaScript output
└── logs/                    # Application logs
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL 13+
- Redis (optional)
- npm or yarn

### Environment Setup

1. **Clone and install dependencies**:
```bash
cd backend
npm install --legacy-peer-deps
```

2. **Environment Variables**:
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

Required variables:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/accubooks"
POSTGRES_DB=accubooks
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password

# JWT
JWT_SECRET=your-secret-key-at-least-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-key-at-least-32-characters
SESSION_SECRET=your-session-secret-at-least-32-characters

# Server
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3000
```

3. **Database Setup**:
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern="auth.test.ts"
```

## 📊 API Documentation

### Authentication Endpoints
```
POST /api/v1/auth/register     - User registration
POST /api/v1/auth/login        - User login
POST /api/v1/auth/refresh      - Refresh JWT token
POST /api/v1/auth/logout       - User logout
GET  /api/v1/auth/profile      - Get user profile
PUT  /api/v1/auth/profile      - Update user profile
```

### Account Management
```
GET    /api/v1/accounts        - List accounts
POST   /api/v1/accounts        - Create account
GET    /api/v1/accounts/:id    - Get account details
PUT    /api/v1/accounts/:id    - Update account
DELETE /api/v1/accounts/:id    - Delete account
```

### Transactions
```
GET    /api/v1/transactions    - List transactions
POST   /api/v1/transactions    - Create transaction
GET    /api/v1/transactions/:id - Get transaction details
PUT    /api/v1/transactions/:id - Update transaction
DELETE /api/v1/transactions/:id - Delete transaction
```

### Invoicing
```
GET    /api/v1/invoices        - List invoices
POST   /api/v1/invoices        - Create invoice
GET    /api/v1/invoices/:id    - Get invoice details
PUT    /api/v1/invoices/:id    - Update invoice
POST   /api/v1/invoices/:id/pay - Process payment
GET    /api/v1/invoices/:id/pdf - Download PDF
```

### Monitoring & Health
```
GET    /api/v1/monitoring/health      - System health check
GET    /api/v1/monitoring/metrics     - System metrics
GET    /api/v1/monitoring/alerts      - Active alerts
GET    /api/v1/monitoring/audit-logs  - Audit logs
```

## 🔧 Configuration

### Environment Variables
See `src/config/env.ts` for complete configuration schema with validation using Zod.

### Database Configuration
- **Prisma Schema**: `prisma/schema.prisma`
- **Migrations**: `prisma/migrations/`
- **Seed File**: `prisma/seed.ts`

### Logging Configuration
- **Log Level**: `error`, `warn`, `info`, `debug`
- **Log File**: `./logs/app.log`
- **Log Rotation**: Configurable size and file limits

## 📈 Monitoring & Health Checks

### System Metrics
- Request counts and response times
- Database connection pool status
- Memory and CPU usage
- Active handles and requests
- Authentication and security events

### Health Checks
- Database connectivity and response time
- Redis connectivity (if configured)
- Disk space availability
- Memory usage thresholds
- API endpoint availability

### Alerts System
- Automatic alert triggering for thresholds
- Alert acknowledgment and resolution
- Historical alert tracking
- Email notifications (configurable)

## 🧪 Testing

### Test Structure
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full workflow testing
- **Performance Tests**: Load and stress testing

### Test Configuration
- **Jest**: Test runner with TypeScript support
- **Supertest**: HTTP assertion testing
- **Prisma Test Environment**: Isolated database testing
- **Mock Services**: Service layer mocking

### Running Tests
```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test suite
npm test -- auth.test.ts
```

## 🔒 Security Features

### Authentication
- JWT access tokens with configurable expiration
- Refresh token rotation for enhanced security
- Password hashing with bcrypt
- Session management with Redis

### Authorization
- Role-based access control (RBAC)
- Resource-level permissions
- Company-based data isolation
- API endpoint protection

### Security Headers
- CORS configuration
- Helmet.js security headers
- Rate limiting per IP/user
- Request validation and sanitization

## 📝 Error Handling

### Custom Error Classes
- `AppError` - Base error class
- `NotFoundError` - 404 errors
- `ValidationError` - Input validation errors
- `DatabaseError` - Database operation errors
- `AuthError` - Authentication errors
- `AuthorizationError` - Permission errors
- `ConflictError` - Resource conflict errors
- `RateLimitError` - Rate limiting errors
- `ServiceUnavailableError` - Service downtime errors

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    },
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "req_123456789"
  }
}
```

## 🚀 Performance Optimizations

### Database Optimizations
- Connection pooling with Prisma
- Query optimization and indexing
- Database connection singleton pattern
- Transaction management

### Caching Strategy
- Redis-based caching (optional)
- In-memory caching for frequent queries
- Cache invalidation strategies
- Response caching for static data

### Memory Management
- Automatic garbage collection monitoring
- Memory leak detection and prevention
- Resource cleanup on graceful shutdown
- Performance metrics tracking

## 📦 Deployment

### Production Build
```bash
# Build TypeScript
npm run build

# Create production package
npm run package
```

### Environment Setup
- Production environment variables
- Database migrations
- SSL certificates
- Reverse proxy configuration (nginx/Apache)

### Docker Support
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY prisma ./prisma
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔄 Migration Guide

### From JavaScript to TypeScript
1. Install TypeScript dependencies
2. Update `tsconfig.json` for strict checking
3. Run migration script: `node scripts/migrate-to-typescript.cjs`
4. Fix compilation errors: `node scripts/fix-typescript-errors.cjs`
5. Update imports and type annotations

### Database Schema Updates
1. Modify `prisma/schema.prisma`
2. Generate migration: `npx prisma migrate dev --name <migration-name>`
3. Apply to database: `npx prisma migrate deploy`
4. Update client: `npx prisma generate`

## 🛠️ Development Scripts

### Available Scripts
```bash
npm run dev          # Development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
npm run test         # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run migrate:dev  # Run database migrations in development
npm run migrate:prod # Deploy migrations to production
npm run generate     # Generate Prisma client
npm run seed         # Seed database with sample data
npm run monitor      # Start monitoring dashboard
```

## 📚 API Documentation

### Swagger/OpenAPI
API documentation is available via Swagger/OpenAPI specification:
- Development: `http://localhost:3000/api-docs`
- Production: Configurable via environment variables

### Postman Collection
Import the Postman collection from `docs/postman-collection.json` for easy API testing.

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Run linting and tests
5. Submit pull request

### Code Standards
- TypeScript with strict mode
- ESLint for code quality
- Prettier for formatting
- 100% test coverage requirement
- Comprehensive documentation

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues
- **Database Connection**: Check DATABASE_URL and PostgreSQL status
- **TypeScript Errors**: Run `npm run build` to identify issues
- **Test Failures**: Ensure test database is configured
- **Memory Issues**: Check monitoring dashboard for leaks

### Getting Help
- Check the documentation in `docs/`
- Review error logs in `logs/`
- Monitor system health via `/api/v1/monitoring/health`
- Check GitHub issues for known problems

## 📈 Version History

### Phase 4 Updates (Current)
- ✅ Prisma Client Management - Singleton pattern implementation
- ✅ Error Handling Refactor - TypeScript custom error classes
- ✅ Monitoring & Health Checks - Comprehensive metrics system
- ✅ Environment Variable Validation - Zod-based validation
- ✅ TypeScript Migration - Full codebase migration
- ✅ API Endpoint Verification - Route structure validation
- ✅ Automated Testing Integration - Jest configuration updates
- ✅ Documentation Updates - Complete README and API docs

### Previous Phases
- Phase 3: Database & Migrations
- Phase 2: Core API Development
- Phase 1: Project Setup and Architecture

---

**AccuBooks Backend** - Modern, scalable, and secure accounting platform backend.
