const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB' });
  await client.connect();

  const po = await client.query('SELECT count(*) FROM "PurchaseOrders"');
  console.log('Purchase Orders count in database:', po.rows[0].count);

  await client.end();
}

run().catch(console.error);
