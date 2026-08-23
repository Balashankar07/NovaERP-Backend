const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB' });
  await client.connect();

  console.log("=== Deleting all BOMs associated with Audit, FG With BOM, or missing products ===");

  // Find BOM IDs to delete
  const bomsToDelete = await client.query(`
    SELECT b."Id", p."Name"
    FROM "BOMs" b
    LEFT JOIN "Products" p ON b."ProductId" = p."Id"
    WHERE p."Id" IS NULL OR p."Name" LIKE '%Audit%' OR p."Name" LIKE 'FG With BOM' OR p."SKU" LIKE 'F-10%' OR p."SKU" LIKE 'FWB-%'
  `);

  const bomIds = bomsToDelete.rows.map(r => r.Id);
  console.log(`Found ${bomIds.length} BOMs to delete.`);

  if (bomIds.length > 0) {
    await client.query('DELETE FROM "BOMItems" WHERE "BOMId" = ANY($1)', [bomIds]);
    await client.query('DELETE FROM "BOMs" WHERE "Id" = ANY($1)', [bomIds]);
    console.log(`✅ Successfully deleted ${bomIds.length} audit BOMs and their BOMItems!`);
  }

  // Verify remaining BOMs
  const remaining = await client.query(`
    SELECT b."Id", b."Version", b."IsActive", p."Name" as productName, p."SKU" as productSKU
    FROM "BOMs" b
    JOIN "Products" p ON b."ProductId" = p."Id"
  `);

  console.log("=== REMAINING VALID BOMS IN DB:", remaining.rows.length, "===");
  console.table(remaining.rows);

  await client.end();
}

run().catch(console.error);
