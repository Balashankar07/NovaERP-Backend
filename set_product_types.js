const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB' });
  await client.connect();

  console.log("=== Normalizing product types in DB ===");

  // Set 5 main devices to Type = 1 (FinishedGood)
  const deviceSkus = ['BS-1000', 'WE-1001', 'SW-1002', 'PB-1003', 'NB-1004', 'GW-2000', 'SEM-3000'];
  await client.query('UPDATE "Products" SET "Type" = 1 WHERE "SKU" = ANY($1)', [deviceSkus]);

  // Set all other products to Type = 2 (RawMaterial / Component)
  await client.query('UPDATE "Products" SET "Type" = 2 WHERE "SKU" != ALL($1) OR "Type" IS NULL', [deviceSkus]);

  const res = await client.query('SELECT "SKU", "Name", "Type" FROM "Products" ORDER BY "Type" ASC, "Name" ASC');
  console.log("=== ALL PRODUCTS AFTER TYPE NORMALIZATION ===");
  console.table(res.rows);

  await client.end();
}

run().catch(console.error);
