const { Client } = require('pg');
async function run() {
  const c = new Client({connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB'});
  await c.connect();
  const res = await c.query('SELECT b."Id", b."Version", p."Name" as productName FROM "BOMs" b JOIN "Products" p ON b."ProductId" = p."Id"');
  console.table(res.rows);
  await c.end();
}
run();
