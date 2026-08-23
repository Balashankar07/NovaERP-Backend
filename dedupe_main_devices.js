const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB' });
  await client.connect();

  console.log("=== Setting up exact 5 main devices with ProductType = 1 ===");

  const mainDevices = [
    { name: 'Bluetooth Speaker', sku: 'BS-1000' },
    { name: 'Wireless Earbuds', sku: 'WE-1001' },
    { name: 'Smartwatch', sku: 'SW-1002' },
    { name: 'Power Bank', sku: 'PB-1003' },
    { name: 'Neckband', sku: 'NB-1004' }
  ];

  for (const d of mainDevices) {
    const res = await client.query('SELECT "Id" FROM "Products" WHERE "SKU" = $1 OR "Name" = $2 ORDER BY "CreatedAt" ASC', [d.sku, d.name]);
    if (res.rows.length > 1) {
      // Keep first, re-link BOMs, delete rest
      const keepId = res.rows[0].Id;
      const deleteIds = res.rows.slice(1).map(r => r.Id);

      await client.query('UPDATE "BOMs" SET "ProductId" = $1 WHERE "ProductId" = ANY($2)', [keepId, deleteIds]);
      await client.query('DELETE FROM "BOMItems" WHERE "ComponentId" = ANY($1) OR "BOMId" IN (SELECT "Id" FROM "BOMs" WHERE "ProductId" = ANY($1))', [deleteIds]);
      await client.query('DELETE FROM "BOMs" WHERE "ProductId" = ANY($1)', [deleteIds]);
      await client.query('DELETE FROM "Inventory" WHERE "ProductId" = ANY($1)', [deleteIds]);
      await client.query('DELETE FROM "ProductionOrders" WHERE "ProductId" = ANY($1)', [deleteIds]);
      await client.query('DELETE FROM "Products" WHERE "Id" = ANY($1)', [deleteIds]);

      await client.query('UPDATE "Products" SET "Type" = 1, "SKU" = $1, "Name" = $2, "IsActive" = true WHERE "Id" = $3', [d.sku, d.name, keepId]);
    } else if (res.rows.length === 1) {
      await client.query('UPDATE "Products" SET "Type" = 1, "SKU" = $1, "Name" = $2, "IsActive" = true WHERE "Id" = $3', [d.sku, d.name, res.rows[0].Id]);
    }
  }

  // Ensure all components have Type = 2
  await client.query('UPDATE "Products" SET "Type" = 2 WHERE "SKU" LIKE \'COMP-%\' OR "Name" LIKE \'COMP-%\'');

  const finalCheck = await client.query('SELECT "Id", "SKU", "Name", "Type" FROM "Products" WHERE "Type" = 1 OR "SKU" IN (\'BS-1000\', \'WE-1001\', \'SW-1002\', \'PB-1003\', \'NB-1004\')');
  console.log("=== MAIN DEVICES IN DB ===");
  console.table(finalCheck.rows);

  await client.end();
}

run().catch(console.error);
