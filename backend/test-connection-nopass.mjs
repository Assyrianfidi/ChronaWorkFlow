import { Client } from "pg";

const client = new Client({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "",
  database: "accubooks",
});

client
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .then(() => client.query("SELECT NOW()"))
  .then((res) => console.log("Query result:", res.rows[0]))
  .catch((err) => console.error("❌ Connection error:", err))
  .finally(() => client.end());
