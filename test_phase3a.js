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
  
  console.log("=== 1. VERIFYING GOODS RECEIPT REFAC ===");
  const prod = await q('SELECT "Id" FROM "Products" WHERE "IsActive"=true LIMIT 1');
  const sup = await q('SELECT "Id" FROM "Suppliers" WHERE "IsActive"=true LIMIT 1');
  const wh = await q('SELECT "Id" FROM "Warehouses" WHERE "IsDefault"=true LIMIT 1');
  const unit = await q('SELECT "Id" FROM "Units" LIMIT 1');

  const pr = await api("POST","/api/purchase-requests",{
    requestDate: new Date(),
    requiredByDate: new Date(Date.now() + 86400000),
    department: "Test",
    priority: 1,
    remarks: "Test PR",
    items: [{productId: prod[0].Id, requestedQuantity: 10, unitId: unit[0].Id}]
  }, token);
  
  if (pr.s !== 200 && pr.s !== 201) { console.log("PR fail:", pr.b); return; }
  const prId = pr.b.data.id;
  await api("POST",`/api/purchase-requests/${prId}/submit`, {}, token);
  await api("POST",`/api/purchase-requests/${prId}/approve`, {remarks:"ok"}, token);
  
  const po = await api("POST","/api/PurchaseOrders",{
    purchaseRequestId: prId,
    supplierId: sup[0].Id,
    orderDate: new Date(),
    expectedDeliveryDate: new Date(Date.now() + 86400000),
    shippingTerms: "FOB",
    paymentTerms: "Net30",
    items: [{productId: prod[0].Id, quantity: 10, unitPrice: 10, taxRate: 0}]
  }, token);
  const poId = po.b.data.id;
  await api("POST",`/api/PurchaseOrders/${poId}/submit`, {}, token);
  await api("POST",`/api/PurchaseOrders/${poId}/approve`, {remarks:"ok"}, token);
  
  const grn = await api("POST","/api/GoodsReceipts",{
    purchaseOrderId: poId,
    warehouseId: wh[0].Id,
    items: [{purchaseOrderItemId: po.b.data.items[0].id, receivedQuantity: 10, rejectedQuantity: 0, remarks:"ok"}]
  }, token);
  
  const grnId = grn.b.data.id;
  console.log("Created GRN:", grnId);
  
  const rcv = await api("POST",`/api/GoodsReceipts/${grnId}/receive`, null, token);
  console.log("Receive Status:", rcv.s);
  
  const inv = await q('SELECT * FROM "Inventories" WHERE "ProductId"=$1 AND "WarehouseId"=$2', [prod[0].Id, wh[0].Id]);
  console.log("Inventory Qty:", inv[0]?.QuantityOnHand);
  
  const tx = await q('SELECT * FROM "InventoryTransactions" WHERE "ReferenceId"=$1', [grnId]);
  console.log("Transactions created:", tx.length);
  
  await c.end();
}
main().catch(console.error);
