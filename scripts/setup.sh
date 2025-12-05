#!/bin/bash

# Clean up any existing installations
echo "Cleaning up previous installations..."
rm -rf node_modules
rm -rf client/node_modules
rm -rf backend/node_modules
rm -f package-lock.json
rm -f client/package-lock.json
rm -f backend/package-lock.json

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install client dependencies
echo "Installing client dependencies..."
cd client
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd ../backend
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "Running database migrations..."
npx prisma migrate dev

# Build the project
echo "Building the project..."
cd ..
npm run build

# Install husky for git hooks
echo "Setting up git hooks..."
npx husky install

# Set proper permissions for scripts
echo "Setting up permissions..."
chmod +x scripts/*.sh

echo "\n✅ Setup complete! You can now start the development servers with:"
echo "1. Start backend: cd backend && npm run dev"
echo "2. Start frontend: cd client && npm run dev"

echo "\n📝 Note: Make sure to set up your .env files in both root and backend directories."
