# Cascade AI Control System for AccuBooks

This directory contains the Cascade AI control system for the AccuBooks project. The system provides automated project management, quality control, and deployment capabilities.

## Overview

The Cascade control system is designed to:

- Automate project setup and configuration
- Enforce code quality standards
- Run comprehensive test suites
- Manage builds and deployments
- Generate detailed reports
- Ensure security best practices

## Directory Structure

```
.cascade/
├── config/               # Configuration files
│   └── project.json      # Main project configuration
├── scripts/              # Utility scripts
│   └── setup.js          # Project setup and initialization
└── workflows/            # Automated workflows
    └── code-quality.js   # Code quality and testing workflow
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Git
- Docker (for database and containerized services)

### Initial Setup

1. **Install Dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client && npm install
   
   # Install server dependencies (if applicable)
   cd ../server && npm install
   ```

2. **Run the Setup Script**
   ```bash
   node .cascade/scripts/setup.js
   ```
   This will:
   - Verify system requirements
   - Install all dependencies
   - Set up the database
   - Run initial migrations
   - Seed the database with test data

## Workflows

### Code Quality Workflow

To run the full code quality workflow:

```bash
node .cascade/workflows/code-quality.js
```

This will execute:
1. Type checking
2. Linting
3. Unit and integration tests
4. Security audit
5. Build process
6. Generate a quality report

### Automated Testing

Run tests with coverage:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Linting and Formatting

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Configuration

### Project Configuration (`config/project.json`)

This file contains project-specific settings:

- `project`: Basic project information
- `techStack`: Technology stack details
- `qualityGates`: Minimum requirements for quality checks
- `autoFix`: Settings for automatic fixes
- `logging`: Logging configuration
- `workflows`: CI/CD workflow definitions

## Best Practices

1. **Commit Often**: Small, focused commits with clear messages
2. **Test Coverage**: Maintain high test coverage (minimum 80%)
3. **Code Reviews**: Use pull requests and require code reviews
4. **Documentation**: Keep documentation up-to-date
5. **Security**: Regular dependency updates and security audits

## Troubleshooting

Common issues and solutions:

- **Dependency conflicts**: Run `npm dedupe` or delete `node_modules` and `package-lock.json` then reinstall
- **Type errors**: Run `npm run typecheck` to identify and fix type issues
- **Database connection**: Verify `.env` file and database service status
- **Build failures**: Check logs in `logs/` directory

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---

*Last updated: November 11, 2025*
