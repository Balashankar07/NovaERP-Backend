const {Client} = require('pg'); 
async function run() { 
  const client = new Client({connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB'}); 
  await client.connect(); 
  let res = await client.query("UPDATE \"Products\" SET \"ProductCode\" = 'PRD-006', \"SKU\" = 'WH-006' WHERE \"ProductCode\" = ''"); 
  console.log('Updated rows:', res.rowCount); 
  await client.end(); 
} 
run();
