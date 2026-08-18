const { Client } = require('pg');

async function check() {
  const client = new Client({connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB'});
  await client.connect();

  const rogueRes = await client.query(`SELECT "Id", "Name", "ProductNumber" FROM "Products" WHERE "ProductNumber" = 'PROD-0006' OR "ProductCode" = 'PRD-006'`);
  if (rogueRes.rows.length === 0) {
    console.log("Rogue product not found.");
    await client.end();
    return;
  }
  
  const rogueId = rogueRes.rows[0].Id;
  console.log(`Rogue ID: ${rogueId} (${rogueRes.rows[0].Name})`);

  const checks = [
    { name: 'BOMs', query: `SELECT COUNT(*) as count FROM "BOMs" WHERE "ProductId" = $1` },
    { name: 'BOMItems', query: `SELECT COUNT(*) as count FROM "BOMItems" WHERE "RawMaterialProductId" = $1` },
    { name: 'Inventories', query: `SELECT COUNT(*) as count FROM "Inventories" WHERE "ProductId" = $1` },
    { name: 'SalesOrderItems', query: `SELECT COUNT(*) as count FROM "SalesOrderItems" WHERE "ProductId" = $1` },
    { name: 'PurchaseOrderItems', query: `SELECT COUNT(*) as count FROM "PurchaseOrderItems" WHERE "ProductId" = $1` },
    { name: 'ProductionOrders', query: `SELECT COUNT(*) as count FROM "ProductionOrders" WHERE "ProductId" = $1` },
  ];

  let totalDeps = 0;
  for (const c of checks) {
    const res = await client.query(c.query, [rogueId]);
    const count = parseInt(res.rows[0].count);
    console.log(`${c.name}: ${count}`);
    totalDeps += count;
  }
  
  console.log(`\nTotal Dependencies: ${totalDeps}`);

  await client.end();
}

check().catch(console.error);
