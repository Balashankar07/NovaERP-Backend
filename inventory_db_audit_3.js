const {Client}=require("pg");
const c=new Client({host:"localhost",port:5432,database:"NovaERPDB",user:"postgres",password:"balan123"});

async function main(){
  await c.connect();
  const q=async(sql,p)=>(await c.query(sql,p)).rows;
  
  const perms = await q('SELECT "Name" FROM "Permissions" WHERE "Name" LIKE \'%Inventory%\' OR "Name" LIKE \'%Warehouse%\' ORDER BY "Name"');
  console.log(perms);
  await c.end();
}
main().catch(console.error);
