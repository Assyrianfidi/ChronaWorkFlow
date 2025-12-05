import { Client } from 'pg';

const client = new Client({
  connectionString: "postgresql://postgres:Fkhouch8@localhost:5432/AccuBooks",
});

async function createTable() {
  try {
    await client.connect();
    console.log("Connected to the database.");

    const query = `CREATE TABLE IF NOT EXISTS businesses (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL
    );`;

    await client.query(query);
    console.log("'Business' table created successfully.");
  } catch (error) {
    console.error("Error creating table:", error);
  } finally {
    await client.end();
    console.log("Database connection closed.");
  }
}

createTable();