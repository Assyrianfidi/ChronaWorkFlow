import { Client } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL });

try {
  await client.connect();
  console.log("Connected to database");
  
  await client.query("DROP SCHEMA IF EXISTS public CASCADE;");
  console.log("Dropped public schema");
  
  await client.query("CREATE SCHEMA public;");
  console.log("Created public schema");
  
  await client.end();
  console.log("Reset public schema OK");
} catch (err) {
  console.error("Failed to reset schema:", err);
  process.exit(1);
}
