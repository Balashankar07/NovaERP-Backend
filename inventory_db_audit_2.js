const {Client}=require("pg");
const c=new Client({host:"localhost",port:5432,database:"NovaERPDB",user:"postgres",password:"balan123"});

async function main(){
  await c.connect();
  const q=async(sql,p)=>(await c.query(sql,p)).rows;
  
  const badRecs = await q('SELECT "ProductId", "QuantityOnHand", "QuantityReserved", "QuantityAvailable" FROM "Inventories" WHERE "QuantityAvailable" > "QuantityOnHand"');
  console.log(badRecs);
  await c.end();
}
main().catch(console.error);
