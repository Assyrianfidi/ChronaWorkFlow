#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import readline from 'readline/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_FILE = path.join(__dirname, '../config/project.json');
const LOG_FILE = path.join(process.cwd(), 'logs', 'setup.log');

class ProjectSetup {
  constructor() {
    this.config = null;
    this.logs = [];
    this.fs = fs;
  }

  async init() {
    try {
      await this.ensureLogsDirectory();
      await this.loadConfig();
      await this.runPreflightChecks();
      await this.installDependencies();
      await this.setupDatabase();
      await this.runValidations();
      await this.logSuccess('✅ Project setup completed successfully!');
    } catch (error) {
      await this.logError('❌ Setup failed:', error);
      process.exit(1);
    }
  }

  async ensureLogsDirectory() {
    const logsDir = path.join(process.cwd(), 'logs');
    try {
      await this.fs.mkdir(logsDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }

  async loadConfig() {
    try {
      const configData = await this.fs.readFile(CONFIG_FILE, 'utf8');
      this.config = JSON.parse(configData);
      await this.logInfo('Loaded project configuration');
    } catch (error) {
      throw new Error(`Failed to load config: ${error.message}`);
    }
  }

  async runPreflightChecks() {
    await this.logInfo('Running preflight checks...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    await this.logInfo(`Node.js version: ${nodeVersion}`);
    
    // Check npm/yarn
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      await this.logInfo(`npm version: ${npmVersion}`);
    } catch (error) {
      throw new Error('npm is not installed or not in PATH');
    }
    
    // Check Git
    try {
      const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
      await this.logInfo(`Git version: ${gitVersion}`);
    } catch (error) {
      await this.logWarning('Git is not installed. Some features may be limited.');
    }
  }

  async installDependencies() {
    await this.logInfo('Installing dependencies...');
    
    // Install root dependencies
    await this.runCommand('npm install', 'Installing root dependencies');
    
    // Install client dependencies
    await this.runCommand('npm install', 'Installing client dependencies', 'client');
    
    // Install server dependencies if server directory exists
    const serverPath = path.join(process.cwd(), 'server');
    try {
      await this.fs.access(serverPath);
      await this.runCommand('npm install', 'Installing server dependencies', 'server');
    } catch (error) {
      await this.logInfo('No server directory found, skipping server dependencies');
    }
  }

  async setupDatabase() {
    await this.logInfo('Setting up database...');
    
    try {
      // Check if Prisma is installed
      try {
        await this.runCommand('npx prisma --version', 'Checking Prisma CLI');
      } catch (error) {
        await this.logInfo('Prisma not found, installing...');
        await this.runCommand('npm install -D prisma', 'Installing Prisma');
      }
      
      // Run database migrations
      await this.runCommand('npx prisma migrate dev --name init', 'Running database migrations');
      
      // Generate Prisma client
      await this.runCommand('npx prisma generate', 'Generating Prisma client');
      
      // Seed the database if seed script exists
      const seedPath = path.join(process.cwd(), 'prisma/seed.ts');
      try {
        await this.fs.access(seedPath);
        await this.runCommand('npx tsx prisma/seed.ts', 'Seeding database');
      } catch (error) {
        await this.logInfo('No seed script found, skipping database seeding');
      }
    } catch (error) {
      await this.logWarning(`Database setup encountered an error: ${error.message}`);
      throw error;
    }
  }

  async runValidations() {
    await this.logInfo('Running validations...');
    
    // Type checking
    await this.runCommand('npm run typecheck', 'Running TypeScript type checking');
    
    // Linting
    await this.runCommand('npm run lint', 'Running linter');
    
    // Tests
    await this.runCommand('npm test', 'Running tests');
  }

  async runCommand(command, description = '', cwd = '') {
    const commandCwd = cwd ? path.join(process.cwd(), cwd) : process.cwd();
    
    try {
      if (description) {
        await this.logInfo(description);
      }
      
      const result = execSync(command, { 
        stdio: 'inherit',
        encoding: 'utf8',
        cwd: commandCwd,
        timeout: 300000, // 5 minutes
        shell: true
      });
      
      await this.logInfo(`Command executed successfully: ${command}`);
      return result;
    } catch (error) {
      const errorMsg = error.stderr || error.stdout || error.message;
      await this.logError(`Command failed: ${command}`, errorMsg);
      throw error;
    }
  }

  async logInfo(message) {
    const log = `[INFO] ${new Date().toISOString()} - ${message}`;
    console.log(log);
    this.logs.push(log);
    await this.writeToLog(log);
  }

  async logWarning(message) {
    const log = `[WARN] ${new Date().toISOString()} - ${message}`;
    console.warn('\x1b[33m%s\x1b[0m', log);
    this.logs.push(log);
    await this.writeToLog(log);
  }

  async logError(message, error = '') {
    const log = `[ERROR] ${new Date().toISOString()} - ${message} ${error}`.trim();
    console.error('\x1b[31m%s\x1b[0m', log);
    this.logs.push(log);
    await this.writeToLog(log);
  }

  async logSuccess(message) {
    const log = `[SUCCESS] ${new Date().toISOString()} - ${message}`;
    console.log('\x1b[32m%s\x1b[0m', log);
    this.logs.push(log);
    await this.writeToLog(log);
  }

  async writeToLog(message) {
    try {
      await this.fs.appendFile(LOG_FILE, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
}

// Run the setup
const setup = new ProjectSetup();
setup.init().catch(console.error);
