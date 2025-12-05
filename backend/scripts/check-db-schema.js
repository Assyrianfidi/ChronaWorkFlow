import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config();

// Get database connection string from environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create a connection
const sql = postgres(connectionString);

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema...');
    
    // Check users table
    try {
      console.log('\n📋 Checking users table...');
      const users = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users'
        ORDER BY ordinal_position;
      `;
      console.log('Users table columns:');
      console.table(users);
      
      // Check if we can query the users table
      const userCount = await sql`SELECT COUNT(*) as count FROM users`;
      console.log('\n📊 Users table row count:', userCount[0].count);
      
      // Try to get a sample user
      try {
        const sampleUser = await sql`SELECT * FROM users LIMIT 1`;
        console.log('\n👤 Sample user (first row):');
        console.log(sampleUser[0]);
      } catch (error) {
        console.error('\n❌ Error fetching sample user:', error.message);
      }
      
    } catch (error) {
      console.error('\n❌ Error checking users table:', error.message);
    }
    
    // List all tables
    try {
      console.log('\n📋 Listing all tables in the database...');
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public';
      `;
      
      console.log('\n📋 All tables in public schema:');
      for (const table of tables) {
        console.log(`\nTable: ${table.table_name}`);
        try {
          const columns = await sql`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = ${table.table_name}
            ORDER BY ordinal_position;
          `;
          console.table(columns);
        } catch (error) {
          console.error(`  Error getting columns for ${table.table_name}:`, error.message);
        }
      }
    } catch (error) {
      console.error('\n❌ Error listing tables:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error checking database schema:', error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

checkSchema();
