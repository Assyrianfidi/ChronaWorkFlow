#!/bin/bash
# Security Audit Script for AccuBooks
echo "🔒 Running Security Audit..."

# Check for npm audit
if command -v npm >/dev/null 2>&1; then
    echo "📦 Running npm audit..."
    npm audit --audit-level=moderate
fi

# Check for outdated dependencies
if command -v npm >/dev/null 2>&1; then
    echo "📅 Checking for outdated dependencies..."
    npm outdated || echo "No outdated dependencies found"
fi

# Check for license issues
if command -v npx >/dev/null 2>&1; then
    echo "📄 Checking license compliance..."
    npx license-checker --onlyAllow "MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC" || echo "License issues found"
fi

echo "✅ Security audit complete"
