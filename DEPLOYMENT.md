# Deployment Configuration Guide

## Current Issue
The deployment is configured as "static" but this is a full-stack application with an Express server. The deployment fails because static deployments cannot run server code.

## Required Changes for Deployment

To fix the deployment, you need to manually update the deployment settings in the Replit interface:

### 1. Change Deployment Type
- In the Replit interface, go to the **Deployments** tab
- Change the deployment type from **Static** to **Autoscale**

### 2. Update Build and Run Configuration
Set the following configuration values:

**Build Command:**
```
npm run build
```

**Run Command:**
```
npm start
```

**Public Directory:**
```
dist/public
```

### 3. Environment Variables
Ensure these environment variables are set in the deployment:
- `DATABASE_URL` - Your PostgreSQL connection string
- `SESSION_SECRET` - A secure random string for session encryption
- `REPLIT_DOMAINS` - Your deployment domain(s)
- `PORT` - Will be automatically set by Replit (usually 443 for production)

## Project Structure
The build process creates:
- `dist/index.js` - Express server bundle
- `dist/public/index.html` - Frontend HTML file
- `dist/public/assets/` - Frontend static assets

## Build Process
The application uses a two-step build process:
1. **Frontend Build**: Vite builds the React application to `dist/public/`
2. **Backend Build**: ESBuild bundles the Express server to `dist/index.js`

## Start Command
The production start command (`npm start`) runs:
```
NODE_ENV=production node dist/index.js
```

This starts the Express server which:
- Serves the React frontend from `dist/public/`
- Provides API endpoints for the backend functionality
- Handles authentication and database operations

## Deployment Checklist
Before deploying, ensure:
- [ ] All environment variables are set
- [ ] Database is accessible from the deployment environment
- [ ] Build process completes successfully (`npm run build`)
- [ ] Deployment type is set to "Autoscale"
- [ ] Public directory points to "dist/public"
- [ ] Run command is set to "npm start"