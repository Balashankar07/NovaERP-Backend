const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB' });
  await client.connect();

  const products = await client.query('SELECT "Id", "SKU", "Name", "Type", "Category" FROM "Products" ORDER BY "Name" ASC');
  console.log("=== TOTAL PRODUCTS IN DB:", products.rows.length, "===");
  console.table(products.rows);

  await client.end();
}

run().catch(console.error);
