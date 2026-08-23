const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB' });
  await client.connect();

  console.log("=== Deleting all BOMs linked to audit / test products ===");

  // Find BOM IDs of audit products or orphaned products
  const bomRes = await client.query(`
    SELECT b."Id" FROM "BOMs" b
    LEFT JOIN "Products" p ON b."ProductId" = p."Id"
    WHERE p."Id" IS NULL 
       OR p."Name" LIKE '%Audit%' 
       OR p."Name" LIKE 'FG With BOM' 
       OR p."SKU" LIKE 'F-10%' 
       OR p."SKU" LIKE 'FWB-%'
  `);

  const bomIds = bomRes.rows.map(r => r.Id);
  console.log(`Found ${bomIds.length} BOMs to delete.`);

  if (bomIds.length > 0) {
    await client.query('DELETE FROM "BOMItems" WHERE "BOMId" = ANY($1)', [bomIds]);
    await client.query('DELETE FROM "BOMs" WHERE "Id" = ANY($1)', [bomIds]);
    console.log("✅ Successfully deleted all audit BOMs and BOM items!");
  }

  // Also delete any remaining Products with audit names
  const prodRes = await client.query(`
    SELECT "Id" FROM "Products" 
    WHERE "Name" LIKE '%Audit%' OR "Name" LIKE 'FG With BOM' OR "SKU" LIKE 'F-10%' OR "SKU" LIKE 'FWB-%'
  `);
  const prodIds = prodRes.rows.map(r => r.Id);
  if (prodIds.length > 0) {
    await client.query('DELETE FROM "Products" WHERE "Id" = ANY($1)', [prodIds]);
    console.log(`✅ Deleted ${prodIds.length} leftover audit products.`);
  }

  const remaining = await client.query(`
    SELECT b."Id", b."Version", p."Name" as productName, p."SKU" as productSKU
    FROM "BOMs" b
    JOIN "Products" p ON b."ProductId" = p."Id"
  `);

  console.log("=== REMAINING BOMs IN DB:", remaining.rows.length, "===");
  console.table(remaining.rows);

  await client.end();
}

run().catch(console.error);
