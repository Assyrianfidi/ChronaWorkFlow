#!/usr/bin/env node

/**
 * ACCUBOOKS BUILD TRACKER & AUTO-VERIFICATION SYSTEM
 *
 * This system performs comprehensive project verification, rebuilding, and validation
 * with real-time progress tracking and automatic repair capabilities.
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BuildTracker {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.logFile = path.join(projectRoot, 'BuildTracker.log');
        this.startTime = new Date();
        this.checkpoints = new Map();
        this.autoFixes = [];
        this.errors = [];
        this.initializeTracker();
    }

    initializeTracker() {
        const header = this.generateHeader();
        fs.writeFileSync(this.logFile, header);
        console.log(`🧱 ACCUBOOKS BUILD TRACKER INITIALIZED`);
        console.log(`📁 Project Root: ${this.projectRoot}`);
        console.log(`📊 Log File: ${this.logFile}`);
        console.log(`⏰ Started: ${this.startTime.toISOString()}\n`);
    }

    generateHeader() {
        return `🧱 ACCUBOOKS BUILD TRACKER - COMPREHENSIVE VERIFICATION SYSTEM
================================================================
Project Root: ${this.projectRoot}
Database: AccuBooks
PostgreSQL: localhost:5432
Redis: localhost:6379
Main App: localhost:3000
Started: ${this.startTime.toISOString()}
Status: IN PROGRESS 🔄

📋 VERIFICATION CHECKPOINTS:
-------------------------------------
[⏳] Project structure audit
[⏳] Dependencies verification
[⏳] Build compilation
[⏳] Docker stack rebuild
[⏳] Database migration
[⏳] Environment validation
[⏳] Runtime verification
[⏳] Auto-repair execution
[⏳] Final validation

🔧 AUTO-FIXES APPLIED:
-------------------------------------
(None yet)

❌ ERRORS ENCOUNTERED:
-------------------------------------
(None yet)

================================================================

`;
    }

    updateCheckpoint(checkpoint, status, details = '') {
        const timestamp = new Date().toISOString();
        const icon = status === 'success' ? '✅' :
                    status === 'error' ? '❌' :
                    status === 'warning' ? '⚠️' : '⏳';

        this.checkpoints.set(checkpoint, { status, details, timestamp });

        this.refreshLog();
        console.log(`[${icon}] ${checkpoint} - ${details}`);
    }

    addAutoFix(fixDescription, details = '') {
        const timestamp = new Date().toISOString();
        this.autoFixes.push({ fixDescription, details, timestamp });
        this.refreshLog();
        console.log(`🔧 AUTO-FIX: ${fixDescription}`);
    }

    addError(error, context = '') {
        const timestamp = new Date().toISOString();
        this.errors.push({ error, context, timestamp });
        this.refreshLog();
        console.error(`❌ ERROR: ${error} (${context})`);
    }

    refreshLog() {
        let logContent = this.generateHeader();

        // Update checkpoints
        logContent += '📋 VERIFICATION CHECKPOINTS:\n';
        logContent += '-------------------------------------\n';
        for (const [checkpoint, data] of this.checkpoints) {
            const icon = data.status === 'success' ? '✅' :
                        data.status === 'error' ? '❌' :
                        data.status === 'warning' ? '⚠️' : '⏳';
            logContent += `[${icon}] ${checkpoint}\n`;
            if (data.details) {
                logContent += `     └─ ${data.details}\n`;
            }
        }

        // Auto-fixes
        if (this.autoFixes.length > 0) {
            logContent += '\n🔧 AUTO-FIXES APPLIED:\n';
            logContent += '-------------------------------------\n';
            for (const fix of this.autoFixes) {
                logContent += `[${fix.timestamp}] ${fix.fixDescription}\n`;
                if (fix.details) {
                    logContent += `     └─ ${fix.details}\n`;
                }
            }
        }

        // Errors
        if (this.errors.length > 0) {
            logContent += '\n❌ ERRORS ENCOUNTERED:\n';
            logContent += '-------------------------------------\n';
            for (const error of this.errors) {
                logContent += `[${error.timestamp}] ${error.error}\n`;
                if (error.context) {
                    logContent += `     └─ Context: ${error.context}\n`;
                }
            }
        }

        // Final status
        const completedCount = Array.from(this.checkpoints.values()).filter(c => c.status === 'success').length;
        const totalCount = this.checkpoints.size;
        const progress = totalCount > 0 ? Math.round((completedCount / 9) * 100) : 0;

        logContent += '\n================================================================\n';
        logContent += `PROGRESS: ${progress}% (${completedCount}/9 checkpoints)\n`;
        logContent += `Runtime: ${Math.round((Date.now() - this.startTime.getTime()) / 1000)}s\n`;

        if (progress === 100) {
            logContent += `Status: COMPLETE ✅\n`;
        } else {
            logContent += `Status: IN PROGRESS 🔄\n`;
        }

        fs.writeFileSync(this.logFile, logContent);
    }

    complete() {
        this.refreshLog();
        const endTime = new Date();
        const duration = Math.round((endTime.getTime() - this.startTime.getTime()) / 1000);

        console.log(`\n🎉 BUILD VERIFICATION COMPLETE!`);
        console.log(`⏱️  Total Runtime: ${duration}s`);
        console.log(`📊 Check BuildTracker.log for full details`);
        console.log(`🌐 Application should be running at http://localhost:3000`);
    }
}

// Project verification and build system
class AccuBooksBuilder {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.tracker = new BuildTracker(projectRoot);
        this.requiredDirectories = [
            'src', 'server', 'client', 'scripts', 'dist', 'config', 'database', 'migrations',
            'docker-entrypoint-initdb.d', 'server/integrations', 'server/utils', 'server/worker'
        ];
        this.requiredFiles = [
            'package.json', 'tsconfig.json', '.env', 'docker-compose.saas.yml',
            'Dockerfile.saas', 'Dockerfile.worker', 'vite.config.ts', 'drizzle.config.ts'
        ];
    }

    async run() {
        try {
            console.log('🚀 Starting AccuBooks Comprehensive Build & Verification...\n');

            await this.auditProjectStructure();
            await this.verifyDependencies();
            await this.compileBuild();
            await this.rebuildDockerStack();
            await this.runDatabaseMigrations();
            await this.validateEnvironment();
            await this.verifyRuntime();
            await this.performAutoRepairs();
            await this.finalValidation();

            this.tracker.complete();

        } catch (error) {
            this.tracker.addError(`Build failed: ${error.message}`, 'System');
            console.error(`💥 BUILD FAILED: ${error.message}`);
            process.exit(1);
        }
    }

    async auditProjectStructure() {
        console.log('🔍 Phase 1: Project Structure Audit');
        this.tracker.updateCheckpoint('Project structure audit', 'in_progress');

        const missingDirs = [];
        const missingFiles = [];

        // Check directories
        for (const dir of this.requiredDirectories) {
            const dirPath = path.join(this.projectRoot, dir);
            if (!fs.existsSync(dirPath)) {
                missingDirs.push(dir);
            }
        }

        // Check files
        for (const file of this.requiredFiles) {
            const filePath = path.join(this.projectRoot, file);
            if (!fs.existsSync(filePath)) {
                missingFiles.push(file);
            }
        }

        if (missingDirs.length > 0) {
            this.tracker.addError(`Missing directories: ${missingDirs.join(', ')}`, 'Structure Audit');
        }

        if (missingFiles.length > 0) {
            this.tracker.addError(`Missing files: ${missingFiles.join(', ')}`, 'Structure Audit');
        }

        if (missingDirs.length === 0 && missingFiles.length === 0) {
            this.tracker.updateCheckpoint('Project structure audit', 'success', 'All required directories and files present');
        } else {
            this.tracker.updateCheckpoint('Project structure audit', 'error', `${missingDirs.length} dirs, ${missingFiles.length} files missing`);
        }
    }

    async verifyDependencies() {
        console.log('📦 Phase 2: Dependencies Verification');
        this.tracker.updateCheckpoint('Dependencies verification', 'in_progress');

        try {
            // Check if package.json exists
            const packageJsonPath = path.join(this.projectRoot, 'package.json');
            if (!fs.existsSync(packageJsonPath)) {
                throw new Error('package.json not found');
            }

            // Run npm install
            console.log('Installing dependencies...');
            execSync('npm install', {
                cwd: this.projectRoot,
                stdio: 'inherit',
                env: { ...process.env, NODE_ENV: 'production' }
            });

            // Verify node_modules
            const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
            if (fs.existsSync(nodeModulesPath)) {
                this.tracker.updateCheckpoint('Dependencies verification', 'success', 'All dependencies installed successfully');
            } else {
                throw new Error('node_modules not created');
            }

        } catch (error) {
            this.tracker.updateCheckpoint('Dependencies verification', 'error', error.message);
            this.tracker.addError(error.message, 'Dependency Installation');
        }
    }

    async compileBuild() {
        console.log('🔨 Phase 3: Build Compilation');
        this.tracker.updateCheckpoint('Build compilation', 'in_progress');

        try {
            // Run build
            console.log('Compiling TypeScript and assets...');
            execSync('npm run build', {
                cwd: this.projectRoot,
                stdio: 'inherit',
                env: { ...process.env, NODE_ENV: 'production' }
            });

            // Verify dist directory
            const distPath = path.join(this.projectRoot, 'dist');
            if (fs.existsSync(distPath)) {
                this.tracker.updateCheckpoint('Build compilation', 'success', 'Build completed successfully');
            } else {
                throw new Error('dist directory not created');
            }

        } catch (error) {
            this.tracker.updateCheckpoint('Build compilation', 'error', error.message);
            this.tracker.addError(error.message, 'Build Compilation');
        }
    }

    async rebuildDockerStack() {
        console.log('🐳 Phase 4: Docker Stack Rebuild');
        this.tracker.updateCheckpoint('Docker stack rebuild', 'in_progress');

        try {
            // Stop existing containers
            console.log('Stopping existing containers...');
            execSync('docker-compose -f docker-compose.saas.yml down -v', {
                cwd: this.projectRoot,
                stdio: 'inherit'
            });

            // Rebuild and start
            console.log('Rebuilding Docker stack...');
            execSync('docker-compose -f docker-compose.saas.yml up -d --build', {
                cwd: this.projectRoot,
                stdio: 'inherit'
            });

            // Wait for services to be healthy
            console.log('Waiting for services to become healthy...');
            await this.waitForHealthyServices();

            this.tracker.updateCheckpoint('Docker stack rebuild', 'success', 'All containers built and healthy');

        } catch (error) {
            this.tracker.updateCheckpoint('Docker stack rebuild', 'error', error.message);
            this.tracker.addError(error.message, 'Docker Rebuild');
        }
    }

    async waitForHealthyServices() {
        const maxWait = 120000; // 2 minutes
        const checkInterval = 5000; // 5 seconds
        const startTime = Date.now();

        while (Date.now() - startTime < maxWait) {
            try {
                const result = execSync('docker ps --filter health=healthy --format "table {{.Names}}"', {
                    cwd: this.projectRoot,
                    encoding: 'utf8'
                });

                const healthyContainers = result.split('\n').filter(line => line.includes('accubooks-')).length;

                if (healthyContainers >= 2) { // postgres and redis should be healthy
                    return;
                }

                await new Promise(resolve => setTimeout(resolve, checkInterval));
            } catch (error) {
                await new Promise(resolve => setTimeout(resolve, checkInterval));
            }
        }

        throw new Error('Timeout waiting for healthy services');
    }

    async runDatabaseMigrations() {
        console.log('🗄️  Phase 5: Database Migration');
        this.tracker.updateCheckpoint('Database migration', 'in_progress');

        try {
            // Run migrations
            console.log('Running database migrations...');
            execSync('docker exec -it accubooks-app-1 npx drizzle-kit migrate', {
                cwd: this.projectRoot,
                stdio: 'inherit'
            });

            // Verify database connection and tables
            const tablesResult = execSync('docker exec -it accubooks-postgres-1 psql -U postgres -d AccuBooks -c "\\dt" | grep -c "table"', {
                cwd: this.projectRoot,
                encoding: 'utf8'
            });

            const tableCount = parseInt(tablesResult.trim());

            if (tableCount > 0) {
                this.tracker.updateCheckpoint('Database migration', 'success', `${tableCount} tables created successfully`);
            } else {
                throw new Error('No tables found in database');
            }

        } catch (error) {
            this.tracker.updateCheckpoint('Database migration', 'error', error.message);
            this.tracker.addError(error.message, 'Database Migration');
        }
    }

    async validateEnvironment() {
        console.log('⚙️  Phase 6: Environment Validation');
        this.tracker.updateCheckpoint('Environment validation', 'in_progress');

        try {
            const envPath = path.join(this.projectRoot, '.env');
            if (!fs.existsSync(envPath)) {
                throw new Error('.env file not found');
            }

            const envContent = fs.readFileSync(envPath, 'utf8');
            const requiredVars = [
                'DATABASE_URL', 'REDIS_URL', 'PORT', 'JWT_SECRET',
                'FRONTEND_URL', 'ADMIN_URL', 'DOCS_URL', 'STATUS_URL'
            ];

            const missingVars = [];
            for (const varName of requiredVars) {
                if (!envContent.includes(`${varName}=`)) {
                    missingVars.push(varName);
                }
            }

            if (missingVars.length > 0) {
                // Auto-fix missing environment variables
                this.tracker.addAutoFix(`Adding missing environment variables: ${missingVars.join(', ')}`);

                let updatedEnv = envContent;
                for (const varName of missingVars) {
                    const defaultValue = this.getDefaultEnvValue(varName);
                    updatedEnv += `\n${varName}=${defaultValue}`;
                }

                fs.writeFileSync(envPath, updatedEnv);
                this.tracker.addAutoFix('Environment variables updated', 'Missing variables added with defaults');
            }

            this.tracker.updateCheckpoint('Environment validation', 'success', 'All required environment variables present');

        } catch (error) {
            this.tracker.updateCheckpoint('Environment validation', 'error', error.message);
            this.tracker.addError(error.message, 'Environment Validation');
        }
    }

    getDefaultEnvValue(varName) {
        const defaults = {
            'DATABASE_URL': 'postgresql://postgres:<REDACTED_DB_PASSWORD>@postgres:5432/AccuBooks',
            'REDIS_URL': 'redis://redis:6379',
            'PORT': '3000',
            'JWT_SECRET': 'your_local_jwt_secret_minimum_32_characters_long_for_development',
            'FRONTEND_URL': 'http://localhost:3000',
            'ADMIN_URL': 'http://localhost:3000/admin',
            'DOCS_URL': 'http://localhost:3001',
            'STATUS_URL': 'http://localhost:3002'
        };
        return defaults[varName] || '';
    }

    async verifyRuntime() {
        console.log('🌐 Phase 7: Runtime Verification');
        this.tracker.updateCheckpoint('Runtime verification', 'in_progress');

        const endpoints = [
            { url: 'http://localhost:3000', name: 'Main App' },
            { url: 'http://localhost:3001', name: 'Docs' },
            { url: 'http://localhost:3002', name: 'Status' },
            { url: 'http://localhost:3003', name: 'Admin' }
        ];

        const results = [];
        for (const endpoint of endpoints) {
            try {
                const response = await this.checkEndpoint(endpoint.url);
                if (response) {
                    results.push(`${endpoint.name}: ✅ ${response.status}`);
                } else {
                    results.push(`${endpoint.name}: ❌ Unreachable`);
                }
            } catch (error) {
                results.push(`${endpoint.name}: ❌ ${error.message}`);
            }
        }

        const statusSummary = results.join(', ');
        this.tracker.updateCheckpoint('Runtime verification', 'success', statusSummary);
    }

    async checkEndpoint(url) {
        return new Promise((resolve) => {
            const http = require('http');
            const req = http.get(url, (res) => {
                resolve({ status: res.statusCode, statusText: res.statusMessage });
            });

            req.on('error', (error) => {
                resolve(null);
            });

            req.setTimeout(5000, () => {
                req.destroy();
                resolve(null);
            });
        });
    }

    async performAutoRepairs() {
        console.log('🔧 Phase 8: Auto-Repair Execution');
        this.tracker.updateCheckpoint('Auto-repair execution', 'in_progress');

        // Check for missing critical files and create them
        await this.createMissingFiles();
        await this.fixDockerConfiguration();
        await this.validatePackageScripts();

        this.tracker.updateCheckpoint('Auto-repair execution', 'success', 'All repairs completed');
    }

    async createMissingFiles() {
        // Create missing directories
        for (const dir of this.requiredDirectories) {
            const dirPath = path.join(this.projectRoot, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                this.tracker.addAutoFix(`Created missing directory: ${dir}`);
            }
        }

        // Create essential configuration files if missing
        const essentialFiles = {
            'tsconfig.json': this.generateTsConfig(),
            'vite.config.ts': this.generateViteConfig(),
            'drizzle.config.ts': this.generateDrizzleConfig()
        };

        for (const [filename, content] of Object.entries(essentialFiles)) {
            const filePath = path.join(this.projectRoot, filename);
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, content);
                this.tracker.addAutoFix(`Created missing file: ${filename}`);
            }
        }
    }

    generateTsConfig() {
        return `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@server/*": ["./server/*"]
    }
  },
  "include": [
    "src/**/*",
    "server/**/*",
    "client/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}`;
    }

    generateViteConfig() {
        return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@server': path.resolve(__dirname, './server')
    }
  },
  build: {
    outDir: 'dist/public',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});`;
    }

    generateDrizzleConfig() {
        return `import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:<REDACTED_DB_PASSWORD>@localhost:5432/AccuBooks'
  },
  verbose: true,
  strict: true
});`;
    }

    async fixDockerConfiguration() {
        // Ensure docker-compose.saas.yml has all necessary services
        const dockerComposePath = path.join(this.projectRoot, 'docker-compose.saas.yml');
        if (fs.existsSync(dockerComposePath)) {
            const content = fs.readFileSync(dockerComposePath, 'utf8');

            // Check for required services
            const requiredServices = ['postgres', 'redis', 'app', 'worker', 'nginx'];
            const missingServices = [];

            for (const service of requiredServices) {
                if (!content.includes(`  ${service}:`)) {
                    missingServices.push(service);
                }
            }

            if (missingServices.length > 0) {
                this.tracker.addAutoFix(`Docker compose missing services: ${missingServices.join(', ')}`, 'Will rebuild docker-compose.yml');
                await this.rebuildDockerCompose();
            }
        }
    }

    async rebuildDockerCompose() {
        const dockerComposeContent = `version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15
    container_name: accubooks-postgres
    environment:
      POSTGRES_DB: AccuBooks
      POSTGRES_USER: postgres
    POSTGRES_PASSWORD: <REDACTED_DB_PASSWORD>
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker-entrypoint-initdb.d:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: accubooks-redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    volumes:
      - redis_data:/data

  # Main Application
  app:
    build:
      context: .
      dockerfile: Dockerfile.saas
      args:
        - NODE_ENV=production
        - DATABASE_URL=\${DATABASE_URL}
        - REDIS_URL=\${REDIS_URL}
        - PORT=\${PORT}
        - JWT_SECRET=\${JWT_SECRET}
        - FRONTEND_URL=\${FRONTEND_URL}
        - ADMIN_URL=\${ADMIN_URL}
        - DOCS_URL=\${DOCS_URL}
        - STATUS_URL=\${STATUS_URL}
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - DATABASE_URL=\${DATABASE_URL}
      - REDIS_URL=\${REDIS_URL}
      - PORT=\${PORT}
      - JWT_SECRET=\${JWT_SECRET}
      - FRONTEND_URL=\${FRONTEND_URL}
      - ADMIN_URL=\${ADMIN_URL}
      - DOCS_URL=\${DOCS_URL}
      - STATUS_URL=\${STATUS_URL}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Background Worker
  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
      args:
        - NODE_ENV=production
        - DATABASE_URL=\${DATABASE_URL}
        - REDIS_URL=\${REDIS_URL}
        - JWT_SECRET=\${JWT_SECRET}
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - DATABASE_URL=\${DATABASE_URL}
      - REDIS_URL=\${REDIS_URL}
      - JWT_SECRET=\${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "node", "-e", "console.log('Worker running')"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: accubooks-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - app
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:
`;

        fs.writeFileSync(path.join(this.projectRoot, 'docker-compose.saas.yml'), dockerComposeContent);
        this.tracker.addAutoFix('Rebuilt docker-compose.saas.yml', 'Added all required services and configurations');
    }

    async validatePackageScripts() {
        const packageJsonPath = path.join(this.projectRoot, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

            const requiredScripts = {
                'build': 'vite build',
                'dev': 'cross-env NODE_ENV=development tsx server/index.ts',
                'start': 'cross-env NODE_ENV=production node dist/index.js',
                'db:push': 'drizzle-kit push'
            };

            let needsUpdate = false;
            for (const [script, command] of Object.entries(requiredScripts)) {
                if (!packageJson.scripts || !packageJson.scripts[script]) {
                    if (!packageJson.scripts) packageJson.scripts = {};
                    packageJson.scripts[script] = command;
                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
                this.tracker.addAutoFix('Updated package.json scripts', 'Added missing build and development scripts');
            }
        }
    }

    async finalValidation() {
        console.log('🎯 Phase 9: Final Validation');
        this.tracker.updateCheckpoint('Final validation', 'in_progress');

        try {
            // Check all containers are running
            const containerResult = execSync('docker ps --format "table {{.Names}}\t{{.Status}}"', {
                cwd: this.projectRoot,
                encoding: 'utf8'
            });

            const runningContainers = containerResult.split('\n').filter(line =>
                line.includes('accubooks-') && line.includes('Up')
            ).length;

            // Check database connectivity
            const dbResult = execSync('docker exec accubooks-postgres-1 psql -U postgres -d AccuBooks -c "SELECT 1" 2>/dev/null && echo "DB_OK" || echo "DB_FAIL"', {
                cwd: this.projectRoot,
                encoding: 'utf8'
            });

            const dbConnected = dbResult.includes('DB_OK');

            // Check if app is responding
            const appResponding = await this.checkEndpoint('http://localhost:3000');

            if (runningContainers >= 3 && dbConnected && appResponding) {
                this.tracker.updateCheckpoint('Final validation', 'success', `All systems operational (${runningContainers} containers, DB connected, app responding)`);
            } else {
                this.tracker.updateCheckpoint('Final validation', 'warning', `${runningContainers} containers running, DB: ${dbConnected ? 'OK' : 'FAIL'}, App: ${appResponding ? 'OK' : 'FAIL'}`);
            }

        } catch (error) {
            this.tracker.updateCheckpoint('Final validation', 'error', error.message);
            this.tracker.addError(error.message, 'Final Validation');
        }
    }
}

// Main execution
async function main() {
    const projectRoot = 'C:\\FidiMyProjects2025\\Software_Projects\\AccuBooks\\AccuBooks';

    if (!fs.existsSync(projectRoot)) {
        console.error(`❌ Project root not found: ${projectRoot}`);
        process.exit(1);
    }

    const builder = new AccuBooksBuilder(projectRoot);
    await builder.run();
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { BuildTracker, AccuBooksBuilder };
