const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

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

// List of required tables and their expected columns
const requiredTables = {
  users: ['id', 'email', 'password_hash', 'created_at'],
  tenants: ['id', 'name', 'slug', 'is_active', 'created_at'],
  subscriptions: ['id', 'tenant_id', 'status', 'created_at'],
  // Add more tables as needed
};

async function verifyDatabase() {
  console.log('🔍 Verifying database connection and schema...');
  
  const dbConfig = parseDbUrl(process.env.DATABASE_URL);
  const client = new Client({
    ...dbConfig,
    connectionTimeoutMillis: 5000,
  });

  try {
    // Test connection
    await client.connect();
    console.log('✅ Successfully connected to the database');

    // Check if database exists
    const dbCheck = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1', 
      [dbConfig.database]
    );
    
    if (dbCheck.rowCount === 0) {
      console.error(`❌ Database "${dbConfig.database}" does not exist`);
      return false;
    }
    
    console.log(`✅ Database "${dbConfig.database}" exists`);

    // Check required tables
    for (const [table, columns] of Object.entries(requiredTables)) {
      try {
        // Check if table exists
        const tableExists = await client.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )`,
          [table]
        );

        if (!tableExists.rows[0].exists) {
          console.error(`❌ Table "${table}" is missing`);
          return false;
        }

        // Check columns
        const { rows } = await client.query(
          `SELECT column_name 
           FROM information_schema.columns 
           WHERE table_name = $1`,
          [table]
        );

        const existingColumns = rows.map(r => r.column_name);
        const missingColumns = columns.filter(col => !existingColumns.includes(col));

        if (missingColumns.length > 0) {
          console.error(`❌ Table "${table}" is missing columns: ${missingColumns.join(', ')}`);
          return false;
        }

        console.log(`✅ Table "${table}" exists with all required columns`);
      } catch (error) {
        console.error(`❌ Error checking table "${table}":`, error.message);
        return false;
      }
    }

    console.log('✅ All required tables and columns exist');
    return true;
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    return false;
  } finally {
    await client.end().catch(console.error);
  }
}

// Run the verification
verifyDatabase()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
