const {Client}=require("pg");
const c=new Client({host:"localhost",port:5432,database:"NovaERPDB",user:"postgres",password:"balan123"});
async function main(){
  await c.connect();
  const prs=await c.query('SELECT "Id", "CreatedAt", "RequestDate" FROM "PurchaseRequests" LIMIT 3');
  console.log("PRs:", prs.rows);
  const pos=await c.query('SELECT "Id", "CreatedAt", "OrderDate" FROM "PurchaseOrders" LIMIT 3');
  console.log("POs:", pos.rows);
  await c.end();
}
main().catch(console.error);
