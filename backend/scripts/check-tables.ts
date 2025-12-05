import { db } from '../src/db/index.js';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

async function checkTables() {
  try {
    const result = await db.execute(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );
    console.log('Tables in the database:');
    console.log(result.rows);
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

checkTables();
