import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

client.connect()
  .then(() => {
    console.log('Database connection successful');
    return client.end();
  })
  .catch(err => {
    console.error('Database connection error:', err.stack);
    process.exit(1);
  });
