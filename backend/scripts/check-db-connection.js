import { db } from '../src/db/index.js';
import { sql } from 'drizzle-orm';

async function checkConnection() {
  try {
    console.log('🔌 Testing database connection...');
    
    // Test the connection
    const result = await db.execute(sql`SELECT NOW() as now`);
    console.log('✅ Database connection successful');
    console.log('Current database time:', result.rows[0].now);
    
    // List all tables
    console.log('\n📋 Listing all tables...');
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    
    console.log('\n📋 Tables in public schema:');
    for (const table of tables.rows) {
      console.log(`- ${table.table_name}`);
    }
    
    // Check users table columns
    console.log('\n🔍 Checking users table columns...');
    const columns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users';
    `);
    
    console.log('\n📋 Users table columns:');
    for (const col of columns.rows) {
      console.log(`- ${col.column_name} (${col.data_type})`);
    }
    
  } catch (error) {
    console.error('❌ Error checking database connection:', error);
  } finally {
    // Close the connection
    await (db as any).$client.end();
    process.exit(0);
  }
}

checkConnection();
