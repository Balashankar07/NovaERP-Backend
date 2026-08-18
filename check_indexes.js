const { Client } = require('pg');

async function check() {
  const client = new Client({connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB'});
  await client.connect();

  const indexes = await client.query(`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'Products';
  `);
  
  indexes.rows.forEach(r => console.log(r.indexdef));
  
  await client.end();
}
check().catch(console.error);
