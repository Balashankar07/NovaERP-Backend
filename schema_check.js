const {Client}=require("pg");
const c=new Client({host:"localhost",port:5432,database:"NovaERPDB",user:"postgres",password:"balan123"});
async function main(){
  await c.connect();
  const q=async(sql)=>(await c.query(sql)).rows;
  console.log("PR_STATUSES:"); (await q('SELECT DISTINCT "Status" FROM "PurchaseRequests" ORDER BY "Status"')).forEach(r=>console.log(" "+r.Status));
  console.log("PO_STATUSES:"); (await q('SELECT DISTINCT "Status" FROM "PurchaseOrders" ORDER BY "Status"')).forEach(r=>console.log(" "+r.Status));
  console.log("PP_STATUSES:"); (await q('SELECT DISTINCT "Status" FROM "ProductionPlans" ORDER BY "Status"')).forEach(r=>console.log(" "+r.Status));
  console.log("PRODUCT_TYPES:"); (await q('SELECT DISTINCT "Type" FROM "Products" ORDER BY "Type"')).forEach(r=>console.log(" "+r.Type));
  console.log("SAMPLE_BOMITEMS:"); (await q('SELECT "BomId","RawMaterialProductId","Quantity" FROM "BOMItems" LIMIT 3')).forEach(r=>console.log(" "+JSON.stringify(r)));
  console.log("PROD_REQ_SAMPLE:"); (await q('SELECT "ProductionPlanId","ProductId","RequiredQuantity","AvailableQuantity","ShortageQuantity" FROM "ProductionRequirements" LIMIT 3')).forEach(r=>console.log(" "+JSON.stringify(r)));
  console.log("INV_SAMPLE:"); (await q('SELECT "ProductId","QuantityOnHand","QuantityAvailable","QuantityReserved" FROM "Inventories" LIMIT 3')).forEach(r=>console.log(" "+JSON.stringify(r)));
  console.log("GR_SAMPLE:"); (await q('SELECT "Id","GRNNumber","PurchaseOrderId","Status" FROM "GoodsReceipts" LIMIT 3')).forEach(r=>console.log(" "+JSON.stringify(r)));
  console.log("PR_SOURCES:"); (await q('SELECT DISTINCT "Source" FROM "PurchaseRequests"')).forEach(r=>console.log(" "+r.Source));
  console.log("PROCUREMENT_API_RESPONSE_KEY:"); (await q('SELECT "Status",COUNT(*) c FROM "PurchaseRequests" GROUP BY "Status"')).forEach(r=>console.log("  PR_"+r.Status+": "+r.c));
  await c.end();
}
main().catch(e=>{console.error("ERR:"+e.message);process.exit(1)});
