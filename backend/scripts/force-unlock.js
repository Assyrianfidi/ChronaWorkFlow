import pg from 'pg';

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database. Attempting to unlock all advisory locks...');
    await client.query('SELECT pg_advisory_unlock_all()');
    console.log('Successfully unlocked all advisory locks.');

    console.log('Terminating other connections...');
    await client.query(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = current_database() 
      AND pid <> pg_backend_pid()
    `);
    console.log('Successfully terminated other connections.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
