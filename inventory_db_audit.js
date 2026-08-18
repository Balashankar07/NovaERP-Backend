const {Client}=require("pg");
const c=new Client({host:"localhost",port:5432,database:"NovaERPDB",user:"postgres",password:"balan123"});

async function main(){
  await c.connect();
  const q=async(sql,p)=>(await c.query(sql,p)).rows;
  
  console.log("=== DB COUNTS ===");
  const counts = await q(`
    SELECT
      (SELECT COUNT(*) FROM "Inventories") as inv_count,
      (SELECT COUNT(*) FROM "Warehouses") as wh_count,
      (SELECT COUNT(*) FROM "WarehouseLocations") as loc_count,
      (SELECT COUNT(*) FROM "InventoryTransactions") as txn_count
  `);
  console.log(counts[0]);

  console.log("=== DATA INTEGRITY ===");
  const negQty = await q('SELECT COUNT(*) as c FROM "Inventories" WHERE "QuantityOnHand" < 0');
  const qtyViolations = await q('SELECT COUNT(*) as c FROM "Inventories" WHERE "QuantityAvailable" > "QuantityOnHand"');
  const resViolations = await q('SELECT COUNT(*) as c FROM "Inventories" WHERE "QuantityReserved" > "QuantityOnHand"');
  const orphanInv = await q('SELECT COUNT(*) as c FROM "Inventories" WHERE "ProductId" NOT IN (SELECT "Id" FROM "Products")');
  console.log({
    negQty: negQty[0].c,
    qtyViolations: qtyViolations[0].c,
    resViolations: resViolations[0].c,
    orphanInv: orphanInv[0].c
  });
  
  const tables = await q(`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`);
  console.log("=== TABLES ===");
  const tabNames = tables.map(t=>t.table_name);
  console.log("StockTransfer:", tabNames.includes("StockTransfers"));
  console.log("InventoryAdjustment:", tabNames.includes("InventoryAdjustments"));
  console.log("Batch:", tabNames.includes("Batches"));
  console.log("SerialNumber:", tabNames.includes("SerialNumbers"));
  
  await c.end();
}
main().catch(console.error);
