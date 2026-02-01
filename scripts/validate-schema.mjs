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
  
  // Check for required tables
  const tablesResult = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);
  
  const tables = tablesResult.rows.map(r => r.table_name);
  console.log("\n=== Tables in public schema ===");
  console.log(tables.join(", "));
  
  const requiredTables = ["customers", "payments", "companies", "invoices"];
  const missingTables = requiredTables.filter(t => !tables.includes(t));
  
  if (missingTables.length > 0) {
    console.error("\n❌ Missing required tables:", missingTables.join(", "));
    process.exit(1);
  }
  
  console.log("\n✅ All required tables exist");
  
  // Check customers table structure
  const customersColumns = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customers'
    ORDER BY ordinal_position;
  `);
  
  console.log("\n=== customers table columns ===");
  customersColumns.rows.forEach(col => {
    console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
  });
  
  const customersHasCompanyId = customersColumns.rows.some(c => c.column_name === "company_id");
  if (!customersHasCompanyId) {
    console.error("\n❌ customers table missing company_id column");
    process.exit(1);
  }
  console.log("✅ customers.company_id exists");
  
  // Check payments table structure
  const paymentsColumns = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments'
    ORDER BY ordinal_position;
  `);
  
  console.log("\n=== payments table columns ===");
  paymentsColumns.rows.forEach(col => {
    console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
  });
  
  const paymentsHasCompanyId = paymentsColumns.rows.some(c => c.column_name === "company_id");
  const paymentsHasInvoiceId = paymentsColumns.rows.some(c => c.column_name === "invoice_id");
  
  if (!paymentsHasCompanyId) {
    console.error("\n❌ payments table missing company_id column");
    process.exit(1);
  }
  if (!paymentsHasInvoiceId) {
    console.error("\n❌ payments table missing invoice_id column");
    process.exit(1);
  }
  console.log("✅ payments.company_id exists");
  console.log("✅ payments.invoice_id exists");
  
  // Check foreign keys
  const fkResult = await client.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name IN ('customers', 'payments')
    ORDER BY tc.table_name, kcu.column_name;
  `);
  
  console.log("\n=== Foreign keys ===");
  fkResult.rows.forEach(fk => {
    console.log(`  ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
  });
  
  const requiredFKs = [
    { table: "customers", column: "company_id", refTable: "companies", refColumn: "id" },
    { table: "payments", column: "company_id", refTable: "companies", refColumn: "id" },
    { table: "payments", column: "invoice_id", refTable: "invoices", refColumn: "id" }
  ];
  
  for (const req of requiredFKs) {
    const exists = fkResult.rows.some(
      fk => fk.table_name === req.table 
        && fk.column_name === req.column 
        && fk.foreign_table_name === req.refTable 
        && fk.foreign_column_name === req.refColumn
    );
    if (!exists) {
      console.error(`\n❌ Missing FK: ${req.table}.${req.column} → ${req.refTable}.${req.refColumn}`);
      process.exit(1);
    }
  }
  
  console.log("\n✅ All required foreign keys exist");
  console.log("\n🎯 Schema validation PASSED");
  
  await client.end();
} catch (err) {
  console.error("Schema validation failed:", err);
  process.exit(1);
}
