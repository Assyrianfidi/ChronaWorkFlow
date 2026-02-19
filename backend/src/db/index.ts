import postgres, { Sql } from "postgres";
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import * as schema from "./schema.js";
import { config } from "../config/config.js";

type DBType = PostgresJsDatabase<typeof schema> & { $client: Sql };

const env = config;

// Parse the database URL
let connectionString = env.database.url;

// Remove the schema parameter from the connection string if it exists
if (connectionString.includes("schema=")) {
  connectionString = connectionString.replace(/[?&]schema=[^&]*(?:&|$)/, "");
  // Remove trailing ? if it's the only parameter
  connectionString = connectionString.replace(/\?$/, "");
}

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

// Disable prepared statements for transactions
const client = postgres(connectionString, {
  prepare: false,
  ssl: env.isProduction ? { rejectUnauthorized: false } : false,
  max: 20,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
  // Set the schema in the connection options if supported by the database
  // This is a safer approach than using URL parameters
  connection: {
    // Default schema is 'public' if not specified
    search_path: "public",
  },
});

// Create a single connection pool for the application
export const db: DBType = Object.assign(
  drizzle(client, {
    schema,
    logger: !env.isProduction,
  }),
  { $client: client },
);

// Set the schema for all queries
// This ensures the schema is set even if the connection option above doesn't work
client`SET search_path TO public`.catch(console.error);

// Export types and utilities
export type * from "./schema.js";
export { sql } from "drizzle-orm";

// Helper function to execute raw SQL queries
export async function executeQuery<T = any>(
  query: string,
  params?: any[],
): Promise<T[]> {
  const result = await client.unsafe<T[]>(query, params || []);
  return result;
}

// Helper function for transactions
export async function transaction<T>(
  callback: (tx: PostgresJsDatabase<typeof schema>) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx: any) => {
    return await callback(tx);
  });
}

// Close the database connection
export async function closeConnection() {
  await client.end();
}

// Handle application shutdown
process.on("SIGINT", async () => {
  await closeConnection();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeConnection();
  process.exit(0);
});
