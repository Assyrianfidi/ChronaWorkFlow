import { db } from "../src/db/index.js";
import { sql } from "drizzle-orm";

async function checkSchema() {
  try {
    console.log("🔍 Checking database schema...");

    // Test the connection
    const now = await db.execute(sql`SELECT NOW() as now`);
    console.log("✅ Database connection successful");
    console.log("Current database time:", now.rows[0].now);

    // Get all tables
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);

    console.log("\n📋 Tables in public schema:");
    for (const table of tables.rows) {
      console.log(`\nTable: ${table.table_name}`);

      // Get columns for this table
      const columns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = ${table.table_name}
        ORDER BY ordinal_position;
      `);

      console.log("Columns:");
      for (const col of columns.rows) {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      }
    }
  } catch (error) {
    console.error("❌ Error checking database schema:", error);
  } finally {
    // Close the connection
    await (db as any).$client.end();
    process.exit(0);
  }
}

checkSchema();
