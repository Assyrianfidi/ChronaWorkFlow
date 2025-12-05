import { db } from '../src/db/index.js';
import { sql } from 'drizzle-orm';

async function executeQuery<T = any>(query: string) {
  try {
    console.log('\n🔍 Executing query:', query);
    const result = await (db as any).$client.unsafe<T[]>(query);
    console.log('✅ Query executed successfully');
    return result;
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    return null;
  }
}

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema...');
    
    // Check if users table exists
    const usersTable = await executeQuery<{column_name: string, data_type: string, is_nullable: string, column_default: string}>(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users';
    `);
    
    if (usersTable && usersTable.length > 0) {
      console.log('\n📋 Users table schema:');
      console.table(usersTable);
    } else {
      console.log('\n❌ Users table does not exist or is empty');
    }
    
    // Check all tables in public schema
    const allTables = await executeQuery<{table_name: string}>(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    
    if (allTables && allTables.length > 0) {
      console.log('\n📋 All tables in public schema:');
      console.table(allTables);
      
      // Show schema for each table
      for (const table of allTables) {
        const tableName = table.table_name;
        const tableSchema = await executeQuery(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = '${tableName}';
        `);
        
        if (tableSchema) {
          console.log(`\n📋 Table: ${tableName}`);
          console.table(tableSchema);
        }
      }
    }
    
    // Check if _migrations table exists
    const migrationsTable = await executeQuery<{column_name: string, data_type: string, is_nullable: string, column_default: string}>(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = '_migrations';
    `);
    
    if (migrationsTable && migrationsTable.length > 0) {
      console.log('\n📋 _migrations table schema:');
      console.table(migrationsTable);
      
      // Check applied migrations
      const appliedMigrations = await executeQuery('SELECT * FROM _migrations ORDER BY id;');
      if (appliedMigrations) {
        console.log('\n📋 Applied migrations:');
        console.table(appliedMigrations);
      }
    } else {
      console.log('\n❌ _migrations table does not exist');
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    await (db as any).$client.end();
    process.exit(0);
  }
}

checkSchema();
