const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB' });
  await client.connect();

  const boms = await client.query(`
    SELECT b."Id", b."Version", b."IsActive", b."ProductId", p."Name" as productName, p."SKU" as productSKU
    FROM "BOMs" b
    LEFT JOIN "Products" p ON b."ProductId" = p."Id"
  `);
  
  console.log("=== ALL BOMS IN DB (Count:", boms.rows.length, ") ===");
  console.table(boms.rows);

  await client.end();
}

run().catch(console.error);
