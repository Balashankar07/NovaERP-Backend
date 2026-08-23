const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB' });
  await client.connect();

  console.log("=== Purging all audit/test BOMs and products from DB ===");

  // Find all audit BOM IDs
  const auditBoms = await client.query(`
    SELECT b."Id" 
    FROM "BOMs" b
    JOIN "Products" p ON b."ProductId" = p."Id"
    WHERE p."Name" LIKE '%Audit%' 
       OR p."Name" LIKE 'FG With BOM' 
       OR p."Name" LIKE 'RM Shortage'
       OR p."SKU" LIKE 'F-10%' 
       OR p."SKU" LIKE 'C-10%' 
       OR p."SKU" LIKE 'FWB-%'
  `);

  const bomIds = auditBoms.rows.map(r => r.Id);
  console.log(`Found ${bomIds.length} audit BOMs to delete.`);

  if (bomIds.length > 0) {
    await client.query('DELETE FROM "BOMItems" WHERE "BOMId" = ANY($1)', [bomIds]);
    await client.query('DELETE FROM "BOMs" WHERE "Id" = ANY($1)', [bomIds]);
    console.log("✅ Deleted audit BOMItems and BOMs.");
  }

  // Delete audit products
  const auditProds = await client.query(`
    SELECT "Id" FROM "Products"
    WHERE "Name" LIKE '%Audit%' 
       OR "Name" LIKE 'FG With BOM' 
       OR "Name" LIKE 'RM Shortage'
       OR "SKU" LIKE 'F-10%' 
       OR "SKU" LIKE 'C-10%' 
       OR "SKU" LIKE 'FWB-%'
  `);

  const prodIds = auditProds.rows.map(r => r.Id);
  if (prodIds.length > 0) {
    await client.query('DELETE FROM "InventoryTransactions" WHERE "InventoryId" IN (SELECT "Id" FROM "Inventory" WHERE "ProductId" = ANY($1))', [prodIds]);
    await client.query('DELETE FROM "Inventory" WHERE "ProductId" = ANY($1)', [prodIds]);
    await client.query('DELETE FROM "PurchaseOrderItems" WHERE "ProductId" = ANY($1)', [prodIds]);
    await client.query('DELETE FROM "PurchaseRequestItems" WHERE "ProductId" = ANY($1)', [prodIds]);
    await client.query('DELETE FROM "ProductionExecutions" WHERE "ProductionOrderId" IN (SELECT "Id" FROM "ProductionOrders" WHERE "ProductId" = ANY($1))', [prodIds]);
    await client.query('DELETE FROM "ProductionOrders" WHERE "ProductId" = ANY($1)', [prodIds]);
    await client.query('DELETE FROM "Products" WHERE "Id" = ANY($1)', [prodIds]);
    console.log(`✅ Deleted ${prodIds.length} audit products.`);
  }

  // Verify remaining BOMs
  const remainingBOMs = await client.query(`
    SELECT b."Id", b."Version", p."Name" as productName, p."SKU" as productSKU
    FROM "BOMs" b
    JOIN "Products" p ON b."ProductId" = p."Id"
  `);

  console.log("=== REMAINING BOMS IN DB:", remainingBOMs.rows.length, "===");
  console.table(remainingBOMs.rows);

  await client.end();
}

run().catch(console.error);
