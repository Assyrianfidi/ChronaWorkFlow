# Development Setup Guide

Complete guide for setting up and contributing to AccuBooks development.

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher  
- **Git**: Latest version
- **VS Code**: Recommended IDE (optional)

### System Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **RAM**: Minimum 8GB, recommended 16GB
- **Storage**: Minimum 10GB free space
- **Network**: Stable internet connection

## 📋 Installation Steps

### 1. Clone the Repository

```bash
# Clone the main repository
git clone https://github.com/your-org/accubooks.git
cd accubooks

# Clone the client repository
git clone https://github.com/your-org/accubooks-client.git
cd accubooks-client
```

### 2. Install Dependencies

```bash
# Install npm dependencies
npm install

# Verify installation
npm list --depth=0
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment file
nano .env
```

**Environment Variables:**
```bash
# Development Configuration
NODE_ENV=development
VITE_API_URL=http://localhost:3001
VITE_API_VERSION=v1

# Authentication
VITE_JWT_SECRET=your-development-jwt-secret
VITE_REFRESH_TOKEN_SECRET=your-refresh-secret

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true

# External Services
VITE_SENTRY_DSN=
VITE_GOOGLE_ANALYTICS_ID=

# Development Tools
VITE_DEV_TOOLS=true
VITE_HOT_RELOAD=true
```

### 4. Database Setup

```bash
# Install PostgreSQL (if not already installed)
# macOS
brew install postgresql

# Ubuntu
sudo apt-get install postgresql postgresql-contrib

# Windows
# Download from https://www.postgresql.org/download/windows/

# Start PostgreSQL service
# macOS
brew services start postgresql

# Ubuntu
sudo systemctl start postgresql

# Create database
createdb accubooks_dev

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed
```

### 5. Start Development Server

```bash
# Start the development server
npm run dev

# Server will be available at http://localhost:5173
```

## 🛠️ Development Tools

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-jest",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-thunder-client"
  ]
}
```

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

### Git Hooks Setup

```bash
# Install husky for git hooks
npm install --save-dev husky

# Initialize husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run test"

# Add pre-push hook
npx husky add .husky/pre-push "npm run test:ci"
```

## 🧪 Testing Setup

### Test Configuration

The project uses Jest for unit testing and Playwright for E2E testing.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run accessibility tests
npm run test:a11y
```

### Test Database

```bash
# Create test database
createdb accubooks_test

# Run test migrations
npm run db:migrate:test

# Seed test data
npm run db:seed:test
```

## 🎨 Styling Setup

### Tailwind CSS Configuration

```bash
# Tailwind is already configured
# Customize in tailwind.config.js

# Build CSS
npm run build:css

# Watch CSS changes
npm run watch:css
```

### Component Library

```bash
# Start Storybook
npm run storybook

# Build Storybook
npm run build-storybook
```

## 📊 Development Commands

### Essential Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # Run TypeScript checks
npm run format           # Format code with Prettier

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:e2e         # Run E2E tests

# Database
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database
npm run db:reset         # Reset database

# Performance
npm run analyze:bundle   # Analyze bundle size
npm run lighthouse       # Run Lighthouse audit
```

### Package Scripts

All available scripts are defined in `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write src/**/*.{ts,tsx,css,md}",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Node.js Version Issues

**Problem**: `Error: Node.js version is not supported`

**Solution**:
```bash
# Check current Node.js version
node --version

# Update Node.js using nvm
nvm install 18
nvm use 18

# Or download from nodejs.org
```

#### 2. Dependency Installation Issues

**Problem**: `npm install fails with peer dependency errors`

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# If still failing, try legacy peer deps
npm install --legacy-peer-deps
```

#### 3. Port Already in Use

**Problem**: `Port 5173 is already in use`

**Solution**:
```bash
# Find process using port
lsof -i :5173

# Kill process
kill -9 <PID>

# Or use different port
npm run dev -- --port 3000
```

#### 4. TypeScript Compilation Errors

**Problem**: `TypeScript compilation fails`

**Solution**:
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Update types
npm update @types/react @types/react-dom

# Clear TypeScript cache
npx tsc --build --clean
```

#### 5. Test Failures

**Problem**: `Tests are failing`

**Solution**:
```bash
# Run tests with verbose output
npm test -- --verbose

# Update test snapshots
npm test -- --updateSnapshot

# Run tests one by one
npm test -- --testNamePattern="specific-test"

# Check test configuration
npx jest --showConfig
```

### Performance Issues

#### Slow Development Server

**Solution**:
```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 node_modules/vite/bin/vite.js

# Disable source maps in development
# Add to vite.config.ts:
server: {
  sourcemap: false
}
```

#### Large Bundle Size

**Solution**:
```bash
# Analyze bundle
npm run analyze:bundle

# Enable bundle analyzer
# Add to vite.config.ts:
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
        charts: ['recharts', 'd3']
      }
    }
  }
}
```

## 🌍 Environment Management

### Development Environments

```bash
# Development
NODE_ENV=development
npm run dev

# Staging
NODE_ENV=staging
npm run build

# Production
NODE_ENV=production
npm run build
```

### Environment Variables

Create different environment files:

```bash
# .env.development
VITE_API_URL=http://localhost:3001
VITE_ENABLE_ANALYTICS=false

# .env.staging
VITE_API_URL=https://staging-api.accubooks.com
VITE_ENABLE_ANALYTICS=true

# .env.production
VITE_API_URL=https://api.accubooks.com
VITE_ENABLE_ANALYTICS=true
```

## 🔄 Workflow Integration

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request
# Review and merge
```

### Pre-commit Checks

```bash
# Run all quality checks
npm run pre-commit

# Individual checks
npm run lint
npm run type-check
npm run test
npm run build
```

## 📚 Learning Resources

### Documentation

- **React Documentation**: https://react.dev
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Vite Guide**: https://vitejs.dev/guide/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Jest Documentation**: https://jestjs.io/docs/getting-started

### Best Practices

- **React Best Practices**: https://react.dev/learn/thinking-in-react
- **TypeScript Best Practices**: https://typescript-eslint.io/rules/
- **CSS Architecture**: https://css-tricks.com/css-architecture/
- **Testing Best Practices**: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

## 🤝 Contributing Guidelines

### Code Standards

1. **TypeScript**: Use strict TypeScript mode
2. **ESLint**: Follow ESLint configuration
3. **Prettier**: Use Prettier for formatting
4. **Naming**: Use PascalCase for components, camelCase for variables
5. **Comments**: Add JSDoc comments for functions

### Commit Messages

Follow conventional commits:

```bash
feat: add new invoice creation feature
fix: resolve customer list loading issue
docs: update API documentation
style: format code with prettier
refactor: optimize invoice list component
test: add unit tests for customer service
chore: update dependencies
```

### Pull Request Process

1. Create feature branch from main
2. Make changes with proper commits
3. Ensure all tests pass
4. Update documentation
5. Create pull request with description
6. Address review feedback
7. Merge to main

## 📞 Support

### Getting Help

- **Documentation**: https://docs.accubooks.com
- **Discord**: https://discord.gg/accubooks
- **GitHub Issues**: https://github.com/accubooks/issues
- **Email**: dev-support@accubooks.com

### Office Hours

- **Monday-Friday**: 9 AM - 5 PM EST
- **Saturday**: 10 AM - 2 PM EST
- **Sunday**: Closed

### Emergency Contact

For critical issues affecting production:
- **Emergency Email**: emergency@accubooks.com
- **Phone**: +1-555-EMERGENCY

---

Happy coding! 🚀

Last updated: 2025-12-12
