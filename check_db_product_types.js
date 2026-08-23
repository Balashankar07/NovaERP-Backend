const { Client } = require('pg');

async function check() {
  const client = new Client({ connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB' });
  await client.connect();

  const products = await client.query('SELECT "Id", "SKU", "Name", "Type", "IsActive" FROM "Products" ORDER BY "Name" ASC');
  console.log("=== PRODUCTS IN DATABASE ===");
  console.table(products.rows);

  await client.end();
}

check().catch(console.error);
