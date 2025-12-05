import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

// Logging functions
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg) => console.error(`${colors.red}✗ ${msg}${colors.reset}`),
  header: (msg) => {
    console.log(`\n${colors.bright}${colors.blue}${'='.repeat(80)}`);
    console.log(`  ${msg}`);
    console.log(`${'='.repeat(80)}${colors.reset}\n`);
  },
};

// Check if a command exists
const commandExists = (cmd) => {
  try {
    execSync(`command -v ${cmd} > /dev/null 2>&1`);
    return true;
  } catch (e) {
    return false;
  }
};

// Run a command with error handling
const runCommand = (command, cwd = process.cwd()) => {
  log.info(`Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit', cwd });
    return true;
  } catch (error) {
    log.error(`Command failed: ${command}`);
    return false;
  }
};

// Check if a file exists
const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

// Create directory if it doesn't exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log.success(`Created directory: ${dir}`);
  }
};

// Main setup function
const setup = async () => {
  log.header('🚀 Starting AccuBooks Setup');
  
  // Check Node.js and npm
  log.header('🔍 Checking System Requirements');
  if (!commandExists('node') || !commandExists('npm')) {
    log.error('Node.js and npm are required. Please install them first.');
    process.exit(1);
  }
  
  log.success(`Node.js: ${execSync('node --version').toString().trim()}`);
  log.success(`npm: ${execSync('npm --version').toString().trim()}`);

  // Check .env file
  log.header('⚙️  Environment Configuration');
  const envPath = path.join(__dirname, '.env');
  if (!fileExists(envPath)) {
    log.warn('.env file not found. Creating a default one...');
    fs.writeFileSync(envPath, `# AccuBooks Environment Variables
NODE_ENV=development
PORT=3001
HOST=localhost

# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET=dev_jwt_secret_change_in_production_12345
JWT_REFRESH_SECRET=dev_refresh_secret_change_in_prod_12345

# Email
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=test@example.com
SMTP_PASS=testpass123!@#

# Frontend
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
`);
    log.success('Created .env file with default values');
  } else {
    log.success('.env file exists');
  }

  // Install dependencies
  log.header('📦 Installing Dependencies');
  if (fileExists(path.join(__dirname, 'package.json'))) {
    runCommand('npm install');
  } else {
    log.warn('No package.json found. Initializing a new Node.js project...');
    runCommand('npm init -y');
  }

  // Setup backend
  log.header('🔧 Setting Up Backend');
  const backendDir = path.join(__dirname, 'backend');
  
  if (fileExists(path.join(backendDir, 'package.json'))) {
    log.info('Installing backend dependencies...');
    runCommand('npm install', backendDir);
    
    // Setup Prisma
    if (fileExists(path.join(backendDir, 'prisma', 'schema.prisma'))) {
      log.info('Setting up Prisma...');
      runCommand('npx prisma generate', backendDir);
      runCommand('npx prisma migrate dev --name init', backendDir);
    }
  }

  // Setup frontend
  log.header('🎨 Setting Up Frontend');
  const frontendDir = path.join(__dirname, 'client');
  
  if (fileExists(path.join(frontendDir, 'package.json'))) {
    log.info('Installing frontend dependencies...');
    runCommand('npm install', frontendDir);
  } else {
    log.warn('No frontend found. Creating a new Vite + React app...');
    runCommand('npm create vite@latest client -- --template react-ts');
    runCommand('npm install', frontendDir);
  }

  // Start services
  log.header('🚀 Starting Services');
  
  // Start backend
  if (fileExists(path.join(backendDir, 'package.json'))) {
    log.info('Starting backend server...');
    // Run in background
    const backendProcess = execSync(
      'node -r dotenv/config backend/src/index.js',
      { stdio: 'inherit', cwd: __dirname, detached: true }
    );
  }
  
  // Start frontend
  if (fileExists(path.join(frontendDir, 'package.json'))) {
    log.info('Starting frontend development server...');
    // Run in background
    const frontendProcess = execSync(
      'npm run dev',
      { stdio: 'inherit', cwd: frontendDir, detached: true }
    );
  }

  // Final message
  log.header('🎉 Setup Complete!');
  log.success('AccuBooks is now running:');
  log.success(`- Frontend: ${colors.bright}http://localhost:5173${colors.reset}`);
  log.success(`- Backend API: ${colors.bright}http://localhost:3001${colors.reset}`);
  log.success(`- Database: ${colors.bright}SQLite at ./prisma/dev.db${colors.reset}`);
  log.success('\nUse Ctrl+C to stop all services');
};

// Run the setup
setup().catch((error) => {
  log.error('Setup failed:');
  console.error(error);
  process.exit(1);
});
