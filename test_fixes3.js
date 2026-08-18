const {Client}=require("pg");
const c=new Client({host:"localhost",port:5432,database:"NovaERPDB",user:"postgres",password:"balan123"});
const http=require("http");

function api(method,path,body,token){
  return new Promise(resolve=>{
    const bodyStr=body?JSON.stringify(body):null;
    const headers={"Content-Type":"application/json"};
    if(token)headers["Authorization"]="Bearer "+token;
    if(bodyStr)headers["Content-Length"]=Buffer.byteLength(bodyStr);
    const opt={hostname:"localhost",port:5233,path:path,method,headers};
    const req=http.request(opt,r=>{let d="";r.on("data",x=>d+=x);r.on("end",()=>{try{resolve({s:r.statusCode,b:JSON.parse(d)})}catch{resolve({s:r.statusCode,b:d})}});});
    req.on("error",e=>resolve({s:0,err:e.message}));
    if(bodyStr)req.write(bodyStr);
    req.end();
  });
}

async function main(){
  await c.connect();
  const q=async(sql,p)=>(await c.query(sql,p)).rows;
  const login=await api("POST","/api/Auth/login",{email:"balashankar07@gmail.com",password:"Admin@123"});
  const token=login.b.data.accessToken;
  const unit = await q('SELECT "Id" FROM "Units" LIMIT 1');
  const comp=await q('SELECT "Id" FROM "Products" WHERE "Type"=2 LIMIT 1');
  const fg=await q('SELECT "Id" FROM "Products" WHERE "Type"=1 LIMIT 1');
  
  console.log("=== 1. PRODUCTION RELEASE BLOCKING ===");
  const planId = '99999999-9999-9999-9999-999999999999';
  await q('INSERT INTO "ProductionPlans" ("Id", "PlanNumber", "ProductId", "PlannedQuantity", "PlannedStartDate", "PlannedEndDate", "Priority", "Status", "CreatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
    [planId, 'TEST-PLAN-1', fg[0].Id, 100, new Date(), new Date(), 1, 1, new Date()]);
  await q('INSERT INTO "ProductionRequirements" ("Id", "ProductionPlanId", "ProductId", "UnitId", "RequiredQuantity", "AvailableQuantity", "ShortageQuantity", "CreatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    ['88888888-8888-8888-8888-888888888888', planId, comp[0].Id, unit[0].Id, 100, 0, 100, new Date()]);
  
  // Ensure inventory is 0
  await q('UPDATE "Inventories" SET "QuantityAvailable"=0 WHERE "ProductId"=$1', [comp[0].Id]);
  
  const relFail=await api("POST","/api/ProductionPlans/"+planId+"/release",null,token);
  console.log("Release w/ Shortage:", relFail.s, relFail.b);
  
  // Set inventory to 1000
  await q('UPDATE "Inventories" SET "QuantityAvailable"=1000 WHERE "ProductId"=$1', [comp[0].Id]);
  
  const relOk=await api("POST","/api/ProductionPlans/"+planId+"/release",null,token);
  console.log("Release w/o Shortage:", relOk.s, relOk.b);
  
  // Cleanup
  await q('UPDATE "Inventories" SET "QuantityAvailable"=0 WHERE "ProductId"=$1', [comp[0].Id]);
  
  const planCheck=await q('SELECT "Status" FROM "ProductionPlans" WHERE "Id"=$1', [planId]);
  console.log("Final Plan Status:", planCheck[0].Status);
  
  // Reset
  await q('DELETE FROM "ProductionRequirements" WHERE "ProductionPlanId"=$1', [planId]);
  await q('DELETE FROM "ProductionPlans" WHERE "Id"=$1', [planId]);
  
  await c.end();
}
main().catch(console.error);
