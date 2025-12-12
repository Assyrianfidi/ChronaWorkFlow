import { sql } from "drizzle-orm";
import { db } from "../index.js";

export async function up() {
  await db.execute(sql`
    -- Create enum type for user roles
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');

    -- Create users table
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role user_role NOT NULL DEFAULT 'user',
      is_active BOOLEAN NOT NULL DEFAULT true,
      is_email_verified BOOLEAN NOT NULL DEFAULT false,
      last_login_at TIMESTAMP,
      password_reset_token TEXT,
      password_reset_expires TIMESTAMP,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Create refresh_tokens table
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Create user_sessions table
    CREATE TABLE IF NOT EXISTS user_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      ip_address TEXT,
      user_agent TEXT,
      expires_at TIMESTAMP NOT NULL,
      last_active_at TIMESTAMP NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Create reconciliation_reports table
    CREATE TABLE IF NOT EXISTS reconciliation_reports (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      amount DECIMAL(19, 4) NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      approved_by_id INTEGER REFERENCES users(id),
      approved_at TIMESTAMP,
      rejected_at TIMESTAMP,
      rejection_reason TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT title_user_id UNIQUE (title, user_id)
    );

    -- Create audit_logs table
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      ip_address TEXT,
      user_agent TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Create user_preferences table
    CREATE TABLE IF NOT EXISTS user_preferences (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id)
    );

    -- Create notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT false,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      read_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Create user_roles table
    CREATE TABLE IF NOT EXISTS user_roles (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      permissions TEXT[] NOT NULL DEFAULT '{}',
      is_system BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Create user_role_mappings table
    CREATE TABLE IF NOT EXISTS user_role_mappings (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id INTEGER NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, role_id)
    );
  `);
}

export async function down() {
  await db.execute(sql`
    DROP TABLE IF EXISTS user_role_mappings CASCADE;
    DROP TABLE IF EXISTS user_roles CASCADE;
    DROP TABLE IF EXISTS notifications CASCADE;
    DROP TABLE IF EXISTS user_preferences CASCADE;
    DROP TABLE IF EXISTS audit_logs CASCADE;
    DROP TABLE IF EXISTS reconciliation_reports CASCADE;
    DROP TABLE IF EXISTS user_sessions CASCADE;
    DROP TABLE IF EXISTS refresh_tokens CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TYPE IF EXISTS user_role;
  `);
}

// Run the migration if this file is executed directly
if (require.main === module) {
  up()
    .then(() => {
      console.log("Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}
