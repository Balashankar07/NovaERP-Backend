const { Client } = require('pg');

async function inspect() {
  const client = new Client({ connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB' });
  await client.connect();

  const realBOMs = await client.query(`
    SELECT b."Id" as bomId, b."Version", p."Name" as productName, p."SKU",
           bi."Id" as itemId, bi."Quantity", comp."Name" as compName, comp."SKU" as compSKU
    FROM "BOMs" b
    JOIN "Products" p ON b."ProductId" = p."Id"
    LEFT JOIN "BOMItems" bi ON b."Id" = bi."BOMId"
    LEFT JOIN "Products" comp ON bi."ComponentId" = comp."Id"
    WHERE p."Name" NOT LIKE 'FG-Audit%' AND p."Name" NOT LIKE 'FG With BOM'
  `);
  console.log("=== REAL BOMS & COMPONENTS IN DB ===");
  console.table(realBOMs.rows);

  const rawProducts = await client.query(`
    SELECT "Id", "SKU", "Name", "Type" FROM "Products" WHERE "Name" NOT LIKE '%Audit%' AND "Name" NOT LIKE 'FG With BOM'
  `);
  console.log("=== ALL REAL PRODUCTS ===");
  console.table(rawProducts.rows);

  await client.end();
}

inspect().catch(console.error);
