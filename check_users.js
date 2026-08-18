const { Client } = require('pg');
async function run() {
  const client = new Client({connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB'});
  await client.connect();
  const res = await client.query('SELECT "Email" FROM "Users"');
  console.log(res.rows);
  await client.end();
}
run();
