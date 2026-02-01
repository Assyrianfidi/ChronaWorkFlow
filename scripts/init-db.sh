#!/bin/bash
# Database initialization script for Docker entrypoint
# This script runs automatically when PostgreSQL container starts for the first time

set -e

echo "🔧 Initializing AccuBooks database..."

# Database is already created by POSTGRES_DB environment variable
# This script can be used for additional initialization if needed

echo "✅ Database initialization complete"
