const { Client } = require('pg');

async function run() {
  const client = new Client({connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB'});
  await client.connect();

  const tables = [
    'Suppliers', 'Products', 'PurchaseOrders', 'PurchaseOrderItems',
    'GoodsReceipts', 'GoodsReceiptItems', 'Inventories'
  ];

  for (const table of tables) {
    console.log(`\n=== Table: ${table} ===`);
    
    // Check if table exists
    const check = await client.query(`SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = $1);`, [table]);
    if (!check.rows[0].exists) {
      console.log(`Table ${table} DOES NOT EXIST.`);
      continue;
    }

    // Row count
    const count = await client.query(`SELECT COUNT(*) FROM "${table}";`);
    console.log(`Row count: ${count.rows[0].count}`);

    // Columns
    const cols = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `, [table]);
    console.log(`Columns:`);
    cols.rows.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type} (${c.is_nullable === 'YES' ? 'null' : 'not null'})`));

    // Foreign Keys
    const fks = await client.query(`
      SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
      FROM
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1;
    `, [table]);
    if (fks.rows.length > 0) {
      console.log(`Foreign Keys:`);
      fks.rows.forEach(fk => console.log(`  - ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`));
    }
  }

  // Also check for any table with 'Supplier' in its name
  console.log(`\n=== All Tables containing 'Supplier' ===`);
  const allSuppTables = await client.query(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename ILIKE '%Supplier%';
  `);
  allSuppTables.rows.forEach(r => console.log(`  - ${r.tablename}`));

  await client.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
