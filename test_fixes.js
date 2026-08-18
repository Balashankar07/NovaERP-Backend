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
  
  // Login
  const login=await api("POST","/api/Auth/login",{email:"balashankar07@gmail.com",password:"Admin@123"});
  const token=login.b.data.accessToken;
  
  console.log("=== 1. PRODUCTION RELEASE BLOCKING ===");
  // Create a disposable production plan with shortage
  // Need a product, BOM, inventory with 0
  const comp=await q('SELECT "Id" FROM "Products" WHERE "Type"=2 LIMIT 1');
  const fg=await q('SELECT "Id" FROM "Products" WHERE "Type"=1 LIMIT 1');
  
  // First let's just insert a disposable plan directly to DB
  const planId = '99999999-9999-9999-9999-999999999999';
  await q('INSERT INTO "ProductionPlans" ("Id", "PlanNumber", "ProductId", "PlannedQuantity", "PlannedStartDate", "PlannedEndDate", "Priority", "Status", "CreatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
    [planId, 'TEST-PLAN-1', fg[0].Id, 100, new Date(), new Date(), 1, 1, new Date()]); // Status 1 = Draft
  await q('INSERT INTO "ProductionRequirements" ("Id", "ProductionPlanId", "ProductId", "UnitId", "RequiredQuantity", "AvailableQuantity", "ShortageQuantity", "CreatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    ['88888888-8888-8888-8888-888888888888', planId, comp[0].Id, '00000000-0000-0000-0000-000000000000', 100, 0, 100, new Date()]);
  
  const relFail=await api("POST","/api/ProductionPlans/"+planId+"/release",null,token);
  console.log("Release w/ Shortage:", relFail.s, relFail.b);
  
  // Now update it to have no shortage
  await q('UPDATE "ProductionRequirements" SET "AvailableQuantity"=100, "ShortageQuantity"=0 WHERE "ProductionPlanId"=$1', [planId]);
  
  const relOk=await api("POST","/api/ProductionPlans/"+planId+"/release",null,token);
  console.log("Release w/o Shortage:", relOk.s, relOk.b);
  
  // Cleanup
  await q('DELETE FROM "ProductionRequirements" WHERE "ProductionPlanId"=$1', [planId]);
  await q('DELETE FROM "ProductionPlans" WHERE "Id"=$1', [planId]);
  
  console.log("\n=== 2. SUPPLIERPRODUCT COMPONENT-ONLY API ===");
  const activeSup=await q('SELECT "Id" FROM "Suppliers" WHERE "IsActive"=true LIMIT 1');
  
  const spFail=await api("POST","/api/supplier-products",{supplierId:activeSup[0].Id,productId:fg[0].Id,supplierSKU:"AUDIT-FG",unitPrice:100,moq:10,leadTimeDays:5,currency:"INR",isPreferred:false},token);
  console.log("FG SupplierProduct:", spFail.s, spFail.b);
  
  const spOk=await api("POST","/api/supplier-products",{supplierId:activeSup[0].Id,productId:comp[0].Id,supplierSKU:"AUDIT-COMP-TEST",unitPrice:100,moq:10,leadTimeDays:5,currency:"INR",isPreferred:false},token);
  console.log("Comp SupplierProduct:", spOk.s, spOk.b);
  
  if(spOk.b && spOk.b.data && spOk.b.data.id) {
    await q('DELETE FROM "SupplierProducts" WHERE "Id"=$1', [spOk.b.data.id]);
  }
  
  console.log("\n=== 3. CREATEDAT DTO MAPPING ===");
  const dash=await api("GET","/api/Reports/procurement",null,token);
  const requests=dash.b.data.recentRequests;
  const orders=dash.b.data.recentOrders;
  console.log("Recent Requests CreatedAt:", requests.map(r=>r.createdAt));
  console.log("Recent Orders CreatedAt:", orders.map(r=>r.createdAt));
  
  await c.end();
}
main().catch(console.error);
