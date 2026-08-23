const { Client } = require('pg');

async function check() {
  const client = new Client({ connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB' });
  await client.connect();

  const products = await client.query('SELECT "Id", "SKU", "Name", "Type" FROM "Products" ORDER BY "CreatedAt" DESC LIMIT 30');
  console.log("=== PRODUCTS IN DB ===");
  console.table(products.rows);

  const boms = await client.query('SELECT b."Id", b."Version", b."IsActive", p."Name" as ProductName, p."SKU" as ProductSKU FROM "BOMs" b JOIN "Products" p ON b."ProductId" = p."Id"');
  console.log("=== BOMS IN DB ===");
  console.table(boms.rows);

  await client.end();
}

check().catch(console.error);
