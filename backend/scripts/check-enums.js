import pg from 'pg';

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    const query = `
      SELECT typname 
      FROM pg_type t 
      JOIN pg_namespace n ON n.oid = t.typnamespace 
      WHERE n.nspname = 'public' 
      AND (typname ILIKE '%PaymentStatus%' OR typname ILIKE '%AccountType%' OR typname ILIKE '%InvoiceStatus%' OR typname ILIKE '%Role%')
    `;
    const res = await client.query(query);
    console.log('Enums found in public schema:');
    res.rows.forEach(row => {
      console.log(`- ${row.typname}`);
    });

    const hasOld = res.rows.some(row => row.typname.toLowerCase().includes('_old'));
    if (hasOld) {
      console.log('❌ ERROR: Found _old enums remaining!');
    } else {
      console.log('✅ SUCCESS: No _old enums found.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
