const {Client}=require("pg");
const c=new Client({host:"localhost",port:5432,database:"NovaERPDB",user:"postgres",password:"balan123"});
async function main(){
  await c.connect();
  const q=async(sql,p)=>(await c.query(sql,p)).rows;
  const planId = '99999999-9999-9999-9999-999999999999';
  await q('DELETE FROM "ProductionRequirements" WHERE "ProductionPlanId"=$1', [planId]).catch(e=>console.log(e.message));
  await q('DELETE FROM "ProductionPlans" WHERE "Id"=$1', [planId]).catch(e=>console.log(e.message));
  await c.end();
}
main().catch(console.error);
