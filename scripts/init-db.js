const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Parse database URL (postgresql://user:password@host:port/database)
const parseDbUrl = (url) => {
  const match = url.match(/^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
  if (!match) throw new Error('Invalid DATABASE_URL format');
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5]
  };
};

// Function to execute a command and return the output
function executeCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      stdio: 'pipe',
      encoding: 'utf-8',
      ...options
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return { 
      success: false, 
      error: error.stderr ? error.stderr.toString() : error.message,
      output: error.stdout ? error.stdout.toString() : ''
    };
  }
}

// Function to check if a database exists
async function databaseExists(client, dbName) {
  try {
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error checking if database exists:', error.message);
    return false;
  }
}

// Function to create a database
async function createDatabase(client, dbName) {
  try {
    console.log(`🔄 Creating database "${dbName}"...`);
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`✅ Database "${dbName}" created`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to create database "${dbName}":`, error.message);
    return false;
  }
}

// Function to run database migrations
async function runMigrations() {
  console.log('🔄 Running database migrations...');
  try {
    // Run drizzle-kit push to sync schema
    const { success, error } = executeCommand('npm run db:push');
    if (!success) {
      console.error('❌ Failed to run migrations:', error);
      return false;
    }
    console.log('✅ Database migrations completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error running migrations:', error.message);
    return false;
  }
}

// Function to run initialization SQL script
async function runInitScript(client) {
  const initScriptPath = path.join(__dirname, 'init-saas-db.sql');
  
  if (!fs.existsSync(initScriptPath)) {
    console.warn(`⚠️  Initialization script not found at ${initScriptPath}`);
    return true; // Not a critical error
  }
  
  try {
    console.log('🔄 Running initialization script...');
    const initScript = fs.readFileSync(initScriptPath, 'utf8');
    await client.query(initScript);
    console.log('✅ Initialization script executed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error running initialization script:', error.message);
    return false;
  }
}

async function initializeDatabase() {
  console.log('🚀 Initializing database...');
  
  const dbConfig = parseDbUrl(process.env.DATABASE_URL);
  
  // Connect to the default 'postgres' database to create our database if it doesn't exist
  const adminClient = new Client({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: 'postgres', // Connect to default database
    connectionTimeoutMillis: 5000,
  });

  try {
    // Connect to admin database
    console.log('🔌 Connecting to PostgreSQL server...');
    await adminClient.connect();
    
    // Check if database exists
    const dbExists = await databaseExists(adminClient, dbConfig.database);
    
    if (!dbExists) {
      // Create the database if it doesn't exist
      const created = await createDatabase(adminClient, dbConfig.database);
      if (!created) {
        throw new Error('Failed to create database');
      }
    } else {
      console.log(`✅ Database "${dbConfig.database}" already exists`);
    }
    
    // Close the admin connection
    await adminClient.end();
    
    // Connect to our database
    const client = new Client({
      ...dbConfig,
      connectionTimeoutMillis: 5000,
    });
    
    await client.connect();
    
    // Run initialization script
    const initScriptSuccess = await runInitScript(client);
    if (!initScriptSuccess) {
      console.warn('⚠️  Initialization script had issues, but continuing...');
    }
    
    // Run migrations
    const migrationsSuccess = await runMigrations();
    if (!migrationsSuccess) {
      throw new Error('Database migrations failed');
    }
    
    console.log('✅ Database initialized successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  } finally {
    // Ensure all connections are closed
    try { await adminClient.end(); } catch (e) {}
  }
}

// Run the initialization
if (require.main === module) {
  initializeDatabase()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Unhandled error during initialization:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
