const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB' });
  await client.connect();

  try {
    const products = await client.query(`SELECT "Id", "Name", "SKU" FROM "Products" WHERE "Name" LIKE '%RM Shortage%' OR "Name" LIKE '%FG With BOM%'`);
    console.log(`Found ${products.rows.length} products.`);

    if (products.rows.length > 0) {
      const prodIds = products.rows.map(r => r.Id);
      
      // Delete from all potential child tables
      await client.query('DELETE FROM "SupplierProducts" WHERE "ProductId" = ANY($1)', [prodIds]);
      await client.query('DELETE FROM "BOMItems" WHERE "RawMaterialProductId" = ANY($1)', [prodIds]);
      await client.query('DELETE FROM "InventoryReservations" WHERE "InventoryId" IN (SELECT "Id" FROM "Inventories" WHERE "ProductId" = ANY($1))', [prodIds]);
      await client.query('DELETE FROM "InventoryTransactions" WHERE "InventoryId" IN (SELECT "Id" FROM "Inventories" WHERE "ProductId" = ANY($1))', [prodIds]);
      await client.query('DELETE FROM "Inventories" WHERE "ProductId" = ANY($1)', [prodIds]);
      await client.query('DELETE FROM "GoodsReceiptItems" WHERE "PurchaseOrderItemId" IN (SELECT "Id" FROM "PurchaseOrderItems" WHERE "ProductId" = ANY($1))', [prodIds]);
      await client.query('DELETE FROM "PurchaseOrderItems" WHERE "ProductId" = ANY($1)', [prodIds]);
      await client.query('DELETE FROM "PurchaseRequestItems" WHERE "ProductId" = ANY($1)', [prodIds]);
      await client.query('DELETE FROM "ProductionExecutions" WHERE "ProductionOrderId" IN (SELECT "Id" FROM "ProductionOrders" WHERE "ProductId" = ANY($1))', [prodIds]);
      await client.query('DELETE FROM "ProductionRequirements" WHERE "ProductId" = ANY($1)', [prodIds]);
      await client.query('DELETE FROM "ProductionPlans" WHERE "ProductId" = ANY($1)', [prodIds]);
      await client.query('DELETE FROM "ProductionOrders" WHERE "ProductId" = ANY($1)', [prodIds]);
      await client.query('DELETE FROM "BOMItems" WHERE "BomId" IN (SELECT "Id" FROM "BOMs" WHERE "ProductId" = ANY($1))', [prodIds]);
      await client.query('DELETE FROM "BOMs" WHERE "ProductId" = ANY($1)', [prodIds]);
      await client.query('DELETE FROM "Products" WHERE "Id" = ANY($1)', [prodIds]);
      
      console.log(`Successfully deleted ${prodIds.length} products!`);
    } else {
      console.log('No products found in DB.');
    }
  } catch (err) {
    console.error('Error during deletion:', err);
  } finally {
    await client.end();
  }
}

run();
