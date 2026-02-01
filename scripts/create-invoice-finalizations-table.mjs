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
  
  await client.query(`
    CREATE TABLE IF NOT EXISTS invoice_finalizations (
      id VARCHAR(36) PRIMARY KEY,
      company_id VARCHAR(36) NOT NULL REFERENCES companies(id),
      invoice_id VARCHAR(36) NOT NULL REFERENCES invoices(id),
      target_status TEXT NOT NULL,
      finalized_at TIMESTAMP NOT NULL DEFAULT NOW(),
      finalized_by VARCHAR(36) NOT NULL REFERENCES users(id)
    );
  `);
  
  console.log("Created invoice_finalizations table");
  
  await client.end();
  console.log("Table creation complete");
} catch (err) {
  console.error("Failed to create table:", err);
  process.exit(1);
}
