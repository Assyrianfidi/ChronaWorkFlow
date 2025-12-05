# Contributing to AccuBooks

Thank you for your interest in contributing to AccuBooks! This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)
- [License](#license)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally
   ```bash
   git clone https://github.com/your-username/accubooks.git
   cd accubooks
   ```
3. **Set up the development environment**
   ```bash
   # Install dependencies
   npm install
   
   # Set up environment variables
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the code style guidelines
   - Write tests for new features
   - Update documentation as needed

3. **Run tests**
   ```bash
   # Run all tests
   npm test
   
   # Run specific test file
   npm test path/to/test-file.test.js
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Go to the original repository
   - Click on "New Pull Request"
   - Select your branch
   - Fill in the PR template
   - Submit the PR

## Code Style

- Use **ESLint** and **Prettier** for code formatting
- Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused on a single responsibility

## Testing

- Write unit tests for all new features and bug fixes
- Aim for at least 80% test coverage
- Use the following testing libraries:
  - **Jest** for unit and integration tests
  - **React Testing Library** for React components
  - **Supertest** for API testing

## Pull Request Process

1. Ensure all tests pass
2. Update the README.md with details of changes if needed
3. The PR should include:
   - A clear description of the changes
   - Reference to any related issues
   - Screenshots if applicable
4. Request review from at least one maintainer

## Reporting Bugs

- Use GitHub Issues to report bugs
- Include steps to reproduce the issue
- Add error messages and stack traces if available
- Specify the version of the application

## Feature Requests

- Open an issue with the "enhancement" label
- Describe the feature and why it's valuable
- Include any relevant examples or references

## License

By contributing to AccuBooks, you agree that your contributions will be licensed under the [MIT License](LICENSE).
