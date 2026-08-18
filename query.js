const {Client}=require("pg");
const c=new Client({host:"localhost",port:5432,database:"NovaERPDB",user:"postgres",password:"balan123"});

async function run(){
  await c.connect();
  const res = await c.query('SELECT p."Id", p."Type", b."IsActive" FROM "Products" p JOIN "BOMs" b ON p."Id"=b."ProductId"');
  console.log(res.rows);
  await c.end();
}
run();
