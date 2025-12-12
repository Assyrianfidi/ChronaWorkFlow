import { db } from "../src/db";
import { sql } from "drizzle-orm";
import "dotenv/config";

async function resetDatabase() {
  try {
    console.log("Dropping existing tables...");

    // Drop tables if they exist
    await db.execute(sql`
      DROP TABLE IF EXISTS reconciliation_reports CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    console.log("Dropped existing tables.");

    console.log("Creating new tables...");

    // Create users table
    await db.execute(sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create reconciliation_reports table
    await db.execute(sql`
      CREATE TABLE reconciliation_reports (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT title_user_id UNIQUE (title, user_id)
      );
    `);

    console.log("Successfully created new tables.");
  } catch (error) {
    console.error("Error resetting database:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

resetDatabase();
