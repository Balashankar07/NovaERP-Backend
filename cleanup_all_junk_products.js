const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB' });
  await client.connect();

  console.log("=== Purging all junk/audit products & BOMs from DB ===");

  // Find all junk products
  const junkRes = await client.query(`
    SELECT "Id", "Name", "SKU" FROM "Products"
    WHERE "Name" LIKE '%Audit%' 
       OR "Name" LIKE 'FG With BOM' 
       OR "Name" LIKE 'RM Shortage' 
       OR "SKU" LIKE 'F-10%' 
       OR "SKU" LIKE 'C-10%' 
       OR "SKU" LIKE 'FWB-%' 
       OR "SKU" LIKE 'RS-%'
  `);
  
  const junkIds = junkRes.rows.map(r => r.Id);
  console.log(`Found ${junkIds.length} junk products to delete.`);

  if (junkIds.length > 0) {
    await client.query('DELETE FROM "BOMItems" WHERE "ComponentId" = ANY($1) OR "BOMId" IN (SELECT "Id" FROM "BOMs" WHERE "ProductId" = ANY($1))', [junkIds]);
    await client.query('DELETE FROM "BOMs" WHERE "ProductId" = ANY($1)', [junkIds]);
    await client.query('DELETE FROM "InventoryTransactions" WHERE "InventoryId" IN (SELECT "Id" FROM "Inventory" WHERE "ProductId" = ANY($1))', [junkIds]);
    await client.query('DELETE FROM "Inventory" WHERE "ProductId" = ANY($1)', [junkIds]);
    await client.query('DELETE FROM "PurchaseOrderItems" WHERE "ProductId" = ANY($1)', [junkIds]);
    await client.query('DELETE FROM "PurchaseRequestItems" WHERE "ProductId" = ANY($1)', [junkIds]);
    await client.query('DELETE FROM "ProductionExecutions" WHERE "ProductionOrderId" IN (SELECT "Id" FROM "ProductionOrders" WHERE "ProductId" = ANY($1))', [junkIds]);
    await client.query('DELETE FROM "ProductionOrders" WHERE "ProductId" = ANY($1)', [junkIds]);
    await client.query('DELETE FROM "Products" WHERE "Id" = ANY($1)', [junkIds]);
    console.log("✅ Successfully purged all junk/audit product records!");
  }

  const remainingProducts = await client.query('SELECT "Id", "SKU", "Name", "Type" FROM "Products" ORDER BY "Name" ASC');
  console.log("=== REMAINING PRODUCTS IN DB:", remainingProducts.rows.length, "===");
  console.table(remainingProducts.rows);

  await client.end();
}

run().catch(console.error);
