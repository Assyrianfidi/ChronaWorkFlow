import { db } from '../src/db/index.js';
import { sql } from 'drizzle-orm';

async function inspectSchema() {
  try {
    console.log('🔍 Inspecting database schema...');
    
    // Get all tables in the public schema
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    
    console.log('\n📋 Tables in public schema:');
    console.table(tables.rows);
    
    // For each table, get its columns
    for (const table of tables.rows) {
      const tableName = table.table_name;
      console.log(`\n📋 Columns in table: ${tableName}`);
      
      const columns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = ${tableName}
        ORDER BY ordinal_position;
      `);
      
      console.table(columns.rows);
    }
    
  } catch (error) {
    console.error('❌ Error inspecting database schema:', error);
  } finally {
    await (db as any).$client.end();
    process.exit(0);
  }
}

inspectSchema();
