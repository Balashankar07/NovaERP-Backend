const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB' });
  await client.connect();

  console.log("=== Permanently deleting all FG-Audit and FG With BOM entries from BOMs and Products tables ===");

  // 1. Get BOM IDs for audit products or BOMs linked to products containing FG-Audit / FG With BOM
  const auditBoms = await client.query(`
    SELECT b."Id" FROM "BOMs" b
    LEFT JOIN "Products" p ON b."ProductId" = p."Id"
    WHERE p."Id" IS NULL OR p."Name" LIKE '%Audit%' OR p."Name" LIKE '%FG With BOM%' OR p."SKU" LIKE 'F-10%' OR p."SKU" LIKE 'FWB-%'
  `);

  const bomIds = auditBoms.rows.map(r => r.Id);
  console.log(`Found ${bomIds.length} BOM records to remove.`);

  if (bomIds.length > 0) {
    await client.query('DELETE FROM "BOMItems" WHERE "BOMId" = ANY($1)', [bomIds]);
    await client.query('DELETE FROM "BOMs" WHERE "Id" = ANY($1)', [bomIds]);
    console.log("✅ Deleted all audit BOMItems and BOMs.");
  }

  // 2. Also delete any remaining Products with FG-Audit / FG With BOM
  const auditProds = await client.query(`
    SELECT "Id" FROM "Products"
    WHERE "Name" LIKE '%Audit%' OR "Name" LIKE '%FG With BOM%' OR "SKU" LIKE 'F-10%' OR "SKU" LIKE 'FWB-%'
  `);
  const prodIds = auditProds.rows.map(r => r.Id);

  if (prodIds.length > 0) {
    await client.query('DELETE FROM "Products" WHERE "Id" = ANY($1)', [prodIds]);
    console.log("✅ Deleted all remaining audit Products.");
  }

  const cleanBOMs = await client.query(`
    SELECT b."Id", b."Version", p."Name" as productName, p."SKU" as productSKU
    FROM "BOMs" b
    JOIN "Products" p ON b."ProductId" = p."Id"
  `);

  console.log("=== REMAINING VALID BOMS IN DB:", cleanBOMs.rows.length, "===");
  console.table(cleanBOMs.rows);

  await client.end();
}

run().catch(console.error);
