# Deployment Configuration Guide

## Current Issue
The deployment is configured as "static" but this is a full-stack application with an Express server. The deployment fails because static deployments cannot run server code.

## ✅ SOLUTION: Manual Configuration Required

The `.replit` file currently has `deploymentTarget = "static"` which causes the deployment to fail. Since this file cannot be automatically edited, you need to manually update the deployment settings in the Replit interface.

### Step 1: Change Deployment Type
1. Go to the **Deployments** tab in your Replit project
2. Click on **Configure** or **Edit Deployment**
3. Change the deployment type from **Static** to **Autoscale**

### Step 2: Update Build and Run Configuration
Set the following configuration values in the deployment settings:

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

### Step 3: Verify Configuration
After making these changes, your deployment should:
- Build both the frontend (React) and backend (Express server)
- Start the Express server which serves the frontend and provides API endpoints
- Use the correct public directory where the built frontend files are located

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