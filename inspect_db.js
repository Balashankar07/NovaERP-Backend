const {Client} = require('pg');

async function run() {
  const client = new Client({connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB'});
  await client.connect();

  console.log('=== Products with Type + ProductNumber ===');
  const r = await client.query(`
    SELECT "ProductCode", "Name", "Type", "ProductNumber", "IsActive"
    FROM "Products"
    ORDER BY "ProductCode";
  `);
  r.rows.forEach(x => console.log(JSON.stringify(x)));

  console.log('\n=== Sequences current state ===');
  const seqs = await client.query(`
    SELECT sequencename, start_value, last_value, increment_by
    FROM pg_sequences ORDER BY sequencename;
  `);
  seqs.rows.forEach(x => console.log(JSON.stringify(x)));

  console.log('\n=== EF __EFMigrationsHistory ===');
  const mig = await client.query(`SELECT "MigrationId" FROM "__EFMigrationsHistory" ORDER BY "MigrationId";`);
  mig.rows.forEach(x => console.log(x.MigrationId));

  console.log('\n=== BOM count ===');
  const bc = await client.query(`SELECT COUNT(*) as boms FROM "BOMs"; `);
  console.log('BOMs:', bc.rows[0].boms);
  const bic = await client.query(`SELECT COUNT(*) as items FROM "BOMItems";`);
  console.log('BOMItems:', bic.rows[0].items);

  console.log('\n=== Inventory product IDs (non-FG) ===');
  const inv = await client.query(`
    SELECT p."ProductCode", p."Name", p."Type"
    FROM "Inventories" i
    JOIN "Products" p ON p."Id" = i."ProductId"
    ORDER BY p."ProductCode";
  `);
  inv.rows.forEach(x => console.log(JSON.stringify(x)));

  await client.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
