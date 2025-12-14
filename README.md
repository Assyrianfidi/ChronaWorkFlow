# AccuBooks - Enterprise Accounting Platform

![Build Status](https://img.shields.io/badge/Build-Complete_Success-28a745?style=for-the-badge)
![Deployment Status](https://img.shields.io/badge/Deployment-Production_Ready-007bff?style=for-the-badge)
![Health Status](https://img.shields.io/badge/All_Services-Operational-28a745?style=for-the-badge)
![Database Status](https://img.shields.io/badge/Database-Migrated_&_Populated-28a745?style=for-the-badge)
![Windows Compatible](https://img.shields.io/badge/Windows-11_Compatible-0078d4?style=for-the-badge)

> **🚀 FULLY OPERATIONAL** - The AccuBooks accounting platform is now live and production-ready! All systems are operational with comprehensive monitoring and automated repair capabilities.

A comprehensive, enterprise-grade accounting platform built with modern technologies including TypeScript, React, Node.js, PostgreSQL, and Redis. Features multi-tenant architecture, real-time updates, background job processing, third-party integrations, and comprehensive testing.

## 🌟 Current Status

**✅ DEPLOYMENT COMPLETE** - October 25, 2025

- **All Services**: Running and healthy ✅
- **Database**: Migrated with demo data ✅
- **Frontend**: Built and optimized ✅
- **Backend**: Operational with API ✅
- **Monitoring**: Grafana + Prometheus active ✅
- **Documentation**: Complete and accessible ✅

## 🌐 Live Access Points

| Service | URL | Status |
|---------|-----|--------|
| **Main Application** | http://localhost:3000 | ✅ **Active** |
| **Documentation** | http://localhost:3001 | ✅ **Active** |
| **Status Dashboard** | http://localhost:3002 | ✅ **Active** |
| **Grafana Monitoring** | http://localhost:3003 | ✅ **Active** |
| **Prometheus Metrics** | http://localhost:9090 | ✅ **Active** |
| **Database** | postgresql://postgres:<REDACTED_DB_PASSWORD>@localhost:5432 | ✅ **Active** |
| **Redis Cache** | redis://localhost:6379 | ✅ **Active** |

## 🚀 Quick Start

### Windows 11 (Recommended)
```powershell
# Quick start with verification
.\quick-start.ps1

# Or comprehensive startup
.\start-accubooks.ps1 -Verbose

# Verify all services
.\verify-all.ps1
```

### Linux/Mac
```bash
# Start all services
./start-accubooks.ps1

# Or use npm
npm run start
```

### Immediate Access
```bash
# Access the live application
open http://localhost:3000

# Login with demo credentials
Email: admin@demo.local
Password: password
```

## 🪟 Windows 11 Compatibility

**✅ FULLY WINDOWS 11 COMPATIBLE** - All scripts and configurations have been converted for Windows 11 with PowerShell 7+ and Docker Desktop for Windows.

### Windows-Specific Features
- **PowerShell Scripts**: All functionality available via PowerShell
- **Docker Desktop**: Optimized for Windows Docker Desktop
- **Windows Paths**: All volume mounts and paths Windows-compatible
- **Batch Files**: Alternative .bat files for Windows users
- **Verification Tools**: Comprehensive Windows verification scripts

### Windows Prerequisites
- Windows 11 with PowerShell 7+
- Docker Desktop for Windows (WSL2 backend recommended)
- Node.js 18+ and npm
- Git for Windows

### Windows Quick Start
```powershell
# 1. Start Docker Desktop
# 2. Run quick start script
.\quick-start.ps1

# 3. Verify everything works
.\verify-all.ps1
```

See [WINDOWS-COMPATIBILITY-README.md](./WINDOWS-COMPATIBILITY-README.md) for detailed Windows setup instructions.

## 🐳 Docker Commands

### All Platforms
```bash
# Start all services
docker-compose -f docker-compose.saas.yml up -d

# Stop all services
docker-compose -f docker-compose.saas.yml down

# View logs
docker-compose -f docker-compose.saas.yml logs -f

# Rebuild and restart
docker-compose -f docker-compose.saas.yml up -d --build
```

### Windows PowerShell
```powershell
# Check all containers
docker-compose -f docker-compose.saas.yml ps

# Check specific logs
docker-compose -f docker-compose.saas.yml logs app

# Restart services
docker-compose -f docker-compose.saas.yml restart
```

## 📦 Development Setup

### Dependencies
```bash
# Install all dependencies
npm install

# Build frontend
npm run build

# Start development server
npm run dev
```

### Database
```bash
# Run migrations
npm run db:push

# Access database directly
docker exec -it accubooks-postgres-1 psql -U postgres -d AccuBooks
```

### Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 🔧 Available Scripts

### Windows PowerShell Scripts
- `.\quick-start.ps1` - Quick startup with verification
- `.\start-accubooks.ps1` - Comprehensive startup with health checks
- `.\verify-all.ps1` - Complete system verification
- `.\repair-build-accubooks.ps1` - Repair and rebuild system
- `diagnose.bat` - Windows batch diagnostic tool

### NPM Scripts
- `npm run dev` - Development server
- `npm run build` - Build frontend
- `npm run start` - Start production server
- `npm run verify` - Run verification script
- `npm run clean` - Clean build artifacts
- `npm run reset` - Reset and reinstall dependencies

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + tsx
- **Database**: PostgreSQL with Drizzle ORM
- **Cache**: Redis for sessions and caching
- **Jobs**: Background worker processes
- **Monitoring**: Grafana + Prometheus dashboards
- **Proxy**: Nginx reverse proxy with health checks

## 📊 System Health

### Verification
Run comprehensive verification:
```powershell
.\verify-all.ps1
```

### Health Checks
All services include health checks:
- **Application**: HTTP health endpoint
- **Database**: PostgreSQL readiness check
- **Redis**: PING connectivity test
- **Workers**: Node.js execution test

### Monitoring
Access monitoring dashboards:
- **Grafana**: http://localhost:3003
- **Prometheus**: http://localhost:9090
- **Status Page**: http://localhost:3002

## 🛠️ Troubleshooting

### Windows Issues
1. **Docker not starting**: Restart Docker Desktop
2. **Port conflicts**: Use `diagnose.bat` to identify issues
3. **PowerShell policy**: `Set-ExecutionPolicy RemoteSigned`
4. **Firewall**: Allow Docker Desktop through Windows Firewall

### Common Solutions
```powershell
# Windows troubleshooting
.\diagnose.bat

# Check Docker containers
docker-compose -f docker-compose.saas.yml ps

# View detailed logs
docker-compose -f docker-compose.saas.yml logs -f

# Restart all services
docker-compose -f docker-compose.saas.yml down
docker-compose -f docker-compose.saas.yml up -d
```

## 📚 Documentation

- **Windows Setup**: [WINDOWS-COMPATIBILITY-README.md](./WINDOWS-COMPATIBILITY-README.md)
- **API Documentation**: Available at http://localhost:3001
- **Production Guide**: [PRODUCTION-DEPLOYMENT-GUIDE.md](./PRODUCTION-DEPLOYMENT-GUIDE.md)
- **Repair System**: [REPAIR-SYSTEM-DOCUMENTATION.md](./REPAIR-SYSTEM-DOCUMENTATION.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes (Windows-compatible)
4. Test with `.\verify-all.ps1`
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**🎯 Ready for development and production deployment on Windows 11!**

# Start development environment
docker-compose -f docker-compose.saas.yml up -d

# Run builds
npm run build
npm run build:worker

# Run database migrations
docker exec accubooks-app-1 npx drizzle-kit push

## Monorepo Conversion

We have converted the project to a monorepo structure using Turborepo.

## New Structure

- `apps/client`: The React frontend
- `apps/backend`: The Node.js backend
- `packages/shared`: Shared code between client and backend

## Development

Run from the root:

- `npm run build`: Build all apps and packages
- `npm run lint`: Lint all
- `npm run test`: Test all

## Adding a new package

Create a new directory under `packages` and run `npm init`.

## 🚀 Features

### Core Accounting Modules
- **Multi-Company Support**: Full multi-tenant architecture with role-based access
- **Chart of Accounts**: Hierarchical account structure with double-entry bookkeeping
- **Customer Management**: Complete customer lifecycle management
- **Vendor Management**: Supplier relationship management
- **Transaction Processing**: Journal entries, invoices, payments, and bank reconciliation
- **Financial Reporting**: Balance sheet, profit & loss, cash flow statements

## 🚀 Enterprise Features (v2.0)

### 🏗️ Project Management & Time Tracking
- **Project Creation & Management** with budgets, timelines, and status tracking
- **Time Entry Tracking** with hourly rates and billable/non-billable classification
- **Project Profitability Analysis** with time vs budget comparisons
- **Client Project Assignments** and project manager roles
- **Color-coded Project Organization** for visual management

### 💰 Budgeting & Financial Planning
- **Multi-level Budgeting** (annual, quarterly, monthly, project-based)
- **Budget Categories** linked to chart of accounts
- **Budget vs Actual Tracking** with variance analysis
- **Budget Alerts** and approval workflows
- **Historical Budget Analysis** for forecasting

### 🚗 Mileage & Expense Tracking
- **GPS-enabled Mileage Tracking** with start/end locations
- **Vehicle Management** with make, model, year, and VIN tracking
- **Reimbursement Calculations** with customizable rates
- **Expense Approval Workflows** with manager oversight
- **Tax-deductible Mileage Reporting**

### 💱 Multi-Currency Support
- **Multiple Currency Transactions** with real-time exchange rates
- **Currency Conversion Tracking** for international business
- **Exchange Rate Management** with automatic updates
- **Multi-currency Reporting** and financial statements

### 🛒 E-commerce Integration
- **Platform Integrations** (Shopify, WooCommerce, Amazon)
- **Automatic Order Syncing** from e-commerce platforms
- **Inventory Synchronization** between systems
- **Sales Tax Automation** for online sales
- **Customer Data Syncing** and order fulfillment

### ⚡ Workflow Automation
- **Custom Workflow Builder** for business processes
- **Trigger-based Automation** (invoice created, payment received, etc.)
- **Multi-step Workflows** with conditional logic
- **Email Notifications** and approval processes
- **Integration with External Systems**

### 📊 Advanced Reporting
- **Custom Report Builder** with drag-and-drop interface
- **Scheduled Reports** with automatic delivery
- **Multiple Export Formats** (PDF, Excel, CSV)
- **Real-time Dashboards** with key performance indicators
- **Historical Trend Analysis**

### 💾 Backup & Security
- **Automated Backups** with multiple destination options
- **Comprehensive Audit Logs** for all system activities
- **Role-based Access Control** with granular permissions
- **Data Encryption** at rest and in transit
- **Backup Verification** and restoration testing

### 📋 Enterprise API Endpoints

#### Project Management
- `GET /api/projects` - List company projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project with time entries
- `POST /api/projects/time-entries` - Log time entry
- `PATCH /api/projects/time-entries/:id` - Update time entry

#### Budgeting
- `GET /api/budgets` - List company budgets
- `POST /api/budgets` - Create budget
- `GET /api/budgets/:id` - Get budget with categories
- `POST /api/budgets/:id/categories` - Add budget category

#### Mileage Tracking
- `GET /api/mileage` - List mileage entries
- `POST /api/mileage` - Create mileage entry
- `POST /api/mileage/:id/approve` - Approve mileage entry
- `GET /api/vehicles` - List company vehicles
- `POST /api/vehicles` - Register vehicle

#### Multi-Currency
- `GET /api/currencies` - List active currencies
- `GET /api/exchange-rates` - Get exchange rates
- `POST /api/multi-currency-transactions` - Record multi-currency transaction

#### E-commerce
- `GET /api/ecommerce/integrations` - List platform integrations
- `POST /api/ecommerce/integrations` - Setup integration
- `GET /api/ecommerce/orders` - List synced orders
- `POST /api/ecommerce/orders` - Sync order from platform

#### Workflows
- `GET /api/workflows` - List workflows
- `POST /api/workflows` - Create workflow
- `POST /api/workflows/:id/execute` - Execute workflow

#### Reports
- `GET /api/reports` - List custom reports
- `POST /api/reports` - Create custom report
- `GET /api/reports/:id/schedule` - Get report schedules
- `POST /api/reports/:id/schedule` - Schedule report

#### Backup & Audit
- `GET /api/backup-jobs` - List backup jobs
- `POST /api/backup-jobs` - Create backup job
- `GET /api/audit-logs` - Get audit logs
- `POST /api/audit-logs` - Create audit entry
- **Background Jobs**: BullMQ + Redis for automated tasks
- **Third-Party APIs**: Stripe, Plaid, QuickBooks integrations
- **Webhook Support**: Real-time updates from external services
- **Email Notifications**: Automated notifications and alerts

### Developer Experience
- **TypeScript**: Full type safety across the entire stack
- **Testing Suite**: Unit, integration, and E2E tests
- **API Documentation**: Auto-generated Swagger documentation
- **Docker Support**: Containerized deployment
- **CI/CD Pipeline**: Automated testing and deployment

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Background Jobs**: BullMQ + Redis
- **Authentication**: JWT with Passport.js
- **Validation**: Zod schemas

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: React Query (TanStack Query)
- **Routing**: Wouter
- **Forms**: React Hook Form + Zod validation

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL 15
- **Cache/Queue**: Redis 7
- **Reverse Proxy**: Nginx
- **CI/CD**: GitHub Actions

### External Integrations
- **Payments**: Stripe API
- **Banking**: Plaid API
- **Accounting**: QuickBooks Online API

## 📦 Installation & Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd accubooks
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the development environment**
   ```bash
   # Start with Docker (recommended)
   docker-compose up -d

   # Or run services individually
   # Start PostgreSQL and Redis first, then:
   npm run dev
   ```

5. **Initialize the database**
   ```bash
   npm run db:push
   ```

6. **Access the application**
   - Frontend: http://localhost:5000
   - API: http://localhost:5000/api

### Production Deployment

1. **Set up production environment**
   ```bash
   cp .env.example .env.production
   # Configure all production values
   ```

2. **Build the application**
   ```bash
   npm run build
   ```

3. **Deploy with Docker**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

4. **Or deploy manually**
   ```bash
   npm start
   ```

### CI/CD Pipeline

The project includes a complete GitHub Actions workflow for:
- Automated testing on every push/PR
- Security scanning
- Performance testing
- Automated deployment to staging/production
- Database migrations

## 📁 Project Structure

```
accubooks/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   └── lib/           # Utilities and configurations
│   └── public/            # Static assets
├── server/                # Backend Node.js application
│   ├── routes/           # API route handlers
│   ├── integrations/     # Third-party service integrations
│   ├── jobs/             # Background job processors
│   ├── utils/            # Utilities and helpers
│   └── middleware/       # Express middleware
├── shared/               # Shared types and schemas
├── .github/             # CI/CD workflows
├── docker-compose.yml   # Docker configuration
└── package.json         # Dependencies and scripts
```

## 🔄 Background Jobs

### Job Types
- **Recurring Invoices**: Automatic invoice generation
- **Payroll Processing**: Automated payroll calculations
- **Report Generation**: Scheduled financial reports
- **Database Backups**: Automated data backups
- **Notifications**: Email and in-app notifications

### Job Management
- **Queue Monitoring**: Real-time queue status and metrics
- **Job Retries**: Automatic retry with exponential backoff
- **Concurrency Control**: Configurable worker concurrency
- **Job Scheduling**: Cron-like job scheduling

## 💳 Payment Integration

### Stripe Integration
- **Payment Processing**: Card and bank account payments
- **Invoice Management**: Automated invoice creation and sending
- **Webhook Handling**: Real-time payment status updates
- **Refund Processing**: Automated refund handling

### Supported Payment Methods
- Credit/Debit Cards
- Bank Transfers (ACH)
- Digital Wallets

## 🏦 Bank Integration

### Plaid Integration
- **Account Linking**: OAuth-based bank account connection
- **Transaction Sync**: Real-time transaction synchronization
- **Account Verification**: Bank account verification
- **Webhook Support**: Real-time transaction updates

### Supported Banks
- Major US banks and credit unions
- Real-time transaction data
- Account balance monitoring

## 📋 API Endpoints

### Core Endpoints
- `GET /api/companies` - List companies
- `POST /api/companies` - Create company
- `GET /api/accounts` - List accounts
- `POST /api/transactions` - Create transaction
- `GET /api/reports/*` - Financial reports

### Payroll Endpoints
- `GET /api/payroll/employees` - List employees
- `POST /api/payroll/pay-runs` - Create pay run
- `GET /api/payroll/time-entries` - List time entries

### Inventory Endpoints
- `GET /api/inventory/items` - List inventory items
- `POST /api/inventory/purchase-orders` - Create purchase order
- `POST /api/inventory/adjustments` - Create inventory adjustment

### Integration Endpoints
- `POST /api/stripe/payment-intent` - Create payment intent
- `POST /api/plaid/link-token` - Create Plaid link token
- `GET /api/jobs/queues` - Job queue status

## 🧪 Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Develop and Test**
   ```bash
   # Run tests continuously
   npm run test:watch

   # Run backend tests
   npm run test:backend:watch
   ```

3. **Build and Test**
   ```bash
   npm run build
   npm run test
   ```

4. **Create Pull Request**
   - Ensure all tests pass
   - Update documentation if needed
   - Request code review

## 📚 Additional Resources

- [API Documentation](http://localhost:5000/api/docs)
- [Database Schema](shared/schema.ts)
- [Component Library](client/src/components)
- [Type Definitions](shared/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ using modern web technologies for enterprise accounting solutions.**
