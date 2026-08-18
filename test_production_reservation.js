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
  
  console.log("=== VERIFYING RESERVATION E2E ===");
  const fg = await q('SELECT "Id" FROM "Products" WHERE "Type"=1 AND "IsActive"=true AND "Id" IN (SELECT "ProductId" FROM "BOMs" WHERE "IsActive"=true) LIMIT 1');
  const wh = await q('SELECT "Id" FROM "Warehouses" WHERE "IsDefault"=true LIMIT 1');
  if(!fg.length){console.log("No finished good found");return;}
  
  const plan = await api("POST","/api/ProductionPlans",{
    productId: fg[0].Id,
    plannedQuantity: 10,
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000),
    warehouseId: wh[0].Id,
    remarks: "test plan"
  }, token);
  const planId = plan.b.data.id;
  await api("POST",`/api/ProductionPlans/${planId}/release`, null, token);
  
  const po = await api("POST","/api/ProductionOrders",{
    productionPlanId: planId,
    plannedQuantity: 5,
    plannedStartDate: new Date(),
    plannedEndDate: new Date(Date.now() + 86400000),
    remarks: "test order"
  }, token);
  if(!po.b || !po.b.data) {
    console.error("Failed to create PO:", po.b);
    process.exit(1);
  }
  const poId = po.b.data.id;
  
  // Release Order -> Creates Reservations
  const rel = await api("POST",`/api/ProductionOrders/${poId}/release`, null, token);
  console.log("Order Released:", rel.s);
  
  const res = await q('SELECT * FROM "InventoryReservations" WHERE "ProductionOrderId"=$1', [poId]);
  console.log("Reservations created:", res.length);
  
  const start = await api("POST",`/api/ProductionOrders/${poId}/start`, { startedQuantity: 5 }, token);
  console.log("Execution Started:", start.s);
  const execs = await q('SELECT "Id" FROM "ProductionExecutions" WHERE "ProductionOrderId"=$1', [poId]);
  const execId = execs[0].Id;
  
  // Consume Materials
  const consume = await api("POST",`/api/ProductionExecutions/${execId}/consume-materials`, null, token);
  console.log("Materials Consumed:", consume.s);
  
  const updatedRes = await q('SELECT "QuantityReserved", "QuantityConsumed" FROM "InventoryReservations" WHERE "ProductionOrderId"=$1', [poId]);
  console.log("Updated Reservation:", updatedRes[0]);
  
  const completeExec = await api("POST",`/api/ProductionExecutions/${execId}/complete`, { producedQuantity: 5, rejectedQuantity: 0 }, token);
  console.log("Execution Completed:", completeExec.s);
  
  const completeOrder = await api("POST",`/api/ProductionOrders/${poId}/complete`, null, token);
  console.log("Order Completed:", completeOrder.s);
  
  await c.end();
}
main().catch(console.error);
