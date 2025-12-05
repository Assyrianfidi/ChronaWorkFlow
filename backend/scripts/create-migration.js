#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createMigration(name) {
  if (!name) {
    console.error('Please provide a migration name');
    process.exit(1);
  }

  const migrationsDir = path.join(__dirname, '../src/db/migrations');
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const migrationName = `${timestamp}_${name.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  const migrationFile = path.join(migrationsDir, `${migrationName}.ts`);

  const template = `import { sql } from 'drizzle-orm';

export async function up() {
  // Write your migration code here
  await sql\`\`;
}

export async function down() {
  // Write how to revert the migration here
  await sql\`\`;
}
`;

  try {
    await fs.mkdir(migrationsDir, { recursive: true });
    await fs.writeFile(migrationFile, template);
    console.log(`✅ Created migration: ${migrationFile}`);
  } catch (error) {
    console.error('Failed to create migration:', error);
    process.exit(1);
  }
}

const [,, ...args] = process.argv;
const name = args[0];

createMigration(name).catch(console.error);
