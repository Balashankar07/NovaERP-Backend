const {Client}=require("pg");
const c=new Client({host:"localhost",port:5432,database:"NovaERPDB",user:"postgres",password:"balan123"});

async function main(){
  await c.connect();
  const q=async(sql,p)=>(await c.query(sql,p)).rows;
  
  console.log("Fixing invalid inventory records...");
  
  // Set QuantityOnHand = QuantityAvailable where they mismatch (specifically when QtyAvail > QtyOnHand)
  const res = await q('UPDATE "Inventories" SET "QuantityOnHand" = "QuantityAvailable" WHERE "QuantityAvailable" > "QuantityOnHand" RETURNING "Id", "QuantityOnHand", "QuantityAvailable"');
  
  console.log(`Updated ${res.length} rows.`);
  console.log(res);

  const check = await q('SELECT COUNT(*) as violations FROM "Inventories" WHERE "QuantityOnHand" < 0 OR "QuantityReserved" < 0 OR "QuantityReserved" > "QuantityOnHand" OR "QuantityAvailable" != ("QuantityOnHand" - "QuantityReserved") OR "QuantityAvailable" < 0');
  
  console.log(`Remaining violations: ${check[0].violations}`);

  await c.end();
}
main().catch(console.error);
