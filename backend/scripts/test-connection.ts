import postgres from 'postgres';
import { config } from '../src/config/config.js';

async function testConnection() {
  try {
    // Get the database URL from config
    const connectionString = config.database.url;
    
    if (!connectionString) {
      console.error('❌ DATABASE_URL is not defined in environment variables');
      process.exit(1);
    }

    console.log('🔌 Testing database connection...');
    console.log('Connection string:', connectionString.replace(/\/\/([^:]+):[^@]+@/, '//$1:****@'));
    
    // Create a connection without any schema parameter
    const sql = postgres(connectionString, { 
      max: 1,
      idle_timeout: 5,
      max_lifetime: 10,
      ssl: config.isProduction ? { rejectUnauthorized: false } : false,
    });

    try {
      // Test the connection
      const [result] = await sql`SELECT NOW() as now`;
      console.log('✅ Database connection successful');
      console.log('Current database time:', result.now);
      
      // List all tables in the public schema
      console.log('\n📋 Listing tables in public schema...');
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public';
      `;
      
      console.log('\n📋 Tables in public schema:');
      for (const table of tables) {
        console.log(`\nTable: ${table.table_name}`);
        
        // Get columns for this table
        const columns = await sql`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = ${table.table_name}
          ORDER BY ordinal_position;
        `;
        
        console.log('  Columns:');
        for (const col of columns) {
          console.log(`    - ${col.column_name} (${col.data_type})`);
        }
      }
      
      return true;
    } finally {
      // Close the connection
      await sql.end();
    }
  } catch (error) {
    console.error('❌ Error testing database connection:', error);
    return false;
  }
}

// Run the test
testConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
