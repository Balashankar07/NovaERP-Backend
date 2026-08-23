const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB' });
  await client.connect();

  console.log("=== MASTER PURGE OF AUDIT BOMS AND PRODUCTS ===");

  // Delete BOMItems and BOMs pointing to Audit products or empty versions
  await client.query(`
    DELETE FROM "BOMItems"
    WHERE "BOMId" IN (
      SELECT b."Id" FROM "BOMs" b
      LEFT JOIN "Products" p ON b."ProductId" = p."Id"
      WHERE p."Name" LIKE '%Audit%' OR p."Name" LIKE 'FG With BOM' OR p."Name" LIKE 'RM Shortage' OR p."SKU" LIKE 'F-10%' OR p."SKU" LIKE 'C-10%' OR b."Version" = '' OR p."Id" IS NULL
    )
  `);

  await client.query(`
    DELETE FROM "BOMs"
    WHERE "Id" IN (
      SELECT b."Id" FROM "BOMs" b
      LEFT JOIN "Products" p ON b."ProductId" = p."Id"
      WHERE p."Name" LIKE '%Audit%' OR p."Name" LIKE 'FG With BOM' OR p."Name" LIKE 'RM Shortage' OR p."SKU" LIKE 'F-10%' OR p."SKU" LIKE 'C-10%' OR b."Version" = '' OR p."Id" IS NULL
    )
  `);

  // Delete audit products from Products table
  await client.query(`
    DELETE FROM "Products"
    WHERE "Name" LIKE '%Audit%' OR "Name" LIKE 'FG With BOM' OR "Name" LIKE 'RM Shortage' OR "SKU" LIKE 'F-10%' OR "SKU" LIKE 'C-10%' OR "SKU" LIKE 'FWB-%' OR "SKU" LIKE 'RS-%'
  `);

  console.log("✅ Master purge complete!");

  const boms = await client.query(`
    SELECT b."Id", b."Version", p."Name" as productName, p."SKU" as productSKU
    FROM "BOMs" b
    JOIN "Products" p ON b."ProductId" = p."Id"
  `);

  console.log("=== FINAL BOMS TABLE (Count:", boms.rows.length, ") ===");
  console.table(boms.rows);

  await client.end();
}

run().catch(console.error);
