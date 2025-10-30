import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'accubooks_db',
  password: '<REDACTED_TEST_DB_PASSWORD>',
  port: 5432,
});

async function testConnection() {
  try {
    const res = await pool.query('SELECT $1::text as message', ['Database connection successful!']);
    console.log(res.rows[0].message);
    await pool.end();
  } catch (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  }
}

testConnection();
