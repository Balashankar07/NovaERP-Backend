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
  
  console.log("=== VERIFYING GOODS RECEIPT REFAC ===");
  
  // Find a GRN to test, or create a mock one via DB for the test
  // It needs a PurchaseOrder, Supplier, Items...
  // Let's just pick any PO that has items.
  const poItems = await q('SELECT * FROM "PurchaseOrderItems" LIMIT 1');
  const po = await q('SELECT * FROM "PurchaseOrders" WHERE "Id"=$1', [poItems[0].PurchaseOrderId]);
  
  const grnId = '77777777-7777-7777-7777-777777777777';
  await q('INSERT INTO "GoodsReceipts" ("Id", "GRNNumber", "PurchaseOrderId", "SupplierId", "ReceiptDate", "Status", "IsActive", "CreatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    [grnId, 'GRN-TEST-1', po[0].Id, po[0].SupplierId, new Date(), 1, true, new Date()]); // Status 1 = Draft
    
  await q('INSERT INTO "GoodsReceiptItems" ("Id", "GoodsReceiptId", "PurchaseOrderItemId", "ProductId", "OrderedQuantity", "ReceivedQuantity", "RejectedQuantity", "UnitPrice", "TaxRate", "CreatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
    ['77777777-7777-7777-7777-777777777778', grnId, poItems[0].Id, poItems[0].ProductId, 10, 10, 0, 10, 0, new Date()]);
  
  console.log("Created test GRN in DB:", grnId);
  
  const rcv = await api("POST",`/api/goods-receipts/${grnId}/receive`, null, token);
  console.log("Receive Status:", rcv.s, rcv.b);
  
  const tx = await q('SELECT * FROM "InventoryTransactions" WHERE "ReferenceId"=$1', [grnId]);
  console.log("Transactions created:", tx.length);
  
  // Clean up
  await q('DELETE FROM "GoodsReceiptItems" WHERE "GoodsReceiptId"=$1', [grnId]);
  await q('DELETE FROM "GoodsReceipts" WHERE "Id"=$1', [grnId]);
  await q('DELETE FROM "InventoryTransactions" WHERE "ReferenceId"=$1', [grnId]);
  
  await c.end();
}
main().catch(console.error);
