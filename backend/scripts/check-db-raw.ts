import postgres from "postgres";
import { config } from "../src/config/config.js";

async function checkDatabase() {
  const env = config;
  const connectionString = env.database.url;

  if (!connectionString) {
    console.error("❌ DATABASE_URL is not defined in environment variables");
    process.exit(1);
  }

  // Create a connection
  const sql = postgres(connectionString, {
    ssl: env.isProduction ? { rejectUnauthorized: false } : false,
    max: 1, // Use a single connection for this script
    idle_timeout: 5,
    max_lifetime: 10,
  });

  try {
    console.log("🔌 Testing database connection...");

    // Test the connection
    const [result] = await sql`SELECT NOW() as now`;
    console.log("✅ Database connection successful");
    console.log("Current database time:", result.now);

    // List all tables
    console.log("\n📋 Listing all tables...");
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;

    console.log("\n📋 Tables in public schema:");
    for (const table of tables) {
      console.log(`- ${table.table_name}`);

      // Get columns for this table
      const columns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = ${table.table_name}
        ORDER BY ordinal_position;
      `;

      console.log("  Columns:");
      for (const col of columns) {
        console.log(`    - ${col.column_name} (${col.data_type})`);
      }
    }
  } catch (error) {
    console.error("❌ Error checking database:", error);
  } finally {
    await sql.end();
  }
}

checkDatabase().catch(console.error);
