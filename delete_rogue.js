const { Client } = require('pg');

async function run() {
  const client = new Client({connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB'});
  await client.connect();

  console.log("Deleting rogue record...");
  const res = await client.query(`DELETE FROM "Products" WHERE "ProductCode" = 'PRD-006' RETURNING "Id", "ProductNumber"`);
  
  if (res.rowCount > 0) {
    console.log(`Deleted ID: ${res.rows[0].Id} | ProductNumber: ${res.rows[0].ProductNumber}`);
  } else {
    console.log("No record found to delete.");
  }

  const seqs = await client.query(`
    SELECT sequencename, last_value 
    FROM pg_sequences 
    WHERE sequencename IN ('ProductNumberSeq', 'ProductCodeSeq', 'SkuSeq', 'BarcodeSeq')
    ORDER BY sequencename;
  `);

  console.log("\nSequence State After Deletion (last_value):");
  seqs.rows.forEach(r => console.log(JSON.stringify(r)));

  await client.end();
}

run().catch(console.error);
